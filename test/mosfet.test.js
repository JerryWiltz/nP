// Modified: 2026-11-19
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {mosfetReference} from './fixtures/mosfet-reference';
import {mosfetTemperature, mosfetJunction} from '../src/np-nport/src/transistors/fet/mosfetEquations';
import {devicePowers} from '../src/np-nport/src/transistors/deviceTaylor';

function close(a, b, absolute = 1e-9, relative = 0) { assert.ok(Math.abs(a - b) <= absolute + relative * Math.abs(b), `${a} != ${b}`); }
function grounded(q) {
    const short = nP.Short({fList: q.global.fList});
    return q._dcModel.portCount === 4 ? nP.nodal([q, 1, 2, 3, 4], [short, 3], [short, 4], ['out', 1, 2]) :
        nP.nodal([q, 1, 2, 3], [short, 3], ['out', 1, 2]);
}
function sameRf(a, b) {
    a.spars.forEach((row, i) => row.slice(1).forEach((z, j) => close(z.sub(b.spars[i][j + 1]).mag(), 0, 1e-8)));
    a.noise.forEach(({C}, k) => C.forEach((row, i) => row.forEach((z, j) => close(z.sub(b.noise[k].C[i][j]).mag(), 0, 1e-26))));
}
for (const reference of mosfetReference) test(reference.name + ' ' + reference.body + ' agrees with ngspice DC, all S entries, hot bias and classical noise', () => {
    const {name, body, temperature, vgs, vds, vbs, op, hot} = reference, count = reference.ports.length;
    const options = {body, temperature, qPoint: {vgs, vds, vbs}, fList: reference.spars.map(row => row[0])};
    const q = nP[name](options);
    q.qPoint.terminalCurrents.forEach((value, i) => close(value, -op[count + i], 1e-13, 1e-7));
    close(q.smallSignal.gm, op[2 * count], 1e-12, 1e-7);
    close(q.smallSignal.gds, op[2 * count + 1], 1e-12, 1e-7);
    close(q.smallSignal.gmb, op[2 * count + 2], 1e-12, 1e-7);
    reference.spars.forEach((row, i) => row.slice(1).forEach(([real, imag], j) => {
        close(q.spars[i][j + 1].x, real, 1e-8); close(q.spars[i][j + 1].y, imag, 1e-8);
    }));
    const response = grounded(q).out('NF21dB', {referenceTemperature: temperature});
    reference.noiseFigureDb.forEach((nf, i) => close(response[i + 1][1], nf, 3e-6));
    const heated = nP[name]({...options, temperature: 338.15});
    heated.qPoint.terminalCurrents.forEach((value, i) => close(value, -hot[count + i], 1e-12, 1e-7));
});

