// Modified: 2026-11-20
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {hemtReference as reference} from './fixtures/hemt-atf35143-reference';
import {hemtParameters, hemtJunction, hemtOperatingPoint} from '../src/np-nport/src/transistors/fet/hemtEquations';
import {powers} from '../src/np-nport/src/transistors/bjt/taylor';
function close(actual, expected, absolute = 1e-12, relative = 0) {
    assert.ok(Math.abs(actual - expected) <= absolute + relative * Math.abs(expected), `${actual} != ${expected}`);
}
test('HEMT owns its die model, terminal order, default settings and independent DC curves', () => {
    const q = nP.HEMT({fList: [1e9]}), before = JSON.stringify(q.qPoint);
    assert.equal(q.model.name, 'ATF35143_DIE'); assert.match(q.model.structure, /pseudomorphic/);
    assert.match(q.model.package, /external SC-70 package network omitted/);
    assert.equal(q._dcModel.constructorName, 'HEMT'); assert.equal(q._dcModel.definition.modelId, 'hemt');
    assert.ok(Object.isFrozen(q._dcModel.definition.record.parameters));
    assert.deepEqual(q.model.inductors, [[0, 3, 15e-12], [1, 4, 15e-12], [2, 5, 5e-12]]);
    assert.equal(q._schematic.symbol, 'njf'); assert.equal(q._schematic.value, q.model.name);
    close(q.qPoint.vgs, -.6); close(q.qPoint.vds, 2); close(q.qPoint.ig + q.qPoint.id + q.qPoint.is, 0);
    const curve = q.ivTable({vgs: {points: 3}, vds: {points: 4}});
    assert.equal(curve.length, 5); assert.equal(curve[0].length, 4); assert.ok(curve.slice(1).flat().every(Number.isFinite));
    assert.equal(JSON.stringify(q.qPoint), before); assert.equal(q.dc.bias.vgs.points, 5);
    q.model.parameters.BETA = 99; q.model.inductors[0][2] = 99;
    assert.equal(q._dcModel.definition.record.parameters.BETA, .12); assert.equal(q._dcModel.definition.record.inductors[0][2], 15e-12);
    for (const options of [{model: 'NE3210S01'}, {model: null}, {fList: [0]}, {fList: []},
        {qPoint: {vgs: -2}}, {qPoint: {vds: -1}}, {qPoint: {vgs: NaN}}, {temperature: 0}, {body: 'external'}, {bias: {vgs: {points: 1}}}]) {
        assert.throws(() => nP.HEMT(options));
    }
});
test('HEMT matches an independent SPICE current/charge circuit and correlated-noise oracle', () => {
    const r = reference, q = nP.HEMT({temperature: r.temperature, fList: r.spars.map(row => row[0])});
    const p = hemtParameters(q.model.parameters);
    for (const row of [{vgs: r.vgs, vds: r.vds, op: r.op}, ...r.dcPoints]) {
        const point = hemtOperatingPoint(p, row.vgs, row.vds);
        ['ig', 'id', 'is'].forEach((key, i) => close(point[key], -row.op[i + 3], 2e-11));
        close(point.data.channel[1] + point.data.channel[2], row.op[6], 2e-11);
        close(-point.data.channel[2], row.op[7], 2e-11);
    }
    q.spars.forEach((row, i) => row.slice(1).forEach((z, j) => {
        close(z.x, r.spars[i][j + 1][0], 1e-8); close(z.y, r.spars[i][j + 1][1], 1e-8);
    }));
    q.noise.forEach(({C}, k) => C.forEach((row, i) => row.forEach((z, j) => {
        close(z.x, r.noise[k].C[i][j][0], 3e-30); close(z.y, r.noise[k].C[i][j][1], 3e-30);
        close(z.x, C[j][i].x, 1e-30); close(z.y, -C[j][i].y, 1e-30);
    })));
    // The covariance must be nonnegative for arbitrary complex port combinations,
    // including combinations sensitive to the imaginary gate/drain correlation.
    for (const {C} of q.noise) for (const x of [[1, 0, 0, 0, 0, 0], [1, 0, 0, 1, -1, .2], [1, .3, -2, .4, .8, -1]]) {
        const v = [0, 1, 2].map(i => nP.complex(x[2 * i], x[2 * i + 1]));
        let sum = nP.complex(0, 0);
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) sum = sum.add(nP.complex(v[i].x, -v[i].y).mul(C[i][j]).mul(v[j]));
        assert.ok(sum.x >= -1e-30); close(sum.y, 0, 1e-30);
    }
    const hot = nP.HEMT({temperature: 338.15, fList: q.global.fList});
    assert.deepEqual(hot.spars, q.spars); assert.equal(hot.qPoint.electricalTemperature, 300.15);
    q.noise.forEach(({C}, f) => C.forEach((row, i) => row.forEach((z, j) => close(hot.noise[f].C[i][j].x, z.x * 338.15 / r.temperature, 1e-29))));
});
test('HEMT current and partitioned static charge derivatives conserve terminal current/charge', () => {
    const p = hemtParameters(nP.HEMT({fList: [1e9]}).model.parameters), h = 1e-6;
    for (const [gs, gd] of [[-.6, -2.6], [-.3, -.4], [-1.2, -3], [.2, -1], [.4, -1]]) {
        const data = hemtJunction(p, gs, gd);
        for (const jets of [data.currents, data.charges]) for (let term = 0; term < 10; term++) close(jets.reduce((sum, row) => sum + row[term], 0), 0, jets === data.currents ? 1e-8 : 1e-23);
        for (let axis = 0; axis < 2; axis++) {
            const high = [gs, gd], low = high.slice(); high[axis] += h; low[axis] -= h;
            const a = hemtJunction(p, ...high), b = hemtJunction(p, ...low);
            for (const kind of ['currents', 'charges']) for (let terminal = 0; terminal < 3; terminal++) for (let term = 0; term < 6; term++) {
                const target = powers[term].map((degree, i) => degree + (i === axis ? 1 : 0));
                const next = powers.findIndex(power => power.every((degree, i) => degree === target[i]));
                close(target[axis] * data[kind][terminal][next], (a[kind][terminal][term] - b[kind][terminal][term]) / (2 * h), kind === 'charges' ? 1e-20 : 1e-8, 3e-5);
            }
        }
    }
    const data = hemtJunction(p, -.6, -2.6);
    assert.ok(Math.abs(data.charges[2][2]) > 1e-16); // Static Qgs depends on Vgd; MES1 differential partition is different.
});
test('HEMT weak products have second/third-order slopes with correlated noise and die parasitics', () => {
    const saved = {...nP.global};
    try {
        nP.global.fList = [100e6, 1e9]; nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
        const q = nP.HEMT(), short = nP.Short();
        const network = nP.nodal([q, 1, 2, 3], [short, 3], ['out', 1, 2]);
        const low = network.out('NF21dB', 'IM2sum21dBm', 'IM3lower21dBm', 'OIP3lower21dBm')[1];
        const high = network.out('NF21dB', 'IM2sum21dBm', 'IM3lower21dBm', 'OIP3lower21dBm',
            {twoTone: {...nP.global.twoTone, p1dBm: -70, p2dBm: -70}})[1];
        assert.ok(low.every(Number.isFinite)); close(high[2] - low[2], 20, 1e-6); close(high[3] - low[3], 30, 1e-6); close(high[4], low[4], 1e-3);
    } finally { Object.assign(nP.global, saved); }
});
