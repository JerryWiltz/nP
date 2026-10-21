// Modified: 2026-10-20
import test from 'node:test';
import assert from 'node:assert/strict';

import {global} from '../src/np-global/index.js';
import {waveform} from '../src/np-digital/index.js';
import {FFT} from '../src/np-math/index.js';

test('triangle waveform follows the selected time list and yields even harmonics when asymmetric', () => {
	var previous = global.tList;
	try {
		global.tList = global.tGen(0, 255e-3 / 256, 256);
		var triangle = waveform({shape: 'triangle', period: 1e-3, riseFraction: 0.3});
		assert.equal(triangle.out('sample count'), 256);
		assert.deepEqual(triangle.out('waveform')[0], ['Time (s)', 'Voltage (V)']);
		assert.equal(triangle.out('waveform')[1][1], -1);
		assert.equal(triangle.out('sample rate'), 256e3);
		assert.deepEqual(triangle.out('time'), global.tList);
		assert.notStrictEqual(triangle.out('time'), global.tList);
		var spectrum = FFT(triangle.out('samples'));
		assert.ok(2 * spectrum[2].mag() / 256 > 0.2);
		var symmetric = waveform({period: 1e-3});
		assert.ok(2 * FFT(symmetric.out('samples'))[2].mag() / 256 < 1e-12);
		var copy = triangle.out('samples');
		copy[0] = 42;
		assert.equal(triangle.out('samples')[0], -1);
	} finally {
		global.tList = previous;
	}
});

test('custom waveform interpolates periodic voltage points on an explicit time list', () => {
	var custom = waveform({
		shape: 'custom',
		period: 1,
		time: [0, 0.25, 0.5, 0.75, 1, 1.25],
		points: [[0, 0], [0.5, 2], [1, 0]]
	});
	assert.deepEqual(custom.out('samples'), [0, 1, 2, 1, 0, 1]);
	assert.equal(custom.out('period'), 1);
	assert.equal(custom.out('sample count'), 6);
});

test('ideal square waveform has equal high and low samples and odd harmonics', () => {
	var time = global.tGen(0, 255e-3 / 256, 256);
	global.tList = time;
	global.fList = [];
	var square = waveform({shape: 'square', period: 1e-3, time: time});
	assert.deepEqual(square.out('samples').slice(0, 128), Array(128).fill(1));
	assert.deepEqual(square.out('samples').slice(128), Array(128).fill(-1));
	var spectrum = FFT(square.out('samples'));
	assert.ok(2 * spectrum[1].mag() / 256 > 1.27);
	assert.ok(2 * spectrum[2].mag() / 256 < 1e-12);
	assert.ok(2 * spectrum[3].mag() / 256 > 0.42);
	var squareDbv = spectrum.out('dBV');
	assert.deepEqual(squareDbv[0], ['Frequency (Hz)', 'Amplitude (dBV)']);
	assert.ok(Math.abs(squareDbv[2][1] - 20 * Math.log10(4 / (Math.PI * Math.SQRT2))) < 0.01);
	assert.deepEqual(squareDbv[3], [2000, -80]);
	var asymmetric = waveform({shape: 'square', period: 1e-3, dutyCycle: 0.25, time: time});
	assert.ok(2 * FFT(asymmetric.out('samples'))[2].mag() / 256 > 0.3);
});

test('full-wave rectified sine has DC and even multiples of the source frequency', () => {
	var time = global.tGen(0, 255e-3 / 256, 256);
	global.tList = time;
	global.fList = [];
	var rectified = waveform({shape: 'rectifiedSine', period: 1e-3, time: time});
	var samples = rectified.out('samples');
	assert.ok(Math.abs(samples[0]) < 1e-12);
	assert.ok(Math.abs(samples[64] - 1) < 1e-12);
	assert.ok(Math.abs(samples[128]) < 1e-12);
	assert.ok(Math.abs(samples[192] - 1) < 1e-12);
	var spectrum = FFT(samples);
	assert.ok(Math.abs(spectrum[0].mag() / 256 - 2 / Math.PI) < 1e-4);
	assert.ok(spectrum[1].mag() / 256 < 1e-12);
	assert.ok(Math.abs(2 * spectrum[2].mag() / 256 - 4 / (3 * Math.PI)) < 1e-4);
	assert.ok(spectrum[3].mag() / 256 < 1e-12);
	assert.ok(spectrum[4].mag() > 1);
	var rectifiedDbv = spectrum.out('dBV');
	assert.ok(Math.abs(rectifiedDbv[1][1] - 20 * Math.log10(2 / Math.PI)) < 0.01);
	assert.deepEqual(rectifiedDbv[2], [1000, -80]);
	assert.ok(Math.abs(rectifiedDbv[3][1] -
		20 * Math.log10(4 / (3 * Math.PI * Math.SQRT2))) < 0.01);
	assert.throws(() => waveform({shape: 'rectifiedSine', period: 1e-3,
		time: time, dutyCycle: 0.5}), /does not use/);
});

test('waveform rejects irregular sample times and invalid periodic shapes', () => {
	assert.throws(() => waveform({period: 1, time: [0, 0.2, 0.5]}), /uniformly spaced/);
	assert.throws(() => waveform({period: 1, time: [0, 0.5], riseFraction: 1}), /riseFraction/);
	assert.throws(() => waveform({period: 1, time: [0, 0.5],
		points: [[0, 0], [1, 0]]}), /points require shape: 'custom'/);
	assert.throws(() => waveform({period: 1, time: [0, 0.5],
		shape: 'square', points: [[0, 0], [1, 0]]}), /points require shape: 'custom'/);
	assert.throws(() => waveform({period: 1, time: [0, 0.5],
		shape: 'custom'}), /requires points/);
	assert.throws(() => waveform({period: 1, time: [0, 0.5],
		shape: 'custom', points: [[0, 0], [0.6, 1]]}), /points must run/);
	assert.throws(() => waveform({period: 1, time: [0, 0.5], shape: 'sine'}), /shape must/);
	assert.throws(() => waveform({period: 1, time: [0, 0.5], shape: 'square', dutyCycle: 0}), /dutyCycle/);
	assert.throws(() => waveform({period: 1, time: [0, 0.5], shape: 'square', riseFraction: 0.5}), /riseFraction/);
});
