// Modified: 2026-10-14
import test from 'node:test';
import assert from 'node:assert/strict';

import {global} from '../src/np-global/index.js';
import * as components from '../src/np-nport/index.js';

var branches = {
	open: ['C', 'seC', 'seSeRC', 'seSeLC', 'seSeRLC'],
	through: ['paC', 'paSeRC', 'paSeLC', 'paSeRLC', 'sePaRL', 'sePaLC', 'sePaRLC', 'mstep', 'mbend'],
	shuntShort: ['paL', 'paPaRL', 'paPaLC', 'paPaRLC']
};

function checkRow(row, expected) {
	assert.equal(row[0], 0);
	row.slice(1).forEach(function (entry, index) {
		assert.equal(entry.getR(), expected[index]);
		assert.equal(entry.getI(), 0);
	});
}

test('reactive and microstrip junction constructors use exact DC limits', () => {
	var prior = global.fList;
	global.fList = [0, 1e9];
	try {
		for (var [mode, names] of Object.entries(branches)) {
			var expected = mode === 'open' ? [1, 0, 0, 1] :
				mode === 'shuntShort' ? [-1, 0, 0, -1] : [0, 1, 1, 0];
			for (var name of names) {
				var stage = components[name]();
				checkRow(stage.spars[0], expected);
				assert.equal(stage.spars[1][0], 1e9);
				for (var noiseRow of stage.noise[0].C) {
					for (var value of noiseRow) {
						assert.ok(Number.isFinite(value.getR()));
						assert.ok(Number.isFinite(value.getI()));
					}
				}
			}
		}
		var R = 75;
		var Zo = global.Ro;
		checkRow(components.sePaRC().spars[0], [R / (R + 2 * Zo), 2 * Zo / (R + 2 * Zo),
			2 * Zo / (R + 2 * Zo), R / (R + 2 * Zo)]);
		checkRow(components.paPaRC().spars[0], [-Zo / (2 * R + Zo), 2 * R / (2 * R + Zo),
			2 * R / (2 * R + Zo), -Zo / (2 * R + Zo)]);
		var cross = components.mcross();
		assert.equal(cross.spars[0].length, 17);
		cross.spars[0].slice(1).forEach(function (value, index) {
			var expectedCross = Math.floor(index / 4) === index % 4 ? -0.5 : 0.5;
			assert.equal(value.getR(), expectedCross);
			assert.equal(value.getI(), 0);
		});
		assert.ok(cross.noise[0].C.flat().every(function (value) {
			return Number.isFinite(value.getR()) && Number.isFinite(value.getI());
		}));
		var lowFrequencyCross = components.mcross({fList: [1]});
		lowFrequencyCross.spars[0].slice(1).forEach(function (value, index) {
			var expectedCross = Math.floor(index / 4) === index % 4 ? -0.5 : 0.5;
			assert.equal(value.getR(), expectedCross);
		});
	} finally {
		global.fList = prior;
	}
});
