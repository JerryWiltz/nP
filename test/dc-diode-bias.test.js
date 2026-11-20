// Modified: 2026-11-19
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {legacyJunction} from '../src/np-nport/src/diodes/legacyDiode';
import {diodeNetworkDcReference} from './fixtures/diode-network-dc-reference.js';

function close(actual, expected, absolute = 1e-10, relative = 1e-7) {
    assert.ok(Number.isFinite(actual) && Number.isFinite(expected));
    assert.ok(Math.abs(actual - expected) <= absolute + relative * Math.abs(expected), `${actual} differs from ${expected}`);
}
function biasNetwork(diode, supply = 1, resistance = 1000) {
    return nP.nodal(
        [nP.Tee(), 1, 2, 3],
        [nP.V(supply), 1, 4],
        [nP.Short(), 4],
        [nP.R(resistance), 3, 5],
        [diode, 5, 6],
        [nP.Short(), 6],
        ['out', 2]
    );
}
function rfNetwork(diode, supply = 1) {
    return nP.nodal(
        [nP.C(10e-9), 100, 1],
        [nP.Tee(), 3, 1, 2],
        [nP.R(1000), 4, 3],
        [nP.V(supply), 4, 5],
        [nP.Short(), 5],
        [diode, 2, 6],
        [nP.Tee(), 8, 6, 7],
        [nP.R(100), 8, 9],
        [nP.Short(), 9],
        [nP.C(10e-9), 7, 101],
        ['out', 100, 101]
    );
}
function sameRf(actual, expected) {
    actual.spars.forEach((row, index) => row.slice(1).forEach((value, column) => close(value.sub(expected.spars[index][column + 1]).mag(), 0, 1e-8)));
    actual.noise.forEach((row, index) => row.C.forEach((values, i) => values.forEach((value, j) =>
        close(value.sub(expected.noise[index].C[i][j]).mag(), 0, 1e-26))));
}
function snapshot(diode) {
    return structuredClone({bias: diode.bias, qPoint: diode.qPoint, dc: diode.dc,
        diode: diode.diode, spars: diode.spars, noise: diode.noise});
}

test('external diode bias agrees with independent ngspice forward, reverse, breakdown and hot references', () => {
    for (const reference of diodeNetworkDcReference) {
        const legacy = reference.constructorName === 'diode1N4148';
        const diode = nP[reference.constructorName](legacy ? {temperatureK: reference.temperature} : {temperature: reference.temperature});
        const before = snapshot(diode), network = biasNetwork(diode, reference.supply), dc = network.operatingPoint;
        const point = dc.components[4].qPoint;
        close(point.vd, reference.vd, 4e-7);
        close(point.id, reference.id, 1e-12, 2e-6);
        close((reference.supply - point.vd) / 1000, point.id, 1e-11);
        close(dc.components[4].terminalCurrents[1], -point.id, 1e-11);
        assert.ok(dc.residuals.maxNormalizedResidual <= 1);
        assert.equal(dc.method, 'nonlinear');
        assert.equal(dc.convergence.history.at(-1).sourceScale, 1);
        assert.ok(Object.isFrozen(dc.operatingPoints[0]));
        close(network.solveDC().components[4].qPoint.id, point.id, 1e-11);
        assert.deepEqual(snapshot(diode), before);
    }
});

for (const name of ['D', 'diode1N4148']) {
    test(name + ' rebuilds RF/noise/intermodulation before composition without mutating templates or curves', () => {
        const previous = {...nP.global};
        try {
            nP.global.fList = [10e6, 100e6];
            nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
            const legacy = name === 'diode1N4148';
            const diode = nP[name](legacy ? {biasVoltage: 0.2, ivStart: -1, ivStop: 0.9, ivPoints: 11} :
                {qPoint: {vd: 0.2}, bias: {vd: {start: 0.1, stop: 0.9, points: 11}}});
            const before = snapshot(diode), curve = diode.ivTable();
            // Exercise the legacy RF law below its documented Cj clamp at VJ.
            const network = rfNetwork(diode, legacy ? 0.5 : 1), point = network.operatingPoint.components[5].qPoint;
            assert.deepEqual(network.operatingPoint.ports.map(port => [port.voltage, port.current]), [[null, 0], [null, 0]]);
            const fresh = nP[name](legacy ? {biasVoltage: point.vd} : {qPoint: {vd: point.vd}});
            const parts = network._rfModel.components.slice(); parts[5] = fresh;
            sameRf(network, network._rfModel.rebuild(parts));
            const actual = network._rfModel.components[5];
            close(legacy ? actual.diode.bias.current : actual.bias.id, point.id, 1e-11);
            assert.notEqual(actual, diode);
            assert.equal(actual._dcModel, diode._dcModel);
            assert.deepEqual(actual.ivTable(), curve);
            if (!legacy) assert.deepEqual(actual.dc, diode.dc);
            assert.deepEqual(snapshot(diode), before);
            const higher = rfNetwork(diode, legacy ? 0.7 : 2);
            const selectors = ['s21dB', 'NF21dB', 'IM3lower21dBm'];
            const low = network.out(...selectors)[1], high = higher.out(...selectors)[1];
            for (let column = 1; column < low.length; column++) assert.ok(Math.abs(low[column] - high[column]) > 1e-4);
        } finally { Object.assign(nP.global, previous); }
    });
}

