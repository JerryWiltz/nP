// Modified: 2026-10-03
import test from 'node:test';
import assert from 'node:assert/strict';

import {global} from '../src/np-global/index.js';
import {complex} from '../src/np-math/src/complex.js';
import {nPort} from '../src/np-nport/src/nPort.js';
import {Amp, Attn, Tee, nodal, cascade} from '../src/np-nport/index.js';

const kB = 1.380649e-23;

function close(actual, expected, tolerance = 1e-9) {
	assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
		`${actual} differs from ${expected}`);
}

function withGlobal(action) {
	const previous = {fList: global.fList, Ro: global.Ro, Temp: global.Temp};
	global.fList = [1e9, 2e9];
	global.Ro = 50;
	global.Temp = 290;
	try {
		return action();
	} finally {
		global.fList = previous.fList;
		global.Ro = previous.Ro;
		global.Temp = previous.Temp;
	}
}

test('out reports noise figure for either stage order at every frequency', () => {
	withGlobal(() => {
		const amp = Amp(20, 4, 290);
		const attenuator = Attn(3, 290);
		const network = nodal(
			[amp, 1, 2],
			[attenuator, 2, 3],
			['out', 1, 3]
		);
		const output = network.out('s21dB', 'NF21', 'NF21dB', 'c22');
		assert.deepEqual(output[0], ['Freq', 's21dB', 'NF21', 'NF21dB', 'c22']);
		assert.equal(output.length, 3);
		const expectedFactor = 10 ** (4 / 10) + (10 ** (3 / 10) - 1) / 100;
		for (const row of output.slice(1)) {
			close(row[1], 17);
			close(row[2], expectedFactor);
			close(row[3], 10 * Math.log10(expectedFactor));
			close(row[4], network.noise[global.fList.indexOf(row[0])].C[1][1].getR(), 1e-25);
		}
		const floor = network.out('noiseFloor', 'noiseFloor21dBmHz', 'NF21dB');
		const cascadeFloor = cascade(amp, attenuator).out('noiseFloor');
		for (const row of floor.slice(1)) {
			const expectedFloor = 10 * Math.log10(kB * 290 * 1000) + 17 + row[3];
			close(row[1], expectedFloor);
			close(row[2], expectedFloor);
			close(cascadeFloor[global.fList.indexOf(row[0]) + 1][1], expectedFloor);
		}
		close(network.out('NF21', {referenceTemperature: 580})[1][1],
			1 + (expectedFactor - 1) / 2);
		assert.equal(network.noise.covariance, network.noise);
		assert.equal(amp.noise.covariance, amp.noise);
	});
});

test('NF31 includes noise from unused port 2 and accepts its temperature', () => {
	withGlobal(() => {
		const tee = Tee();
		const cold = tee.out('NF31', {terminations: {2: {temperature: 0}}})[1][1];
		const room = tee.out('NF31')[1][1];
		const hot = tee.out('NF31', {terminations: {2: {temperature: 580}}})[1][1];
		close(cold, 1, 2e-6);
		close(room, 2, 2e-6);
		close(hot, 3, 2e-6);
		close(tee.out('NF31dB')[1][1], 10 * Math.log10(room));
		assert.equal(tee.out('NF31dB')[0][1], 'NF31dB');
		close(tee.out('NF(3,1)dB')[1][1], tee.out('NF31dB')[1][1]);
	});
});

test('source mismatch uses both input noise and cross-correlation', () => {
	withGlobal(() => {
		const device = new nPort();
		device.setglobal(global);
		device.setspars(global.fList.map((frequency) => [
			frequency, complex(0.2, 0), complex(0, 0),
			complex(2, 0), complex(0, 0)
		]));
		const thermal = kB * 290;
		device.noise = global.fList.map((frequency) => ({
			frequency,
			C: [
				[complex(2 * thermal, 0), complex(thermal, 0)],
				[complex(thermal, 0), complex(8 * thermal, 0)]
			]
		}));
		const gamma = 0.5;
		const denominator = 1 - 0.2 * gamma;
		const sourceTransfer = 2 / denominator;
		const inputNoiseTransfer = 2 * gamma / denominator;
		const sourceNoise = sourceTransfer ** 2 * thermal * (1 - gamma ** 2);
		const internalNoise = (2 * inputNoiseTransfer ** 2 + 8 +
			2 * inputNoiseTransfer) * thermal;
		const expected = 1 + internalNoise / sourceNoise;
		close(device.out('NF21', {source: {reflection: gamma}})[1][1], expected);
		assert.ok(device.out('NF21')[1][1] < expected);
		assert.throws(() => device.out('NF21', {source: {reflection: 1}}), RangeError);
		assert.throws(() => device.out('NF31dB'), RangeError);
		assert.throws(() => device.out('NF21', {terminations: {1: {temperature: 290}}}), RangeError);
	});
});

