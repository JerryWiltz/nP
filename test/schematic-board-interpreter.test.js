// Modified: 2026-11-06
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph} from '../src/np-chart/src/schematic';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';
import {buildSchematicStressCases} from '../dev/schematicStressCases';

function seriesNetwork(count) {
    const resistor = nP.R(50);
    const rows = Array.from({length: count}, (_, index) =>
        // Reversed numbered ports and row order must not change the traced path.
        [resistor, 100 - index - 1, 100 - index]);
    return nP.nodal(...rows.reverse(), ['out', 100, 100 - count]);
}

function assertWired(graph) {
    const ends = graph.components.flatMap(part => part.ports).concat(graph.externalPorts);
    for (const end of ends) {
        assert.ok(graph.wires.some(wire => wire.node === end.node && wire.points.some(point =>
            point[0] === end.at[0] && point[1] === end.at[1])),
        `unconnected terminal at node ${end.node}`);
    }
    for (const wire of graph.wires) {
        assert.equal(wire.points.length, 2);
        assert.ok(wire.points[0][0] === wire.points[1][0] ||
            wire.points[0][1] === wire.points[1][1]);
        assert.ok(wire.points.flat().every(value => value % 10 === 0));
        assert.notDeepEqual(wire.points[0], wire.points[1]);
    }
}

test('one repeating board handles 1, 2 and 13 occurrences without changing electrical nodes', () => {
    for (const count of [1, 2, 13]) {
        const circuit = seriesNetwork(count);
        const before = circuit._schematic.components.map(entry => entry.nodes.slice());
        const graph = schematicGraph(circuit, {shapes: ['series']});
        assert.equal(graph.board.interpreter, 'ORI');
        assert.equal(graph.components.length, count);
        assert.equal(graph.wires.length, count + 1);
        assert.deepEqual(graph.externalPorts.map(port => port.node), [100, 100 - count]);
        assert.deepEqual(new Set(graph.nodes.map(node => node.id)),
            new Set(Array.from({length: count + 1}, (_, index) => 100 - index)));
        assert.deepEqual(circuit._schematic.components.map(entry => entry.nodes), before);
        assertWired(graph);
    }
});

test('a second board name and upward direction work by changing data alone', () => {
    const definition = structuredClone(schematicShapeBoards.series);
    definition.name = 'upwardExample';
    definition.board.direction = 'up';
    definition.board.wireBoxLength = 120;
    schematicShapeBoards.upwardExample = definition;
    try {
        const graph = schematicGraph(seriesNetwork(2), {shapes: ['upwardExample']});
        assert.equal(graph.shape, 'upwardExample');
        assert.equal(graph.board.interpreter, 'ORI');
        assert.ok(graph.externalPorts[1].at[1] < graph.externalPorts[0].at[1]);
        assert.ok(graph.components.every(part => part.rotation % 90 === 0));
        assertWired(graph);
    } finally {
        delete schematicShapeBoards.upwardExample;
    }
});

test('board matching rejects a shunt and a disconnected cycle instead of dropping components', () => {
    const resistor = nP.R(50);
    const root = {kind: 'nodal', externalNodes: [1, 3], components: [
        {part: resistor._schematic, nodes: [1, 2]},
        {part: resistor._schematic, nodes: [2, 3]},
        {part: resistor._schematic, nodes: [2, 4]}
    ]};
    assert.throws(() => schematicGraph({_schematic: root}, {shapes: ['series']}), /does not match/);
    root.components[2].nodes = [7, 8];
    root.components.push({part: resistor._schematic, nodes: [8, 7]});
    assert.throws(() => schematicGraph({_schematic: root}, {shapes: ['series']}), /does not match/);
});

test('a bend redirects the following wire boxes while keeping their connections', () => {
    const circuit = nP.nodal(
        [nP.R(50), 1, 2],
        [nP.mbend(), 2, 3],
        [nP.L(5e-9), 3, 4],
        ['out', 1, 4]
    );
    const graph = schematicGraph(circuit, {shapes: ['series']});
    const first = graph.wires[0], last = graph.wires.at(-1);
    assert.equal(first.points[0][1], first.points[1][1]);
    assert.equal(last.points[0][0], last.points[1][0]);
    assertWired(graph);
});

test('one attached-path board handles repeated stages and multi-component shunts', () => {
    const r = nP.R(50), c = nP.C(1e-12), short = nP.Short();
    for (const stages of [1, 3]) {
        const rows = [];
        for (let stage = 0; stage < stages; stage++) {
            const base = 10 * stage;
            rows.push([nP.Tee(), base + 4, base + 1, base + 2],
                [r, base + 4, base + 5], [c, base + 5, base + 6], [short, base + 6],
                [r, base + 2, base + 11]);
        }
        const circuit = nP.nodal(...rows.reverse(), ['out', 1, stages * 10 + 1]);
        const graph = schematicGraph(circuit, {shapes: ['ladder']});
        assert.equal(graph.board.interpreter, 'ORI');
        assert.equal(graph.components.length, stages * 5);
        assert.equal(graph.wires.length, stages * 5 + 1);
        assert.equal(graph.components.filter(part => part.boardTile.role === 'termination').length, stages);
        assert.ok(graph.components.filter(part => part.boardTile.role === 'shuntPart')
            .every(part => part.ports[1].at[1] > part.ports[0].at[1]));
        assertWired(graph);
    }
});

