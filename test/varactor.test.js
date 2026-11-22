// Modified: 2026-11-21
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {diodeModel} from '../src/np-nport/src/diodes/diodeModels';
import {depletionCharge, diodeTemperature} from '../src/np-nport/src/diodes/junctionDiode';
import {schematicGraph, schematicSvg} from '../src/np-chart/src/schematic';
import {varactorReference as reference} from './fixtures/varactor-reference';

function close(actual, expected, absolute = 1e-12, relative = 1e-8) {
    assert.ok(Number.isFinite(actual) && Number.isFinite(expected));
    assert.ok(Math.abs(actual - expected) <= absolute + relative * Math.abs(expected), `${actual} != ${expected}`);
}

function biasNetwork(diode, voltage) {
    return nP.nodal(
        [nP.C(10e-9), 100, 1],
        [nP.Tee(), 3, 1, 2],
        [nP.R(100e3), 4, 3],
        [nP.V(voltage), 4, 5],
        [nP.Short(), 5],
        [diode, 2, 6],
        [nP.Tee(), 8, 6, 7],
        [nP.R(100e3), 8, 9],
        [nP.Short(), 9],
        [nP.C(10e-9), 7, 101],
        ['out', 100, 101]
    );
}

test('SMV1231-079LF preserves sourced fit/package data, port order and canonical varactor symbol', () => {
    const d = nP.D({model: 'smv1231-079lf', qPoint: {vd: -3}});
    assert.equal(d.model.name, 'SMV1231-079LF');
    assert.equal(d.model.family, 'varactor');
    assert.equal(d.model.parameters.M, 4.999);
    assert.equal(d.model.parameters.VJ, 10.13);
    assert.equal(d.model.parameters.RS, 2.5);
    assert.deepEqual(d.model.packageParameters, {seriesInductance: .7e-9, parallelCapacitance: .44e-12});
    assert.equal(d._dcModel.definition.terminals[0], 1);
    assert.ok(Object.isFrozen(d._dcModel.definition.record.packageParameters));
    const graph = schematicGraph(d), svg = schematicSvg(d);
    assert.equal(graph.components[0].symbol, 'varactor-diode');
    assert.equal(graph.components[0].id, 'D1');
    assert.equal(graph.components[0].ports.length, 2);
    assert.match(svg, /SMV1231-079LF/);
    assert.ok(d.bias.vd < 0 && d.bias.id < 0);
});

test('independent current/charge SPICE circuit agrees on DC, all S entries and classical noise', () => {
    for (const point of reference.points) {
        const d = nP.D({model: 'SMV1231-079LF', temperature: reference.temperature,
            qPoint: {vd: -point.vr}, fList: point.spars.map(row => row[0])});
        close(d.bias.id, point.id, 1e-21);
        close(d.bias.junctionVoltage, point.junctionVoltage, 1e-12);
        close(d.smallSignal.conductance, point.conductance, 2e-24, 2e-6); // ngspice 39 thermal constants.
        d.spars.forEach((row, i) => row.slice(1).forEach((z, j) => {
            close(z.x, point.spars[i][j + 1][0], 1e-7);
            close(z.y, point.spars[i][j + 1][1], 1e-7);
        }));
        d.out('NF21dB', {referenceTemperature: reference.temperature}).slice(1).forEach((row, i) =>
            close(row[1], point.noiseFigureDb[i], 3e-6));
        const p = d.model.parameters;
        close(d.smallSignal.junctionCapacitance, p.CJO / (1 + point.vr / p.VJ) ** p.M, 1e-24);
        close(d.smallSignal.terminalCapacitance, d.smallSignal.totalCapacitance + .44e-12, 1e-26);
    }
});

test('C-V tables track published reverse-bias capacitance without changing Q or caller data', () => {
    const d = nP.D({model: 'SMV1231-079LF', temperature: reference.datasheetTemperature, qPoint: {vd: -3}});
    const before = structuredClone({bias: d.bias, spars: d.spars, noise: d.noise, dc: d.dc});
    const settings = {vr: {start: 0, stop: 15, points: 31}}, settingsBefore = structuredClone(settings);
    const curves = d.cvTable(settings);
    assert.deepEqual(curves[0], ['vr (V)', 'cj (F)', 'ct (F)']);
    assert.equal(curves.length, 32);
    let maxRelativeError = 0;
    for (const [vr, measuredPf] of reference.capacitancePf) {
        const row = curves.find(row => row[0] === vr);
        maxRelativeError = Math.max(maxRelativeError, Math.abs(row[2] * 1e12 / measuredPf - 1));
    }
    assert.ok(maxRelativeError < .05, 'Published C-V fit error: ' + maxRelativeError);
    for (let i = 2; i < curves.length; i++) assert.ok(curves[i][2] < curves[i - 1][2]);
    assert.deepEqual(settings, settingsBefore);
    assert.deepEqual(structuredClone({bias: d.bias, spars: d.spars, noise: d.noise, dc: d.dc}), before);
    assert.equal(d.cvTable().length, 202);
    for (const options of [{vr: {start: -1}}, {vr: {points: 1}}, {vd: {}}, {vr: {unknown: 1}}]) {
        assert.throws(() => d.cvTable(options));
    }
});

