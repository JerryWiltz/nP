// Modified: 2026-11-07
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph, schematicTopology, schematicSvg} from '../src/np-chart/src/schematic';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';

function throughPart(index, mixed, microstrip) {
    if (microstrip) return nP.mlin();
    if (!mixed) return nP.R(50);
    return [nP.R(50), nP.L(5e-9), nP.C(1e-12), nP.Tlin(50, 0.01)][index % 4];
}

function bridgedNetwork({mainCount = 1, bridgeCount = 1, shuntCount = 1,
    microstrip = false, mixed = false, fourPort = false, repeated = false,
    nested = false, reversed = false, termination = 'Short'} = {}) {
    const count = fourPort ? 2 : repeated ? 6 : nested ? 5 : 3;
    const bridges = fourPort ? [[0, 1]] : repeated ? [[0, 2], [3, 5]] : nested ? [[0, 4], [1, 3]] : [[0, 2]];
    const shunts = fourPort ? [0, 1] : repeated ? [1, 4] : nested ? [2] : [1];
    const rows = [];
    let nextNode = 1000;
    for (let i = 0; i < count; i++) {
        const junction = fourPort ? nP.Tee4() : microstrip ? nP.mtee() : nP.Tee();
        rows.push(fourPort ? [junction, 100 + i, i * 10 + 1, 200 + i, i * 10 + 2] :
            [junction, 100 + i, i * 10 + 1, i * 10 + 2]);
        if (i === count - 1) continue;
        let from = i * 10 + 2;
        for (let j = 0; j < mainCount; j++) {
            const to = j === mainCount - 1 ? (i + 1) * 10 + 1 : nextNode++;
            rows.push([throughPart(j, mixed, microstrip), from, to]);
            from = to;
        }
    }
    for (const [a, b] of bridges) {
        let from = (fourPort ? 200 : 100) + a;
        for (let j = 0; j < bridgeCount; j++) {
            const to = j === bridgeCount - 1 ? (fourPort ? 200 : 100) + b : nextNode++;
            rows.push([throughPart(j, mixed, microstrip), from, to]);
            from = to;
        }
    }
    for (const index of shunts) {
        let from = 100 + index;
        for (let j = 0; j < shuntCount; j++) {
            const to = nextNode++;
            rows.push([throughPart(j, mixed, microstrip), from, to]);
            from = to;
        }
        rows.push([microstrip ? nP.mvgnd() : nP[termination](), from]);
    }
    if (reversed) {
        rows.reverse();
        for (const row of rows) {
            if (row.length === 3) [row[1], row[2]] = [row[2], row[1]];
            if (row.length === 4) [row[2], row[3]] = [row[3], row[2]];
            if (row.length === 5) [row[2], row[4]] = [row[4], row[2]];
        }
    }
    return {circuit: nP.nodal(...rows, ['out', 1, (count - 1) * 10 + 2]), bridges, shunts};
}

function assertConnections(graph) {
    const terminals = graph.components.flatMap(part => part.ports).concat(graph.externalPorts);
    for (const node of graph.nodes) {
        const ends = terminals.filter(port => port.node === node.id);
        assert.equal(ends.length, 2);
        const adjacency = new Map();
        for (const wire of graph.wires.filter(wire => wire.node === node.id)) {
            const [a, b] = wire.points;
            assert.ok(a[0] === b[0] || a[1] === b[1]);
            assert.notDeepEqual(a, b);
            assert.ok(wire.points.flat().every(value => value % 10 === 0));
            for (const [from, to] of [[a, b], [b, a]]) {
                if (!adjacency.has(from.join(','))) adjacency.set(from.join(','), []);
                adjacency.get(from.join(',')).push(to.join(','));
            }
        }
        const visited = new Set(), pending = [ends[0].at.join(',')];
        while (pending.length) {
            const key = pending.pop();
            if (visited.has(key)) continue;
            visited.add(key);
            assert.ok(adjacency.has(key), `unconnected terminal at node ${node.id}`);
            pending.push(...adjacency.get(key));
        }
        assert.equal(visited.size, adjacency.size, `disconnected fragment at node ${node.id}`);
        assert.ok(visited.has(ends[1].at.join(',')));
    }
    const terminalPoints = terminals.map(port => port.at.join(','));
    for (const box of graph.board.boxes.filter(box => box.kind === 'cornerWire')) {
        assert.equal(box.nodeDot, undefined);
        assert.equal(box.points.length, 3);
        assert.ok(box.points.every(point => !terminalPoints.includes(point.join(','))));
    }
}

