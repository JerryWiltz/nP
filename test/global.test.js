// Modified: 2026-10-20
import test from 'node:test';
import assert from 'node:assert/strict';

import { global } from '../src/np-global/index.js';
import {mod, demod} from '../src/np-digital/index.js';
import {Attn, cascade} from '../src/np-nport/index.js';

test('global defaults are available', () => {
	assert.deepEqual(global.fList, [2e9]);
	assert.equal(global.Ro, 50);
	assert.equal(global.Temp, 293);
});

test('fGen includes first and last frequency', () => {
	assert.deepEqual(global.fGen(100, 300, 3), [100, 200, 300]);
});

test('fGen generates evenly spaced frequency lists', () => {
	const fList = global.fGen(0, 10, 6);

	assert.deepEqual(fList, [0, 2, 4, 6, 8, 10]);
});

test('tGen includes both endpoints and requires a valid time grid', () => {
	assert.deepEqual(global.tList, []);
	assert.deepEqual(global.tGen(0, 1e-9, 3), [0, 0.5e-9, 1e-9]);
	assert.throws(() => global.tGen(0, 1, 1), /at least two points/);
});

test('circuit contexts retain independent settings and default constructor frequencies', () => {
	var first = global();
	try {
		first.fList = [];
		first.tList = first.tGen(0, 31e-9 / 8, 32);
		first.Ro = 50;
		first.Temp = 290;
		var firstTx = mod({mode: 'bits', bits: '1010', fftList: first.fList});
		var firstStage = Attn();
		var firstChain = cascade(firstStage, {signal: firstTx});

		var second = global();
		second.fList = [];
		second.tList = second.tGen(0, 63e-9 / 8, 64);
		second.Ro = 75;
		second.Temp = 310;
		var secondTx = mod({mode: 'bits', bits: '10110010', fftList: second.fList});
		var secondStage = Attn();
		var secondChain = cascade(secondStage, {signal: secondTx});

		assert.notStrictEqual(first, second);
		assert.equal(first.tList.length, 32);
		assert.equal(second.tList.length, 64);
		assert.ok(Math.abs(first.tList[1] - 1.25e-10) < 1e-20);
		assert.ok(Math.abs(second.tList[1] - 1.25e-10) < 1e-20);
		assert.deepEqual(firstStage.getglobal().tList, first.tList);
		assert.deepEqual(secondStage.getglobal().tList, second.tList);
		assert.equal(first.fList.length, 17);
		assert.equal(second.fList.length, 33);
		assert.deepEqual(firstStage.getglobal().fList, first.fList);
		assert.deepEqual(secondStage.getglobal().fList, second.fList);
		assert.equal(firstStage.getglobal().Ro, 50);
		assert.equal(secondStage.getglobal().Ro, 75);
		assert.equal(firstStage.getglobal().Temp, 290);
		assert.equal(secondStage.getglobal().Temp, 310);
		assert.deepEqual(demod(firstChain, {noise: false}).out('bits'), firstTx.bits);
		assert.deepEqual(demod(secondChain, {noise: false}).out('bits'), secondTx.bits);

		global(first);
		assert.strictEqual(global.fList, first.fList);
		first.fList = [1e9];
		global.twoTone = {spacingHz: 1e6, p1dBm: -30, p2dBm: -25};
		var intermodStage = Attn();
		assert.equal(first.twoTone.spacingHz, 1e6);
		assert.equal(intermodStage.getglobal().twoTone.spacingHz, 1e6);
		assert.deepEqual(intermodStage.getglobal().fList, [1e9]);
		assert.equal(second.twoTone, undefined);
		global(second);
		assert.strictEqual(global.fList, second.fList);
		assert.equal(Attn().getglobal().twoTone, undefined);
		assert.equal(global.Ro, 75);
		assert.equal(global.Temp, 310);
		assert.deepEqual(global.fGen(1, 3, 3), [1, 2, 3]);
		assert.throws(() => global({fList: []}), /circuit context/);
	} finally {
		global();
	}
});
