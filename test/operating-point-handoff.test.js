// Modified: 2026-11-17
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {gummelPoon} from '../src/np-nport/src/transistors/bjt/gummelPoon';

function close(actual, expected, absolute = 1e-12, relative = 1e-11) {
    assert.ok(Number.isFinite(actual) && Number.isFinite(expected));
    assert.ok(Math.abs(actual - expected) <= absolute + relative * Math.abs(expected), `${actual} differs from ${expected}`);
}
function sameRf(actual, expected) {
    assert.deepEqual(actual.spars.map(row => row[0]), expected.spars.map(row => row[0]));
    for (let row = 0; row < actual.spars.length; row++) {
        for (let col = 1; col < actual.spars[row].length; col++) close(actual.spars[row][col].sub(expected.spars[row][col]).mag(), 0);
        for (let i = 0; i < actual.noise[row].C.length; i++) {
            for (let j = 0; j < actual.noise[row].C.length; j++) {
                close(actual.noise[row].C[i][j].sub(expected.noise[row].C[i][j]).mag(), 0, 1e-29);
            }
        }
    }
}
function state(q, path = '', ve = 0) {
    return {path, intrinsicVbe: q.bias.intrinsicVbe, intrinsicVbc: q.bias.intrinsicVbc, ve};
}
function commonEmitter(q, options) {
    const rows = [[q, 1, 2, 3], [nP.Short({fList: q.global.fList}), 3], ['out', 1, 2]];
    if (options) rows.push(options);
    return nP.nodal(...rows);
}
function snapshot(q) {
    return structuredClone({spars: q.spars, noise: q.noise, bias: q.bias, qPoint: q.qPoint,
        dc: q.dc, smallSignal: q.smallSignal, model: q._dcModel});
}
function sameSignal(actual, expected) {
    assert.deepEqual(actual.signal.fList, expected.signal.fList);
    actual.signal.rows.forEach((row, index) => row.waves.forEach((value, port) =>
        close(value.sub(expected.signal.rows[index].waves[port]).mag(), 0)));
}

for (const [constructor, model, polarity] of [[nP.NPN, '2N3904', 1], [nP.NPN, 'BFR93A', 1], [nP.PNP, '2N3906', -1]]) {
    test(model + ' handoff rebuilds RF/noise from solved junctions in every configuration', () => {
        for (const configuration of ['commonEmitter', 'commonBase', 'commonCollector']) {
            const cb = configuration === 'commonBase';
            const options = {model, configuration, temperature: 320, fList: [0, 10e6, 500e6],
                bias: cb ? {ie: {points: 2}, vcb: {points: 3}} : {ib: {points: 2}, vce: {points: 3}}};
            const template = constructor(options), before = snapshot(template);
            const target = constructor({...options, qPoint: cb ? {ie: polarity * 3e-3, vcb: polarity * 4} :
                {ib: polarity * 40e-6, vce: polarity * 3}});
            const rebuilt = template._withOperatingPoints([state(target, '', 2)]);
            assert.notEqual(rebuilt, template);
            assert.notEqual(rebuilt._intermod, template._intermod);
            assert.notEqual(rebuilt._intermod.rows, template._intermod.rows);
            sameRf(rebuilt, target);
            assert.deepEqual(rebuilt.smallSignal, target.smallSignal);
            assert.deepEqual(rebuilt.dc, template.dc);
            assert.deepEqual(rebuilt.ivTable(), template.ivTable());
            close(rebuilt.bias.ib, target.bias.ib);
            close(rebuilt.bias.ic, target.bias.ic);
            close(rebuilt.bias.ie, target.bias.ie);
            close(rebuilt.bias.vb, 2 + target.bias.vbe);
            close(rebuilt.bias.vc, 2 + target.bias.vce);
            assert.equal(rebuilt.bias.ve, 2);
            assert.equal(rebuilt._dcModel, template._dcModel, 'construction seed stays separate from solved state');
            assert.deepEqual(snapshot(template), before);
        }
    });
}