for (const options of [{}, {reversed: true}, {mainCount: 3, bridgeCount: 4, shuntCount: 3, mixed: true},
    {bridgeCount: 13}, {fourPort: true}, {fourPort: true, reversed: true, mixed: true},
    {repeated: true}, {nested: true, reversed: true}, {microstrip: true},
    {microstrip: true, bridgeCount: 3, shuntCount: 2, reversed: true}, {termination: 'Open'}, {termination: 'Load'}]) {
    test(`bridgedT preserves variable paths and junction ports: ${JSON.stringify(options)}`, () => {
        nP.global.fList = [2e9];
        const {circuit, bridges} = bridgedNetwork(options);
        const before = JSON.stringify(circuit._schematic), definitions = JSON.stringify(schematicShapeBoards);
        const graph = schematicGraph(circuit, {shapes: ['bridgedT']});
        assert.equal(graph.shape, 'bridgedT');
        assert.equal(graph.board.interpreter, 'ORI');
        assert.equal(graph.components.length, circuit._schematic.components.length);
        assert.equal(new Set(graph.components.map(part => part.id)).size, graph.components.length);
        const drawn = graph.components.map(part => JSON.stringify(part.ports.map(port => port.node))).sort();
        assert.deepEqual(drawn, circuit._schematic.components.map(entry => JSON.stringify(entry.nodes)).sort());
        const main = graph.components.filter(part => part.boardTile.role === 'mainPart');
        const upper = graph.components.filter(part => part.boardTile.role === 'bridgePart');
        const lower = graph.components.filter(part => part.boardTile.role === 'shuntPart');
        assert.ok(upper.every(part => part.ports.every(port => port.at[1] < graph.externalPorts[0].at[1])));
        assert.ok(lower.every(part => part.ports.every(port => port.at[1] > graph.externalPorts[0].at[1])));
        assert.ok(main.every(part => part.ports.filter(port =>
            circuit._schematic.externalNodes.includes(port.node)).every(port => port.at[1] === graph.externalPorts[0].at[1])));
        assert.equal(upper.length, bridges.length * (options.bridgeCount || 1));
        assert.equal(schematicTopology(circuit, {shapes: ['bridgedT']}).loopAnalysis.cycles.length, bridges.length);
        assertConnections(graph);
        assert.equal(JSON.stringify(circuit._schematic), before);
        assert.equal(JSON.stringify(schematicShapeBoards), definitions);
        assert.match(schematicSvg(circuit, {shapes: ['bridgedT']}), /^<svg/);
    });
}

test('connection spacing grows the main path for a long bridge and nests enclosing intervals outside', () => {
    const short = schematicGraph(bridgedNetwork().circuit, {shapes: ['bridgedT']});
    const long = schematicGraph(bridgedNetwork({bridgeCount: 13}).circuit, {shapes: ['bridgedT']});
    assert.ok(long.externalPorts[1].at[0] > short.externalPorts[1].at[0]);
    const nested = schematicGraph(bridgedNetwork({nested: true}).circuit, {shapes: ['bridgedT']});
    const upper = nested.components.filter(part => part.boardTile.role === 'bridgePart');
    const outer = upper.find(part => part.ports.some(port => port.node === 100));
    const inner = upper.find(part => part.ports.some(port => port.node === 101));
    assert.ok(outer.ports[0].at[1] < inner.ports[0].at[1]);
    assert.equal(nested.crossings.length, 0);
    const repeated = schematicGraph(bridgedNetwork({repeated: true}).circuit, {shapes: ['bridgedT']});
    assert.equal(new Set(repeated.components.filter(part => part.boardTile.role === 'bridgePart')
        .map(part => part.ports[0].at[1])).size, 1);
});

test('data alone can put rejoining connections below and terminal attachments above', () => {
    const definition = structuredClone(schematicShapeBoards.bridgedT);
    definition.name = 'underpassExample';
    definition.board.connections[0].direction = 'down';
    definition.board.attachments[0].direction = 'up';
    schematicShapeBoards.underpassExample = definition;
    try {
        const graph = schematicGraph(bridgedNetwork().circuit, {shapes: ['underpassExample']});
        assert.ok(graph.components.filter(part => part.boardTile.role === 'bridgePart')
            .every(part => part.ports[0].at[1] > graph.externalPorts[0].at[1]));
        assert.ok(graph.components.filter(part => part.boardTile.role === 'shuntPart')
            .every(part => part.ports[0].at[1] < graph.externalPorts[0].at[1]));
        assertConnections(graph);
    } finally {
        delete schematicShapeBoards.underpassExample;
    }
});

test('an upstream two-port network stays a block and the guided board composes with another section', () => {
    const tee = nP.Tee(), r = nP.R(50);
    const bridge = nP.cascade(nP.R(100), nP.L(5e-9));
    const circuit = nP.nodal(
        [r, 1, 9],
        [tee, 100, 9, 10],
        [r, 10, 11],
        [tee, 101, 11, 12],
        [r, 12, 13],
        [tee, 102, 13, 2],
        [bridge, 100, 102],
        [r, 101, 103],
        [nP.Short(), 103],
        ['out', 1, 2]
    );
    const graph = schematicGraph(circuit, {shapes: [
        {name: 'series', from: 1, to: 9},
        {name: 'bridgedT', from: 9, to: 2}
    ]});
    assert.equal(graph.components.length, 9);
    assert.equal(graph.components.filter(part => part.symbol === 'cascade').length, 1);
    assert.deepEqual(graph.board.sections.map(section => section.name), ['series', 'bridgedT']);
    assertConnections(graph);
});

test('unaccounted parts, absent bridges and wrong four-port pin directions are rejected', () => {
    for (const change of ['extra', 'bridge', 'pins']) {
        const {circuit} = bridgedNetwork({fourPort: change === 'pins'});
        if (change === 'extra') circuit._schematic.components.push({part: nP.R(50)._schematic, nodes: [900, 901]});
        if (change === 'bridge') circuit._schematic.components = circuit._schematic.components.filter(entry =>
            !entry.nodes.includes(100) || !entry.nodes.includes(102));
        if (change === 'pins') {
            const nodes = circuit._schematic.components[0].nodes;
            [nodes[1], nodes[2]] = [nodes[2], nodes[1]];
        }
        assert.throws(() => schematicGraph(circuit, {shapes: ['bridgedT']}), /does not match/);
    }
});
