// Modified: 2026-10-01
import test from 'node:test';
import assert from 'node:assert/strict';

import {global} from '../src/np-global/index.js';
import {complex} from '../src/np-math/src/complex.js';
import {Attn, Amp, cascade, nodal} from '../src/np-nport/index.js';

const kB = 1.380649e-23;

function close(actual, expected, relativeTolerance = 1e-12) {
	assert.ok(Math.abs(actual - expected) <= relativeTolerance * Math.max(Math.abs(expected), 1e-30),
		`${actual} differs from ${expected}`);
}

function withGlobal(settings, action) {
	const previous = {fList: global.fList, Temp: global.Temp};
	global.fList = settings.fList;
	global.Temp = settings.Temp;
	try {
		return action();
	} finally {
		global.fList = previous.fList;
		global.Temp = previous.Temp;
	}
}

test('Attn provides matched S-parameters and temperature-scaled two-port covariance', () => {
	withGlobal({fList: [1e9, 2e9], Temp: 293}, () => {
		const attenuationDb = 3;
		const attenuator = Attn({attenuationDb, temperature: 290});
		const transmission = 10 ** (-attenuationDb / 20);
		const expectedNoise = kB * 290 * (1 - transmission ** 2);
		assert.equal(attenuator.temperature, 290);
		assert.equal(attenuator.spars.length, 2);
		for (let i = 0; i < 2; i++) {
			const s = attenuator.spars[i];
			const C = attenuator.noise[i].C;
			assert.equal(attenuator.noise[i].frequency, global.fList[i]);
			close(s[1].getR(), 0);
			close(s[2].getR(), transmission);
			close(s[3].getR(), transmission);
			close(s[4].getR(), 0);
			close(C[0][0].getR(), expectedNoise);
			close(C[1][1].getR(), expectedNoise);
			close(C[0][1].getR(), 0);
			close(C[1][0].getR(), 0);
			for (const entry of [...s.slice(1), ...C.flat()]) assert.equal(entry.getI(), 0);
		}
		global.Temp = 500;
		close(attenuator.noise[0].C[0][0].getR(), expectedNoise);
		close(Attn(0).noise[0].C[0][0].getR(), 0);
		close(Attn(3, 0).noise[0].C[0][0].getR(), 0);
	});
});

test('Amp sets its output noise from matched-source noise figure', () => {
	withGlobal({fList: [1e9], Temp: 293}, () => {
		const amplifier = Amp({gainDb: 20, noiseFigureDb: 4, referenceTemperature: 290});
		const gain = 100;
		const noiseFactor = 10 ** (4 / 10);
		const s = amplifier.spars[0];
		const C = amplifier.noise[0].C;
		assert.equal(amplifier.referenceTemperature, 290);
		close(s[1].getR(), 0);
		close(s[2].getR(), 0);
		close(s[3].getR(), 10);
		close(s[4].getR(), 0);
		close(C[0][0].getR(), kB * 290 * (4 * 25 / global.Ro - (noiseFactor - 1)));
		close(C[0][1].getR(), 0);
		close(C[1][0].getR(), 0);
		close(C[1][1].getR(), (noiseFactor - 1) * gain * kB * 290);
		for (const entry of [...s.slice(1), ...C.flat()]) close(entry.getI(), 0);
		close(Amp(20, 0).noise[0].C[1][1].getR(), 0);
	});
});

test('Amp defaults to the specified 20 dB two-port and full noise parameters', () => {
	withGlobal({fList: [1e9, 2e9], Temp: 290}, () => {
		const amplifier = Amp();
		const positional = Amp(20, 4);
		const emptyOptions = Amp({});
		const explicit = Amp({
			spars: [complex(0, 0), complex(0, 0), complex(10, 0), complex(0, 0)],
			fMinDb: 4,
			gammaOpt: complex(0, 0),
			noiseResistanceOhms: 25,
			referenceTemperature: 290
		});
		for (const row of amplifier.out('s21dB', 'NF21dB')) {
			if (row[0] === 'Freq') continue;
			close(row[1], 20);
			close(row[2], 4);
		}
		for (let index = 0; index < amplifier.noise.length; index++) {
			for (let entry = 1; entry <= 4; entry++) {
				close(amplifier.spars[index][entry].sub(explicit.spars[index][entry]).mag(), 0);
			}
			for (let row = 0; row < 2; row++) {
				for (let col = 0; col < 2; col++) {
					close(amplifier.noise[index].C[row][col]
						.sub(explicit.noise[index].C[row][col]).mag(), 0);
					close(amplifier.noise[index].C[row][col]
						.sub(positional.noise[index].C[row][col]).mag(), 0);
					close(amplifier.noise[index].C[row][col]
						.sub(emptyOptions.noise[index].C[row][col]).mag(), 0);
				}
			}
		}
	});
});

