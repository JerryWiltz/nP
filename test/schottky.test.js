// Modified: 2026-11-21
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {diodeTemperature, junctionCurrent} from '../src/np-nport/src/diodes/junctionDiode';
import {schematicGraph, schematicSvg} from '../src/np-chart/src/schematic';
import {schottkyReference, schottkyDualReference} from './fixtures/schottky-reference';

function close(actual, expected, absolute = 1e-12, relative = 3e-6) {
    assert.ok(Number.isFinite(actual) && Number.isFinite(expected));
    assert.ok(Math.abs(actual - expected) <= absolute + relative * Math.abs(expected), `${actual} != ${expected}`);
}
function feedNetwork(diode, temperature = 300.15) {
    const fList = diode.global.fList;
    const tee = nP.Tee({fList}), supply = nP.V(1, {fList}), ground = nP.Short({fList});
    const resistor = nP.R(1000, temperature, {fList});
    return nP.nodal(
        [tee, 1, 2, 3],
        [supply, 1, 4],
        [ground, 4],
        [resistor, 3, 5],
        [diode, 5, 6],
        [ground, 6],
        ['out', 2]
    );
}

for (const [model, reference] of Object.entries(schottkyReference)) {
    test(`${model} retains the sourced per-junction model, immutable DC record and Schottky symbol`, () => {
        const d = nP.D({model: model.toLowerCase(), qPoint: {vd: reference.vd}, fList: [1e9]});
        assert.equal(d.model.name, model);
        assert.equal(d.model.family, 'schottky');
        assert.match(d.model.source, /skyworksinc.*200041AH/);
        assert.match(d.model.package, /package inductance\/capacitance.*excluded/);
        assert.equal(d.model.parameters.EG, .69);
        assert.equal(d.smallSignal.leakageResistance, Infinity);
        assert.equal(d._intermod.externalConductance, 0);
        assert.equal(d._schematic.symbol, 'schottky-diode');
        assert.equal(d._dcModel.definition.modelId, 'diode');
        assert.ok(Object.isFrozen(d._dcModel.definition.record.parameters));
        const saturation = d._dcModel.definition.record.parameters.IS;
        d.model.parameters.IS = 123;
        assert.equal(d._dcModel.definition.record.parameters.IS, saturation);
        const graph = schematicGraph(d), svg = schematicSvg(d);
        assert.equal(graph.components[0].symbol, 'schottky-diode');
        assert.equal(graph.components[0].id, 'D1');
        assert.equal(graph.components[0].value, model);
        assert.equal(graph.components[0].ports.length, 2);
        assert.match(svg, /M115 70 V65 H120 V95 H125 V90/);
        assert.doesNotMatch(svg, /NaN|Infinity/);
        assert.throws(() => nP.D({model: `${model}-079LF`}), /D model/); // No package-specific fit is supplied.
    });
    test(`${model} agrees with independent ngspice DC, RF and classical noise`, () => {
        const d = nP.D({model, qPoint: {vd: reference.vd}, temperature: reference.temperature,
            fList: reference.spars.map(row => row[0])});
        close(d.bias.id, reference.id);
        close(d.smallSignal.conductance, reference.conductance);
        d.spars.forEach((row, i) => row.slice(1).forEach((value, j) => {
            close(value.x, reference.spars[i][j + 1][0], 8e-7, 0);
            close(value.y, reference.spars[i][j + 1][1], 8e-7, 0);
        }));
        d.out('NF21dB', {referenceTemperature: reference.temperature}).slice(1).forEach((row, i) =>
            close(row[1], reference.noiseFigureDb[i], 2e-5, 0));
        for (const point of [reference.reverse, reference.breakdown, reference.forward, reference.hot]) {
            const selected = nP.D({model, qPoint: {vd: point.vd}, temperature: point.temperature ?? reference.temperature});
            close(selected.bias.id, point.id);
            close(selected.smallSignal.conductance, point.conductance);
        }
        // Current/charge slope checks and physical parameter units are also
        // independently exercised by npm run check:equations.
        const p = diodeTemperature(d.model.parameters, reference.temperature), h = 1e-6;
        for (const voltage of [-.2, 0, .1, .25]) {
            const center = junctionCurrent(p, voltage), high = junctionCurrent(p, voltage + h), low = junctionCurrent(p, voltage - h);
            close((high.current - low.current) / (2 * h), center.conductance, 1e-12, 1e-7);
            close((high.conductance - low.conductance) / (2 * h), center.second, 1e-12, 1e-7);
            close((high.second - low.second) / (2 * h), center.third, 1e-12, 1e-7);
        }
    });
    test(`${model} external bias is solved before RF and preserves the template and sweep`, () => {
        for (const [temperature, expected] of [[reference.temperature, reference.network], [reference.hot.temperature, reference.hot.network]]) {
            const d = nP.D({model, temperature, qPoint: {vd: 0}, bias: {vd: {stop: .4, points: 5}}, fList: [1e8]});
            const before = structuredClone({qPoint: d.qPoint, spars: d.spars, dc: d.dc}), curve = d.ivTable();
            const network = feedNetwork(d, temperature), point = network.operatingPoint.components[4].qPoint;
            close(point.vd, expected.vd, 3e-7);
            close(point.id, expected.id);
            close((1 - point.vd) / 1000, point.id, 1e-11, 0);
            const rebuilt = network._rfModel.components[4];
            assert.notEqual(rebuilt, d);
            assert.equal(rebuilt._schematic.symbol, 'schottky-diode');
            const fresh = nP.D({model, temperature, qPoint: {vd: point.vd}, fList: [1e8]});
            rebuilt.spars[0].slice(1).forEach((value, i) => close(value.sub(fresh.spars[0][i + 1]).mag(), 0, 1e-8, 0));
            assert.deepEqual(structuredClone({qPoint: d.qPoint, spars: d.spars, dc: d.dc}), before);
            assert.deepEqual(d.ivTable(), curve);
        }
    });
    test(`${model} retains two-tone nonlinear sources and correlated device noise`, () => {
        const previous = nP.global.twoTone;
        try {
            nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
            const d = nP.D({model, qPoint: {vd: reference.vd}, fList: [1e8]});
            const selectors = ['IM2sum21dBm', 'IM3lower21dBm', 'OIP2sum21dBm', 'OIP3lower21dBm'];
            const low = d.out(...selectors)[1];
            const high = d.out(...selectors, {twoTone: {...nP.global.twoTone, p1dBm: -70, p2dBm: -70}})[1];
            assert.ok(low.every(Number.isFinite));
            close(high[1] - low[1], 20, 1e-8, 0); close(high[2] - low[2], 30, 1e-8, 0);
            close(high[3], low[3], 1e-8, 0); close(high[4], low[4], 1e-8, 0);
            for (const {C} of d.noise) {
                assert.ok(C[0][0].x > 0);
                close(C[0][0].x, C[1][1].x, 1e-30, 0);
                close(C[0][1].x, -C[0][0].x, 1e-30, 0);
                close(C[0][1].y, -C[1][0].y, 1e-30, 0);
            }
        } finally { nP.global.twoTone = previous; }
    });
}

