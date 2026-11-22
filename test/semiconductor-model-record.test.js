// Modified: 2026-11-21
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as nP from '../src/index.js';
import {dcSnapshot} from '../src/np-nport/src/dcModel';
import {jfetModel} from '../src/np-nport/src/transistors/fet/jfetModels';
import {mosfetModel} from '../src/np-nport/src/transistors/fet/mosfetModels';
import {mesfetModel} from '../src/np-nport/src/transistors/fet/mesfetModels';
import {hemtModel} from '../src/np-nport/src/transistors/fet/hemtModels';
import {diodeModel} from '../src/np-nport/src/diodes/diodeModels';
import {jfetNetwork} from './fixtures/jfet-network';
import {mosfetNetwork} from './fixtures/mosfet-network';

const cases = [['NJF', 'MMBF5457LT1'], ['PJF', 'MMBFJ175LT1'],
    ['NMOS', 'DMN55D0UT'], ['PMOS', 'DMP58D0SV'], ['MESFET', 'SPICE3_REFERENCE'],
    ['MESFET', 'NE760'], ['HEMT', 'ATF35143_DIE'], ['HEMT', 'ATF35143'],
    ['D', '1N4148'], ['D', 'SMS7621'], ['D', 'SMS7630']];

function recordOf(type, name) {
    if (type === 'NJF' || type === 'PJF') return jfetModel(name, type === 'NJF' ? 1 : -1);
    if (type === 'NMOS' || type === 'PMOS') return mosfetModel(name, type === 'NMOS' ? 1 : -1);
    if (type === 'MESFET') return mesfetModel(name);
    if (type === 'HEMT') return hemtModel(name);
    return diodeModel(name);
}

function commonSource(q) {
    if (q._dcModel.constructorName === 'D') return q;
    const short = nP.Short();
    return q._dcModel.portCount === 4 ?
        nP.nodal([q, 1, 2, 3, 4], [short, 3], [short, 4], ['out', 1, 2]) :
        nP.nodal([q, 1, 2, 3], [short, 3], ['out', 1, 2]);
}

function diodeNetwork(q) {
    return nP.nodal(
        [nP.C(10e-9), 100, 1],
        [nP.Tee(), 3, 1, 2],
        [nP.R(1000), 4, 3],
        [nP.V(1), 4, 5],
        [nP.Short(), 5],
        [q, 2, 6],
        [nP.Tee(), 8, 6, 7],
        [nP.R(100), 8, 9],
        [nP.Short(), 9],
        [nP.C(10e-9), 7, 101],
        ['out', 100, 101]
    );
}

function biasedNetwork(type, q) {
    if (type === 'D') return diodeNetwork(q);
    if (type === 'NMOS' || type === 'PMOS') return mosfetNetwork({name: type, q});
    if (type === 'HEMT' || q.model.name === 'NE760') return jfetNetwork({name: type, q, supply: 5, resistance: 47, drainResistance: 150});
    return jfetNetwork({name: type, q});
}

function sameElectrical(actual, expected) {
    assert.deepEqual(actual.bias, expected.bias);
    assert.deepEqual(actual.smallSignal, expected.smallSignal);
    assert.deepEqual(actual.spars, expected.spars);
    assert.deepEqual(actual.noise, expected.noise);
    if (actual._intermod.point) assert.deepEqual(actual._intermod.point.data, expected._intermod.point.data);
    else assert.deepEqual(actual._intermod, expected._intermod);
}

