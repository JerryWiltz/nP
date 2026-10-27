// Modified: 2026-10-27
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DOMParser} from '@xmldom/xmldom';
import * as nP from '../src/index.js';
import {schematicGraph, schematicSvg, schematicTopology} from '../src/np-chart/src/schematic.js';
import {schematicSymbols} from '../src/np-chart/src/schematicSymbols.js';

test('a cascaded resistor pair and right bend retains its parts and renders one SVG', () => {
    nP.global.fList = [2e9];
    const r1 = nP.R(25);
    const r2 = nP.R(50);
    const bend = nP.mbend();
    const circuit = r1.cas(r2).cas(bend);

    assert.equal(circuit._schematic.kind, 'cascade');
    assert.equal(circuit._schematic.left.kind, 'cascade');
    const svg = schematicSvg(circuit);
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const text = Array.from(document.getElementsByTagName('text'), element => element.textContent);

    assert.equal(document.documentElement.tagName, 'svg');
    assert.equal(document.getElementsByTagName('parsererror').length, 0);
    assert.ok(text.includes('R1 = 25 Ω'));
    assert.ok(text.includes('R2 = 50 Ω'));
    assert.ok(text.includes('MB1'));
    assert.ok(text.includes('Port 1'));
    assert.ok(text.includes('Port 2'));
    assert.equal(document.getElementsByTagName('rect').length, 1);
    assert.match(svg, /M0 0 L60 0/);
    assert.match(svg, /M320 60 L320 120/);

    const graph = schematicGraph(circuit);
    assert.equal(graph.kind, 'rf-cascade');
    assert.ok(graph.viewBox.every(value => value % 20 === 0));
    assert.ok(graph.viewBox[2] > 0 && graph.viewBox[3] > 0);
    assert.deepEqual(graph.components.map(component => component.id), ['R1', 'R2', 'MB1']);
    assert.deepEqual(graph.components[2].ports[1], {port: 2, node: 4, at: [320, 60]});
    assert.deepEqual(graph.connections, [
        {node: 2, from: {component: 'R1', port: 2}, to: {component: 'R2', port: 1}},
        {node: 3, from: {component: 'R2', port: 2}, to: {component: 'MB1', port: 1}}
    ]);
    assert.deepEqual(graph.externalPorts.map(port => port.node), [1, 4]);
    assert.equal(graph.construction.left.kind, 'cascade');
    assert.equal(graph.construction.right.id, 'MB1');

    const topology = schematicTopology(circuit);
    assert.deepEqual(topology.parts, [
        {id: 'R1', type: 'resistor', value: 25},
        {id: 'R2', type: 'resistor', value: 50},
        {id: 'MB1', type: 'microstrip-right-bend', value: null}
    ]);
    assert.deepEqual(topology.connections, [
        ['Port 1', 'R1.1'],
        ['R1.2', 'R2.1'],
        ['R2.2', 'MB1.1'],
        ['MB1.2', 'Port 2']
    ]);
    assert.deepEqual(Object.keys(topology), ['parts', 'connections']);
    assert.deepEqual(JSON.parse(JSON.stringify(topology)), topology);
    assert.deepEqual(JSON.parse(JSON.stringify(graph)), graph);
});

test('the bundled paths match their canonical RF symbols', () => {
    const cascade = readFileSync(new URL('../schematics/symbols/cascade.svg', import.meta.url), 'utf8');
    const resistor = readFileSync(new URL('../schematics/symbols/resistor.svg', import.meta.url), 'utf8');
    const bend = readFileSync(new URL('../schematics/symbols/microstrip-right-bend.svg', import.meta.url), 'utf8');
    const leftBend = readFileSync(new URL('../schematics/symbols/microstrip-left-bend.svg', import.meta.url), 'utf8');
    const tee = readFileSync(new URL('../schematics/symbols/tee.svg', import.meta.url), 'utf8');
    const line = readFileSync(new URL('../schematics/symbols/transmission-line.svg', import.meta.url), 'utf8');
    assert.ok(cascade.includes('M80 80 H100 M180 80 H200'));
    assert.ok(cascade.includes('<rect x="100" y="60" width="80" height="40"/>'));
    assert.ok(cascade.includes('>cascade</text>'));
    assert.ok(resistor.includes(schematicSymbols.resistor.geometry));
    assert.ok(bend.includes('M40 67 H53 V80 H67 V60 L60 53 H40 Z'));
    assert.ok(bend.includes('M0 60 H20 M60 100 V120'));
    assert.ok(leftBend.includes('M40 53 H53 V40 H67 V60 L60 67 H40 Z'));
    assert.ok(leftBend.includes('M0 60 H20 M60 0 V20'));
    assert.ok(tee.includes(schematicSymbols.tee.geometry));
    assert.ok(line.includes('<path d="M80 90 H100 M180 90 H200"/>'));
});

