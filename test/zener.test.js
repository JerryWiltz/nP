// Modified: 2026-11-22
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as nP from '../src/index.js';
import {diodeModel} from '../src/np-nport/src/diodes/diodeModels';
import {diodeTemperature, junctionCurrent} from '../src/np-nport/src/diodes/junctionDiode';
import {schematicGraph, schematicSvg} from '../src/np-chart/src/schematic';
import {zenerReference} from './fixtures/zener-reference';

function close(actual, expected, absolute = 1e-12, relative = 1e-5) {
    assert.ok(Number.isFinite(actual) && Number.isFinite(expected));
    assert.ok(Math.abs(actual - expected) <= absolute + relative * Math.abs(expected), `${actual} != ${expected}`);
}

function biasNetwork(diode, voltage = -8, temperature = diode.bias.temperature) {
    const options = {fList: diode.global.fList};
    const c1 = nP.C(10e-9, options), c2 = nP.C(10e-9, options), tee = nP.Tee(options);
    const r = nP.R(1000, temperature, options), v = nP.V(voltage, options), ground = nP.Short(options);
    return nP.nodal(
        [c1, 100, 1],
        [tee, 3, 1, 2],
        [r, 4, 3],
        [v, 4, 5],
        [ground, 5],
        [diode, 2, 6],
        [tee, 8, 6, 7],
        [r, 8, 9],
        [ground, 9],
        [c2, 7, 101],
        ['out', 100, 101]
    );
}

test('Zener card retains archived provenance, anode/cathode order and canonical symbol', () => {
    const d = nP.D({model: 'bzx384-b4v7', qPoint: {vd: -4.7}, fList: [1e6]});
    assert.equal(d.model.family, 'zener');
    assert.equal(d.model.parameters.BV, 4.7);
    assert.equal(d.model.parameters.IBV, .005);
    assert.equal(d.model.parameters.RS, .387);
    assert.match(d.model.source, /a8688952.*DIODE2.lib/);
    assert.match(d.model.limitations, /Archived.*original hosted card unavailable/);
    assert.equal(d.model.parameters.TT, 0);
    assert.equal(d.model.parameters.NBV, 1);
    assert.equal(d._schematic.symbol, 'zener-diode');
    assert.deepEqual(d._dcModel.definition.terminals, [1, 2]);
    assert.ok(Object.isFrozen(d._dcModel.definition.record.parameters));
    assert.equal(schematicGraph(d).components[0].symbol, 'zener-diode');
    assert.match(schematicSvg(d), /BZX384-B4V7/);
    assert.ok(d.bias.vd < 0 && d.bias.id < 0);
    const ordinary = nP.D();
    assert.equal(ordinary.model.name, '1N4148');
    assert.equal(ordinary.bias.vd, .6);
    assert.equal(ordinary._schematic.symbol, 'diode-1n4148');
});

test('blocking, breakdown and forward DC/RF/classical noise agree with independent ngspice at two temperatures', () => {
    for (const reference of zenerReference.points) {
        const d = nP.D({model: 'BZX384-B4V7', temperature: reference.temperature,
            qPoint: {vd: reference.vd}, fList: reference.spars.map(row => row[0])});
        // Historical simulator thermal constants cause ppm differences; its gmin
        // is also present in reported gd in the deeply blocking region.
        close(d.bias.id, reference.id, 1e-20);
        close(d.smallSignal.conductance, reference.conductance, 2e-24);
        d.spars.forEach((row, i) => row.slice(1).forEach((z, j) => {
            close(z.x, reference.spars[i][j + 1][0], 4e-6, 0);
            close(z.y, reference.spars[i][j + 1][1], 4e-6, 0);
        }));
        d.out('NF21dB', {referenceTemperature: reference.temperature}).slice(1).forEach((row, i) =>
            close(row[1], reference.noiseFigureDb[i], 2e-5, 0));
        const network = biasNetwork(d), q = network.operatingPoint.components[5].qPoint;
        assert.equal(network.operatingPoint.converged, true);
        close(q.vd, reference.network.vd, 2e-8, 0);
        close(q.id, reference.network.id);
        close((-8 - q.vd) / 2000, q.id, 1e-11, 0);
        const rebuilt = network._rfModel.components[5];
        assert.equal(rebuilt._schematic.symbol, 'zener-diode');
        const direct = nP.D({model: d.model, temperature: reference.temperature,
            qPoint: {vd: q.vd}, fList: d.global.fList});
        rebuilt.spars.forEach((row, i) => row.slice(1).forEach((z, j) => close(z.sub(direct.spars[i][j + 1]).mag(), 0, 2e-9, 0)));
    }
});

