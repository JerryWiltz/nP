// Modified: 2026-10-21
import test from 'node:test';
import assert from 'node:assert/strict';

import {global} from '../src/np-global/index.js';
import {mod, demod} from '../src/np-digital/index.js';
import {Coupler180, Tlin, Short, Open, Load, Thru, nodal, cascade} from '../src/np-nport/index.js';
import {C0} from '../src/np-nport/src/physicalConstants.js';

test('VNA mode creates a uniform unit-reference grid and reconstructs an impulse', () => {
	var g = global();
	g.tList = g.tGen(0, 31 / 8e6, 32);
	g.fList = [];
	var tx = mod({mode: 'VNA'});
	assert.equal(tx.out('frequency count'), 17);
	assert.deepEqual(g.fList, tx.out('frequencies'));
	assert.equal(g.fList[16], 4e6);
	assert.equal(tx.out('spectrum')[0].getR(), 1);
	assert.equal(tx.out('spectrum')[16].getR(), 0);
	assert.equal(tx.samplesPerBit, undefined);
	var through = cascade(Thru(), {signal: tx});
	var waveform = demod(through, {noise: false}).out('waveform');
	var direct = demod(tx, {noise: false}).out('waveform');
	assert.ok(waveform[1][1] > 0.9);
	assert.ok(Math.abs(waveform[2][1]) < 0.04);
	assert.equal(waveform.length, 33);
	assert.deepEqual(direct, waveform);

	var explicit = [];
	var second = mod({mode: 'VNA', fftList: explicit});
	assert.deepEqual(explicit, second.fList);
	assert.throws(function () { mod({mode: 'VNA', carrierHz: 1e6}); }, TypeError);
	assert.throws(function () { mod({mode: 'VNA', fftList: {}}); }, TypeError);
	g.tList = g.tGen(0, 30 / 8e6, 31);
	assert.throws(function () { mod({mode: 'VNA'}); }, /power-of-two/);
});

test('VNA sweep gives opposite-polarity returns for shorted and open 1 km lines', () => {
	var g = global();
	var count = 1024;
	var sampleRateHz = 62.5e6;
	g.tList = g.tGen(0, (count - 1) / sampleRateHz, count);
	g.fList = [];
	var tx = mod({mode: 'VNA'});
	var coupler = Coupler180();
	var line = Tlin(50, 1000);
	var short = Short();
	var load = Load();
	var circuit = nodal(
		[coupler, 1, 2, 3, 4],
		[line, 2, 5],
		[short, 5],
		[load, 4],
		['out', 1, 3],
		{signal: tx, inputPort: 1}
	);
	var waveform = demod(circuit, {noise: false}).out('waveform');
	var peak = 1;
	for (var i = 2; i < waveform.length; i++) {
		if (Math.abs(waveform[i][1]) > Math.abs(waveform[peak][1])) peak = i;
	}
	var expectedDelayNs = 2 * 1000 / C0 * 1e9;
	assert.ok(Math.abs(waveform[peak][0] - expectedDelayNs) < 1e9 / sampleRateHz);
	assert.ok(waveform[peak][1] < -0.35);
	assert.ok(Math.abs(waveform[1][1]) < 0.01);

	var openCircuit = nodal(
		[coupler, 1, 2, 3, 4],
		[line, 2, 5],
		[Open(), 5],
		[load, 4],
		['out', 1, 3],
		{signal: tx, inputPort: 1}
	);
	var openWaveform = demod(openCircuit, {noise: false}).out('waveform');
	var openPeak = 1;
	for (var j = 2; j < openWaveform.length; j++) {
		if (Math.abs(openWaveform[j][1]) > Math.abs(openWaveform[openPeak][1])) openPeak = j;
	}
	assert.equal(openPeak, peak);
	assert.ok(openWaveform[openPeak][1] > 0.35);
	assert.ok(Math.abs(openWaveform[1][1]) < 0.01);
	assert.ok(Math.abs(openWaveform[openPeak][1] + waveform[peak][1]) < 1e-9);
});
