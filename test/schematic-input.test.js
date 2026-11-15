// Modified: 2026-11-14
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {DOMParser} from '@xmldom/xmldom';
import * as nP from '../src/index.js';
import {schematicGraph, schematicSvg, schematicTopology} from '../src/np-chart/src/schematic';
import {parseSchematicInput} from '../src/np-chart/src/schematicInputParser';

function authoringCases() {
    const cases = [];
    const code = readFileSync(new URL('../dev/schematicAuthoring.html', import.meta.url), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
    vm.runInNewContext(code, {nP: {schematic(input, options) { cases.push({input, name: options.mount}); return {}; }}});
    return cases;
}

function assertConnections(graph) {
    for (const node of graph.nodes) {
        const wires = graph.wires.filter(wire => wire.node === node.id), neighbors = new Map();
        for (const wire of wires) {
            const [a, b] = wire.points;
            assert.ok(a[0] === b[0] || a[1] === b[1]);
            assert.notDeepEqual(a, b);
            assert.ok(wire.points.flat().every(value => value % 10 === 0));
            for (const [from, to] of [[a, b], [b, a]]) {
                const key = from.join(',');
                neighbors.set(key, [...(neighbors.get(key) || []), to.join(',')]);
            }
        }
        const terminals = graph.components.flatMap(part => part.ports.filter(port => port.node === node.id));
        const pending = [terminals[0].at.join(',')], seen = new Set();
        while (pending.length) {
            const key = pending.pop(); if (seen.has(key)) continue;
            seen.add(key); pending.push(...(neighbors.get(key) || []));
        }
        assert.ok(terminals.every(terminal => seen.has(terminal.at.join(','))), `node ${node.id} has a disconnected terminal`);
        assert.equal(seen.size, neighbors.size, `node ${node.id} has detached wire fragments`);
    }
    assert.ok(graph.board.boxes.every(box => !Object.hasOwn(box, 'nodeDot')));
}

for (const {input, name} of authoringCases()) {
    test(`authored drawing ${name} has connected, grid-aligned wires and safe SVG`, () => {
        const before = JSON.stringify(input), graph = schematicGraph(input), svg = schematicSvg(input);
        assert.equal(graph.kind, 'schematic-input');
        assertConnections(graph);
        assert.equal(new DOMParser().parseFromString(svg, 'image/svg+xml').getElementsByTagName('parsererror').length, 0);
        assert.doesNotMatch(svg, /<(?:script|image|foreignObject)\b|\bon\w+\s*=|\b(?:href|src)\s*=/i);
        assert.equal(JSON.stringify(input), before);
    });
}

test('Figure 1 preserves polarity, matching component heights, two inward arrows and return-node references', () => {
    const {input} = authoringCases()[0], graph = schematicGraph(input);
    const source = graph.components.find(part => part.id === 'Vin'), load = graph.components.find(part => part.id === 'R6');
    assert.equal(source.ports[0].node, 1);
    assert.equal(source.ports[1].node, 4);
    assert.ok(source.ports[0].at[1] < source.ports[1].at[1]);
    assert.equal(source.ports[0].at[1], load.ports[0].at[1]);
    assert.equal(graph.annotations.find(item => item.label === 'I1').end[0] > graph.annotations.find(item => item.label === 'I1').start[0], true);
    assert.equal(graph.annotations.find(item => item.label === 'I2').end[0] < graph.annotations.find(item => item.label === 'I2').start[0], true);
    assert.deepEqual(graph.externalPorts.map(port => [port.port, port.node, port.reference]), [[1, 2, 4], [2, 3, 4]]);
    assert.ok(graph.labels.find(label => label.text === 'Port 1').at[0] < graph.externalPorts[0].at[0]);
    assert.ok(graph.labels.find(label => label.text === 'Port 2').at[0] > graph.externalPorts[1].at[0]);
    const box = graph.annotations.find(item => item.type === 'rectangle');
    assert.ok(box.bounds[3] > Math.max(...graph.wires.filter(wire => wire.node === 4).flatMap(wire => wire.points.map(point => point[1]))));
    assert.ok(graph.labels.some(label => label.text === 'R5 = 75 Ω'));
});

test('related annotations keep shared baselines while clearing an asymmetric enclosure', () => {
    const {input} = authoringCases()[0];
    const graph = schematicGraph(input);
    for (const labels of [['V1', 'V2'], ['I1', 'I2']]) {
        const pair = labels.map(text => graph.annotations.find(item => item.label === text));
        assert.equal((pair[0].at || pair[0].start)[1], (pair[1].at || pair[1].start)[1]);
        if (pair[0].labelAt) assert.equal(pair[0].labelAt[1], pair[1].labelAt[1]);
    }
    assert.equal(graph.nodes.find(node => node.id === 2).numberAt[1], graph.nodes.find(node => node.id === 3).numberAt[1]);
    assert.equal(graph.labels.find(label => label.text === 'Port 1').at[1], graph.labels.find(label => label.text === 'Port 2').at[1]);
    const [x, y, right, bottom] = graph.annotations.find(item => item.type === 'rectangle').bounds;
    const borders = [[x, y, right, y], [right, y, right, bottom], [x, bottom, right, bottom], [x, y, x, bottom]];
    const boxes = graph.annotations.filter(item => item.type !== 'rectangle').map(item => item.bounds)
        .concat(graph.nodes.map(node => [node.numberAt[0] - 12, node.numberAt[1] - 12, node.numberAt[0] + 12, node.numberAt[1] + 12]),
            graph.labels.map(label => [label.at[0] - Math.ceil(label.text.length * 9 / 2), label.at[1] - 16,
                label.at[0] + Math.ceil(label.text.length * 9 / 2), label.at[1] + 4]));
    for (const [index, box] of boxes.entries()) {
        for (const other of borders.concat(boxes.slice(index + 1))) {
            assert.ok(!(box[0] < other[2] + 8 && box[2] > other[0] - 8 && box[1] < other[3] + 8 && box[3] > other[1] - 8),
                'annotation overlaps another annotation or the enclosure boundary');
        }
    }
});

test('vertical rows align labels of different lengths and arrows without name-specific rules', () => {
    const input = {paths: ['1 down A=R 2', '2 down B=R 3'], annotations: [
        {type: 'label', node: 1, label: 'First voltage', position: 'right'},
        {type: 'label', node: 2, label: 'V', position: 'right'},
        {type: 'arrow', node: 1, toward: 'A', label: 'Current A', position: 'left'},
        {type: 'arrow', node: 2, toward: 'B', label: 'I', position: 'left'},
        {type: 'port', number: 1, node: 1, side: 'top'},
        {type: 'port', number: 2, node: 3, side: 'bottom'}
    ]};
    const graph = schematicGraph(input);
    assertConnections(graph);
    const labels = graph.annotations.filter(item => item.type === 'label');
    const arrows = graph.annotations.filter(item => item.type === 'arrow');
    assert.equal(labels[0].at[0], labels[1].at[0]);
    assert.equal(arrows[0].start[0], arrows[1].start[0]);
    assert.equal(graph.labels.find(label => label.text === 'Port 1').at[0], graph.labels.find(label => label.text === 'Port 2').at[0]);
    assert.ok(graph.nodes.every(node => node.numberAt[0] === graph.nodes[0].numberAt[0]));
    assert.equal(schematicSvg({...input, annotations: [...input.annotations].reverse()}).includes('<svg'), true);
});

test('declaration order does not change Figure 1 geometry or SVG', () => {
    const {input} = authoringCases()[0];
    const reordered = {...input, paths: [...input.paths].reverse()};
    assert.equal(schematicSvg(reordered), schematicSvg(input));
});

test('full multiport assignments and reflection preserve canonical terminal identities', () => {
    const normal = schematicGraph(authoringCases()[3].input), mirrored = schematicGraph(authoringCases()[4].input);
    const a = normal.components.find(part => part.id === 'CL1'), b = mirrored.components.find(part => part.id === 'CL1');
    assert.deepEqual(a.ports.map(port => port.node), [1, 10, 2, 11]);
    assert.deepEqual(b.ports.map(port => port.node), [1, 10, 2, 11]);
    assert.equal(Math.sign(a.ports[2].at[1] - a.ports[0].at[1]), -Math.sign(b.ports[2].at[1] - b.ports[0].at[1]));
});

test('a branchline-style rectangular network follows only paths, terminal lists and mirrors', () => {
    const input = {paths: [
        '1 right T1=Tee[1,2,3] 5 1 2', '3 right T2=Tee[1,2,3] 6 3 4',
        '9 right T3=Tee[1,2,3] 7 9 10 mirror', '11 right T4=Tee[1,2,3] 8 11 12 mirror',
        '2 right L1=Tlin 3', '5 down L2=Tlin 7', '6 down L3=Tlin 8', '10 right L4=Tlin 11'
    ]};
    const graph = schematicGraph(input);
    assertConnections(graph);
    const part = id => graph.components.find(item => item.id === id);
    assert.equal(part('T1').at[1], part('T2').at[1]);
    assert.equal(part('T3').at[1], part('T4').at[1]);
    assert.equal(part('T1').at[0], part('T3').at[0]);
    assert.equal(part('T2').at[0], part('T4').at[0]);
});

test('raw wire junctions can join three component terminals without a tee symbol', () => {
    const graph = schematicGraph({paths: [
        '6 up Vin=V[1,2] 1 6', '1 right R1=R 2', '2 right R5=R 3',
        '3 down R6=R 4', '4 left R7=R 5', '5 left R3=R 6', '2 down R2=R 5'
    ]});
    assertConnections(graph);
    assert.equal(graph.nodes.length, 6);
    assert.deepEqual(graph.junctions.map(junction => junction.node).sort(), [2, 5]);
});

test('captions are literal text, not evaluated JavaScript, and are XML escaped', () => {
    const input = {paths: ['1 right R1=R(<script>alert(1)</script>) 2']};
    assert.match(schematicSvg(input), /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.equal(parseSchematicInput(input).parts[0].caption, '<script>alert(1)</script>');
});

test('long paths and optional terminal-targeted arrows use the same parser and layout', () => {
    const graph = schematicGraph({paths: ['1 right R1=R 2 R2=R 3'], annotations: [
        {type: 'arrow', node: 2, toward: 'R2.1', label: 'I', position: 'below'}
    ]});
    assertConnections(graph);
    assert.equal(graph.components.length, 2);
    assert.ok(graph.annotations[0].end[0] > graph.annotations[0].start[0]);
});

test('open paths require neither sources, frequency rows nor implicit closure', () => {
    const frequencies = nP.global.fList; nP.global.fList = [];
    try {
        const graph = schematicGraph({paths: ['45 right R1=R 37', '37 right R2=R 1'], annotations: [
            {type: 'port', number: 1, node: 45, side: 'left'}, {type: 'port', number: 2, node: 1, side: 'right'}
        ]});
        assert.equal(graph.components.length, 2);
        assert.deepEqual(graph.externalPorts.map(port => [port.port, port.node]), [[1, 45], [2, 1]]);
        assert.equal(schematicTopology({paths: ['1 right R1=R 2']}).parts.length, 1);
    } finally { nP.global.fList = frequencies; }
});

test('invalid declarations, references, annotations and geometric conflicts produce useful errors', () => {
    for (const [input, pattern] of [
        [{paths: ['1 right R1=Unknown 2']}, /Path line 1.*unknown symbol/],
        [{paths: ['1 right R1=R 2', '2 right R1=R 3']}, /Path line 2.*duplicate/],
        [{paths: ['1 right T1=Tee4[1,2,3,4] 1 2 3']}, /Path line 1.*requires 4.*received 3/],
        [{paths: ['1 right T1=Tee[1,1,3] 1 2 3']}, /distinct terminal/],
        [{paths: ['1 right R1=R 2', 'alignY R1.1 Missing.1']}, /Path line 2.*unknown component terminal/],
        [{paths: ['1 right R1=R 2', 'alignX R1.1 R1.2']}, /conflicting alignment/],
        [{paths: ['1 right R1=R 2'], annotations: [{type: 'arrow', node: 1, toward: 'missing', label: 'I'}]}, /arrow target/],
        [{paths: ['1 right R1=R 2'], annotations: [{type: 'label', node: 9, label: 'V'}]}, /unknown node/]
    ]) assert.throws(() => schematicGraph(input), pattern);
});
