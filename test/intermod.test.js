// Modified: 2026-10-04
import test from 'node:test';
import assert from 'node:assert/strict';

import {global} from '../src/np-global/index.js';
import {complex} from '../src/np-math/src/complex.js';
import {Amp, Attn, cascade, nodal} from '../src/np-nport/index.js';
import {nPort} from '../src/np-nport/src/nPort.js';
import {analysisFrequencies} from '../src/np-nport/src/intermod.js';
import {passiveNoiseCovariance} from '../src/np-nport/src/mlin/noise.js';
import * as nP from '../src/index.js';

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

test('Amp and Attn create harmonic frequency rows, with one displayed sweep row', () => {
	withTwoTone([1e9], {spacingHz: 1e8, p1dBm: -30, p2dBm: -25}, () => {
		var amp = Amp({gainDb: 20, oip2dBm: 42, oip3dBm: 30});
		var attenuator = Attn(3);
		assert.deepEqual(amp.spars.map(row => row[0]),
			[1e8, 9e8, 1e9, 1.1e9, 1.2e9, 2e9, 2.1e9, 2.2e9]);
		assert.deepEqual(attenuator.spars.map(row => row[0]), amp.spars.map(row => row[0]));
		assert.equal(amp.out('s21dB').length, 2);
		assert.equal(amp.out('IM3lower21dBm').length, 2);
		assert.throws(() => Amp({oip3dBm: NaN}), /finite dBm/);
		assert.throws(() => Amp({harmonicOip2dBm: NaN}), /finite dBm/);
		assert.throws(() => Amp({spars: [
			amp.spars[0][1].add(amp.spars[0][3]), amp.spars[0][2],
			amp.spars[0][3], amp.spars[0][4]
		], oip3dBm: 30}), /matched, unilateral/);
	});
});

test('second harmonics use independent intercepts and propagate through nodal and cascade', () => {
	withTwoTone([1e9], {spacingHz: 1e6, p1dBm: -30, p2dBm: -25}, () => {
		var amp = Amp({gainDb: 20, harmonicOip2dBm: 40});
		var attenuator = Attn(3);
		var ampFirst = nodal(
			[amp, 1, 2],
			[attenuator, 2, 3],
			['out', 1, 3]
		);
		var attenuatorFirst = nodal(
			[attenuator, 1, 2],
			[amp, 2, 3],
			['out', 1, 3]
		);
		var selectors = ['H2f121dBm', 'H2f221dBm', 'OIP2f121dBm', 'OIP2f221dBm'];
		var first = ampFirst.out(...selectors)[1];
		var second = attenuatorFirst.out(...selectors)[1];
		close(first[1], -63);
		close(first[2], -53);
		close(first[3], 37);
		close(first[4], 37);
		close(second[1], -66);
		close(second[2], -56);
		close(second[3], 40);
		close(second[4], 40);
		for (var [network, equivalent] of [[ampFirst, cascade(amp, attenuator)],
			[attenuatorFirst, cascade(attenuator, amp)]]) {
			var actual = network.out(...selectors)[1];
			var expected = equivalent.out(...selectors)[1];
			for (var i = 1; i < actual.length; i++) close(actual[i], expected[i]);
		}
		assert.equal(Amp({oip2dBm: 40}).out('H2f121dBm')[1][1], -Infinity);
		assert.equal(Amp({harmonicOip2dBm: 40}).out('IM2sum21dBm')[1][1], -Infinity);
	});
});

test('harmonic sweep keeps experiments separate even when absolute frequencies overlap', () => {
	var fList = Array.from({length: 11}, (_, index) => 1e9 + index * 1e8);
	withTwoTone(fList, {spacingHz: 1e6, p1dBm: -30, p2dBm: -25}, () => {
		var amp = Amp({gainDb: 20, harmonicOip2dBm: 40});
		var chain = cascade(amp, Attn(3));
		assert.equal(amp.spars.length, 75);
		assert.equal(chain.spars.length, 75);
		var rows = chain.out('H2f121dBm', 'H2f221dBm', 'OIP2f121dBm');
		assert.equal(rows.length, 12);
		rows.slice(1).forEach(function (row, index) {
			close(row[0], fList[index]);
			close(row[1], -63);
			close(row[2], -53);
			close(row[3], 37);
		});
		assert.equal(chain.out('H2f1(2,1)dBm')[1][1], -63);
	});
});

