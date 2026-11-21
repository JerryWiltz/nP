// Modified: 2026-11-20
// Diagnostic only: no parameter fitting or changes to constructor defaults.
// Run: node --no-warnings --loader ./scripts/extensionless-loader.mjs scripts/audit-hemt-accuracy.mjs
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {deviceFrequencyRow} from '../src/np-nport/src/transistors/deviceRf.js';
import {hemtJunction} from '../src/np-nport/src/transistors/fet/hemtEquations.js';
import {atf35143Measured as measured} from '../test/fixtures/hemt-atf35143-measured.js';
import {hemtPackageReference as reference} from '../test/fixtures/hemt-atf35143-package-reference.js';

const z = nP.complex;
function inverse(a) { return nP.matrix(a).invertCplx().m; }
function multiply(a, b) { return nP.matrix(a).mulCplx(nP.matrix(b)).m; }
function subtract(a, b) { return nP.matrix(a).subCplx(nP.matrix(b)).m; }
function add(a, b) { return nP.matrix(a).addCplx(nP.matrix(b)).m; }
function identity(n) { return Array.from({length: n}, (_, i) => Array.from({length: n}, (_, j) => z(i === j ? 1 : 0, 0))); }
function sumColumns(a) { return a[0].map((_, j) => a.reduce((sum, row) => sum.add(row[j]), z(0, 0))); }
function select(a, rows, columns) { return rows.map(i => columns.map(j => a[i][j])); }
function admittance(s) {
    return multiply(subtract(identity(2), s), inverse(add(identity(2), s))).map(row => row.map(value => value.mul(z(1 / 50, 0))));
}
function commonSource(row) {
    const s = Array.from({length: 3}, (_, i) => row.slice(1 + 3 * i, 4 + 3 * i));
    return s.slice(0, 2).map(r => r.slice(0, 2).map((value, j) => value.sub(r[2].mul(s[2][j]).div(z(1, 0).add(s[2][2])))));
}
function measuredS(row) {
    const polar = column => z(row[column] * Math.cos(row[column + 1] * Math.PI / 180), row[column] * Math.sin(row[column + 1] * Math.PI / 180));
    return [[polar(1), polar(5)], [polar(3), polar(7)]];
}

// Passive embedding: ground external S, retain external G/D and all three
// intrinsic terminals, then eliminate the remaining internal nodes.
function embedding(graph, frequency) {
    const y = Array.from({length: graph.nodeCount}, () => Array.from({length: graph.nodeCount}, () => z(0, 0)));
    const omega = 2 * Math.PI * frequency;
    function branch(a, b, value) {
        y[a][a] = y[a][a].add(value); y[b][b] = y[b][b].add(value);
        y[a][b] = y[a][b].sub(value); y[b][a] = y[b][a].sub(value);
    }
    graph.resistors.forEach(([a, b, r]) => branch(a, b, z(1 / r, 0)));
    graph.inductors.forEach(([a, b, l]) => branch(a, b, z(0, -1 / (omega * l))));
    graph.capacitors.forEach(([a, b, c]) => branch(a, b, z(0, omega * c)));
    graph.seriesRC.forEach(([a, b, r, c]) => branch(a, b, z(r, -1 / (omega * c)).inv()));
    const boundary = [...graph.ports.slice(0, 2), ...graph.intrinsic];
    const internal = Array.from({length: graph.nodeCount}, (_, i) => i).filter(i => !boundary.includes(i) && i !== graph.ports[2]);
    return subtract(select(y, boundary, boundary), multiply(multiply(select(y, boundary, internal),
        inverse(select(y, internal, internal))), select(y, internal, boundary)));
}
function deembed(s, graph, frequency) {
    const p = embedding(graph, frequency), y = admittance(s);
    const a = select(p, [0, 1], [0, 1]), b = select(p, [0, 1], [2, 3, 4]);
    const c = select(p, [2, 3, 4], [0, 1]), d = select(p, [2, 3, 4], [2, 3, 4]);
    // External currents provide two equations; intrinsic current conservation
    // supplies the third. This retains the moving intrinsic source reference.
    const rhs = [...subtract(y, a), sumColumns(c).map(value => value.mul(z(-1, 0)))];
    const voltages = multiply(inverse([...b, sumColumns(d)]), rhs);
    const currents = add(c, multiply(d, voltages)).map(row => row.map(value => value.mul(z(-1, 0))));
    const controls = voltages.slice(0, 2).map(row => row.map((value, j) => value.sub(voltages[2][j])));
    return multiply(currents.slice(0, 2), inverse(controls));
}
function intrinsicY(point, frequency) {
    return point.data.currents.slice(0, 2).map((current, terminal) => {
        const charge = point.data.charges[terminal], omega = 2 * Math.PI * frequency;
        return [z(current[1] + current[2], omega * (charge[1] + charge[2])), z(-current[2], -omega * charge[2])];
    });
}
function quantities(y, frequency) {
    return {forwardConductanceMS: 1000 * y[1][0].x, gateCapacitancePF: 1e12 * y[0][0].y / (2 * Math.PI * frequency)};
}
function response(model, frequencies) {
    return frequencies.map(frequency => {
        const s21 = commonSource(deviceFrequencyRow(model, frequency).spars)[1][0];
        return {frequencyGHz: frequency / 1e9, gainDb: 20 * Math.log10(s21.mag()), phaseDeg: Math.atan2(s21.y, s21.x) * 180 / Math.PI};
    });
}
function difference(a, b) {
    return a.reduce((error, row, i) => ({gainDb: Math.max(error.gainDb, Math.abs(row.gainDb - b[i].gainDb)),
        phaseDeg: Math.max(error.phaseDeg, Math.abs(row.phaseDeg - b[i].phaseDeg))}), {gainDb: 0, phaseDeg: 0});
}
function withSourceInductance(graph, inductance) {
    const result = structuredClone(graph), source = graph.ports[2];
    result.inductors = graph.inductors.map(([a, b, value]) => {
        if (a !== source && b !== source) return [a, b, value];
        const next = result.nodeCount++;
        return a === source ? [next, b, value] : [a, next, value];
    });
    // Each source lead receives its own added inductance. These are diagnostic
    // trial values, not a fitted or dimensionally validated via model.
    for (let node = graph.nodeCount; node < result.nodeCount; node++) result.inductors.push([source, node, inductance]);
    return result;
}

