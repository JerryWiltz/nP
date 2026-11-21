// Modified: 2026-11-20
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {hemtPackageReference as r} from './fixtures/hemt-atf35143-package-reference';
import {atf35143Measured as measured} from './fixtures/hemt-atf35143-measured';
import {terminalContactResistances, validateTerminalNetwork} from '../src/np-nport/src/transistors/contactNetwork';
import {hemtParameters, hemtOperatingPoint} from '../src/np-nport/src/transistors/fet/hemtEquations';
import {jfetNetwork} from './fixtures/jfet-network';
function close(a, b, tolerance) { assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`); }

test('SC-70 package retains both source pins, all bond paths and exact contact reduction', () => {
    const q = nP.HEMT({model: 'atf35143', fList: [1e9]}), graph = q.model.terminalNetwork;
    assert.equal(q.model.name, 'ATF35143'); assert.match(q.model.package, /all three source bond paths retained/);
    assert.equal(graph.resistors.length, 9); assert.equal(graph.inductors.length, 12); assert.equal(graph.capacitors.length, 3);
    [1.1, .6, .25 + .1 / 3].forEach((value, i) => close(q.model.contactResistances[i], value, 1e-14));
    assert.equal(q._dcModel.definition.terminalNetwork.nodeCount, 21);
    assert.ok(Object.isFrozen(q._dcModel.definition.terminalNetwork.resistors));
    assert.equal(nP.HEMT({fList: [1e9]}).model.name, 'ATF35143_DIE');
    const shuffled = structuredClone(graph), rename = node => 5 * node % graph.nodeCount;
    shuffled.ports = shuffled.ports.map(rename); shuffled.intrinsic = shuffled.intrinsic.map(rename);
    for (const key of ['resistors', 'inductors', 'capacitors', 'seriesRC']) shuffled[key] = shuffled[key].reverse().map(([a, b, ...rest]) => [rename(a), rename(b), ...rest]);
    terminalContactResistances(shuffled).forEach((value, i) => close(value, q.model.contactResistances[i], 1e-13));
    const bad = structuredClone(graph); bad.resistors.push([graph.intrinsic[0], graph.intrinsic[1], 10]);
    assert.throws(() => terminalContactResistances(bad), /separate connected paths/);
    assert.throws(() => validateTerminalNetwork({...graph, inductors: [[0, 99, 1e-9]]}, 3), /inductors/);
});
test('packaged DC, every S entry and correlated noise agree with independent SPICE', () => {
    const q = nP.HEMT({model: r.model, temperature: r.temperature, qPoint: {vgs: r.vgs, vds: r.vds}, fList: r.spars.map(row => row[0])});
    close(q.qPoint.id, measured.id, 1e-12);
    const p = hemtParameters(q.model.parameters, q.model.contactResistances);
    for (const row of [{vgs: r.vgs, vds: r.vds, op: r.op}, ...r.dcPoints]) {
        const point = hemtOperatingPoint(p, row.vgs, row.vds);
        ['ig', 'id', 'is'].forEach((key, i) => close(point[key], -row.op[i + 3], 2e-11));
    }
    q.spars.forEach((row, f) => row.slice(1).forEach((z, i) => { close(z.x, r.spars[f][i + 1][0], 2e-8); close(z.y, r.spars[f][i + 1][1], 2e-8); }));
    q.noise.forEach(({C}, f) => C.forEach((row, i) => row.forEach((z, j) => {
        close(z.x, r.noise[f].C[i][j][0], 5e-29); close(z.y, r.noise[f].C[i][j][1], 5e-29);
        close(z.x, C[j][i].x, 1e-29); close(z.y, -C[j][i].y, 1e-29);
    })));
});
test('package bias uses the full resistor graph and rebuilds RF without mutating templates', () => {
    const saved = {...nP.global};
    try {
        nP.global.fList = [100e6, 1e9]; nP.global.Temp = r.temperature;
        const q = nP.HEMT({model: r.model}), before = JSON.stringify(q);
        const circuit = jfetNetwork({q, supply: 5, resistance: 47, drainResistance: 150}), dc = circuit.operatingPoint, device = dc.components[4], point = device.qPoint;
        ['vg', 'vd', 'vs'].forEach((key, i) => close(point[key], r.selfBias[i], 2e-8)); close(point.id, -r.selfBias[3], 2e-11);
        const branches = device.elements.filter(element => element.type === 'resistor');
        assert.equal(branches.length, 9);
        [branches[5], branches[6], branches[7]].forEach(element => close(element.current, point.is / 3, 1e-11));
        close(branches[8].current, 0, 1e-12);
        const fresh = nP.HEMT({model: r.model, qPoint: {vgs: point.vgs, vds: point.vds}}), parts = circuit._rfModel.components.slice(); parts[4] = fresh;
        const rebuilt = circuit._rfModel.rebuild(parts);
        circuit.spars.forEach((row, f) => row.slice(1).forEach((z, i) => close(z.sub(rebuilt.spars[f][i + 1]).mag(), 0, 1e-8)));
        circuit.noise.forEach(({C}, f) => C.forEach((row, i) => row.forEach((z, j) => close(z.sub(rebuilt.noise[f].C[i][j]).mag(), 0, 1e-27))));
        const second = jfetNetwork({q, supply: 5, resistance: 100, drainResistance: 150}), cascade = nP.cascade(circuit, second);
        assert.notEqual(cascade.operatingPoint.operatingPoints[0].intrinsicVgs, cascade.operatingPoint.operatingPoints[1].intrinsicVgs);
        assert.equal(JSON.stringify(q), before);
    } finally { Object.assign(nP.global, saved); }
});
test('published packaged-device comparison retains the measured bias and documented model discrepancies', () => {
    const fList = measured.rows.map(row => row[0] * 1e9), q = nP.HEMT({model: r.model, temperature: r.temperature, fList, qPoint: {vgs: r.vgs, vds: measured.vds}});
    const short = nP.Short({fList}), circuit = nP.nodal([q, 1, 2, 3], [short, 3], ['out', 1, 2]);
    close(q.qPoint.id, measured.id, 1e-12);
    const errors = Array.from({length: 4}, () => ({magnitudeDb: 0, phaseDeg: 0}));
    circuit.spars.forEach((row, i) => {
        const data = measured.rows[i];
        [1, 5, 3, 7].forEach((column, port) => {
            const z = row[port + 1], error = errors[port];
            error.magnitudeDb = Math.max(error.magnitudeDb, Math.abs(20 * Math.log10(z.mag() / data[column])));
            const difference = Math.atan2(z.y, z.x) * 180 / Math.PI - data[column + 1];
            error.phaseDeg = Math.max(error.phaseDeg, Math.abs((difference + 540) % 360 - 180));
        });
    });
    // Characterization bounds, separate from the tight numerical SPICE checks.
    // No model parameters are fitted to these measured rows.
    errors.forEach((error, port) => {
        assert.ok(error.magnitudeDb < [3.1, 1.9, 2.2, 2.2][port]);
        assert.ok(error.phaseDeg < [23, 12, 30, 15][port]);
    });
});
test('packaged RF/noise and weak products retain physical frequency dependence', () => {
    const saved = {...nP.global};
    try {
        nP.global.fList = [1e9]; nP.global.twoTone = {spacingHz: 1e6, p1dBm: -80, p2dBm: -80};
        const q = nP.HEMT({model: r.model}), short = nP.Short(), die = nP.HEMT();
        const circuit = nP.nodal([q, 1, 2, 3], [short, 3], ['out', 1, 2]);
        const low = circuit.out('IM2sum21dBm', 'IM3lower21dBm')[1];
        const high = circuit.out('IM2sum21dBm', 'IM3lower21dBm', {twoTone: {...nP.global.twoTone, p1dBm: -70, p2dBm: -70}})[1];
        assert.ok(low.every(Number.isFinite)); close(high[1] - low[1], 20, 1e-6); close(high[2] - low[2], 30, 1e-6);
        const packagedRow = q.spars.find(row => row[0] === 1e9), dieRow = die.spars.find(row => row[0] === 1e9);
        assert.ok(packagedRow.slice(1).some((z, i) => z.sub(dieRow[i + 1]).mag() > .01));
    } finally { Object.assign(nP.global, saved); }
});
