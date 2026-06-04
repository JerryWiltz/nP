import test from 'node:test';
import assert from 'node:assert/strict';

import { global } from '../src/np-global/index.js';

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
