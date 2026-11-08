// Modified: 2026-11-08
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as nP from '../src/index.js';
import {detectSchematicShapes} from '../src/np-chart/src/schematicShapeDetector';
import {matchSchematicBoard} from '../src/np-chart/src/schematicBoardInterpreter';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';
import {symbolForSchematicEntry} from '../src/np-chart/src/nodalBlockSymbol';

function element(tagName) {
    const result = {tagName, style: {}, dataset: {}, children: [], attributes: {},
        appendChild(child) { this.children.push(child); },
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener() {}, querySelector(name) { return name === 'svg' ? this.svg : null; }};
    Object.defineProperty(result, 'innerHTML', {set(value) {
        const match = /<svg[^>]*viewBox="([^"]+)"/.exec(value);
        if (match) {
            const [x, y, width, height] = match[1].split(' ').map(Number);
            this.svg = {style: {}, viewBox: {baseVal: {x, y, width, height}}};
        }
    }});
    return result;
}

function withDocument(callback) {
    const original = globalThis.document, originalError = console.error;
    globalThis.document = {body: element('body'), createElement: element};
    console.error = () => {};
    try { callback(); }
    finally { globalThis.document = original; console.error = originalError; }
}

function resistorPath(count) {
    nP.global.fList = [2e9];
    const r1 = nP.R(50), rows = Array.from({length: count}, (_, index) => [r1, 45 + 3 * index, 48 + 3 * index]);
    return nP.nodal(...rows.reverse(), ['out', 45, 45 + 3 * count]);
}

const geometry = {symbol: symbolForSchematicEntry,
    placement() { throw new Error('Detection must not place anything.'); },
    bounds() { throw new Error('Detection must not measure a drawing.'); }};

for (const count of [1, 2, 13]) {
    test(`blind detection traces ${count} reused resistor occurrences despite reversed nodal rows`, () => {
        const circuit = resistorPath(count), before = JSON.stringify(circuit._schematic);
        const frequencies = nP.global.fList.slice(), boards = JSON.stringify(schematicShapeBoards);
        assert.deepEqual(detectSchematicShapes(circuit, schematicShapeBoards, geometry), {shapes: ['series']});
        assert.equal(JSON.stringify(circuit._schematic), before);
        assert.equal(JSON.stringify(schematicShapeBoards), boards);
        assert.deepEqual(nP.global.fList, frequencies);
    });
}

test('the public API detects independently of supplied shapes and the detected object is reusable', () => {
    const circuit = resistorPath(2);
    withDocument(() => {
        const options = {shapes: ['series']};
        const guided = nP.schematic(circuit, options);
        const automatic = nP.schematic(circuit);
        const generic = nP.schematic(circuit, {shapes: ['generic']});
        const conflicting = nP.schematic(circuit, {shapes: ['ladder']});
        for (const drawing of [guided, automatic, generic, conflicting]) {
            assert.deepEqual(drawing.detected, {shapes: ['series']});
        }
        assert.equal(automatic.error, null);
        assert.equal(automatic.graph.shape, 'series');
        assert.deepEqual(automatic.graph, guided.graph);
        assert.equal(generic.graph.layout, 'generic');
        assert.equal(conflicting.graph, null);
        assert.ok(conflicting.error instanceof Error);
        assert.deepEqual(nP.schematic(circuit, guided.detected).graph, guided.graph);
        assert.deepEqual(options, {shapes: ['series']});
    });
});

test('the detector does not inspect a supplied shapes getter', () => {
    const circuit = resistorPath(2);
    withDocument(() => {
        const result = nP.schematic(circuit, {get shapes() { throw new Error('hint read'); }});
        assert.deepEqual(result.detected, {shapes: ['series']});
        assert.equal(result.error.message, 'hint read');
    });
});

test('matching is shared with ORI and follows the board data rather than a series-name test', () => {
    const circuit = resistorPath(2);
    const clone = {...schematicShapeBoards.series, name: 'otherName'};
    const registry = {otherName: clone};
    assert.ok(matchSchematicBoard(circuit._schematic, clone, geometry));
    assert.deepEqual(detectSchematicShapes(circuit, registry, geometry), {shapes: ['otherName']});
    registry.otherName = {...clone, detect: false};
    assert.equal(detectSchematicShapes(circuit, registry, geometry), null);
});

test('loops, branches and disconnected extra components cannot be mistaken for a complete series path', () => {
    const r1 = nP.R(50);
    const loop = nP.nodal([r1, 1, 2], [r1, 1, 2], ['out', 1, 2]);
    const branch = nP.nodal([nP.Tee(), 3, 1, 2], [r1, 3, 4], [nP.Short(), 4], ['out', 1, 2]);
    const extra = nP.nodal([r1, 1, 2], [r1, 10, 20], ['out', 1, 2]);
    for (const circuit of [loop, extra]) assert.equal(detectSchematicShapes(circuit, schematicShapeBoards, geometry), null);
    assert.deepEqual(detectSchematicShapes(branch, schematicShapeBoards, geometry), {shapes: ['ladder']});
    withDocument(() => {
        const drawing = nP.schematic(branch);
        assert.deepEqual(drawing.detected, {shapes: ['ladder']});
        assert.equal(drawing.error, null);
        assert.equal(drawing.graph.layout, 'ladder');
    });
});

