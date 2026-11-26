// Modified: 2026-11-26
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as nP from '../src/index.js';
import {withCurveOutput} from '../src/np-nport/src/curveOutput';

function setup() { const g = nP.global(); g.fList = [1e9]; }
function rows(table) { return table.slice(1); }
function scaledRows(table, xScale, yScale) { return rows(table).map(row => row.map((value, col) => value * (col ? yScale : xScale))); }

test('BJT output preserves each polarity, configuration, swept voltage and stepped current family', () => {
    setup();
    for (const name of ['NPN', 'PNP']) for (const configuration of ['commonEmitter', 'commonBase', 'commonCollector']) {
        const cb = configuration === 'commonBase', axis = cb ? 'vcb' : 'vce', current = configuration === 'commonCollector' ? 'ie' : 'ic';
        const q = nP[name]({configuration}), before = JSON.stringify(q);
        const curve = q.ivTable({[cb ? 'ie' : 'ib']: {points: 2}, [axis]: {points: 3}});
        assert.ok(Array.isArray(curve));
        assert.equal(curve.length, 4); assert.equal(curve[0].length, 3);
        assert.deepEqual(curve.out(current), curve);
        const table = curve.out(axis + 'mV', current + 'mA', {label: 'Q1'});
        assert.equal(table[0][0], axis + ' (mV)');
        assert.match(table[0][1], new RegExp('Q1: ' + current + ' \\(mA\\), ' + (cb ? 'ie' : 'ib') + '='));
        assert.deepEqual(rows(table), scaledRows(curve, 1e3, 1e3));
        assert.equal(JSON.stringify(q), before);
        assert.throws(() => curve.out(current === 'ic' ? 'ie' : 'ic'), /unavailable/);
    }
});

test('all FET constructors share scaled current families without changing RF, bias or curves', () => {
    setup();
    for (const name of ['NJF', 'PJF', 'NMOS', 'PMOS', 'MESFET', 'HEMT']) {
        const q = nP[name](), before = JSON.stringify(q);
        const curve = q.ivTable({vgs: {points: 2}, vds: {points: 3}});
        assert.deepEqual(curve.out('id'), curve);
        assert.deepEqual(rows(curve.out('vdsuV', 'iduA')), scaledRows(curve, 1e6, 1e6));
        assert.match(curve.out('idmA')[0][2], /id \(mA\), vgs=/);
        assert.equal(JSON.stringify(q), before);
    }
    const four = nP.PMOS({body: 'external'});
    const curve = four.ivTable({vgs: {points: 2}, vds: {points: 3}, vbs: .5});
    assert.deepEqual(rows(curve.out('idmA')), scaledRows(curve, 1, 1e3));
});

test('junction, Schottky, Zener, both PIN families and legacy diode retain compatible plain tables', () => {
    setup();
    const parts = [nP.D(), nP.D({model: 'SMS7630'}), nP.D({model: 'BZX384-B4V7'}),
        nP.PIN(), nP.PIN({model: 'SMP1307-011LF'}), nP.diode1N4148()];
    for (const part of parts) {
        const before = JSON.stringify(part), legacy = part._dcModel.constructorName === 'diode1N4148';
        const curve = legacy ? part.ivTable(-.1, .1, 3) : part.ivTable({vd: {points: 3}});
        assert.deepEqual(curve[0], legacy ? ['vD', 'iD'] : ['vd (V)', 'id (A)']);
        const options = vm.runInNewContext('Object.freeze({label:"D1"})');
        assert.deepEqual(curve.out('idmA', options)[0], ['vd (V)', 'D1 (mA)']);
        assert.deepEqual(rows(curve.out('idmA', options)), scaledRows(curve, 1, 1e3));
        for (const [suffix, scale] of [['A', 1], ['mA', 1e3], ['uA', 1e6], ['nA', 1e9], ['pA', 1e12]]) {
            assert.deepEqual(rows(curve.out('id' + suffix)), scaledRows(curve, 1, scale));
        }
        assert.equal(JSON.stringify(part), before);
        assert.equal(structuredClone(curve).out, undefined);
        assert.deepEqual(structuredClone(curve), curve);
        assert.equal(JSON.stringify(curve), JSON.stringify(curve.map(row => row.slice())));
    }
});

