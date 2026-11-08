// Modified: 2026-11-08
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph, schematicSvg, schematicTopology} from '../src/np-chart/src/schematic.js';
import {buildSchematicStressCases} from '../dev/schematicStressCases.js';
import {buildSchematicCases} from '../dev/schematicCases.js';

function onSegment(point, start, end) {
    return (start[0] === end[0] && point[0] === start[0] &&
        point[1] >= Math.min(start[1], end[1]) && point[1] <= Math.max(start[1], end[1])) ||
        (start[1] === end[1] && point[1] === start[1] &&
        point[0] >= Math.min(start[0], end[0]) && point[0] <= Math.max(start[0], end[0]));
}

function assertNodesOnWires(graph) {
    for (const node of graph.nodes) {
        const wire = graph.wires.find(candidate => candidate.node === node.id &&
            candidate.points.slice(1).some((point, index) =>
                onSegment(node.at, candidate.points[index], point)));
        assert.ok(wire, `node ${node.id} is not on its wire`);
        assert.ok(node.at.every(value => value % 10 === 0));
    }
}

function vnaFixture(offset = 0, reverseEntries = false) {
    nP.global.fList = [2e9];
    const splitter = nP.Coupler180();
    const inputCoupler = nP.Coupler180();
    const inductor = nP.L(5e-9);
    const outputCoupler = nP.Coupler180();
    const loads = Array.from({length: 4}, () => nP.Load());
    const entries = [
        [splitter, 1, 2, 3, 4],
        [inputCoupler, 2, 5, 6, 7],
        [inductor, 5, 8],
        [outputCoupler, 8, 9, 10, 11],
        [loads[0], 3],
        [loads[1], 7],
        [loads[2], 9],
        [loads[3], 10]
    ];
    const rows = (reverseEntries ? entries.reverse() : entries)
        .map(entry => [entry[0], ...entry.slice(1).map(node => node + offset)]);
    rows.push(['out', 1 + offset, 4 + offset, 6 + offset, 11 + offset]);
    return nP.nodal(...rows);
}

test('a multiport tree uses connected couplers, inductor, and termination branches', () => {
    const graph = schematicGraph(vnaFixture());
    assert.equal(graph.components.length, 8);
    assert.equal(graph.externalPorts.length, 4);
    assert.deepEqual(graph.components.slice(0, 4).map(part => part.symbol),
        ['coupler-180', 'coupler-180', 'inductor', 'coupler-180']);
    assert.ok(graph.components.slice(0, 4).every((part, index, parts) =>
        index === 0 || part.ports[0].at[0] > parts[index - 1].ports[0].at[0]));
    assert.equal(graph.board.interpreter, 'ORI');
    assert.ok(graph.viewBox[2] > 0 && graph.viewBox[3] > 0);
    assertNodesOnWires(graph);
    assert.match(schematicSvg(vnaFixture()), /COUPLER3/);
});

test('multiport layout follows connections when entries and node numbers change', () => {
    const circuit = vnaFixture(100, true);
    const graph = schematicGraph(circuit);
    assert.deepEqual(graph.components.map(part => part.ports.map(port => port.node)),
        circuit._schematic.components.map(entry => entry.nodes));
    assert.equal(graph.board.interpreter, 'ORI');
    assert.deepEqual(graph.externalPorts.map(port => port.node), [101, 104, 106, 111]);
    assertNodesOnWires(graph);
});

test('a three-port tree places two transmission branches without node rails', () => {
    nP.global.fList = [2e9];
    const tee = nP.Tee();
    const first = nP.Tlin(50, 0.0254);
    const second = nP.Tlin(50, 0.0254);
    const circuit = nP.nodal(
        [tee, 1, 2, 3],
        [first, 2, 4],
        [second, 3, 5],
        ['out', 1, 4, 5]
    );
    const graph = schematicGraph(circuit);
    assert.equal(graph.components.length, 3);
    assert.equal(graph.externalPorts.length, 3);
    assert.equal(graph.board.interpreter, 'ORI');
    assertNodesOnWires(graph);
    const analysis = schematicTopology(circuit).loopAnalysis;
    assert.equal(analysis.hasLoops, false);
    assert.equal(analysis.spanningTree.length, 7);
    assert.deepEqual(analysis.closingEdges, []);
    assert.deepEqual(analysis.cycles, []);
});

test('a standalone four-port sends each external wire outward without joining ports', () => {
    nP.global.fList = [2e9];
    const graph = schematicGraph(nP.Tclin(100, 30, 0.0373));
    assert.equal(graph.externalPorts.length, 4);
    for (const port of graph.externalPorts) {
        const terminal = graph.components[0].ports.find(item => item.node === port.node);
        assert.equal(port.at[1], terminal.at[1]);
        assert.equal(Math.abs(port.at[0] - terminal.at[0]), 80);
    }
    assert.ok(graph.wires.every(wire => wire.points.length === 2 &&
        wire.points[0][1] === wire.points[1][1]));
    assertNodesOnWires(graph);
});