for (const name of ['NMOS', 'PMOS']) {
    const sign = name === 'NMOS' ? 1 : -1;
    test(name + ' validates its body/curve API and owns model, context and Q-point snapshots', () => {
        const q = nP[name]({fList: [1e6]}), four = nP[name]({body: 'external', fList: [1e6]});
        assert.equal(q._dcModel.portCount, 3); assert.equal(four._dcModel.portCount, 4);
        assert.equal(q._schematic.symbol, name.toLowerCase()); assert.equal(four._schematic.symbol, name.toLowerCase() + '-four-terminal');
        assert.match(q.model.source, /diodes.com/); assert.equal(q.model.parameters.L, 100e-6);
        assert.ok(Object.isFrozen(q._dcModel.definition.record.parameters));
        close(q.qPoint.vgs, sign * (Math.abs(q.model.parameters.VTO) + 0.5)); close(q.qPoint.vds, sign * 5); close(q.qPoint.vbs, 0);
        assert.equal(q.qPoint.ig, sign === 1 ? 0 : -0); assert.equal(q.qPoint.ib, undefined);
        close(q.qPoint.terminalCurrents.reduce((a, b) => a + b, 0), 0, 1e-15);
        const before = JSON.stringify(q.qPoint), dc = JSON.stringify(q.dc);
        const table = q.ivTable({vgs: {points: 3}, vds: {points: 7}});
        assert.equal(table.length, 8); assert.equal(table[0].length, 4); assert.ok(table.slice(1).flat().every(Number.isFinite));
        assert.equal(JSON.stringify(q.qPoint), before); assert.equal(JSON.stringify(q.dc), dc);
        const back = four.ivTable({vgs: {points: 2}, vds: {points: 3}, vbs: -sign * 0.5}); assert.equal(back.length, 4);
        q.model.parameters.KP = 1; q.dc.bias.vgs.points = 2; q.qPoint.vgs = 100;
        assert.notEqual(q._dcModel.definition.record.parameters.KP, 1); assert.equal(q._dcModel.definition.curveSettings.vgs.points, 5);
        assert.notEqual(q._dcModel.definition.initialQPoint.vgs, 100);
        for (const options of [{model: 'unknown'}, {model: name === 'NMOS' ? 'DMP58D0SV' : 'DMN55D0UT'},
            {body: 'ground'}, {body: true}, {qPoint: {id: 1e-3}}, {qPoint: {vbs: -sign}}, {qPoint: {vgs: NaN}},
            {temperature: 0}, {fList: []}, {fList: [-1]}, {bias: {vgs: {points: 1}}}, {bias: {vds: {stop: -sign}}},
            {length: 1e-6}, {unknown: 1}]) assert.throws(() => nP[name](options));
        assert.throws(() => q.ivTable({vds: {steps: 3}}), /Unknown/);
        assert.throws(() => q.ivTable({vbs: -sign}), /source-tied/);
    });
    test(name + ' four-terminal equations conserve current/charge and differentiate all three controls through degree three', () => {
        const q = nP[name](), p = mosfetTemperature(q.model.parameters, 300.15, sign), h = 1e-6;
        for (const state of [[3, 5, -0.5], [3, -0.2, -0.5], [-1, 5, -0.5], [4, 0.1, -0.5], [3, 2, 0.1]]) {
            const voltages = state.map(value => sign * value), data = mosfetJunction(p, ...voltages, sign);
            for (const field of ['currents', 'charges']) {
                for (let term = 0; term < devicePowers.length; term++) close(data[field].reduce((sum, jet) => sum + jet[term], 0), 0, field === 'charges' ? 1e-25 : 1e-12);
                for (let terminal = 0; terminal < 4; terminal++) for (let axis = 0; axis < 3; axis++) {
                    const plus = voltages.slice(), minus = voltages.slice(); plus[axis] += h; minus[axis] -= h;
                    const high = mosfetJunction(p, ...plus, sign)[field][terminal], low = mosfetJunction(p, ...minus, sign)[field][terminal];
                    for (let term = 0; term < 10; term++) {
                        const target = devicePowers[term].map((degree, index) => degree + (index === axis ? 1 : 0));
                        const next = devicePowers.findIndex(power => power.every((degree, index) => degree === target[index]));
                        close(target[axis] * data[field][terminal][next], (high[term] - low[term]) / (2 * h), field === 'charges' ? 1e-20 : 1e-9, 2e-5);
                    }
                }
            }
        }
    });
    test(name + ' default body tie equals externally joining body/source, including contact resistance, noise and IM products', () => {
        const saved = {...nP.global};
        try {
            nP.global.fList = [10e6]; nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
            const three = nP[name](), four = nP[name]({body: 'external'});
            const joined = nP.nodal([four, 1, 2, 3, 4], [nP.Tee(), 5, 3, 4], ['out', 1, 2, 5]);
            sameRf(joined, three);
            close(four.qPoint.ib + four.qPoint.is, three.qPoint.is, 1e-12);
            close(three.qPoint.intrinsicVbs, three._intermod.p.RS * three._intermod.point.data.currents[2][0], 1e-10);
            const selectors = ['IM2sum21dBm', 'IM3lower21dBm', 'OIP2sum21dBm', 'OIP3lower21dBm'];
            const circuit = grounded(three), low = circuit.out(...selectors)[1];
            const high = circuit.out(...selectors, {twoTone: {...nP.global.twoTone, p1dBm: -70, p2dBm: -70}})[1];
            assert.ok(low.every(Number.isFinite)); close(high[1] - low[1], 20, 1e-7); close(high[2] - low[2], 30, 1e-7);
            close(high[3], low[3], 1e-3); close(high[4], low[4], 1e-3);
            const comparison = grounded(joined).out(...selectors)[1]; comparison.forEach((value, i) => close(value, low[i], 1e-6));
            const back = grounded(nP[name]({body: 'external', qPoint: {vgs: sign * (Math.abs(three.model.parameters.VTO) + 1), vbs: -sign * 0.5}}));
            assert.ok(back.out('s21dB', 'NF21dB', 'IM3lower21dBm')[1].every(Number.isFinite));
            for (const q of [three, four]) for (const {C} of q.noise) {
                for (let i = 0; i < C.length; i++) for (let j = 0; j < C.length; j++) { close(C[i][j].x, C[j][i].x, 1e-29); close(C[i][j].y, -C[j][i].y, 1e-29); }
                for (const vector of [C.map(() => 1), C.map((_, i) => i + 1), C.map((_, i) => i % 2 ? 1 : -1)]) {
                    let density = 0; for (let i = 0; i < C.length; i++) for (let j = 0; j < C.length; j++) density += vector[i] * C[i][j].x * vector[j];
                    assert.ok(density >= -1e-29);
                }
            }
        } finally { Object.assign(nP.global, saved); }
    });
}
