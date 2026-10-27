// Modified: 2026-10-27
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph, schematicSvg} from '../src/np-chart/src/schematic.js';

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
        assert.ok(node.at.every(value => value % 20 === 0));
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
    assert.ok(graph.viewBox[2] < 1600 && graph.viewBox[3] < 800);
    assertNodesOnWires(graph);
    assert.match(schematicSvg(vnaFixture()), /COUPLER3/);
});

test('multiport layout follows connections when entries and node numbers change', () => {
    const graph = schematicGraph(vnaFixture(100, true));
    assert.deepEqual(graph.components.slice(0, 4).map(part => part.symbol),
        ['coupler-180', 'coupler-180', 'inductor', 'coupler-180']);
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
    assert.ok(graph.viewBox[3] < 700);
    assertNodesOnWires(graph);
});

test('a standalone four-port sends each external wire outward without joining ports', () => {
    nP.global.fList = [2e9];
    const graph = schematicGraph(nP.Tclin(100, 30, 0.0373));
    assert.equal(graph.externalPorts.length, 4);
    assert.deepEqual(graph.externalPorts.map(port => port.at),
        [[40, 100], [360, 100], [360, 140], [40, 140]]);
    assert.ok(graph.wires.every(wire => wire.points.length === 2 &&
        wire.points[0][1] === wire.points[1][1]));
    assertNodesOnWires(graph);
});
