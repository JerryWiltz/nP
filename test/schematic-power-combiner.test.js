// Modified: 2026-11-07
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph, schematicSvg, schematicTopology} from '../src/np-chart/src/schematic';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';
import {schematicSymbols} from '../src/np-chart/src/schematicSymbols';
import {C0} from '../src/np-nport/src/physicalConstants';

function combiner({transformer = false, microstrip = false, reversed = false, extended = false} = {}) {
    const tee = microstrip ? nP.mtee() : nP.Tee();
    const line = microstrip ? nP.mlin() : nP.Tlin(50 * Math.sqrt(2), C0 / (4 * 2e9));
    const rows = transformer ? [
        [nP.trf(Math.sqrt(2)), 1, 10],
        [nP.trfAuto(), 10, 20, 21]
    ] : [
        [tee, 1, 10, 11],
        [line, 10, extended ? 12 : 20],
        [line, 11, 21]
    ];
    rows.push([tee, 30, 20, 2], [tee, 31, 21, 3], [nP.R(100), 30, 31]);
    if (extended) rows.push([nP.R(5), 12, 13], [nP.L(5e-9), 13, 20]);
    if (reversed) {
        rows.reverse();
        for (const row of rows) {
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
            assert.ok(adjacency.has(key), `unconnected terminal at node ${node.id}`);
            pending.push(...adjacency.get(key));
        }
        assert.equal(visited.size, adjacency.size, `disconnected fragment at node ${node.id}`);
        assert.ok(visited.has(ends[1].at.join(',')));
    }
    for (const part of graph.components) {
        // Independently reconstruct the rendered canonical transform. Checking
        // only reflected port arrays could hide symbol artwork left unreflected.
        const symbol = schematicSymbols[part.symbol], source = symbol.ports[part.sourcePort - 1];
        const radians = part.rotation * Math.PI / 180;
        symbol.ports.forEach((point, index) => {
            const x = (point[0] - source[0]) * (part.mirrorX ? -1 : 1);
            const y = (point[1] - source[1]) * (part.mirrorY ? -1 : 1);
            const expected = [part.at[0] + Math.round(x * Math.cos(radians) - y * Math.sin(radians)),
                part.at[1] + Math.round(x * Math.sin(radians) + y * Math.cos(radians))];
            assert.deepEqual(part.ports[index].at, expected);
        });
    }
    const componentEnds = graph.components.flatMap(part => part.ports.map(port => port.at.join(',')));
    for (const box of graph.board.boxes.filter(box => box.kind === 'cornerWire')) {
        assert.equal(box.nodeDot, undefined);
        assert.ok(box.points.every(point => !componentEnds.includes(point.join(','))));
    }
}

for (const options of [{transformer: true}, {transformer: true, reversed: true}, {},
    {reversed: true}, {microstrip: true}, {extended: true},
    {microstrip: true, extended: true, reversed: true}]) {
    test(`powerCombiner reflects a complete divider without changing numbered connections: ${JSON.stringify(options)}`, () => {
        nP.global.fList = [2e9];
        const circuit = combiner(options);
        const before = JSON.stringify(circuit._schematic);
        const definitions = JSON.stringify(schematicShapeBoards);
        const divider = schematicGraph(circuit, {shapes: ['powerDivider']});
        const graph = schematicGraph(circuit, {shapes: ['powerCombiner']});
        assert.equal(graph.shape, 'powerCombiner');
        assert.equal(graph.layout, 'powerCombiner');
        assert.equal(graph.pattern, options.transformer ? 'transformer' : 'wilkinson');
        assert.equal(graph.board.interpreter, 'ORI');
        assert.deepEqual(graph.components.map(part => part.ports.map(port => port.node)),
            circuit._schematic.components.map(entry => entry.nodes));
        assert.deepEqual(graph.components.map(part => part.ports.map(port => port.at)),
            divider.components.map(part => part.ports.map(port => [-port.at[0], port.at[1]])));
        assert.deepEqual(graph.wires.map(wire => wire.points),
            divider.wires.map(wire => wire.points.map(point => [-point[0], point[1]])));
        const [output, upperInput, lowerInput] = graph.externalPorts;
        assert.deepEqual(graph.externalPorts.map(port => port.node), [1, 2, 3]);
        assert.equal(upperInput.at[0], lowerInput.at[0]);
        assert.ok(output.at[0] > upperInput.at[0]);
        assert.equal(output.at[1], (upperInput.at[1] + lowerInput.at[1]) / 2);
        assertConnections(graph);
        assert.equal(JSON.stringify(circuit._schematic), before);
        assert.equal(JSON.stringify(schematicShapeBoards), definitions);
        assert.deepEqual(schematicTopology(circuit, {shapes: ['powerCombiner']}),
            schematicTopology(circuit, {shapes: ['powerDivider']}));
        assert.match(schematicSvg(circuit, {shapes: ['powerCombiner']}), /^<svg/);
    });
}

