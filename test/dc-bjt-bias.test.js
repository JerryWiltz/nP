// Modified: 2026-11-17
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {npnSpiceReference} from './fixtures/npn-spice-reference.js';
import {pnpSpiceReference} from './fixtures/pnp-spice-reference.js';

function close(actual, expected, absolute = 1e-10, relative = 1e-7) {
    assert.ok(Number.isFinite(actual) && Number.isFinite(expected));
    assert.ok(Math.abs(actual - expected) <= absolute + relative * Math.abs(expected), `${actual} differs from ${expected}`);
}
function part(result, name) { return result.components.find(component => component.constructorName === name); }
function node(result, label) { return result.nodes.find(entry => entry.path === '' && entry.node === label).voltage; }
function divider(q, supply = 12, collectorResistance = 2200, emitterResistance = 1000) {
    return nP.nodal(
        [nP.C(1e-9), 100, 10],
        [nP.Tee4(), 11, 10, 12, 13],
        [nP.R(100e3), 14, 11],
        [nP.R(22e3), 12, 15],
        [nP.Short(), 15],
        [q, 13, 20, 30],
        [nP.Tee(), 21, 20, 22],
        [nP.R(collectorResistance), 23, 21],
        [nP.C(1e-9), 22, 101],
        [nP.R(emitterResistance), 30, 31],
        [nP.Short(), 31],
        [nP.Tee(), 24, 14, 23],
        [nP.V(supply), 24, 25],
        [nP.Short(), 25],
        ['out', 100, 101]
    );
}
function sameRf(actual, expected) {
    actual.spars.forEach((row, index) => row.slice(1).forEach((value, column) => close(value.sub(expected.spars[index][column + 1]).mag(), 0, 1e-8)));
    actual.noise.forEach((row, index) => row.C.forEach((values, i) => values.forEach((value, j) =>
        close(value.sub(expected.noise[index].C[i][j]).mag(), 0, 1e-26))));
}

for (const [constructor, name, supply] of [[nP.NPN, 'NPN', 12], [nP.PNP, 'PNP', -12]]) {
    test(name + ' divider bias automatically precedes RF and obeys loading, KCL and the device law', () => {
        const q = constructor({fList: [1e6, 100e6], qPoint: name === 'NPN' ? {ib: 80e-6, vce: 1} : {ib: -80e-6, vce: -1}});
        const before = structuredClone({bias: q.bias, spars: q.spars, noise: q.noise, dc: q.dc});
        const previous = {...nP.global};
        try {
            nP.global.fList = [1e6, 100e6];
            const network = divider(q, supply), dc = network.operatingPoint, solved = part(dc, name).qPoint;
            assert.equal(dc.method, 'nonlinear'); assert.equal(dc.converged, true);
            assert.equal(dc.initialEstimate.method, 'piecewise-bjt');
            assert.equal(dc.convergence.method, 'damped-newton');
            assert.equal(dc.convergence.history.at(-1).sourceScale, 1);
            assert.ok(dc.residuals.maxNormalizedResidual <= 1);
            close(solved.ib + solved.ic, solved.ie, 1e-12);
            close((supply - node(dc, 13)) / 100e3, node(dc, 13) / 22e3 + solved.ib, 1e-12);
            close(node(dc, 20), supply - 2200 * solved.ic, 1e-9);
            close(node(dc, 30), 1000 * solved.ie, 1e-9);
            close(solved.vce, node(dc, 20) - node(dc, 30), 1e-9);
            assert.deepEqual(dc.ports.map(port => [port.node, port.voltage, port.current]), [[100, null, 0], [101, null, 0]]);
            assert.ok(dc.initialEstimate.assumptions.every(entry => entry.forwardVoltage === 0.7));
            const fixed = constructor({fList: [1e6, 100e6], qPoint: {ib: solved.ib, vce: solved.vce}});
            const replacements = network._rfModel.components.slice(); replacements[5] = fixed;
            const independentRf = network._rfModel.rebuild(replacements);
            sameRf(network, independentRf);
            const actual = network._rfModel.components[5];
            close(actual.bias.ib, solved.ib, 1e-12); close(actual.bias.ic, solved.ic, 1e-12);
            close(actual.bias.ve, solved.ve, 1e-9);
            assert.ok(Math.abs(actual.bias.ic - q.bias.ic) > 1e-5);
            assert.deepEqual(structuredClone({bias: q.bias, spars: q.spars, noise: q.noise, dc: q.dc}), before);
            assert.ok(Object.isFrozen(dc.operatingPoints[0]));
            close(part(network.solveDC(), name).qPoint.ic, solved.ic, 1e-12);
        } finally { Object.assign(nP.global, previous); }
    });
}

