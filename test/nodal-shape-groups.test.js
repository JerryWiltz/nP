// Modified: 2026-11-08
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {nodalConnections} from '../src/np-nport/src/combining/nodalConnections';
import {schematicGraph} from '../src/np-chart/src/schematic';
import {detectSchematicShapes} from '../src/np-chart/src/schematicShapeDetector';
import {groupedSchematicShapes} from '../src/np-chart/src/schematicGroups';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';
import {symbolForSchematicEntry} from '../src/np-chart/src/nodalBlockSymbol';

const geometry = {symbol: symbolForSchematicEntry};

function seriesLadderSeries() {
    nP.global.fList = [1e9, 2e9];
    const r1 = nP.R(75), r2 = nP.R(50), c1 = nP.C(1e-12), tee = nP.Tee(), short = nP.Short();
    const first = [[r1, 1, 2], [r2, 2, 3]];
    const middle = [[tee, 4, 3, 5], [c1, 4, 6], [short, 6], [r2, 5, 7]];
    const last = [[r1, 7, 8]];
    const output = ['out', 1, 8];
    return {first, middle, last, output,
        grouped: nP.nodal({series: first}, {ladder: middle}, {series: last}, output),
        flat: nP.nodal(...first, ...middle, ...last, output)};
}

function assertWired(graph) {
    for (const node of graph.nodes) {
        const ends = graph.components.flatMap(part => part.ports).concat(graph.externalPorts)
            .filter(port => port.node === node.id);
        const adjacency = new Map();
        for (const wire of graph.wires.filter(wire => wire.node === node.id)) {
            const [a, b] = wire.points;
            assert.ok(a[0] === b[0] || a[1] === b[1]);
            assert.ok(wire.points.flat().every(value => value % 10 === 0));
            for (const [from, to] of [[a, b], [b, a]]) {
                const key = from.join(',');
                if (!adjacency.has(key)) adjacency.set(key, []);
                adjacency.get(key).push(to.join(','));
            }
        }
        const pending = [ends[0].at.join(',')], visited = new Set();
        while (pending.length) {
            const key = pending.pop();
            if (visited.has(key)) continue;
            visited.add(key);
            assert.ok(adjacency.has(key), `node ${node.id} misses a terminal`);
            pending.push(...adjacency.get(key));
        }
        assert.ok(ends.every(end => visited.has(end.at.join(','))));
        assert.equal(visited.size, adjacency.size);
    }
    assert.deepEqual(graph.crossings, []);
}

test('group normalization preserves RF rows, noise, input arrays, and occurrence identity', () => {
    const {first, middle, last, output, grouped, flat} = seriesLadderSeries();
    assert.deepEqual(grouped.spars, flat.spars);
    assert.deepEqual(grouped.noise, flat.noise);
    assert.deepEqual(grouped.out('s11dB', 's21dB', 'NF21dB'), flat.out('s11dB', 's21dB', 'NF21dB'));
    assert.equal(flat._schematic.groups, undefined);
    assert.deepEqual(grouped._schematic.groups, [
        {name: 'series', components: [0, 1]}, {name: 'ladder', components: [2, 3, 4, 5]},
        {name: 'series', components: [6]}
    ]);
    assert.deepEqual(first.map(row => row.slice(1)), [[1, 2], [2, 3]]);
    assert.deepEqual(middle.map(row => row.slice(1)), [[4, 3, 5], [4, 6], [6], [5, 7]]);
    assert.deepEqual(last.map(row => row.slice(1)), [[7, 8]]);
    assert.deepEqual(output, ['out', 1, 8]);
    assert.equal(grouped._schematic.components[0].part, grouped._schematic.components[6].part);
});

