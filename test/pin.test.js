// Modified: 2026-11-22
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as nP from '../src/index.js';
import {pinReference} from './fixtures/pin-reference';
import {pinPoint} from '../src/np-nport/src/diodes/pinEquations';
import {pinModel} from '../src/np-nport/src/diodes/pinModels';
import {schematicGraph} from '../src/np-chart/src/schematic';

function selectedPin(options = {}) { return nP.PIN({model: 'SMP1307-011LF', ...options}); }

function close(a, b, relative = 2e-6, absolute = 1e-15) {
    assert.ok(Number.isFinite(a) && Math.abs(a - b) <= absolute + relative * Math.abs(b), `${a} != ${b}`);
}
function voltageAtCurrent(current) {
    const p = pinModel('SMP1307-011LF').parameters;
    return p.VI + p.N * 1.380649e-23 * 300.15 / 1.602176634e-19 * Math.log1p(current / p.IS) + p.RS * current;
}
function biased(record, voltage, region = 'forward') {
    const d = selectedPin({model: record, region}), v = nP.V(voltage), r = nP.R(1000), ground = nP.Short();
    return nP.nodal([v, 1, 0], [r, 1, 2], [d, 2, 0], [ground, 0], ['out', 2]);
}

test('PIN retains sourced DC/RF parameters, selected region, own symbol and immutable DC definition', () => {
    const d = selectedPin();
    assert.equal(d.model.name, 'SMP1307-011LF'); assert.equal(d.qPoint.region, 'forward');
    assert.equal(d.model.parameters.RS, 1.48); assert.equal(d.smallSignal.rfSeriesResistance, 2.2);
    close(d.smallSignal.intrinsicResistance, .08 / d.qPoint.id);
    close(d.smallSignal.storedCharge, 1.5e-6 * d.qPoint.id);
    assert.equal(schematicGraph(d).components[0].symbol, 'pin-diode');
    assert.equal(d._dcModel.definition.modelId, 'pin');
    assert.ok(Object.isFrozen(d._dcModel.definition.record.packageParameters));
    assert.throws(() => d.out('OIP3lower21dBm', {twoTone: {spacingHz: 20e6, p1dBm: -30, p2dBm: -30}}), /carrier-storage model/);
});

test('selected-region DC agrees with independent SPICE PN and I-region branches', () => {
    for (const row of pinReference.dc) {
        const d = selectedPin({qPoint: {vd: row.voltage}});
        close(d.qPoint.id, row.current, 6e-6);
        close(voltageAtCurrent(row.current), row.voltage, 4e-7);
    }
    const reverse = selectedPin({region: 'reverse', qPoint: {vd: -5}});
    close(reverse.qPoint.id, pinReference.reverseCurrent, 2e-6);
    assert.equal(reverse.smallSignal.intrinsicResistance, 4e6);
    assert.equal(reverse.smallSignal.intrinsicCapacitance, 0);
    const table = selectedPin().ivTable({vd: {start: .6, stop: 1, points: 3}});
    assert.deepEqual(table[0], ['vd (V)', 'id (A)']); assert.equal(table.length, 4);
    assert.ok(table[3][1] > table[1][1]);
});

test('all four RF entries and thermal covariance agree with independent SPICE package networks', () => {
    for (const row of pinReference.rf) {
        const d = selectedPin({region: row.region, qPoint: {vd: row.current ? voltageAtCurrent(row.current) : -5}, fList: [row.frequency]});
        d.spars[0].slice(1).forEach((s, j) => {
            close(s.x, row.spars[j][0], 1e-8, 1e-12); close(s.y, row.spars[j][1], 1e-8, 1e-12);
        });
        close(d.noise[0].C[1][1].x, row.noise, 1e-6, 1e-32);
        assert.equal(d.noise[0].C[0][0].x, -d.noise[0].C[0][1].x);
        assert.ok(d.noise[0].C[0][0].x >= 0);
    }
});