test('Wilkinson nodal connections produce a three-port schematic and topology', () => {
    nP.global.fList = [6e9];
    const input = nP.Tee();
    const upper = nP.Tlin(70.7, 0.49 * 0.0254);
    const lower = nP.Tlin(70.7, 0.49 * 0.0254);
    const output1 = nP.Tee();
    const output2 = nP.Tee();
    const resistor = nP.R(100);
    const divider = nP.nodal(
        [input, 1, 2, 3],
        [upper, 2, 4],
        [lower, 3, 5],
        [output1, 6, 4, 7],
        [output2, 8, 5, 9],
        [resistor, 6, 8],
        ['out', 1, 7, 9]
    );
    assert.equal(divider._schematic.kind, 'nodal');
    assert.deepEqual(divider._schematic.externalNodes, [1, 7, 9]);
    assert.deepEqual(divider._schematic.components[1].nodes, [2, 4]);
    const graph = schematicGraph(divider);
    const topology = schematicTopology(divider);
    const svg = schematicSvg(divider);
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    assert.equal(document.getElementsByTagName('parsererror').length, 0);
    assert.equal(graph.kind, 'rf-nodal');
    assert.equal(graph.components.length, 6);
    assert.deepEqual(graph.externalPorts.map(port => port.node), [1, 7, 9]);
    assert.deepEqual(graph.components[4].ports.map(port => port.node), [8, 5, 9]);
    assert.deepEqual(topology.connections.find(connection => connection.node === 6).ports,
        ['TEE2.1', 'R1.1']);
    assert.deepEqual(topology.connections.find(connection => connection.node === 8).ports,
        ['TEE3.1', 'R1.2']);
    assert.ok(svg.includes('Port 3'));
    assert.deepEqual(JSON.parse(JSON.stringify(graph)), graph);
    assert.deepEqual(JSON.parse(JSON.stringify(topology)), topology);
});

test('two uses of a completed cascade render as separate two-port blocks', () => {
    nP.global.fList = [2e9];
    const r1 = nP.R(25);
    const circuit = r1.cas(nP.R(50)).cas(nP.mbend({turn: 'left'})).cas(r1);
    const detailedSvg = schematicSvg(circuit);
    const doubled = circuit.cas(circuit);
    const options = {view: 'blocks'};
    const graph = schematicGraph(doubled, options);
    const topology = schematicTopology(doubled, options);
    const svg = schematicSvg(doubled, options);

    assert.deepEqual(graph.components.map(component => component.id), ['CAS1', 'CAS2']);
    assert.deepEqual(graph.components.map(component => component.symbol), ['cascade', 'cascade']);
    assert.deepEqual(graph.components.map(component => component.rotation), [0, 0]);
    assert.deepEqual(graph.components[0].ports[1].at, graph.components[1].ports[0].at);
    assert.deepEqual(graph.construction, {
        kind: 'cascade', left: {kind: 'component', id: 'CAS1'},
        right: {kind: 'component', id: 'CAS2'}
    });
    assert.deepEqual(topology.parts, [
        {id: 'CAS1', type: 'cascade', value: null},
        {id: 'CAS2', type: 'cascade', value: null}
    ]);
    assert.deepEqual(topology.connections, [
        ['Port 1', 'CAS1.1'], ['CAS1.2', 'CAS2.1'], ['CAS2.2', 'Port 2']
    ]);
    assert.equal((svg.match(/>cascade<\/text>/g) || []).length, 2);
    assert.equal(schematicSvg(circuit), detailedSvg);
    assert.throws(() => schematicSvg(doubled, {view: 'nodal'}), /view must be/);
});