test('shape groups infer boundaries and compose with no schematic options', () => {
    const {grouped} = seriesLadderSeries();
    const before = JSON.stringify(grouped._schematic);
    const expected = {shapes: [{name: 'series', from: 1, to: 3},
        {name: 'ladder', from: 3, to: 7}, {name: 'series', from: 7, to: 8}]};
    assert.deepEqual(detectSchematicShapes(grouped, schematicShapeBoards, geometry), expected);
    const graph = schematicGraph(grouped);
    assert.deepEqual(graph.shapes, expected.shapes);
    assert.equal(graph.components.length, 7);
    assert.equal(graph.board.sections.length, 3);
    assertWired(graph);
    assert.equal(JSON.stringify(grouped._schematic), before);
});

test('inline group boundaries use ordinary inter-component spacing without stacked external leads', () => {
    const {grouped} = seriesLadderSeries();
    const graph = schematicGraph(grouped);
    const span = node => {
        const ends = graph.components.flatMap(part => part.ports).concat(graph.externalPorts)
            .filter(port => port.node === node);
        assert.equal(ends.length, 2);
        assert.equal(ends[0].at[1], ends[1].at[1]);
        return Math.abs(ends[0].at[0] - ends[1].at[0]);
    };
    // Node 2 is inside the first group; 3 and 7 join different groups.
    assert.equal(span(2), 80);
    for (const node of [1, 3, 7, 8]) assert.equal(span(node), span(2));
    assertWired(graph);
});

test('two repeated series groups retain distinct occurrence sets even when every resistor is the same object', () => {
    const r1 = nP.R(75);
    const circuit = nP.nodal({series: [[r1, 1, 2], [r1, 2, 3]]},
        {series: [[r1, 3, 4], [r1, 4, 5]]}, ['out', 1, 5]);
    const graph = schematicGraph(circuit);
    assert.equal(graph.board.sections.length, 2);
    assert.equal(graph.components.length, 4);
    assert.equal(new Set(graph.components.map(part => part.id)).size, 4);
    assert.deepEqual(graph.shapes, [{name: 'series', from: 1, to: 3}, {name: 'series', from: 3, to: 5}]);
    assertWired(graph);
});

test('group list order does not decide electrical flow and blind detection ignores declared shape names', () => {
    const {first, middle, last, output} = seriesLadderSeries();
    const circuit = nP.nodal({series: last}, {series: first}, {ladder: middle}, output);
    assertWired(schematicGraph(circuit));
    circuit._schematic.groups[1].name = 'notAShape';
    const detected = detectSchematicShapes(circuit, schematicShapeBoards, geometry);
    assert.equal(detected.shapes[1].name, 'series');
    assert.throws(() => schematicGraph(circuit), /unknown shape "notAShape"/);
    assert.equal(schematicGraph(circuit, {shapes: ['ladder']}).shape, 'ladder');
});

test('raw junction rows can join independently grouped parallel paths', () => {
    const r1 = nP.R(50), tee = nP.Tee();
    const circuit = nP.nodal([tee, 1, 10, 20], {series: [[r1, 10, 30]]},
        {series: [[r1, 20, 40]]}, [tee, 2, 30, 40], ['out', 1, 2]);
    const graph = schematicGraph(circuit);
    assert.equal(graph.components.length, 4);
    assertWired(graph);
});

function dividerRows(common, upper, lower, base) {
    const tee = nP.Tee(), line = nP.Tlin(70.7, 0.0375), r1 = nP.R(100);
    return [[tee, common, base + 10, base + 11], [line, base + 10, base + 20],
        [line, base + 11, base + 21], [tee, base + 30, base + 20, upper],
        [tee, base + 31, base + 21, lower], [r1, base + 30, base + 31]];
}

test('group context supplies divider and combiner roles across two actual interface nodes', () => {
    const circuit = nP.nodal({powerDivider: dividerRows(1, 40, 41, 0)},
        {powerCombiner: dividerRows(2, 40, 41, 100)}, ['out', 1, 2]);
    const detected = detectSchematicShapes(circuit, schematicShapeBoards, geometry);
    assert.deepEqual(detected, {shapes: [
        {name: 'powerDivider', from: 1, to: [40, 41]},
        {name: 'powerCombiner', from: [40, 41], to: 2}
    ]});
    assertWired(schematicGraph(circuit));
});