test('signal-diode defaults and legacy diode remain unchanged', () => {
    const d = nP.D(), legacy = nP.diode1N4148();
    assert.equal(d.model.name, '1N4148');
    assert.equal(d._schematic.symbol, 'diode-1n4148');
    assert.equal(d.qPoint.vd, .6);
    assert.equal(legacy.diode.bias.voltage, 0);
});

test('two different Schottky records retain their own solved states through cascade composition', () => {
    const first = nP.D({model: 'SMS7630', qPoint: {vd: 0}, temperature: 300.15, fList: [1e8]});
    const second = nP.D({model: 'SMS7621', qPoint: {vd: .4}, temperature: 300.15, fList: [1e8]});
    const branch = nP.cascade(first, second), network = feedNetwork(branch);
    const placements = network.operatingPoint.components.filter(part => part.qPoint);
    assert.equal(placements.length, 2);
    for (const [i, placement] of placements.entries()) {
        close(placement.qPoint.vd, schottkyDualReference.vd[i], 3e-7);
        close(placement.qPoint.id, schottkyDualReference.id[i]);
    }
    assert.notEqual(placements[0].path, placements[1].path);
    assert.notEqual(placements[0].qPoint.vd, placements[1].qPoint.vd);
    close(placements[0].qPoint.id, placements[1].qPoint.id, 1e-11, 0);
    assert.equal(first.qPoint.vd, 0);
    assert.equal(second.qPoint.vd, .4);
});