test('a bend between reused cascade blocks rotates the second block', () => {
    nP.global.fList = [2e9];
    const r1 = nP.R(25);
    const block = r1.cas(nP.R(50)).cas(nP.mbend({turn: 'left'})).cas(r1);
    const circuit = block.cas(nP.mbend({turn: 'left'})).cas(block);
    const graph = schematicGraph(circuit, {view: 'blocks'});
    assert.deepEqual(graph.components.map(component => component.symbol),
        ['cascade', 'microstrip-left-bend', 'cascade']);
    assert.deepEqual(graph.components.map(component => component.rotation), [0, 0, 270]);
    assert.deepEqual(graph.components[1].ports[1].at, graph.components[2].ports[0].at);
    assert.deepEqual(schematicTopology(circuit, {view: 'blocks'}).parts.map(part => part.type),
        ['cascade', 'microstrip-left-bend', 'cascade']);
});

test('a left bend turns the drawing upward without changing the RF model', () => {
    nP.global.fList = [2e9];
    const right = nP.mbend();
    const left = nP.mbend({turn: 'left'});
    assert.deepEqual(left.spars, right.spars);
    assert.equal(left.microstrip.turn, 'left');
    assert.equal(right.microstrip.turn, 'right');
    assert.throws(() => nP.mbend({turn: 'up'}), /turn must be/);

    const r1 = nP.R(25);
    const circuit = r1.cas(nP.R(50)).cas(left).cas(r1);
    const graph = schematicGraph(circuit);
    assert.equal(graph.components[2].symbol, 'microstrip-left-bend');
    assert.equal(graph.components[3].rotation, 270);
    assert.deepEqual(graph.components[2].ports[1].at, [320, -60]);
    assert.deepEqual(graph.components[3].ports[0].at, [320, -60]);
    assert.deepEqual(graph.components[3].ports[1].at, [320, -160]);
    assert.deepEqual(graph.nodeNumbers.slice(0, 3).map(number => number.at[1]),
        Array(3).fill(graph.nodeNumbers[0].at[1]));
    assert.ok(graph.nodeNumbers[0].at[1] < graph.nodes[0].at[1]);
    graph.nodeNumbers.slice(0, 3).forEach((number, index) =>
        assert.equal(number.at[0], graph.nodes[index].at[0]));
    assert.equal(graph.nodes[0].at[1] - graph.nodeNumbers[0].at[1], 40);
    assert.equal(graph.nodeNumbers[3].at[0], graph.nodeNumbers[4].at[0]);
    assert.ok(graph.nodeNumbers[3].at[0] > graph.nodes[3].at[0]);
    graph.nodeNumbers.slice(3).forEach((number, index) =>
        assert.equal(number.at[1], graph.nodes[index + 3].at[1]));
    assert.ok(schematicSvg(circuit).includes(schematicSymbols['microstrip-left-bend'].geometry));
    assert.deepEqual(schematicTopology(circuit).parts[2],
        {id: 'MB1', type: 'microstrip-left-bend', value: null});
});

test('reusing a resistor after a bend creates a rotated second placement', () => {
    nP.global.fList = [2e9];
    const r1 = nP.R(25);
    const r2 = nP.R(50);
    const bend = nP.mbend();
    const circuit = r1.cas(r2).cas(bend).cas(r1);
    const graph = schematicGraph(circuit);
    const topology = schematicTopology(circuit);

    assert.deepEqual(graph.components.map(component => component.id), ['R1', 'R2', 'MB1', 'R3']);
    assert.equal(graph.components[3].value, 25);
    assert.equal(graph.components[3].rotation, 90);
    assert.deepEqual(graph.components[3].ports[0].at, [320, 60]);
    assert.deepEqual(graph.components[3].ports[1].at, [320, 160]);
    assert.equal(graph.construction.right.id, 'R3');
    assert.deepEqual(topology.parts[3], {id: 'R3', type: 'resistor', value: 25});
    assert.deepEqual(topology.connections.slice(-2), [
        ['MB1.2', 'R3.1'],
        ['R3.2', 'Port 2']
    ]);
    const svg = schematicSvg(circuit);
    assert.match(svg, /R3 = 25 Ω/);
    assert.equal(graph.nodeNumbers.length, graph.nodes.length);
    assert.ok(graph.nodeNumbers.every(number => number.at.every(value => value % 20 === 0)));
});

function overlaps(a, b, clearance = 0) {
    return a[0] < b[2] + clearance && a[2] > b[0] - clearance &&
        a[1] < b[3] + clearance && a[3] > b[1] - clearance;
}

function boundsGap(a, b) {
    return Math.hypot(Math.max(0, b[0] - a[2], a[0] - b[2]),
        Math.max(0, b[1] - a[3], a[1] - b[3]));
}

