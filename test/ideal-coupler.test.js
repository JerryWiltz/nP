// Modified: 2026-10-21
import test from 'node:test';
import assert from 'node:assert/strict';

import * as nP from '../src/index.js';

function close(actual, expected, tolerance = 1e-12) {
	assert.ok(Math.abs(actual - expected) < tolerance, actual + ' differs from ' + expected);
}

test('Coupler180 is matched, reciprocal, isolated, lossless, and frequency independent', () => {
	var frequencies = [0, 2e9, 4e9];
	var coupler = nP.Coupler180({fList: frequencies});
	var amplitude = 1 / Math.sqrt(2);
	var expected = [
		[0, amplitude, 0, amplitude],
		[amplitude, 0, amplitude, 0],
		[0, amplitude, 0, -amplitude],
		[amplitude, 0, -amplitude, 0]
	];
	assert.deepEqual(coupler.getglobal().fList, frequencies);
	for (var bin = 0; bin < frequencies.length; bin++) {
		var row = coupler.spars[bin];
		assert.equal(row[0], frequencies[bin]);
		for (var output = 0; output < 4; output++) {
			for (var input = 0; input < 4; input++) {
				var value = row[1 + output * 4 + input];
				close(value.getR(), expected[output][input]);
				assert.equal(value.getI(), 0);
				assert.equal(coupler.noise[bin].C[output][input].mag(), 0);
			}
		}
		for (var first = 0; first < 4; first++) {
			for (var second = 0; second < 4; second++) {
				var dot = 0;
				for (var port = 0; port < 4; port++) {
					dot += row[1 + first * 4 + port].getR() *
						row[1 + second * 4 + port].getR();
				}
				close(dot, first === second ? 1 : 0);
			}
		}
	}
});

test('Coupler180 routes a short-circuit return to the receiver port', () => {
	var frequencies = [0, 2e9];
	var coupler = nP.Coupler180({couplingDb: 10, fList: frequencies});
	var short = nP.Short({fList: frequencies});
	var load = nP.Load({fList: frequencies});
	var network = nP.nodal(
		[coupler, 1, 2, 3, 4],
		[short, 2],
		[load, 4],
		['out', 1, 3]
	);
	var coupling = 10 ** (-10 / 20);
	var through = Math.sqrt(1 - coupling * coupling);
	for (var i = 0; i < frequencies.length; i++) {
		close(network.spars[i][3].getR(), -through * coupling);
		close(network.spars[i][3].getI(), 0);
	}
	assert.throws(function () { nP.Coupler180({couplingDb: -1}); }, RangeError);
	assert.throws(function () { nP.Coupler180({couplingDb: Infinity}); }, RangeError);
});
