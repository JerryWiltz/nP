// Modified: 2026-10-31
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';

function fakeElement(tagName) {
    const element = {
        tagName, style: {}, dataset: {}, attributes: {}, children: [], listeners: {},
        clientWidth: 400, clientHeight: 300,
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener(name, listener) { this.listeners[name] = listener; },
        appendChild(child) { this.children.push(child); return child; },
        querySelector(name) { return name === 'svg' ? this.svg : null; }
    };
    Object.defineProperty(element, 'innerHTML', {
        set(value) {
            this.markup = value;
            const viewBox = /<svg[^>]*viewBox="([^"]+)"/.exec(value);
            if (viewBox) {
                const [, , width, height] = viewBox[1].split(' ').map(Number);
                this.svg = {style: {}, viewBox: {baseVal: {width, height}}};
            }
        }
    });
    return element;
}

test('schematic grows to its drawing height and fit drawing scales by width', () => {
    const originalDocument = globalThis.document;
    globalThis.document = {createElement: fakeElement};
    try {
        nP.global.fList = [2e9];
        const resistors = Array.from({length: 10}, () => nP.R(50));
        const circuit = nP.cascade(...resistors);
        const mount = fakeElement('div');
        const drawing = nP.schematic(circuit, {mount});
        const container = mount.children[0];
        const [toolbar, viewport] = container.children;
        const fitButton = toolbar.children[1];
        const svg = drawing.svg;

        assert.equal(viewport.style.overflow, 'auto');
        assert.equal(svg.style.maxWidth, 'none');
        assert.equal(svg.style.width, `${drawing.graph.viewBox[2]}px`);
        assert.equal(svg.style.height, `${drawing.graph.viewBox[3]}px`);
        assert.equal(viewport.style.height, undefined);
        assert.ok(drawing.graph.viewBox[2] > viewport.clientWidth);

        fitButton.listeners.click();
        assert.equal(fitButton.textContent, 'Actual size');
        assert.ok(parseInt(svg.style.width, 10) <= viewport.clientWidth);
        assert.equal(viewport.style.height, undefined);

        fitButton.listeners.click();
        assert.equal(fitButton.textContent, 'Fit drawing');
        assert.equal(svg.style.width, `${drawing.graph.viewBox[2]}px`);
        assert.equal(svg.style.height, `${drawing.graph.viewBox[3]}px`);

        const tee1 = nP.Tee();
        const tee2 = nP.Tee();
        const loop = nP.nodal(
            [tee1, 1, 2, 3],
            [nP.R(50), 2, 5],
            [nP.R(100), 3, 6],
            [tee2, 4, 5, 6],
            ['out', 1, 4]
        );
        const tallMount = fakeElement('div');
        const tallDrawing = nP.schematic(loop, {mount: tallMount});
        const tallViewport = tallMount.children[0].children[1];
        assert.ok(tallDrawing.graph.viewBox[3] > 600);
        assert.equal(tallViewport.style.height, undefined);
    } finally {
        globalThis.document = originalDocument;
    }
});
