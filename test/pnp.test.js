// Modified: 2026-11-15
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {pnpSpiceReference as reference} from './fixtures/pnp-spice-reference.js';
import {bjtConstructor} from '../src/np-nport/src/transistors/bjt/bjtConstructor';
import {pnpModel} from '../src/np-nport/src/transistors/bjt/pnpModels';
import {bjtProducts} from '../src/np-nport/src/transistors/bjt/bjtRf';

function close(actual, expected, tolerance = 1e-9) {
    assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
}
function commonEmitter(q) {
    return nP.nodal([q, 1, 2, 3], [nP.Short({fList: q.global.fList}), 3], ['out', 1, 2]);
}

test('PNP defaults use signed DC quantities and the regular three-port frequency context', () => {
    const q = nP.PNP();
    assert.equal(q.model.name, '2N3906');
    assert.equal(q.model.structure, 'PNP bipolar');
    assert.equal(q.model.manufacturer, 'Fairchild Semiconductor');
    assert.equal(q.model.parameters.TNOM, 300.15);
    assert.equal(q.spars[0].length, 10);
    assert.deepEqual(q.global.fList, nP.R().global.fList);
    close(q.bias.ib, -20e-6, 1e-12); close(q.bias.vce, -5);
    assert.ok(q.bias.ic < 0 && q.bias.ie < 0 && q.bias.vbe < 0 && q.bias.vcb < 0);
    close(q.bias.ie, q.bias.ic + q.bias.ib);
    close(q.bias.vcb, q.bias.vce - q.bias.vbe);
    assert.equal(q._schematic.symbol, 'pnp');
    assert.equal(q.stability, undefined);
    assert.ok(q.smallSignal.gm > 0 && q.smallSignal.cpi > 0 && q.smallSignal.cmu > 0);
});

test('2N3906 DC, all nine S-parameters and CE noise figure agree with independent ngspice', () => {
    const fList = reference.rows.map(row => row[0]);
    const q = nP.PNP({model: '2n3906', temperature: reference.temperature, fList});
    close(q.bias.ic, reference.ic, 5e-10);
    close(q.bias.vbe, reference.vbe, 5e-7);
    close(q.smallSignal.gm, reference.gm, 1e-7);
    close(q.smallSignal.cpi, reference.cpi, 2e-17);
    close(q.smallSignal.cmu, reference.cmu, 1e-19);
    for (let frequency = 0; frequency < reference.rows.length; frequency++) {
        for (let i = 1; i <= 9; i++) {
            close(q.spars[frequency][i].x, reference.rows[frequency][i][0], 1e-6);
            close(q.spars[frequency][i].y, reference.rows[frequency][i][1], 1e-6);
        }
    }
    const noise = commonEmitter(q).out('NF21dB', {referenceTemperature: reference.temperature});
    for (let frequency = 0; frequency < reference.rows.length; frequency++) {
        close(noise[frequency + 1][1], reference.noiseFigureDb[frequency], 1e-5);
    }
});

test('PNP curves include saturation and Early behavior without modifying inputs or the RF Q point', () => {
    const options = {qPoint: {ib: -30e-6}, bias: {ib: {start: -10e-6, stop: -30e-6, points: 3},
        vce: {points: 51}}, fList: [0, 1e7, 2e9]};
    const before = JSON.stringify(options), q = nP.PNP(options);
    const fixed = JSON.stringify({bias: q.bias, spars: q.spars, noise: q.noise});
    const curves = q.ivTable();
    assert.equal(curves.length, 52); assert.equal(curves[0].length, 4);
    assert.match(curves[0][1], /ib=-10 µA/);
    close(curves[1][0], 0); close(curves.at(-1)[0], -10);
    assert.ok(curves[2][1] > curves[11][1]);
    assert.ok(curves[11][1] > curves.at(-1)[1]);
    assert.ok(curves.at(-1)[1] > curves.at(-1)[2] && curves.at(-1)[2] > curves.at(-1)[3]);
    const selected = q.ivTable({ib: {start: -30e-6, stop: -31e-6, points: 2},
        vce: {start: -5, stop: -6, points: 2}});
    close(selected[1][1], q.bias.ic, 1e-11);
    curves[1][1] = 123;
    assert.notEqual(q.ivTable()[1][1], 123);
    assert.equal(JSON.stringify(options), before);
    assert.equal(JSON.stringify({bias: q.bias, spars: q.spars, noise: q.noise}), fixed);
    assert.ok(q.spars.every(row => row.slice(1).every(value => Number.isFinite(value.x) && Number.isFinite(value.y))));
});