test('cascades and upstream two-port network blocks retain their construction boundaries', () => {
    const r1 = nP.R(50), inner = resistorPath(2);
    const cascade = r1.cas(inner).cas(nP.mbend());
    const outer = nP.nodal([inner, 1, 2], [r1, 2, 3], ['out', 1, 3]);
    withDocument(() => {
        for (const circuit of [cascade, outer]) {
            const drawing = nP.schematic(circuit);
            assert.equal(drawing.error, null);
            assert.deepEqual(drawing.detected, {shapes: ['series']});
            assert.equal(drawing.graph.components.filter(part => part.symbol === 'nodal').length, 1);
        }
        assert.equal(nP.schematic(outer).graph.components.length, 2);
    });
});

function harnessNetworks(name) {
    const cases = [];
    const api = {...nP, schematic(circuit, options) { cases.push({circuit, options}); return {detected: null}; }, log() {}};
    const html = readFileSync(new URL(`../dev/shapes/${name}.html`, import.meta.url), 'utf8');
    vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {nP: api});
    return cases;
}

for (const name of ['ladder', 'bridgedT', 'branchline', 'edgeCoupledFilter', 'powerDivider', 'powerCombiner']) {
    test(`blind detection and automatic rendering of every supported ${name} harness network`, () => {
        const expected = name === 'powerCombiner' ? 'powerDivider' : name;
        for (const {circuit, options} of harnessNetworks(name).filter(item =>
            !item.options.shapes || item.options.shapes.length === 1 && typeof item.options.shapes[0] === 'string')) {
            const before = JSON.stringify(circuit._schematic);
            const result = detectSchematicShapes(circuit, schematicShapeBoards, geometry);
            assert.deepEqual(result, {shapes: [expected]}, options.mount);
            // Relabel nodes and reorder occurrences; electrical incidence is unchanged.
            const root = circuit._schematic;
            const relabeled = {...circuit, _schematic: {...root,
                components: root.components.slice().reverse().map(entry => ({...entry,
                    nodes: entry.nodes.map(node => node * 17 + 901)})),
                externalNodes: root.externalNodes.map(node => node * 17 + 901)}};
            assert.deepEqual(detectSchematicShapes(relabeled, schematicShapeBoards, geometry), result);
            withDocument(() => {
                const supplied = nP.schematic(circuit, {shapes: [name]});
                const automatic = nP.schematic(circuit);
                const replay = nP.schematic(circuit, result);
                assert.equal(supplied.error, null, options.mount);
                assert.equal(automatic.error, null, options.mount);
                assert.deepEqual(supplied.detected, result);
                assert.deepEqual(automatic.detected, result);
                assert.deepEqual(automatic.graph, replay.graph);
                assert.deepEqual(automatic.graph.components.map(part => JSON.stringify(part.ports.map(port => port.node))).sort(),
                    circuit._schematic.components.map(entry => JSON.stringify(entry.nodes)).sort());
            });
            assert.equal(JSON.stringify(circuit._schematic), before);
        }
    });
}

test('electrically indistinguishable divider/combiner views use a declared default without reading hints', () => {
    const {circuit} = harnessNetworks('powerCombiner')[0];
    const registry = {powerCombiner: schematicShapeBoards.powerCombiner, powerDivider: schematicShapeBoards.powerDivider};
    assert.ok(matchSchematicBoard(circuit._schematic, registry.powerCombiner, {...geometry, boards: registry}));
    assert.deepEqual(detectSchematicShapes(circuit, registry, geometry), {shapes: ['powerDivider']});
    assert.deepEqual(detectSchematicShapes(circuit, {powerDivider: registry.powerDivider, powerCombiner: registry.powerCombiner}, geometry),
        {shapes: ['powerDivider']});
    assert.deepEqual(detectSchematicShapes(circuit, {...registry,
        powerDivider: {...registry.powerDivider, detect: false}}, geometry), {shapes: ['powerCombiner']});
    withDocument(() => {
        const drawing = nP.schematic(circuit, {shapes: ['powerCombiner']});
        assert.equal(drawing.error, null);
        assert.equal(drawing.graph.shape, 'powerCombiner');
        assert.deepEqual(drawing.detected, {shapes: ['powerDivider']});
    });
});

test('an unsupported composite is not reported as a whole-network shape', () => {
    const {circuit} = harnessNetworks('powerDivider').at(-1);
    assert.equal(detectSchematicShapes(circuit, schematicShapeBoards, geometry), null);
    withDocument(() => {
        const drawing = nP.schematic(circuit);
        assert.equal(drawing.error, null);
        assert.equal(drawing.detected, null);
        assert.equal(drawing.graph.layout, 'generic');
    });
});