test('signed intrinsic states allow reverse operation, cutoff and floating absolute voltages', () => {
    for (const [constructor, polarity] of [[nP.NPN, 1], [nP.PNP, -1]]) {
        const template = constructor({fList: [1e6]});
        for (const [vbe, vbc] of [[-0.2, -0.3], [-0.2, 0.6]]) {
            const point = {path: '', intrinsicVbe: polarity * vbe, intrinsicVbc: polarity * vbc, ve: null};
            const q = template._withOperatingPoints([point]);
            const currents = gummelPoon(template._intermod.p, vbe, vbc, false).currents;
            close(q.bias.ib, polarity * currents[0][0], 1e-25);
            close(q.bias.ic, polarity * currents[1][0], 1e-25);
            close(q.bias.ie, -polarity * currents[2][0], 1e-25);
            assert.equal(q.bias.vb, null); assert.equal(q.bias.vc, null); assert.equal(q.bias.ve, null);
            assert.ok(q.spars[0].slice(1).every(value => Number.isFinite(value.x) && Number.isFinite(value.y)));
            if (vbc < 0) assert.ok(q.bias.ib * polarity < 0, 'negative cutoff leakage is not clipped');
            else assert.ok(q.bias.vce * polarity < 0, 'reverse-active voltage is not replaced by a default');
        }
    }
});

test('nested/reused transistor templates receive independent points and refresh enclosing RF/noise/IM', () => {
    const previous = {...nP.global};
    try {
        nP.global.fList = [10e6];
        nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
        const q = nP.NPN({model: 'BFR93A'}), before = snapshot(q);
        const child = commonEmitter(q), original = nP.cascade(child, child);
        const first = nP.NPN({model: 'BFR93A', qPoint: {ib: 30e-6, vce: 3}});
        const second = nP.NPN({model: 'BFR93A', qPoint: {ib: 50e-6, vce: 5}});
        const expected = nP.cascade(commonEmitter(first), commonEmitter(second));
        const points = [state(first, 'p1/p1'), state(second, 'p2/p1')];
        nP.global.fList = [2e9]; nP.global.twoTone.spacingHz = 3e6;
        const rebuilt = original._withOperatingPoints(points);
        sameRf(rebuilt, expected);
        assert.notEqual(rebuilt._rfModel.components[0], rebuilt._rfModel.components[1]);
        close(rebuilt._rfModel.components[0]._rfModel.components[0].bias.ib, first.bias.ib);
        close(rebuilt._rfModel.components[1]._rfModel.components[0].bias.ib, second.bias.ib);
        assert.equal(rebuilt._schematic, original._schematic);
        assert.equal(rebuilt._dcModel, original._dcModel);
        assert.deepEqual(rebuilt.global, original.global);
        const selectors = ['OIP2sum21dBm', 'OIP3lower21dBm', 'IM3lower21dBm', 'NF21dB'];
        const actualProducts = rebuilt.out(...selectors), expectedProducts = expected.out(...selectors);
        actualProducts[1].slice(1).forEach((value, index) => close(value, expectedProducts[1][index + 1], 1e-9));
        assert.deepEqual(snapshot(q), before);
        points[0].intrinsicVbe = 99;
        assert.notEqual(rebuilt._operatingPoints[0].intrinsicVbe, 99);
        assert.ok(Object.isFrozen(rebuilt._operatingPoints[0]));
    } finally { Object.assign(nP.global, previous); }
});

test('nodal groups, output order and two reused placements survive rebuilding', () => {
    const q = nP.NPN({fList: [1e6]}), first = nP.NPN({fList: [1e6], qPoint: {ib: 10e-6}});
    const second = nP.NPN({fList: [1e6], qPoint: {ib: 50e-6}});
    const original = nP.nodal({pair: [[q, 1, 2, 3], [q, 4, 5, 6]]}, ['out', 6, 2, 1, 5, 3, 4]);
    const expected = nP.nodal({pair: [[first, 1, 2, 3], [second, 4, 5, 6]]}, ['out', 6, 2, 1, 5, 3, 4]);
    const rebuilt = original._withOperatingPoints([state(first, 'p1'), state(second, 'p2')]);
    sameRf(rebuilt, expected);
    assert.deepEqual(rebuilt._dcModel.definition.externalNodes, [6, 2, 1, 5, 3, 4]);
    assert.deepEqual(rebuilt._dcModel.definition.groups, [{name: 'pair', components: [0, 1]}]);
    assert.equal(rebuilt._schematic, original._schematic);
});

