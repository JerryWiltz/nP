// Modified: 2026-11-19
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {mesfetReference as reference} from './fixtures/mesfet-reference';
import {mesfetJunction, mesfetParameters} from '../src/np-nport/src/transistors/fet/mesfetEquations';
import {powers} from '../src/np-nport/src/transistors/bjt/taylor';
function close(actual, expected, absolute = 1e-10, relative = 0) {
    assert.ok(Math.abs(actual - expected) <= absolute + relative * Math.abs(expected), `${actual} != ${expected}`);
}

test('MESFET reference profile matches independent ngspice DC, every S entry and classical noise', () => {
    const r = reference, fList = r.spars.map(row => row[0]);
    const q = nP.MESFET({temperature: r.temperature, fList});
    ['ig', 'id', 'is'].forEach((key, i) => close(q.qPoint[key], -r.op[i + 3], 1e-14));
    close(q.smallSignal.gm, r.op[6], 1e-12); close(q.smallSignal.gds, r.op[7], 1e-12);
    q.spars.forEach((row, i) => row.slice(1).forEach((z, j) => {
        close(z.x, r.spars[i][j + 1][0], 1e-8); close(z.y, r.spars[i][j + 1][1], 1e-8);
    }));
    const short = nP.Short({fList}), grounded = nP.nodal([q, 1, 2, 3], [short, 3], ['out', 1, 2]);
    grounded.out('NF21dB', {referenceTemperature: r.temperature}).slice(1).forEach((row, i) => close(row[1], r.noiseFigureDb[i], 3e-6));
    const hot = nP.MESFET({temperature: 338.15, fList});
    ['ig', 'id', 'is'].forEach((key, i) => close(hot.qPoint[key], -r.hot[i + 3], 1e-14));
    assert.deepEqual(hot.spars, q.spars); // MES1 has no electrical temperature scaling.
    q.noise.forEach(({C}, k) => C.forEach((row, i) => row.forEach((z, j) => {
        close(hot.noise[k].C[i][j].x, z.x * 338.15 / r.temperature, 1e-30);
        close(z.x, C[j][i].x, 1e-30); close(z.y, -C[j][i].y, 1e-30);
    })));
});

test('MESFET records reference provenance and owns immutable DC settings, independent curves and model snapshots', () => {
    const q = nP.MESFET({fList: [1e6]});
    assert.equal(q.model.name, 'SPICE3_REFERENCE'); assert.equal(q.model.manufacturer, null);
    assert.match(q.model.limitations, /Not a commercial part fit/);
    assert.equal(q._dcModel.quality, 'approximate');
    assert.ok(Object.isFrozen(q._dcModel.definition.record.parameters));
    assert.equal(q._schematic.symbol, 'njf');
    close(q.qPoint.vgs, -.5); close(q.qPoint.vds, 2);
    const before = JSON.stringify(q.qPoint), curves = JSON.stringify(q.dc);
    const table = q.ivTable({vgs: {points: 3}, vds: {points: 7}});
    assert.equal(table.length, 8); assert.equal(table[0].length, 4);
    assert.ok(table.slice(1).flat().every(Number.isFinite));
    assert.equal(JSON.stringify(q.qPoint), before); assert.equal(JSON.stringify(q.dc), curves);
    q.model.parameters.BETA = 1; assert.equal(q._dcModel.definition.record.parameters.BETA, .001);
    for (const options of [{model: 'ATF34143'}, {polarity: -1}, {body: 'external'}, {qPoint: {id: .001}},
        {qPoint: {vgs: NaN}}, {temperature: 0}, {fList: []}, {bias: {vds: {stop: -1}}}]) assert.throws(() => nP.MESFET(options));
});

test('Statz current and total-gate-charge derivatives hold in normal, inverse, linear, cutoff and forward-gate regions', () => {
    const p = mesfetParameters(nP.MESFET().model.parameters), h = 1e-6;
    for (const [gs, gd] of [[-.5, -2.5], [-2.5, -.5], [-.5, -.6], [-3, -5], [.1, -1], [.7, -.5]]) {
        const data = mesfetJunction(p, gs, gd);
        for (let term = 0; term < 10; term++) close(data.currents.reduce((sum, jet) => sum + jet[term], 0), 0, 1e-10);
        for (let axis = 0; axis < 2; axis++) {
            const high = [gs, gd], low = high.slice(); high[axis] += h; low[axis] -= h;
            const a = mesfetJunction(p, ...high), b = mesfetJunction(p, ...low);
            for (const [jet, plus, minus] of data.currents.map((jet, i) => [jet, a.currents[i], b.currents[i]])
                .concat([[data.gateCharge, a.gateCharge, b.gateCharge]])) {
                for (let term = 0; term < 6; term++) {
                    const target = powers[term].map((degree, i) => degree + (i === axis ? 1 : 0));
                    const next = powers.findIndex(power => power.every((degree, i) => degree === target[i]));
                    close(target[axis] * jet[next], (plus[term] - minus[term]) / (2 * h), jet === data.gateCharge ? 1e-20 : 1e-10, 2e-5);
                }
            }
            close(data.capacitances[axis].coefficients[0], (a.gateCharge[0] - b.gateCharge[0]) / (2 * h), 1e-20, 1e-6);
        }
    }
});

function grounded(q) { const short = nP.Short({fList: q.global.fList}); return nP.nodal([q, 1, 2, 3], [short, 3], ['out', 1, 2]); }
    test('MESFET' + ' active covariance is Hermitian positive semidefinite and intermodulation has expected slopes', () => {
        const saved = {...nP.global};
        try {
            nP.global.fList = [10e6, 100e6, 1e9];
            nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
            const q = nP.MESFET();
            for (const {C} of q.noise) {
                for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
                    close(C[i][j].x, C[j][i].x, 1e-30); close(C[i][j].y, -C[j][i].y, 1e-30);
                }
                for (const x of [[1, 0, 0], [1, -1, 0], [1, 2, 3]]) {
                    let psd = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) psd += x[i] * C[i][j].x * x[j];
                    assert.ok(psd >= -1e-30);
                }
            }
            const network = grounded(q), selectors = ['IM2sum21dBm', 'IM3lower21dBm', 'OIP2sum21dBm', 'OIP3lower21dBm'];
            const low = network.out(...selectors)[1];
            const high = network.out(...selectors, {twoTone: {...nP.global.twoTone, p1dBm: -70, p2dBm: -70}})[1];
            assert.ok(low.every(Number.isFinite));
            close(high[1] - low[1], 20, 1e-7); close(high[2] - low[2], 30, 1e-7);
            close(high[3], low[3], 1e-3); close(high[4], low[4], 1e-3);
            const shifted = grounded(nP.MESFET({qPoint: {vgs: -1, vds: 2}})).out(...selectors)[1];
            assert.ok(Math.abs(shifted[4] - low[4]) > 0.01);
        } finally { Object.assign(nP.global, saved); }
    });
