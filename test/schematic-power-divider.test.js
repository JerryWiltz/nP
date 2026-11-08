// Modified: 2026-11-06
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph, schematicSvg} from '../src/np-chart/src/schematic';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';

function divider(reversed = false) {
    const transformer = nP.trf(Math.sqrt(2)), tap = nP.trfAuto();
    const upper = nP.Tee(), lower = nP.Tee(), resistor = nP.R(100);
    return reversed ? nP.nodal(
        [resistor, 31, 30],
        [lower, 31, 3, 21],
        [tap, 10, 21, 20],
        [transformer, 10, 1],
        [upper, 30, 2, 20],
        ['out', 1, 2, 3]
    ) : nP.nodal(
        [transformer, 1, 10],
        [tap, 10, 20, 21],
        [upper, 30, 20, 2],
        [lower, 31, 21, 3],
        [resistor, 30, 31],
        ['out', 1, 2, 3]
    );
}

function assertConnected(graph) {
    const terminals = graph.components.flatMap(part => part.ports).concat(graph.externalPorts);
    for (const node of graph.nodes) {
        const ends = terminals.filter(terminal => terminal.node === node.id);
        assert.equal(ends.length, 2);
        const wires = graph.wires.filter(wire => wire.node === node.id);
        const vertices = new Map();
        for (const wire of wires) {
            assert.equal(wire.points.length, 2);
            const [a, b] = wire.points;
            assert.ok(a[0] === b[0] || a[1] === b[1]);
            assert.notDeepEqual(a, b);
            assert.ok(wire.points.flat().every(value => value % 10 === 0));
            for (const [from, to] of [[a, b], [b, a]]) {
                const key = from.join(',');
                if (!vertices.has(key)) vertices.set(key, []);
                vertices.get(key).push(to.join(','));
            }
        }
        assert.equal(vertices.get(ends[0].at.join(','))?.length, 1);
        assert.equal(vertices.get(ends[1].at.join(','))?.length, 1);
        assert.equal([...vertices.values()].filter(neighbors => neighbors.length === 1).length, 2);
        const visited = new Set(), pending = [ends[0].at.join(',')];
        while (pending.length) {
            const key = pending.pop();
            if (visited.has(key)) continue;
            visited.add(key);
            pending.push(...vertices.get(key));
        }
        assert.equal(visited.size, vertices.size);
        assert.ok(visited.has(ends[1].at.join(',')));
        assert.ok(wires.some(wire => wire.boardTile.kind === 'wire' &&
            (wire.points[0][0] === node.at[0] && node.at[0] === wire.points[1][0] &&
                node.at[1] >= Math.min(wire.points[0][1], wire.points[1][1]) &&
                node.at[1] <= Math.max(wire.points[0][1], wire.points[1][1]) ||
             wire.points[0][1] === node.at[1] && node.at[1] === wire.points[1][1] &&
                node.at[0] >= Math.min(wire.points[0][0], wire.points[1][0]) &&
                node.at[0] <= Math.max(wire.points[0][0], wire.points[1][0]))));
    }
    const componentEnds = graph.components.flatMap(part => part.ports.map(port => port.at.join(',')));
    for (const box of graph.board.boxes.filter(box => box.kind === 'cornerWire')) {
        assert.equal(box.points.length, 3);
        assert.equal(box.nodeDot, undefined);
        assert.ok(box.points.every(point => !componentEnds.includes(point.join(','))));
    }
}

for (const reversed of [false, true]) {
    test(`named board slots bind numbered ports with reordered/reversed entries: ${reversed}`, () => {
        const circuit = divider(reversed);
        const before = circuit._schematic.components.map(entry => entry.nodes.slice());
        const graph = schematicGraph(circuit, {shapes: ['powerDivider']});
        assert.equal(graph.board.interpreter, 'ORI');
        assert.equal(graph.components.length, 5);
        assert.deepEqual(graph.externalPorts.map(port => port.node), [1, 2, 3]);
        assert.deepEqual(graph.components.map(part => part.ports.map(port => port.node)), before);
        assert.deepEqual(circuit._schematic.components.map(entry => entry.nodes), before);
        assertConnected(graph);
        assert.ok(schematicSvg(circuit, {shapes: ['powerDivider']}).startsWith('<svg'));
    });
}

test('the same slot interpreter reads a new board name and position from data', () => {
    const board = JSON.parse(JSON.stringify(schematicShapeBoards.powerDivider));
    board.name = 'translatedSlots';
    board.board.origin = [400, 200];
    schematicShapeBoards.translatedSlots = board;
    try {
        const circuit = divider();
        const base = schematicGraph(circuit, {shapes: ['powerDivider']});
        const shifted = schematicGraph(circuit, {shapes: ['translatedSlots']});
        assert.equal(shifted.board.interpreter, 'ORI');
        assert.deepEqual(shifted.components.map(part => part.ports.map(port => port.at)),
            base.components.map(part => part.ports.map(port => [port.at[0] + 400, port.at[1] + 200])));
        assertConnected(shifted);
    } finally {
        delete schematicShapeBoards.translatedSlots;
    }
});

test('named slots reject a resistor connected to a tee branch instead of its common port', () => {
    const circuit = divider();
    const root = {...circuit._schematic, components: circuit._schematic.components.map(entry =>
        ({...entry, nodes: entry.nodes.slice()}))};
    root.components[2].nodes = [20, 30, 2];
    assert.throws(() => schematicGraph({_schematic: root}, {shapes: ['powerDivider']}), /does not match/);
});

test('the centerline relation aligns the input and center tap with the bridge midpoint on the 10-unit grid', () => {
    for (const reversed of [false, true]) {
        const graph = schematicGraph(divider(reversed), {shapes: ['powerDivider']});
        const resistor = graph.components.find(part => part.symbol === 'resistor');
        const midpoint = (resistor.ports[0].at[1] + resistor.ports[1].at[1]) / 2;
        const tap = graph.components.find(part => part.symbol === 'transformer-auto');
        const input = graph.components.find(part => part.symbol === 'transformer');
        assert.equal(midpoint, 610);
        assert.equal(tap.ports[0].at[1], midpoint);
        assert.ok(input.ports.every(port => port.at[1] === midpoint));
        assert.equal(graph.externalPorts[0].at[1], midpoint);
        assert.equal((graph.externalPorts[1].at[1] + graph.externalPorts[2].at[1]) / 2, midpoint);
        assert.equal(graph.board.grid, 10);
        assert.ok(graph.nodes.every(node => node.at.every(value => value % 10 === 0)));
        assertConnected(graph);
    }
});

test('conflicting centerline relations report an error rather than accepting the last relation', () => {
    const board = JSON.parse(JSON.stringify(schematicShapeBoards.powerDivider));
    board.name = 'conflictingCenterlines';
    board.board.centerlines.push({axis: 'y', reference: {slot: 'upper', port: 'out'},
        align: [{slot: 'input', port: 'in'}]});
    schematicShapeBoards.conflictingCenterlines = board;
    try {
        assert.throws(() => schematicGraph(divider(), {shapes: ['conflictingCenterlines']}),
            /centerline relations conflict/);
    } finally {
        delete schematicShapeBoards.conflictingCenterlines;
    }
});
