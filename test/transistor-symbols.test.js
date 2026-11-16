// Modified: 2026-11-15
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import * as nP from '../src/index.js';
import {schematicSymbols} from '../src/np-chart/src/schematicSymbols';
import {schematicGraph, schematicSvg} from '../src/np-chart/src/schematic';

const require = createRequire(import.meta.url);
const {parseSymbol} = require('../schematics/tools/symbol-library.js');
const catalog = JSON.parse(readFileSync(new URL('../schematics/symbol-catalog.json', import.meta.url), 'utf8'));

test('NPN constructor uses the canonical three-terminal transistor artwork', () => {
    assert.equal(catalog.constructors.NPN, 'npn.svg');
    assert.equal(Object.hasOwn(catalog.deviceSymbols, 'NPN'), false);
    assert.equal(typeof nP.NPN, 'function');
    assert.equal(nP.NPN()._schematic.symbol, 'npn');
    const source = readFileSync(new URL('../schematics/symbols/npn.svg', import.meta.url), 'utf8');
    const canonical = parseSymbol(source, 'npn.svg'), symbol = schematicSymbols.npn;
    assert.equal(symbol.geometry, canonical.geometry);
    assert.deepEqual(symbol.ports, Object.values(canonical.ports).map(port => [port.x, port.y]));
    const [base, collector, emitter] = symbol.ports;
    assert.ok(base[0] < collector[0]);
    assert.equal(collector[0], emitter[0]);
    assert.ok(collector[1] < base[1] && base[1] < emitter[1]);
    assert.equal(symbol.leads.length, 3);
    for (const [index, [terminal, body]] of symbol.leads.entries()) {
        assert.deepEqual(terminal, symbol.ports[index]);
        assert.equal(Math.hypot(body[0] - terminal[0], body[1] - terminal[1]), 20);
        assert.ok(terminal.every(value => value % 10 === 0));
    }
});

test('NPN drawing rotations and reflections preserve all three numbered terminal assignments', () => {
    const frequencies = nP.global.fList;
    nP.global.fList = [];
    try {
        for (const direction of ['right', 'down', 'left', 'up']) {
            for (const mirror of ['', ' mirror']) {
                const input = {paths: [`11 ${direction} Q1=NPN[1,2,3] 11 22 33${mirror}`]};
                const before = JSON.stringify(input), graph = schematicGraph(input);
                assert.equal(graph.components.length, 1);
                const part = graph.components[0];
                assert.deepEqual(part.ports.map(port => [port.port, port.node]), [[1, 11], [2, 22], [3, 33]]);
                assert.equal(new Set(part.ports.map(port => port.at.join(','))).size, 3);
                assert.ok(part.ports.every(port => port.at.every(value => value % 10 === 0)));
                assert.equal(graph.nodes.length, 3);
                const svg = schematicSvg(input);
                assert.match(svg, /data-component="Q1"/);
                assert.doesNotMatch(svg, /<(?:script|image|foreignObject)\b|\bon\w+\s*=|\b(?:href|src)\s*=/i);
                assert.equal(JSON.stringify(input), before);
            }
        }
    } finally { nP.global.fList = frequencies; }
});

test('PNP uses a distinct inward-arrow symbol with the same B/C/E terminal order', () => {
    assert.equal(catalog.constructors.PNP, 'pnp.svg');
    assert.equal(nP.PNP()._schematic.symbol, 'pnp');
    const source = readFileSync(new URL('../schematics/symbols/pnp.svg', import.meta.url), 'utf8');
    const canonical = parseSymbol(source, 'pnp.svg');
    assert.equal(schematicSymbols.pnp.geometry, canonical.geometry);
    assert.deepEqual(schematicSymbols.pnp.ports, schematicSymbols.npn.ports);
    assert.deepEqual(schematicSymbols.pnp.leads, schematicSymbols.npn.leads);
    assert.match(source, /arrow points inward/);
    assert.notEqual(schematicSymbols.pnp.geometry, schematicSymbols.npn.geometry);
    for (const direction of ['right', 'down', 'left', 'up']) {
        for (const mirror of ['', ' mirror']) {
            const graph = schematicGraph({paths: [`11 ${direction} Q1=PNP[1,2,3] 11 22 33${mirror}`]});
            assert.deepEqual(graph.components[0].ports.map(port => [port.port, port.node]),
                [[1, 11], [2, 22], [3, 33]]);
        }
    }
});

test('automatic transistor layout preserves canonical orientation and keeps the emitter termination local', () => {
    for (const [constructor, model, symbol] of [[nP.NPN, '2N3904', 'npn'],
        [nP.NPN, 'BFR93A', 'npn'], [nP.PNP, '2N3906', 'pnp']]) {
        for (const reverse of [false, true]) {
            const q = constructor({model});
            const rows = [[q, 45, 37, 99], [nP.Short(), 99]];
            if (reverse) rows.reverse();
            const network = nP.nodal(...rows, ['out', 45, 37]);
            const before = JSON.stringify(network._schematic);
            const graph = schematicGraph(network);
            const transistor = graph.components.find(part => part.symbol === symbol);
            const short = graph.components.find(part => part.symbol === 'short');
            const [base, collector, emitter] = transistor.ports;
            assert.deepEqual(transistor.ports.map(port => [port.port, port.node]), [[1, 45], [2, 37], [3, 99]]);
            assert.equal(transistor.rotation, 0);
            assert.equal(!!transistor.mirrorX, false);
            assert.equal(transistor.mirrorY, false);
            assert.ok(collector.at[1] < base.at[1] && base.at[1] < emitter.at[1]);
            assert.equal(short.ports[0].at[0], emitter.at[0]);
            assert.ok(short.ports[0].at[1] > emitter.at[1]);
            const returnWires = graph.wires.filter(wire => wire.node === 99);
            assert.equal(returnWires.length, 1);
            assert.deepEqual(new Set(returnWires[0].points.map(at => at.join(','))),
                new Set([emitter.at, short.ports[0].at].map(at => at.join(','))));
            assert.ok(graph.externalPorts[0].at[0] < base.at[0]);
            assert.ok(graph.externalPorts[1].at[0] > collector.at[0]);
            assert.equal(graph.nodes.filter(node => node.id === 99).length, 1);
            assert.equal(JSON.stringify(network._schematic), before);
        }
    }
});

test('common-base and common-collector drawings keep their actual terminal assignments', () => {
    const q = nP.NPN();
    for (const [common, outputs] of [[1, [3, 2]], [2, [1, 3]]]) {
        const network = nP.nodal([q, 1, 2, 3], [nP.Short(), common], ['out', ...outputs]);
        const graph = schematicGraph(network);
        const transistor = graph.components.find(part => part.symbol === 'npn');
        const short = graph.components.find(part => part.symbol === 'short');
        const reference = transistor.ports[common - 1];
        assert.equal(short.ports[0].node, common);
        assert.deepEqual(graph.externalPorts.map(port => port.node), outputs);
        assert.deepEqual(transistor.ports.map(port => port.node), [1, 2, 3]);
        assert.ok(graph.wires.some(wire => wire.node === common &&
            wire.points.some(at => at[0] === reference.at[0] && at[1] === reference.at[1])));
        for (const part of graph.components) for (const port of part.ports) {
            assert.ok(graph.wires.some(wire => wire.node === port.node && wire.points.some(at =>
                at[0] === port.at[0] && at[1] === port.at[1])));
        }
        assert.ok(graph.wires.every(wire => wire.points.flat().every(value => value % 10 === 0)));
    }
});
