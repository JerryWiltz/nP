// Modified: 2026-11-22
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as nP from '../src/index.js';
import {nPort} from '../src/np-nport/src/nPort';
import {noiseDiodeModel} from '../src/np-nport/src/diodes/noiseDiodeModels';
import {avalancheNoisePoint} from '../src/np-nport/src/diodes/avalancheNoise';
import {noiseDiodeReference} from './fixtures/noise-diode-reference';
import {BOLTZMANN} from '../src/np-nport/src/physicalConstants';
import {schematicGraph} from '../src/np-chart/src/schematic';

function close(actual, expected, relative = 1e-9, absolute = 1e-30) {
    assert.ok(Number.isFinite(actual) && Number.isFinite(expected));
    assert.ok(Math.abs(actual - expected) <= absolute + relative * Math.abs(expected), `${actual} != ${expected}`);
}
function asSource(device) {
    const ground = nP.Short({fList: device.global.fList});
    return nP.nodal([device, 1, 2], [ground, 1], ['out', 2]);
}

test('dedicated avalanche device retains reference provenance and reports absent DC/nonlinear fits', () => {
    const d = nP.NoiseDiode();
    assert.equal(d.model.name, 'NC406_REFERENCE');
    assert.match(d.model.mathematicalModel, /avalanche-zone/);
    assert.match(d.model.limitations, /Plot-derived.*not a calibrated/);
    assert.equal(d.qPoint.id, -.0167); assert.equal(d.qPoint.vd, null);
    assert.equal(d.qPoint.temperature, 300);
    assert.equal(d._dcModel.kind, 'requiresModel');
    assert.ok(Object.isFrozen(d._dcModel.definition.parameters.record.noiseFit.coefficientsDb));
    assert.throws(() => d.solveDC(), error => error.code === 'DC_UNSUPPORTED_MODELS');
    assert.throws(() => d.out('IM3lower21dBm', {twoTone: {spacingHz: 1e6, p1dBm: -30, p2dBm: -30}}), /no nonlinear current\/charge fit/);
    const drawing = schematicGraph(d);
    assert.equal(drawing.components[0].id, 'ND1');
    assert.equal(drawing.components[0].symbol, 'noise-diode');
    const zener = nP.D({model: 'BZX384-B4V7'});
    assert.equal(schematicGraph(zener).components[0].symbol, 'zener-diode');
    assert.equal(d.spars[0].length, 5);
});

test('RF and avalanche/contact covariance agree with an independent ngspice equivalent circuit', () => {
    const d = nP.NoiseDiode({fList: noiseDiodeReference.map(p => p.frequency)});
    for (const [i, reference] of noiseDiodeReference.entries()) {
        d.spars[i].slice(1).forEach((z, j) => {
            close(z.x, reference.spars[j][0], 1e-10, 1e-13);
            close(z.y, reference.spars[j][1], 1e-10, 1e-13);
        });
        close(d.noise[i].C[0][0].x, reference.deviceNoiseWaveDensity, 1e-6);
        assert.equal(d.noise[i].C[0][0].x, d.noise[i].C[1][1].x);
        assert.equal(d.noise[i].C[0][0].x, -d.noise[i].C[0][1].x);
        assert.ok(d.noise[i].C[0][0].x > 0);
    }
});

test('RF cancellation gives finite continuous results at the avalanche pole', () => {
    const record = noiseDiodeModel(), fa = record.parameters.avalancheFrequency;
    const exact = avalancheNoisePoint(record, fa);
    for (const factor of [1 - 1e-8, 1 + 1e-8]) {
        const nearby = avalancheNoisePoint(record, fa * factor);
        close(nearby.impedance.x, exact.impedance.x, 1e-6);
        close(nearby.impedance.y, exact.impedance.y, 1e-6);
        close(nearby.voltageDensity, exact.voltageDensity, 1e-6);
    }
    const d = nP.NoiseDiode({fList: [fa]});
    assert.ok(d.noiseTable()[1].every(Number.isFinite));
});

test('named, supplied and foreign-context records share equations and preserve caller data', () => {
    const record = noiseDiodeModel(), before = structuredClone(record), fList = [2e9, 10e9, 40e9];
    const a = nP.NoiseDiode({fList}), b = nP.NoiseDiode({model: record, fList});
    const foreign = vm.runInNewContext('(' + JSON.stringify(record) + ')');
    const c = nP.NoiseDiode({model: foreign, fList});
    assert.deepEqual(a.spars, b.spars); assert.deepEqual(a.noise, b.noise);
    assert.deepEqual(a.noiseTable(), c.noiseTable());
    assert.deepEqual(asSource(a).noise, asSource(b).noise);
    assert.deepEqual(record, before);
    const original = b.noiseTable();
    record.parameters.biasCurrent = 1; record.noiseFit.coefficientsDb[0] = 999;
    b.model.noiseFit.coefficientsDb[0] = 999; b.global.fList[0] = 1;
    assert.deepEqual(b.noiseTable(), original);
    const changed = noiseDiodeModel(); changed.noiseFit.coefficientsDb[0] += 3;
    const higher = nP.NoiseDiode({model: changed, fList});
    assert.deepEqual(a.spars, higher.spars);
    assert.ok(higher.noise[0].C[0][0].x > a.noise[0].C[0][0].x);
});

