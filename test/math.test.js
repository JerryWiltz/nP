import test from 'node:test';
import assert from 'node:assert/strict';

import { complex, matrix } from '../src/np-math/index.js';

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

test('complex inverse, negation, copy, and setters', () => {
	const c = complex(3, 4);
	const inverse = c.inv();
	const product = c.mul(inverse);

	closeTo(inverse.getR(), 0.12);
	closeTo(inverse.getI(), -0.16);
	closeTo(product.getR(), 1);
	closeTo(product.getI(), 0);

	const negative = c.neg();
	assert.equal(negative.getR(), -3);
	assert.equal(negative.getI(), -4);

	const copy = c.copy();
	copy.setR(10).setI(11);
	assert.equal(c.getR(), 3);
	assert.equal(c.getI(), 4);
	assert.equal(copy.getR(), 10);
	assert.equal(copy.getI(), 11);
});

test('complex magnitude in dB', () => {
	const c = complex(3, 4);

	closeTo(c.mag10dB(), 6.989700043360188);
	closeTo(c.mag20dB(), 13.979400086720377);
});

test('complex hyperbolic sine and cosine', () => {
	const c = complex(1, 2);
	const sinh = c.sinhCplx();
	const cosh = c.coshCplx();

	closeTo(sinh.getR(), -0.4890562590412937);
	closeTo(sinh.getI(), 1.4031192506220405);
	closeTo(cosh.getR(), -0.64214812471552);
	closeTo(cosh.getI(), 1.0686074213827783);
});

test('real matrix add, subtract, and multiply', () => {
	const a = matrix([[1, 2], [3, 4]]);
	const b = matrix([[5, 6], [7, 8]]);

	assert.deepEqual(a.add(b).m, [[6, 8], [10, 12]]);
	assert.deepEqual(a.sub(b).m, [[-4, -4], [-4, -4]]);
	assert.deepEqual(a.mul(b).m, [[19, 22], [43, 50]]);
});

test('real matrix inverse and Gaussian solve', () => {
	const a = matrix([
		[3, 5, 2],
		[0, 8, 2],
		[6, 2, 8]
	]);
	const b = matrix([[8], [-7], [26]]);
	const solution = a.invert().mul(b);

	closeTo(solution.m[0][0], 4);
	closeTo(solution.m[1][0], -1);
	closeTo(solution.m[2][0], 0.5);

	const augmentedSolution = matrix([
		[3, 5, 2, 8],
		[0, 8, 2, -7],
		[6, 2, 8, 26]
	]).solveGaussFB();

	closeTo(augmentedSolution.m[0][0], 4);
	closeTo(augmentedSolution.m[1][0], -1);
	closeTo(augmentedSolution.m[2][0], 0.5);

	assert.deepEqual(a.m, [
		[3, 5, 2],
		[0, 8, 2],
		[6, 2, 8]
	]);
});

test('complex matrix add, subtract, multiply, inverse, and Gaussian solve', () => {
	const a = matrix([
		[complex(1, 1), complex(2, 0)],
		[complex(0, -1), complex(3, 2)]
	]);
	const b = matrix([
		[complex(4, -1), complex(1, 2)],
		[complex(2, 3), complex(0, -2)]
	]);

	const sum = a.addCplx(b);
	closeTo(sum.m[0][0].getR(), 5);
	closeTo(sum.m[0][0].getI(), 0);
	closeTo(sum.m[1][1].getR(), 3);
	closeTo(sum.m[1][1].getI(), 0);

	const difference = a.subCplx(b);
	closeTo(difference.m[0][0].getR(), -3);
	closeTo(difference.m[0][0].getI(), 2);
	closeTo(difference.m[1][1].getR(), 3);
	closeTo(difference.m[1][1].getI(), 4);

	const product = a.mulCplx(b);
	closeTo(product.m[0][0].getR(), 9);
	closeTo(product.m[0][0].getI(), 9);
	closeTo(product.m[0][1].getR(), -1);
	closeTo(product.m[0][1].getI(), -1);
	closeTo(product.m[1][0].getR(), -1);
	closeTo(product.m[1][0].getI(), 9);
	closeTo(product.m[1][1].getR(), 6);
	closeTo(product.m[1][1].getI(), -7);

	const c = matrix([
		[complex(3, 0), complex(5, 0), complex(2, 0)],
		[complex(0, 0), complex(8, 0), complex(2, 0)],
		[complex(6, 0), complex(2, 0), complex(8, 0)]
	]);
	const d = matrix([
		[complex(8, 0)],
		[complex(-7, 0)],
		[complex(26, 0)]
	]);
	const complexSolution = c.invertCplx().mulCplx(d);

	closeTo(complexSolution.m[0][0].getR(), 4);
	closeTo(complexSolution.m[0][0].getI(), 0);
	closeTo(complexSolution.m[1][0].getR(), -1);
	closeTo(complexSolution.m[1][0].getI(), 0);
	closeTo(complexSolution.m[2][0].getR(), 0.5);
	closeTo(complexSolution.m[2][0].getI(), 0);

	const augmentedSolution = matrix([
		[complex(3, 0), complex(5, 0), complex(2, 0), complex(8, 0)],
		[complex(0, 0), complex(8, 0), complex(2, 0), complex(-7, 0)],
		[complex(6, 0), complex(2, 0), complex(8, 0), complex(26, 0)]
	]).solveGaussFBCplx();

	closeTo(augmentedSolution.m[0][0].getR(), 4);
	closeTo(augmentedSolution.m[0][0].getI(), 0);
	closeTo(augmentedSolution.m[1][0].getR(), -1);
	closeTo(augmentedSolution.m[1][0].getI(), 0);
	closeTo(augmentedSolution.m[2][0].getR(), 0.5);
	closeTo(augmentedSolution.m[2][0].getI(), 0);
});
