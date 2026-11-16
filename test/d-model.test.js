// Modified: 2026-11-15
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph, schematicSvg} from '../src/np-chart/src/schematic';
import {diodeModel} from '../src/np-nport/src/diodes/diodeModels';
import {diodeTemperature, junctionCurrent, depletionCharge} from '../src/np-nport/src/diodes/junctionDiode';
import {diodeSpiceReference as reference} from './fixtures/diode-spice-reference.js';

function close(actual, expected, tolerance = 1e-9) {
    assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
}

test('D defaults select the documented signal-diode model, RF context and explicit Q point', () => {
    const diode = nP.D();
    assert.equal(diode.model.name, '1N4148');
    assert.equal(diode.model.family, 'signal');
    assert.equal(diode.spars[0].length, 5);
    assert.deepEqual(diode.global.fList, nP.R().global.fList);
    close(diode.bias.vd, 0.6); assert.ok(diode.bias.id > 0);
    assert.equal(diode.bias.temperature, nP.global.Temp);
    assert.deepEqual(diode.qPoint, diode.bias);
    assert.equal(diode._schematic.symbol, 'diode-1n4148');
    assert.equal(diode.ivTable().length, 202);
    close(diode.stability[0].K, 1, 1e-12); // Floating reciprocal series branch.
    assert.match(diode.model.source, /PySpice.*1N4148/);
    assert.match(diode.model.originalSource, /nxp/);
});

test('D agrees with independent ngspice forward/reverse DC, four S entries and noise figure', () => {
    const diode = nP.D({model: '1n4148', temperature: reference.temperature, fList: reference.rows.map(row => row[0])});
    close(diode.bias.id, reference.id, 1e-8);
    close(diode.smallSignal.conductance, reference.conductance, 1e-7);
    for (let frequency = 0; frequency < reference.rows.length; frequency++) {
        for (let entry = 1; entry <= 4; entry++) {
            close(diode.spars[frequency][entry].x, reference.rows[frequency][entry][0], 2e-6);
            close(diode.spars[frequency][entry].y, reference.rows[frequency][entry][1], 2e-6);
        }
    }
    const nf = diode.out('NF21dB', {referenceTemperature: reference.temperature});
    for (let frequency = 0; frequency < reference.rows.length; frequency++) {
        close(nf[frequency + 1][1], reference.noiseFigureDb[frequency], 2e-5);
    }
    for (const point of [reference.forward, reference.reverse]) {
        const device = nP.D({temperature: reference.temperature, qPoint: {vd: point.vd}});
        close(device.bias.id, point.id, Math.max(1e-10, Math.abs(point.id) * 1e-5));
    }
});

test('D merges sweep defaults, returns direct tables and never moves the fixed RF point', () => {
    const options = {bias: {vd: {points: 11}}, qPoint: {vd: 0.5}, fList: [0, 1e6, 1e9]};
    const input = JSON.stringify(options), diode = nP.D(options);
    const fixed = JSON.stringify({bias: diode.bias, spars: diode.spars, noise: diode.noise});
    const table = diode.ivTable();
    assert.deepEqual(table[0], ['vd (V)', 'id (A)']);
    assert.equal(table.length, 12); close(table[1][0], 0); close(table.at(-1)[0], 0.8);
    assert.ok(table[2][1] < table[6][1] && table[6][1] < table.at(-1)[1]);
    const selected = diode.ivTable({vd: {start: 0.5, stop: 0.6, points: 2}});
    close(selected[1][1], diode.bias.id, 1e-13);
    table[1][1] = 123; assert.notEqual(diode.ivTable()[1][1], 123);
    assert.equal(JSON.stringify(options), input);
    assert.equal(JSON.stringify({bias: diode.bias, spars: diode.spars, noise: diode.noise}), fixed);
    for (const row of diode.spars) for (const value of row.slice(1)) {
        assert.ok(Number.isFinite(value.x) && Number.isFinite(value.y));
    }
});

