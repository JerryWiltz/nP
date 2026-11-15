// Modified: 2026-11-14
import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from '@xmldom/xmldom';
import * as nP from '../src/index.js';
import {schematicGraph, schematicSvg, schematicTopology} from '../src/np-chart/src/schematic';
import {placeBoardNodeMarkers} from '../src/np-chart/src/schematicNodeMarkers';

function markerCircles(svg, kind) {
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    assert.equal(document.getElementsByTagName('parsererror').length, 0);
    return [...document.getElementsByTagName('circle')].filter(circle =>
        kind === 'number' ? circle.getAttribute('r') === '12' :
            circle.getAttribute('data-schematic-dot') === kind);
}

function pointOnWire(point, wire) {
    return wire.points.slice(1).some((end, index) => {
        const start = wire.points[index];
        return (start[0] === end[0] && point[0] === start[0] ||
            start[1] === end[1] && point[1] === start[1]) &&
            point.every((value, axis) => value >= Math.min(start[axis], end[axis]) &&
                value <= Math.max(start[axis], end[axis]));
    });
}

function assertNodeMarkers(circuit, options = {}) {
    const before = circuit._schematic.components.map(entry => entry.nodes.slice());
    const expectedNodes = new Set(before.flat().concat(circuit._schematic.externalNodes));
    const graph = schematicGraph(circuit, options);
    const svg = schematicSvg(circuit, options);
    const markers = markerCircles(svg, 'node');
    assert.equal(graph.nodes.length, expectedNodes.size);
    assert.deepEqual(new Set(graph.nodes.map(node => node.id)), expectedNodes);
    assert.equal(markers.length, expectedNodes.size);
    assert.equal(markerCircles(svg, 'number').length, expectedNodes.size);
    for (const node of graph.nodes) {
        assert.equal(markers.filter(circle => Number(circle.getAttribute('cx')) === node.at[0] &&
            Number(circle.getAttribute('cy')) === node.at[1]).length, 1);
        assert.ok(graph.wires.some(wire => wire.node === node.id &&
            wire.boardTile.kind === 'wire' && pointOnWire(node.at, wire)));
    }
    for (const box of graph.board.boxes.filter(box => box.kind === 'wire' || box.kind === 'cornerWire')) {
        assert.ok(expectedNodes.has(box.node));
        assert.equal(Object.hasOwn(box, 'nodeDot'), false,
            'wire boxes carry an electrical node identity, not a separate marker');
    }
    assert.deepEqual(circuit._schematic.components.map(entry => entry.nodes), before);
    return graph;
}

function genericDivider() {
    return nP.nodal(
        [nP.Tee(), 1, 2, 3],
        [nP.Tlin(50, 0.0254), 2, 4],
        [nP.Tlin(50, 0.0254), 3, 5],
        ['out', 1, 4, 5]
    );
}

function guidedDivider() {
    return nP.nodal(
        [nP.trf(Math.sqrt(2)), 1, 10],
        [nP.trfAuto(), 10, 20, 21],
        [nP.Tee(), 30, 20, 2],
        [nP.Tee(), 31, 21, 3],
        [nP.R(100), 30, 31],
        ['out', 1, 2, 3]
    );
}

function composedBranches() {
    const r = nP.R(50), tee = nP.Tee();
    return nP.nodal(
        [tee, 1, 10, 20],
        {series: [[r, 10, 11]]},
        {series: [[r, 20, 21], [r, 21, 22]]},
        [tee, 2, 11, 22],
        ['out', 1, 2]
    );
}

test('a generic multi-corner connection has one numbered marker across all wire boxes', () => {
    nP.global.fList = [2e9];
    const graph = assertNodeMarkers(genericDivider(), {shapes: ['generic']});
    const boxes = graph.board.boxes.filter(box => box.node === 2);
    assert.ok(boxes.filter(box => box.kind === 'cornerWire').length >= 2);
    assert.ok(boxes.filter(box => box.kind === 'wire').length >= 3);
});

test('guided and reflected boards keep marker ownership at the electrical node', () => {
    nP.global.fList = [2e9];
    const circuit = guidedDivider();
    for (const flipVertical of [false, true]) {
        const graph = assertNodeMarkers(circuit, {shapes: ['powerDivider'], flipVertical});
        assert.ok(graph.board.boxes.some(box => box.kind === 'cornerWire'));
    }
});

test('composed sections retain one marker for each shared node', () => {
    nP.global.fList = [2e9];
    const graph = assertNodeMarkers(composedBranches());
    assert.equal(graph.board.sections.length, 2);
    assert.ok(graph.board.boxes.some(box => box.kind === 'cornerWire'));
});

test('corners introduce no junction dots while true branches retain them', () => {
    nP.global.fList = [2e9];
    const r = nP.R(50);
    const cases = [genericDivider(), nP.nodal(
        [r, 1, 2], [r, 2, 3], [r, 2, 4], ['out', 1, 3, 4]
    )];
    for (const [index, circuit] of cases.entries()) {
        const graph = schematicGraph(circuit);
        assert.equal((graph.junctions || []).length > 0, index === 1);
        const options = {dots: {ports: false, nodes: false, terminals: false}};
        assert.equal(markerCircles(schematicSvg(circuit, options), 'junction').length,
            (graph.junctions || []).length);
        assert.deepEqual(schematicTopology(circuit, options), schematicTopology(circuit));
    }
});

