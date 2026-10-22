// Modified: 2026-10-22
import test from 'node:test';
import assert from 'node:assert/strict';

import {global} from '../src/np-global/index.js';
import {mod, demod} from '../src/np-digital/index.js';
import {Attn, Coupler180, L, Load, nodal} from '../src/np-nport/index.js';

test('VNA-frequency measures an inductor S11 and S21 through two ideal couplers', () => {
	var g = global();
	g.tList = [];
	g.fList = [1e9, 1.7e9, 2e9, 3e9];
	var tx = mod({mode: 'VNA-frequency', fList: g.fList});
	var splitter = Coupler180();
	var first = Coupler180();
	var second = Coupler180();
	var inductor = L(5e-9);
	var load = Load();
	var circuit = nodal(
		[splitter, 1, 2, 3, 4],
		[first, 2, 5, 6, 7],
		[inductor, 5, 8],
		[second, 8, 9, 10, 11],
		[load, 3],
		[load, 7],
		[load, 9],
		[load, 10],
		['out', 1, 4, 6, 11],
		{signal: tx, inputPort: 1}
	);
	var reference = demod(circuit, {outputPort: 2, referenceGain: 1, noise: false});
	var reflection = demod(circuit, {outputPort: 3, referenceReceiver: reference, referenceGain: 2, noise: false});
	var transmission = demod(circuit, {outputPort: 4, referenceReceiver: reference, referenceGain: 2, noise: false});
	var rawReflection = demod(circuit, {outputPort: 3, noise: false});
	var s11 = reflection.out('response');
	var s21 = transmission.out('response');
	var measuredS11 = reflection.out('response dB');
	var measuredS21 = transmission.out('response dB');
	var direct = inductor.getspars();
	assert.equal(tx.out('mode'), 'VNA-frequency');
	assert.equal(reflection.out('frequency count'), 4);
	assert.deepEqual(reflection.out('frequencies'), g.fList);
	assert.equal(tx.sampleCount, undefined);
	for (var i = 0; i < direct.length; i++) {
		assert.ok(Math.abs(s11[i].getR() - direct[i][1].getR()) < 1e-11);
		assert.ok(Math.abs(s11[i].getI() - direct[i][1].getI()) < 1e-11);
		assert.ok(Math.abs(rawReflection.out('response')[i].getR() * 2 /
			reference.out('response')[i].getR() - s11[i].getR()) < 1e-11);
		assert.ok(Math.abs(s21[i].getR() - direct[i][3].getR()) < 1e-11);
		assert.ok(Math.abs(s21[i].getI() - direct[i][3].getI()) < 1e-11);
		assert.ok(Math.abs(measuredS11[i + 1][1] - direct[i][1].mag20dB()) < 1e-10);
		assert.ok(Math.abs(measuredS21[i + 1][1] - direct[i][3].mag20dB()) < 1e-10);
	}
	assert.throws(function () { reflection.out('waveform'); }, /Unknown/);
});

test('VNA-frequency requires a valid frequency grid and a deterministic receiver', () => {
	var g = global();
	g.tList = [];
	g.fList = [];
	assert.throws(function () { mod({mode: 'VNA-frequency'}); }, /fList/);
	assert.throws(function () { mod({mode: 'VNA-frequency', fList: [2e9, 1e9]}); }, /fList/);
	assert.throws(function () { mod({mode: 'VNA-frequency', fList: [1e9, 1e9]}); }, /fList/);
	assert.throws(function () { mod({mode: 'VNA-frequency', fList: [1e9], carrierHz: 1e9}); }, TypeError);
	var tx = mod({mode: 'VNA-frequency', fList: [2e9]});
	var direct = demod(tx, {noise: false});
	assert.equal(direct.out('response')[0].getR(), 1);
	assert.equal(demod(tx, {referenceGain: 1}).out('response')[0].getR(), 1);
	assert.equal(direct.out('response phase')[1][1], 0);
	assert.throws(function () { demod(tx, {noise: true}); }, /noise: false/);
	assert.throws(function () { demod(tx, {referenceGain: 0}); }, /referenceGain/);
	assert.throws(function () { demod(tx, {referencePort: 2}); }, /referencePort/);
});

test('reference receiver gain compensates a 3 dB pad in its path', () => {
	var g = global();
	g.tList = [];
	g.fList = [2e9];
	var tx = mod({mode: 'VNA-frequency'});
	var splitter = Coupler180();
	var inputCoupler = Coupler180();
	var outputCoupler = Coupler180();
	var pad = Attn(3);
	var inductor = L(5e-9);
	var load = Load();
	var circuit = nodal(
		[splitter, 1, 2, 3, 4],
		[pad, 4, 12],
		[inputCoupler, 2, 5, 6, 7],
		[inductor, 5, 8],
		[outputCoupler, 8, 9, 10, 11],
		[load, 3],
		[load, 7],
		[load, 9],
		[load, 10],
		['out', 1, 12, 6, 11],
		{signal: tx, inputPort: 1}
	);
	var reference = demod(circuit, {
		outputPort: 2, referenceGain: 10 ** (3 / 20), noise: false
	});
	var reflection = demod(circuit, {
		outputPort: 3, referenceReceiver: reference, referenceGain: 2, noise: false
	});
	var transmission = demod(circuit, {
		outputPort: 4, referenceReceiver: reference, referenceGain: 2, noise: false
	});
	var s = inductor.getspars()[0];
	assert.ok(Math.abs(reflection.out('response')[0].getR() - s[1].getR()) < 1e-11);
	assert.ok(Math.abs(reflection.out('response')[0].getI() - s[1].getI()) < 1e-11);
	assert.ok(Math.abs(transmission.out('response')[0].getR() - s[3].getR()) < 1e-11);
	assert.ok(Math.abs(transmission.out('response')[0].getI() - s[3].getI()) < 1e-11);
});