test('named/supplied/foreign-context records match through direct construction and network bias handoff', () => {
    const model = pinModel('SMP1307-011LF'), saved = structuredClone(model), named = selectedPin(), supplied = selectedPin({model});
    const foreign = selectedPin({model: vm.runInNewContext('(' + JSON.stringify(model) + ')')});
    assert.deepEqual(named.spars, supplied.spars); assert.deepEqual(named.noise, foreign.noise);
    const a = biased('SMP1307-011LF', 2), b = biased(model, 2);
    assert.deepEqual(a.spars, b.spars); assert.deepEqual(a.noise, b.noise);
    assert.deepEqual(a.operatingPoint.operatingPoints, b.operatingPoint.operatingPoints);
    assert.deepEqual(model, saved);
    supplied.model.parameters.VI = 999; model.parameters.VI = 999;
    assert.equal(supplied._dcModel.definition.record.parameters.VI, .08);
    assert.equal(supplied.ivTable({vd: {start: .6, stop: .8, points: 2}}).length, 3);
});

test('one template gets separate solved states and RF resistance in two forward bias branches', () => {
    const d = selectedPin(), v = nP.V(2), r1 = nP.R(1000), r2 = nP.R(2000), ground = nP.Short();
    const before = JSON.stringify(d);
    const circuit = nP.nodal([v, 1, 0], [r1, 1, 2], [r2, 1, 3], [d, 2, 0], [d, 3, 0], [ground, 0], ['out', 2, 3]);
    const points = circuit.operatingPoint.components.filter(c => c.constructorName === 'PIN').map(c => c.qPoint);
    assert.equal(points.length, 2); assert.ok(points[0].id > points[1].id);
    for (const q of points) close(q.vd, voltageAtCurrent(q.id), 1e-7);
    const a = selectedPin({qPoint: {vd: points[0].vd}}), b = selectedPin({qPoint: {vd: points[1].vd}}), open = nP.Open();
    const fixed = nP.nodal([open, 1], [r1, 1, 2], [r2, 1, 3], [a, 2, 0], [b, 3, 0], [ground, 0], ['out', 2, 3]);
    circuit.spars.forEach((row, index) => row.slice(1).forEach((s, port) => {
        close(s.x, fixed.spars[index][port + 1].x, 1e-8);
        close(s.y, fixed.spars[index][port + 1].y, 1e-8);
    }));
    assert.equal(JSON.stringify(d), before);
    const standalone = pinPoint(pinModel('SMP1307-011LF'), 300.15, 'forward', points[0].vd);
    close(standalone.id, points[0].id);
});

test('supplied RF resistance changes RF without silently altering the separate PN DC law', () => {
    const record = pinModel('SMP1307-011LF'), original = selectedPin();
    record.parameters.RRF = 20;
    const changed = selectedPin({model: record});
    close(changed.qPoint.id, original.qPoint.id);
    assert.notDeepEqual(changed.spars, original.spars);
    assert.notDeepEqual(changed.noise, original.noise);
});

test('reverse external bias rebuilds the reverse equivalent and invalid operating regions fail explicitly', () => {
    const circuit = biased('SMP1307-011LF', -5, 'reverse');
    assert.ok(circuit.operatingPoint.components.find(c => c.constructorName === 'PIN').qPoint.id < 0);
    assert.throws(() => biased('SMP1307-011LF', -5), /forward RF bias current/);
    assert.throws(() => selectedPin({region: 'reverse', qPoint: {vd: .1}}), /nonpositive/);
});

test('invalid/unknown data and unsupported frequency/temperature domains are rejected', () => {
    for (const options of [{model: {parameters: {}}}, {region: 'auto'}, {qPoint: null}, {qPoint: {id: .01}},
        {temperature: 293}, {fList: []}, {fList: [0]}, {fList: [1e6]}, {fList: [4e9]}, {qPoint: {vd: .08}}]) {
        assert.throws(() => selectedPin(options));
    }
    for (const mutate of [m => {m.parameters.TT = 1e-6;}, m => {m.parameters.RR = 0;},
        m => {m.packageParameters.unknown = 1;}, m => {m.operatingRange.maxFrequency = 0;},
        m => {m.inductors = [{from: 1, to: 2, value: 1e-9}];}]) {
        const model = pinModel('SMP1307-011LF'); mutate(model); assert.throws(() => selectedPin({model}));
    }
});
