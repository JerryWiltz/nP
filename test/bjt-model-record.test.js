// Modified: 2026-11-21
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {npnModel} from '../src/np-nport/src/transistors/bjt/npnModels';
import {pnpModel} from '../src/np-nport/src/transistors/bjt/pnpModels';
import {dcSnapshot} from '../src/np-nport/src/dcModel';

const families = [[nP.NPN, npnModel, '2N3904', 1], [nP.NPN, npnModel, 'BFR93A', 1],
    [nP.PNP, pnpModel, '2N3906', -1]];

function commonEmitter(q) {
    return nP.nodal([q, 1, 2, 3], [nP.Short(), 3], ['out', 1, 2]);
}

function divider(q, polarity) {
    return nP.nodal(
        [nP.C(1e-9), 100, 10],
        [nP.Tee4(), 11, 10, 12, 13],
        [nP.R(100e3), 14, 11],
        [nP.R(22e3), 12, 15],
        [nP.Short(), 15],
        [q, 13, 20, 30],
        [nP.Tee(), 21, 20, 22],
        [nP.R(2200), 23, 21],
        [nP.C(1e-9), 22, 101],
        [nP.R(1000), 30, 31],
        [nP.Short(), 31],
        [nP.Tee(), 24, 14, 23],
        [nP.V(polarity * 12), 24, 25],
        [nP.Short(), 25],
        ['out', 100, 101]
    );
}

function sameElectrical(actual, expected) {
    assert.deepEqual(actual.bias, expected.bias);
    assert.deepEqual(actual.smallSignal, expected.smallSignal);
    assert.deepEqual(actual.spars, expected.spars);
    assert.deepEqual(actual.noise, expected.noise);
    assert.deepEqual(actual._intermod.point.data, expected._intermod.point.data);
}

for (const [constructor, resolve, name, polarity] of families) {
    test(name + ' named and supplied records give exactly identical DC, RF, noise and IM', () => {
        const previous = nP.global();
        try {
            nP.global.fList = [10e6, 100e6, 1e9];
            nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
            const record = dcSnapshot(resolve(name));
            for (const temperature of [293, 330]) for (const configuration of ['commonEmitter', 'commonBase', 'commonCollector']) {
                const options = {temperature, configuration, qPoint: configuration === 'commonBase' ?
                    {ie: polarity * 1e-3, vcb: polarity * 3} : {ib: polarity * 30e-6, vce: polarity * 4}};
                const named = constructor({...options, model: name.toLowerCase()});
                const supplied = constructor({...options, model: record});
                sameElectrical(supplied, named);
                assert.deepEqual(supplied.model, named.model);
                assert.deepEqual(supplied.solveDC(), named.solveDC());
                const curves = configuration === 'commonBase' ? {ie: {points: 3}, vcb: {points: 5}} :
                    {ib: {points: 3}, vce: {points: 5}};
                assert.deepEqual(supplied.ivTable(curves), named.ivTable(curves));
                const selectors = ['s21dB', 'NF21dB', 'IM2sum21dBm', 'IM3lower21dBm', 'OIP3lower21dBm'];
                const actual = commonEmitter(supplied).out(...selectors);
                assert.ok(actual.slice(1).every(row => row.every(Number.isFinite)));
                assert.deepEqual(actual, commonEmitter(named).out(...selectors));
            }
        } finally { nP.global(previous); }
    });

    test(name + ' supplied records survive external DC bias and automatic RF handoff', () => {
        const previous = nP.global();
        try {
            nP.global.fList = [10e6];
            nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
            const named = divider(constructor({model: name}), polarity);
            const supplied = divider(constructor({model: resolve(name)}), polarity);
            assert.equal(supplied.operatingPoint.converged, true);
            assert.deepEqual(supplied.operatingPoint, named.operatingPoint);
            assert.deepEqual(supplied.solveDC(), named.solveDC());
            assert.deepEqual(supplied.spars, named.spars);
            assert.deepEqual(supplied.noise, named.noise);
            const selectors = ['s21dB', 'NF21dB', 'IM3lower21dBm'];
            const actual = supplied.out(...selectors);
            assert.ok(actual[1].every(Number.isFinite));
            assert.deepEqual(actual, named.out(...selectors));
        } finally { nP.global(previous); }
    });
}

