// Modified: 2026-11-06
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';

function element(tagName) {
    const result = {tagName, style: {}, dataset: {}, children: [], attributes: {},
        appendChild(child) { this.children.push(child); },
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener() {},
        querySelector(name) { return name === 'svg' ? this.svg : null; }};
    Object.defineProperty(result, 'innerHTML', {set(value) {
        const match = /<svg[^>]*viewBox="([^"]+)"/.exec(value);
        if (match) {
            const [x, y, width, height] = match[1].split(' ').map(Number);
            this.svg = {style: {}, viewBox: {baseVal: {x, y, width, height}}};
        }
    }});
    return result;
}

test('schematic displays a drawing error and lets subsequent RF JavaScript execute', () => {
    const originalDocument = globalThis.document, originalError = console.error;
    const body = element('body'), mount = element('div'), errors = [];
    globalThis.document = {body, createElement: element, querySelector() { return mount; }};
    console.error = (...args) => errors.push(args);
    try {
        const failure = nP.schematic({}, {mount});
        // These statements follow the failed call with no caller try/catch.
        const subsequentTable = nP.R(50).out('s21dB');
        const success = nP.schematic(nP.nodal([nP.R(50), 1, 2], ['out', 1, 2]), {mount});
        assert.equal(failure.svg, null);
        assert.equal(failure.graph, null);
        assert.equal(failure.topology, null);
        assert.ok(failure.error instanceof Error);
        assert.equal(mount.children[0].attributes.role, 'alert');
        assert.match(mount.children[0].textContent, /Schematic could not be drawn/);
        assert.ok(subsequentTable.length > 1);
        assert.equal(success.error, null);
        assert.equal(success.graph.board.interpreter, 'ORI');
        assert.ok(success.svg);
        assert.equal(errors.length, 1);
        assert.equal(errors[0][1], failure.error);
    } finally {
        globalThis.document = originalDocument;
        console.error = originalError;
    }
});

test('an invalid mount selector still displays its error on the page and returns normally', () => {
    const originalDocument = globalThis.document, originalError = console.error;
    const body = element('body');
    globalThis.document = {body, createElement: element,
        querySelector() { throw new SyntaxError('invalid selector'); }};
    console.error = () => {};
    try {
        const failure = nP.schematic(nP.R(50), {mount: '['});
        assert.ok(failure.error instanceof Error);
        assert.equal(body.children[0].attributes.role, 'alert');
    } finally {
        globalThis.document = originalDocument;
        console.error = originalError;
    }
});