test('complex source reflection uses the phase of noise correlation', () => {
	withGlobal(() => {
		const device = new nPort();
		device.setglobal(global);
		device.setspars(global.fList.map((frequency) => [
			frequency, complex(0, 0), complex(0, 0),
			complex(1, 0), complex(0, 0)
		]));
		const thermal = kB * 290;
		device.noise = global.fList.map((frequency) => ({
			frequency,
			C: [
				[complex(2 * thermal, 0), complex(0, thermal)],
				[complex(0, -thermal), complex(3 * thermal, 0)]
			]
		}));
		close(device.out('NF21', {source: {reflection: complex(0, 0.5)}})[1][1],
			1 + 2.5 / 0.75);
		close(device.out('NF21', {source: {reflection: complex(0, -0.5)}})[1][1],
			1 + 4.5 / 0.75);
	});
});

test('a reflecting output termination contributes noise only when assigned a temperature', () => {
	withGlobal(() => {
		const device = new nPort();
		device.setglobal(global);
		device.setspars(global.fList.map((frequency) => [
			frequency, complex(0, 0), complex(0, 0),
			complex(1, 0), complex(0.5, 0)
		]));
		device.noise = global.fList.map((frequency) => ({
			frequency,
			C: [
				[complex(0, 0), complex(0, 0)],
				[complex(0, 0), complex(0, 0)]
			]
		}));
		close(device.out('NF21')[1][1], 1);
		close(device.out('NF21', {terminations: {
			2: {reflection: 0.2, temperature: 290}
		}})[1][1], 1.24);
	});
});

test('three-port NF includes mismatched source, both terminations, and component noise', () => {
	withGlobal(() => {
		const device = new nPort();
		device.setglobal(global);
		const p = 0.1, q = 0.2, r = 0.25;
		const j = 0.5, g = 2, h = 0.75;
		const thermal = kB * 290;
		device.setspars(global.fList.map((frequency) => [
			frequency,
			complex(p, 0), complex(0, 0), complex(0, 0),
			complex(j, 0), complex(q, 0), complex(0, 0),
			complex(g, 0), complex(h, 0), complex(r, 0)
		]));
		device.noise = global.fList.map((frequency) => ({
			frequency,
			C: [
				[complex(2 * thermal, 0), complex(0, 0), complex(0, 0)],
				[complex(0, 0), complex(3 * thermal, 0), complex(0, 0)],
				[complex(0, 0), complex(0, 0), complex(4 * thermal, 0)]
			]
		}));

		const sourceReflection = 0.3;
		const unusedReflection = -0.4;
		const outputReflection = 0.2;
		const unusedTemperature = 435;
		const outputTemperature = 580;
		const options = {
			source: {reflection: sourceReflection},
			terminations: {
				2: {reflection: unusedReflection, temperature: unusedTemperature},
				3: {reflection: outputReflection, temperature: outputTemperature}
			}
		};

		// Solve the three triangular wave equations by substitution. A, B, and R
		// carry incident noise from ports 1, 2, and 3 to outgoing port 3.
		const d1 = 1 - p * sourceReflection;
		const d2 = 1 - q * unusedReflection;
		const d3 = 1 - r * outputReflection;
		const A = (g + h * unusedReflection * j / d2) / (d1 * d3);
		const B = h / (d2 * d3);
		const R = r / d3;
		const sourceNoise = A ** 2 * thermal * (1 - sourceReflection ** 2);
		const terminationNoise = B ** 2 * kB * unusedTemperature *
			(1 - unusedReflection ** 2) +
			R ** 2 * kB * outputTemperature * (1 - outputReflection ** 2);
		const componentNoise = (2 * (sourceReflection * A) ** 2 +
			3 * (unusedReflection * B) ** 2 + 4 / d3 ** 2) * thermal;
		const expected = 1 + (terminationNoise + componentNoise) / sourceNoise;
		const expectedFloor = 10 * Math.log10((sourceNoise + terminationNoise + componentNoise) * 1000);
		const output = device.out('NF31', 'NF31dB', options);
		for (const row of output.slice(1)) {
			close(row[1], expected);
			close(row[2], 10 * Math.log10(expected));
		}
		close(device.out('noiseFloor31dBmHz', options)[1][1], expectedFloor);
		close(device.out('noiseFloor(3,1)dBmHz', options)[1][1], expectedFloor);
		const cold = device.out('NF31', {
			source: options.source,
			terminations: {
				2: {reflection: unusedReflection, temperature: 0},
				3: {reflection: outputReflection, temperature: 0}
			}
		})[1][1];
		assert.ok(output[1][1] > cold);
	});
});

