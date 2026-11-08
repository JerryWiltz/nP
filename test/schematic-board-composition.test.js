// Modified: 2026-11-07
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph, schematicTopology, schematicSvg} from '../src/np-chart/src/schematic';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';
import {C0} from '../src/np-nport/src/physicalConstants';

function connectedNetwork({transformer = false, microstrip = false, reversed = false,
    extended = false, surrounding = false} = {}) {
    const tee = microstrip ? nP.mtee() : nP.Tee();
    const line = microstrip ? nP.mlin() : nP.Tlin(50 * Math.sqrt(2), C0 / (4 * 2e9));
    const resistor = nP.R(100), rows = [];
    for (const [base, common, upper, lower] of [[0, 1, 40, 41], [100, 2, 40, 41]]) {
        if (transformer) rows.push([nP.trf(Math.sqrt(2)), common, base + 10],
            [nP.trfAuto(), base + 10, base + 20, base + 21]);
        else rows.push([tee, common, base + 10, base + 11],
            [line, base + 10, extended ? base + 12 : base + 20],
            [line, base + 11, base + 21]);
        rows.push([tee, base + 30, base + 20, upper],
            [tee, base + 31, base + 21, lower], [resistor, base + 30, base + 31]);
        if (extended) rows.push([nP.R(5), base + 12, base + 13], [line, base + 13, base + 20]);
    }
    const shapes = [
        {name: 'powerDivider', from: 1, to: [40, 41]},
        {name: 'powerCombiner', from: [40, 41], to: 2}
    ];
    if (surrounding) {
        rows.push([nP.R(5), 90, 1], [tee, 4, 2, 3], [nP.C(1e-12), 4, 5], [nP.Short(), 5]);
        shapes.unshift({name: 'series', from: 90, to: 1});
        shapes.push({name: 'ladder', from: 2, to: 3});
    }
    if (reversed) {
        rows.reverse();
        for (const row of rows) {
            if (row.length === 4) [row[2], row[3]] = [row[3], row[2]];
            else if (row.length === 3) [row[1], row[2]] = [row[2], row[1]];
        }
    }
    return {circuit: nP.nodal(...rows, ['out', ...(surrounding ? [90, 3] : [1, 2])]), shapes};
}

function assertConnected(graph) {
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
            assert.ok(adjacency.has(key), `node ${node.id} misses a terminal`);
            pending.push(...adjacency.get(key));
        }
        assert.equal(visited.size, adjacency.size, `fragmented node ${node.id}`);
        assert.ok(visited.has(ends[1].at.join(',')));
    }
    const cornerBoxes = graph.board.boxes.filter(box => box.kind === 'cornerWire');
    assert.equal(cornerBoxes.length, graph.wires.filter(wire => wire.boardTile.kind === 'cornerWire').length / 2);
    assert.equal(new Set(cornerBoxes.map(box => box.tile.id)).size, cornerBoxes.length);
    assert.ok(cornerBoxes.every(box => box.points.length === 3 && box.nodeDot === undefined));
}