test('Amp object overrides only supplied defaults and rejects invalid covariance', () => {
	withGlobal({fList: [1e9, 2e9], Temp: 290}, () => {
		const baseline = Amp();
		const adjustedNoise = Amp({fMinDb: 4.5});
		close(adjustedNoise.out('s21dB', 'NF21dB')[1][1], 20);
		close(adjustedNoise.out('s21dB', 'NF21dB')[1][2], 4.5);
		close(adjustedNoise.spars[0][3].sub(baseline.spars[0][3]).mag(), 0);
		close(adjustedNoise.noise[0].C[0][1].mag(), 0);
		const sevenDb = Amp({fMinDb: 7, noiseResistanceOhms: 51});
		close(sevenDb.out('NF21dB')[1][1], 7);
		const smaller = Amp(12, 2.3);
		close(smaller.out('s21dB', 'NF21dB')[1][1], 12);
		close(smaller.out('s21dB', 'NF21dB')[1][2], 2.3);
		assert.throws(() => Amp({fMinDb: 7}), /invalid noise covariance/);
		assert.throws(() => Amp({fMinDb: 7, gammaOpt: complex(0.1, 0.2),
			noiseResistanceOhms: 1}), /invalid noise covariance/);
	});
});

test('Amp converts constant two-port noise parameters into complex covariance', () => {
	withGlobal({fList: [1e9, 2e9], Temp: 290}, () => {
		const fMinDb = 2;
		const gammaOpt = complex(0.2, 0.1);
		const noiseResistanceOhms = 25;
		const spars = [complex(0.1, 0.05), complex(0, 0.01),
			complex(9, 3), complex(0.2, 0)];
		const amplifier = Amp({spars, fMinDb, gammaOpt, noiseResistanceOhms});
		const slope = 4 * (noiseResistanceOhms / global.Ro) /
			((1 + gammaOpt.getR()) ** 2 + gammaOpt.getI() ** 2);
		for (const gamma of [complex(0, 0), gammaOpt, complex(-0.3, 0.25)]) {
			const distance = gamma.sub(gammaOpt).mag() ** 2;
			const expected = 10 ** (fMinDb / 10) +
				slope * distance / (1 - gamma.mag() ** 2);
			const output = amplifier.out('NF21', {source: {reflection: gamma}});
			close(output[1][1], expected);
			close(output[2][1], expected);
		}
		const matchedNoiseFigureDb = 10 * Math.log10(
			10 ** (fMinDb / 10) + slope * gammaOpt.mag() ** 2);
		close(Amp({spars, fMinDb, gammaOpt, noiseResistanceOhms,
			noiseFigureDb: matchedNoiseFigureDb}).out('NF21dB')[1][1], matchedNoiseFigureDb);
		assert.throws(() => Amp({spars, fMinDb, gammaOpt, noiseResistanceOhms,
			noiseFigureDb: matchedNoiseFigureDb + 1}), RangeError);
		assert.ok(amplifier.noise[0].C[0][1].mag() > 0);
		assert.notEqual(amplifier.noise[0].C[0][1].getI(), 0);
		assert.notEqual(amplifier.noise[0].C[0][1], amplifier.noise[1].C[0][1]);
		for (let index = 0; index < spars.length; index++) {
			close(amplifier.spars[0][index + 1].getR(), spars[index].getR());
			close(amplifier.spars[0][index + 1].getI(), spars[index].getI());
		}
	});
});

test('both stage orders give the matched-stage Friis noise factors', () => {
	withGlobal({fList: [1e9], Temp: 290}, () => {
		const attenuator = Attn(3, 290);
		const amplifier = Amp(20, 4, 290);
		const attenuationFactor = 10 ** (3 / 10);
		const amplifierFactor = 10 ** (4 / 10);
		const amplifierGain = 100;
		for (const [first, second, expectedFactor] of [
			[attenuator, amplifier, attenuationFactor * amplifierFactor],
			[amplifier, attenuator, amplifierFactor + (attenuationFactor - 1) / amplifierGain]
		]) {
			const cascaded = cascade(first, second);
			const connected = nodal([first, 1, 2], [second, 2, 3], ['out', 1, 3]);
			for (const network of [cascaded, connected]) {
				const covariance = network.noise.covariance[0].C;
				const powerGain = network.spars[0][3].mag() ** 2;
				const noiseFactor = 1 + covariance[1][1].getR() / (powerGain * kB * 290);
				close(noiseFactor, expectedFactor);
			}
		}
	});
});

test('ideal noise constructors reject invalid parameters', () => {
	assert.throws(() => Attn(-1), RangeError);
	assert.throws(() => Attn(3, -1), RangeError);
	assert.throws(() => Amp(Infinity), RangeError);
	assert.throws(() => Amp(20, -1), RangeError);
	assert.throws(() => Amp(20, 4, 0), RangeError);
	assert.doesNotThrow(() => Amp({fMinDb: 2}));
	assert.throws(() => Amp({spars: [complex(0, 0)]}), TypeError);
	assert.throws(() => Amp({
		spars: [complex(0, 0), complex(0, 0), complex(10, 0), complex(0, 0)],
		fMinDb: 2, gammaOpt: complex(1, 0), noiseResistanceOhms: 25
	}), RangeError);
	assert.throws(() => Amp({
		spars: [complex(0, 0), complex(0, 0), complex(10, 0), complex(0, 0)],
		fMinDb: 4, gammaOpt: complex(0, 0), noiseResistanceOhms: 0
	}), RangeError);
});