test('integrated charge supports M=1 and hyperabrupt grading with continuous forward continuation', () => {
    for (const M of [0, .5, 1 - 1e-10, 1, 1 + 1e-10, 4.999]) {
        const p = {CJO: 2e-12, VJ: 2, M, FC: .5};
        for (const v of [-12, -3, -.1, .5, 1.1]) {
            const h = 1e-5, q = depletionCharge(p, v), plus = depletionCharge(p, v + h), minus = depletionCharge(p, v - h);
            close((plus.charge - minus.charge) / (2 * h), q.capacitance, 1e-19, 1e-8);
            close((plus.capacitance - minus.capacitance) / (2 * h), q.derivative, 1e-19, 1e-8);
            close((plus.derivative - minus.derivative) / (2 * h), q.second, 1e-18, 1e-8);
            if (M === 1 && v < p.FC * p.VJ) close(q.charge, -p.CJO * p.VJ * Math.log(1 - v / p.VJ), 1e-26);
        }
        const knee = p.FC * p.VJ, a = depletionCharge(p, knee - 1e-9), b = depletionCharge(p, knee);
        close(a.charge, b.charge, 1e-18); close(a.capacitance, b.capacitance, 1e-18);
        close(a.derivative, b.derivative, 1e-17);
        const d = nP.D({model: {parameters: {M}}, qPoint: {vd: -.5}});
        assert.ok(d.spars[0].slice(1).every(z => Number.isFinite(z.x) && Number.isFinite(z.y)));
    }
});

test('named and supplied varactors match through bias, RF, noise and weak nonlinear handoff', () => {
    const saved = nP.global();
    try {
        nP.global.fList = [100e6, 1e9];
        nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
        const model = diodeModel('SMV1231-079LF'), before = structuredClone(model);
        const named = nP.D({model: 'SMV1231-079LF'}), supplied = nP.D({model});
        assert.deepEqual(named.spars, supplied.spars);
        assert.deepEqual(named.noise, supplied.noise);
        assert.deepEqual(named.cvTable(), supplied.cvTable());
        for (const voltage of [-.5, -3, -10]) {
            const network = biasNetwork(named, voltage), other = biasNetwork(supplied, voltage);
            assert.equal(network.operatingPoint.converged, true);
            assert.deepEqual(network.operatingPoint, other.operatingPoint);
            assert.deepEqual(network.spars, other.spars);
            assert.deepEqual(network.noise, other.noise);
            const q = network.operatingPoint.components[5].qPoint;
            close(q.vd, voltage, 3e-9); close(q.junctionVoltage, q.vd, 1e-12);
            const selectors = ['s21dB', 'NF21dB', 'IM2sum21dBm', 'IM3lower21dBm'];
            assert.deepEqual(network.out(...selectors), other.out(...selectors));
            const direct = nP.D({model, qPoint: {vd: q.vd}});
            const actual = network._rfModel.components[5];
            close(actual.smallSignal.junctionCapacitance, direct.smallSignal.junctionCapacitance, 1e-24);
        }
        assert.deepEqual(model, before);
        model.packageParameters.seriesInductance = 99;
        assert.equal(supplied._dcModel.definition.record.packageParameters.seriesInductance, .7e-9);
        assert.equal(named.bias.vd, .6); // Existing D default remains explicit.
    } finally { nP.global(saved); }
});

