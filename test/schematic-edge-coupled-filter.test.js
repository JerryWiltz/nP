// Modified: 2026-11-07
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph, schematicTopology, schematicSvg} from '../src/np-chart/src/schematic';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';
import {schematicSymbols} from '../src/np-chart/src/schematicSymbols';

function filterNetwork(count = 3, {microstrip = false, mixed = false, reversed = false,
    termination = 'Open', surrounding = false} = {}) {
    const rows = [];
    for (let i = 0; i < count; i++) {
        const base = i * 3;
        const section = microstrip || mixed && i % 2 ? nP.mclin() : nP.Tclin(100, 30, 0.01);
        rows.push([section, base + 1, base + 2, base + 4, base + 3],
            [nP[termination](), base + 2], [nP[termination](), base + 3]);
    }
    if (reversed) {
        rows.reverse();
        for (const row of rows) if (row.length === 5) {
            // A physical half-turn, not arbitrary renumbering of electrical pins.
            [row[1], row[3]] = [row[3], row[1]];
            [row[2], row[4]] = [row[4], row[2]];
        }
    }
    const last = count * 3 + 1;
    if (surrounding) rows.push([nP.R(5), 900, 1], [nP.L(5e-9), last, 901]);
    return nP.nodal(...rows, ['out', ...(surrounding ? [900, 901] : [1, last])]);
}

function pointTransform(point, part, symbol) {
    const source = symbol.ports[part.sourcePort - 1], angle = part.rotation * Math.PI / 180;
    const x = (point[0] - source[0]) * (part.mirrorX ? -1 : 1);
    const y = (point[1] - source[1]) * (part.mirrorY ? -1 : 1);
    return [part.at[0] + Math.round(x * Math.cos(angle) - y * Math.sin(angle)),
        part.at[1] + Math.round(x * Math.sin(angle) + y * Math.cos(angle))];
}

function assertDrawing(graph) {
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
    const fixed = graph.wires.map(wire => {
        const [a, b] = wire.points;
        return [Math.min(a[0], b[0]) - 4, Math.min(a[1], b[1]) - 4,
            Math.max(a[0], b[0]) + 4, Math.max(a[1], b[1]) + 4];
    });
    for (const part of graph.components) {
        const symbol = schematicSymbols[part.symbol];
        assert.equal(part.rotation % 90, 0);
        assert.deepEqual(part.ports.map(port => port.at), symbol.ports.map(point => pointTransform(point, part, symbol)));
        const [x1, y1, x2, y2] = symbol.bodyBounds;
        const points = [[x1, y1], [x1, y2], [x2, y1], [x2, y2]].map(point => pointTransform(point, part, symbol));
        fixed.push([Math.min(...points.map(point => point[0])), Math.min(...points.map(point => point[1])),
            Math.max(...points.map(point => point[0])), Math.max(...points.map(point => point[1]))]);
    }
    const annotations = graph.nodes.map(node => [node.numberAt[0] - 12, node.numberAt[1] - 12,
        node.numberAt[0] + 12, node.numberAt[1] + 12]).concat(graph.labels.map(label => {
        const half = Math.ceil(label.text.length * 9 / 2);
        return [label.at[0] - half, label.at[1] - 16, label.at[0] + half, label.at[1] + 4];
    }));
    for (const box of annotations) {
        assert.ok(fixed.every(other => box[2] <= other[0] || box[0] >= other[2] ||
            box[3] <= other[1] || box[1] >= other[3]), 'annotation collision');
        fixed.push(box);
        assert.ok(box[0] >= graph.viewBox[0] && box[1] >= graph.viewBox[1]);
        assert.ok(box[2] <= graph.viewBox[0] + graph.viewBox[2] && box[3] <= graph.viewBox[1] + graph.viewBox[3]);
    }
}