test('raw user parameters reproduce 2N3904 without metadata, registration or package arrays', () => {
    const parameters = {IS: 6.734e-15, BF: 416.4, VAF: 74.03, IKF: 0.06678,
        NE: 1.259, ISE: 6.734e-15, XTB: 1.5, BR: 0.7371,
        RC: 1, RB: 10, CJC: 3.638e-12, MJC: 0.3085,
        CJE: 4.493e-12, MJE: 0.2593, TR: 239.5e-9, TF: 301.2e-12,
        ITF: 0.4, VTF: 4, XTF: 2};
    const record = {parameters}, before = structuredClone(record);
    const supplied = nP.NPN({model: record}), named = nP.NPN({model: '2N3904'});
    sameElectrical(supplied, named);
    assert.equal(supplied.model.name, 'custom');
    assert.deepEqual(supplied.model.parameters, named.model.parameters);
    assert.deepEqual(record, before);
    record.parameters.BF = 1;
    supplied.model.parameters.BF = 2;
    assert.equal(supplied._dcModel.definition.record.parameters.BF, 416.4);
    assert.ok(Object.isFrozen(supplied._dcModel.definition.record.parameters));
    sameElectrical(supplied, named);
});

test('partial custom models use generic defaults instead of inheriting a built-in device', () => {
    for (const constructor of [nP.NPN, nP.PNP]) {
        const q = constructor({model: {name: 'My transistor', parameters: {BF: 150}}});
        assert.equal(q.model.name, 'My transistor');
        assert.equal(q.model.parameters.BF, 150);
        assert.equal(q.model.parameters.IS, 1e-16);
        assert.equal(q.model.parameters.BR, 1);
        for (const key of ['VAF', 'VAR', 'IKF', 'IKR', 'VTF', 'ITF']) assert.equal(q.model.parameters[key], Infinity);
        for (const key of ['RB', 'RC', 'RE', 'TF', 'TR', 'CJE', 'CJC', 'ISE', 'ISC', 'KF']) assert.equal(q.model.parameters[key], 0);
        assert.deepEqual(q.model.inductors, []);
        assert.deepEqual(q.model.capacitors, []);
        assert.ok(q.spars[0].slice(1).every(value => Number.isFinite(value.x) && Number.isFinite(value.y)));
        const generic = constructor({model: {parameters: {}}});
        assert.equal(generic.model.parameters.BF, 100);
        assert.ok(generic.bias.ic * (constructor === nP.NPN ? 1 : -1) > 0);
    }
});

test('custom package arrays and metadata are copied and retain the built-in node convention', () => {
    const input = npnModel('BFR93A');
    input.name = 'My RF transistor';
    input.source = 'User supplied offline';
    const before = structuredClone(input), q = nP.NPN({model: input});
    assert.equal(q._schematic.model, input.name);
    assert.deepEqual(input, before);
    input.inductors[0][2] *= 2;
    input.capacitors[0][2] *= 2;
    assert.deepEqual(q.model.inductors, before.inductors);
    assert.deepEqual(q._dcModel.definition.record.capacitors, before.capacitors);
});

test('invalid supplied records fail with actionable model or parameter errors', () => {
    const invalid = [null, [], 42, {}, {parameters: null}, {parameters: []},
        {parameters: {BFF: 100}}, {parameters: {BF: 0}}, {parameters: {IS: -1}},
        {parameters: {RB: -1}}, {parameters: {CJE: NaN}}, {parameters: {TF: Infinity}},
        {parameters: {VAF: 0}}, {parameters: {MJE: 1}}, {parameters: {FC: 1}},
        {parameters: {TNOM: 0}}, {parameters: {BF: '100'}}, {parameters: {BF: undefined}},
        {parameters: {}, name: ''}, {parameters: {}, beta: 50},
        {parameters: {}, inductors: null}, {parameters: {}, capacitors: [[0, 11, 1e-12]]},
        {parameters: {}, capacitors: [[0, 1, -1]]}, {parameters: {}, inductors: [[0, 3, 1e-9]]}];
    for (const constructor of [nP.NPN, nP.PNP]) for (const model of invalid) {
        assert.throws(() => constructor({model}), /model|package/);
    }
    assert.doesNotThrow(() => nP.NPN({model: {parameters: {ITF: 0, TF: 1e-12, XTF: 1}}}));
});
