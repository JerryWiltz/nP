// Modified: 2026-11-26
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {mosfetNetwork} from './fixtures/mosfet-network';
import {jfetNetwork} from './fixtures/jfet-network';
import {singleDetector} from './fixtures/rectification-networks';

function setup() { const g = nP.global(); g.fList = [1e9]; return g; }
function close(a, b, tolerance = 1e-10) { assert.ok(Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(b)), `${a} != ${b}`); }
function driven(part, voltage = 1, resistance = 175) {
    const r = nP.R(resistance), v = nP.V(voltage), ground = nP.Short(), tee = nP.Tee();
    const network = nP.nodal([tee, 1, 2, 3], [v, 1, 4], [ground, 4], [r, 2, 5], [part, 5, 6], [ground, 6], ['out', 3]);
    return {network, r, v};
}

test('linear DC output selects original parts, units, current signs and fresh table copies', () => {
    setup();
    const {network, r, v} = driven(nP.R(0));
    const before = structuredClone({spars: network.spars, noise: network.noise});
    const dc = network.solveDC(), json = JSON.stringify(dc);
    const output = dc.out('v12', 'i1mA', 'i2uA', {component: r, label: 'R1'});
    assert.deepEqual(output[0], ['Component', 'v12 (V)', 'i1 (mA)', 'i2 (µA)']);
    assert.equal(output[1][0], 'R1');
    close(output[1][1], 1); close(output[1][2], 1000 / 175); close(output[1][3], -1e6 / 175);
    close(dc.out('i1', {component: v})[1][1], -1 / 175);
    output[1][1] = 99;
    close(dc.out('v12', {component: r})[1][1], 1);
    assert.equal(JSON.stringify(dc), json);
    assert.deepEqual(structuredClone({spars: network.spars, noise: network.noise}), before);
    assert.ok(Object.isFrozen(dc) && Object.isFrozen(dc.components[0]));
    assert.equal(Object.getOwnPropertyDescriptor(dc, 'out').enumerable, false);
    assert.equal(Object.getOwnPropertyDescriptor(dc, 'out').writable, false);
    assert.equal(structuredClone(dc).out, undefined);
    assert.deepEqual(JSON.parse(JSON.stringify(dc)), JSON.parse(json));
    assert.throws(() => dc.out('i1', {component: nP.R(175)}), /not found/);
});

test('typed nodes, node differences and terminal differences preserve floating gauges', () => {
    setup();
    const source = nP.V(2), wire = nP.Short();
    const floating = source.solveDC();
    assert.equal(floating.out('v1', {component: source})[1][1], 'undetermined');
    close(floating.out('v12', 'v21mV', {component: source})[1][1], 2);
    close(floating.out('v21mV', {component: source})[1][1], -2000);
    close(floating.out('voltageuV', {nodes: [1, 2]})[1][1], 2e6);
    close(floating.out('voltage', {nodes: [1, 1]})[1][1], 0);
    assert.equal(floating.out('voltage', {node: 1})[1][1], 'undetermined');
    const typed = nP.nodal([source, 1, '1'], [wire, '1'], ['out', 1]).solveDC();
    close(typed.out('voltage', {node: 1})[1][1], 2);
    close(typed.out('voltage', {node: '1'})[1][1], 0);
    assert.deepEqual(typed.out('voltage')[0], ['Node', 'voltage (V)']);
    assert.notEqual(typed.out('voltage', {node: 1})[1][0], typed.out('voltage', {node: '1'})[1][0]);
    const open = nP.C().solveDC();
    assert.equal(open.out('v12')[1][1], 'undetermined');
    assert.equal(open.out('i1')[1][1], 0);
});

test('reused templates reject ambiguity; placement paths and nested component identities stay distinct', () => {
    setup();
    const r = nP.R(50), ground = nP.Short(), source = nP.V(1), tee = nP.Tee();
    const network = nP.nodal([tee, 1, 2, 3], [source, 1, 4], [ground, 4], [r, 2, 5], [r, 5, 6], [ground, 6], ['out', 3]);
    const dc = network.solveDC();
    assert.throws(() => dc.out('i1mA', {component: r}), /reused at p4, p5/);
    close(dc.out('v12', {component: 'p4'})[1][1], .5);
    close(dc.out('i1mA', {component: 'p5'})[1][1], 10);
    const childR = nP.R(25), childC = nP.C(1e-9), child = nP.cascade(childR, childC);
    const parent = nP.nodal([child, 10, 20], ['out', 10, 20]).solveDC();
    assert.equal(parent.out('i1', {component: childR})[1][1], 0);
    assert.equal(parent.out('v12', {component: childR})[1][1], 0);
    assert.equal(parent.out('voltage', {path: 'p1', nodes: [1, 2]})[1][1], 0);
    assert.equal(parent.out('i1', {component: child})[1][1], 0);
});

