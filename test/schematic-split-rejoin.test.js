// Modified: 2026-10-31
import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from '@xmldom/xmldom';
import * as nP from '../src/index.js';
import {schematicGraph, schematicSvg, schematicTopology} from '../src/np-chart/src/schematic.js';

function fourPathCircuit() {
    const split = nP.Tee(), upperSplit = nP.Tee(), lowerSplit = nP.Tee();
    const join = nP.Tee(), upperJoin = nP.Tee(), lowerJoin = nP.Tee();
    const upperShunt = nP.Tee(), lowerShunt = nP.Tee();
    return nP.nodal(
        [split, 1, 2, 3],
        [upperSplit, 2, 4, 5],
        [lowerSplit, 3, 6, 7],
        [nP.R(50), 4, 8],
        [nP.L(5e-9), 8, 9],
        [upperShunt, 10, 5, 11],
        [nP.C(1e-12), 10, 12],
        [nP.Short(), 12],
        [nP.Tlin(50, 0.01), 6, 13],
        [nP.R(75), 13, 14],
        [lowerShunt, 15, 7, 16],
        [nP.R(100), 15, 17],
        [nP.Short(), 17],
        [upperJoin, 18, 11, 9],
        [lowerJoin, 19, 16, 14],
        [join, 20, 19, 18],
        ['out', 1, 20]
    );
}

test('network-only renderer keeps every part and connection in four split paths', () => {
    const circuit = fourPathCircuit();
    const graph = schematicGraph(circuit);
    const topology = schematicTopology(circuit);
    assert.equal(graph.components.length, 16);
    assert.equal(topology.parts.length, 16);
    assert.deepEqual(topology.parts.map(part => JSON.stringify(part.nodes)).sort(),
        circuit._schematic.components.map(entry => JSON.stringify(entry.nodes)).sort());
    assert.deepEqual(graph.externalPorts.map(port => port.node), [1, 20]);
    assert.equal(graph.nodes.length, 20);
    assert.equal(new DOMParser().parseFromString(schematicSvg(circuit), 'image/svg+xml')
        .getElementsByTagName('parsererror').length, 0);
});

test('network-only renderer accepts two different parallel paths', () => {
    const circuit = nP.nodal(
        [nP.R(50), 2, 4],
        [nP.Tee(), 6, 5, 4],
        [nP.L(5e-9), 3, 5],
        [nP.Tee(), 1, 2, 3],
        ['out', 1, 6]
    );
    const graph = schematicGraph(circuit);
    assert.equal(graph.components.length, 4);
    assert.deepEqual(graph.components.map(part => part.symbol).sort(),
        ['inductor', 'resistor', 'tee', 'tee']);
});

test('network-only renderer uses Tee4 for three distinct paths', () => {
    const circuit = nP.nodal(
        [nP.Tee4(), 1, 2, 3, 4],
        [nP.R(50), 2, 5],
        [nP.L(5e-9), 3, 6],
        [nP.C(1e-12), 4, 7],
        [nP.Tee4(), 8, 7, 6, 5],
        ['out', 1, 8]
    );
    const graph = schematicGraph(circuit);
    assert.deepEqual(graph.components.map(part => part.symbol).sort(),
        ['capacitor', 'inductor', 'resistor', 'tee4', 'tee4']);
    assert.deepEqual(graph.externalPorts.map(port => port.node), [1, 8]);
});

test('network-only renderer uses Tee5 in place of both three-tee trees', () => {
    const circuit = nP.nodal(
        [nP.Tee5(), 1, 2, 3, 4, 5],
        [nP.R(50), 2, 6],
        [nP.L(5e-9), 6, 7],
        [nP.Tee(), 8, 3, 9],
        [nP.C(1e-12), 8, 10],
        [nP.Short(), 10],
        [nP.Tlin(50, 0.01), 4, 11],
        [nP.R(75), 11, 12],
        [nP.Tee(), 13, 5, 14],
        [nP.R(100), 13, 15],
        [nP.Short(), 15],
        [nP.Tee5(), 16, 14, 12, 9, 7],
        ['out', 1, 16]
    );
    const graph = schematicGraph(circuit);
    const topology = schematicTopology(circuit);
    assert.equal(graph.components.length, 12);
    assert.equal(graph.components.filter(part => part.symbol === 'tee5').length, 2);
    assert.deepEqual(topology.parts.map(part => JSON.stringify(part.nodes)).sort(),
        circuit._schematic.components.map(entry => JSON.stringify(entry.nodes)).sort());
    assert.equal(new DOMParser().parseFromString(schematicSvg(circuit), 'image/svg+xml')
        .getElementsByTagName('parsererror').length, 0);
});

test('network-only renderer mixes a Tee5 splitter with a nested three-port combiner', () => {
    const circuit = nP.nodal(
        [nP.Tee5(), 1, 2, 3, 4, 5],
        [nP.R(50), 2, 6],
        [nP.L(5e-9), 3, 7],
        [nP.C(1e-12), 4, 8],
        [nP.Tlin(50, 0.01), 5, 9],
        [nP.Tee(), 10, 7, 6],
        [nP.Tee(), 11, 9, 8],
        [nP.Tee(), 12, 11, 10],
        ['out', 1, 12]
    );
    const graph = schematicGraph(circuit);
    assert.equal(graph.components.length, 8);
    assert.equal(graph.components.filter(part => part.symbol === 'tee5').length, 1);
    assert.equal(graph.components.filter(part => part.symbol === 'tee').length, 3);
});

test('network-only renderer also draws a plain series circuit', () => {
    const circuit = nP.nodal([nP.R(50), 1, 2], ['out', 1, 2]);
    assert.deepEqual(schematicGraph(circuit).components.map(part => part.symbol), ['resistor']);
});
