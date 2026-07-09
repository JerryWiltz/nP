// Modified: 2026-07-09
import test from 'node:test';
import assert from 'node:assert/strict';

import {global} from '../src/np-global/index.js';
import {diode1N4148} from '../src/np-diodes/index.js';

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

test('diode1N4148 creates a reciprocal two-port and DC I-V table', () => {
	withGlobal({fList: [1e6, 100e6], Ro: 50, Temp: 293}, () => {
		const diode = diode1N4148();
		const spars = diode.getspars();
		const iv = diode.ivTable(-0.1, 0.1, 3);

		assert.equal(spars.length, 2);
		assert.equal(spars[0].length, 5);
		closeTo(spars[0][2].getR(), spars[0][3].getR());
		closeTo(spars[0][2].getI(), spars[0][3].getI());
		assert.equal(iv[0][0], 'vD');
		assert.equal(iv[0][1], 'iD');
		assert.equal(iv.length, 4);
		assert.ok(iv[1][1] < iv[3][1]);
		assert.equal(diode.diode.partNumber, '1N4148');
		closeTo(diode.diode.bias.totalCapacitance, 4e-12);
	});
});

test('diode1N4148 default DC model is anchored near 10 mA at 1 V', () => {
	withGlobal({fList: [1e9], Ro: 50, Temp: 293}, () => {
		const diode = diode1N4148();
		const iv = diode.ivTable(1, 1, 1);

		closeTo(iv[1][0], 1);
		assert.ok(iv[1][1] > 0.009);
		assert.ok(iv[1][1] < 0.011);
	});
});

test('diode1N4148 reverse breakdown turns on near 100 V', () => {
	withGlobal({fList: [1e9], Ro: 50, Temp: 293}, () => {
		const diode = diode1N4148();
		const beforeBreakdown = diode.ivTable(-99, -99, 1);
		const inBreakdown = diode.ivTable(-102, -102, 1);

		assert.ok(Math.abs(beforeBreakdown[1][1]) < 1e-6);
		assert.ok(inBreakdown[1][1] < -100e-6);
		assert.equal(diode.diode.parameters.breakdownVoltage, 100);
	});
});