test('a combined nPort keeps its noise when reused in nodal', () => {
	withGlobal(() => {
		const amp = Amp(20, 4, 290);
		const attenuator = Attn(3, 290);
		const first = nodal(
			[amp, 1, 2],
			[attenuator, 2, 3],
			['out', 1, 3]
		);
		const nested = nodal(
			[first, 1, 2],
			[attenuator, 2, 3],
			['out', 1, 3]
		);
		const flat = nodal(
			[amp, 1, 2],
			[attenuator, 2, 3],
			[attenuator, 3, 4],
			['out', 1, 4]
		);
		const cascaded = cascade(first, attenuator);
		for (let frequency = 1; frequency <= global.fList.length; frequency++) {
			close(nested.out('NF21dB')[frequency][1], flat.out('NF21dB')[frequency][1]);
			close(cascaded.out('NF21dB')[frequency][1], flat.out('NF21dB')[frequency][1]);
		}
		const oldFrequencies = global.fList;
		global.fList = [3e9];
		close(nested.out('NF21dB')[1][1], flat.out('NF21dB')[1][1]);
		assert.equal(nodal([first, 1, 2], ['out', 1, 2]).spars.length, 2);
		global.fList = oldFrequencies;
	});
});

test('cascade preserves complex covariance through multiple stages and reuse in nodal', () => {
	withGlobal(() => {
		const amplifier = Amp({
			spars: [complex(0.1, 0.05), complex(0, 0.01),
				complex(9, 3), complex(0.2, 0)],
			fMinDb: 2,
			gammaOpt: complex(0.2, 0.1),
			noiseResistanceOhms: 25
		});
		const attenuator = Attn(3, 290);
		const secondAmplifier = Amp(12, 2.3);
		const cascaded = cascade(amplifier, attenuator, secondAmplifier);
		const connected = nodal(
			[amplifier, 1, 2],
			[attenuator, 2, 3],
			[secondAmplifier, 3, 4],
			['out', 1, 4]
		);
		for (let frequency = 0; frequency < global.fList.length; frequency++) {
			assert.equal(cascaded.noise[frequency].frequency, global.fList[frequency]);
			for (let entry = 1; entry <= 4; entry++) {
				close(cascaded.spars[frequency][entry].sub(connected.spars[frequency][entry]).mag(), 0);
			}
			for (let row = 0; row < 2; row++) {
				for (let col = 0; col < 2; col++) {
					assert.ok(cascaded.noise[frequency].C[row][col]
						.sub(connected.noise[frequency].C[row][col]).mag() < 1e-25);
				}
			}
		}
		const source = {reflection: complex(-0.1, 0.15)};
		close(cascaded.out('NF21dB', {source})[1][1], connected.out('NF21dB', {source})[1][1]);
		const next = Attn(1, 290);
		const reused = nodal([cascaded, 1, 2], [next, 2, 3], ['out', 1, 3]);
		const flat = nodal(
			[amplifier, 1, 2],
			[attenuator, 2, 3],
			[secondAmplifier, 3, 4],
			[next, 4, 5],
			['out', 1, 5]
		);
		close(reused.out('NF21dB', {source})[1][1], flat.out('NF21dB', {source})[1][1]);
	});
});

test('passive covariance keeps its construction temperature and frequencies stay aligned', () => {
	withGlobal(() => {
		const matched = new nPort();
		matched.setglobal(global);
		matched.setspars(global.fList.map((frequency) => [
			frequency, complex(0, 0)
		]));
		global.Temp = 580;
		close(matched.noise[0].C[0][0].getR(), kB * 290, 1e-30);

		const amplifier = Amp(20, 4, 290);
		global.fList = [3e9];
		const attenuator = Attn(3, 290);
		assert.throws(() => nodal(
			[amplifier, 1, 2],
			[attenuator, 2, 3],
			['out', 1, 3]
		), /matching frequency rows/);
		assert.throws(() => cascade(amplifier, attenuator), /matching frequency rows/);
	});
});
