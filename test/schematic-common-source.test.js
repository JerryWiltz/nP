// Modified: 2026-11-19
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {jfetNetwork} from './fixtures/jfet-network';
import {schematicGraph, schematicSvg} from '../src/np-chart/src/schematic';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';
function assertConnected(graph) {
    for (const node of graph.nodes) {
        const ends = graph.components.flatMap(part => part.ports).concat(graph.externalPorts)
            .filter(port => port.node === node.id);
        assert.equal(ends.length, 2);
        const neighbors = new Map();
        for (const wire of graph.wires.filter(wire => wire.node === node.id)) {
            const [a, b] = wire.points;
            assert.ok(a[0] === b[0] || a[1] === b[1]);
            assert.notDeepEqual(a, b);
            assert.ok([...a, ...b].every(value => value % 10 === 0));
            for (const [from, to] of [[a, b], [b, a]]) {
                const key = from.join(',');
                neighbors.set(key, [...(neighbors.get(key) || []), to.join(',')]);
            }
        }
        const pending = [ends[0].at.join(',')], seen = new Set();
        while (pending.length) {
            const key = pending.pop();
            if (seen.has(key)) continue;
            seen.add(key);
            pending.push(...(neighbors.get(key) || []));
        }
        assert.ok(ends.every(end => seen.has(end.at.join(','))), `node ${node.id} is disconnected`);
        assert.equal(seen.size, neighbors.size);
    }
    assert.deepEqual(graph.crossings, []);
    assert.ok(graph.board.boxes.every(box => !Object.hasOwn(box, 'nodeDot')));
    for (const box of graph.board.boxes.filter(box => box.kind === 'component')) {
        const [left, top, right, bottom] = box.bounds;
        for (const {points: [a, b]} of graph.wires) {
            const crosses = a[0] === b[0] ? a[0] > left && a[0] < right &&
                Math.max(a[1], b[1]) > top && Math.min(a[1], b[1]) < bottom :
                a[1] > top && a[1] < bottom && Math.max(a[0], b[0]) > left && Math.min(a[0], b[0]) < right;
            assert.equal(crosses, false, `a wire crosses component ${box.id}`);
        }
    }
}


for (const [name, symbol] of [['NJF', 'njf'], ['PJF', 'pjf'], ['MESFET', 'njf']]) for (const source of ['split', 'combined', 'resistor']) {
    for (const bypass of [false, true]) for (const common of ['output', 'supply']) {
        test(name + ' commonSource ' + source + ', bypass ' + bypass + ', common ' + common, () => {
            nP.global.fList = [1e6];
            const network = jfetNetwork({name, source, bypass, common}), before = JSON.stringify(network);
            const graph = schematicGraph(network);
            assert.equal(graph.shape, 'commonSource');
            assertConnected(graph);
            assert.equal(graph.components.length, network._schematic.components.length);
            graph.components.forEach((part, index) => assert.deepEqual(part.ports.map(port => port.node), network._schematic.components[index].nodes));
            const bySlot = slot => graph.components.find(part => part.boardTile.id === slot);
            const q = bySlot('device'), supply = bySlot('source'), output = bySlot('output');
            assert.equal(q.symbol, symbol);
            assert.ok(q.ports[0].at[0] < q.ports[1].at[0]);
            assert.ok(q.ports[1].at[1] < q.ports[0].at[1]);
            assert.ok(q.ports[2].at[1] > q.ports[0].at[1]);
            assert.ok(supply.ports[0].at[0] > output.ports[1].at[0]);
            if (source === 'split') assert.equal(bySlot('returnGround').ports[0].at[1], bySlot('returnBypassGround').ports[0].at[1]);
            if (bypass) assert.equal(bySlot('sourceGround').ports[0].at[1], bySlot('supplyBypassGround').ports[0].at[1]);
            assert.equal(JSON.stringify(network), before);
        });
    }
}

test('commonSource preserves renamed nodes, reordered rows, reflection and series composition', () => {
    nP.global.fList = [1e6];
    for (const options of [{reordered: true}, {name: 'PJF'}, {grouped: true}]) {
        const network = jfetNetwork(options);
        for (const flipVertical of [false, true]) {
            const graph = schematicGraph(network, {flipVertical}); assertConnected(graph);
            if (options.grouped) assert.deepEqual(graph.shapes.map(shape => shape.name), ['commonSource', 'series']);
            else assert.equal(graph.shape, 'commonSource');
        }
        assert.match(schematicSvg(network), /<svg/);
    }
});

test('parallel-lead route choices tolerate reversed relation traversal without changing topology', () => {
    nP.global.fList = [1e6];
    const definitions = [schematicShapeBoards.commonSource, ...schematicShapeBoards.commonSource.alternatives];
    const saved = definitions.map(definition => [definition.board, definition.board.wires]);
    try {
        // Reversal swaps which side is the preferred U-turn. The shared solver
        // must still honor the same relative component organization.
        for (const [board, wires] of saved) board.wires = wires.map(wire => wire.from.externalPort || wire.to.externalPort ? wire : {...wire, from: wire.to, to: wire.from});
        for (const source of ['split', 'combined', 'resistor']) for (const bypass of [false, true]) {
            assertConnected(schematicGraph(jfetNetwork({source, bypass})));
        }
    } finally { for (const [board, wires] of saved) board.wires = wires; }
});