test('PNP common-base and common-collector curves preserve the declared current convention', () => {
    const cb = nP.PNP({configuration: 'commonBase', qPoint: {ie: -2e-3, vcb: -5}});
    close(cb.bias.ie, -2e-3, 1e-11); close(cb.bias.vcb, -5);
    const cbCurves = cb.ivTable({ie: {start: -1e-3, stop: -2e-3, points: 2}, vcb: {start: 0.3, points: 11}});
    assert.match(cbCurves[0][0], /vcb/); assert.match(cbCurves[0][1], /ic.*ie=-1 mA/);
    assert.ok(cbCurves.at(-1)[2] > -2e-3 && cbCurves.at(-1)[2] < -1.8e-3);
    const ce = nP.PNP(), cc = nP.PNP({configuration: 'commonCollector'});
    const ceCurves = ce.ivTable({ib: {points: 3}, vce: {points: 5}});
    const ccCurves = cc.ivTable({ib: {points: 3}, vce: {points: 5}});
    for (let row = 1; row < 6; row++) for (let col = 1; col <= 3; col++) {
        close(ccCurves[row][col] - ceCurves[row][col], -(col - 1) * 25e-6, 1e-11);
    }
});

test('polarity reversal preserves the RF Jacobian/noise and reverses only even-order nonlinear sources', () => {
    const saved = nP.global.twoTone;
    nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
    try {
        const options = {fList: [10e6], temperature: 300.15};
        const actual = nP.PNP(options);
        // The same card with normalized positive coordinates is an internal
        // reference, not another public part number or an NPN parameter swap.
        const normalized = bjtConstructor(options, 'NPN', pnpModel, 1);
        for (let row = 0; row < actual.spars.length; row++) {
            for (let col = 1; col <= 9; col++) {
                close(actual.spars[row][col].sub(normalized.spars[row][col]).mag(), 0, 1e-12);
            }
            for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
                close(actual.noise[row].C[i][j].sub(normalized.noise[row].C[i][j]).mag(), 0, 1e-30);
            }
        }
        const zero = nP.complex(0, 0);
        const context = {input1: [nP.complex(1e-5, 2e-6), zero, zero],
            input2: [nP.complex(2e-5, -1e-6), zero, zero]};
        const tones = {f1: 10e6, f2: 11e6};
        for (const [frequency, sign] of [[21e6, -1], [1e6, -1], [20e6, -1], [9e6, 1], [12e6, 1]]) {
            const a = bjtProducts(actual._intermod, frequency, context, tones);
            const b = bjtProducts(normalized._intermod, frequency, context, tones);
            assert.ok(a.some(value => value.mag() > 0));
            for (let port = 0; port < 3; port++) close(a[port].sub(b[port].mul(nP.complex(sign, 0))).mag(), 0, 1e-18);
        }
        const circuit = commonEmitter(actual);
        const selectors = ['IM2sum21dBm', 'IM3lower21dBm', 'OIP2sum21dBm', 'OIP3lower21dBm'];
        const low = circuit.out(...selectors)[1];
        const high = circuit.out(...selectors, {twoTone: {...nP.global.twoTone, p1dBm: -70, p2dBm: -70}})[1];
        assert.ok(low.every(Number.isFinite));
        close(high[1] - low[1], 20, 1e-6); close(high[2] - low[2], 30, 1e-6);
        close(high[3], low[3], 0.002); close(high[4], low[4], 0.002);
        const strongerBias = commonEmitter(nP.PNP({...options, qPoint: {ib: -40e-6}}));
        assert.ok(Math.abs(strongerBias.out('OIP3lower21dBm')[1][1] - low[4]) > 0.1);
    } finally { nP.global.twoTone = saved; }
});

test('PNP validates model/polarity choices and responds to temperature and the completed RF network', () => {
    const q = nP.PNP({fList: [10e6], temperature: 300.15});
    const warm = nP.PNP({temperature: 330});
    assert.ok(Math.abs(warm.bias.vbe) < Math.abs(q.bias.vbe));
    const circuit = commonEmitter(q);
    assert.ok(circuit.stability[0].K < 1);
    assert.ok(circuit.out('s21dB', 'NF21dB', 'K', 'deltaMag')[1].every(Number.isFinite));
    for (const options of [{model: '2N3904'}, {temperature: 0}, {qPoint: {ib: 20e-6}},
        {qPoint: {vce: 5}}, {configuration: 'unknown'}, {fList: []}, {unknown: 1},
        {bias: {ib: {stop: 50e-6}}}, {bias: {vce: {stop: 10}}}]) {
        assert.throws(() => nP.PNP(options));
    }
    assert.throws(() => q.ivTable({vce: {stop: 1}}));
    assert.throws(() => nP.NPN({model: '2N3906'}), /NPN model/);
});
