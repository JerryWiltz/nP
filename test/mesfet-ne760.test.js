// Modified: 2026-11-21
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {mesfetNe760 as reference} from './fixtures/mesfet-ne760';

function close(actual, expected, tolerance) {
    assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
}
function commonSource(q) {
    const short = nP.Short({fList: q.global.fList});
    return nP.nodal([q, 1, 2, 3], [short, 3], ['out', 1, 2]);
}

test('NE760 preserves the published commercial-family card and immutable model identity', () => {
    const q = nP.MESFET({model: 'ne760', fList: [1e9]});
    assert.equal(q.model.name, 'NE760');
    assert.equal(q.model.manufacturer, 'NEC');
    assert.equal(q.model.modelPublisher, 'Intusoft');
    assert.match(q.model.source, /intusoft/);
    assert.match(q.model.package, /no package suffix/);
    assert.match(q.model.noiseModel, /no measured noise fit/);
    assert.equal(q._dcModel.quality, 'approximate');
    assert.deepEqual(q.model.parameters, {VTO: -1, BETA: .1275, B: .3, ALPHA: 2, LAMBDA: .0155,
        RD: 5.45, RS: 4.88, CGS: .34e-12, CGD: .03e-12, PB: 1, IS: 19.8e-12, FC: .2, KF: 0, AF: 1});
    assert.ok(Object.isFrozen(q._dcModel.definition.record.parameters));
    assert.equal(q._schematic.value, 'NE760');
    assert.equal(q.model.inductors.length, 0); assert.equal(q.model.capacitors.length, 0);
    const before = JSON.stringify(q.qPoint), rows = q.ivTable({vgs: {points: 3}, vds: {points: 4}});
    assert.equal(rows[0][3], 'id (A), vgs=-1 V');
    assert.equal(rows.length, 5); assert.equal(JSON.stringify(q.qPoint), before);
    q.model.parameters.BETA = 99;
    assert.equal(q._dcModel.definition.record.parameters.BETA, .1275);
    assert.equal(nP.MESFET({fList: [1e9]}).model.name, 'SPICE3_REFERENCE');
    for (const model of ['NE76084', '__proto__', 'constructor', null, 7]) {
        assert.throws(() => nP.MESFET({model, fList: [1e9]}), /MESFET model/);
    }
});

test('NE760 agrees with independent ngspice DC, all nine S entries and classical noise', () => {
    const r = reference, fList = r.spars.map(row => row[0]);
    const q = nP.MESFET({model: r.name, temperature: r.temperature, fList});
    for (const row of [{vgs: r.vgs, vds: r.vds, op: r.op}, ...r.dcPoints]) {
        const device = nP.MESFET({model: r.name, qPoint: {vgs: row.vgs, vds: row.vds}, fList});
        ['ig', 'id', 'is'].forEach((key, i) => close(device.qPoint[key], -row.op[i + 3], 2e-11));
        close(device.smallSignal.gm, row.op[6], 2e-11);
        close(device.smallSignal.gds, row.op[7], 2e-11);
        close(device.qPoint.ig + device.qPoint.id + device.qPoint.is, 0, 1e-16);
    }
    q.spars.forEach((row, i) => row.slice(1).forEach((z, j) => {
        close(z.x, r.spars[i][j + 1][0], 2e-8); close(z.y, r.spars[i][j + 1][1], 2e-8);
    }));
    const network = commonSource(q);
    network.out('NF21dB', {referenceTemperature: r.temperature}).slice(1).forEach((row, i) => close(row[1], r.noiseFigureDb[i], 3e-6));
    const hot = nP.MESFET({model: r.name, temperature: 338.15, fList});
    assert.deepEqual(hot.spars, q.spars);
    q.noise.forEach(({C}, k) => C.forEach((row, i) => row.forEach((z, j) => {
        close(hot.noise[k].C[i][j].x, z.x * 338.15 / r.temperature, 1e-29);
        close(z.x, C[j][i].x, 1e-29); close(z.y, -C[j][i].y, 1e-29);
    })));
    const previous = nP.global.twoTone;
    try {
        nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
        const twoToneNetwork = commonSource(nP.MESFET({model: r.name, temperature: r.temperature, fList}));
        const low = twoToneNetwork.out('IM2sum21dBm', 'IM3lower21dBm')[1];
        const high = twoToneNetwork.out('IM2sum21dBm', 'IM3lower21dBm', {twoTone: {...nP.global.twoTone, p1dBm: -70, p2dBm: -70}})[1];
        assert.ok(low.every(Number.isFinite));
        close(high[1] - low[1], 20, 1e-6); close(high[2] - low[2], 30, 1e-6);
    } finally { nP.global.twoTone = previous; }
});

function selfBias(q, resistance = 47) {
    const fList = q.global.fList, short = nP.Short({fList});
    return nP.nodal(
        [q, 1, 2, 3],
        [nP.R({resistance: 1e6, fList}), 1, 4],
        [short, 4],
        [nP.R({resistance: 150, fList}), 2, 5],
        [nP.V(5, {fList}), 5, 6],
        [short, 6],
        [nP.R({resistance, fList}), 3, 7],
        [short, 7],
        ['out', 1, 2]
    );
}

test('NE760 external self-bias matches SPICE and rebuilds the selected record without mutating its template', () => {
    const q = nP.MESFET({model: 'NE760', temperature: reference.temperature, fList: [10e6, 100e6, 1e9]});
    const before = JSON.stringify(q), network = selfBias(q), point = network.operatingPoint.components[0].qPoint;
    ['vg', 'vd', 'vs'].forEach((key, i) => close(point[key], reference.selfBias[i], 2e-8));
    close(point.id, -reference.selfBias[3], 2e-11);
    close(point.vg / 1e6 + point.ig, 0, 1e-12);
    close(point.vs / 47 + point.is, 0, 1e-12);
    assert.ok(network.operatingPoint.residuals.maxNormalizedResidual <= 1);
    assert.equal(network._rfModel.components[0].model.name, 'NE760');
    const fresh = nP.MESFET({model: 'NE760', temperature: reference.temperature, fList: q.global.fList,
        qPoint: {vgs: point.vgs, vds: point.vds}});
    const components = network._rfModel.components.slice(); components[0] = fresh;
    const rebuilt = network._rfModel.rebuild(components);
    network.spars.forEach((row, i) => row.slice(1).forEach((z, j) => close(z.sub(rebuilt.spars[i][j + 1]).mag(), 0, 1e-9)));
    network.noise.forEach(({C}, k) => C.forEach((row, i) => row.forEach((z, j) => close(z.sub(rebuilt.noise[k].C[i][j]).mag(), 0, 1e-28))));
    const changed = selfBias(q, 100);
    assert.ok(Math.abs(changed.operatingPoint.components[0].qPoint.id - point.id) > 1e-3);
    assert.equal(JSON.stringify(q), before);
});
