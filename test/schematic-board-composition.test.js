// Modified: 2026-11-08
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
    for (const change of ['missingBoundary', 'wrongCount', 'unclaimedPart', 'wrongNode']) {
        const {circuit, shapes} = connectedNetwork();
        if (change === 'missingBoundary') shapes[0].to = 40;
        if (change === 'wrongCount') shapes[1].from = [40, 41, 30];
        if (change === 'unclaimedPart') circuit._schematic.components.push({part: nP.R(50)._schematic, nodes: [800, 801]});
        if (change === 'wrongNode') shapes[0].to = [40, 999];
        assert.throws(() => schematicGraph(circuit, {shapes}), /Schematic board composition/);
    }
});

test('composition routes unequal interface spacing without stretching or dropping parts', () => {
    const {circuit, shapes} = connectedNetwork();
    const resistor = circuit._schematic.components.at(-1);
    resistor.nodes[1] = 132;
    circuit._schematic.components.push({part: nP.R(100)._schematic, nodes: [132, 131]});
    assertConnected(schematicGraph(circuit, {shapes}));
});

function parallelNetwork({nested = false, separate = false, amplifier = false, ladder = false} = {}) {
    const tee = nP.Tee(), resistor = nP.R(50), rows = [[tee, 1, 10, 20]];
    const shapes = [];
    if (nested) {
        rows.push([tee, 10, 11, 12], [resistor, 11, 30], [resistor, 12, 40]);
        shapes.push({name: 'series', from: 11, to: 30}, {name: 'series', from: 12, to: 40});
    } else {
        rows.push([amplifier ? nP.Amp() : resistor, 10, 30]);
        shapes.push({name: 'series', from: 10, to: 30});
    }
    if (ladder) {
        rows.push([tee, 22, 20, 23], [resistor, 22, 24], [nP.Short(), 24], [resistor, 23, 50]);
        shapes.push({name: 'ladder', from: 20, to: 50});
    } else {
        rows.push([resistor, 20, 50]);
        shapes.push({name: 'series', from: 20, to: 50});
    }
    if (!separate) rows.push(nested ? [nP.Tee4(), 2, 30, 40, 50] : [tee, 2, 30, 50]);
    const outputs = separate ? (nested ? [1, 30, 40, 50] : [1, 30, 50]) : [1, 2];
    return {circuit: nP.nodal(...rows, ['out', ...outputs]), shapes};
}

for (const options of [{}, {ladder: true}, {amplifier: true}, {nested: true},
    {nested: true, ladder: true}, {separate: true}, {nested: true, separate: true}]) {
    test(`parallel and nested composition uses actual node and port identities: ${JSON.stringify(options)}`, () => {
        const {circuit, shapes} = parallelNetwork(options);
        const before = JSON.stringify(circuit._schematic);
        const graph = schematicGraph(circuit, {shapes});
        assertConnected(graph);
        assert.equal(graph.components.length, circuit._schematic.components.length);
        assert.deepEqual(graph.components.map(part => part.ports.map(port => port.node)),
            circuit._schematic.components.map(entry => entry.nodes));
        assert.deepEqual(graph.externalPorts.map(port => port.node), circuit._schematic.externalNodes);
        assert.deepEqual(graph.crossings, []);
        assert.equal(JSON.stringify(circuit._schematic), before);
        const shuffled = schematicGraph(circuit, {shapes: shapes.slice().reverse()});
        assertConnected(shuffled);
        assert.deepEqual(shuffled.components.map(part => part.ports), graph.components.map(part => part.ports));
    });
}

for (const count of [3, 4]) {
    test(`a direct junction can split into ${count} separately guided tracks`, () => {
        const r1 = nP.R(50), tee = count === 3 ? nP.Tee4() : nP.Tee5();
        const inputs = Array.from({length: count}, (_, index) => 10 + index);
        const outputs = inputs.map(node => node + 20);
        const circuit = nP.nodal([tee, 1, ...inputs],
            ...inputs.map((node, index) => [r1, node, outputs[index]]),
            [tee, 2, ...outputs], ['out', 1, 2]);
        const shapes = inputs.map((node, index) => ({name: 'series', from: node, to: outputs[index]}));
        const graph = schematicGraph(circuit, {shapes});
        assertConnected(graph);
        assert.deepEqual(graph.crossings, []);
    });
}

