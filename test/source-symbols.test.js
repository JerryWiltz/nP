// Modified: 2026-11-16
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
const sourceArtwork = {V: catalog.constructors.V, ...catalog.sourceSymbols};

test('V is an executable constructor and remaining source artwork stays drawing-only', () => {
    assert.equal(catalog.constructors.V, 'voltage-source.svg');
    assert.equal(typeof nP.V, 'function');
    assert.deepEqual(Object.keys(catalog.sourceSymbols), ['I', 'VCVS', 'VCCS', 'CCVS', 'CCCS']);
    for (const name of Object.keys(catalog.sourceSymbols)) {
        assert.equal(name in catalog.constructors, false);
        assert.equal(name in nP, false, `${name} has no source-behavior implementation yet`);
    }
});

test('canonical source terminals, pins and bundled geometry agree', () => {
    for (const [name, filename] of Object.entries(sourceArtwork)) {
        const source = readFileSync(new URL('../schematics/symbols/' + filename, import.meta.url), 'utf8');
        const canonical = parseSymbol(source, filename), runtime = schematicSymbols[filename.slice(0, -4)];
        assert.deepEqual(canonical.ports, {1: {x: 140, y: 70}, 2: {x: 140, y: 170}}, name);
        assert.deepEqual(runtime.ports, [[140, 70], [140, 170]]);
        assert.equal(runtime.geometry, canonical.geometry);
        assert.equal(runtime.leads.length, 2);
        for (const [index, lead] of runtime.leads.entries()) {
            assert.deepEqual(lead[0], runtime.ports[index]);
            assert.equal(Math.abs(lead[1][0] - lead[0][0]) + Math.abs(lead[1][1] - lead[0][1]), 20);
            assert.ok(lead.flat().every(value => value % 10 === 0));
        }
        const document = new DOMParser().parseFromString(source, 'image/svg+xml');
        const circles = [...document.getElementsByTagName('circle')];
        assert.equal(circles.some(circle => circle.getAttribute('r') === '30'), name === 'V' || name === 'I');
        if (['V', 'VCVS', 'CCVS'].includes(name)) {
            assert.match(source, /Terminal 1 is positive relative to terminal 2/);
            assert.match(runtime.geometry, /M135 105 H145 M140 100 V110 M135 135 H145/);
        } else {
            assert.match(source, /Positive source current points from terminal 2 to terminal 1/);
            assert.match(runtime.geometry, /M140 135 V105 M135 110 L140 105 L145 110/);
        }
    }
});

test('source symbols render from drawing metadata without S-parameters or a frequency grid', () => {
    const frequencies = nP.global.fList;
    nP.global.fList = [];
    try {
        for (const filename of Object.values(sourceArtwork)) {
            const symbol = filename.slice(0, -4);
            const component = {_schematic: {kind: 'component', symbol}};
            const graph = schematicGraph(component), svg = schematicSvg(component);
            assert.equal(graph.components.length, 1);
            assert.equal(graph.components[0].symbol, symbol);
            assert.equal(graph.components[0].ports.length, 2);
            assert.equal(component.spars, undefined);
            assert.match(svg, /<svg /);
            assert.equal(new DOMParser().parseFromString(svg, 'image/svg+xml')
                .getElementsByTagName('parsererror').length, 0);
            assert.doesNotMatch(svg, /<(?:script|foreignObject|image)\b|\b(?:href|src)\s*=/i);
        }
    } finally {
        nP.global.fList = frequencies;
    }
});