test('second-harmonic phase and frequency-dependent loss affect the propagated wave', () => {
	withTwoTone([1e9], {spacingHz: 1e6, p1dBm: -30, p2dBm: -30}, () => {
		var first = Amp({gainDb: 0, harmonicOip2dBm: 30});
		var inPhase = Amp({gainDb: 0, harmonicOip2dBm: 30});
		var reversed = Amp({gainDb: 0, harmonicOip2dBm: 30, harmonic2PhaseDeg: 180});
		var single = first.out('H2f121dBm')[1][1];
		close(cascade(first, inPhase).out('H2f121dBm')[1][1] - single,
			20 * Math.log10(2));
		assert.ok(cascade(first, reversed).out('H2f121dBm')[1][1] < single - 200);
		var filter = new nPort();
		filter.setspars(analysisFrequencies(global).map(function (frequency) {
			var transmission = frequency >= 2e9 ? 0.25 : 1;
			return [frequency, complex(0, 0), complex(transmission, 0),
				complex(transmission, 0), complex(0, 0)];
		}));
		filter.setglobal(global);
		close(cascade(first, filter).out('H2f121dBm')[1][1] - single,
			20 * Math.log10(0.25));
		close(cascade(first, filter).out('s21dB')[1][1], 0);
	});
});

test('two-tone IP2 cascade follows the Watkins-Johnson coherent-source equation', () => {
	withTwoTone([100e6], {spacingHz: 1e6, p1dBm: -40, p2dBm: -35}, () => {
		// The note lists A5 second-harmonic IP2 near 40 dBm and says its
		// two-tone IP2 is approximately equal. Use the ideal two-tone estimate.
		var first = Amp({gainDb: 15, oip2dBm: 40});
		var second = Amp({gainDb: 15, oip2dBm: 40});
		var viaCascade = cascade(first, second);
		var viaNodal = nodal(
			[first, 1, 2],
			[second, 2, 3],
			['out', 1, 3]
		);
		var gain2 = 10 ** (15 / 10);
		var stageIp2Watts = 10 ** ((40 - 30) / 10);
		var totalIp2Watts = 1 / (1 / Math.sqrt(stageIp2Watts * gain2) +
			1 / Math.sqrt(stageIp2Watts)) ** 2;
		var expectedOip2 = 10 * Math.log10(totalIp2Watts / 1e-3);
		var expectedIm2 = (-40 + 30) + (-35 + 30) - expectedOip2;
		var selectors = ['s21dB', 'OIP2sum21dBm', 'OIP2diff21dBm',
			'IM2sum21dBm', 'IM2diff21dBm'];
		var cascadeRow = viaCascade.out(...selectors)[1];
		var nodalRow = viaNodal.out(...selectors)[1];
		close(expectedOip2, 38.57836294700935);
		close(cascadeRow[1], 30);
		close(cascadeRow[2], expectedOip2);
		close(cascadeRow[3], expectedOip2);
		close(cascadeRow[4], expectedIm2);
		close(cascadeRow[5], expectedIm2);
		for (var i = 1; i < cascadeRow.length; i++) close(nodalRow[i], cascadeRow[i]);
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

test('existing component constructors share product-frequency S and noise rows', () => {
	withTwoTone([1e9], {spacingHz: 1e6, p1dBm: -30, p2dBm: -25}, () => {
		var constructors = [
			'seR', 'R', 'paR', 'seL', 'L', 'paL', 'seC', 'C', 'paC',
			'trf', 'trf4Port', 'seSeRL', 'paSeRL', 'seSeRC', 'paSeRC',
			'seSeLC', 'paSeLC', 'seSeRLC', 'paSeRLC', 'paPaRL', 'sePaRL',
			'paPaRC', 'sePaRC', 'paPaLC', 'sePaLC', 'paPaRLC', 'sePaRLC',
			'Attn', 'Amp', 'Tee', 'Tee4', 'Tee5', 'seriesTee', 'Open',
			'Short', 'Load', 'Shift90', 'Tlin', 'Tclin', 'mlin', 'mclin',
			'mtee', 'mcross', 'mstep', 'mbend', 'mtfr', 'mvgnd', 'mvia',
			'diode1N4148', 'lpfGen'
		];
		var expected = analysisFrequencies(global);
		constructors.forEach(function (name) {
			var component = nP[name]();
			assert.deepEqual(component.spars.map(row => row[0]), expected, name + ' S frequencies');
			assert.deepEqual(component.noise.map(row => row.frequency), expected,
				name + ' noise frequencies');
			assert.ok(component.spars.every(function (row) {
				return row.slice(1).every(value => value && Number.isFinite(value.getR()) &&
					Number.isFinite(value.getI()));
			}), name + ' finite complex S values');
			var selector = component.spars[0].length === 2 ? 's11dB' : 's21dB';
			assert.equal(component.out(selector).length, 2, name + ' display rows');
		});
		for (var name of ['Tee', 'Tee4', 'Tee5', 'seriesTee']) {
			var junction = nP[name]();
			assert.ok(junction.noise[0].C.every(row => row.every(value => value.mag() < 1e-32)),
				name + ' has zero added noise');
		}
	});
});

test('mixed R, line, microstrip, and Amp networks preserve NF and IP through nodal', () => {
	withTwoTone([1e9, 1.1e9], {spacingHz: 1e6, p1dBm: -40, p2dBm: -37}, () => {
		var amp = Amp({gainDb: 20, noiseFigureDb: 4, oip2dBm: 42,
			oip3dBm: 30, harmonicOip2dBm: 40});
		var resistor = nP.R({resistance: 75, temperature: 320});
		var line = nP.Tlin(50, 0.02);
		var microstrip = nP.mlin({temperature: 320});
		var attenuator = Attn(3);
		var direct = nodal(
			[amp, 1, 2],
			[resistor, 2, 3],
			[line, 3, 4],
			[microstrip, 4, 5],
			[attenuator, 5, 6],
			['out', 1, 6]
		);
		var viaCascade = cascade(amp, resistor, line, microstrip, attenuator);
		var selectors = ['s21dB', 'NF21dB', 'noiseFloor', 'IM2sum21dBm',
			'OIP2sum21dBm', 'IM3lower21dBm', 'OIP3lower21dBm', 'H2f121dBm'];
		var a = direct.out(...selectors);
		var b = viaCascade.out(...selectors);
		assert.equal(a.length, 3);
		for (var index = 1; index < a.length; index++) {
			for (var field = 1; field < a[index].length; field++) {
				close(a[index][field], b[index][field], 1e-6);
			}
		}
		var cooler = cascade(amp, nP.R({resistance: 75, temperature: 290}),
			line, nP.mlin({temperature: 290}), attenuator);
		assert.ok(viaCascade.out('NF21dB')[1][1] > cooler.out('NF21dB')[1][1]);
	});
});

test('three-port network reports NF and IP for either output', () => {
	withTwoTone([1e9], {spacingHz: 1e6, p1dBm: -40, p2dBm: -37}, () => {
		var amp = Amp({gainDb: 20, oip3dBm: 30});
		var tee = nP.Tee();
		var attenuator = Attn(3);
		var network = nodal(
			[amp, 1, 2],
			[tee, 2, 3, 4],
			[attenuator, 3, 5],
			['out', 1, 5, 4]
		);
		var row = network.out('NF21dB', 'NF31dB', 'IM3lower21dBm',
			'IM3lower31dBm', 'OIP3lower31dBm')[1];
		assert.ok(row.slice(1).every(Number.isFinite));
	});
});

test('diode bias model supplies noise and weak nonlinear products', () => {
	var low = withTwoTone([1e9], {spacingHz: 1e6, p1dBm: -50, p2dBm: -47}, () => {
		var diode = nP.diode1N4148();
		var attenuator = Attn(3);
		var direct = nodal(
			[diode, 1, 2],
			[attenuator, 2, 3],
			['out', 1, 3]
		);
		var selectors = ['NF21dB', 'IM2sum21dBm', 'IM3lower21dBm',
			'H2f121dBm', 'OIP2sum21dBm', 'OIP3lower21dBm'];
		var a = direct.out(...selectors)[1];
		var b = cascade(diode, attenuator).out(...selectors)[1];
		for (var i = 1; i < a.length; i++) close(a[i], b[i], 1e-6);
		assert.ok(a.slice(1).every(Number.isFinite));
		return a;
	});
	var high = withTwoTone([1e9], {spacingHz: 1e6, p1dBm: -47, p2dBm: -44}, () => {
		return cascade(nP.diode1N4148(), Attn(3)).out('IM2sum21dBm',
			'IM3lower21dBm', 'OIP2sum21dBm', 'OIP3lower21dBm')[1];
	});
	close(high[1] - low[2], 6);
	close(high[2] - low[3], 9);
	close(high[3], low[5]);
	close(high[4], low[6]);
});

test('zero-bias diode noise agrees with passive thermal equilibrium', () => {
	withTwoTone([1e9], {spacingHz: 1e6, p1dBm: -50, p2dBm: -47}, () => {
		var diode = nP.diode1N4148({biasVoltage: 0, temperatureK: 290});
		for (var frequencyIndex = 0; frequencyIndex < diode.spars.length; frequencyIndex++) {
			var expected = passiveNoiseCovariance(diode.spars[frequencyIndex], 2, 290);
			for (var row = 0; row < 2; row++) {
				for (var col = 0; col < 2; col++) {
					close(diode.noise[frequencyIndex].C[row][col].sub(expected[row][col]).mag(),
						0, 1e-32);
				}
			}
		}
	});
});
