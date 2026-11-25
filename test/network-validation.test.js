// Modified: 2026-11-24
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';

function context(referenceImpedance = 50, frequencies = [1e9]) {
    const settings = nP.global();
    settings.Ro = referenceImpedance;
    settings.fList = frequencies;
    return settings;
}

function forbidDcAccess(part) {
    Object.defineProperty(part, '_dcModel', {get() { throw new Error('DC model accessed before validation'); }});
    return part;
}

test('all public composition paths reject different construction reference impedances', () => {
    const saved = nP.global();
    try {
        context(50);
        const first = nP.R(50);
        context(75);
        const second = nP.R(50);
        for (const connect of [() => first.cas(second), () => nP.cascade(first, second),
            () => nP.nodal([first, 1, 2], [second, 2, 3], ['out', 1, 3]),
            () => nP.nodal({series: [[second, 'b', 'c'], [first, 'a', 'b']]}, ['out', 'a', 'c'])]) {
            assert.throws(connect, /same reference impedance Ro/);
        }
    } finally { nP.global(saved); }
});

test('composition uses compatible captured contexts rather than the currently selected global', () => {
    const saved = nP.global();
    try {
        context(50, [1e9, 2e9]);
        const first = nP.R(50);
        context(50, [1e9, 2e9]);
        const second = nP.R(50), before = structuredClone([first.spars, second.spars]);
        context(75, [3e9]);
        const results = [first.cas(second), nP.cascade(first, second),
            nP.nodal([first, 1, 2], [second, 2, 3], ['out', 1, 3])];
        for (const network of results) {
            assert.equal(network.global.Ro, 50);
            assert.deepEqual(network.spars.map(row => row[0]), [1e9, 2e9]);
            for (const row of network.spars) assert.ok(Math.abs(row[3].x - 0.5) < 1e-12);
        }
        assert.deepEqual(structuredClone([first.spars, second.spars]), before);
        assert.deepEqual(results[0].noise, results[1].noise);
    } finally { nP.global(saved); }
});

test('all cascade arguments and nodal compatibility are checked before DC inspection', () => {
    const saved = nP.global();
    try {
        context();
        const first = forbidDcAccess(nP.R()), second = nP.R();
        context(75);
        const mismatched = nP.R();
        assert.throws(() => first.cas(mismatched), /same reference impedance Ro/);
        assert.throws(() => nP.cascade(first, second, mismatched), /same reference impedance Ro/);
        assert.throws(() => nP.nodal([first, 1, 2], [mismatched, 2, 3], ['out', 1, 3]), /same reference impedance Ro/);
        context(50, [2e9]);
        const otherFrequency = nP.R();
        assert.throws(() => first.cas(otherFrequency), /matching frequency rows/);
        assert.throws(() => nP.cascade(first, second, otherFrequency), /matching frequency rows/);
        assert.throws(() => nP.nodal([first, 1, 2], [otherFrequency, 2, 3], ['out', 1, 3]), /matching frequency rows/);
    } finally { nP.global(saved); }
});

test('nodal rejects dangling, multiply used and duplicate output labels', () => {
    const saved = nP.global();
    try {
        context();
        const r = nP.R(50);
        const cases = [
            [[r, 1, 2], ['out', 1, 9]],
            [[r, 1, 2], [r, 2, 3], [r, 2, 4], ['out', 1, 3, 4]],
            [[r, 1, 2], [r, 2, 3], [r, 2, 4], [r, 2, 5], ['out', 1, 3, 4, 5]],
            [[r, 1, 2], ['out', 1, 2, 3, 3]],
            [{series: [[r, 'a', 'junction'], [r, 'junction', 'b']]}, [r, 'junction', 'c'], ['out', 'a', 'b', 'c']],
            [[r, 1, '1'], ['out', 1, 2]]
        ];
        for (const rows of cases) assert.throws(() => nP.nodal(...rows), /nodal\(\).*label/);
        assert.throws(() => nP.nodal([r, 1, NaN], ['out', 1, NaN]), /finite numbers/);
    } finally { nP.global(saved); }
});

test('invalid node multiplicity is rejected before DC inspection and independent of row order', () => {
    const saved = nP.global();
    try {
        context();
        const r = forbidDcAccess(nP.R(50));
        const rows = [[r, 1, 2], [r, 2, 3], [r, 2, 4]];
        for (const ordered of [rows, rows.slice().reverse()]) {
            assert.throws(() => nP.nodal(...ordered, ['out', 1, 3, 4]), /label 2 appears 3 times/);
        }
    } finally { nP.global(saved); }
});

test('explicit junctions, reused objects, mixed label types and groups remain valid', () => {
    const saved = nP.global();
    try {
        context();
        const r = nP.R(50), tee = nP.Tee();
        const rows = [[tee, 'input', 1, '1'], [r, 1, 'left'], [r, '1', 'right']];
        const output = ['out', 'input', 'left', 'right'];
        const flat = nP.nodal(...rows, output), grouped = nP.nodal({junction: [rows[0]]}, {branches: rows.slice(1)}, output);
        const reversed = nP.nodal(...rows.slice().reverse(), output);
        assert.deepEqual(grouped.spars, flat.spars);
        assert.deepEqual(grouped.noise, flat.noise);
        for (let col = 1; col < flat.spars[0].length; col++) {
            assert.ok(flat.spars[0][col].sub(reversed.spars[0][col]).mag() < 1e-12);
        }
        assert.deepEqual(rows.map(row => row.slice(1)), [['input', 1, '1'], [1, 'left'], ['1', 'right']]);
        assert.deepEqual(output, ['out', 'input', 'left', 'right']);
    } finally { nP.global(saved); }
});
