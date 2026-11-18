// Modified: 2026-11-17
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import * as electrical from '../src/np-nport/src/index.js';
import {nPort} from '../src/np-nport/src/nPort';
import {dcModel} from '../src/np-nport/src/dcModel';

function close(actual, expected, tolerance = 1e-10) {
    assert.notEqual(actual, null);
    assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`);
}
function component(result, path) { return result.components.find(part => part.path === path); }
function voltage(result, node, path = '') { return result.nodes.find(entry => entry.node === node && entry.path === path).voltage; }
function resistorDC(supply = true) {
    const c1 = nP.C(1e-9), c2 = nP.C(1e-9), r1 = nP.R(50), r2 = nP.R(75), r3 = nP.R(50);
    const rows = supply ? [[c1, 6, 1], [nP.Tee(), 8, 1, 2], [nP.V(1), 8, 9], [nP.Short(), 9]] : [[c1, 6, 2]];
    return nP.nodal(...rows,
        [r1, 2, 3],
        [r2, 3, 4],
        [nP.Tee(), 10, 4, 5],
        [r3, 10, 11],
        [nP.Short(), 11],
        [c2, 5, 7],
        ['out', 6, 7]
    );
}
function drive(part, volts = 1) {
    return nP.nodal(
        [nP.Tee(), 1, 2, 3],
        [nP.V(volts), 1, 4],
        [nP.Short(), 4],
        [nP.R(100), 3, 5],
        [part, 5, 6],
        [nP.R(100), 6, 7],
        [nP.Short(), 7],
        ['out', 2]
    );
}

function pendingModel(model) {
    if (model.kind === 'connection') return model.definition.components.some(part => pendingModel(part.model));
    return model.kind === 'requiresModel' || (model.kind === 'nonlinear' && model.definition.modelId !== 'bjt');
}

function parallelSources(first, second) {
    return nP.nodal(
        [nP.Tee(), 1, 2, 3],
        [nP.V(first), 1, 4],
        [nP.Short(), 4],
        [nP.V(second), 2, 5],
        [nP.Short(), 5],
        ['out', 3]
    );
}

test('resistorDC is a two-port with 5.714286 mA DC current and unloaded coupling-capacitor ports', () => {
    const saved = nP.global.fList;
    try {
        nP.global.fList = [0, 1e3, 1e6, 1e9];
        const network = resistorDC(), rfBefore = structuredClone(network.spars), noiseBefore = structuredClone(network.noise);
        const result = network.solveDC(), current = 1 / 175;
        assert.equal(network.spars[0].length, 5);
        assert.equal(result.converged, true);
        assert.equal(result.method, 'linear');
        assert.deepEqual(result.ports.map(port => [port.node, port.voltage, port.current]), [[6, null, 0], [7, null, 0]]);
        close(voltage(result, 2), 1);
        close(voltage(result, 3), 125 / 175);
        close(voltage(result, 4), 50 / 175);
        close(voltage(result, 5), 50 / 175);
        close(component(result, 'p3').terminalCurrents[0], -current);
        for (const path of ['p5', 'p6', 'p8']) {
            const resistor = component(result, path);
            close(resistor.terminalCurrents[0], current);
            close(resistor.terminalCurrents[1], -current);
        }
        for (const path of ['p1', 'p10']) assert.deepEqual(component(result, path).terminalCurrents, [0, 0]);
        assert.deepEqual(result.diagnostics.map(item => item.node).sort(), [6, 7]);
        assert.ok(result.residuals.maxKclAmps < 1e-12);
        assert.deepEqual(structuredClone(network.spars), rfBefore);
        assert.deepEqual(structuredClone(network.noise), noiseBefore);
        assert.equal(network.dc, undefined);
        assert.ok(Object.isFrozen(result.nodes[0]));
        assert.throws(() => result.components[0].terminalCurrents.push(1), TypeError);
        assert.deepEqual(structuredClone(result).ports, result.ports);
        const withoutSupply = resistorDC(false);
        for (let row = 1; row < network.spars.length; row++) {
            network.spars[row].slice(1).forEach((s, index) => close(s.sub(withoutSupply.spars[row][index + 1]).mag(), 0));
        }
    } finally { nP.global.fList = saved; }
});

test('all sixteen composite RLC models reduce by their actual branch topology', () => {
    const expected = {
        seSeRC: [0, 0], seSeRL: [1 / 275, 100 / 275], seSeLC: [0, 0], seSeRLC: [0, 0],
        sePaRC: [1 / 275, 100 / 275], sePaRL: [1 / 200, 0.5], sePaLC: [1 / 200, 0.5], sePaRLC: [1 / 200, 0.5],
        paSeRC: [1 / 200, 0.5], paSeRL: [1 / (100 + 1 / (1 / 75 + 1 / 100)), 0.3],
        paSeLC: [1 / 200, 0.5], paSeRLC: [1 / 200, 0.5],
        paPaRC: [1 / (100 + 1 / (1 / 75 + 1 / 100)), 0.3], paPaRL: [0.01, 0], paPaLC: [0.01, 0], paPaRLC: [0.01, 0]
    };
    for (const [name, [inputCurrent, outputVoltage]] of Object.entries(expected)) {
        const result = drive(nP[name]()).solveDC();
        close(-component(result, 'p2').terminalCurrents[0], inputCurrent);
        close(voltage(result, 6), outputVoltage);
    }
});

test('zero/negative voltage sources and zero resistance retain orientation and source currents', () => {
    for (const volts of [0, -2, 3]) {
        const result = drive(nP.V(0), volts).solveDC();
        close(component(result, 'p5').terminalCurrents[0], volts / 200);
        close(component(result, 'p5').elements[0].voltage, 0);
        close(component(result, 'p2').terminalCurrents[0], -volts / 200);
        close(drive(nP.R(0), volts).solveDC().nodes.find(node => node.node === 6).voltage, volts / 2);
    }
});

test('floating source loops retain determined currents and voltage differences without inventing ground', () => {
    const network = nP.nodal(
        [nP.Tee(), 0, 2, 3],
        [nP.V(1), 0, 4],
        [nP.R(100), 2, 5],
        [nP.Tee(), 4, 5, 6],
        ['out', 3, 6]
    );
    const result = network.solveDC();
    assert.ok(result.nodes.every(node => node.voltage === null));
    close(component(result, 'p2').elements[0].voltage, 1);
    close(component(result, 'p2').terminalCurrents[0], -0.01);
    close(component(result, 'p3').terminalCurrents[0], 0.01);
    assert.equal(voltage(result, 0), null, 'node label 0 is not an implicit ground');
});

test('conflicting ideal sources fail and parallel identical sources report nonunique current division', () => {
    assert.throws(() => parallelSources(1, 2).solveDC(), error => error.code === 'DC_INCONSISTENT');
    const highVoltage = nP.nodal([nP.V(1e15), 1, 2], [nP.Short(), 2], ['out', 1]);
    const mixedScales = nP.nodal([parallelSources(1, 2), 1], [highVoltage, 2], ['out', 1, 2]);
    assert.throws(() => mixedScales.solveDC(), error => error.code === 'DC_INCONSISTENT');
    const result = parallelSources(1, 1).solveDC();
    close(voltage(result, 3), 1);
    assert.deepEqual(component(result, 'p2').terminalCurrents, [null, null]);
    assert.ok(result.diagnostics.some(item => item.code === 'indeterminate-current'));
    assert.ok(result.linearSystem.rank < result.linearSystem.unknownCount);
    const shorted = nP.nodal([nP.V(1), 1, 2], [nP.Tee(), 1, 3, 4],
        [nP.Short(), 2], [nP.Short(), 3], ['out', 4]);
    assert.throws(() => shorted.solveDC(), error => error.code === 'DC_INCONSISTENT');
});

test('nested/reused blocks and cas/cascade retain scoped nodes and independent currents', () => {
    const child = nP.nodal([nP.R(25), 1, 2], ['out', 1, 2]);
    const result = drive(nP.cascade(child, child)).solveDC();
    for (const path of ['p5', 'p5/p1', 'p5/p1/p1', 'p5/p2', 'p5/p2/p1']) {
        close(component(result, path).terminalCurrents[0], 1 / 250);
    }
    close(voltage(result, 1, 'p5/p1'), 0.6);
    close(voltage(result, 1, 'p5/p2'), 0.5);
    assert.equal(child._dcModel.constructorName, 'nodal');
    const method = drive(child.cas(child)).solveDC();
    assert.deepEqual(method.components, result.components);
    const independent = nP.nodal([drive(child, 1), 1], [drive(child, 2), 2], ['out', 1, 2]).solveDC();
    close(component(independent, 'p1/p5').terminalCurrents[0], 1 / 225);
    close(component(independent, 'p2/p5').terminalCurrents[0], 2 / 225);
});

test('physical via/film resistances, ideal lines, Load and seriesTee use their declared DC models', () => {
    const via = nP.mvia(), film = nP.mtfr({sections: 2});
    for (const [part, resistance] of [[via, via.microstrip.Rdc], [film, film.filmResistor.resistance]]) {
        close(component(drive(part).solveDC(), 'p5').terminalCurrents[0], 1 / (200 + resistance));
    }
    close(component(drive(nP.mlin({resistivity: 0})).solveDC(), 'p5').terminalCurrents[0], 1 / 200);
    const junction = nP.nodal([nP.seriesTee(), 1, 2, 3], [nP.R(25), 3, 4], [nP.Short(), 4], ['out', 1, 2]);
    const seriesResult = drive(junction).solveDC();
    close(component(seriesResult, 'p5').terminalCurrents[0], 1 / 225);
    const saved = nP.global.Ro;
    try {
        nP.global.Ro = 75;
        const load = nP.Load();
        nP.global.Ro = 50;
        const loaded = nP.nodal([nP.Tee(), 1, 2, 3], [nP.V(1), 1, 4], [nP.Short(), 4], [load, 3], ['out', 2]);
        close(component(loaded.solveDC(), 'p4').terminalCurrents[0], 1 / 75);
    } finally { nP.global.Ro = saved; }
});

test('attenuators and explicit real linear constraints use voltage/current equations', () => {
    const part = nP.Attn(6), k = 10 ** (6 / 20), r = part.global.Ro;
    const shunt = r * (k + 1) / (k - 1), series = r * (k * k - 1) / (2 * k);
    const outputResistance = 1 / (1 / shunt + 1 / 100);
    const inputResistance = 1 / (1 / shunt + 1 / (series + outputResistance));
    const result = drive(part).solveDC();
    close(component(result, 'p5').terminalCurrents[0], 1 / (100 + inputResistance));
    close(voltage(result, 6), inputResistance / (100 + inputResistance) * outputResistance / (series + outputResistance));
    close(component(drive(nP.Attn(0)).solveDC(), 'p5').terminalCurrents[0], 1 / 200);
    const fixture = new nPort();
    fixture.setspars(nP.Thru().spars); fixture.setglobal(nP.Thru().global);
    fixture._dcModel = dcModel('DeclaredRatio', 2, 'linear', 'ideal', {modelId: 'linear-constraints',
        voltageCoefficients: [[1, -2], [0, 0]], currentCoefficients: [[0, 0], [2, 1]]});
    const ratio = drive(fixture).solveDC();
    close(voltage(ratio, 5), 0.8); close(voltage(ratio, 6), 0.4);
    close(component(ratio, 'p5').terminalCurrents[0], 0.002);
    close(component(ratio, 'p5').terminalCurrents[1], -0.004);
});

test('missing and nonlinear DC models are reported together with complete placement paths', () => {
    const network = nP.cascade(nP.Amp(), nP.mlin(), nP.D());
    assert.throws(() => network.solveDC(), error => {
        assert.equal(error.code, 'DC_UNSUPPORTED_MODELS');
        assert.deepEqual(error.issues.map(item => [item.path, item.constructorName]),
            [['p1/p1', 'Amp'], ['p1/p2', 'mlin'], ['p2', 'D']]);
        assert.match(error.message, /nonlinear DC adapter/);
        assert.match(error.message, /conductor-resistance/);
        return true;
    });
    assert.throws(() => nP.R().solveDC({}), /no arguments/);
    const custom = new nPort(); custom.setspars(nP.Thru().spars);
    assert.throws(() => custom.solveDC(), error => error.code === 'DC_UNSUPPORTED_MODELS');
});

test('every electrical constructor reaches a linear solve or an explicit model-support error', () => {
    const helpers = new Set(['chebyLPgk', 'chebyLPLCs', 'chebyLPNsec']);
    for (const name of Object.keys(electrical)) {
        if (helpers.has(name)) continue;
        const part = name === 'nodal' ? nP.nodal([nP.R(), 1, 2], ['out', 1, 2]) :
            name === 'cascade' ? nP.cascade(nP.R(), nP.C()) : electrical[name]();
        const pending = pendingModel(part._dcModel);
        if (pending) assert.throws(() => part.solveDC(), error => error.code === 'DC_UNSUPPORTED_MODELS', name);
        else assert.equal(part.solveDC().converged, true, name);
    }
});


test('equilibration preserves small and large resistor currents without arbitrary shunt conductance', () => {
    for (const resistance of [1e-12, 1e-6, 1, 1e6, 1e12]) {
        const network = nP.nodal(
            [nP.Tee(), 1, 2, 3],
            [nP.V(1), 1, 4],
            [nP.Short(), 4],
            [nP.R(resistance), 3, 5],
            [nP.R(resistance), 5, 6],
            [nP.Short(), 6],
            ['out', 2]
        );
        const result = network.solveDC();
        close(voltage(result, 5), 0.5);
        close(component(result, 'p4').terminalCurrents[0] * 2 * resistance, 1);
        assert.deepEqual(result.diagnostics, []);
    }
});
