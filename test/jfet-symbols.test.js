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

test('JFET constructors use canonical independent gate/drain/source terminals', () => {
    for (const name of ['NJF', 'PJF']) {
        const filename = `${name.toLowerCase()}.svg`;
        assert.equal(catalog.constructors[name], filename);
        assert.equal(Object.hasOwn(catalog.deviceSymbols, name), false);
        assert.equal(typeof nP[name], 'function');
        assert.equal(nP[name]()._schematic.symbol, name.toLowerCase());
        const canonical = parseSymbol(readFileSync(new URL('../schematics/symbols/' + filename,
            import.meta.url), 'utf8'), filename);
        const runtime = schematicSymbols[name.toLowerCase()];
        assert.equal(runtime.geometry, canonical.geometry);
        assert.deepEqual(canonical.ports, {1: {x: 70, y: 120}, 2: {x: 170, y: 60}, 3: {x: 170, y: 180}});
        assert.deepEqual(runtime.ports, Object.values(canonical.ports).map(port => [port.x, port.y]));
        assert.equal(runtime.leads.length, 3);
        for (const [index, [terminal, body]] of runtime.leads.entries()) {
            assert.deepEqual(terminal, runtime.ports[index]);
            assert.equal(Math.hypot(body[0] - terminal[0], body[1] - terminal[1]), 20);
            assert.ok([...terminal, ...body].every(value => value % 10 === 0));
        }
    }
});

test('N-channel and P-channel artwork reverse the gate arrow on the same continuous channel', () => {
    for (const [symbol, direction] of [['njf', 1], ['pjf', -1]]) {
        const geometry = schematicSymbols[symbol].geometry;
        const document = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${geometry}</svg>`, 'image/svg+xml');
        const paths = [...document.getElementsByTagName('path')];
        const arrow = paths.find(path => path.getAttribute('fill') === '#202020');
        assert.ok(arrow);
        const coordinates = arrow.getAttribute('d').match(/-?\d+/g).map(Number);
        const [tipX, tipY, baseX, upperY, lowerY] = coordinates;
        assert.ok(direction * (tipX - baseX) > 0, `${symbol} gate-arrow polarity`);
        assert.equal(tipY, (upperY + lowerY) / 2);
        assert.match(geometry, /M140 90 V150/); // Unbroken drain/source channel.
        assert.deepEqual(schematicSymbols[symbol].ports, schematicSymbols.njf.ports);
    }
});

test('JFET descriptions render without RF data and preserve terminal identity through rotations/reflections', () => {
    const frequencies = nP.global.fList;
    nP.global.fList = [];
    try {
        for (const name of ['NJF', 'PJF']) {
            for (const direction of ['right', 'down', 'left', 'up']) {
                for (const mirror of ['', ' mirror']) {
                    const description = {paths: [`11 ${direction} J1=${name}[1,2,3] 11 22 33${mirror}`]};
                    const before = JSON.stringify(description);
                    const graph = schematicGraph(description);
                    assert.equal(graph.components.length, 1);
                    const part = graph.components[0];
                    assert.equal(part.symbol, name.toLowerCase());
                    assert.deepEqual(part.ports.map(port => [port.port, port.node]), [[1, 11], [2, 22], [3, 33]]);
                    assert.equal(new Set(part.ports.map(port => port.at.join(','))).size, 3);
                    assert.ok(part.ports.every(port => port.at.every(value => value % 10 === 0)));
                    assert.deepEqual(graph.nodes.map(node => node.id).sort((a, b) => a - b), [11, 22, 33]);
                    const svg = schematicSvg(description);
                    assert.match(svg, /data-component="J1"/);
                    assert.doesNotMatch(svg, /<(?:script|image|foreignObject)\b|\bon\w+\s*=|\b(?:href|src)\s*=/i);
                    assert.equal(new DOMParser().parseFromString(svg, 'image/svg+xml')
                        .getElementsByTagName('parsererror').length, 0);
                    assert.equal(JSON.stringify(description), before);
                }
            }
        }
    } finally { nP.global.fList = frequencies; }
});
