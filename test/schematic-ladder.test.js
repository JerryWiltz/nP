// Modified: 2026-11-08
import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from '@xmldom/xmldom';
import * as nP from '../src/index.js';
import {schematicGraph, schematicSvg, schematicTopology} from '../src/np-chart/src/schematic.js';

test('network-only layout follows the ladder connectivity and places three shunts', () => {
    const tee1 = nP.Tee(), tee2 = nP.Tee(), tee3 = nP.Tee();
    const short = nP.Short(), open = nP.Open();
    const circuit = nP.nodal(
        [tee3, 10, 9, 11],
        [nP.Tlin(50, 0.01), 10, 12],
        [open, 12],
        [nP.R(75), 7, 9],
        [tee1, 4, 1, 2],
        [nP.R(100), 4, 5],
        [short, 5],
        [nP.R(50), 2, 3],
        [tee2, 6, 3, 7],
        [nP.sePaRL(100, 5e-9), 6, 8],
        [short, 8],
        ['out', 1, 11]
    );
    const graph = schematicGraph(circuit);
    const topology = schematicTopology(circuit);
    assert.equal(graph.kind, 'rf-nodal');
    assert.equal(graph.shape, 'ladder');
    assert.equal(graph.components.length, 11);
    assert.equal(graph.board.interpreter, 'ORI');
    assert.equal(graph.layout, 'ladder');
    assert.deepEqual(graph.components.map(part => JSON.stringify(part.ports.map(port => port.node))).sort(),
        circuit._schematic.components.map(entry => JSON.stringify(entry.nodes)).sort());
    assert.deepEqual(graph.externalPorts.map(port => port.node), [1, 11]);
    assert.equal(topology.parts.length, 11);
    assert.equal(topology.connections.length, 12);
    assert.equal(new DOMParser().parseFromString(schematicSvg(circuit), 'image/svg+xml')
        .getElementsByTagName('parsererror').length, 0);
});

test('network-only ladder accepts different series and shunt components', () => {
    const circuit = nP.nodal(
        [nP.Tee(), 4, 1, 2],
        [nP.C(1e-12), 4, 5],
        [nP.Short(), 5],
        [nP.L(5e-9), 2, 3],
        ['out', 1, 3]
    );
    const graph = schematicGraph(circuit);
    assert.equal(graph.board.interpreter, 'ORI');
    assert.deepEqual(graph.components.map(part => JSON.stringify(part.ports.map(port => port.node))).sort(),
        circuit._schematic.components.map(entry => JSON.stringify(entry.nodes)).sort());
});

test('a simple series path renders without a shunt branch', () => {
    const circuit = nP.nodal([nP.R(50), 1, 2], ['out', 1, 2]);
    assert.deepEqual(schematicGraph(circuit).components.map(part => part.symbol), ['resistor']);
});

test('series guidance accepts reordered components and a completed two-port network', () => {
    const block = nP.nodal([nP.R(50), 1, 2], ['out', 1, 2]);
    const circuit = nP.nodal(
        [nP.L(5e-9), 37, 1],
        [block, 45, 37],
        ['out', 45, 1]
    );
    const graph = schematicGraph(circuit, {shapes: ['series']});
    assert.equal(graph.shape, 'series');
    assert.deepEqual(graph.components.map(part => part.symbol), ['nodal', 'inductor']);
});

test('series guidance draws a completed nodal as a block within a cascade', () => {
    const block = nP.nodal([nP.R(50), 1, 2], ['out', 1, 2]);
    const circuit = block.cas(nP.L(5e-9));
    const graph = schematicGraph(circuit, {shapes: ['series']});
    assert.equal(graph.shape, 'series');
    assert.deepEqual(graph.components.map(part => part.symbol), ['nodal', 'inductor']);
});

test('ladder guidance places the main path and downward shunts', () => {
    const circuit = nP.nodal(
        [nP.Tee(), 4, 1, 2],
        [nP.C(1e-12), 4, 5],
        [nP.Short(), 5],
        [nP.L(5e-9), 2, 3],
        ['out', 1, 3]
    );
    const graph = schematicGraph(circuit, {shapes: ['ladder']});
    assert.equal(graph.shape, 'ladder');
    assert.deepEqual(graph.components.map(part => part.symbol),
        ['tee', 'inductor', 'capacitor', 'short']);
    assert.ok(graph.components.slice(2).every(part => part.ports[0].at[1] > 100));
    assert.throws(() => schematicGraph(circuit, {shapes: ['series']}), /does not match/);
});

