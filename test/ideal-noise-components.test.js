// Modified: 2026-09-30
import test from 'node:test';
import assert from 'node:assert/strict';

import {global} from '../src/np-global/index.js';
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
		close(C[0][0].getR(), 0);
		close(C[0][1].getR(), 0);
		close(C[1][0].getR(), 0);
		close(C[1][1].getR(), (noiseFactor - 1) * gain * kB * 290);
		for (const entry of [...s.slice(1), ...C.flat()]) assert.equal(entry.getI(), 0);
		close(Amp(20, 0).noise[0].C[1][1].getR(), 0);
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
});