test('D current/charge derivatives and the forward capacitance continuation are consistent', () => {
    const record = diodeModel(), p = diodeTemperature(record.parameters, 300.15), h = 1e-6;
    for (const voltage of [-1, 0, 0.3, 0.6, 0.9]) {
        const center = junctionCurrent(p, voltage), before = junctionCurrent(p, voltage - h);
        const after = junctionCurrent(p, voltage + h);
        close((after.current - before.current) / (2 * h), center.conductance, Math.max(1e-12, Math.abs(center.conductance) * 1e-7));
        close((after.conductance - before.conductance) / (2 * h), center.second, Math.max(1e-12, Math.abs(center.second) * 1e-7));
        close((after.second - before.second) / (2 * h), center.third, Math.max(1e-12, Math.abs(center.third) * 1e-7));
        const q = depletionCharge(p, voltage), qBefore = depletionCharge(p, voltage - h), qAfter = depletionCharge(p, voltage + h);
        close((qAfter.charge - qBefore.charge) / (2 * h), q.capacitance, 1e-20);
    }
    const knee = p.FC * p.VJ;
    const before = depletionCharge(p, knee - 1e-9), after = depletionCharge(p, knee + 1e-9);
    close(before.charge, after.charge, 2e-21); close(before.capacitance, after.capacitance, 1e-21);
    for (const vd of [0.6, 0.9, 1.2]) {
        const device = nP.D({qPoint: {vd}});
        const derivative = (nP.D({qPoint: {vd: vd + h}}).bias.id - nP.D({qPoint: {vd: vd - h}}).bias.id) / (2 * h);
        close(derivative, 1 / device.smallSignal.dynamicResistance, derivative * 1e-7);
        assert.ok(Number.isFinite(device.smallSignal.totalCapacitance));
    }
    const warm = nP.D({temperature: 330});
    assert.ok(warm.bias.id > nP.D({temperature: 300.15}).bias.id);
});

test('D embeds through nodal/cascade with active noise and the canonical two-terminal symbol', () => {
    const fList = [1e6, 1e8], diode = nP.D({fList}), resistor = nP.R(25, undefined, {fList});
    const nodal = nP.nodal([diode, 45, 37], [resistor, 37, 1], ['out', 45, 1]);
    const cascade = nP.cascade(diode, resistor);
    for (let f = 0; f < fList.length; f++) for (let i = 1; i <= 4; i++) {
        close(nodal.spars[f][i].sub(cascade.spars[f][i]).mag(), 0, 1e-12);
    }
    for (const {C} of diode.noise) {
        assert.ok(C[0][0].x > 0);
        close(C[0][0].x, C[1][1].x, 1e-30); close(C[0][1].x, -C[0][0].x, 1e-30);
        close(C[0][1].sub(C[1][0]).mag(), 0, 1e-30);
    }
    assert.ok(nodal.out('s21dB', 'NF21dB', 'K')[1].every(Number.isFinite));
    const graph = schematicGraph(nodal);
    assert.equal(graph.components[0].symbol, 'diode-1n4148');
    assert.deepEqual(graph.externalPorts.map(port => port.node), [45, 1]);
    assert.match(schematicSvg({paths: ['1 right D1=D 2']}), /<svg/);
});

test('D nonlinear products have the expected slopes and survive a following attenuator', () => {
    const saved = nP.global.twoTone;
    nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
    try {
        const diode = nP.D({fList: [10e6]});
        const selectors = ['IM2sum21dBm', 'IM3lower21dBm', 'OIP2sum21dBm', 'OIP3lower21dBm'];
        const low = diode.out(...selectors)[1];
        const high = diode.out(...selectors, {twoTone: {...nP.global.twoTone, p1dBm: -70, p2dBm: -70}})[1];
        assert.ok(low.every(Number.isFinite));
        close(high[1] - low[1], 20, 1e-8); close(high[2] - low[2], 30, 1e-8);
        close(high[3], low[3], 1e-8); close(high[4], low[4], 1e-8);
        const padded = nP.cascade(diode, nP.Attn(3, undefined, {fList: [10e6]})).out(...selectors)[1];
        close(padded[3], low[3] - 3, 1e-8); close(padded[4], low[4] - 3, 1e-8);
    } finally { nP.global.twoTone = saved; }
});

test('D rejects invalid models and malformed bias settings while legacy diode behavior remains available', () => {
    for (const options of [{model: 'PIN'}, {qPoint: {voltage: 0.6}}, {qPoint: {vd: NaN}},
        {temperature: 0}, {bias: {vd: {points: 1}}}, {bias: {vd: {stop: -1}}}, {unknown: 1},
        {fList: []}, {fList: [NaN]}]) assert.throws(() => nP.D(options));
    const diode = nP.D();
    assert.throws(() => diode.ivTable(0.1), /object/);
    assert.throws(() => diode.ivTable({vd: {steps: 10}}), /Unknown/);
    const legacy = nP.diode1N4148();
    close(legacy.diode.bias.voltage, 0); close(legacy.diode.parameters.cj0, 4e-12);
    assert.deepEqual(legacy.ivTable(-0.1, 0.1, 3)[0], ['vD', 'iD']);
    assert.equal(legacy.ivTable(1, 1, 1).length, 2);
});
