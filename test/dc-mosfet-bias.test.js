// Modified: 2026-11-19
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {mosfetNetwork} from './fixtures/mosfet-network';
import {jfetNetwork} from './fixtures/jfet-network';
import {mosfetDcReference} from './fixtures/mosfet-dc-reference';
function close(a, b, tolerance = 1e-9) { assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`); }
function sameRf(a, b) {
    a.spars.forEach((row, i) => row.slice(1).forEach((z, j) => close(z.sub(b.spars[i][j + 1]).mag(), 0, 1e-8)));
    a.noise.forEach(({C}, k) => C.forEach((row, i) => row.forEach((z, j) => close(z.sub(b.noise[k].C[i][j]).mag(), 0, 1e-26))));
}
for (const reference of mosfetDcReference) test(reference.name + ' ' + reference.body + ' external divider bias matches SPICE and reconstructs RF/noise/nonlinearity', () => {
    const saved = {...nP.global};
    try {
        const {name, body, temperature} = reference;
        nP.global.fList = [10e6, 100e6]; nP.global.Temp = temperature;
        nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
        const q = nP[name]({body}), before = JSON.stringify(q), curves = q.ivTable();
        const network = mosfetNetwork({name, q}), dc = network.operatingPoint, point = dc.components[2].qPoint;
        for (const key of ['vg', 'vd', 'vs', 'id', 'bodyCurrent']) close(point[key], reference[key], key === 'id' || key === 'bodyCurrent' ? 1e-10 : 2e-7);
        close(point.ig, 0); close(point.terminalCurrents.reduce((sum, value) => sum + value, 0), 0, 1e-12);
        close(point.vg, (name === 'NMOS' ? 12 : -12) * 47000 / 147000, 1e-9);
        assert.ok(dc.residuals.maxNormalizedResidual <= 1); assert.equal(dc.initialEstimate.method, 'piecewise-mosfet');
        assert.deepEqual(dc.ports.map(port => [port.voltage, port.current]), [[null, 0], [null, 0]]);
        assert.deepEqual(dc.operatingPoints.map(point => point.path), ['p3']);
        assert.ok(Object.isFrozen(dc.operatingPoints[0]));
        const fresh = nP[name]({body, qPoint: {vgs: point.vgs, vds: point.vds, vbs: body === 'source' ? 0 : point.vbs}});
        const components = network._rfModel.components.slice(); components[2] = fresh;
        sameRf(network, network._rfModel.rebuild(components));
        const rebuilt = network._rfModel.components[2];
        assert.notEqual(rebuilt, q); assert.equal(rebuilt._dcModel, q._dcModel); assert.deepEqual(rebuilt.ivTable(), curves);
        assert.equal(JSON.stringify(q), before);
        const changed = mosfetNetwork({name, q, resistance: 1500});
        assert.ok(Math.abs(changed.operatingPoint.components[2].qPoint.id - point.id) > 1e-5);
        const selectors = ['s21dB', 'NF21dB', 'IM3lower21dBm'];
        const low = network.out(...selectors)[1], high = changed.out(...selectors)[1];
        for (let i = 1; i < low.length; i++) assert.ok(Math.abs(low[i] - high[i]) > 1e-4);
        const combined = mosfetNetwork({name, q, source: 'combined'}), unbypassed = mosfetNetwork({name, q, source: 'resistor'});
        close(combined.operatingPoint.components[2].qPoint.id, point.id, 1e-10);
        close(unbypassed.operatingPoint.components[2].qPoint.id, point.id, 1e-10); sameRf(combined, network);
        assert.ok(Math.abs(unbypassed.out('s21dB')[1][1] - low[1]) > 1);
    } finally { Object.assign(nP.global, saved); }
});

test('an independently grounded body changes the operating point; source-tied and grounded bodies are distinct circuits', () => {
    nP.global.fList = [1e6];
    for (const name of ['NMOS', 'PMOS']) {
        const tied = mosfetNetwork({name}), separate = mosfetNetwork({name, q: nP[name]({body: 'external'})});
        const a = tied.operatingPoint.components[2].qPoint, b = separate.operatingPoint.components[2].qPoint;
        close(a.vbs, 0, 1e-8); close(b.vb, 0, 1e-8); close(b.vbs, -b.vs, 1e-8);
        assert.ok(Math.abs(a.id - b.id) > 1e-4);
    }
});

test('floating gates are explicit errors and floating bodies retain their junction-current balance', () => {
    nP.global.fList = [1e6];
    for (const name of ['NMOS', 'PMOS']) {
        const q = nP[name](), before = JSON.stringify(q);
        const network = nP.nodal([q, 1, 2, 3], [nP.Short(), 3], ['out', 1, 2]);
        assert.equal(network.operatingPoint, undefined);
        assert.throws(() => q.solveDC(), error => error.code === 'DC_FLOATING_BIAS' && /gate and body/.test(error.message));
        const unpowered = nP.nodal([q, 1, 2, 3], [nP.Short(), 1], [nP.Short(), 3], ['out', 2]).solveDC();
        close(unpowered.components[0].qPoint.id, 0, 1e-12); close(unpowered.components[0].qPoint.vgs, 0, 1e-8);
        assert.equal(JSON.stringify(q), before);
        const state = {intrinsicVgs: q.bias.intrinsicVgs, intrinsicVds: q.bias.intrinsicVds, intrinsicVbs: q.bias.intrinsicVbs + 0.1};
        assert.throws(() => q._rfModel.atOperatingPoint(state), /body-to-source/);
        assert.throws(() => q._rfModel.atOperatingPoint({...state, intrinsicVgs: NaN}), /finite/);
        const four = nP[name]({body: 'external'});
        const floatingBody = nP.nodal([four, 1, 2, 3, 4], [nP.Short(), 1], [nP.Short(), 3], [nP.V(name === 'NMOS' ? 1 : -1), 2, 5], [nP.Short(), 5], ['out', 4]);
        const point = floatingBody.operatingPoint.components[0].qPoint;
        assert.ok(Number.isFinite(point.vb)); close(point.ib, 0, 1e-18);
        close(point.vgs, 0, 1e-9);
    }
});

test('reused/nested MOSFETs retain independent placement states and captured frequency/temperature context', () => {
    const saved = {...nP.global};
    try {
        nP.global.fList = [10e6, 100e6]; nP.global.Ro = 75; nP.global.Temp = 310;
        const q = nP.NMOS(), before = JSON.stringify(q);
        const a = mosfetNetwork({q}), b = mosfetNetwork({q, resistance: 1500});
        const network = nP.cascade(a, b), points = network.operatingPoint.operatingPoints;
        assert.deepEqual(points.map(point => point.path), ['p1/p3', 'p2/p3']); assert.notEqual(points[0].intrinsicVgs, points[1].intrinsicVgs);
        const target = nP.NMOS({qPoint: {vgs: 1.2, vds: 4}});
        nP.global.fList = [7]; nP.global.Ro = 125; nP.global.Temp = 270;
        const rebuilt = q._withOperatingPoints([{path: '', intrinsicVgs: target.bias.intrinsicVgs, intrinsicVds: target.bias.intrinsicVds, intrinsicVbs: target.bias.intrinsicVbs, vs: 5}]);
        sameRf(rebuilt, target); assert.equal(rebuilt.global.Ro, 75); assert.equal(rebuilt.bias.vs, 5); assert.equal(rebuilt.bias.temperature, 310);
        assert.equal(JSON.stringify(q), before);
    } finally { Object.assign(nP.global, saved); }
});

test('MOSFET, JFET, BJT and diode placements solve in one graph', () => {
    nP.global.fList = [1e6];
    const mixed = nP.nodal([nP.Tee5(), 1, 2, 3, 4, 10], [nP.V(5), 1, 5], [nP.Short(), 5],
        [nP.R(10000), 3, 6], [nP.D(), 6, 7], [nP.NPN(), 7, 4, 8], [nP.R(1000), 8, 9], [nP.Short(), 9], [nP.C(10e-9), 10, 11], ['out', 2, 11]);
    const network = nP.cascade(mosfetNetwork(), jfetNetwork(), mixed);
    assert.ok(network.operatingPoint.residuals.maxNormalizedResidual <= 1);
    assert.equal(network.operatingPoint.initialEstimate.method, 'piecewise-devices');
    assert.deepEqual(network.operatingPoint.components.filter(part => part.qPoint).map(part => part.constructorName), ['NMOS', 'NJF', 'D', 'NPN']);
});

test('failed MOSFET DC prevents RF rebuilding', () => {
    nP.global.fList = [1e6]; const q = nP.NMOS(), recipe = q._rfModel; let calls = 0;
    q._rfModel = {atOperatingPoint(state) { calls++; return recipe.atOperatingPoint(state); }};
    assert.throws(() => nP.nodal([nP.Tee4(), 1, 2, 3, 4], [nP.V(1), 1, 5], [nP.Short(), 5],
        [nP.V(2), 2, 6], [nP.Short(), 6], [q, 3, 7, 8], [nP.Short(), 7], [nP.Short(), 8], ['out', 4]),
    error => error.code === 'DC_INCONSISTENT'); assert.equal(calls, 0);
});
