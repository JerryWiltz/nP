// Modified: 2026-11-25
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {singleDetector, differentialDetector} from './fixtures/rectification-networks';
import {rectificationReferences, rectificationRelativeTolerance} from './fixtures/schottky-detector-reference';

function setup() { nP.global.fList = [1e9]; nP.global.twoTone = undefined; nP.global.Ro = 50; }
function options(inputPowerDbm = -70) {
    return {frequencyHz: 1e9, inputPowerDbm, outputNodes: ['load', 'ground']};
}
function close(a, b, relative = 1e-8, absolute = 1e-15) {
    assert.ok(Math.abs(a - b) <= absolute + relative * Math.max(Math.abs(a), Math.abs(b)), `${a} != ${b}`);
}

test('passive detector solves RF-off bias and has square-law output without mutating its template', () => {
    setup();
    const network = singleDetector(), before = structuredClone({spars: network.spars, dc: network.solveDC()});
    const low = network.rectify(options()), high = network.rectify(options(-60));
    assert.equal(low.baselineVoltage, 0);
    assert.ok(low.deltaVoltage > 0);
    close(high.deltaVoltage / low.deltaVoltage, 10);
    close(high.sensitivityVoltsPerWatt, low.sensitivityVoltsPerWatt);
    assert.ok(Math.abs(low.operatingPoint.components.find(row => row.qPoint).qPoint.vd) < 1e-12);
    assert.deepEqual(structuredClone({spars: network.spars, dc: network.solveDC()}), before);
    assert.ok(Object.isFrozen(low.sources[0]));
    const off = network.rectify(options(-Infinity));
    assert.equal(off.deltaVoltage, 0); assert.equal(off.sensitivityVoltsPerWatt, null);
    const reversed = network.rectify({...options(), outputNodes: ['ground', 'load']});
    close(reversed.deltaVoltage, -low.deltaVoltage);
});

test('ideal diode detector agrees with independently derived RMS square-law loading', () => {
    setup();
    const temperature = 300.15, is = 5e-6, n = 1.05, ro = 50, load = 10000;
    const record = {name: 'Ideal detector', parameters: {IS: is, N: n, RS: 0, CJO: 0, TT: 0}};
    const diode = nP.D({model: record, temperature, qPoint: {vd: 0}});
    const t = nP.Tee(), choke = nP.L(1e-6), ground = nP.Short(), r = nP.R(load);
    const network = nP.nodal([t, 1, 2, 3], [choke, 1, 4], [ground, 4], [diode, 3, 5], [r, 5, 6], [ground, 6], ['out', 2]);
    const result = network.rectify({frequencyHz: 1e9, inputPowerDbm: -70, outputNodes: [5, 6]});
    // Independent resistor/choke admittance solution; no nP RF/current helpers.
    const vt = 1.380649e-23 * temperature / 1.602176634e-19;
    const g = is / (n * vt), second = is / (n * vt) ** 2;
    const denominatorReal = 1 + ro / (1 / g + load), denominatorImag = -ro / (2 * Math.PI * 1e9 * 1e-6);
    const inputSquared = 4 * ro * 1e-10 / (denominatorReal ** 2 + denominatorImag ** 2);
    const junctionSquared = inputSquared / (1 + load * g) ** 2;
    const expected = 0.5 * second * junctionSquared / (g + 1 / load);
    close(result.deltaVoltage, expected, 1e-9);
});

test('common bias and reference diode respond together; row order and supplied records retain results', () => {
    setup();
    const opt = {...options(), outputNodes: ['detector', 'reference']};
    for (const temperature of [273.15, 300.15, 338.15]) {
        const network = differentialDetector('SMS7630', temperature), result = network.rectify(opt);
        close(result.baselineVoltage, 0, 0, 1e-10);
        assert.ok(result.deltaVoltage > 0);
        assert.equal(result.sources.length, 2);
        assert.notEqual(result.sources[0].path, result.sources[1].path);
        const reference = result.dcResponse.nodes.find(row => row.node === 'reference' && row.path === '');
        assert.ok(Math.abs(reference.deltaVoltage) > 1e-12);
        const record = nP.D({model: 'SMS7630'}).model;
        const supplied = differentialDetector(record, temperature, true).rectify(opt);
        close(supplied.deltaVoltage, result.deltaVoltage);
    }
});

test('nested cascade retains DC/RF paths and differential output namespaces', () => {
    setup();
    const d = nP.D({model: 'SMS7630'}), r = nP.R(1e4), branch = nP.cascade(d, r), t = nP.Tee(), g = nP.Short(), l = nP.L(1e-6);
    const network = nP.nodal([t, 1, 2, 3], [l, 1, 4], [g, 4], [branch, 3, 5], [g, 5], ['out', 2]);
    const result = network.rectify({...options(), outputNodes: [2, 3], outputPath: 'p4'});
    assert.ok(result.deltaVoltage > 0);
    assert.equal(result.sources[0].path, 'p4/p1');
});

test('weak detector output agrees with independent full-diode ngspice transient averages', () => {
    setup();
    for (const reference of rectificationReferences) {
        nP.global.fList = [reference.frequencyHz];
        const single = reference.kind === 'single';
        const network = single ? singleDetector('SMS7630', reference.temperature, reference.loadOhms) :
            differentialDetector('SMS7630', reference.temperature);
        const result = network.rectify({frequencyHz: reference.frequencyHz, inputPowerDbm: reference.inputPowerDbm,
            outputNodes: single ? ['load', 'ground'] : ['detector', 'reference']});
        const expected = single ? reference.detectormean : reference.differentialmean;
        close(result.deltaVoltage, expected, rectificationRelativeTolerance);
        const early = single ? reference.detectorearly : reference.differentialearly;
        close(early, expected, 1e-5);
    }
});

test('a linear resistor generates no detected DC and invalid reference impedance rejects', () => {
    setup();
    const r = nP.R(50);
    const result = r.rectify({...options(), outputNodes: [1, 2]});
    assert.equal(result.deltaVoltage, 0);
    assert.equal(result.sources.length, 0);
    r.setglobal({...r.global, Ro: 0});
    assert.throws(() => r.rectify({...options(), outputNodes: [1, 2]}), /positive finite reference impedance/);
});

test('rectification rejects unsupported analyses, undefined measurements and excessive drive', () => {
    setup();
    const network = singleDetector();
    for (const override of [{frequencyHz: 2e9}, {inputPort: 2}, {inputPowerDbm: NaN},
        {inputPowerDbm: 4000}, {inputPowerDbm: -4000}, {outputNodes: ['load']}, {outputNodes: ['absent', 'ground']}, {typo: 1}]) {
        assert.throws(() => network.rectify({...options(), ...override}));
    }
    assert.throws(() => network.rectify(options(-20)), /weak-signal/);
    const npn = nP.NPN();
    assert.throws(() => npn.rectify({...options(), outputNodes: [1, 2]}), /no rectification adapter/);
    const missing = nP.Amp();
    assert.throws(() => missing.rectify({...options(), outputNodes: [1, 2]}), /physical DC model/);
    const floating = nP.C();
    assert.throws(() => floating.rectify({...options(), outputNodes: [1, 2]}), /undetermined/);
    const tx = nP.mod({mode: 'VNA-frequency', fList: [1e9]});
    const driven = nP.nodal([network, 'rf'], ['out', 'rf'], {signal: tx});
    assert.throws(() => driven.rectify({...options(), outputPath: 'p1'}), /without attached/);
});
