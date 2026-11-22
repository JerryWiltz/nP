// Modified: 2026-11-22
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph, schematicTopology} from '../src/np-chart/src/schematic';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';
import {captionBounds} from '../src/np-chart/src/schematicCaptions';

function overlap(a, b) {
    return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
}

function readable(graph) {
    const bodies = graph.board.boxes.filter(box => box.kind === 'component').map(box => box.bounds);
    const captions = graph.labels.slice(0, graph.components.length).map(label => captionBounds(label.text, ...label.at));
    const boxes = bodies.concat(captions);
    for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
        assert.ok(!overlap(boxes[a], boxes[b]), 'component or caption overlap');
    }
    for (const wire of graph.wires) {
        const [a, b] = wire.points;
        assert.ok(a[0] === b[0] || a[1] === b[1]);
        const bounds = [Math.min(a[0], b[0]) - 1, Math.min(a[1], b[1]) - 1,
            Math.max(a[0], b[0]) + 1, Math.max(a[1], b[1]) + 1];
        assert.ok(!boxes.some(box => overlap(box, bounds)), 'wire intersects component or caption');
    }
    assert.ok(graph.components.flatMap(part => part.ports).every(port => port.at.every(value => value % 10 === 0)));
}

function straight(graph, flow) {
    const across = ['left', 'right'].includes(flow) ? 1 : 0;
    const terminals = graph.components.flatMap(part => part.ports).concat(graph.externalPorts);
    assert.equal(new Set(terminals.map(port => port.at[across])).size, 1, 'connected terminal axes must align');
    assert.ok(graph.wires.every(wire => wire.points[0][across] === wire.points[1][across]), 'straight run acquired a jog');
    readable(graph);
}

function withFlow(flow, action) {
    const definition = structuredClone(schematicShapeBoards.generic), name = 'testRunFlow';
    definition.name = name;
    definition.board.flow = flow;
    definition.board.branches = ['left', 'right'].includes(flow) ? 'down' : 'right';
    schematicShapeBoards[name] = definition;
    try { action({shapes: [name]}); }
    finally { delete schematicShapeBoards[name]; }
}

for (const flow of ['right', 'left', 'down', 'up']) test(`automatic straight runs respect terminal axes and clearance; flow ${flow}`, () => {
    nP.global.fList = [10e9];
    for (const reversed of [false, true]) withFlow(flow, options => {
        const parts = [nP.Attn(10), nP.R(123456789), nP.C(.123456e-12), nP.L(5e-9), nP.Short()];
        const nodes = reversed ? [907, 613, 829, 193, 307] : [1, 2, 3, 4, 5];
        const rows = parts.map((part, index) => index === parts.length - 1 ? [part, nodes[index]] : [part, nodes[index], nodes[index + 1]]);
        const network = nP.nodal(...(reversed ? rows.reverse() : rows), ['out', nodes[0]]);
        const before = JSON.stringify(network), topology = schematicTopology(network);
        straight(schematicGraph(network, options), flow);
        assert.equal(JSON.stringify(network), before);
        assert.deepEqual(schematicTopology(network), topology);
    });
});

test('changing only a supplied part name cannot introduce a jog into the noise-source run', () => {
    nP.global.fList = [10e9];
    const template = nP.NoiseDiode().model;
    for (const name of ['ND', 'NC406_REFERENCE', 'Avalanche research reference with a longer label']) {
        const d = nP.NoiseDiode({model: {...template, name}}), pad = nP.Attn(10), short = nP.Short();
        const network = nP.nodal([d, 1, 2], [short, 1], [pad, 2, 3], ['out', 3]);
        straight(schematicGraph(network), 'right');
    }
});

for (const flow of ['right', 'left', 'down', 'up']) test(`straight-run spacing depends on occupied geometry, not coarse packing; ${flow}`, () => {
    nP.global.fList = [10e9];
    const parts = [nP.R(75), nP.Attn(10), nP.C(1e-12), nP.Load(50)];
    const network = nP.nodal([parts[0], 1, 2], [parts[1], 2, 3], [parts[2], 3, 4], [parts[3], 4], ['out', 1]);
    const spans = [];
    for (const gap of [120, 1200]) withFlow(flow, options => {
        schematicShapeBoards.testRunFlow.board.componentGap = gap;
        const graph = schematicGraph(network, options);
        straight(graph, flow);
        const points = graph.components.flatMap(part => part.ports).map(port => port.at);
        spans.push([0, 1].map(axis => Math.max(...points.map(point => point[axis])) - Math.min(...points.map(point => point[axis]))));
    });
    assert.deepEqual(spans[0], spans[1], 'unused coarse-packing gaps survived compaction');
});

test('reused cascade and nodal blocks align with direct parts in the automatic fallback', () => {
    nP.global.fList = [10e9];
    const cascade = nP.cascade(nP.R(25), nP.C(1e-12));
    const block = nP.nodal([nP.R(75), 8, 9], ['out', 8, 9]);
    const pad = nP.Attn(10), short = nP.Short();
    const network = nP.nodal([cascade, 10, 20], [block, 20, 30], [pad, 30, 40], [short, 40], ['out', 10]);
    const graph = schematicGraph(network);
    assert.deepEqual(graph.components.map(part => part.symbol), ['cascade', 'nodal', 'attenuator', 'short']);
    straight(graph, 'right');
});

test('a perpendicular junction branch retains its own axis while the through run aligns', () => {
    nP.global.fList = [10e9];
    const tee = nP.Tee(), pad = nP.Attn(10), r = nP.R(1e12), short = nP.Short();
    const network = nP.nodal([tee, 4, 1, 2], [pad, 2, 3], [r, 4, 5], [short, 5], ['out', 1, 3]);
    const graph = schematicGraph(network, {shapes: ['generic']});
    const junction = graph.components.find(part => part.symbol === 'tee');
    const a = junction.ports[1].at, b = junction.ports[2].at, branch = junction.ports[0].at;
    assert.equal(a[1], b[1]);
    assert.notEqual(branch[1], a[1]);
    readable(graph);
});
