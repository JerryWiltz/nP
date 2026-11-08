// Modified: 2026-11-08
import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from '@xmldom/xmldom';
import * as nP from '../src/index.js';
import {schematicGraph, schematicTopology, schematicSvg} from '../src/np-chart/src/schematic';
import {schematicSymbols} from '../src/np-chart/src/schematicSymbols';

function circles(svg, kind) {
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    assert.equal(document.getElementsByTagName('parsererror').length, 0);
    return Array.from(document.getElementsByTagName('circle')).filter(circle =>
        kind === 'label' ? circle.getAttribute('r') === '12' : circle.getAttribute('data-schematic-dot') === kind);
}

function circuits() {
    nP.global.fList = [2e9];
    const r1 = nP.R(50), r2 = nP.R(75);
    return [nP.nodal([r1, 1, 2], [r2, 2, 3], ['out', 1, 3]), nP.cascade(r1, r2)];
}

test('default dot presentation shows external ports and nodes with no component-terminal dots', () => {
    for (const circuit of circuits()) {
        const graph = schematicGraph(circuit), svg = schematicSvg(circuit);
        assert.equal(circles(svg, 'port').length, 2);
        assert.equal(circles(svg, 'node').length, graph.kind === 'rf-nodal' ? 3 : 1);
        assert.equal(circles(svg, 'terminal').length, 0);
        assert.equal(circles(svg, 'label').length, 3);
    }
});

test('dot switches act independently for nodal and cascade drawings without changing layout or connectivity', () => {
    for (const circuit of circuits()) {
        const graph = schematicGraph(circuit), topology = schematicTopology(circuit);
        for (const ports of [false, true]) for (const nodes of [false, true]) for (const terminals of [false, true]) {
            const dots = Object.freeze({ports, nodes, terminals}), options = Object.freeze({dots});
            const svg = schematicSvg(circuit, options);
            assert.equal(circles(svg, 'port').length, ports ? 2 : 0);
            assert.equal(circles(svg, 'node').length, nodes ? graph.kind === 'rf-nodal' ? 3 : 1 : 0);
            assert.equal(circles(svg, 'terminal').length, terminals ? 4 : 0);
            assert.equal(circles(svg, 'label').length, 3);
            assert.deepEqual(schematicGraph(circuit, options), graph);
            assert.deepEqual(schematicTopology(circuit, options), topology);
        }
    }
});

test('partial dot options keep defaults and are not retained by subsequent calls', () => {
    const circuit = circuits()[0];
    const options = {dots: {terminals: true}};
    const svg = schematicSvg(circuit, options);
    assert.equal(circles(svg, 'port').length, 2);
    assert.equal(circles(svg, 'node').length, 3);
    assert.equal(circles(svg, 'terminal').length, 4);
    assert.deepEqual(options, {dots: {terminals: true}});
    assert.equal(circles(schematicSvg(circuit), 'terminal').length, 0);
});

test('real wire junctions remain visible when optional dot categories are hidden', () => {
    const r1 = nP.R(50);
    const circuit = nP.nodal([r1, 1, 2], [r1, 2, 3], [r1, 2, 4], ['out', 1, 3, 4]);
    const graph = schematicGraph(circuit);
    assert.ok(graph.junctions.length > 0);
    const svg = schematicSvg(circuit, {dots: {ports: false, nodes: false, terminals: false}});
    assert.equal(circles(svg, 'port').length, 0);
    assert.equal(circles(svg, 'node').length, 0);
    assert.equal(circles(svg, 'terminal').length, 0);
    assert.equal(circles(svg, 'junction').length, graph.junctions.length);
    assert.equal(circles(svg, 'label').length, graph.nodes.length);
});

test('canonical symbol artwork is preserved independently of terminal dots', () => {
    const tee = nP.Tee();
    const circuit = nP.nodal([tee, 1, 2, 3], ['out', 1, 2, 3]);
    const svg = schematicSvg(circuit, {dots: {ports: false, nodes: false, terminals: false}});
    assert.ok(svg.includes(schematicSymbols.tee.geometry));
});

test('dot presentation applies to grouped networks without changing their detected arrangement', () => {
    const r1 = nP.R(50);
    const circuit = nP.nodal({series: [[r1, 1, 2]]}, {series: [[r1, 2, 3]]}, ['out', 1, 3]);
    const defaultGraph = schematicGraph(circuit);
    const options = {dots: {terminals: true}};
    assert.deepEqual(schematicGraph(circuit, options), defaultGraph);
    assert.equal(circles(schematicSvg(circuit, options), 'terminal').length, 4);
});

test('MOD and DEMOD signal-path drawings use the same dot options', () => {
    const g = nP.global;
    g.tList = g.tGen(0, 1e-3, 2);
    g.fList = [];
    const transmitter = nP.mod({mode: 'AM', carrierHz: 200e6, toneHz: 300});
    const circuit = nP.cascade(nP.Attn(3), {signal: transmitter});
    const receiver = nP.demod(circuit, {noise: false});
    const path = {transmitter, circuit, receiver};
    const svg = schematicSvg(path, {dots: {ports: false, nodes: false, terminals: true}});
    assert.equal(circles(svg, 'port').length, 0);
    assert.equal(circles(svg, 'node').length, 0);
    assert.equal(circles(svg, 'terminal').length, 6);
    assert.equal(circles(svg, 'label').length, 4);
});

test('invalid dot options fail clearly instead of accepting misspelled controls', () => {
    const circuit = circuits()[0];
    for (const dots of [null, false, [], 'all', {ports: 1}, {nodes: 'false'}, {terminal: true}]) {
        assert.throws(() => schematicSvg(circuit, {dots}), /dots.*boolean/);
    }
});