test('branch direction and board name change through data with no layout callback', () => {
    // JSON round-trip proves that this description contains only serializable data.
    const definition = JSON.parse(JSON.stringify(schematicShapeBoards.ladder));
    definition.name = 'upwardAttachments';
    definition.board.attachments[0].direction = 'up';
    schematicShapeBoards.upwardAttachments = definition;
    try {
        const circuit = nP.nodal(
            [nP.Tee(), 4, 1, 2],
            [nP.Tlin(50, 0.01), 4, 5],
            [nP.Open(), 5],
            [nP.R(50), 2, 3],
            ['out', 1, 3]
        );
        const graph = schematicGraph(circuit, {shapes: ['upwardAttachments']});
        assert.equal(graph.board.interpreter, 'ORI');
        const shunt = graph.components.find(part => part.boardTile.role === 'shuntPart');
        assert.ok(shunt.ports[1].at[1] < shunt.ports[0].at[1]);
        const termination = graph.components.find(part => part.boardTile.role === 'termination');
        assert.ok(termination.at[1] < shunt.ports[1].at[1]);
        assertWired(graph);
    } finally {
        delete schematicShapeBoards.upwardAttachments;
    }
});

test('attached-path matching rejects rejoining branches and omitted components', () => {
    const r = nP.R(50), tee = nP.Tee();
    const loop = nP.nodal(
        [tee, 4, 1, 2],
        [r, 4, 5],
        [tee, 5, 2, 3],
        ['out', 1, 3]
    );
    assert.throws(() => schematicGraph(loop, {shapes: ['ladder']}), /does not match/);
    const valid = nP.nodal(
        [tee, 4, 1, 2],
        [r, 4, 5],
        [nP.Short(), 5],
        [r, 2, 3],
        ['out', 1, 3]
    );
    const root = {...valid._schematic, components: valid._schematic.components.concat(
        [{part: r._schematic, nodes: [70, 71]}, {part: r._schematic, nodes: [71, 70]}])};
    assert.throws(() => schematicGraph({_schematic: root}, {shapes: ['ladder']}), /does not match/);
});

test('connected boards preserve every numbered terminal and use only real wire boxes', () => {
    const cases = buildSchematicStressCases(nP);
    for (const name of ['branch-series-top', 'branch-series-opposite', 'branch-reordered',
        'branchline-two-cell', 'branchline-microstrip']) {
        const circuit = cases.find(item => item.id === name).circuit;
        const before = circuit._schematic.components.map(entry => entry.nodes.slice());
        const graph = schematicGraph(circuit, {shapes: ['branchline']});
        assert.equal(graph.board.interpreter, 'ORI');
        assert.equal(graph.externalPorts.length, 4);
        assertWired(graph);
        assert.deepEqual(graph.components.map(part => part.ports.map(port => port.node)), before);
        for (const wire of graph.wires) {
            assert.equal(wire.boardTile.length, Math.abs(wire.points[1][0] - wire.points[0][0]) +
                Math.abs(wire.points[1][1] - wire.points[0][1]));
            assert.equal(graph.components.flatMap(part => part.ports).concat(graph.externalPorts)
                .filter(port => port.node === wire.node).length, 2);
        }
        assert.deepEqual(circuit._schematic.components.map(entry => entry.nodes), before);
    }
});

test('three rows and different port sides are supplied entirely as board data', () => {
    const definition = JSON.parse(JSON.stringify(schematicShapeBoards.branchline));
    definition.name = 'threeRowExample';
    definition.board.rows.splice(1, 0, {name: 'middle', tile: {kind: 'component', role: 'junction'}});
    definition.board.lanes = [
        {name: 'upper', from: 'top', to: 'top', columns: 'adjacent', direction: 'right', path: 'twoPortLane'},
        {name: 'middle', from: 'middle', to: 'middle', columns: 'adjacent', direction: 'right', path: 'twoPortLane'},
        {name: 'lower', from: 'bottom', to: 'bottom', columns: 'adjacent', direction: 'right', path: 'twoPortLane'},
        {name: 'upperVertical', from: 'top', to: 'middle', columns: 'each', direction: 'down', path: 'twoPortLane'},
        {name: 'lowerVertical', from: 'middle', to: 'bottom', columns: 'each', direction: 'down', path: 'twoPortLane'}
    ];
    definition.board.externalPorts = [
        {port: 1, row: 'top', column: 'first', side: 'up'},
        {port: 2, row: 'bottom', column: 'first', side: 'down'},
        {port: 3, row: 'bottom', column: 'last', side: 'down'},
        {port: 4, row: 'top', column: 'last', side: 'up'}
    ];
    schematicShapeBoards.threeRowExample = definition;
    try {
        const circuit = buildSchematicStressCases(nP).find(item => item.id === 'branchline-two-cell').circuit;
        const graph = schematicGraph(circuit, {shapes: ['threeRowExample']});
        assert.equal(graph.board.interpreter, 'ORI');
        assert.equal(graph.cells, 2);
        assert.deepEqual(new Set(graph.board.boxes.filter(box => box.tile?.role === 'junction')
            .map(box => box.tile.cell[1])), new Set([0, 1, 2]));
        assertWired(graph);
        assert.equal(graph.externalPorts[0].at[1], graph.externalPorts[3].at[1]);
        assert.ok(graph.externalPorts[0].at[1] < graph.externalPorts[1].at[1]);
    } finally {
        delete schematicShapeBoards.threeRowExample;
    }
});