test('a loop connects both branches between its tee junctions', () => {
    nP.global.fList = [2e9];
    const firstTee = nP.Tee();
    const secondTee = nP.Tee();
    const firstResistor = nP.R(50);
    const secondResistor = nP.R(100);
    const circuit = nP.nodal(
        [firstTee, 1, 2, 3],
        [firstResistor, 2, 5],
        [secondResistor, 3, 6],
        [secondTee, 4, 5, 6],
        ['out', 1, 4]
    );

    const graph = schematicGraph(circuit);
    const loops = schematicTopology(circuit).loopAnalysis;
    assert.equal(loops.hasLoops, true);
    assert.equal(loops.closingEdges.length, 1);
    assert.deepEqual(loops.cycles[0].at(-1), loops.closingEdges[0]);
    assert.deepEqual(new Set(loops.cycles[0].map(edge => edge.component)), new Set([1, 2, 3, 4]));
    assert.equal(graph.layout, 'generic');
    assert.deepEqual(graph.components.map(component => component.ports.map(port => port.node)),
        circuit._schematic.components.map(entry => entry.nodes));
    assert.deepEqual(graph.externalPorts.map(port => port.node), circuit._schematic.externalNodes);
    const terminals = graph.externalPorts.concat(graph.components.flatMap(component => component.ports));
    for (const terminal of terminals) {
        assert.ok(graph.wires.some(wire => wire.node === terminal.node &&
            (wire.points[0][0] === terminal.at[0] && wire.points[0][1] === terminal.at[1] ||
            wire.points.at(-1)[0] === terminal.at[0] &&
            wire.points.at(-1)[1] === terminal.at[1])));
    }
    assert.equal(graph.nodes.filter(node => node.id === 2).length, 1);
    assertNodesOnWires(graph);
    assert.match(schematicSvg(circuit), /TEE1/);
});

test('loop analysis finds multiple cycles through shared nodes without needing tees', () => {
    nP.global.fList = [2e9];
    const circuit = nP.nodal(
        [nP.R(50), 45, 37],
        [nP.R(75), 45, 37],
        [nP.R(100), 45, 37],
        ['out', 45, 37]
    );
    const analysis = schematicTopology(circuit).loopAnalysis;
    assert.equal(schematicGraph(circuit).layout, 'generic');
    assert.equal(analysis.hasLoops, true);
    assert.equal(analysis.spanningTree.length, 4);
    assert.deepEqual(analysis.closingEdges, [
        {component: 2, port: 2, node: 37},
        {component: 3, port: 2, node: 37}
    ]);
    assert.equal(analysis.cycles.length, 2);
    assert.ok(analysis.cycles.every(cycle => cycle.length === 4));
    assert.deepEqual(JSON.parse(JSON.stringify(analysis)), analysis);
});

test('a ring stays closed when its component rows and node numbers change', () => {
    const circuit = buildSchematicStressCases(nP)
        .find(item => item.id === 'branch-reordered').circuit;
    const graph = schematicGraph(circuit);
    assert.equal(graph.layout, 'branchline');
    assert.equal(schematicTopology(circuit).loopAnalysis.cycles.length, 1);
    assert.deepEqual(graph.components.map(part => part.ports.map(port => port.node)),
        circuit._schematic.components.map(entry => entry.nodes));
    assertNodesOnWires(graph);
});

test('three and four paths run between their actual multiport junction terminals', () => {
    const cases = buildSchematicCases(nP);
    for (const id of ['three-lanes', 'four-lanes']) {
        const circuit = cases.find(item => item.id === id).circuit;
        const graph = schematicGraph(circuit);
        assert.equal(graph.layout, 'generic');
        assert.deepEqual(graph.components.map(part => part.ports.map(port => port.node)),
            circuit._schematic.components.map(entry => entry.nodes));
        assertNodesOnWires(graph);
        for (const port of graph.components.flatMap(part => part.ports)) {
            assert.ok(graph.wires.some(wire => wire.node === port.node &&
                (wire.points[0][0] === port.at[0] && wire.points[0][1] === port.at[1] ||
                wire.points.at(-1)[0] === port.at[0] &&
                wire.points.at(-1)[1] === port.at[1])));
        }
    }
});

test('multi-loop networks route actual nodes without vertical rail columns', () => {
    const cases = buildSchematicStressCases(nP);
    for (const id of ['two-stage-divider', 'ring-with-chord']) {
        const circuit = cases.find(item => item.id === id).circuit;
        const graph = schematicGraph(circuit);
        assert.equal(graph.layout, 'generic');
        assert.deepEqual(graph.components.map(part => part.ports.map(port => port.node)),
            circuit._schematic.components.map(entry => entry.nodes));
        assert.deepEqual(graph.externalPorts.map(port => port.node),
            circuit._schematic.externalNodes);
        assertNodesOnWires(graph);
        for (const terminal of graph.components.flatMap(part => part.ports)
            .concat(graph.externalPorts)) {
            assert.ok(graph.wires.some(wire => wire.node === terminal.node &&
                (wire.points[0][0] === terminal.at[0] && wire.points[0][1] === terminal.at[1] ||
                wire.points.at(-1)[0] === terminal.at[0] &&
                wire.points.at(-1)[1] === terminal.at[1])));
        }
    }
});

test('all schematic development circuits render without the removed rail fallback', () => {
    const cases = buildSchematicCases(nP).concat(buildSchematicStressCases(nP));
    for (const item of cases) {
        const graph = schematicGraph(item.circuit);
        assert.notEqual(graph.layout, 'wire-rails', item.id);
        assert.ok(graph.components.length > 0, item.id);
        assert.ok(graph.viewBox[2] > 0 && graph.viewBox[3] > 0, item.id);
    }
});