for (const [type, name] of cases) {
    test(type + '/' + name + ' supplied record exactly reproduces fixed-Q DC/RF/noise/IM and external bias', () => {
        const saved = nP.global();
        try {
            nP.global.fList = [10e6, 1e9];
            nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
            const record = dcSnapshot(recordOf(type, name)), before = structuredClone(record);
            const bodies = type === 'NMOS' || type === 'PMOS' ? ['source', 'external'] : [undefined];
            for (const temperature of [300.15, 330]) for (const body of bodies) {
                const options = {temperature, ...(body ? {body} : {})};
                const named = nP[type]({...options, model: name.toLowerCase()});
                const supplied = nP[type]({...options, model: record});
                sameElectrical(supplied, named);
                assert.deepEqual(supplied.model, named.model);
                const curves = type === 'D' ? {vd: {points: 5}} : {vgs: {points: 3}, vds: {points: 5}};
                assert.deepEqual(supplied.ivTable(curves), named.ivTable(curves));
                const selectors = ['s21dB', 'NF21dB', 'IM2sum21dBm', 'IM3lower21dBm'];
                const output = commonSource(supplied).out(...selectors);
                assert.ok(output.slice(1).every(row => row.every(Number.isFinite)));
                assert.deepEqual(output, commonSource(named).out(...selectors));
                const direct = biasedNetwork(type, supplied), reference = biasedNetwork(type, named);
                assert.equal(direct.operatingPoint.converged, true);
                assert.deepEqual(direct.operatingPoint, reference.operatingPoint);
                assert.deepEqual(direct.solveDC(), reference.solveDC());
                assert.deepEqual(direct.spars, reference.spars);
                assert.deepEqual(direct.noise, reference.noise);
                assert.deepEqual(direct.out(...selectors), reference.out(...selectors));
                const changedRecord = structuredClone(record);
                const first = nP[type]({...options, model: changedRecord});
                const key = type === 'D' ? 'IS' : type === 'NMOS' || type === 'PMOS' ? 'KP' : 'BETA';
                changedRecord.parameters[key] *= 2;
                first.model.parameters[key] *= 3;
                assert.equal(first._dcModel.definition.record.parameters[key], record.parameters[key]);
                assert.ok(Object.isFrozen(first._dcModel.definition.record.parameters));
                sameElectrical(first, named);
            }
            assert.deepEqual(record, before);
        } finally { nP.global(saved); }
    });
}

test('new part names and partial records use generic defaults without a compiled catalog entry', () => {
    for (const type of ['NJF', 'PJF', 'NMOS', 'PMOS', 'MESFET', 'D']) {
        const q = nP[type]({model: {name: 'My new part', parameters: {}}, fList: [1e9]});
        assert.equal(q.model.name, 'My new part');
        assert.equal(q.model.manufacturer, undefined);
        assert.equal(q.model.parameters.IS, 1e-14);
        assert.equal(q.model.parameters.KF, 0);
        assert.ok(q.spars[0].slice(1).every(z => Number.isFinite(z.x) && Number.isFinite(z.y)));
        if (type === 'D') { assert.equal(q.model.parameters.BV, Infinity); assert.equal(q.model.leakageResistance, Infinity); }
        else if (type === 'NMOS' || type === 'PMOS') assert.equal(q.model.parameters.KP, 2e-5);
        else assert.equal(q.model.parameters.BETA, 1e-4);
    }
    const core = {VTO: -1, BETA: .1, ALPHA: 4, PB: .7, DELTA1: .25, DELTA2: .2, VMAX: .5, RC: 250, CRF: .1};
    const q = nP.HEMT({model: {name: 'My HEMT', parameters: core}});
    assert.equal(q.model.parameters.P, 0); assert.equal(q.model.parameters.R, 0);
    assert.equal(q.model.parameters.LG, 0); assert.equal(q.model.packageParameters, null);
    assert.ok(q.spars[0].slice(1).every(z => Number.isFinite(z.x) && Number.isFinite(z.y)));
});

test('plain model records created in REPL/iframe contexts work for all nine constructors', () => {
    for (const type of ['NPN', 'PNP', 'NJF', 'PJF', 'NMOS', 'PMOS', 'MESFET', 'HEMT', 'D']) {
        const result = vm.runInNewContext(`
            var named = nP[type]({fList:[1e9]});
            var model = {...named.model, parameters:{...named.model.parameters}};
            var supplied = nP[type]({model, fList:[1e9]});
            ({spars:supplied.spars, expected:named.spars});
        `, {nP, type});
        assert.deepEqual(result.spars, result.expected);
    }
    assert.throws(() => nP.NJF({model: new Date()}), /plain record object/);
    assert.throws(() => nP.NPN({model: {parameters: new Date()}}), /plain object/);
});