test('supplied and named Zener records share DC/RF/noise/IM and immutable network handoff', () => {
    const saved = nP.global();
    try {
        nP.global.fList = [10e6, 100e6];
        nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
        const record = diodeModel('BZX384-B4V7'), before = structuredClone(record);
        Object.freeze(record.parameters); Object.freeze(record);
        const foreign = vm.runInNewContext('(' + JSON.stringify(before) + ')');
        // JSON cannot represent Infinity; raw records may simply omit defaulted fields.
        delete foreign.leakageResistance;
        const named = nP.D({model: 'BZX384-B4V7'}), supplied = nP.D({model: record});
        const repl = nP.D({model: foreign});
        assert.deepEqual(named.spars, supplied.spars);
        assert.deepEqual(named.noise, supplied.noise);
        assert.deepEqual(named.spars, repl.spars);
        assert.deepEqual(named.ivTable({vd: {start: -4.8, stop: .6, points: 31}}), supplied.ivTable({vd: {start: -4.8, stop: .6, points: 31}}));
        for (const voltage of [-2, -8, -12]) {
            const a = biasNetwork(named, voltage), b = biasNetwork(supplied, voltage);
            assert.deepEqual(a.operatingPoint, b.operatingPoint);
            assert.deepEqual(a.spars, b.spars);
            assert.deepEqual(a.noise, b.noise);
            assert.deepEqual(a.out('s21dB', 'NF21dB', 'IM2sum21dBm', 'IM3lower21dBm'),
                b.out('s21dB', 'NF21dB', 'IM2sum21dBm', 'IM3lower21dBm'));
        }
        assert.equal(named.bias.vd, .6);
        assert.deepEqual(record, before);
        assert.notEqual(supplied.model.parameters, record.parameters);
        assert.throws(() => nP.D({model: {parameters: {}, schematicVariant: 'other'}}), /schematicVariant/);
        const custom = nP.D({model: {name: 'My Zener', schematicVariant: 'zener', parameters: {BV: 6.2, IBV: .005}}, qPoint: {vd: -6.2}});
        assert.equal(custom._schematic.symbol, 'zener-diode');
        assert.equal(custom.model.parameters.RS, 0); // No hidden manufacturer fit.
    } finally { nP.global(saved); }
});

test('breakdown current derivatives and direct weak nonlinear order slopes remain consistent', () => {
    const d = nP.D({model: 'BZX384-B4V7', qPoint: {vd: -4.7}, temperature: 300.15, fList: [100e6]});
    const p = diodeTemperature(d.model.parameters, d.bias.temperature), h = 1e-6;
    for (const voltage of [-4.6, -4.7, -4.8]) {
        const q = junctionCurrent(p, voltage), a = junctionCurrent(p, voltage + h), b = junctionCurrent(p, voltage - h);
        close((a.current - b.current) / (2 * h), q.conductance, 1e-12, 1e-8);
        close((a.conductance - b.conductance) / (2 * h), q.second, 1e-12, 1e-8);
        close((a.second - b.second) / (2 * h), q.third, 1e-12, 1e-8);
    }
    const selectors = ['IM2sum21dBm', 'IM3lower21dBm', 'OIP3lower21dBm'];
    const low = d.out(...selectors, {twoTone: {spacingHz: 1e6, p1dBm: -80, p2dBm: -80}})[1];
    const high = d.out(...selectors, {twoTone: {spacingHz: 1e6, p1dBm: -70, p2dBm: -70}})[1];
    assert.ok(low.every(Number.isFinite));
    close(high[1] - low[1], 20, 1e-8, 0); close(high[2] - low[2], 30, 1e-8, 0);
    close(high[3], low[3], 1e-8, 0);
    const covariance = d.noise[0].C;
    assert.ok(covariance[0][0].x > 0);
    close(covariance[0][0].x, -covariance[0][1].x, 1e-30, 0);
});

test('nominal datasheet bounds and repeated Zener placements retain independent DC states', () => {
    const d = nP.D({model: 'BZX384-B4V7', temperature: 298.15,
        qPoint: {vd: -4.7 - .387 * .005}, fList: [10e6]});
    close(d.bias.id, -.005, 1e-9, 0);
    assert.ok(-d.bias.vd >= 4.61 && -d.bias.vd <= 4.79);
    assert.ok(d.smallSignal.dynamicResistance < 80);
    const branch = nP.cascade(d, d), n = biasNetwork(branch, -12, d.bias.temperature);
    const points = n.operatingPoint.components.filter(p => p.qPoint).map(p => p.qPoint);
    assert.equal(points.length, 2);
    assert.ok(points.every(p => p.id < -1e-3 && p.vd < -4.6));
    close(points[0].id, points[1].id, 1e-11, 0);
    assert.notEqual(points[0].va, points[1].va);
    assert.notEqual(n._rfModel.components[5]._rfModel.components[0], n._rfModel.components[5]._rfModel.components[1]);
    assert.equal(d.bias.vd, -4.7 - .387 * .005);
});
