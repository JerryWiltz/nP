// Modified: 2026-11-08
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph, schematicTopology} from '../src/np-chart/src/schematic';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';
import {buildSchematicCases} from '../dev/schematicCases';
import {buildSchematicStressCases} from '../dev/schematicStressCases';

function assertElectricalDrawing(graph) {
    const terminals = graph.components.flatMap(part => part.ports).concat(graph.externalPorts);
    const nodeGraphs = new Map();
    for (const wire of graph.wires) {
        assert.equal(wire.points.length, 2);
        const [a, b] = wire.points;
        assert.ok(a[0] === b[0] || a[1] === b[1]);
        assert.notDeepEqual(a, b);
        assert.ok(wire.points.flat().every(value => value % 10 === 0));
        if (!nodeGraphs.has(wire.node)) nodeGraphs.set(wire.node, new Map());
        const adjacency = nodeGraphs.get(wire.node);
        const length = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
        for (let step = 0; step < length; step += 10) {
            const p = a.map((value, axis) => value + Math.sign(b[axis] - value) * step);
            const q = a.map((value, axis) => value + Math.sign(b[axis] - value) * (step + 10));
            for (const [from, to] of [[p, q], [q, p]]) {
                if (!adjacency.has(from.join(','))) adjacency.set(from.join(','), new Set());
                adjacency.get(from.join(',')).add(to.join(','));
            }
        }
    }
    for (const [node, adjacency] of nodeGraphs) {
        const ends = terminals.filter(port => port.node === node);
        const pending = [ends[0].at.join(',')], visited = new Set();
        while (pending.length) {
            const key = pending.pop();
            if (visited.has(key)) continue;
            visited.add(key);
            assert.ok(adjacency.has(key), `node ${node} misses a terminal`);
            pending.push(...adjacency.get(key));
        }
        assert.equal(visited.size, adjacency.size, `node ${node} has disconnected wire fragments`);
        assert.ok(ends.every(port => visited.has(port.at.join(','))));
    }
    assert.ok(terminals.every(port => nodeGraphs.has(port.node)));
    for (let i = 0; i < graph.wires.length; i++) {
        const a = graph.wires[i];
        for (const b of graph.wires.slice(i + 1)) {
            if (a.node === b.node) continue;
            const horizontal = a.points[0][1] === a.points[1][1];
            if (horizontal !== (b.points[0][1] === b.points[1][1])) continue;
            const fixed = horizontal ? 1 : 0, along = 1 - fixed;
            if (a.points[0][fixed] !== b.points[0][fixed]) continue;
            const overlap = Math.min(Math.max(...a.points.map(p => p[along])), Math.max(...b.points.map(p => p[along]))) -
                Math.max(Math.min(...a.points.map(p => p[along])), Math.min(...b.points.map(p => p[along])));
            assert.ok(overlap <= 0, `different nodes ${a.node}/${b.node} share a wire segment`);
        }
    }
}

test('all development nodals can explicitly use the generic ORI board and preserve complete wire connectivity', () => {
    for (const item of buildSchematicCases(nP).concat(buildSchematicStressCases(nP))) {
        if (item.circuit._schematic.kind !== 'nodal') continue;
        const before = item.circuit._schematic.components.map(entry => entry.nodes.slice());
        const graph = schematicGraph(item.circuit, {shapes: ['generic']});
        assert.equal(graph.layout, 'generic', item.id);
        assert.equal(graph.board.interpreter, 'ORI', item.id);
        assert.equal(graph.shape, undefined);
        assert.deepEqual(graph.components.map(part => part.ports.map(port => port.node)), before, item.id);
        assert.deepEqual(graph.externalPorts.map(port => port.node), item.circuit._schematic.externalNodes);
        assertElectricalDrawing(graph);
        const loops = schematicTopology(item.circuit).loopAnalysis;
        assert.equal(graph.board.regions.length > 0, loops.hasLoops, item.id);
        assert.deepEqual(item.circuit._schematic.components.map(entry => entry.nodes), before);
    }
});

test('the transformer divider renders with no shape and retains explicit powerDivider guidance', () => {
    const circuit = nP.nodal(
        [nP.trf(Math.sqrt(2)), 1, 10],
        [nP.trfAuto(), 10, 20, 21],
        [nP.Tee(), 30, 20, 2],
        [nP.Tee(), 31, 21, 3],
        [nP.R(100), 30, 31],
        ['out', 1, 2, 3]
    );
    const automatic = schematicGraph(circuit);
    assert.equal(automatic.components.length, 5);
    assert.equal(automatic.shape, 'powerDivider');
    assertElectricalDrawing(automatic);
    const guided = schematicGraph(circuit, {shapes: ['powerDivider']});
    assert.deepEqual(automatic, guided);
    assert.equal(guided.shape, 'powerDivider');
    assert.equal(guided.board.interpreter, 'ORI');
});


test('generic flow direction is board data rather than an RF pattern choice', () => {
    const definition = JSON.parse(JSON.stringify(schematicShapeBoards.generic));
    definition.name = 'leftwardGeneric';
    definition.board.flow = 'left';
    definition.board.branches = 'down';
    schematicShapeBoards.leftwardGeneric = definition;
    try {
        const circuit = nP.nodal([nP.R(50), 1, 2], [nP.L(5e-9), 2, 3], ['out', 1, 3]);
        const graph = schematicGraph(circuit, {shapes: ['leftwardGeneric']});
        assert.equal(graph.board.interpreter, 'ORI');
        assert.ok(graph.externalPorts[0].at[0] > graph.externalPorts[1].at[0]);
        assertElectricalDrawing(graph);
    } finally {
        delete schematicShapeBoards.leftwardGeneric;
    }
});

test('an implicit shared electrical node becomes a real junction, not a false loop', () => {
    const circuit = nP.nodal(
        [nP.R(50), 1, 2],
        [nP.R(75), 2, 3],
        [nP.R(100), 2, 4],
        ['out', 1, 3, 4]
    );
    const graph = schematicGraph(circuit);
    assert.equal(graph.board.regions.length, 0);
    assert.equal(schematicTopology(circuit).loopAnalysis.hasLoops, false);
    assertElectricalDrawing(graph);
    assert.ok(graph.junctions.some(junction => junction.node === 2));
});

test('upstream cascades and nodals remain single blocks in a generic network', () => {
    const cascade = nP.R(50).cas(nP.L(5e-9));
    const nodal = nP.nodal([nP.C(1e-12), 1, 2], ['out', 1, 2]);
    const circuit = nP.nodal([cascade, 1, 2], [nodal, 2, 3], ['out', 1, 3]);
    const graph = schematicGraph(circuit);
    assert.deepEqual(graph.components.map(part => part.symbol), ['cascade', 'nodal']);
    assert.equal(graph.components.length, 2);
    assertElectricalDrawing(graph);
});


test('the generic repeated path reuses bend direction changes', () => {
    const circuit = nP.nodal([nP.R(50), 1, 2], [nP.mbend(), 2, 3],
        [nP.L(5e-9), 3, 4], ['out', 1, 4]);
    const graph = schematicGraph(circuit);
    const bend = graph.components[1], following = graph.components[2];
    assert.equal(graph.board.interpreter, 'ORI');
    assert.equal(bend.ports[1].at[0], following.ports[0].at[0]);
    assert.ok(following.ports[0].at[1] > bend.ports[1].at[1]);
    assertElectricalDrawing(graph);
});