test('external resistor/supply networks reproduce archived ngspice NPN/PNP operating points', () => {
    const previous = {...nP.global};
    try {
        nP.global.fList = [10e6];
        for (const [constructor, name, reference] of [[nP.NPN, '2N3904', npnSpiceReference['2N3904']],
            [nP.NPN, 'BFR93A', npnSpiceReference.BFR93A], [nP.PNP, '2N3906', pnpSpiceReference]]) {
            const q = constructor({model: name, temperature: reference.temperature});
            // Select a physical base supply/resistor pair that reproduces the
            // archived terminal voltage/current; the solver must find the bias.
            const resistance = 1e4, baseSupply = reference.vbe + reference.ib * resistance;
            const network = nP.nodal(
                [nP.Tee(), 1, 2, 3],
                [nP.V(baseSupply), 1, 4],
                [nP.Short(), 4],
                [nP.R(resistance), 3, 5],
                [q, 5, 6, 7],
                [nP.Short(), 7],
                [nP.V(reference.vce), 6, 8],
                [nP.Short(), 8],
                ['out', 2]
            );
            const point = network.operatingPoint.components[4].qPoint;
            close(point.ib, reference.ib, 5e-11);
            close(point.ic, reference.ic, 5e-9);
            close(point.vbe, reference.vbe, 5e-7);
            close(point.vce, reference.vce, 1e-9);
        }
    } finally { Object.assign(nP.global, previous); }
});

test('coupled reused transistors solve together and keep independent states in a current mirror', () => {
    const q = nP.NPN(), seed = {...q.bias};
    const network = nP.nodal(
        [nP.Tee5(), 10, 11, 12, 13, 14],
        [nP.R(1000), 20, 10],
        [q, 11, 12, 15],
        [nP.Short(), 15],
        [q, 13, 30, 16],
        [nP.R(100), 16, 17],
        [nP.Short(), 17],
        [nP.R(500), 21, 31],
        [nP.Tee(), 31, 30, 32],
        [nP.C(1e-9), 32, 101],
        [nP.C(1e-9), 100, 14],
        [nP.Tee(), 22, 20, 21],
        [nP.V(5), 22, 23],
        [nP.Short(), 23],
        ['out', 100, 101]
    );
    const dc = network.operatingPoint, first = dc.components[2].qPoint, second = dc.components[4].qPoint;
    assert.deepEqual(dc.operatingPoints.map(point => point.path), ['p3', 'p5']);
    close(first.vb, first.vc, 1e-9); close(first.vb, second.vb, 1e-9);
    close(second.ve, second.ie * 100, 1e-9);
    close((5 - first.vb) / 1000, first.ib + first.ic + second.ib, 1e-11);
    assert.ok(first.ic > 5 * second.ic);
    assert.notEqual(network._rfModel.components[2], network._rfModel.components[4]);
    assert.deepEqual(q.bias, seed);
});

test('nested biased blocks are solved from the complete outer graph and preserve placement paths', () => {
    const first = divider(nP.NPN()), second = divider(nP.NPN(), 10, 3300, 1500);
    const network = nP.cascade(first, second);
    const dc = network.operatingPoint;
    assert.deepEqual(dc.operatingPoints.map(point => point.path), ['p1/p6', 'p2/p6']);
    close(dc.components.find(component => component.path === 'p1/p6').qPoint.ic, part(first.operatingPoint, 'NPN').qPoint.ic, 1e-11);
    close(dc.components.find(component => component.path === 'p2/p6').qPoint.ic, part(second.operatingPoint, 'NPN').qPoint.ic, 1e-11);
    assert.ok(network.spars.every(row => row.slice(1).every(value => Number.isFinite(value.x) && Number.isFinite(value.y))));
});

