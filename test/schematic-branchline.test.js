// Modified: 2026-11-06
import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from '@xmldom/xmldom';
import * as nP from '../src/index.js';
import {buildSchematicStressCases} from '../dev/schematicStressCases.js';
import {schematicGraph, schematicSvg, schematicTopology} from '../src/np-chart/src/schematic.js';

const cases = new Map(buildSchematicStressCases(nP).map(item => [item.id, item.circuit]));

for (const name of ['branch-series-top', 'branch-series-opposite', 'branch-reordered']) {
    test(`branchline guidance draws ${name} as a rectangle`, () => {
        const circuit = cases.get(name);
        const graph = schematicGraph(circuit, {shapes: ['branchline']});
        assert.equal(graph.board.interpreter, 'ORI');
        assert.equal(graph.layout, 'branchline');
        assert.equal(graph.shape, 'branchline');
        assert.equal(graph.cells, 1);
        assert.deepEqual(graph.externalPorts.map(port => port.node), circuit._schematic.externalNodes);
        graph.components.forEach((part, index) => {
            assert.deepEqual(part.ports.map(port => port.node), circuit._schematic.components[index].nodes);
        });
        assert.deepEqual(new Set(graph.nodes.map(node => node.id)),
            new Set(circuit._schematic.components.flatMap(entry => entry.nodes)));
        assert.equal(schematicTopology(circuit, {shapes: ['branchline']}).loopAnalysis.cycles.length, 1);
        assert.equal(new DOMParser().parseFromString(schematicSvg(circuit, {shapes: ['branchline']}),
            'image/svg+xml').getElementsByTagName('parsererror').length, 0);
    });
}

test('branchline guidance finds two connected rectangular cells', () => {
    const circuit = cases.get('branchline-two-cell');
    const graph = schematicGraph(circuit, {shapes: ['branchline']});
    assert.equal(graph.cells, 2);
    assert.equal(graph.components.length, 13);
    assert.equal(schematicTopology(circuit, {shapes: ['branchline']}).loopAnalysis.cycles.length, 2);
    assert.equal(graph.externalPorts[0].at[1], graph.externalPorts[1].at[1]);
    assert.equal(graph.externalPorts[2].at[1], graph.externalPorts[3].at[1]);
    assert.ok(graph.externalPorts[0].at[1] < graph.externalPorts[3].at[1]);
});

test('branchline guidance rotates microstrip junctions and lines', () => {
    const circuit = cases.get('branchline-microstrip');
    const graph = schematicGraph(circuit, {shapes: ['branchline']});
    assert.equal(graph.cells, 1);
    assert.equal(graph.components.filter(part => part.symbol === 'microstrip-tee').length, 4);
    assert.equal(graph.components.filter(part => part.symbol === 'microstrip-line').length, 4);
    assert.ok(graph.components.every(part => part.rotation % 90 === 0));
    assert.deepEqual(graph.externalPorts.map(port => port.node), [1, 4, 12, 9]);
});

test('branchline guidance rejects a network without rectangular cells', () => {
    assert.throws(() => schematicGraph(cases.get('three-shunt-ladder'),
        {shapes: ['branchline']}), /does not match the "branchline" pattern/);
});
