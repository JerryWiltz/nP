// Modified: 2026-10-03
import test from 'node:test';
import assert from 'node:assert/strict';

import {global} from '../src/np-global/index.js';
import {complex} from '../src/np-math/src/complex.js';
import {Amp, Attn, cascade, nodal} from '../src/np-nport/index.js';
import {nPort} from '../src/np-nport/src/nPort.js';
import {analysisFrequencies} from '../src/np-nport/src/intermod.js';

function close(actual, expected, tolerance = 1e-9) {
	assert.ok(Math.abs(actual - expected) <= tolerance,
		`${actual} differs from ${expected}`);
}

function withTwoTone(fList, twoTone, action) {
	var previous = {fList: global.fList, twoTone: global.twoTone, Ro: global.Ro, Temp: global.Temp};
	global.fList = fList;
	global.twoTone = twoTone;
	global.Ro = 50;
	global.Temp = 290;
	try { return action(); }
	finally {
		global.fList = previous.fList;
		global.twoTone = previous.twoTone;
		global.Ro = previous.Ro;
		global.Temp = previous.Temp;
	}
}

test('Amp and Attn create the six frequency rows, with one displayed sweep row', () => {
	withTwoTone([1e9], {spacingHz: 1e8, p1dBm: -30, p2dBm: -25}, () => {
		var amp = Amp({gainDb: 20, oip2dBm: 42, oip3dBm: 30});
		var attenuator = Attn(3);
		assert.deepEqual(amp.spars.map(row => row[0]),
			[1e8, 9e8, 1e9, 1.1e9, 1.2e9, 2.1e9]);
		assert.deepEqual(attenuator.spars.map(row => row[0]), amp.spars.map(row => row[0]));
		assert.equal(amp.out('s21dB').length, 2);
		assert.equal(amp.out('IM3lower21dBm').length, 2);
		assert.throws(() => Amp({oip3dBm: NaN}), /finite dBm/);
		assert.throws(() => Amp({spars: [
			amp.spars[0][1].add(amp.spars[0][3]), amp.spars[0][2],
			amp.spars[0][3], amp.spars[0][4]
		], oip3dBm: 30}), /matched, unilateral/);
	});
});

test('one-pass IM and OIP show Amp/Attn ordering and nodal/cascade agreement', () => {
	withTwoTone([1e9], {spacingHz: 1e8, p1dBm: -30, p2dBm: -25}, () => {
		var amp = Amp({gainDb: 20, noiseFigureDb: 4, oip2dBm: 42, oip3dBm: 30});
		var attenuator = Attn(3, 290);
		var ampAttn = nodal(
			[amp, 1, 2],
			[attenuator, 2, 3],
			['out', 1, 3]
		);
		var attnAmp = nodal(
			[attenuator, 1, 2],
			[amp, 2, 3],
			['out', 1, 3]
		);
		var selectors = ['s21dB', 'NF21dB', 'IM2sum21dBm', 'IM3lower21dBm',
			'IM3upper21dBm', 'OIP2sum21dBm', 'OIP3lower21dBm'];
		var first = ampAttn.out(...selectors)[1];
		var second = attnAmp.out(...selectors)[1];
		close(first[1], 17);
		close(second[1], 17);
		assert.ok(first[2] < second[2]);
		close(first[3] - second[3], 3);
		close(first[4] - second[4], 6);
		close(first[5] - second[5], 6);
		close(first[6], 39);
		close(second[6], 42);
		close(first[7], 27);
		close(second[7], 30);
		for (var [nodalResult, cascadeResult] of [[ampAttn, cascade(amp, attenuator)],
			[attnAmp, cascade(attenuator, amp)]]) {
			var a = nodalResult.out(...selectors)[1];
			var b = cascadeResult.out(...selectors)[1];
			for (var i = 1; i < a.length; i++) close(a[i], b[i]);
		}
	});
});

test('nested nodal and cascade retain both nonlinear amplifier sources', () => {
	withTwoTone([1e9], {spacingHz: 1e8, p1dBm: -70, p2dBm: -67,
		phase1Deg: 15, phase2Deg: 45}, () => {
		var firstAmp = Amp({gainDb: 20, oip2dBm: 42, oip3dBm: 30});
		var secondAmp = Amp({gainDb: 12, oip2dBm: 45, oip3dBm: 32});
		var firstAttn = Attn(3);
		var secondAttn = Attn(2);
		var direct = nodal(
			[firstAmp, 1, 2],
			[firstAttn, 2, 3],
			[secondAmp, 3, 4],
			[secondAttn, 4, 5],
			['out', 1, 5]
		);
		var firstBlock = nodal(
			[firstAmp, 1, 2],
			[firstAttn, 2, 3],
			['out', 1, 3]
		);
		var secondBlock = nodal(
			[secondAmp, 1, 2],
			[secondAttn, 2, 3],
			['out', 1, 3]
		);
		var nested = nodal(
			[firstBlock, 1, 2],
			[secondBlock, 2, 3],
			['out', 1, 3]
		);
		var viaCascade = cascade(cascade(firstAmp, firstAttn),
			cascade(secondAmp, secondAttn));
		var selectors = ['s21dB', 'IM2diff21dBm', 'IM2sum21dBm',
			'IM3lower21dBm', 'IM3upper21dBm'];
		var expected = direct.out(...selectors)[1];
		for (var network of [nested, viaCascade]) {
			var actual = network.out(...selectors)[1];
			for (var i = 1; i < actual.length; i++) close(actual[i], expected[i]);
		}
	});
});

