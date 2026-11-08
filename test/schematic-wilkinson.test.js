// Modified: 2026-11-06
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {C0} from '../src/np-nport/src/physicalConstants';
import {schematicGraph, schematicTopology} from '../src/np-chart/src/schematic';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';

function divider({microstrip = false, reversed = false, extended = false} = {}) {
    const tee = microstrip ? nP.mtee() : nP.Tee();
    const line = microstrip ? nP.mlin() : nP.Tlin(50 * Math.sqrt(2), C0 / (4 * 2e9));
    const rows = [
        [tee, 1, 10, 11],
        [line, 10, extended ? 12 : 20],
        [line, 11, 21],
        [tee, 30, 20, 2],
        [tee, 31, 21, 3],
        [nP.R(100), 30, 31]
    ];
    if (extended) rows.push([nP.R(5), 12, 13], [nP.L(5e-9), 13, 14], [line, 14, 20]);
    if (reversed) {
        rows.reverse();
        for (const row of rows) {
            // Swap only the tee through ports; common/shunt remains port 1.
            if (row.length === 4) [row[2], row[3]] = [row[3], row[2]];
            else [row[1], row[2]] = [row[2], row[1]];
        }
    }
    return nP.nodal(...rows, ['out', 1, 2, 3]);
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
            assert.ok(adjacency.has(key), `unconnected node ${node.id}`);
            pending.push(...adjacency.get(key));
        }
        assert.equal(visited.size, adjacency.size, `disconnected fragments at node ${node.id}`);
        assert.ok(visited.has(ends[1].at.join(',')));
    }
    const componentEnds = graph.components.flatMap(part => part.ports.map(port => port.at.join(',')));
    for (const box of graph.board.boxes.filter(box => box.kind === 'cornerWire')) {
        assert.equal(box.nodeDot, undefined);
        assert.ok(box.points.every(point => !componentEnds.includes(point.join(','))));
    }
}

for (const options of [{}, {reversed: true}, {microstrip: true}, {extended: true},
    {microstrip: true, extended: true, reversed: true}]) {
    test(`powerDivider binds variable arm paths and numbered tee ports: ${JSON.stringify(options)}`, () => {
        nP.global.fList = [2e9];
        const circuit = divider(options);
        const before = circuit._schematic.components.map(entry => entry.nodes.slice());
        const graph = schematicGraph(circuit, {shapes: ['powerDivider']});
        assert.equal(graph.pattern, 'wilkinson');
        assert.equal(graph.layout, 'wilkinson-power-divider');
        assert.equal(graph.board.interpreter, 'ORI');
        assert.deepEqual(graph.components.map(part => part.ports.map(port => port.node)), before);
        assert.deepEqual(circuit._schematic.components.map(entry => entry.nodes), before);
        assert.deepEqual(graph.externalPorts.map(port => port.node), [1, 2, 3]);
        const [input, upper, lower] = graph.externalPorts;
        assert.equal(input.at[1], (upper.at[1] + lower.at[1]) / 2);
        assert.equal(upper.at[0], lower.at[0]);
        assert.ok(input.at[0] < upper.at[0]);
        const junctions = graph.components.filter(part => part.ports.length === 3);
        for (const junction of junctions) {
            const common = junction.ports[0];
            if (common.node === 1) assert.ok(common.at[0] < junction.ports[1].at[0]);
            else {
                const resistorEnd = graph.components.find(part => part.boardTile.role === 'isolationPart')
                    .ports.find(port => port.node === common.node);
                assert.equal(common.at[0], resistorEnd.at[0]);
            }
        }
        assert.equal(schematicTopology(circuit, {shapes: ['powerDivider']}).loopAnalysis.cycles.length, 1);
        assertConnections(graph);
    });
}

test('the ideal example is an electrically matched equal Wilkinson divider at its design frequency', () => {
    nP.global.fList = [2e9];
    const row = divider().spars[0];
    // S entries are row-major, after the frequency column.
    for (const index of [1, 5, 9, 6, 8]) assert.ok(row[index].mag() < 1e-10);
    for (const index of [2, 3, 4, 7]) assert.ok(Math.abs(row[index].mag() - Math.SQRT1_2) < 1e-10);
});

test('a renamed and translated named-anchor board uses the same shared interpreter', () => {
    const definition = structuredClone(schematicShapeBoards.powerDivider.alternatives[0]);
    definition.name = 'namedAnchorExample';
    definition.board.origin = [580, 400];
    schematicShapeBoards.namedAnchorExample = definition;
    try {
        const circuit = divider();
        const base = schematicGraph(circuit, {shapes: ['powerDivider']});
        const shifted = schematicGraph(circuit, {shapes: ['namedAnchorExample']});
        assert.equal(shifted.shape, 'namedAnchorExample');
        assert.deepEqual(shifted.components.map(part => part.ports.map(port => port.at)),
            base.components.map(part => part.ports.map(port => [port.at[0] + 400, port.at[1] + 200])));
        assertConnections(shifted);
    } finally {
        delete schematicShapeBoards.namedAnchorExample;
    }
});

test('powerDivider rejects a miswired common pin and an extra unaccounted component', () => {
    for (const change of ['common', 'extra']) {
        const circuit = divider();
        if (change === 'common') {
            [circuit._schematic.components[3].nodes[0], circuit._schematic.components[3].nodes[1]] =
                [circuit._schematic.components[3].nodes[1], circuit._schematic.components[3].nodes[0]];
        } else circuit._schematic.components.push({part: nP.R(50)._schematic, nodes: [200, 201]});
        assert.throws(() => schematicGraph(circuit, {shapes: ['powerDivider']}), /does not match/);
    }
});

test('the named-junction and turning-lane operations also interpret a quarter-turned board from data', () => {
    const definition = structuredClone(schematicShapeBoards.powerDivider.alternatives[0]);
    definition.name = 'quarterTurnedBoard';
    const directions = {right: 'down', down: 'left', left: 'up', up: 'right'};
    for (const slot of definition.board.anchors) slot.cell = [-slot.cell[1], slot.cell[0]];
    for (const lane of definition.board.lanes) {
        lane.direction = directions[lane.direction];
        if (lane.fromSide) lane.fromSide = directions[lane.fromSide];
        if (lane.route) lane.route = 'horizontalFirst';
    }
    for (const port of definition.board.externalPorts) port.side = directions[port.side];
    schematicShapeBoards.quarterTurnedBoard = definition;
    try {
        const graph = schematicGraph(divider(), {shapes: ['quarterTurnedBoard']});
        const [input, upper, lower] = graph.externalPorts;
        assert.equal(input.at[0], (upper.at[0] + lower.at[0]) / 2);
        assert.equal(upper.at[1], lower.at[1]);
        assert.ok(input.at[1] < upper.at[1]);
        assertConnections(graph);
    } finally {
        delete schematicShapeBoards.quarterTurnedBoard;
    }
});
