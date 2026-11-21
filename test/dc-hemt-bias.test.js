// Modified: 2026-11-20
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {hemtReference as reference} from './fixtures/hemt-atf35143-reference';
import {jfetNetwork} from './fixtures/jfet-network';
function close(a, b, tolerance) { assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`); }
function network(q, resistance = 47) {
    return jfetNetwork({name: 'HEMT', q, supply: 5, drainResistance: 150, resistance});
}
test('HEMT automatic bias matches SPICE and hands off intrinsic voltages including gate contact drop', () => {
    const saved = {...nP.global};
    try {
        nP.global.fList = [100e6, 1e9]; nP.global.Temp = reference.temperature;
        const q = nP.HEMT(), before = JSON.stringify(q), circuit = network(q), dc = circuit.operatingPoint, point = dc.components[4].qPoint;
        ['vg', 'vd', 'vs'].forEach((key, i) => close(point[key], reference.selfBias[i], 2e-8));
        close(point.id, -reference.selfBias[3], 2e-11); close(point.vgs, point.vg - point.vs, 1e-10);
        close(point.vgs, point.intrinsicVgs + q.model.parameters.RG * point.ig - q.model.parameters.RS * point.is, 1e-10);
        close(point.vg / 1e6 + point.ig, 0, 1e-12); close(point.vs / 47 + point.is, 0, 1e-12);
        assert.equal(dc.initialEstimate.method, 'piecewise-hemt'); assert.ok(dc.residuals.maxNormalizedResidual <= 1);
        const fresh = nP.HEMT({qPoint: {vgs: point.vgs, vds: point.vds}}), components = circuit._rfModel.components.slice(); components[4] = fresh;
        const rebuilt = circuit._rfModel.rebuild(components);
        circuit.spars.forEach((row, i) => row.slice(1).forEach((z, j) => close(z.sub(rebuilt.spars[i][j + 1]).mag(), 0, 1e-9)));
        circuit.noise.forEach(({C}, f) => C.forEach((row, i) => row.forEach((z, j) => close(z.sub(rebuilt.noise[f].C[i][j]).mag(), 0, 1e-28))));
        const changed = network(q, 100); assert.ok(Math.abs(changed.operatingPoint.components[4].qPoint.id - point.id) > .001);
        const joined = nP.cascade(circuit, changed);
        assert.deepEqual(joined.operatingPoint.operatingPoints.map(point => point.path), ['p1/p5', 'p2/p5']);
        assert.notEqual(joined.operatingPoint.operatingPoints[0].intrinsicVgs, joined.operatingPoint.operatingPoints[1].intrinsicVgs);
        assert.equal(JSON.stringify(q), before);
    } finally { Object.assign(nP.global, saved); }
});
test('HEMT standalone DC snapshot and no-supply RF retain their separate meanings', () => {
    const q = nP.HEMT({fList: [1e9]}), before = JSON.stringify(q);
    const short = nP.Short({fList: [1e9]}), circuit = nP.nodal([q, 1, 2, 3], [short, 3], ['out', 1, 2]);
    assert.equal(circuit.operatingPoint, undefined);
    const point = q.solveDC().components[0].qPoint;
    close(point.vgs, 0, 1e-8); close(point.vds, 0, 1e-8); close(point.id, 0, 1e-12);
    assert.equal(point.vs, null); assert.equal(JSON.stringify(q), before);
    assert.throws(() => q._rfModel.atOperatingPoint({intrinsicVgs: -2, intrinsicVgd: -4}), /conducting Q point/);
});