test('C-V output selects and reorders measurements and converts units inside the library', () => {
    setup();
    const d = nP.D({model: 'SMV1231-079LF'}), before = JSON.stringify(d);
    const curve = d.cvTable({vr: {start: 0, stop: 15, points: 3}});
    assert.deepEqual(curve.out('cj', 'ct'), curve);
    assert.deepEqual(curve.out('vrmV', 'ctpF', 'cjfF', {label: 'Varactor'})[0],
        ['vr (mV)', 'Varactor: ct (pF)', 'Varactor: cj (fF)']);
    assert.deepEqual(rows(curve.out('vrmV', 'ctpF', 'cjfF')), rows(curve).map(([v, cj, ct]) => [v * 1e3, ct * 1e12, cj * 1e15]));
    assert.deepEqual(rows(curve.out('cjpF')), rows(curve).map(([v, cj]) => [v, cj * 1e12]));
    assert.equal(JSON.stringify(d), before);
});

test('curve output retains original SI samples independently of legacy-array and display-table edits', () => {
    setup();
    const curve = nP.D().ivTable({vd: {points: 3}}), expected = curve.out('iduA');
    assert.equal(Object.getOwnPropertyDescriptor(curve, 'out').enumerable, false);
    assert.equal(Object.getOwnPropertyDescriptor(curve, 'out').writable, false);
    const table = curve.out('iduA'); table[0][1] = 'Changed'; table[1][1] = 99;
    curve[0][0] = 'Legacy label edit'; curve[1][0] = 33; curve[1][1] = 123;
    assert.deepEqual(curve.out('iduA'), expected);
    assert.deepEqual(curve.out('iduA', Object.freeze({})), expected);
    assert.throws(() => curve.out.call(structuredClone(curve), 'id'), /original curve table/);
});

test('curve output rejects missing, unavailable, misplaced or dimensionally invalid selections', () => {
    setup();
    const curve = nP.D().cvTable({vr: {points: 3}}), before = JSON.stringify(curve);
    for (const selectors of [[], [{label: 'D1'}], ['vr'], ['typo'], ['__proto__'], [9],
        ['cj', 'vr'], ['vd', 'cj'], ['id'], ['cjA'], ['vrpF', 'cj'], ['cj', 'cjF'],
        ['cj', null], ['cj', []], ['cj', {label: ''}], ['cj', {label: 9}], ['cj', {unknown: 1}]]) {
        assert.throws(() => curve.out(...selectors));
    }
    assert.equal(JSON.stringify(curve), before);
});

test('named and supplied records produce identical selected curve data and labels', () => {
    setup();
    for (const name of ['NPN', 'PNP', 'NJF', 'PJF', 'NMOS', 'PMOS', 'MESFET', 'HEMT', 'D', 'PIN']) {
        const named = nP[name](), supplied = nP[name]({model: named.model});
        const bjt = name === 'NPN' || name === 'PNP', diode = name === 'D' || name === 'PIN';
        const settings = bjt ? {ib: {points: 2}, vce: {points: 3}} : diode ? {vd: {points: 3}} : {vgs: {points: 2}, vds: {points: 3}};
        const selected = bjt ? 'icuA' : 'iduA';
        assert.deepEqual(named.ivTable(settings).out(selected, {label: 'Device'}), supplied.ivTable(settings).out(selected, {label: 'Device'}));
    }
    const named = nP.D({model: 'SMV1231-079LF'}), supplied = nP.D({model: named.model});
    assert.deepEqual(named.cvTable().out('cjpF', 'ctpF'), supplied.cvTable().out('cjpF', 'ctpF'));
});

test('shared formatting distinguishes close bias steps and rejects nonfinite display values', () => {
    const table = withCurveOutput([['vce (V)', 'a', 'b'], [1, 1, 2]], {
        axis: 'vce', measurements: ['ic'], step: {name: 'ib', values: [10e-6, 10.0000001e-6]}
    });
    assert.notEqual(table.out('icmA')[0][1], table.out('icmA')[0][2]);
    const overflow = withCurveOutput([['vd', 'id'], [Number.MAX_VALUE, 1]], {axis: 'vd', measurements: ['id']});
    assert.throws(() => overflow.out('vdmV', 'id'), /finite/);
    const invalid = withCurveOutput([['vd', 'id'], [0, Infinity]], {axis: 'vd', measurements: ['id']});
    assert.throws(() => invalid.out('id'), /finite/);
});