test('compatible horizontal interfaces stay level through asymmetric parallel path groups', () => {
    const r1 = nP.R(75), tee = nP.Tee(), c1 = nP.C(1e-12), short = nP.Short();
    for (const count of [1, 3]) {
        const upper = Array.from({length: count}, (_, index) => [r1,
            index ? 300 + index : 10, index === count - 1 ? 30 : 301 + index]);
        const circuit = nP.nodal({powerDivider: dividerRows(1, 10, 20, 1000)},
            {series: upper}, {ladder: [[tee, 21, 20, 22], [c1, 21, 23], [short, 23], [r1, 22, 40]]},
            {powerCombiner: dividerRows(2, 30, 40, 2000)}, ['out', 1, 2]);
        const graph = schematicGraph(circuit);
        for (const node of [10, 20, 30, 40]) {
            const terminals = graph.components.flatMap(part => part.ports).filter(port => port.node === node);
            assert.equal(terminals.length, 2);
            assert.equal(terminals[0].at[1], terminals[1].at[1], `stepped interface at node ${node}`);
            assert.ok(graph.wires.filter(wire => wire.node === node).every(wire =>
                wire.points.every(point => point[1] === terminals[0].at[1])));
        }
        assert.equal(graph.externalPorts[0].at[1], graph.externalPorts[1].at[1]);
        assertWired(graph);
    }
});

test('a single shape group keeps the original numbered external ports', () => {
    const r1 = nP.R(75);
    const circuit = nP.nodal({series: [[r1, 45, 37], [r1, 37, 1]]}, ['out', 45, 1]);
    assert.deepEqual(detectSchematicShapes(circuit, schematicShapeBoards, geometry), {shapes: ['series']});
    assert.deepEqual(schematicGraph(circuit).externalPorts.map(port => port.node), [45, 1]);
});

test('shape labels affect drawings but not numerical simulation, and mistakes report clearly', () => {
    const r1 = nP.R(75);
    const circuit = nP.nodal({ladder: [[r1, 1, 2]]}, ['out', 1, 2]);
    assert.deepEqual(circuit.spars, nP.nodal([r1, 1, 2], ['out', 1, 2]).spars);
    assert.deepEqual(detectSchematicShapes(circuit, schematicShapeBoards, geometry), {shapes: ['series']});
    assert.throws(() => schematicGraph(circuit), /does not fit its declared shape/);
    const {grouped} = seriesLadderSeries();
    grouped._schematic.groups[1].components.push(0);
    assert.throws(() => groupedSchematicShapes(grouped._schematic, schematicShapeBoards, geometry), /overlapping/);
});

test('grouped nodal retains legacy signal options and frequency-aligned waves', () => {
    const g = nP.global();
    g.fList = [1e9, 2e9];
    const tx = nP.mod({mode: 'VNA-frequency', fList: g.fList});
    const r1 = nP.R(50), l1 = nP.L(5e-9);
    const options = {signal: tx, inputPort: 1};
    const grouped = nP.nodal({series: [[r1, 1, 2], [l1, 2, 3]]}, ['out', 1, 3], options);
    const flat = nP.nodal([r1, 1, 2], [l1, 2, 3], ['out', 1, 3], options);
    assert.deepEqual(grouped.spars, flat.spars);
    assert.deepEqual(grouped.signal, flat.signal);
    assert.deepEqual(nP.demod(grouped, {noise: false}).out('response'), nP.demod(flat, {noise: false}).out('response'));
    assert.equal(options.signal, tx);
});

test('malformed groups are rejected before building the electrical matrices', () => {
    const r1 = nP.R(50);
    for (const args of [[], [{series: []}, ['out', 1, 2]], [{series: [['out', 1, 2]]}, ['out', 1, 2]],
        [{series: [r1]}, ['out', 1, 2]], [{}, ['out', 1, 2]], [{series: [[r1, 1, 2]]}]]) {
        assert.throws(() => nodalConnections(args), TypeError);
    }
});
