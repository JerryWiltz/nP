// Modified: 2026-11-26
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {nPort} from '../src/np-nport/src/nPort';
import {validateDcModel} from '../src/np-nport/src/dcModel';
import {schematicSvg} from '../src/np-chart/src/schematic';

function close(actual, expected, tolerance = 1e-12) {
    assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
}

test('V returns a floating two-port supply with separate DC voltage and incremental S data', () => {
    const source = nP.V();
    assert.ok(source instanceof nPort);
    assert.equal(source.source.voltage, 1);
    assert.equal(source.source.positivePort, 1);
    assert.equal(source.source.negativePort, 2);
    assert.deepEqual(source.global.fList, nP.global.fList);
    assert.equal(source._dcModel.definition.modelId, 'voltage-source');
    assert.equal(source._dcModel.definition.voltage, 1);
    assert.equal(source._dcModel.definition.positiveTerminal, 1);
    assert.equal(source._dcModel.definition.negativeTerminal, 2);
    assert.equal(source._dcModel.definition.joins, undefined);
    assert.equal(source.signal, undefined);
    for (const voltage of [-12, 0, 1, 24]) {
        const actual = nP.V(voltage, {fList: [0, 1e6]});
        assert.deepEqual(actual.spars.map(row => row.slice(1).map(z => [z.x, z.y])), [
            [[0, 0], [1, 0], [1, 0], [0, 0]],
            [[1, 0], [0, 0], [0, 0], [1, 0]]
        ]);
        assert.equal(actual._dcModel.definition.voltage, voltage);
        assert.equal(actual.source.noiseModel, 'noiseless');
        for (const row of actual.noise) for (const values of row.C) for (const value of values) {
            close(value.mag(), 0);
        }
    }
});

test('V options and two-tone grids preserve frequency/context ownership', () => {
    const saved = {twoTone: nP.global.twoTone, fList: nP.global.fList};
    try {
        nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
        const frequencies = [10e6];
        const options = {voltage: -5, fList: frequencies};
        const source = nP.V(options), expected = source.spars.map(row => row[0]);
        assert.deepEqual(expected, nP.R(75, nP.global.Temp, {fList: frequencies}).spars.map(row => row[0]));
        assert.deepEqual(source.noise.map(row => row.frequency), expected);
        assert.ok(source.spars.every(row => row[1].x === 1 && row[2].mag() === 0 && row[3].mag() === 0 && row[4].x === 1));
        options.voltage = 99; frequencies.push(20e6);
        nP.global.twoTone.spacingHz = 2e6;
        assert.deepEqual(source.global.fList, [10e6]);
        assert.equal(source.global.twoTone.spacingHz, 1e6);
        assert.equal(source._dcModel.definition.voltage, -5);
        assert.deepEqual(source._dcModel.analysis.fList, [10e6]);
        source.source.voltage = 12;
        assert.equal(source._dcModel.definition.voltage, -5);
        assert.throws(() => { source._dcModel.definition.voltage = 7; }, TypeError);
    } finally { Object.assign(nP.global, saved); }
});

test('a grounded V is open at RF and its explicit bypass capacitor lowers the rail impedance', () => {
    const fList = [0, 1e6, 1e9], capacitance = 1e-9;
    const source = nP.V(1, {fList});
    const grounded = nP.nodal(
        [source, 1, 2],
        [nP.Short({fList}), 2],
        ['out', 1]
    );
    const bypassed = nP.nodal(
        [nP.Tee({fList}), 1, 2, 3],
        [source, 1, 4],
        [nP.Short({fList}), 4],
        [nP.C(capacitance, {fList}), 3, 5],
        [nP.Short({fList}), 5],
        ['out', 2]
    );
    close(grounded.spars[0][1].x, -1);
    close(bypassed.spars[0][1].x, -1);
    for (let index = 1; index < fList.length; index++) {
        close(grounded.spars[index][1].x, 1);
        const susceptance = 2 * Math.PI * fList[index] * capacitance;
        const impedance = nP.complex(0, susceptance).inv();
        const expected = impedance.sub(nP.complex(source.global.Ro, 0))
            .div(impedance.add(nP.complex(source.global.Ro, 0)));
        close(bypassed.spars[index][1].sub(expected).mag(), 0);
    }
    assert.equal(grounded._dcModel.definition.components[0].model.definition.voltage, 1);
});

test('resistor DC topology captures the supply constraint without grounding either source terminal implicitly', () => {
    const source = nP.V(1);
    const network = nP.nodal(
        [nP.Tee(), 'positive', 'measurement', 'resistors'],
        [source, 'positive', 'negative'],
        [nP.Short(), 'negative'],
        [nP.R(50), 'resistors', 'middle'],
        [nP.R(75), 'middle', 'load'],
        [nP.R(50), 'load', 'return'],
        [nP.Short(), 'return'],
        ['out', 'measurement']
    );
    const placements = network._dcModel.definition.components;
    assert.deepEqual(placements[1].nodes, ['positive', 'negative']);
    assert.equal(placements[1].model.definition.voltage, 1);
    assert.deepEqual(placements.slice(3, 6).map(p => p.model.definition.parameters.resistance), [50, 75, 50]);
    assert.ok(network.spars.length);
});

test('V renders using the existing canonical source symbol and signed voltage label', () => {
    const source = nP.V(-12);
    assert.equal(source._schematic.symbol, 'voltage-source');
    const svg = schematicSvg(source);
    assert.match(svg, /<svg/);
    assert.match(svg, /V1 = -12 V/);
});

test('V rejects malformed options, grids and voltage-source descriptors', () => {
    for (const value of [NaN, Infinity, -Infinity, '1', null, false, []]) {
        assert.throws(() => nP.V(value));
    }
    for (const options of [{volts: 1}, {fList: []}, {fList: [-1]}, {fList: [NaN]}, {fList: Array(1)},
        {fList: '1000000'}, {voltage: null}]) assert.throws(() => nP.V(options));
    assert.throws(() => nP.V(1, null));
    assert.throws(() => nP.V(1, {voltage: 2}), /Unknown/);
    assert.throws(() => nP.V({voltage: 1}, {}), /one options object/);
    const model = nP.V()._dcModel;
    assert.throws(() => validateDcModel({...model, definition: {...model.definition, voltage: NaN}}), /finite volts/);
    assert.throws(() => validateDcModel({...model, definition: {...model.definition, positiveTerminal: 2}}), /oriented terminals/);
});
