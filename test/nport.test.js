import test from 'node:test';
import assert from 'node:assert/strict';

import { global } from '../src/np-global/index.js';
import { seR, Open, Short, Load, cascade } from '../src/np-nport/index.js';

const closeTo = (actual, expected, tolerance = 1e-12) => {
	assert.ok(
		Math.abs(actual - expected) <= tolerance,
		`${actual} not within ${tolerance} of ${expected}`
	);
};

const withGlobal = (settings, fn) => {
	const previous = {
		fList: global.fList,
		Ro: global.Ro,
		Temp: global.Temp
	};

	global.fList = settings.fList ?? previous.fList;
	global.Ro = settings.Ro ?? previous.Ro;
	global.Temp = settings.Temp ?? previous.Temp;

	try {
		return fn();
	} finally {
		global.fList = previous.fList;
		global.Ro = previous.Ro;
		global.Temp = previous.Temp;
	}
};

test('Open, Short, and Load create expected one-port reflection coefficients', () => {
	withGlobal({ fList: [1e9], Ro: 50 }, () => {
		closeTo(Open().getspars()[0][1].getR(), 1);
		closeTo(Open().getspars()[0][1].getI(), 0);

		closeTo(Short().getspars()[0][1].getR(), -1);
		closeTo(Short().getspars()[0][1].getI(), 0);

		closeTo(Load().getspars()[0][1].getR(), 0);
		closeTo(Load().getspars()[0][1].getI(), 0);
	});
});

test('series resistor at 50 ohms has expected two-port S-parameters with 50 ohm reference', () => {
	withGlobal({ fList: [1e9], Ro: 50 }, () => {
		const spars = seR(50).getspars()[0];

		assert.equal(spars[0], 1e9);
		closeTo(spars[1].getR(), 1 / 3);
		closeTo(spars[1].getI(), 0);
		closeTo(spars[2].getR(), 2 / 3);
		closeTo(spars[2].getI(), 0);
		closeTo(spars[3].getR(), 2 / 3);
		closeTo(spars[3].getI(), 0);
		closeTo(spars[4].getR(), 1 / 3);
		closeTo(spars[4].getI(), 0);
	});
});

test('method cascade and cascade helper agree for simple two-port chains', () => {
	withGlobal({ fList: [1e9, 2e9], Ro: 50 }, () => {
		const r1 = seR(25);
		const r2 = seR(75);

		const method = r1.cas(r2).getspars();
		const helper = cascade(seR(25), seR(75)).getspars();

		assert.equal(method.length, helper.length);

		for (let row = 0; row < method.length; row++) {
			assert.equal(method[row][0], helper[row][0]);
			for (let col = 1; col < method[row].length; col++) {
				closeTo(method[row][col].getR(), helper[row][col].getR());
				closeTo(method[row][col].getI(), helper[row][col].getI());
			}
		}
	});
});