test('reused and nested diodes keep independent placement states', () => {
    const diode = nP.D(), before = snapshot(diode);
    const network = nP.nodal(
        [nP.Tee4(), 1, 2, 3, 4],
        [nP.V(1), 1, 5],
        [nP.Short(), 5],
        [nP.R(1000), 3, 6],
        [diode, 6, 7],
        [nP.Short(), 7],
        [nP.R(2000), 4, 8],
        [diode, 8, 9],
        [nP.Short(), 9],
        ['out', 2]
    );
    const points = network.operatingPoint.components.filter(part => part.constructorName === 'D');
    assert.deepEqual(network.operatingPoint.operatingPoints.map(point => point.path), ['p5', 'p8']);
    assert.notEqual(points[0].qPoint.vd, points[1].qPoint.vd);
    assert.notEqual(network._rfModel.components[4], network._rfModel.components[7]);
    const nested = nP.cascade(rfNetwork(diode, 1), rfNetwork(diode, 2));
    assert.deepEqual(nested.operatingPoint.operatingPoints.map(point => point.path), ['p1/p6', 'p2/p6']);
    assert.deepEqual(snapshot(diode), before);
});

test('diodes and BJTs solve together with finite-beta base loading', () => {
    const network = nP.nodal(
        [nP.Tee4(), 1, 2, 3, 4],
        [nP.V(5), 1, 5],
        [nP.Short(), 5],
        [nP.R(10000), 3, 6],
        [nP.D(), 6, 7],
        [nP.NPN(), 7, 4, 8],
        [nP.R(1000), 8, 9],
        [nP.Short(), 9],
        ['out', 2]
    );
    const dc = network.operatingPoint, diode = dc.components[4].qPoint, transistor = dc.components[5].qPoint;
    close(diode.id, transistor.ib, 1e-11);
    close((5 - diode.va) / 10000, diode.id, 1e-11);
    close(diode.vk, transistor.vb, 1e-9);
    close(transistor.ve, transistor.ie * 1000, 1e-9);
    assert.equal(dc.initialEstimate.method, 'piecewise-devices');
    assert.ok(dc.residuals.maxNormalizedResidual <= 1);
});

test('floating diode loops preserve voltage differences without assigning absolute terminal voltages', () => {
    const network = nP.nodal(
        [nP.Tee(), 1, 2, 3],
        [nP.V(1), 1, 4],
        [nP.R(1000), 4, 5],
        [nP.D(), 3, 5],
        ['out', 2]
    );
    const point = network.operatingPoint.components[3].qPoint;
    assert.equal(point.va, null); assert.equal(point.vk, null);
    close((1 - point.vd) / 1000, point.id, 1e-11);
    assert.equal(network._rfModel.components[3].bias.va, null);
});

test('standalone DC does not use the construction Q point as a supply, and solved states validate context and domain', () => {
    for (const name of ['D', 'diode1N4148']) {
        const diode = nP[name](), before = snapshot(diode);
        const point = diode.solveDC().components[0].qPoint;
        close(point.vd, 0); close(point.id, 0);
        assert.deepEqual(snapshot(diode), before);
        assert.throws(() => diode._withOperatingPoints([{path: '', vd: NaN, junctionVoltage: 0}]), /finite/);
        assert.throws(() => diode._withOperatingPoints([{path: '', vd: 1, junctionVoltage: 0}]), /series-resistance law/);
        assert.throws(() => diode._withOperatingPoints([{path: '', vd: 0, junctionVoltage: 0, va: 5, vk: 0}]), /references/);
    }
    const p = nP.diode1N4148()._dcModel.definition.parameters, h = 1e-7;
    for (const voltage of [-105, -5, 0.7]) {
        const slope = (legacyJunction(p, voltage + h).current - legacyJunction(p, voltage - h).current) / (2 * h);
        close(legacyJunction(p, voltage).conductance, slope, 1e-12, 2e-6);
    }
});

test('failed diode DC analysis prevents RF rebuilding', () => {
    const diode = nP.D(), recipe = diode._rfModel;
    let calls = 0;
    diode._rfModel = {atOperatingPoint(state) { calls++; return recipe.atOperatingPoint(state); }};
    assert.throws(() => nP.nodal(
        [nP.Tee4(), 1, 2, 3, 4],
        [nP.V(1), 1, 5],
        [nP.Short(), 5],
        [nP.V(2), 2, 6],
        [nP.Short(), 6],
        [nP.R(1000), 3, 7],
        [diode, 7, 8],
        [nP.Short(), 8],
        ['out', 4]
    ), error => error.code === 'DC_INCONSISTENT');
    assert.equal(calls, 0);
});

test('diode RF handoff retains the captured frequency, impedance and temperature context', () => {
    const previous = {...nP.global};
    try {
        for (const name of ['D', 'diode1N4148']) {
            nP.global.fList = [1e6, 100e6]; nP.global.Ro = 75; nP.global.Temp = 310;
            const original = nP[name](), target = nP[name](name === 'D' ? {qPoint: {vd: 0.65}} : {biasVoltage: 0.65});
            const junctionVoltage = name === 'D' ? target.bias.junctionVoltage : target.diode.bias.junctionVoltage;
            nP.global.fList = [7]; nP.global.Ro = 125; nP.global.Temp = 270;
            const rebuilt = original._withOperatingPoints([{path: '', vd: 0.65, junctionVoltage, va: 5.65, vk: 5}]);
            sameRf(rebuilt, target);
            assert.equal(rebuilt.global.Ro, 75);
            assert.equal(rebuilt._dcModel, original._dcModel);
        }
    } finally { Object.assign(nP.global, previous); }
});
