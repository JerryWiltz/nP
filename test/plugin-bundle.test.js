// Modified: 2026-11-09
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Worker} from 'node:worker_threads';
import {DOMParser} from '@xmldom/xmldom';
import * as source from '../src/plugin.js';
import * as bundle from '../dist/nP.plugin.esm.js';

const bundleUrl = new URL('../dist/nP.plugin.esm.js', import.meta.url);
const packageVersion = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

// This runs in a separate worker so its blocked globals cannot affect other tests.
// Import first: the retained host chart exports include D3 feature detection.
async function exerciseWorkerApi() {
    const {parentPort, workerData} = await import('node:worker_threads');
    const nP = await import(workerData);
    for (const name of [
        'document', 'window', 'navigator', 'Image', 'Blob', 'URL', 'XMLSerializer',
        'ClipboardItem', 'ResizeObserver', 'OffscreenCanvas', 'fetch',
        'XMLHttpRequest', 'WebSocket', 'localStorage', 'sessionStorage', 'indexedDB'
    ]) {
        Object.defineProperty(globalThis, name, {
            configurable: true,
            get() { throw new Error(`Worker API accessed blocked global: ${name}`); }
        });
    }

    nP.global.fList = [2e9];
    const resistor = nP.R(50);
    const nodal = nP.nodal([resistor, 37, 1], [resistor, 45, 37], ['out', 45, 1]);
    const cascade = nP.cascade(resistor, resistor);
    const graph = nP.schematicGraph(nodal);
    const topology = nP.schematicTopology(nodal);
    const svg = nP.schematicSvg(nodal, {dots: {terminals: true}});
    const cascadeSvg = nP.schematicSvg(cascade);
    const escapedSvg = nP.schematicSvg({_schematic: {
        kind: 'component', symbol: 'resistor', value: '<script>alert("x")</script>'
    }});
    let invalidInputError;
    try { nP.schematicSvg({}); }
    catch (error) { invalidInputError = error.message; }

    // A grouped ladder exercises ORI and bundled symbol geometry in the worker.
    const ladder = nP.nodal(
        {ladder: [
            [nP.Tee(), 4, 1, 2],
            [nP.C(1e-12), 4, 5],
            [nP.Short(), 5],
            [resistor, 2, 3]
        ]},
        ['out', 1, 3]
    );
    const ladderGraph = nP.schematicGraph(ladder);
    const ladderSvg = nP.schematicSvg(ladder);

    nP.global.tList = nP.global.tGen(0, 6e-9, 7);
    const pnCount = nP.PN({stages: 3}).out('samples').length;
    nP.global.tList = nP.global.tGen(0, 7 / 8000, 8);
    const samples = nP.waveform({shape: 'square', period: 1e-3}).out('samples');
    const fft = nP.FFT(samples);
    const reconstructed = nP.invFFT(fft);
    const fftError = Math.max(...samples.map((value, index) =>
        Math.abs(value - reconstructed[index].getR())));
    const dbv = fft.out('dBV');

    nP.global.tList = nP.global.tGen(0, 7 / 4e9, 8);
    nP.global.fList = [];
    const tx = nP.mod({mode: 'bits', bits: '10', samplesPerBit: 4});
    const circuit = nP.cascade(nP.Thru(), {signal: tx});
    const rx = nP.demod(circuit, {noise: false});
    const ber = nP.bitErrorRate(tx, circuit, {noise: false, receptions: 1});
    const signalSvg = nP.schematicSvg({transmitter: tx, circuit, receiver: rx});
    parentPort.postMessage({version: nP.version, graph, topology, svg, cascadeSvg,
        escapedSvg, invalidInputError, ladderGraph, ladderSvg, pnCount, fftError,
        dbv, bits: rx.out('bit string'), ber, signalSvg});
}

function runWorker() {
    const worker = new Worker(`(${exerciseWorkerApi.toString()})()`, {
        eval: true,
        workerData: bundleUrl.href,
        execArgv: []
    });
    return new Promise((resolve, reject) => {
        worker.once('message', resolve);
        worker.once('error', reject);
        worker.once('exit', code => reject(new Error(`Worker exited before returning data: ${code}`)));
    }).finally(() => worker.terminate());
}

test('restricted distribution matches the source version and exact exports', () => {
    assert.equal(bundle.version, packageVersion);
    assert.equal(bundle.version, source.version);
    assert.deepEqual(Object.keys(bundle).sort(), Object.keys(source).sort());
});

test('restricted distribution excludes legacy injection and executable loading patterns', () => {
    const text = readFileSync(bundleUrl, 'utf8');
    for (const pattern of [
        /\b(?:bodyWidth|callCodemirror|getCircuitTitle|runButton|newScript)\b/,
        /\b(?:eval|Function|fetch|importScripts|require|Worker|SharedWorker)\s*\(/,
        /\b(?:XMLHttpRequest|WebSocket|EventSource|WebTransport)\b/,
        /\b(?:localStorage|sessionStorage|indexedDB)\b/,
        /\bcreateElement\s*\(\s*['"]script['"]\s*\)/,
        /\bcreateEl\s*\(\s*['"]script['"]\s*\)/,
        /\bimport\s*(?:\(|['"])/,
        /^import\s/m,
        /\bexport\s+.*\sfrom\s+['"]/,
        /\b(?:document\.write|newScript\.innerHTML)\b/
    ]) assert.doesNotMatch(text, pattern);
    // DOM-capable host chart functions remain part of this entry by design.
    for (const name of ['lineChart', 'lineTable', 'smithChart', 'log', 'schematic']) {
        assert.equal(typeof bundle[name], 'function', name);
    }
});

test('restricted bundle generates transferable SVG and data with browser APIs blocked',
    {timeout: 30000}, async () => {
        const result = await runWorker();
        assert.equal(result.version, packageVersion);
        assert.deepEqual(result.graph.externalPorts.map(port => port.node), [45, 1]);
        assert.equal(result.graph.components.length, 2);
        assert.equal(result.topology.parts.length, 2);
        assert.equal(result.ladderGraph.shape, 'ladder');
        assert.match(result.svg, /data-schematic-dot="terminal"/);
        assert.match(result.escapedSvg, /&lt;script&gt;/);
        assert.doesNotMatch(result.escapedSvg, /<script\b/i);
        assert.match(result.invalidInputError, /schematic metadata/);
        assert.equal(result.pnCount, 7);
        assert.ok(result.fftError < 1e-12);
        assert.equal(result.dbv.length, 6);
        assert.equal(result.bits, '10');
        assert.equal(result.ber, 0);
        for (const svg of [result.svg, result.cascadeSvg, result.ladderSvg, result.signalSvg]) {
            assert.equal(typeof svg, 'string');
            assert.equal(new DOMParser().parseFromString(svg, 'image/svg+xml')
                .getElementsByTagName('parsererror').length, 0);
            assert.doesNotMatch(svg, /<(?:script|foreignObject)\b|\bon\w+\s*=|\b(?:href|src)\s*=/i);
        }
    });
