// Modified: 2026-11-24
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as nP from '../src/index.js';
import {intermodAt, waveDbm} from '../src/np-nport/src/intermod';
import {pinChargeReference as ref} from './fixtures/pin-charge-reference';
import {pinChargePoint, pinChargeParameters, pinPair, pinStorage} from '../src/np-nport/src/diodes/pinChargeEquations';
import {pinChargeLinear} from '../src/np-nport/src/diodes/pinChargeRf';
import {pinModel} from '../src/np-nport/src/diodes/pinModels';

function close(a, b, relative = 8e-6, absolute = 1e-12) {
    assert.ok(Number.isFinite(a) && Math.abs(a - b) <= absolute + relative * Math.abs(b), `${a} != ${b}`);
}
function biasCircuit(diode, voltage = 2) {
    const v = nP.V(voltage), r = nP.R(1000), ground = nP.Short();
    return nP.nodal(
        [v, 1, 0],
        [r, 1, 2],
        [diode, 3, 4],
        [ground, 5],
        [nP.Tee(), 2, 3, 6],
        [nP.Tee(), 0, 4, 5],
        ['out', 6]
    );
}

test('PIN defaults to a documented charge-storage reference; named Skyworks model remains compatible', () => {
    const d = nP.PIN();
    assert.equal(d.model.name, 'CHARGE_STORAGE_REFERENCE');
    assert.equal(d.model.manufacturer, null);
    assert.equal(d.model.modelType, 'charge-storage');
    assert.equal(d.qPoint.region, 'automatic');
    assert.equal(d._dcModel.definition.modelId, 'pin-charge');
    assert.equal(d._intermod.type, 'pin-charge');
    assert.ok(Object.isFrozen(d._dcModel.definition.record.parameters));
    assert.equal(nP.PIN({model: 'SMP1307-011LF'})._dcModel.definition.modelId, 'pin');
});

test('continuous DC bias, storage-sensitive RF and source noise agree with an independent SPICE subcircuit', () => {
    for (const row of ref.biases) {
        const d = nP.PIN({model: ref.model, qPoint: {vd: row.voltage}, fList: row.rf.map(item => item.frequency)});
        close(d.qPoint.id, row.current);
        close(d.qPoint.junctionVoltage, row.junctionVoltage, 2e-6, 1e-10);
        for (let i = 0; i < row.rf.length; i++) {
            const r = row.rf[i], s = d.spars[i];
            for (const [entry, expected] of [[s[1], r.s11], [s[3], r.s21]]) {
                close(entry.x, expected[0], 1e-5, 2e-6); close(entry.y, expected[1], 1e-5, 2e-7);
            }
            assert.deepEqual(s[1], s[4]); assert.deepEqual(s[2], s[3]);
            const noise = d.noise[i].C[1][1].x;
            // Reverse PN midpoint is poorly determined relative to SPICE's
            // 1e-14 S ground shunts. Compare total noise there, avoiding an
            // ill-conditioned subtraction of much larger source noise.
            if (row.sourceVoltage < 0) {
                const kT = ref.ngspiceBoltzmann * ref.temperature;
                const npTotal = noise + s[3].mag() ** 2 * kT;
                const spiceTotal = r.outputNoise + (r.s21[0] ** 2 + r.s21[1] ** 2) * kT;
                close(npTotal, spiceTotal, 3e-4, 1e-29);
            } else close(noise, r.outputNoise, 1e-5, 1e-29);
            assert.ok(noise >= 0); assert.equal(noise, -d.noise[i].C[0][1].x);
        }
    }
});