test('microstrip ladder rotates mtee and mlin from their port geometry', () => {
    const circuit = nP.nodal(
        [nP.mtee(), 4, 1, 2],
        [nP.mlin(), 4, 5],
        [nP.Short(), 5],
        [nP.mlin(), 2, 3],
        ['out', 1, 3]
    );
    const graph = schematicGraph(circuit, {shapes: ['ladder']});
    const [junction, mainLine, shuntLine] = graph.components;
    assert.equal(graph.shape, 'ladder');
    assert.equal(junction.symbol, 'microstrip-tee');
    assert.equal(junction.rotation, 270);
    assert.ok(junction.ports[0].at[1] > junction.ports[1].at[1]);
    assert.equal(mainLine.rotation, 0);
    assert.equal(shuntLine.rotation, 90);
    assert.equal(shuntLine.ports[0].at[0], junction.ports[0].at[0]);
    assert.ok(shuntLine.ports[1].at[1] > shuntLine.ports[0].at[1]);
    assert.equal(new DOMParser().parseFromString(schematicSvg(circuit, {shapes: ['ladder']}),
        'image/svg+xml').getElementsByTagName('parsererror').length, 0);
});

test('microstrip ladder mirrors a reversed mtee while preserving port numbers', () => {
    const circuit = nP.nodal(
        [nP.mtee(), 4, 2, 1],
        [nP.Tlin(50, 0.01), 4, 5],
        [nP.Short(), 5],
        [nP.mlin(), 2, 3],
        ['out', 1, 3]
    );
    const graph = schematicGraph(circuit, {shapes: ['ladder']});
    const junction = graph.components[0];
    assert.equal(junction.mirrorY, true);
    assert.deepEqual(junction.ports.map(port => port.node), [4, 2, 1]);
    assert.ok(junction.ports[0].at[1] > junction.ports[2].at[1]);
    assert.equal(graph.components[2].rotation, 90);
});

test('microstrip ladder keeps its physical via-to-ground below the shunt', () => {
    const circuit = nP.nodal(
        [nP.mtee(), 4, 1, 2],
        [nP.mlin(), 4, 5],
        [nP.mvgnd(), 5],
        [nP.mlin(), 2, 3],
        ['out', 1, 3]
    );
    const graph = schematicGraph(circuit, {shapes: ['ladder']});
    const via = graph.components.find(part => part.symbol === 'microstrip-via-to-ground');
    const shunt = graph.components.find(part => part.symbol === 'microstrip-line' &&
        part.ports.some(port => port.node === 5));
    assert.equal(via.rotation, 0);
    assert.equal(via.ports[0].node, 5);
    assert.equal(via.ports[0].at[0], shunt.ports[1].at[0]);
    assert.ok(via.ports[0].at[1] > shunt.ports[1].at[1]);
});

test('node boundaries guide series then ladder in one reordered nodal network', () => {
    const circuit = nP.nodal(
        [nP.Short(), 7],
        [nP.Tee(), 5, 4, 6],
        [nP.R(75), 27, 4],
        [nP.C(1e-12), 5, 7],
        [nP.R(50), 1, 27],
        [nP.Tlin(50, 0.01), 6, 11],
        ['out', 1, 11]
    );
    const shapes = [{name: 'series', from: 1, to: 4},
        {name: 'ladder', from: 4, to: 11}];
    const before = JSON.stringify(circuit._schematic);
    const graph = schematicGraph(circuit, {shapes});
    assert.deepEqual(graph.shapes, shapes);
    assert.equal(graph.layout, 'board-composition');
    assert.equal(graph.board.interpreter, 'ORI');
    assert.deepEqual(graph.board.sections.map(section => section.name), ['series', 'ladder']);
    assert.deepEqual(graph.components.map(part => part.ports.map(port => port.node)),
        circuit._schematic.components.map(entry => entry.nodes));
    assert.deepEqual(graph.components.map(part => part.symbol).sort(),
        ['resistor', 'resistor', 'tee', 'transmission-line', 'capacitor', 'short'].sort());
    assert.deepEqual(graph.externalPorts.map(port => port.node), [1, 11]);
    const flipped = schematicGraph(circuit, {shapes, flipVertical: true});
    assert.deepEqual(flipped.shapes, shapes);
    assert.equal(flipped.board.interpreter, 'ORI');
    assert.deepEqual(flipped.components.map(part => part.ports.map(port => port.at)),
        graph.components.map(part => part.ports.map(port => [port.at[0], -port.at[1]])));
    assert.equal(JSON.stringify(circuit._schematic), before);
    assert.equal(new DOMParser().parseFromString(schematicSvg(circuit, {shapes}),
        'image/svg+xml').getElementsByTagName('parsererror').length, 0);
    assert.throws(() => schematicGraph(circuit, {shapes: [
        {name: 'series', from: 1, to: 5},
        {name: 'ladder', from: 5, to: 11}
    ]}), /boundaries do not isolate/);
    assert.throws(() => schematicGraph(circuit, {shapes: [
        {name: 'series', from: 1, to: 4},
        {name: 'ladder', from: 6, to: 11}
    ]}), /section boundaries/);
});

test('shape guidance rejects a branch that lacks a two-port shunt element', () => {
    const circuit = nP.nodal(
        [nP.Tee(), 4, 1, 2],
        [nP.Short(), 4],
        [nP.R(50), 2, 3],
        ['out', 1, 3]
    );
    assert.throws(() => schematicGraph(circuit, {shapes: ['ladder']}), /does not match/);
    assert.throws(() => schematicGraph(circuit, {shapes: ['seriesOf2Ports']}),
        /shapes accepts/);
});
