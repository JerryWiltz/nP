// Modified: 2026-11-20
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {DOMParser} from '@xmldom/xmldom';
import * as nP from '../src/index.js';
import {schematicSymbols} from '../src/np-chart/src/schematicSymbols';
import {schematicGraph, schematicSvg} from '../src/np-chart/src/schematic';

const require = createRequire(import.meta.url);
const {parseSymbol} = require('../schematics/tools/symbol-library.js');
const catalog = JSON.parse(readFileSync(new URL('../schematics/symbol-catalog.json', import.meta.url), 'utf8'));
const drawings = [
    ['HEMT', 'njf', [11, 22, 33]],
    ['Schottky', 'schottky-diode', [11, 22]],
    ['Zener', 'zener-diode', [11, 22]],
    ['Varactor', 'varactor-diode', [11, 22]]
];

test('specialized artwork distinguishes implemented constructors from drawing-only device names', () => {
    for (const [name, symbol, nodes] of drawings) {
        const numerical = name === 'HEMT';
        assert.equal((numerical ? catalog.constructors : catalog.deviceSymbols)[name], symbol + '.svg');
        assert.equal(Object.hasOwn(catalog.constructors, name), numerical);
        assert.equal(name in nP, numerical);
        const canonical = parseSymbol(readFileSync(new URL('../schematics/symbols/' + symbol + '.svg',
            import.meta.url), 'utf8'), symbol + '.svg');
        const runtime = schematicSymbols[symbol];
        assert.equal(runtime.geometry, canonical.geometry);
        assert.deepEqual(runtime.ports, Object.values(canonical.ports).map(port => [port.x, port.y]));
        assert.equal(runtime.ports.length, nodes.length);
        for (const [index, [start, end]] of runtime.leads.entries()) {
            assert.ok([start, end].some(point => point.every((value, axis) => value === runtime.ports[index][axis])));
            assert.equal(Math.hypot(start[0] - end[0], start[1] - end[1]), 20);
            assert.ok([...start, ...end].every(value => value % 10 === 0));
        }
    }
    assert.equal(catalog.constructors.MESFET, catalog.constructors.NJF);
    assert.equal(catalog.constructors.HEMT, catalog.constructors.NJF);
    assert.equal(catalog.deviceSymbols.HEMT, undefined);
    assert.equal(catalog.constructors.D, 'diode-1n4148.svg');
    assert.equal(catalog.constructors.diode1N4148, 'diode-1n4148.svg');
});

test('specialized diode marks distinguish polarity and capacitance without changing the ordinary diode', () => {
    for (const symbol of ['schottky-diode', 'zener-diode', 'varactor-diode']) {
        const runtime = schematicSymbols[symbol];
        assert.deepEqual(runtime.ports[0], [80, 80]);
        assert.deepEqual(runtime.ports[1], [symbol === 'varactor-diode' ? 150 : 140, 80]);
        assert.match(runtime.geometry, /M100 70 L120 80 L100 90 Z/);
        assert.notEqual(runtime.geometry, schematicSymbols['diode-1n4148'].geometry);
    }
    assert.match(schematicSymbols['schottky-diode'].geometry, /M115 70 V65 H120 V95 H125 V90/);
    assert.match(schematicSymbols['zener-diode'].geometry, /M115 65 L120 70 V90 L125 95/);
    const varactor = schematicSymbols['varactor-diode'].geometry;
    assert.match(varactor, /M120 70 V90 M130 70 V90/);
    assert.match(varactor, /M130 80 H150/); // Cathode pin starts at the outer plate.
    assert.doesNotMatch(varactor, /M120 80 H130/); // No wire bridges the capacitance gap.
});

test('specialized artwork renders without an RF grid and retains all terminals through rotations/reflections', () => {
    const frequencies = nP.global.fList;
    nP.global.fList = [];
    try {
        for (const [name, symbol, nodes] of drawings) {
            for (const direction of ['right', 'down', 'left', 'up']) {
                for (const mirror of ['', ' mirror']) {
                    const list = nodes.length === 3 ? '[1,2,3]' : '[1,2]';
                    const description = {paths: [`11 ${direction} X1=${name}(${name})${list} ${nodes.join(' ')}${mirror}`]};
                    const before = JSON.stringify(description), graph = schematicGraph(description);
                    assert.equal(graph.components.length, 1);
                    const part = graph.components[0];
                    assert.equal(part.symbol, symbol);
                    assert.deepEqual(part.ports.map(port => [port.port, port.node]), nodes.map((node, index) => [index + 1, node]));
                    assert.equal(new Set(part.ports.map(port => port.at.join(','))).size, nodes.length);
                    assert.ok(part.ports.every(port => port.at.every(value => value % 10 === 0)));
                    assert.equal(graph.nodes.length, nodes.length);
                    const svg = schematicSvg(description);
                    assert.match(svg, /data-component="X1"/);
                    assert.doesNotMatch(svg, /<(?:script|image|foreignObject)\b|\bon\w+\s*=|\b(?:href|src)\s*=/i);
                    assert.equal(new DOMParser().parseFromString(svg, 'image/svg+xml')
                        .getElementsByTagName('parsererror').length, 0);
                    assert.equal(JSON.stringify(description), before);
                }
            }
        }
    } finally { nP.global.fList = frequencies; }
});

test('specialized diodes compose with their actual terminal spans and preserve the supplied wiring', () => {
    const description = {paths: ['1 right D1=Schottky 2', '2 right D2=Zener 3', '3 right D3=Varactor 4']};
    const graph = schematicGraph(description);
    assert.deepEqual(graph.components.map(part => [part.id, part.symbol, part.ports.map(port => port.node)]),
        [['D1', 'schottky-diode', [1, 2]], ['D2', 'zener-diode', [2, 3]], ['D3', 'varactor-diode', [3, 4]]]);
    assert.deepEqual(graph.nodes.map(node => node.id).sort((a, b) => a - b), [1, 2, 3, 4]);
    assert.ok(graph.wires.every(wire => wire.points.flat().every(value => value % 10 === 0)));
});

test('HBT and PIN description captions reuse existing geometry without invoking numerical constructors', () => {
    for (const [path, symbol, nodes] of [
        ['1 right Q1=NPN(HBT)[1,2,3] 1 2 3', 'npn', [1, 2, 3]],
        ['1 right Q1=PNP(HBT)[1,2,3] 1 2 3', 'pnp', [1, 2, 3]],
        ['1 right D1=D(PIN) 2', 'diode-1n4148', [1, 2]]
    ]) {
        const description = {paths: [path]}, graph = schematicGraph(description);
        assert.equal(graph.components.length, 1);
        assert.equal(graph.components[0].symbol, symbol);
        assert.deepEqual(graph.components[0].ports.map(port => port.node), nodes);
        assert.match(schematicSvg(description), symbol === 'diode-1n4148' ? /PIN/ : /HBT/);
    }
});