test('external input signals are replayed through rebuilt S, including one-stage cascade copies', () => {
    const previous = {...nP.global};
    try {
        nP.global.fList = [];
        nP.global.tList = nP.global.tGen(0, 1e-6, 1001);
        const tx = nP.mod({mode: 'AM', carrierHz: 100e6, toneHz: 1e6});
        const q = nP.NPN(), target = nP.NPN({qPoint: {ib: 50e-6, vce: 4}});
        const original = commonEmitter(q, {signal: tx});
        const expected = commonEmitter(target, {signal: tx});
        const copied = nP.cascade(commonEmitter(q), {signal: tx});
        const twiceDriven = nP.cascade(copied, {signal: tx, inputPort: 2});
        const twiceExpected = nP.cascade(nP.cascade(commonEmitter(target), {signal: tx}), {signal: tx, inputPort: 2});
        expected.signal.fList = expected.signal.fList.slice();
        twiceExpected.signal.fList = twiceExpected.signal.fList.slice();
        tx.spectrum[0].setR(999); tx.fList[0] = 7;
        const before = structuredClone(original.signal);
        const rebuilt = original._withOperatingPoints([state(target, 'p1')]);
        const copyRebuilt = copied._withOperatingPoints([state(target, 'p1')]);
        sameRf(rebuilt, expected); sameSignal(rebuilt, expected); sameSignal(copyRebuilt, expected);
        const twiceRebuilt = twiceDriven._withOperatingPoints([state(target, 'p1')]);
        sameSignal(twiceRebuilt, twiceExpected);
        assert.equal(twiceRebuilt._rfInputSignals.length, 2);
        assert.deepEqual(structuredClone(original.signal), before);
        assert.ok(rebuilt.signal.rows.some((row, index) => row.waves[1].sub(original.signal.rows[index].waves[1]).mag() > 1e-12));
    } finally { Object.assign(nP.global, previous); }
});

test('handoff rejects missing/duplicate/unknown points, malformed states and unsupported devices', () => {
    const q = nP.NPN({fList: [1e6]}), point = state(q), before = snapshot(q);
    assert.throws(() => q._withOperatingPoints({}), /array/);
    assert.throws(() => q._withOperatingPoints([]), /Missing operating point/);
    assert.throws(() => q._withOperatingPoints([point, point]), /Duplicate/);
    assert.throws(() => q._withOperatingPoints([{...point, path: 'p99'}]), /Unknown/);
    assert.throws(() => q._withOperatingPoints([{...point, intrinsicVbe: NaN}]), /finite/);
    assert.throws(() => q._withOperatingPoints([{...point, ve: Infinity}]), /finite/);
    assert.throws(() => q._withOperatingPoints([{...point, intrinsicVbc: undefined}]), /finite/);
    assert.throws(() => q._withOperatingPoints([{...point, ib: 1e-3}]), /Unknown/);
    assert.throws(() => q._withOperatingPoints([{...point, intrinsicVbe: 1000}]), /model domain/);
    assert.throws(() => nP.D({fList: [1e6]})._withOperatingPoints([point]), /No RF operating-point adapter/);
    const pair = nP.nodal([q, 1, 2, 3], [q, 4, 5, 6], ['out', 1, 2, 3, 4, 5, 6]);
    assert.throws(() => pair._withOperatingPoints([state(q, 'p1')]), /Missing operating point at p2/);
    assert.deepEqual(snapshot(q), before);
    assert.equal(q.solveDC().operatingPoints[0].intrinsicVbe, 0);
    assert.deepEqual(snapshot(q), before, 'an explicit DC result does not mutate the fixed-Q template');
});
