// Modified: 2026-11-19
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {jfetReference} from './fixtures/jfet-reference';
import {powers} from '../src/np-nport/src/transistors/bjt/taylor';
import {jfetTemperature, jfetJunction} from '../src/np-nport/src/transistors/fet/jfetEquations';

function close(a, b, absolute = 1e-9, relative = 0) {
    assert.ok(Math.abs(a - b) <= absolute + relative * Math.abs(b), `${a} != ${b}`);
}
function grounded(q) { return nP.nodal([q, 1, 2, 3], [nP.Short({fList: q.global.fList}), 3], ['out', 1, 2]); }

for (const name of ['NJF', 'PJF']) {
    const sign = name === 'NJF' ? 1 : -1;
    test(name + ' matches independent ngspice DC, all nine S parameters, hot DC and NLEV=1 noise', () => {
        const ref = jfetReference[name], fList = ref.rows.map(row => row[0]);
        const q = nP[name]({qPoint: {vgs: ref.vgs, vds: ref.vds}, temperature: ref.temperature, fList});
        close(q.qPoint.ig, -ref.op[4], 1e-15, 1e-5);
        close(q.qPoint.id, -ref.op[5], 1e-12, 1e-7);
        close(q.qPoint.is, -ref.op[6], 1e-12, 1e-7);
        close(q.smallSignal.gm, ref.op[7], 1e-12, 1e-6);
        close(q.smallSignal.gds, ref.op[8], 1e-12, 1e-6);
        ref.rows.forEach((row, i) => row.slice(1).forEach(([real, imaginary], j) => {
            close(q.spars[i][j + 1].x, real, 1e-7); close(q.spars[i][j + 1].y, imaginary, 1e-7);
        }));
        const actual = grounded(q).out('NF21dB', {referenceTemperature: ref.temperature});
        ref.noiseFigureDb.forEach((nf, i) => close(actual[i + 1][1], nf, 3e-6));
        const hot = nP[name]({temperature: 338.15, qPoint: {vgs: ref.vgs, vds: ref.vds}, fList});
        close(hot.qPoint.ig, -ref.hot[4], 1e-15, 1e-5);
        close(hot.qPoint.id, -ref.hot[5], 1e-12, 1e-7);
        close(hot.qPoint.is, -ref.hot[6], 1e-12, 1e-7);
    });
    test(name + ' owns model metadata, immutable DC contract and independent curve settings', () => {
        const q = nP[name]({fList: [1e6]});
        close(q.qPoint.vgs, -sign); close(q.qPoint.vds, 10 * sign);
        assert.match(q.model.source, /onsemi/);
        assert.equal(q._dcModel.definition.modelId, 'jfet');
        assert.ok(Object.isFrozen(q._dcModel.definition.record.parameters));
        assert.equal(q._schematic.symbol, name.toLowerCase());
        const before = JSON.stringify(q.qPoint), dc = JSON.stringify(q.dc);
        const table = q.ivTable({vgs: {stop: -2 * sign, points: 3}, vds: {stop: 5 * sign, points: 7}});
        assert.equal(table.length, 8); assert.equal(table[0].length, 4);
        assert.ok(table.slice(1).flat().every(Number.isFinite));
        assert.equal(JSON.stringify(q.qPoint), before); assert.equal(JSON.stringify(q.dc), dc);
        q.model.parameters.BETA = 1;
        assert.notEqual(q._dcModel.definition.record.parameters.BETA, 1);
        for (const options of [{model: 'unknown'}, {model: name === 'NJF' ? 'MMBFJ175LT1' : 'MMBF5457LT1'},
            {qPoint: {id: 1e-3}}, {qPoint: {vgs: NaN}}, {temperature: 0}, {unknown: true},
            {bias: {vgs: {points: 1}}}, {bias: {vds: {stop: -sign}}}, {fList: []}, {fList: [-1]}]) {
            assert.throws(() => nP[name](options));
        }
        assert.throws(() => q.ivTable({vds: {steps: 4}}), /Unknown/);
    });
    test(name + ' analytic derivatives conserve terminal current/charge in forward, inverse, cutoff and gate-forward regions', () => {
        const q = nP[name](), p = jfetTemperature(q.model.parameters, 300.15), h = 1e-6;
        for (const [u, v] of [[-1, -6], [-6, -1], [-5, -10], [0.1, -1], [-1, -1.1]]) {
            const data = jfetJunction(p, sign * u, sign * v, sign);
            for (const field of ['currents', 'charges']) {
                for (let k = 0; k < 10; k++) close(data[field].reduce((sum, jet) => sum + jet[k], 0), 0, field === 'charges' ? 1e-25 : 1e-12);
                for (let terminal = 0; terminal < 3; terminal++) for (let axis = 0; axis < 2; axis++) {
                    const plus = [sign * u, sign * v], minus = plus.slice(); plus[axis] += h; minus[axis] -= h;
                    const high = jfetJunction(p, ...plus, sign)[field][terminal];
                    const low = jfetJunction(p, ...minus, sign)[field][terminal];
                    for (let term = 0; term < 6; term++) {
                        const target = powers[term].map((degree, index) => degree + (index === axis ? 1 : 0));
                        const next = powers.findIndex(power => power.every((degree, index) => degree === target[index]));
                        const derivative = (high[term] - low[term]) / (2 * h);
                        close(target[axis] * data[field][terminal][next], derivative, field === 'charges' ? 1e-20 : 1e-10, 1e-5);
                    }
                }
            }
        }
    });
    test(name + ' active covariance is Hermitian positive semidefinite and intermodulation has expected slopes', () => {
        const saved = {...nP.global};
        try {
            nP.global.fList = [10e6, 100e6, 1e9];
            nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
            const q = nP[name]();
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
            const shifted = grounded(nP[name]({qPoint: {vgs: -2 * sign, vds: 10 * sign}})).out(...selectors)[1];
            assert.ok(Math.abs(shifted[4] - low[4]) > 0.01);
        } finally { Object.assign(nP.global, saved); }
    });
}