test('both ideal combiner examples retain matching, isolation and reciprocal 3 dB paths', () => {
    nP.global.fList = [2e9];
    for (const transformer of [false, true]) {
        const row = combiner({transformer}).spars[0];
        for (const index of [1, 5, 9, 6, 8]) assert.ok(row[index].mag() < 1e-10);
        for (const index of [2, 3, 4, 7]) assert.ok(Math.abs(row[index].mag() - Math.SQRT1_2) < 1e-10);
    }
});

test('references and reflections apply to other boards and can compose without shape-specific code', () => {
    schematicShapeBoards.mirroredSeries = {name: 'mirroredSeries', version: 1, use: 'series',
        transform: {mirrorX: true, mirrorY: true}};
    schematicShapeBoards.restoredSeries = {name: 'restoredSeries', version: 1, use: 'mirroredSeries',
        transform: {mirrorX: true, mirrorY: true}};
    try {
        const circuit = nP.nodal([nP.R(50), 45, 37], [nP.mbend(), 37, 1], ['out', 45, 1]);
        const base = schematicGraph(circuit, {shapes: ['series']});
        for (const name of ['mirroredSeries', 'restoredSeries']) {
            const graph = schematicGraph(circuit, {shapes: [name]});
            const sign = name === 'mirroredSeries' ? -1 : 1;
            assert.deepEqual(graph.components.map(part => part.ports.map(port => port.at)),
                base.components.map(part => part.ports.map(port => port.at.map(value => sign * value))));
            assertConnections(graph);
        }
    } finally {
        delete schematicShapeBoards.mirroredSeries;
        delete schematicShapeBoards.restoredSeries;
    }
});

test('invalid references, cycles and transforms fail clearly', () => {
    const circuit = combiner();
    for (const [definition, message] of [
        [{use: 'missingBoard'}, /unknown referenced board/],
        [{use: 'badReference'}, /circular board reference/],
        [{use: 'powerDivider', transform: {mirrorX: 'yes'}}, /boolean mirrorX and mirrorY/],
        [{use: 'powerDivider', transform: {rotation: 45}}, /boolean mirrorX and mirrorY/]
    ]) {
        schematicShapeBoards.badReference = {name: 'badReference', version: 1, ...definition};
        try {
            assert.throws(() => schematicGraph(circuit, {shapes: ['badReference']}), message);
        } finally {
            delete schematicShapeBoards.badReference;
        }
    }
});

test('a combiner request still rejects miswired or unaccounted components', () => {
    for (const extra of [false, true]) {
        const circuit = combiner();
        if (extra) circuit._schematic.components.push({part: nP.R(50)._schematic, nodes: [90, 91]});
        else [circuit._schematic.components[3].nodes[0], circuit._schematic.components[3].nodes[1]] =
            [circuit._schematic.components[3].nodes[1], circuit._schematic.components[3].nodes[0]];
        assert.throws(() => schematicGraph(circuit, {shapes: ['powerCombiner']}), /does not match/);
    }
});