for (const [count, options] of [[1, {}], [2, {}], [3, {}], [7, {}], [13, {}],
    [3, {reversed: true}], [3, {microstrip: true}], [4, {mixed: true, reversed: true}],
    [2, {termination: 'Short'}], [2, {termination: 'Load'}]]) {
    test(`edgeCoupledFilter follows variable section counts and real terminals: ${count} ${JSON.stringify(options)}`, () => {
        nP.global.fList = [2e9];
        const circuit = filterNetwork(count, options);
        const before = JSON.stringify(circuit._schematic), definition = JSON.stringify(schematicShapeBoards);
        for (const flipVertical of [false, true]) {
            const graph = schematicGraph(circuit, {shapes: ['edgeCoupledFilter'], flipVertical});
            assert.equal(graph.shape, 'edgeCoupledFilter');
            assert.equal(graph.board.interpreter, 'ORI');
            assert.equal(graph.components.length, count * 3);
            assert.deepEqual(graph.externalPorts.map(port => port.node), circuit._schematic.externalNodes);
            const sections = graph.components.filter(part => part.boardTile.role === 'section');
            assert.equal(sections.length, count);
            for (let i = 0; i < count - 1; i++) {
                assert.ok(sections[i + 1].at[0] > sections[i].at[0]);
                assert.ok((sections[i + 1].at[1] - sections[i].at[1]) * (flipVertical ? -1 : 1) > 0);
            }
            assert.ok((graph.externalPorts[1].at[1] - graph.externalPorts[0].at[1]) * (flipVertical ? -1 : 1) > 0);
            assertDrawing(graph);
        }
        assert.equal(JSON.stringify(circuit._schematic), before);
        assert.equal(JSON.stringify(schematicShapeBoards), definition);
    });
}

test('flipVertical reflects geometry and preserves topology while reflowing readable labels', () => {
    const circuit = filterNetwork();
    const base = schematicGraph(circuit, {shapes: ['edgeCoupledFilter']});
    const flipped = schematicGraph(circuit, {shapes: ['edgeCoupledFilter'], flipVertical: true});
    assert.deepEqual(flipped.components.map(part => part.ports.map(port => port.at)),
        base.components.map(part => part.ports.map(port => [port.at[0], -port.at[1]])));
    assert.deepEqual(flipped.wires.map(wire => wire.points), base.wires.map(wire =>
        wire.points.map(point => [point[0], -point[1]])));
    assert.deepEqual(schematicTopology(circuit, {shapes: ['edgeCoupledFilter'], flipVertical: true}),
        schematicTopology(circuit, {shapes: ['edgeCoupledFilter']}));
    assert.match(schematicSvg(circuit, {shapes: ['edgeCoupledFilter'], flipVertical: true}), /^<svg/);
});

test('the numbered-port and lead-direction operations also accept data-only board names and upward advance', () => {
    const definition = structuredClone(schematicShapeBoards.edgeCoupledFilter);
    definition.name = 'upwardMultiportPath';
    definition.board.tiles[1].orientation.advance = 'up';
    schematicShapeBoards.upwardMultiportPath = definition;
    try {
        const graph = schematicGraph(filterNetwork(), {shapes: ['upwardMultiportPath']});
        assert.equal(graph.shape, 'upwardMultiportPath');
        assert.ok(graph.externalPorts[1].at[1] < graph.externalPorts[0].at[1]);
        assertDrawing(graph);
    } finally {
        delete schematicShapeBoards.upwardMultiportPath;
    }
});

test('the board composes with series sections and the whole composition can be vertically flipped', () => {
    const circuit = filterNetwork(3, {surrounding: true});
    const shapes = [{name: 'series', from: 900, to: 1},
        {name: 'edgeCoupledFilter', from: 1, to: 10}, {name: 'series', from: 10, to: 901}];
    for (const flipVertical of [false, true]) {
        const graph = schematicGraph(circuit, {shapes, flipVertical});
        assert.equal(graph.components.length, 11);
        assert.equal(graph.externalPorts.length, 2);
        assert.equal(graph.board.sections.length, 3);
        assertDrawing(graph);
    }
});

test('mismatched pins, omitted terminations, unaccounted parts and invalid options report errors', () => {
    for (const change of ['pins', 'termination', 'extra']) {
        const circuit = filterNetwork();
        if (change === 'pins') [circuit._schematic.components[0].nodes[1], circuit._schematic.components[0].nodes[2]] =
            [circuit._schematic.components[0].nodes[2], circuit._schematic.components[0].nodes[1]];
        if (change === 'termination') circuit._schematic.components.pop();
        if (change === 'extra') circuit._schematic.components.push({part: nP.R(50)._schematic, nodes: [700, 701]});
        assert.throws(() => schematicGraph(circuit, {shapes: ['edgeCoupledFilter']}), /does not match/);
    }
    assert.throws(() => schematicGraph(filterNetwork(), {shapes: ['edgeCoupledFilter'], flipVertical: 'yes'}), /must be boolean/);
    assert.throws(() => schematicGraph(nP.R(50), {flipVertical: true}), /requires an ORI/);
});