test('a real bend component retains its two distinct cascade connections', () => {
    nP.global.fList = [2e9];
    const circuit = nP.cascade(nP.R(50), nP.mbend(), nP.R(50));
    const graph = schematicGraph(circuit);
    assert.equal(graph.nodes.length, 4);
    assert.equal(markerCircles(schematicSvg(circuit), 'number').length, 4);
    const bend = graph.components.find(part => part.symbol === 'microstrip-right-bend');
    assert.notEqual(bend.ports[0].node, bend.ports[1].node);
});

function cornerMarkerResult() {
    return {grid: 10, placements: [], externalPorts: [
        {node: 1, at: [0, 0]}, {node: 1, at: [70, 150]}
    ], nodePoints: new Map([[1, [70, 80]]]), wires: [
        {node: 1, points: [[0, 0], [60, 0]], boardTile: {kind: 'wire', id: 'a:entry'}},
        {node: 1, points: [[60, 0], [70, 0]], boardTile: {kind: 'cornerWire', id: 'a:corner'}},
        {node: 1, points: [[70, 0], [70, 10]], boardTile: {kind: 'cornerWire', id: 'a:corner'}},
        {node: 1, points: [[70, 10], [70, 150]], boardTile: {kind: 'wire', id: 'a:exit'}}
    ]};
}

test('the incoming wire carries the marker even when the outgoing wire is longer', () => {
    const result = cornerMarkerResult(), before = structuredClone(result);
    assert.deepEqual(placeBoardNodeMarkers(result).get(1), [30, 0]);
    assert.deepEqual(result, before, 'marker selection does not mutate routes or existing marker data');
});

test('marker selection follows route direction through reflection and storage-order changes', () => {
    const result = cornerMarkerResult();
    result.wires.reverse();
    assert.deepEqual(placeBoardNodeMarkers(result).get(1), [30, 0]);
    for (const mirror of [[-1, 1], [1, -1], [-1, -1]]) {
        const reflected = structuredClone(result);
        reflected.wires.forEach(wire => { wire.points = wire.points.map(point => point.map((v, i) => v * mirror[i])); });
        reflected.externalPorts.forEach(port => { port.at = port.at.map((v, i) => v * mirror[i]); });
        assert.deepEqual(placeBoardNodeMarkers(reflected).get(1), [30 * mirror[0], 0]);
    }
});

test('the first corner wins on a route with multiple corners', () => {
    const result = cornerMarkerResult();
    result.wires.push(
        {node: 1, points: [[70, 150], [70, 160]], boardTile: {kind: 'cornerWire', id: 'b:corner'}},
        {node: 1, points: [[70, 160], [80, 160]], boardTile: {kind: 'cornerWire', id: 'b:corner'}},
        {node: 1, points: [[80, 160], [180, 160]], boardTile: {kind: 'wire', id: 'b:exit'}}
    );
    result.externalPorts[1].at = [180, 160];
    assert.deepEqual(placeBoardNodeMarkers(result).get(1), [30, 0]);
});

test('a crossing or a terminal shifts the marker along the incoming wire', () => {
    const result = cornerMarkerResult();
    result.nodePoints.set(9, [30, -10]);
    result.wires.push({node: 9, points: [[30, -20], [30, 20]], boardTile: {kind: 'wire', id: 'crossing'}});
    assert.deepEqual(placeBoardNodeMarkers(result).get(1), [20, 0]);
    result.placements.push({ports: [{node: 7, at: [20, 0]}]});
    assert.deepEqual(placeBoardNodeMarkers(result).get(1), [40, 0]);
});

test('branched connections have a deterministic first path and one marker', () => {
    const result = cornerMarkerResult();
    result.wires.push(
        {node: 1, points: [[0, 0], [0, -60]], boardTile: {kind: 'wire', id: 'b:entry'}},
        {node: 1, points: [[0, -60], [0, -70]], boardTile: {kind: 'cornerWire', id: 'b:corner'}},
        {node: 1, points: [[0, -70], [10, -70]], boardTile: {kind: 'cornerWire', id: 'b:corner'}},
        {node: 1, points: [[10, -70], [90, -70]], boardTile: {kind: 'wire', id: 'b:exit'}}
    );
    result.externalPorts.push({node: 1, at: [90, -70]});
    assert.equal(placeBoardNodeMarkers(result).size, 1);
    assert.deepEqual(placeBoardNodeMarkers(result).get(1), [30, 0]);
    result.wires.reverse();
    assert.deepEqual(placeBoardNodeMarkers(result).get(1), [30, 0]);
});

test('an unusable incoming lead falls back to a clear straight segment', () => {
    const result = cornerMarkerResult();
    result.wires[0].points[0] = [50, 0];
    result.externalPorts[0].at = [50, 0];
    assert.deepEqual(placeBoardNodeMarkers(result).get(1), [70, 80]);
});

test('straight connections retain their existing midpoint and independent node identity', () => {
    const result = cornerMarkerResult();
    result.wires = [{node: 1, points: [[0, 0], [100, 0]], boardTile: {kind: 'wire', id: 'straight'}}];
    result.nodePoints.set(1, [50, 0]);
    assert.deepEqual(placeBoardNodeMarkers(result).get(1), [50, 0]);
});