test('HEMT derives package data from supplied parameters and rejects stale or conflicting derived fields', () => {
    const record = hemtModel('ATF35143'), raw = structuredClone(record);
    for (const key of ['terminalNetwork', 'contactResistances', 'inductors', 'capacitors']) delete raw[key];
    raw.name = 'My packaged HEMT'; raw.parameters.RD *= 2;
    const q = nP.HEMT({model: raw});
    assert.equal(q.model.parameters.RD, raw.parameters.RD);
    assert.equal(q.model.terminalNetwork.resistors[1][2], raw.parameters.RD);
    assert.ok(q.model.contactResistances[1] > record.contactResistances[1]);
    for (const field of ['terminalNetwork', 'contactResistances', 'inductors', 'capacitors']) {
        const stale = structuredClone(record);
        if (field === 'terminalNetwork') stale[field].ports.reverse();
        else if (field === 'contactResistances') stale[field][0]++;
        else stale[field][0][2] *= 2;
        assert.throws(() => nP.HEMT({model: stale}), /conflicts/);
    }
    raw.packageParameters.La *= 2;
    assert.notEqual(q._dcModel.definition.record.packageParameters.La, raw.packageParameters.La);
});

test('supplied diode records retain Schottky symbols and external leakage independently of parameters', () => {
    const record = diodeModel('SMS7630');
    record.name = 'My Schottky'; record.leakageResistance = 1e6;
    const d = nP.D({model: record, qPoint: {vd: .05}});
    const baseline = nP.D({model: 'SMS7630', qPoint: {vd: .05}});
    assert.equal(d._schematic.symbol, baseline._schematic.symbol);
    assert.equal(d.smallSignal.leakageResistance, 1e6);
    assert.ok(Math.abs(d.bias.id - baseline.bias.id - .05 / 1e6) < 1e-15);
});

test('all families reject invalid objects, unknown parameters, unsupported packages and polarity conflicts', () => {
    for (const [type, name] of cases) {
        for (const bad of [null, [], 1, {}, {parameters: null}, {parameters: []}, {parameters: {UNKNOWN: 1}}]) {
            assert.throws(() => nP[type]({model: bad}), /model/);
        }
        for (const value of [NaN, -1, '1e-14', undefined]) {
            const record = recordOf(type, name); record.parameters.IS = value;
            assert.throws(() => nP[type]({model: record}), /parameter IS/);
        }
        const badPackage = recordOf(type, name); badPackage.inductors = [[0, 1, 1e-9]];
        assert.throws(() => nP[type]({model: badPackage}), /inductors/);
        const input = recordOf(type, name); input.parameters = {UNKNOWN: 1};
        assert.throws(() => nP[type]({model: input}), /UNKNOWN/);
    }
    assert.throws(() => nP.NJF({model: jfetModel('MMBFJ175LT1', -1)}), /polarity/);
    assert.throws(() => nP.PMOS({model: mosfetModel('DMN55D0UT', 1)}), /polarity/);
    assert.throws(() => nP.NMOS({model: {parameters: {LEVEL: 2}}}), /LEVEL/);
    assert.throws(() => nP.NJF({model: {parameters: {NLEV: 3}}}), /NLEV/);
    assert.throws(() => nP.MESFET({model: {parameters: {PB: .5}}}), /PB/);
    assert.throws(() => nP.HEMT({model: {parameters: {}}}), /requires parameter VTO/);
    const h = hemtModel(); h.parameters.C = 2;
    assert.throws(() => nP.HEMT({model: h}), /parameter C/);
    const cold = hemtModel(); cold.referenceTemperature = 290;
    assert.throws(() => nP.HEMT({model: cold}), /fixed at 300.15/);
    const m = nP.NMOS({body: 'external'}).model;
    assert.throws(() => nP.NMOS({model: m}), /body/);
    assert.doesNotThrow(() => nP.NMOS({model: m, body: 'external'}));
});