test('bias changes propagate to RF, noise and weak nonlinear products independently of constructor seeds', () => {
    const previous = {...nP.global};
    try {
        nP.global.fList = [10e6]; nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
        const low = divider(nP.NPN({qPoint: {ib: 1e-6, vce: 1}}), 8);
        const same = divider(nP.NPN({qPoint: {ib: 80e-6, vce: 8}}), 8);
        const high = divider(nP.NPN(), 12);
        sameRf(low, same);
        const selectors = ['s21dB', 'NF21dB', 'IM3lower21dBm'];
        const first = low.out(...selectors)[1], second = high.out(...selectors)[1];
        for (let i = 1; i < first.length; i++) assert.ok(Math.abs(first[i] - second[i]) > 1e-4);
    } finally { Object.assign(nP.global, previous); }
});

test('fixed-Q RF examples remain explicit while zero-source DC returns zero junction bias', () => {
    const q = nP.NPN(), network = nP.nodal([q, 1, 2, 3], [nP.Short(), 3], ['out', 1, 2]);
    assert.equal(network.operatingPoint, undefined);
    close(network._rfModel.components[0].bias.ib, 20e-6, 1e-12);
    for (const constructor of [nP.NPN, nP.PNP]) {
        const result = constructor().solveDC();
        assert.equal(result.initialEstimate.method, 'zero-source');
        assert.equal(result.operatingPoints[0].intrinsicVbe, 0);
        assert.equal(result.operatingPoints[0].intrinsicVbc, 0);
    }
});

test('source stepping is reported and final acceptance uses the full-strength saturated circuit', () => {
    const network = nP.nodal(
        [nP.Tee(), 1, 2, 3],
        [nP.V(2), 1, 4],
        [nP.Short(), 4],
        [nP.R(10), 3, 5],
        [nP.NPN(), 5, 6, 7],
        [nP.Short(), 7],
        [nP.V(0), 6, 8],
        [nP.Short(), 8],
        ['out', 2]
    );
    const dc = network.operatingPoint;
    assert.equal(dc.initialEstimate.status, 'fallback');
    assert.equal(dc.convergence.sourceStepping, true);
    assert.ok(dc.convergence.history.some(entry => entry.status === 'failed'));
    assert.equal(dc.convergence.history.at(-1).sourceScale, 1);
    assert.equal(dc.convergence.history.at(-1).status, 'converged');
    close(node(dc, 1), 2, 1e-9); close(node(dc, 6), 0, 1e-9);
    close((2 - node(dc, 5)) / 10, dc.components[4].qPoint.ib, 1e-10);
    assert.ok(dc.residuals.maxNormalizedResidual <= 1);
});

test('a failed DC solve prevents the transistor-to-RF handoff', () => {
    const q = nP.NPN(), recipe = q._rfModel;
    let calls = 0;
    q._rfModel = {atOperatingPoint(state) { calls++; return recipe.atOperatingPoint(state); }};
    assert.throws(() => nP.nodal(
        [nP.Tee4(), 1, 2, 3, 4],
        [nP.V(1), 1, 5],
        [nP.Short(), 5],
        [nP.V(2), 2, 6],
        [nP.Short(), 6],
        [nP.R(1e4), 3, 7],
        [q, 7, 8, 9],
        [nP.Short(), 9],
        [nP.V(5), 8, 10],
        [nP.Short(), 10],
        ['out', 4]
    ), error => error.code === 'DC_INCONSISTENT');
    assert.equal(calls, 0);
});


test('a floating nonlinear loop retains bias differences and current without assigning an absolute ground', () => {
    const network = nP.nodal(
        [nP.Tee4(), 1, 4, 6, 7],
        [nP.Tee(), 2, 5, 8],
        [nP.V(5), 1, 2],
        [nP.R(100e3), 6, 3],
        [nP.NPN(), 3, 4, 5],
        [nP.C(1e-9), 100, 7],
        [nP.C(1e-9), 8, 101],
        ['out', 100, 101]
    );
    const dc = network.operatingPoint, bias = dc.components[4].qPoint;
    assert.ok(dc.nodes.every(entry => entry.voltage === null));
    assert.equal(bias.ve, null); close(bias.vce, 5, 1e-9);
    close(bias.ib, (5 - bias.vbe) / 100e3, 1e-12);
    close(dc.components[2].terminalCurrents[0], -bias.ie, 1e-11);
    assert.equal(network._rfModel.components[4].bias.ve, null);
});