test('automatic FET bias results have the same reader as explicit solving and template Q remains intact', () => {
    setup();
    for (const kind of ['NJF', 'NMOS', 'PMOS']) {
        const q = nP[kind](), before = JSON.stringify(q);
        const network = kind === 'NJF' ? jfetNetwork({q}) : mosfetNetwork({name: kind, q});
        const dc = network.operatingPoint, table = dc.out('vgs', 'vds', 'idmA', {component: q, label: 'Q1'});
        const point = dc.components.find(part => part.constructorName === kind).qPoint;
        assert.deepEqual(table[0], ['Component', 'vgs (V)', 'vds (V)', 'id (mA)']);
        close(table[1][1], point.vgs); close(table[1][2], point.vds); close(table[1][3], point.id * 1000);
        assert.deepEqual(network.solveDC().out('vgs', 'vds', 'idmA', {component: q, label: 'Q1'}), table);
        assert.equal(JSON.stringify(q), before);
    }
});

test('BJT named emitter current preserves its outward convention while terminal current enters', () => {
    setup();
    for (const [name, sign] of [['NPN', 1], ['PNP', -1]]) {
        const q = nP[name](), base = nP.V(sign * .65), collector = nP.V(sign * 5), tee = nP.Tee(), short = nP.Short();
        const net = nP.nodal([q, 1, 2, 3], [short, 3], [tee, 4, 1, 10], [base, 4, 5], [short, 5],
            [tee, 6, 2, 11], [collector, 6, 7], [short, 7], ['out', 10, 11]);
        const table = net.operatingPoint.out('ibuA', 'icmA', 'iemA', 'i3mA', 'vbe', 'vce', {component: q});
        const row = table[1];
        close(row[3], -row[4]);
        close(row[3], row[1] / 1000 + row[2]);
        close(row[5], sign * .65); close(row[6], sign * 5);
        assert.ok(sign * row[2] > 0);
    }
});

test('nonunique ideal-source currents remain undetermined in displayed tables', () => {
    setup();
    const a = nP.V(2), b = nP.V(2), tee = nP.Tee(), short = nP.Short();
    const dc = nP.nodal([tee, 1, 2, 3], [a, 2, 4], [short, 4], [b, 3, 5], [short, 5], ['out', 1]).solveDC();
    assert.equal(dc.out('i1mA', {component: a})[1][1], 'undetermined');
    close(dc.out('v12', {component: b})[1][1], 2);
});

test('diode and PIN tables use solved currents and storage resistance rather than constructor seeds', () => {
    setup();
    for (const part of [nP.D({qPoint: {vd: .2}}), nP.PIN()]) {
        const {network} = driven(part, 2, 2000), dc = network.operatingPoint;
        const result = dc.out('vd', 'idmA', {component: part});
        const point = dc.components.find(row => row.constructorName === part._dcModel.constructorName).qPoint;
        close(result[1][1], point.vd); close(result[1][2], point.id * 1000);
        close(result[1][2], (2 - point.vd) / 2);
        if (part._dcModel.constructorName === 'PIN') {
            const solved = nP.PIN({qPoint: {vd: point.vd}});
            close(dc.out('bulkResistance', {component: part})[1][1], solved.smallSignal.bulkResistance);
            close(dc.out('bulkResistancekohm', {component: part})[1][1], solved.smallSignal.bulkResistance / 1000);
        }
    }
    const rectified = singleDetector().rectify({frequencyHz: 1e9, inputPowerDbm: -70, outputNodes: ['load', 'ground']});
    assert.equal(typeof rectified.operatingPoint.out, 'function');
    assert.equal(rectified.operatingPoint.out('voltage', {node: 'load'})[1][1], 0);
});

test('invalid selectors, dimensions, measurements and ambiguous options fail without changing data', () => {
    setup();
    const r = nP.R(50), dc = r.solveDC(), before = JSON.stringify(dc);
    for (const selectors of [[], ['typo'], ['__proto__'], [7], ['i1V'], ['v1A'], ['v1', 'v1V'], ['v3'], ['i100'],
        ['v1', null], ['v1', {label: ''}], ['v1', {unknown: true}], ['v1', {component: 3}],
        ['i1', {component: 'absent'}], ['ic', {component: r}], ['voltage', {node: {}}],
        ['voltage', {nodes: [1]}], ['voltage', {nodes: new Array(2)}], ['voltage', {nodes: [1, 'missing']}],
        ['voltage', {node: 1, nodes: [1, 2]}], ['voltage', {component: r}], ['v1', {node: 1}],
        ['voltage', 'i1'], ['voltage', {path: 4}]]) assert.throws(() => dc.out(...selectors));
    assert.equal(JSON.stringify(dc), before);
});
