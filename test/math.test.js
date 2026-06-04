import test from 'node:test';
import assert from 'node:assert/strict';

import { complex } from '../src/np-math/index.js';

const closeTo = (actual, expected, tolerance = 1e-12) => {
	assert.ok(
		Math.abs(actual - expected) <= tolerance,
		`${actual} not within ${tolerance} of ${expected}`
	);
};

test('complex add, subtract, multiply, and divide', () => {
	const a = complex(1, 2);
	const b = complex(3, 4);

	const sum = a.add(b);
	assert.equal(sum.getR(), 4);
	assert.equal(sum.getI(), 6);

	const difference = b.sub(a);
	assert.equal(difference.getR(), 2);
	assert.equal(difference.getI(), 2);

	const product = a.mul(b);
	assert.equal(product.getR(), -5);
	assert.equal(product.getI(), 10);

	const quotient = product.div(b);
	closeTo(quotient.getR(), a.getR());
	closeTo(quotient.getI(), a.getI());
});

test('complex magnitude and angle', () => {
	const c = complex(3, 4);

	assert.equal(c.mag(), 5);
	closeTo(c.ang(), 53.13010235415598);
});
