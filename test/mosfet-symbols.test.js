// Modified: 2026-11-19
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
const variants = [
    ['NMOS', 'nmos', false, false],
    ['PMOS', 'pmos', false, false],
    ['NMOS4', 'nmos-four-terminal', false, true],
    ['PMOS4', 'pmos-four-terminal', false, true],
    ['NMOSD', 'nmos-depletion', true, false],
    ['PMOSD', 'pmos-depletion', true, false],
    ['NMOSD4', 'nmos-depletion-four-terminal', true, true],
    ['PMOSD4', 'pmos-depletion-four-terminal', true, true]
];

test('MOSFET artwork has documented G/D/S/B terminals and numerical NMOS/PMOS select their three/four-terminal variants', () => {
    for (const [name, symbol, , separateBody] of variants) {
        if (name === 'NMOS' || name === 'PMOS') {
            assert.equal(catalog.constructors[name], symbol + '.svg');
            assert.equal(typeof nP[name], 'function');
            assert.equal(nP[name]()._schematic.symbol, symbol);
            assert.equal(nP[name]({body: 'external'})._schematic.symbol, symbol + '-four-terminal');
        } else {
            assert.equal(catalog.deviceSymbols[name], symbol + '.svg');
            assert.equal(name in nP, false);
        }
        const canonical = parseSymbol(readFileSync(new URL('../schematics/symbols/' + symbol + '.svg',
            import.meta.url), 'utf8'), symbol + '.svg');
        const runtime = schematicSymbols[symbol];
        const ports = [[70, 120], [170, 60], [170, 180]];
        if (separateBody) ports.push([210, 120]);
        assert.deepEqual(Object.values(canonical.ports).map(port => [port.x, port.y]), ports);
        assert.deepEqual(runtime.ports, ports);
        assert.equal(runtime.geometry, canonical.geometry);
        assert.equal(runtime.leads.length, ports.length);
        for (const [index, [terminal, body]] of runtime.leads.entries()) {
            assert.deepEqual(terminal, ports[index]);
            assert.equal(Math.hypot(body[0] - terminal[0], body[1] - terminal[1]), 20);
            assert.ok([...terminal, ...body].every(value => value % 10 === 0));
        }
    }
});

test('MOSFET artwork distinguishes mode, insulated gate, body handling and body-arrow polarity', () => {
    for (const [name, symbol, depletion, separateBody] of variants) {
        const geometry = schematicSymbols[symbol].geometry;
        const document = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${geometry}</svg>`, 'image/svg+xml');
        const paths = [...document.getElementsByTagName('path')];
        const channels = paths.map(path => path.getAttribute('d'));
        // Gate and channel are separate: the body/source tie must never bridge the insulating gap.
        assert.ok(channels.includes('M90 120 H120 M120 90 V150'));
        assert.equal(channels.includes('M140 90 V150'), depletion);
        assert.equal(channels.includes('M140 90 V100 M140 110 V130 M140 140 V150'), !depletion);
        assert.equal(channels.includes('M140 120 H170 V150'), !separateBody);
        assert.equal(channels.includes('M140 120 H190'), separateBody);
        const arrow = paths.find(path => path.getAttribute('fill') === '#202020');
        const [tipX, tipY, baseX, upperY, lowerY] = arrow.getAttribute('d').match(/-?\d+/g).map(Number);
        assert.ok(name.startsWith('N') ? tipX < baseX : tipX > baseX, name + ' body-arrow polarity');
        assert.equal(tipY, (upperY + lowerY) / 2);
    }
});

test('MOSFET drawing rotations/reflections preserve every external terminal without numerical data', () => {
    const frequencies = nP.global.fList;
    nP.global.fList = [];
    try {
        for (const [name, symbol, , separateBody] of variants) {
            const assignments = separateBody ? '[1,2,3,4] 11 22 33 44' : '[1,2,3] 11 22 33';
            const expected = [[1, 11], [2, 22], [3, 33]];
            if (separateBody) expected.push([4, 44]);
            for (const direction of ['right', 'down', 'left', 'up']) {
                for (const mirror of ['', ' mirror']) {
                    const description = {paths: [`11 ${direction} M1=${name}${assignments}${mirror}`]};
                    const before = JSON.stringify(description);
                    const graph = schematicGraph(description);
                    assert.equal(graph.components.length, 1);
                    const part = graph.components[0];
                    assert.equal(part.symbol, symbol);
                    assert.deepEqual(part.ports.map(port => [port.port, port.node]), expected);
                    assert.equal(new Set(part.ports.map(port => port.at.join(','))).size, expected.length);
                    assert.ok(part.ports.every(port => port.at.every(value => value % 10 === 0)));
                    assert.deepEqual(graph.nodes.map(node => node.id).sort((a, b) => a - b), expected.map(([, node]) => node));
                    const svg = schematicSvg(description);
                    assert.match(svg, /data-component="M1"/);
                    assert.doesNotMatch(svg, /<(?:script|image|foreignObject)\b|\bon\w+\s*=|\b(?:href|src)\s*=/i);
                    assert.equal(new DOMParser().parseFromString(svg, 'image/svg+xml')
                        .getElementsByTagName('parsererror').length, 0);
                    assert.equal(JSON.stringify(description), before);
                }
            }
        }
    } finally { nP.global.fList = frequencies; }
});

test('four-terminal MOSFET descriptions retain independent body nodes and reject unsupported self-connections', () => {
    for (const [name, , , separateBody] of variants) {
        if (!separateBody) continue;
        const description = {paths: [`44 left M1=${name}[1,2,3,4] 11 22 33 44`]};
        const graph = schematicGraph(description);
        assert.deepEqual(graph.components[0].ports.map(port => [port.port, port.node]),
            [[1, 11], [2, 22], [3, 33], [4, 44]]);
        assert.equal(graph.nodes.length, 4);
        assert.equal(graph.components.length, 1); // No invented termination or tie component.
        // Existing description layout cannot close a net back onto the same component.
        assert.throws(() => schematicGraph({paths: [`11 right M1=${name}[1,2,3,4] 11 22 33 33`]}),
            /direction or clearance constraints cannot be satisfied/);
    }
    assert.throws(() => schematicGraph({paths: ['1 right M1=NMOS4[1,2,3] 1 2 3']}));
    assert.throws(() => schematicGraph({paths: ['1 right M1=NMOS[1,2,3,4] 1 2 3 4']}));
});