const frequencies = measured.rows.map(row => row[0] * 1e9);
const q = nP.HEMT({model: reference.model, temperature: reference.temperature, fList: frequencies,
    qPoint: {vgs: reference.vgs, vds: measured.vds}});
assert.ok(Math.abs(q.qPoint.id - measured.id) < 1e-12);
const base = q._intermod, baseline = response(base, frequencies);
console.log('Residual die equivalent, assuming the published embedding and zero extra fixture parasitics:');
console.table(frequencies.map((frequency, i) => {
    const own = deembed(commonSource(q.spars[i]), base.rfTopology, frequency), expected = intrinsicY(base.point, frequency);
    own.forEach((row, r) => row.forEach((value, c) => assert.ok(value.sub(expected[r][c]).mag() < 1e-10, 'Deembedding round trip failed')));
    const actual = quantities(deembed(measuredS(measured.rows[i]), base.rfTopology, frequency), frequency), model = quantities(own, frequency);
    return {GHz: frequency / 1e9, modelMS: model.forwardConductanceMS, apparentMeasuredMS: actual.forwardConductanceMS,
        modelPF: model.gateCapacitancePF, apparentMeasuredPF: actual.gateCapacitancePF};
}));
console.log('Charge-smoothing sensitivity against Delta1=0.25 V (Delta2=0.2 V throughout):');
console.table([.2, .3].map(DELTA1 => {
    const p = {...base.p, DELTA1}, point = {...base.point, data: hemtJunction(p, base.point.intrinsicVgs, base.point.intrinsicVgd)};
    return {delta1: DELTA1, ...difference(response({...base, p, point, rows: new Map()}, frequencies), baseline)};
}));
console.log('Added inductance per source lead: diagnostic trials, not manufacturer via values:');
console.table([0, 50, 100, 200, 400].map(pH => {
    const values = pH === 0 ? baseline : response({...base, rfTopology: withSourceInductance(base.rfTopology, pH * 1e-12), rows: new Map()}, frequencies);
    return {pH, gainAtHalfGHz: values[0].gainDb, phaseAtHalfGHz: values[0].phaseDeg,
        gainAtSixGHz: values.at(-1).gainDb, phaseAtSixGHz: values.at(-1).phaseDeg};
}));
console.log('PASS: bias and deembedding round trips verified at all seven frequencies; no constructor parameters changed.');
