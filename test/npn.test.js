// Modified: 2026-11-15
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {nPort} from '../src/np-nport/src/nPort';
import {npnSpiceReference} from './fixtures/npn-spice-reference.js';
import {gummelPoon, temperatureParameters} from '../src/np-nport/src/transistors/bjt/gummelPoon';
import {npnModel} from '../src/np-nport/src/transistors/bjt/npnModels';
import {constant, variable, add, multiply, power, exponential} from '../src/np-nport/src/transistors/bjt/taylor';

function close(actual, expected, tolerance = 1e-9) {
    assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected} by ${Math.abs(actual - expected)}`);
}
function withSettings(action) {
    const previous = nP.global();
    try { return action(); }
    finally { nP.global(previous); }
}
function commonEmitter(q) {
    return nP.nodal([q, 1, 2, 3], [nP.Short(), 3], ['out', 1, 2]);
}

test('third-order Taylor arithmetic retains mixed derivatives', () => {
    const x = variable(2, 0), y = variable(3, 1);
    const cubic = multiply(multiply(x, x), y);
    assert.deepEqual(cubic, [12, 12, 4, 3, 4, 0, 0, 1, 0, 0]);
    const reciprocal = multiply(power(add(x, y), -1), add(x, y));
    close(reciprocal[0], 1);
    for (const coefficient of reciprocal.slice(1)) close(coefficient, 0, 1e-15);
    const exp = exponential(add(constant(0), variable(0, 0)));
    close(exp[6], 1 / 6);
});

test('NPN defaults follow the RF context and keep all three terminals exposed', () => withSettings(() => {
    nP.global.fList = [2e9];
    const q = nP.NPN();
    assert.ok(q instanceof nPort);
    assert.equal(q.model.name, '2N3904');
    assert.equal(q.spars[0].length, 10);
    assert.equal(q.spars[0][0], nP.R().spars[0][0]);
    assert.equal(q.bias.temperature, nP.global.Temp);
    close(q.bias.ib, 20e-6, 1e-12); close(q.bias.vce, 5);
    close(q.bias.ie, q.bias.ib + q.bias.ic);
    close(q.bias.vcb, q.bias.vce - q.bias.vbe);
    assert.equal(q.stability, undefined);
    assert.throws(() => q.out('K'), /two-port/);
    assert.equal(q._schematic.symbol, 'npn');
    assert.deepEqual(q.global.fList, [2e9]);
    nP.global.fList.push(3e9);
    assert.deepEqual(q.global.fList, [2e9]);
}));

test('both published model cards agree with independent ngspice DC and all nine RF entries', () => {
    for (const [name, reference] of Object.entries(npnSpiceReference)) {
        const q = nP.NPN({model: name.toLowerCase(), temperature: reference.temperature,
            fList: reference.rows.map(row => row[0])});
        close(q.bias.ic, reference.ic, 5e-10);
        close(q.bias.vbe, reference.vbe, 5e-7);
        close(q.smallSignal.gm, reference.gm, 1e-7);
        close(q.smallSignal.cpi, reference.cpi, 2e-17);
        close(q.smallSignal.cmu, reference.cmu, 1e-19);
        for (let f = 0; f < reference.rows.length; f++) {
            for (let i = 1; i <= 9; i++) {
                const expected = reference.rows[f][i], actual = q.spars[f][i];
                close(actual.x, expected[0], 1e-6);
                close(actual.y, expected[1], 1e-6);
            }
        }
        const short = nP.Short({fList: reference.rows.map(row => row[0])});
        const amplifier = nP.nodal([q, 1, 2, 3], [short, 3], ['out', 1, 2]);
        const noiseFigure = amplifier.out('NF21dB', {referenceTemperature: 300.15});
        for (let f = 0; f < reference.rows.length; f++) {
            close(noiseFigure[f + 1][1], reference.noiseFigureDb[f], 1e-5);
        }
        assert.match(q.model.source, /^https:/);
        assert.equal(q.model.parameters.TNOM, 300.15);
    }
});

test('DC sweeps contain saturation knees and Early slopes without moving the selected Q point', () => {
    for (const model of ['2N3904', 'BFR93A']) {
        const options = {model, qPoint: {ib: 30e-6}, bias: {ib: {start: 10e-6, stop: 30e-6, points: 3},
            vce: {points: 51}}};
        const before = JSON.stringify(options), q = nP.NPN(options);
        const fixed = JSON.stringify({bias: q.bias, spars: q.spars, noise: q.noise});
        const curves = q.ivTable();
        assert.equal(curves.length, 52); assert.equal(curves[0].length, 4);
        close(curves[1][0], 0); close(curves.at(-1)[0], 10);
        assert.ok(curves[2][1] < curves[11][1]);
        assert.ok(curves[11][1] < curves.at(-1)[1]);
        assert.ok(curves.at(-1)[1] < curves.at(-1)[2] && curves.at(-1)[2] < curves.at(-1)[3]);
        const point = q.ivTable({ib: {start: 30e-6, stop: 31e-6, points: 2},
            vce: {start: 5, stop: 6, points: 2}});
        close(point[1][1], q.bias.ic, 1e-11);
        curves[1][1] = 123;
        assert.notEqual(q.ivTable()[1][1], 123);
        assert.equal(JSON.stringify({bias: q.bias, spars: q.spars, noise: q.noise}), fixed);
        assert.equal(JSON.stringify(options), before);
    }
});

test('common-base and common-collector curve families use their declared currents and voltage polarities', () => {
    for (const model of ['2N3904', 'BFR93A']) {
        const cb = nP.NPN({model, configuration: 'commonBase', qPoint: {ie: 2e-3, vcb: 5}});
        close(cb.bias.ie, 2e-3, 1e-11); close(cb.bias.vcb, 5);
        const cbTable = cb.ivTable({ie: {start: 1e-3, stop: 2e-3, points: 2}, vcb: {start: -0.3, points: 11}});
        assert.match(cbTable[0][0], /vcb/); assert.match(cbTable[0][1], /ic.*ie=/);
        assert.ok(cbTable.at(-1)[2] < 2e-3 && cbTable.at(-1)[2] > 1.8e-3);
        const ce = nP.NPN({model}), cc = nP.NPN({model, configuration: 'commonCollector'});
        const ceTable = ce.ivTable({ib: {points: 3}, vce: {points: 5}});
        const ccTable = cc.ivTable({ib: {points: 3}, vce: {points: 5}});
        assert.match(ccTable[0][1], /ie.*ib=/);
        for (let row = 1; row < 6; row++) for (let col = 1; col <= 3; col++) {
            close(ccTable[row][col] - ceTable[row][col], (col - 1) * 25e-6, 1e-11);
        }
    }
});

test('DC and RF derivatives track bias and temperature, including charge conservation', () => {
    for (const model of ['2N3904', 'BFR93A']) {
        const q = nP.NPN({model, temperature: 300.15}), warm = nP.NPN({model, temperature: 330});
        const driven = nP.NPN({model, qPoint: {ib: 40e-6}});
        assert.ok(warm.bias.vbe < q.bias.vbe);
        assert.ok(driven.bias.ic > q.bias.ic);
        assert.notEqual(warm.smallSignal.cpi, q.smallSignal.cpi);
        const p = temperatureParameters(npnModel(model).parameters, 300.15);
        const vbe = q.bias.intrinsicVbe, vbc = q.bias.intrinsicVbc, h = 1e-5;
        const center = gummelPoon(p, vbe, vbc);
        const plus = gummelPoon(p, vbe + h, vbc), minus = gummelPoon(p, vbe - h, vbc);
        for (let terminal = 0; terminal < 3; terminal++) {
            close((plus.currents[terminal][0] - minus.currents[terminal][0]) / (2 * h),
                center.currents[terminal][1], 1e-8);
            close((plus.charges[terminal][0] - minus.charges[terminal][0]) / (2 * h),
                center.charges[terminal][1], 5e-18);
        }
        for (let coefficient = 0; coefficient < 10; coefficient++) {
            close(center.currents.reduce((sum, row) => sum + row[coefficient], 0), 0, 1e-10);
            close(center.charges.reduce((sum, row) => sum + row[coefficient], 0), 0, 1e-22);
        }
        const rows = nP.NPN({model, fList: [0, 1e6, 2e9]}).spars;
        for (const row of rows) {
            for (const value of row.slice(1)) assert.ok(Number.isFinite(value.x) && Number.isFinite(value.y));
            for (let port = 0; port < 3; port++) {
                let rowSum = nP.complex(0, 0), columnSum = nP.complex(0, 0);
                for (let i = 0; i < 3; i++) {
                    rowSum = rowSum.add(row[1 + port * 3 + i]);
                    columnSum = columnSum.add(row[1 + i * 3 + port]);
                }
                close(rowSum.x, 1, 1e-8); close(rowSum.y, 0, 1e-8);
                close(columnSum.x, 1, 1e-8); close(columnSum.y, 0, 1e-8);
            }
        }
    }
});

test('active noise covariance is Hermitian positive semidefinite and survives terminal reconnection', () => withSettings(() => {
    nP.global.fList = [1e6, 100e6, 2e9];
    for (const model of ['2N3904', 'BFR93A']) {
        const q = nP.NPN({model});
        for (const {C} of q.noise) {
            for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
                close(C[row][col].x, C[col][row].x, 1e-30);
                close(C[row][col].y, -C[col][row].y, 1e-30);
            }
            for (const vector of [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, -1, 0], [1, 2, 3]]) {
                let density = 0;
                for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
                    density += vector[row] * C[row][col].x * vector[col];
                }
                assert.ok(density >= -1e-30);
            }
        }
        const circuits = [commonEmitter(q),
            nP.nodal([q, 3, 2, 1], [nP.Short(), 3], ['out', 1, 2]),
            nP.nodal([q, 1, 3, 2], [nP.Short(), 3], ['out', 1, 2])];
        for (const circuit of circuits) {
            for (const row of circuit.out('NF21dB', 'noiseFloor', 'K', 'deltaMag').slice(1)) {
                assert.ok(row.slice(1).every(Number.isFinite));
                assert.ok(row[1] >= 0);
            }
        }
    }
}));

test('two-tone products have second/third-order slopes and bias-dependent finite intercepts', () => withSettings(() => {
    nP.global.fList = [10e6];
    nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
    const selectors = ['IM2sum21dBm', 'IM3lower21dBm', 'OIP2sum21dBm', 'OIP3lower21dBm'];
    for (const model of ['2N3904', 'BFR93A']) {
        const q = nP.NPN({model}), circuit = commonEmitter(q), low = circuit.out(...selectors)[1];
        const high = circuit.out(...selectors, {twoTone: {...nP.global.twoTone, p1dBm: -70, p2dBm: -70}})[1];
        assert.ok(low.every(Number.isFinite));
        close(high[1] - low[1], 20, 1e-7); close(high[2] - low[2], 30, 1e-7);
        close(high[3], low[3], 1e-3); close(high[4], low[4], 1e-3);
        const changed = commonEmitter(nP.NPN({model, qPoint: {ib: 40e-6}})).out(...selectors)[1];
        assert.ok(Math.abs(changed[4] - low[4]) > 0.1);
        const padded = nP.cascade(circuit, nP.Attn(3)).out(...selectors)[1];
        close(padded[3], low[3] - 3, 1e-6); close(padded[4], low[4] - 3, 1e-6);
        const chargeOnly = nP.NPN({model});
        for (const current of chargeOnly._intermod.point.data.currents) current.fill(0, 3);
        assert.ok(commonEmitter(chargeOnly).out('IM2sum21dBm')[1].every(Number.isFinite));
    }
}));

test('NPN rejects unsupported model names and invalid or ambiguous bias settings', () => {
    for (const options of [{model: 'not-a-model'}, {configuration: 'commonGate'}, {temperature: 0},
        {unknown: 1}, {qPoint: {ib: -1}}, {qPoint: {ic: 1e-3}}, {bias: {ib: {points: 1}}},
        {bias: {ie: {start: 0, stop: 1, points: 2}}}, {fList: []}, {fList: [NaN]}]) {
        assert.throws(() => nP.NPN(options));
    }
    const q = nP.NPN();
    assert.throws(() => q.ivTable({vce: 1}), /object/);
    assert.throws(() => q.ivTable({vce: {steps: 3}}), /Unknown/);
});

test('K and delta come from the final two-port and handle unilateral and degenerate limits', () => withSettings(() => {
    nP.global.fList = [10e6];
    const ce = commonEmitter(nP.NPN());
    const record = ce.stability[0], row = ce.out('K', 'deltaMag')[1];
    close(row[1], record.K); close(row[2], record.deltaMag);
    assert.ok(record.K < 1); // Intermediate conditional stability is allowed.
    const stabilized = nP.cascade(nP.Attn(10), ce, nP.Attn(10));
    assert.ok(stabilized.stability[0].K > ce.stability[0].K);
    assert.equal(stabilized.stability[0].unconditionallyStable, true);
    const amp = nP.Amp({gainDb: 10});
    assert.equal(amp.stability[0].K, Infinity);
    close(nP.Thru().stability[0].K, 1); // A lossless through is marginal.
    const isolated = new nPort();
    isolated.setspars([[10e6, nP.complex(1, 0), nP.complex(0, 0), nP.complex(0, 0), nP.complex(1, 0)]]);
    assert.ok(Number.isNaN(isolated.stability[0].K));
    assert.equal(isolated.stability[0].unconditionallyStable, false);
    ce.spars[0][1] = nP.complex(0, 0);
    assert.notEqual(ce.stability[0].K, record.K);
}));