test('the RF zero-frequency conductance matches the DC derivative and both high-injection dialects have correct derivatives', () => {
    const record = pinModel(ref.model), temperature = ref.temperature;
    for (const vd of [-2, 0, .6, .9, 1.1]) {
        const point = pinChargePoint(record, temperature, vd), delta = 1e-6;
        const numeric = (pinChargePoint(record, temperature, vd + delta).id - pinChargePoint(record, temperature, vd - delta).id) / (2 * delta);
        close(point.conductance, numeric, 2e-6, 1e-12);
        const linear = pinChargeLinear({record, temperature, point, referenceImpedance: 50}, 0);
        close(linear.port.x, point.conductance, 1e-10); close(linear.port.y, 0);
    }
    for (const IKMODEL of [1, 2]) {
        const p = pinChargeParameters({...record, parameters: {...record.parameters, IKMODEL}}, temperature);
        for (const voltage of [.5, .9, 1.2]) {
            const h = 1e-5, a = pinPair(p, voltage), before = pinPair(p, voltage - h), after = pinPair(p, voltage + h);
            close(a.data[1], (after.data[0] - before.data[0]) / (2 * h), 2e-6);
            close(2 * a.data[3], (after.data[1] - before.data[1]) / (2 * h), 2e-6);
            close(6 * a.data[6], (after.data[3] - before.data[3]) / h, 2e-6);
        }
    }
});

test('lifetime and width affect the RF response through the dynamic storage ladder', () => {
    const record = pinModel(ref.model), settings = {model: record, qPoint: {vd: 1}, fList: [1e3, 1e6, 1e9]};
    const first = nP.PIN(settings);
    const second = nP.PIN({...settings, model: {...record, parameters: {...record.parameters, TAU: record.parameters.TAU * 2}}});
    assert.notDeepEqual(first.spars, second.spars);
    const response = pinStorage(record, 1e6), negative = pinStorage(record, -1e6);
    close(response.current.x, negative.current.x); close(response.current.y, -negative.current.y);
    assert.notEqual(pinStorage(record, 0).current.x, response.current.x);
    assert.ok(first.smallSignal.storedCharge > 0);
});

test('named, supplied and foreign-context charge records match including IM, temperature and independent bias handoff', () => {
    const record = pinModel();
    const foreignData = vm.runInNewContext('(' + JSON.stringify(ref.model) + ')');
    assert.deepEqual(nP.PIN({model: ref.model}).spars, nP.PIN({model: foreignData}).spars);
    const {modelType: omittedType, ...implicit} = ref.model;
    assert.equal(omittedType, 'charge-storage');
    assert.deepEqual(nP.PIN({model: ref.model}).spars, nP.PIN({model: implicit}).spars);
    for (const temperature of [298.15, 330]) {
        const named = nP.PIN({temperature}), supplied = nP.PIN({model: record, temperature});
        assert.deepEqual(named.spars, supplied.spars); assert.deepEqual(named.noise, supplied.noise);
        const a = biasCircuit(named), b = biasCircuit(supplied);
        assert.deepEqual(a.spars, b.spars); assert.deepEqual(a.noise, b.noise);
        const q = a.operatingPoint.components.find(item => item.constructorName === 'PIN').qPoint;
        close(q.id, (2 - q.vd) / 1000, 1e-8);
    }
    nP.global.fList = [1e6]; nP.global.twoTone = {spacingHz: 1e5, p1dBm: -50, p2dBm: -50};
    try {
        const named = nP.PIN({qPoint: {vd: 1.4}}), supplied = nP.PIN({model: record, qPoint: {vd: 1.4}});
        const a = named.out('OIP3lower21dBm', 'IM3lower21dBm');
        assert.ok(a[1].slice(1).every(Number.isFinite));
        assert.deepEqual(a, supplied.out('OIP3lower21dBm', 'IM3lower21dBm'));
    } finally { nP.global.twoTone = undefined; }
});

