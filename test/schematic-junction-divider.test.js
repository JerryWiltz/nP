// Modified: 2026-11-13
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph, schematicTopology} from '../src/np-chart/src/schematic';
import {schematicSymbols} from '../src/np-chart/src/schematicSymbols';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';
import {detectSchematicShapes} from '../src/np-chart/src/schematicShapeDetector';
import {symbolForSchematicEntry} from '../src/np-chart/src/nodalBlockSymbol';

function junctionNetwork(tee, extended = false) {
    const count = Math.sqrt(tee.spars[0].length - 1);
    const rows = [[tee, ...Array.from({length: count}, (_, index) => index + 1)]], out = [1];
    for (let port = 2; port <= count; port++) {
        const end = 10 * port;
        rows.push([nP.Tlin(50, 0.0254), port, end]);
        if (extended && port === 2) {
            rows.push([nP.R(12), end, end + 1], [nP.L(5e-9), end + 1, end + 2]);
            out.push(end + 2);
        } else out.push(end);
    }
    return nP.nodal(...rows.reverse(), ['out', ...out]);
}

function assertWired(graph) {
    const ends = graph.components.flatMap(part => part.ports).concat(graph.externalPorts);
    for (const node of graph.nodes) {
        const terminals = ends.filter(end => end.node === node.id);
        assert.equal(terminals.length, 2);
        const pending = [terminals[0].at.join(',')], seen = new Set(), adjacency = new Map();
        for (const wire of graph.wires.filter(wire => wire.node === node.id)) {
            const [a, b] = wire.points;
            assert.ok(a[0] === b[0] || a[1] === b[1]);
            assert.notDeepEqual(a, b);
            assert.ok(wire.points.flat().every(value => value % 10 === 0));
            for (const [from, to] of [[a, b], [b, a]]) {
                const key = from.join(',');
                adjacency.set(key, [...(adjacency.get(key) || []), to.join(',')]);
            }
        }
        while (pending.length) {
            const key = pending.pop();
            if (seen.has(key)) continue;
            seen.add(key);
            pending.push(...(adjacency.get(key) || []));
        }
        assert.ok(seen.has(terminals[1].at.join(',')), `node ${node.id} is disconnected`);
        assert.equal(seen.size, adjacency.size, `node ${node.id} has an isolated fragment`);
    }
    assert.ok(graph.board.boxes.every(box => !Object.hasOwn(box, 'nodeDot')));
}

for (const constructor of [nP.Tee, nP.mtee, nP.Tee4, nP.Tee5]) {
    test(`${constructor.name}: automatic junction divider and reflected combiner preserve wiring`, () => {
        const circuit = junctionNetwork(constructor(), true);
        const original = JSON.stringify(circuit._schematic);
        const detected = detectSchematicShapes(circuit, schematicShapeBoards, {symbol: symbolForSchematicEntry});
        assert.deepEqual(detected, {shapes: ['powerDivider']});
        const divider = schematicGraph(circuit);
        const combiner = schematicGraph(circuit, {shapes: ['powerCombiner']});
        assert.equal(divider.pattern, 'junction');
        assert.equal(combiner.pattern, 'junction');
        assert.equal(divider.board.interpreter, 'ORI');
        assertWired(divider);
        assertWired(combiner);
        const ports = divider.externalPorts;
        const ys = ports.slice(1).map(port => port.at[1]).sort((a, b) => a - b);
        ys.forEach((y, index) => assert.equal(y + ys.at(-1 - index), ports[0].at[1] * 2));
        for (const port of ports) {
            const reflected = combiner.externalPorts.find(end => end.port === port.port);
            assert.deepEqual(reflected.at, [-port.at[0], port.at[1]]);
            assert.equal(reflected.node, port.node);
        }
        assert.deepEqual(schematicTopology(circuit), schematicTopology(circuit, {shapes: ['powerCombiner']}));
        assert.equal(JSON.stringify(circuit._schematic), original);
    });
}

test('junction recognition follows metadata rather than a constructor or symbol-name whitelist', () => {
    const tee = nP.Tee4();
    const name = 'future-line-junction';
    schematicSymbols[name] = structuredClone(schematicSymbols.tee4);
    tee._schematic = {...tee._schematic, constructor: 'futureJunction', symbol: name};
    try {
        const circuit = junctionNetwork(tee);
        assert.equal(schematicGraph(circuit).pattern, 'junction');
        assertWired(schematicGraph(circuit));
    } finally {
        delete schematicSymbols[name];
    }
});

test('bare junctions and upstream two-port network blocks need no isolation resistor', () => {
    const bare = nP.nodal([nP.Tee(), 1, 2, 3], ['out', 1, 2, 3]);
    assertWired(schematicGraph(bare));
    const block = nP.nodal([nP.R(50), 1, 2], ['out', 1, 2]);
    const circuit = nP.nodal(
        [nP.R(1), 1, 9],
        [nP.Tee(), 9, 2, 3],
        [block, 2, 4],
        [block, 3, 5],
        ['out', 1, 4, 5]
    );
    const graph = schematicGraph(circuit);
    assert.equal(graph.pattern, 'junction');
    assert.equal(graph.components.filter(part => part.symbol === 'nodal').length, 2);
    assertWired(graph);
});

test('variable junction interfaces compose with grouped series arms and a combiner', () => {
    const circuit = nP.nodal(
        {powerDivider: [[nP.Tee4(), 1, 10, 20, 30]]},
        {series: [[nP.R(5), 10, 11]]},
        {series: [[nP.L(5e-9), 20, 21]]},
        {series: [[nP.C(1e-12), 30, 31]]},
        {powerCombiner: [[nP.Tee4(), 2, 11, 21, 31]]},
        ['out', 1, 2]
    );
    const graph = schematicGraph(circuit);
    assert.equal(graph.layout, 'board-composition');
    assert.equal(graph.board.sections.length, 5);
    assertWired(graph);
});

test('unclaimed parts and turning arms are not falsely detected as the straight fan board', () => {
    const turning = nP.nodal(
        [nP.Tee(), 1, 2, 3],
        [nP.mbend(), 2, 4],
        [nP.R(50), 3, 5],
        ['out', 1, 4, 5]
    );
    assert.equal(detectSchematicShapes(turning, schematicShapeBoards, {symbol: symbolForSchematicEntry}), null);
    assert.throws(() => schematicGraph(turning, {shapes: ['powerDivider']}), /does not match/);
    const unrelated = junctionNetwork(nP.Tee());
    unrelated._schematic.components.push({part: nP.R(50)._schematic, nodes: [100, 101]});
    assert.equal(detectSchematicShapes(unrelated, schematicShapeBoards, {symbol: symbolForSchematicEntry}), null);
});