for (const options of [{}, {reversed: true}, {transformer: true}, {transformer: true, reversed: true},
    {microstrip: true}, {microstrip: true, reversed: true, extended: true},
    {extended: true}, {surrounding: true}, {surrounding: true, transformer: true, reversed: true}]) {
    test(`shared composition preserves all occurrences and connections: ${JSON.stringify(options)}`, () => {
        nP.global.fList = [2e9];
        const {circuit, shapes} = connectedNetwork(options);
        const before = JSON.stringify(circuit._schematic), definitions = JSON.stringify(schematicShapeBoards);
        const graph = schematicGraph(circuit, {shapes});
        assert.equal(graph.layout, 'board-composition');
        assert.equal(graph.shape, 'composite');
        assert.equal(graph.board.interpreter, 'ORI');
        assert.equal(graph.components.length, circuit._schematic.components.length);
        assert.equal(new Set(graph.components.map(part => part.id)).size, graph.components.length);
        assert.deepEqual(graph.components.map(part => part.ports.map(port => port.node)),
            circuit._schematic.components.map(entry => entry.nodes));
        assert.ok(graph.components.every(part => !['nodal', 'cascade'].includes(part.symbol)));
        assert.deepEqual(graph.externalPorts.map(port => port.node), circuit._schematic.externalNodes);
        assert.ok(graph.externalPorts[0].at[0] < graph.externalPorts[1].at[0]);
        assert.equal(graph.externalPorts[0].at[1], graph.externalPorts[1].at[1]);
        assert.deepEqual(graph.board.sections.map(section => section.name), shapes.map(section => section.name));
        assert.equal(graph.nodes.filter(node => node.id === 40).length, 1);
        assert.equal(graph.nodes.filter(node => node.id === 41).length, 1);
        assert.equal(graph.externalPorts.some(port => [40, 41].includes(port.node)), false);
        assertConnected(graph);
        assert.equal(JSON.stringify(circuit._schematic), before);
        assert.equal(JSON.stringify(schematicShapeBoards), definitions);
        assert.equal(schematicTopology(circuit, {shapes}).parts.length, graph.components.length);
        assert.match(schematicSvg(circuit, {shapes}), /^<svg/);
    });
}

test('both ideal divider-combiner pairs have unit transmission and matched external ports', () => {
    nP.global.fList = [2e9];
    for (const transformer of [false, true]) {
        const {circuit} = connectedNetwork({transformer});
        const row = circuit.spars[0];
        assert.ok(row[1].mag() < 1e-10);
        assert.ok(row[4].mag() < 1e-10);
        assert.ok(Math.abs(row[2].mag() - 1) < 1e-10);
        assert.ok(Math.abs(row[3].mag() - 1) < 1e-10);
    }
});

test('composition accepts data-only aliases rather than testing RF shape names', () => {
    schematicShapeBoards.leftBoard = {name: 'leftBoard', version: 1, use: 'powerDivider'};
    schematicShapeBoards.rightBoard = {name: 'rightBoard', version: 1, use: 'powerCombiner'};
    try {
        const {circuit, shapes} = connectedNetwork();
        shapes[0].name = 'leftBoard';
        shapes[1].name = 'rightBoard';
        const graph = schematicGraph(circuit, {shapes});
        assert.deepEqual(graph.board.sections.map(section => section.name), ['leftBoard', 'rightBoard']);
        assertConnected(graph);
    } finally {
        delete schematicShapeBoards.leftBoard;
        delete schematicShapeBoards.rightBoard;
    }
});

test('composition rejects incomplete regions, invalid boundary counts and unclaimed parts', () => {
    for (const change of ['missingBoundary', 'wrongCount', 'unclaimedPart', 'wrongOrder', 'wrongNode']) {
        const {circuit, shapes} = connectedNetwork();
        if (change === 'missingBoundary') shapes[0].to = 40;
        if (change === 'wrongCount') shapes[1].from = [40, 41, 30];
        if (change === 'unclaimedPart') circuit._schematic.components.push({part: nP.R(50)._schematic, nodes: [800, 801]});
        if (change === 'wrongOrder') shapes.reverse();
        if (change === 'wrongNode') shapes[0].to = [40, 999];
        assert.throws(() => schematicGraph(circuit, {shapes}), /Schematic board composition/);
    }
});

test('incompatible interface spacing reports an error rather than stretching or dropping parts', () => {
    const {circuit, shapes} = connectedNetwork();
    const resistor = circuit._schematic.components.at(-1);
    resistor.nodes[1] = 132;
    circuit._schematic.components.push({part: nP.R(100)._schematic, nodes: [132, 131]});
    assert.throws(() => schematicGraph(circuit, {shapes}), /matching port spacing and ordering/);
});