test('product propagation uses frequency-dependent complex S and reflections', () => {
	withTwoTone([1e9], {spacingHz: 1e8, p1dBm: -40, p2dBm: -38}, () => {
		var amp = Amp({gainDb: 20, oip2dBm: 42, oip3dBm: 30});
		var filter = new nPort();
		filter.setspars(analysisFrequencies(global).map(function (frequency) {
			var magnitude = frequency > 1.5e9 ? 0.25 : 0.8;
			var phase = (frequency - 1e9) / 1e8;
			var transmission = complex(magnitude * Math.cos(phase), magnitude * Math.sin(phase));
			return [frequency, complex(0.1, 0), transmission, transmission, complex(0.2, 0)];
		}));
		filter.setglobal(global);
		var attenuator = Attn(3);
		var direct = nodal(
			[amp, 1, 2],
			[filter, 2, 3],
			[attenuator, 3, 4],
			['out', 1, 4]
		);
		var firstBlock = nodal(
			[amp, 1, 2],
			[filter, 2, 3],
			['out', 1, 3]
		);
		var nested = nodal(
			[firstBlock, 1, 2],
			[attenuator, 2, 3],
			['out', 1, 3]
		);
		var selectors = ['s21dB', 'IM2sum21dBm', 'IM3lower21dBm'];
		var expected = direct.out(...selectors)[1];
		for (var network of [nested, cascade(amp, filter, attenuator)]) {
			var actual = network.out(...selectors)[1];
			for (var i = 1; i < actual.length; i++) close(actual[i], expected[i]);
		}
		var flatFilter = new nPort();
		flatFilter.setspars(analysisFrequencies(global).map(function (frequency) {
			var phase = (frequency - 1e9) / 1e8;
			var transmission = complex(0.8 * Math.cos(phase), 0.8 * Math.sin(phase));
			return [frequency, complex(0.1, 0), transmission, transmission, complex(0.2, 0)];
		}));
		flatFilter.setglobal(global);
		var baselineIm2 = cascade(amp, flatFilter, attenuator).out('IM2sum21dBm')[1][1];
		close(expected[2] - baselineIm2, 20 * Math.log10(0.25 / 0.8));
	});
});

test('product waves add and cancel coherently; omitted intercepts generate zero waves', () => {
	withTwoTone([1e9], {spacingHz: 1e8, p1dBm: -30, p2dBm: -30}, () => {
		var first = Amp({gainDb: 0, oip3dBm: 30});
		var inPhase = Amp({gainDb: 0, oip3dBm: 30});
		var reversed = Amp({gainDb: 0, oip3dBm: 30, im3PhaseDeg: 180});
		var single = first.out('IM3lower21dBm')[1][1];
		var reinforced = cascade(first, inPhase).out('IM3lower21dBm')[1][1];
		var cancelled = cascade(first, reversed).out('IM3lower21dBm')[1][1];
		close(reinforced - single, 20 * Math.log10(2));
		assert.ok(cancelled < single - 200);
		var linear = Amp();
		assert.equal(linear.out('IM2sum21dBm', 'IM3lower21dBm')[1][1], -Infinity);
		assert.equal(linear.out('IM2sum21dBm', 'IM3lower21dBm')[1][2], -Infinity);
		assert.equal(linear.out('OIP3lower21dBm')[1][1], Infinity);
	});
});

test('a sweep keeps display points, and coincident products combine at one frequency', () => {
	withTwoTone([1e9, 2e9], {spacingHz: 1e6, p1dBm: -30, p2dBm: -30}, () => {
		var amp = Amp({oip2dBm: 42, oip3dBm: 30});
		assert.equal(amp.out('s21dB', 'IM3lower21dBm').length, 3);
	});
	withTwoTone([1e9], {spacingHz: 1e9, p1dBm: -30, p2dBm: -30}, () => {
		var amp = Amp({oip2dBm: 42, oip3dBm: 30});
		var row = amp.out('IM2sum21dBm', 'IM3upper21dBm', 'IM3lower21dBm')[1];
		close(row[1], row[2]);
		assert.ok(Number.isNaN(row[3]));
		assert.throws(() => amp.out('OIP2sum21dBm'), /coincide/);
	});
});
