// Modified: 2026-11-25
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {singleDetector, differentialDetector} from './fixtures/rectification-networks';
import {schematicGraph, schematicSvg} from '../src/np-chart/src/schematic';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';
import {detectSchematicShapes} from '../src/np-chart/src/schematicShapeDetector';
import {symbolForSchematicEntry} from '../src/np-chart/src/nodalBlockSymbol';

function setup() { nP.global.fList = [1e9]; nP.global.twoTone = undefined; nP.global.Ro = 50; }
function rowsOf(network) {
    return network._rfModel.components.map((part, index) => [part, ...network._dcModel.definition.components[index].nodes]);
}
function role(graph, name) { return graph.components.find(part => part.boardTile.id === name); }
function port(part, number) { return part.ports[number - 1].at; }
function middle(part, axis) { return part.ports.reduce((sum, p) => sum + p.at[axis], 0) / part.ports.length; }

function assertConnectivity(graph, network) {
    assert.equal(graph.components.length, network._schematic.components.length);
    graph.components.forEach((part, index) => assert.deepEqual(part.ports.map(p => p.node), network._schematic.components[index].nodes));
    assert.deepEqual(graph.crossings, []);
    for (const node of graph.nodes) {
        const ends = graph.components.flatMap(part => part.ports).concat(graph.externalPorts).filter(p => p.node === node.id);
        const neighbors = new Map();
        for (const wire of graph.wires.filter(w => w.node === node.id)) {
            const [a, b] = wire.points;
            assert.ok(a[0] === b[0] || a[1] === b[1]);
            assert.ok([...a, ...b].every(v => v % 10 === 0));
            for (const [from, to] of [[a, b], [b, a]]) neighbors.set(from.join(','), [...(neighbors.get(from.join(',')) || []), to.join(',')]);
        }
        const seen = new Set(), pending = [ends[0].at.join(',')];
        while (pending.length) {
            const at = pending.pop(); if (seen.has(at)) continue;
            seen.add(at); pending.push(...(neighbors.get(at) || []));
        }
        assert.ok(ends.every(end => seen.has(end.at.join(','))), 'Disconnected node ' + node.id);
    }
    for (const box of graph.board.boxes.filter(b => b.kind === 'component')) {
        const [left, top, right, bottom] = box.bounds;
        for (const {points: [a, b]} of graph.wires) {
            const crosses = a[0] === b[0] ? a[0] > left && a[0] < right && Math.max(a[1], b[1]) > top && Math.min(a[1], b[1]) < bottom :
                a[1] > top && a[1] < bottom && Math.max(a[0], b[0]) > left && Math.min(a[0], b[0]) < right;
            assert.equal(crosses, false, 'Wire crosses component ' + box.id);
        }
    }
}

const geometry = {symbol: symbolForSchematicEntry,
    placement() { throw new Error('Blind detection must not place symbols.'); }};