test('reused templates acquire distinct forward/reverse states without region options or mutation', () => {
    nP.global.fList = [1e6];
    const d = nP.PIN(), original = structuredClone(d.qPoint);
    const r1 = nP.R(1000), r2 = nP.R(2000), v = nP.V(2), ground = nP.Short();
    const circuit = nP.nodal(
        [v, 1, 10],
        [nP.Tee(), 1, 11, 12],
        [r1, 11, 2],
        [r2, 12, 3],
        [nP.Tee(), 2, 21, 22],
        [nP.Tee(), 3, 23, 24],
        [d, 21, 31],
        [d, 32, 23],
        [nP.Tee4(), 0, 10, 31, 32],
        [ground, 0],
        ['out', 22, 24]
    );
    const points = circuit.operatingPoint.components.filter(item => item.constructorName === 'PIN').map(item => item.qPoint);
    assert.ok(points[0].id > 0); assert.ok(points[1].id < 0);
    assert.deepEqual(d.qPoint, original);
    const a = nP.PIN({qPoint: {vd: points[0].vd}}), b = nP.PIN({qPoint: {vd: points[1].vd}}), open = nP.Open();
    const fixed = nP.nodal(
        [open, 1],
        [open, 10],
        [nP.Tee(), 1, 11, 12],
        [r1, 11, 2],
        [r2, 12, 3],
        [nP.Tee(), 2, 21, 22],
        [nP.Tee(), 3, 23, 24],
        [a, 21, 31],
        [b, 32, 23],
        [nP.Tee4(), 0, 10, 31, 32],
        [ground, 0],
        ['out', 22, 24]
    );
    circuit.spars.forEach((row, i) => row.slice(1).forEach((s, j) => { close(s.x, fixed.spars[i][j + 1].x, 1e-8); close(s.y, fixed.spars[i][j + 1].y, 1e-8); }));
});

test('incomplete/unknown charge-storage data reject and curve settings preserve the automatic bias range', () => {
    assert.throws(() => nP.PIN({model: {modelType: 'charge-storage', parameters: {}}}), /requires parameter/);
    assert.throws(() => nP.PIN({model: {...ref.model, parameters: {...ref.model.parameters, TT: 1e-9}}}), /Unsupported/);
    assert.throws(() => nP.PIN({region: 'forward'}), /automatic/);
    assert.throws(() => nP.PIN({temperature: 0}), /temperature/);
    assert.throws(() => nP.PIN({fList: [-1]}), /frequencies/);
    nP.global.twoTone = {spacingHz: 1e5, p1dBm: -60, p2dBm: -60};
    try {
        for (const IKMODEL of [1, 2]) {
            const zero = nP.PIN({model: {...ref.model, parameters: {...ref.model.parameters, IKMODEL}}, qPoint: {vd: 0}});
            assert.throws(() => zero.out('OIP3lower21dBm'), /no unique cubic Taylor expansion/);
        }
    } finally { nP.global.twoTone = undefined; }

    const d = nP.PIN({bias: {vd: {start: -2, stop: 1, points: 3}}});
    assert.deepEqual(d.dc.bias.vd, {start: -2, stop: 1, points: 3});
    assert.equal(d.ivTable().length, 4);
    assert.ok(d.ivTable()[1][1] < 0);
});


test('charge-storage Volterra products match independent SPICE transient Fourier coefficients and weak power slopes', () => {
    const bias = ref.biases.find(row => row.sourceVoltage === 1.5);
    nP.global.fList = [1e6];
    const phases = {phase1Deg: -90, phase2Deg: -90}, outputs = [];
    try {
        for (const row of ref.twoTone) {
            const power = 10 * Math.log10(row.peakSourceVoltage ** 2 / (8 * 50) / .001);
            nP.global.twoTone = {spacingHz: 1e5, p1dBm: power, p2dBm: power, ...phases};
            const d = nP.PIN({model: ref.model, qPoint: {vd: bias.voltage}});
            const result = intermodAt(d, 1e6, 0, d.global);
            for (const [name, frequency] of Object.entries(result.frequencies)) {
                const expected = row.products[String(frequency)], wave = result.waves[name][1];
                assert.ok(Math.abs(waveDbm(wave) - expected.dbm) < .03, name + ' SPICE level');
                close(wave.x * Math.sqrt(50), expected.rms[0], .006, 1e-12);
                close(wave.y * Math.sqrt(50), expected.rms[1], .006, 1e-12);
            }
            outputs.push(result);
        }
        close(waveDbm(outputs[1].waves.im2sum[1]) - waveDbm(outputs[0].waves.im2sum[1]), 12.0411998266, 1e-9);
        close(waveDbm(outputs[1].waves.im3lower[1]) - waveDbm(outputs[0].waves.im3lower[1]), 18.0617997398, 1e-9);
    } finally { nP.global.twoTone = undefined; }
});
