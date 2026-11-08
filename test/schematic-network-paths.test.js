// Modified: 2026-11-06
import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from '@xmldom/xmldom';
import * as nP from '../src/index.js';
import {schematicGraph, schematicSvg, schematicTopology} from '../src/np-chart/src/schematic.js';

test('network-only layout follows two resistors despite reordered nodal rows', () => {
    nP.global.fList = [2e9];
    const r1 = nP.R(50);
    const r2 = nP.R(75);
    const circuit = nP.nodal(
        [r2, 37, 1],
        [r1, 45, 37],
        ['out', 45, 1]
    );
    const graph = schematicGraph(circuit);
    assert.deepEqual(graph.components.map(part => part.symbol), ['resistor', 'resistor']);
    assert.deepEqual(graph.externalPorts.map(port => port.node), [45, 1]);
    assert.deepEqual(new Set(graph.nodes.map(node => node.id)), new Set([45, 37, 1]));
    assert.deepEqual(schematicTopology(circuit).connections.find(item => item.node === 37).ports.slice().sort(),
        ['R1.2', 'R2.1']);
    assert.equal(new DOMParser().parseFromString(schematicSvg(circuit), 'image/svg+xml')
        .getElementsByTagName('parsererror').length, 0);
});

test('network-only layout keeps bend and reversed component port assignments', () => {
    const circuit = nP.nodal(
        [nP.R(50), 10, 20],
        [nP.mbend(), 20, 30],
        [nP.L(5e-9), 30, 40],
        ['out', 10, 40]
    );
    const graph = schematicGraph(circuit);
    assert.deepEqual(graph.components.map(part => part.symbol),
        ['resistor', 'microstrip-right-bend', 'inductor']);
    assert.deepEqual(graph.components.map(part => part.ports.map(port => port.node)),
        circuit._schematic.components.map(entry => entry.nodes));

    const reversed = nP.nodal([nP.R(25), 2, 1], ['out', 1, 2]);
    assert.deepEqual(schematicGraph(reversed).components[0].ports.map(port => port.node), [2, 1]);
});

test('network-only layout keeps completed upstream nodals as blocks', () => {
    const a = nP.nodal(
        [nP.R(50), 1, 2],
        [nP.R(75), 2, 3],
        ['out', 1, 3]
    );
    const b = nP.nodal(
        [a, 1, 2],
        [nP.R(100), 2, 3],
        ['out', 1, 3]
    );
    assert.deepEqual(schematicGraph(b).components.map(part => part.symbol),
        ['nodal', 'resistor']);
    assert.deepEqual(schematicTopology(b).parts.map(part => part.type),
        ['nodal', 'resistor']);
});

test('network-only layout draws a branch instead of rejecting it as a path', () => {
    const circuit = nP.nodal(
        [nP.Tee(), 2, 1, 3],
        [nP.R(50), 3, 4],
        [nP.Short(), 4],
        ['out', 1, 2]
    );
    const graph = schematicGraph(circuit);
    assert.equal(graph.components.length, 3);
    assert.deepEqual(graph.externalPorts.map(port => port.node), [1, 2]);
    assert.ok(graph.nodes.some(node => node.id === 4));
});