for (const [shape, build] of [['diodeDetector', singleDetector], ['differentialDetector', differentialDetector]]) {
    test(shape + ' is detected from connectivity and preserves analysis and port identity', () => {
        setup();
        const network = build(), before = JSON.stringify(network);
        assert.deepEqual(detectSchematicShapes(network, schematicShapeBoards, geometry), {shapes: [shape]});
        const graph = schematicGraph(network);
        assert.equal(graph.shape, shape);
        assert.deepEqual(graph, schematicGraph(network, {shapes: [shape]}));
        assertConnectivity(graph, network);
        assert.equal(JSON.stringify(network), before);
        assert.ok(middle(role(graph, 'detectorDiode'), 0) > middle(role(graph, 'inputJunction'), 0));
        const grounds = ['detectorLoadGround', 'detectorBypassGround', ...(shape === 'diodeDetector' ? ['returnGround'] : ['referenceLoadGround', 'referenceBypassGround'])];
        const baseline = port(role(graph, grounds[0]), 1)[1];
        for (const ground of grounds) assert.equal(port(role(graph, ground), 1)[1], baseline);
        assert.ok(baseline > middle(role(graph, 'detectorDiode'), 1));
        if (shape === 'differentialDetector') {
            assert.equal(port(role(graph, 'detectorDiode'), 1)[1], port(role(graph, 'referenceDiode'), 1)[1]);
            assert.ok(middle(role(graph, 'biasResistor'), 1) < middle(role(graph, 'detectorDiode'), 1));
            assert.ok(port(role(graph, 'sourceGround'), 1)[1] < middle(role(graph, 'biasJunction'), 1));
            assert.ok(middle(role(graph, 'source'), 0) > middle(role(graph, 'supplyBypass'), 0));
        }
    });

    test(shape + ' supports reordered rows, renamed nodes and unequal component captions', () => {
        setup();
        const record = {...nP.D({model: 'SMS7630'}).model, name: 'Detector with a longer device name'};
        const network = build(record), rows = rowsOf(network);
        if (shape === 'differentialDetector') {
            const reference = rows.findLastIndex(([part]) => part._schematic.symbol === 'schottky-diode');
            rows[reference][0] = nP.D({model: 'SMS7621'});
        }
        const renamed = value => 'circuit_' + value;
        const changed = nP.nodal(...rows.reverse().map(([part, ...nodes]) => [part, ...nodes.map(renamed)]), ['out', renamed('rf')]);
        const graph = schematicGraph(changed);
        assert.equal(graph.shape, shape); assertConnectivity(graph, changed);
        const svg = schematicSvg(changed);
        assert.match(svg, /Detector with a longer device name/);
        assert.match(svg, /rx="12"/);
        assert.match(svg, /font-size="16">circuit_/);
        assert.doesNotMatch(svg, /NaN|Infinity/);
    });
}

test('detector variants accept direct input, resistive return and no supply bypass', () => {
    setup();
    const single = singleDetector(), rows = rowsOf(single);
    const directRows = rows.slice(1).map(([part, ...nodes]) => part._schematic.symbol === 'inductor' ? [nP.R(50), ...nodes] : [part, ...nodes]);
    const direct = nP.nodal(...directRows, ['out', 'input']);
    assert.equal(schematicGraph(direct).shape, 'diodeDetector');
    const dual = differentialDetector();
    const basicRows = rowsOf(dual).filter(([, ...nodes]) => !nodes.includes('decouple') && !nodes.includes('decoupleGround'))
        .map(([part, ...nodes]) => [part, ...nodes.map(n => n === 'supplyTap' ? 'supply' : n)]);
    const basic = nP.nodal(...basicRows, ['out', 'rf']);
    const graph = schematicGraph(basic);
    assert.equal(graph.shape, 'differentialDetector'); assertConnectivity(graph, basic);
});

test('detector can terminate a composed RF path without inventing an RF output', () => {
    setup();
    const detector = singleDetector();
    const network = nP.nodal({series: [[nP.R(50), 'external', 'rf']]}, {diodeDetector: rowsOf(detector)}, ['out', 'external']);
    const graph = schematicGraph(network);
    assert.equal(graph.shape, 'composite');
    assert.deepEqual(graph.board.sections.map(section => section.name), ['series', 'diodeDetector']);
    assertConnectivity(graph, network);
    const explicit = schematicGraph(network, {shapes: [
        {name: 'series', from: 'external', to: 'rf'},
        {name: 'diodeDetector', from: 'rf', to: []}
    ]});
    assertConnectivity(explicit, network);
    const series = nP.nodal([nP.R(50), 1, 2], ['out', 1, 2]);
    assert.throws(() => schematicGraph(series, {shapes: [{name: 'series', from: 1, to: []}]}), /needs 1 node|fit/);
});

test('engineering units and named labels are formatted without changing electrical data', () => {
    setup();
    const network = singleDetector(), before = JSON.stringify(network);
    const svg = schematicSvg(network);
    assert.match(svg, /C1 = 1 nF/); assert.match(svg, /L1 = 1 µH/); assert.match(svg, /R1 = 10 kΩ/);
    assert.equal(JSON.stringify(network), before);
    const r = nP.R(999.9);
    assert.match(schematicSvg(r), /1 kΩ/);
    const drawing = {paths: ['1234567 right R1=R 9876543']};
    const wideLabel = schematicSvg(drawing).match(/width="(\d+)" height="24" rx="12"/);
    assert.ok(wideLabel && Number(wideLabel[1]) >= 7 * 5 + 16);
    assert.match(schematicSvg(drawing), />1234567<\/text>/);
});