test('source ENR, available power and mismatched load delivery use the correct reference plane', () => {
    const d = nP.NoiseDiode({fList: [2e9, 10e9, 40e9]}), source = asSource(d), table = d.noiseTable();
    source.spars.forEach((row, i) => {
        const gamma = row[1].mag(), emitted = source.noise[i].C[0][0].x, t = table[i + 1][2];
        close(emitted, BOLTZMANN * t * (1 - gamma ** 2));
        close(10 * Math.log10(emitted / 1e-3), table[i + 1][4]);
        close(table[i + 1][1], 10 * Math.log10((t - 290) / 290));
        close(gamma, table[i + 1][5]);
    });
    const changed = d.noiseTable({coldTemperature: 300, referenceTemperature: 300});
    close(changed[1][1], 10 * Math.log10((changed[1][2] - 300) / 300));
    assert.throws(() => d.noiseTable({coldTemperature: 1e9}), /above/);
    assert.throws(() => d.noiseTable({coldTemperature: -1}), /kelvin/);
    assert.throws(() => d.noiseTable({unknown: true}), /Unknown/);
});

test('attenuation propagates diode noise and independent resistor noise with mismatch feedback', () => {
    const d = nP.NoiseDiode({fList: [10e9]}), source = asSource(d);
    const pad = nP.Attn(10, 290, {fList: [10e9]});
    const network = nP.nodal([d, 1, 2], [nP.Short({fList: [10e9]}), 1], [pad, 2, 3], ['out', 3]);
    const gain = .1, gamma = source.spars[0][1].mag(), c = source.noise[0].C[0][0].x;
    const expected = gain * c + BOLTZMANN * 290 * (1 - gain) * (1 + gain * gamma ** 2);
    close(network.noise[0].C[0][0].x, expected);
    close(network.spars[0][1].mag(), gain * gamma);
    assert.throws(() => nP.cascade(d, pad).out('OIP3lower21dBm',
        {twoTone: {spacingHz: 1e6, p1dBm: -30, p2dBm: -30}}), /no nonlinear current\/charge fit/);
    const supply = nP.V(10, {fList: [10e9]});
    const biased = nP.nodal([d, 1, 2], [supply, 2, 3], [nP.Short({fList: [10e9]}), 3], ['out', 1]);
    assert.throws(() => biased.solveDC(),
        error => error.code === 'DC_UNSUPPORTED_MODELS');
});

test('synthetic hot/cold Y factor recovers known receiver NF with known source mismatch', () => {
    const d = nP.NoiseDiode({fList: [10e9]}), hot = asSource(d), gamma = hot.spars[0][1];
    const cold = new nPort(); cold.setglobal(d.global); cold.setspars(hot.spars);
    cold.noise = [{frequency: 10e9, C: [[nP.complex(BOLTZMANN * 290 * (1 - gamma.mag() ** 2), 0)]]}];
    const receiver = new nPort(), gain = 100, factor = 10 ** (3 / 10), te = (factor - 1) * 290;
    receiver.setglobal(d.global);
    receiver.setspars([[10e9, nP.complex(0, 0), nP.complex(0, 0), nP.complex(10, 0), nP.complex(0, 0)]]);
    receiver.noise = [{frequency: 10e9, C: [[nP.complex(0, 0), nP.complex(0, 0)],
        [nP.complex(0, 0), nP.complex(BOLTZMANN * te * gain, 0)]]}];
    const on = nP.nodal([hot, 1], [receiver, 1, 2], ['out', 2]);
    const off = nP.nodal([cold, 1], [receiver, 1, 2], ['out', 2]);
    const y = on.noise[0].C[0][0].x / off.noise[0].C[0][0].x;
    const mismatch = 1 - gamma.mag() ** 2, th = d.noiseTable()[1][2];
    const recovered = mismatch * (th - y * 290) / (y - 1);
    close(10 * Math.log10(1 + recovered / 290), 3);
});

test('invalid, uncharacterized and incomplete records are rejected without borrowed fits', () => {
    for (const fList of [[], [0], [1e9], [41e9], [NaN]]) assert.throws(() => nP.NoiseDiode({fList}));
    assert.throws(() => nP.NoiseDiode({temperature: 290}), /fixed-temperature/);
    assert.throws(() => nP.NoiseDiode({model: {parameters: {}}}), /requires parameter/);
    const model = noiseDiodeModel(); delete model.noiseFit;
    assert.throws(() => nP.NoiseDiode({model}), /noiseFit/);
    for (const mutate of [m => { m.parameters.transitTime = -1; }, m => { m.noiseFit.coefficientsDb = [1, 2]; },
        m => { m.noiseFit.extra = 1; }, m => { m.parameters.extra = 1; }]) {
        const record = noiseDiodeModel(); mutate(record); assert.throws(() => nP.NoiseDiode({model: record}));
    }
});
