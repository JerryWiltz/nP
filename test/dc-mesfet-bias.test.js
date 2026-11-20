// Modified: 2026-11-19
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {jfetNetwork} from './fixtures/jfet-network';

function close(a, b, tolerance = 1e-9) { assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`); }
function sameRf(a, b) {
    a.spars.forEach((row, i) => row.slice(1).forEach((z, j) => close(z.sub(b.spars[i][j + 1]).mag(), 0, 1e-8)));
    a.noise.forEach(({C}, k) => C.forEach((row, i) => row.forEach((z, j) => close(z.sub(b.noise[k].C[i][j]).mag(), 0, 1e-26))));
}
const reference = {MESFET: {vg: 2.0011864128430352e-8, vd: 10.855225575821754, vs: 1.1447744241342328, id: 5.2035201099011243e-4}}; // Independent companion mesfet-self-bias.cir, ngspice 39.3.
for (const name of ['MESFET']) {
    test(name + ' external self-bias matches SPICE and hands the solved state to RF/noise/nonlinearity', () => {
        const previous = {...nP.global};
        try {
            nP.global.fList = [10e6, 100e6]; nP.global.Temp = 300.15;
            nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
            const q = nP[name](), before = JSON.stringify(q), curve = q.ivTable();
            const network = jfetNetwork({name, q}), dc = network.operatingPoint, point = dc.components[4].qPoint;
            for (const key of ['vg', 'vd', 'vs', 'id']) close(point[key], reference[name][key], key === 'id' ? 1e-11 : 1e-7);
            close(point.ig + point.id + point.is, 0, 1e-12);
            close(point.vg / 1e6 + point.ig, 0, 1e-12);
            close(point.vs / 2200 + point.is, 0, 1e-12);
            assert.ok(dc.residuals.maxNormalizedResidual <= 1);
            assert.equal(dc.initialEstimate.method, 'piecewise-mesfet');
            assert.deepEqual(dc.ports.map(port => [port.voltage, port.current]), [[null, 0], [null, 0]]);
            assert.deepEqual(dc.operatingPoints.map(point => point.path), ['p5']);
            const fresh = nP[name]({qPoint: {vgs: point.vgs, vds: point.vds}});
            const components = network._rfModel.components.slice(); components[4] = fresh;
            sameRf(network, network._rfModel.rebuild(components));
            assert.notEqual(network._rfModel.components[4], q);
            assert.equal(network._rfModel.components[4]._dcModel, q._dcModel);
            assert.deepEqual(network._rfModel.components[4].ivTable(), curve);
            assert.equal(JSON.stringify(q), before);
            const changed = jfetNetwork({name, q, resistance: 3300});
            assert.ok(Math.abs(changed.operatingPoint.components[4].qPoint.id - point.id) > 1e-5);
            const low = network.out('s21dB', 'NF21dB', 'IM3lower21dBm')[1];
            const high = changed.out('s21dB', 'NF21dB', 'IM3lower21dBm')[1];
            for (let i = 1; i < low.length; i++) assert.ok(Math.abs(low[i] - high[i]) > 1e-4);
            const combined = jfetNetwork({name, q, source: 'combined'}), unbypassed = jfetNetwork({name, q, source: 'resistor'});
            close(combined.operatingPoint.components[4].qPoint.id, point.id, 1e-11);
            close(unbypassed.operatingPoint.components[4].qPoint.id, point.id, 1e-11);
            sameRf(combined, network);
            assert.ok(Math.abs(unbypassed.out('s21dB')[1][1] - low[1]) > 1);
        } finally { Object.assign(nP.global, previous); }
    });
    test(name + ' fixed Q point is retained without a supply and floating DC has exact gauge modes', () => {
        nP.global.fList = [1e6];
        const q = nP[name](), before = JSON.stringify(q);
        const network = nP.nodal([q, 1, 2, 3], [nP.Short(), 3], ['out', 1, 2]);
        assert.equal(network.operatingPoint, undefined);
        const dc = q.solveDC(), point = dc.components[0].qPoint;
        close(point.id, 0, 1e-12); close(point.vgs, 0, 1e-8); close(point.vds, 0, 1e-8);
        assert.equal(point.vs, null); assert.equal(point.vg, null); assert.equal(point.vd, null);
        assert.equal(JSON.stringify(q), before);
        assert.throws(() => q._rfModel.atOperatingPoint({intrinsicVgs: NaN, intrinsicVgd: 0}), /finite/);
    });
}

test('reused MESFET templates have independent nested placement states and captured construction context', () => {
    const previous = {...nP.global};
    try {
        nP.global.fList = [10e6, 100e6]; nP.global.Ro = 75; nP.global.Temp = 310;
        const q = nP.MESFET(), before = JSON.stringify(q);
        const a = jfetNetwork({q}), b = jfetNetwork({q, resistance: 3300});
        const network = nP.cascade(a, b), points = network.operatingPoint.operatingPoints;
        assert.deepEqual(points.map(point => point.path), ['p1/p5', 'p2/p5']);
        assert.notEqual(points[0].intrinsicVgs, points[1].intrinsicVgs);
        const target = nP.MESFET({qPoint: {vgs: -1, vds: 3}});
        nP.global.fList = [7]; nP.global.Ro = 125; nP.global.Temp = 270;
        const rebuilt = q._withOperatingPoints([{path: '', intrinsicVgs: target.qPoint.intrinsicVgs, intrinsicVgd: target.qPoint.intrinsicVgd, vs: 5}]);
        sameRf(rebuilt, target); assert.equal(rebuilt.global.Ro, 75); assert.equal(rebuilt.bias.vs, 5);
        assert.equal(JSON.stringify(q), before);
    } finally { Object.assign(nP.global, previous); }
});

test('MESFET, BJT and diode solve together in the shared nonlinear assembly', () => {
    nP.global.fList = [1e6];
    const network = nP.nodal(
        [nP.V(12), 1, 2],
        [nP.Short(), 2],
        [nP.Tee4(), 3, 1, 4, 16],
        [nP.R(2200), 3, 5],
        [nP.MESFET(), 6, 5, 7],
        [nP.R(1e6), 6, 8],
        [nP.Short(), 8],
        [nP.R(2200), 7, 9],
        [nP.Short(), 9],
        [nP.Tee(), 10, 4, 11],
        [nP.R(10000), 10, 12],
        [nP.D(), 12, 13],
        [nP.NPN(), 13, 11, 14],
        [nP.R(1000), 14, 15],
        [nP.Short(), 15],
        ['out', 16]
    );
    assert.ok(network.operatingPoint.residuals.maxNormalizedResidual <= 1);
    assert.equal(network.operatingPoint.initialEstimate.method, 'piecewise-devices');
    assert.equal(network.operatingPoint.operatingPoints.length, 3);
});
