// Modified: 2026-10-21
import test from 'node:test';
import assert from 'node:assert/strict';

import {global} from '../src/np-global/index.js';
import * as nP from '../src/np-nport/index.js';

test('every built-in n-port constructor accepts its own frequency list', () => {
	var previous = {fList: global.fList, twoTone: global.twoTone};
	var fList = [1e9, 1.5e9];
	var options = {fList: fList};
	var cases = [];
	global.fList = [2e9];
	global.twoTone = undefined;
	try {
		['R', 'seR', 'paR'].forEach(function (name) {
			cases.push([name, function () { return nP[name](options); }]);
		});
		['L', 'seL', 'paL', 'C', 'seC', 'paC', 'trf', 'trf4Port'].forEach(function (name) {
			cases.push([name, function () { return nP[name](undefined, options); }]);
		});
		['seSeRL', 'sePaRL', 'paSeRL', 'paPaRL', 'seSeRC', 'sePaRC', 'paSeRC', 'paPaRC',
			'seSeLC', 'sePaLC', 'paSeLC', 'paPaLC'].forEach(function (name) {
			cases.push([name, function () { return nP[name](undefined, undefined, options); }]);
		});
		['seSeRLC', 'sePaRLC', 'paSeRLC', 'paPaRLC'].forEach(function (name) {
			cases.push([name, function () { return nP[name](undefined, undefined, undefined, options); }]);
		});
		['Open', 'Short', 'Thru', 'Load', 'Shift90', 'Tee', 'Tee4', 'Tee5', 'seriesTee', 'Coupler180'].forEach(function (name) {
			cases.push([name, function () { return nP[name](options); }]);
		});
		cases.push(['Tlin', function () { return nP.Tlin(undefined, undefined, options); }]);
		cases.push(['Tclin', function () { return nP.Tclin(undefined, undefined, undefined, options); }]);
		cases.push(['Attn', function () { return nP.Attn(3, global.Temp, options); }]);
		cases.push(['Amp', function () { return nP.Amp(20, 4, 290, options); }]);
		['mlin', 'mclin', 'mtee', 'mcross', 'mstep', 'mbend', 'mtfr', 'mvgnd', 'mvia'].forEach(function (name) {
			cases.push([name, function () { return nP[name](options); }]);
		});
		cases.push(['diode1N4148', function () { return nP.diode1N4148(options); }]);
		cases.push(['lpfGen', function () { return nP.lpfGen(undefined, options); }]);

		assert.equal(cases.length, 52);
		cases.forEach(function ([name, make]) {
			var component = make();
			assert.deepEqual(component.spars.map(function (row) { return row[0]; }), fList, name + ' S frequencies');
			assert.deepEqual(component.noise.map(function (row) { return row.frequency; }), fList, name + ' noise frequencies');
			assert.deepEqual(component.getglobal().fList, fList, name + ' settings');
			assert.notStrictEqual(component.getglobal().fList, fList, name + ' list copy');
		});
		assert.deepEqual(global.fList, [2e9]);
	} finally {
		global.fList = previous.fList;
		global.twoTone = previous.twoTone;
	}
});

test('two separate circuits retain their own rows and analysis settings', () => {
	var previous = {fList: global.fList, twoTone: global.twoTone};
	var a = [1e9, 1.5e9];
	var b = [3e9, 3.5e9, 4e9];
	global.fList = [2e9];
	global.twoTone = undefined;
	try {
		var ampA = nP.Amp({gainDb: 20, fList: a});
		var attnA = nP.Attn({attenuationDb: 3, fList: a});
		var circuitA = nP.cascade(ampA, attnA);
		var ampB = nP.Amp({gainDb: 20, fList: b});
		var attnB = nP.Attn({attenuationDb: 3, fList: b});
		var circuitB = nP.nodal([ampB, 1, 2], [attnB, 2, 3], ['out', 1, 3]);
		global.fList = [9e9];
		assert.deepEqual(circuitA.out('s21dB').slice(1).map(function (row) { return row[0]; }), a);
		assert.deepEqual(circuitB.out('s21dB').slice(1).map(function (row) { return row[0]; }), b);
		assert.deepEqual(circuitA.getglobal().fList, a);
		assert.deepEqual(circuitB.getglobal().fList, b);
		assert.throws(function () { nP.cascade(ampA, attnB); }, /matching frequency rows/);
		assert.throws(function () { nP.nodal([ampA, 1, 2], [attnB, 2, 3], ['out', 1, 3]); }, /matching frequency rows/);
	} finally {
		global.fList = previous.fList;
		global.twoTone = previous.twoTone;
	}
});

test('an explicit first-tone list controls product rows and display rows', () => {
	var previous = {fList: global.fList, twoTone: global.twoTone};
	global.fList = [2e9];
	global.twoTone = {spacingHz: 1e8, p1dBm: -30, p2dBm: -25};
	try {
		var amp = nP.Amp({fList: [1e9]});
		var attn = nP.Attn({fList: [1e9]});
		assert.deepEqual(amp.spars.map(function (row) { return row[0]; }),
			[1e8, 9e8, 1e9, 1.1e9, 1.2e9, 2e9, 2.1e9, 2.2e9]);
		assert.deepEqual(attn.spars.map(function (row) { return row[0]; }),
			amp.spars.map(function (row) { return row[0]; }));
		assert.deepEqual(amp.out('s21dB').slice(1).map(function (row) { return row[0]; }), [1e9]);
	} finally {
		global.fList = previous.fList;
		global.twoTone = previous.twoTone;
	}
});