test('annotations remain clear and inside the viewBox for longer cascades and turns', () => {
    nP.global.fList = [2e9];
    const resistor = nP.R(50);
    const bend = nP.mbend();
    const leftBend = nP.mbend({turn: 'left'});
    const scenarios = [
        [resistor, bend, resistor, bend, resistor, bend, resistor],
        [resistor, leftBend, resistor, bend, resistor],
        Array.from({length: 10}, () => resistor)
    ];
    for (const parts of scenarios) {
        const circuit = parts.slice(1).reduce((network, part) => network.cas(part), parts[0]);
        const graph = schematicGraph(circuit);
        const [left, top, width, height] = graph.viewBox;
        const annotations = graph.nodeNumbers.concat(graph.labels);
        const ink = graph.components.flatMap(component => component.inkBounds);
        const wires = graph.wires.map(wire => [
            Math.min(wire.from[0], wire.to[0]) - 2,
            Math.min(wire.from[1], wire.to[1]) - 2,
            Math.max(wire.from[0], wire.to[0]) + 2,
            Math.max(wire.from[1], wire.to[1]) + 2
        ]);
        for (const annotation of annotations) {
            const bounds = annotation.bounds;
            assert.ok(bounds[0] >= left + 40 && bounds[1] >= top + 40);
            assert.ok(bounds[2] <= left + width - 40 && bounds[3] <= top + height - 40);
            assert.ok(!ink.concat(wires).some(box => overlaps(bounds, box, 8)));
        }
        for (const component of graph.components) {
            const label = graph.labels.find(item => item.text === component.id ||
                item.text.startsWith(`${component.id} =`));
            assert.ok(label, `missing label for ${component.id}`);
            assert.ok(boundsGap(label.bounds, component.bounds) <= 40,
                `${component.id} label is too far from its symbol`);
        }
        for (let index = 0; index < annotations.length; index++) {
            for (let other = index + 1; other < annotations.length; other++) {
                assert.ok(!overlaps(annotations[index].bounds, annotations[other].bounds, 8));
            }
        }
        assert.equal(new DOMParser().parseFromString(schematicSvg(circuit), 'image/svg+xml')
            .getElementsByTagName('parsererror').length, 0);
    }
});

test('component labels stay with their symbols when nodes compete for space', () => {
    nP.global.fList = [2e9];
    const r1 = nP.R(25);
    const graph = schematicGraph(r1.cas(nP.R(50)).cas(nP.mbend()).cas(r1));
    for (const component of graph.components) {
        const label = graph.labels.find(item => item.text === component.id ||
            item.text.startsWith(`${component.id} =`));
        assert.ok(boundsGap(label.bounds, component.bounds) <= 40);
    }
});

test('separate horizontal and vertical runs keep their own aligned number groups', () => {
    nP.global.fList = [2e9];
    const resistor = nP.R(50);
    const circuit = resistor.cas(nP.mbend({turn: 'left'})).cas(resistor)
        .cas(nP.mbend()).cas(resistor);
    const graph = schematicGraph(circuit);
    const numbers = graph.nodeNumbers;
    assert.equal(numbers[0].at[1], numbers[1].at[1]);
    assert.equal(numbers[2].at[0], numbers[3].at[0]);
    assert.equal(numbers[4].at[1], numbers[5].at[1]);
    graph.nodes.forEach((node, index) => {
        const isVertical = index === 2 || index === 3;
        assert.equal(numbers[index].at[isVertical ? 1 : 0], node.at[isVertical ? 1 : 0]);
    });
});

test('unsupported nPorts report missing drawing metadata', () => {
    nP.global.fList = [2e9];
    assert.throws(() => schematicSvg({}), /schematic metadata/);
});

test('schematic labels default to three significant digits without changing circuit values', () => {
    nP.global.fList = [2e9];
    const inductor = nP.L(4.565360855435164e-8);
    const defaultGraph = schematicGraph(inductor);
    const detailedGraph = schematicGraph(inductor, {significantDigits: 5});

    assert.ok(defaultGraph.labels.some(label => label.text === 'L1 = 4.57e-8 H'));
    assert.ok(detailedGraph.labels.some(label => label.text === 'L1 = 4.5654e-8 H'));
    assert.equal(defaultGraph.components[0].value, 4.565360855435164e-8);
    assert.throws(() => schematicSvg(inductor, {significantDigits: 0}), /significantDigits/);
});