test('measured divider and combiner boards accommodate independently shaped amplifier paths', () => {
    const {circuit, shapes} = connectedNetwork();
    const rows = circuit._schematic.components;
    for (const row of rows.slice(6)) row.nodes = row.nodes.map(node => node === 40 ? 70 : node === 41 ? 71 : node);
    rows.push({part: nP.Amp()._schematic, nodes: [40, 70]},
        {part: nP.Amp(10)._schematic, nodes: [41, 71]});
    shapes[1].from = [70, 71];
    shapes.splice(1, 0, {name: 'series', from: 40, to: 70}, {name: 'series', from: 41, to: 71});
    const graph = schematicGraph(circuit, {shapes});
    assertConnected(graph);
    assert.equal(graph.components.filter(part => part.symbol === 'amplifier').length, 2);
    assert.deepEqual(graph.crossings, []);
});

test('nested paths can rejoin before joining the remaining outer track', () => {
    const tee = nP.Tee(), r1 = nP.R(50);
    const circuit = nP.nodal([tee, 1, 10, 20], [tee, 10, 11, 12],
        [r1, 11, 30], [r1, 12, 40], [tee, 60, 30, 40], [r1, 60, 70],
        [r1, 20, 50], [tee, 2, 70, 50], ['out', 1, 2]);
    const shapes = [{name: 'series', from: 11, to: 30}, {name: 'series', from: 12, to: 40},
        {name: 'series', from: 60, to: 70}, {name: 'series', from: 20, to: 50}];
    const graph = schematicGraph(circuit, {shapes});
    assertConnected(graph);
    assert.deepEqual(graph.crossings, []);
});

test('a downward shunt reserves clearance below its track without raising the main path', () => {
    const {circuit, shapes} = parallelNetwork({ladder: true});
    const graph = schematicGraph(circuit, {shapes});
    const inputJunction = graph.components[0], outputJunction = graph.components.at(-1);
    const ladderJunction = graph.components.find(part => part.ports.some(port => port.node === 22));
    const axis = ladderJunction.ports.find(port => port.node === 20).at[1];
    // Both boundary nets should turn down from their junction, then run flat
    // along the ladder's actual through axis, without an upward step into it.
    for (const [node, junction] of [[20, inputJunction], [50, outputJunction]]) {
        const terminal = junction.ports.find(port => port.node === node);
        assert.ok(axis > terminal.at[1]);
        const wires = graph.wires.filter(wire => wire.node === node);
        assert.ok(wires.flatMap(wire => wire.points).every(point =>
            point[1] >= terminal.at[1] && point[1] <= axis));
        assert.ok(wires.some(wire => wire.points.every(point => point[1] === axis)));
        assert.ok(wires.filter(wire => wire.points[0][1] === wire.points[1][1])
            .every(wire => wire.points[0][1] === axis));
    }
    assertConnected(graph);
});

test('parallel junctions have equal upper and lower vertical legs on the placement grid', () => {
    for (const ladder of [false, true]) {
        const {circuit, shapes} = parallelNetwork({ladder});
        const graph = schematicGraph(circuit, {shapes});
        for (const [junction, upperNode, lowerNode] of [
            [graph.components[0], 10, 20], [graph.components.at(-1), 30, 50]
        ]) {
            const upper = junction.ports.find(port => port.node === upperNode);
            const lower = junction.ports.find(port => port.node === lowerNode);
            const upperY = graph.components.find(part => part !== junction &&
                part.ports.some(port => port.node === upperNode)).ports.find(port => port.node === upperNode).at[1];
            const lowerY = graph.components.find(part => part !== junction &&
                part.ports.some(port => port.node === lowerNode)).ports.find(port => port.node === lowerNode).at[1];
            assert.equal(upper.at[1] - upperY, lowerY - lower.at[1]);
            assert.ok(upper.at[1] > upperY);
        }
        assertConnected(graph);
    }
});

test('crossed track order reports a crossover error and the public call returns normally', () => {
    const {circuit, shapes} = parallelNetwork();
    const combiner = circuit._schematic.components.at(-1);
    [combiner.nodes[1], combiner.nodes[2]] = [combiner.nodes[2], combiner.nodes[1]];
    assert.throws(() => schematicGraph(circuit, {shapes}), /crossover/);
    const original = console.error;
    console.error = () => {};
    try {
        const failed = nP.schematic(circuit, {shapes});
        assert.match(failed.error.message, /crossover/);
        assert.equal(failed.graph, null);
        assert.ok(nP.R(50).out('s21dB').length > 1);
    } finally { console.error = original; }
});