test('weak products retain order slopes and propagate package loading at tones and product frequencies', () => {
    const saved = nP.global();
    try {
        nP.global.fList = [1e9];
        nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
        const d = nP.D({model: 'SMV1231-079LF', qPoint: {vd: -3}});
        const selectors = ['IM2sum21dBm', 'IM3lower21dBm', 'OIP3lower21dBm'];
        const low = d.out(...selectors)[1];
        const high = d.out(...selectors, {twoTone: {...nP.global.twoTone, p1dBm: -70, p2dBm: -70}})[1];
        assert.ok(low.every(Number.isFinite));
        close(high[1] - low[1], 20, 1e-7); close(high[2] - low[2], 30, 1e-7); close(high[3], low[3], 1e-5);
        const bareModel = diodeModel('SMV1231-079LF');
        bareModel.packageParameters = {seriesInductance: 0, parallelCapacitance: 0};
        const bare = nP.D({model: bareModel, qPoint: {vd: -3}}).out(...selectors)[1];
        assert.ok(Math.abs(bare[2] - low[2]) > .1);
        const p = diodeTemperature(d.model.parameters, d.bias.temperature), data = depletionCharge(p, d.bias.junctionVoltage);
        close(d._intermod.capacitanceDerivative, data.derivative, 1e-25);
        close(d._intermod.capacitanceSecondDerivative, data.second, 1e-25);

        // Independent impedance-divider solution of the published circuit.
        const ro = nP.global.Ro, a = Math.sqrt(1e-3 * 10 ** (-80 / 10));
        const f1 = 1e9, f2 = f1 + 1e6, product = 2 * f1 - f2;
        const v1 = junctionVoltageFromSource(d, f1, 2 * Math.sqrt(ro) * a);
        const v2 = junctionVoltageFromSource(d, f2, 2 * Math.sqrt(ro) * a);
        const third = nP.complex(d._intermod.thirdDerivative, 2 * Math.PI * product * data.second);
        const current = v1.mul(v1).mul(nP.complex(v2.x, -v2.y)).mul(third).mul(nP.complex(.25, 0));
        const z = packageImpedances(d, product);
        const load = z.lead.add(nP.complex(2 * ro, 0));
        const shunt = z.parallel.mul(load).div(z.parallel.add(load));
        const nodeVoltage = current.mul(z.junction).mul(shunt).div(z.branch.add(shunt));
        const wave = nodeVoltage.div(load).mul(nP.complex(Math.sqrt(ro), 0));
        close(low[2], 10 * Math.log10(1000 * wave.mag() ** 2), 1e-9);
    } finally { nP.global(saved); }
});

function packageImpedances(d, frequency) {
    const omega = 2 * Math.PI * frequency, p = d.model.packageParameters;
    const junction = nP.complex(d._intermod.conductance, omega * d._intermod.capacitance).inv();
    return {junction, branch: junction.add(nP.complex(d.model.parameters.RS, 0)),
        lead: nP.complex(0, omega * p.seriesInductance), parallel: nP.complex(0, -1 / (omega * p.parallelCapacitance))};
}

function junctionVoltageFromSource(d, frequency, voltage) {
    const z = packageImpedances(d, frequency);
    const middle = z.branch.mul(z.parallel).div(z.branch.add(z.parallel));
    return nP.complex(voltage, 0).mul(middle).div(middle.add(z.lead).add(nP.complex(2 * nP.global.Ro, 0)))
        .mul(z.junction).div(z.branch);
}

test('generic package parameters are validated and lossless package elements do not create noise', () => {
    for (const packageParameters of [null, [], {unknown: 1}, {seriesInductance: -1}, {parallelCapacitance: NaN}]) {
        assert.throws(() => nP.D({model: {parameters: {}, packageParameters}}), /packageParameters/);
    }
    assert.throws(() => nP.D({model: {parameters: {M: -1}}}), /M/);
    const model = {parameters: {M: 1, CJO: 2e-12}, packageParameters: {seriesInductance: 1e-9, parallelCapacitance: 1e-12}};
    const d = nP.D({model, qPoint: {vd: 0}, fList: [1e9]});
    assert.equal(d.noise[0].C[0][0].x, 0);
});

test('terminal C-V agrees with the zero-frequency RF admittance slope when conductance matters', () => {
    const d = nP.D({model: {parameters: {IS: 1e-3, RS: 1, CJO: 2e-12},
        packageParameters: {seriesInductance: 1e-6, parallelCapacitance: 1e-12}}, qPoint: {vd: 0}, fList: [1]});
    const row = d.spars[0], ro = d.global.Ro;
    const impedance = row[1].div(row[3]).mul(nP.complex(2 * ro, 0));
    const slope = impedance.inv().y / (2 * Math.PI);
    const ct = d.cvTable({vr: {start: 0, stop: 1, points: 2}})[1][2];
    assert.ok(ct < 0);
    close(slope, ct, 1e-20, 1e-7);
    close(d.smallSignal.terminalCapacitance, ct, 1e-26);
});
