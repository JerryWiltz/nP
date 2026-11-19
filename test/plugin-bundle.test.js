// Modified: 2026-11-19
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
    const junction = nP.nodal(
        [nP.Tee4(), 1, 2, 3, 4],
        [resistor, 2, 5],
        [resistor, 3, 6],
        [resistor, 4, 7],
        ['out', 1, 5, 6, 7]
    );
    const junctionGraph = nP.schematicGraph(junction);
    const junctionSvg = nP.schematicSvg(junction, {shapes: ['powerCombiner']});
    const authored = {
        paths: ['4 left up Vin=V(1 Vrms)[1,2] 1 4', '1 right R1=R(50 ohm) 2',
            '2 right R5=R(75 ohm) 3', '3 down R6=R(50 ohm) 4', 'alignY Vin.1 R6.1'],
        annotations: [
            {type: 'rectangle', around: 'R5', extendTo: {node: 4, segment: 'bottom'}, style: 'dotted', padding: 20},
            {type: 'arrow', node: 2, toward: 'R5', label: 'I1', position: 'below'},
            {type: 'port', number: 1, node: 2, reference: 4, side: 'left'}
        ]
    };
    const authoredSvg = nP.schematicSvg(authored), authoredGraph = nP.schematicGraph(authored);

    const q = nP.NPN({model: 'BFR93A', bias: {ib: {points: 2}, vce: {points: 3}}});
    const supply = nP.V(-12, {fList: [0, 1e6]});
    const voltageSource = {source: supply.source, dc: supply._dcModel,
        rf: supply.out('s11Re', 's12Re', 's21Re', 's22Re'), svg: nP.schematicSvg(supply)};
    const dcNetwork = nP.nodal(
        [nP.C(1e-9), 6, 1],
        [nP.Tee(), 8, 1, 2],
        [nP.V(1), 8, 9],
        [nP.Short(), 9],
        [nP.R(50), 2, 3],
        [nP.R(75), 3, 4],
        [nP.Tee(), 10, 4, 5],
        [nP.R(50), 10, 11],
        [nP.Short(), 11],
        [nP.C(1e-9), 5, 7],
        ['out', 6, 7]
    );
    const dcOperatingPoint = dcNetwork.solveDC();
    const biased = nP.nodal(
        [nP.C(1e-9), 100, 10],
        [nP.Tee4(), 11, 10, 12, 13],
        [nP.R(100e3), 14, 11],
        [nP.R(22e3), 12, 15],
        [nP.Short(), 15],
        [nP.NPN(), 13, 20, 30],
        [nP.Tee(), 21, 20, 22],
        [nP.R(2200), 23, 21],
        [nP.C(1e-9), 22, 101],
        [nP.R(1000), 30, 31],
        [nP.Short(), 31],
        [nP.Tee(), 24, 14, 23],
        [nP.V(12), 24, 25],
        [nP.Short(), 25],
        ['out', 100, 101]
    );
    const automaticBias = {operatingPoint: biased.operatingPoint, rf: biased.out('s21dB', 'NF21dB'),
        qPoint: biased._intermod.components[5].bias, graph: nP.schematicGraph(biased), svg: nP.schematicSvg(biased)};


    const amplifier = nP.nodal([q, 1, 2, 3], [nP.Short(), 3], ['out', 1, 2]);
    const target = nP.NPN({model: 'BFR93A', qPoint: {ib: 40e-6, vce: 3}});
    const rebuilt = amplifier._withOperatingPoints([{path: 'p1', intrinsicVbe: target.bias.intrinsicVbe,
        intrinsicVbc: target.bias.intrinsicVbc, ve: 0}]);
    const targetAmplifier = nP.nodal([target, 1, 2, 3], [nP.Short(), 3], ['out', 1, 2]);
    const handoff = {bias: rebuilt._intermod.components[0].bias, originalBias: q.bias,
        rf: rebuilt.out('s21dB', 'NF21dB'), expectedRf: targetAmplifier.out('s21dB', 'NF21dB'),
        points: rebuilt._operatingPoints};

    const npn = {curves: q.ivTable(), rf: amplifier.out('s21dB', 'K', 'NF21dB'),
        svg: nP.schematicSvg(q)};
    const pnpDevice = nP.PNP({bias: {ib: {points: 2}, vce: {points: 3}}});
    const pnpAmplifier = nP.nodal([pnpDevice, 1, 2, 3], [nP.Short(), 3], ['out', 1, 2]);
    const pnp = {curves: pnpDevice.ivTable(), rf: pnpAmplifier.out('s21dB', 'K', 'NF21dB'),
        bias: pnpDevice.bias, svg: nP.schematicSvg(pnpAmplifier)};
    const d = nP.D({bias: {vd: {points: 3}}});
    const diode = {curves: d.ivTable(), rf: d.out('s21dB', 'NF21dB'),
        bias: d.bias, svg: nP.schematicSvg(d)};

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
        escapedSvg, invalidInputError, ladderGraph, ladderSvg, junctionGraph, junctionSvg, authoredSvg, authoredGraph, pnCount, fftError,
        dbv, bits: rx.out('bit string'), ber, signalSvg, npn, pnp, diode, dcTopology: amplifier._dcModel, voltageSource, dcOperatingPoint, handoff, automaticBias});
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
        assert.ok(Math.abs(result.handoff.bias.ib - 40e-6) < 1e-12);
        assert.ok(Math.abs(result.handoff.originalBias.ib - 20e-6) < 1e-12);
        assert.deepEqual(result.handoff.rf, result.handoff.expectedRf);
        assert.deepEqual(result.handoff.points.map(point => point.path), ['p1']);
        assert.equal(result.automaticBias.operatingPoint.method, 'nonlinear');
        assert.ok(Math.abs(result.automaticBias.qPoint.ic - 0.0013077639633) < 1e-10);
        assert.ok(result.automaticBias.operatingPoint.residuals.maxNormalizedResidual <= 1);
        assert.ok(result.automaticBias.rf[1].every(Number.isFinite));
        assert.equal(result.automaticBias.graph.shape, 'commonEmitter');
        assert.equal(result.automaticBias.graph.components.length, 14);
        assert.equal(result.dcOperatingPoint.converged, true);
        assert.ok(Math.abs(result.dcOperatingPoint.components.find(part => part.path === 'p5').terminalCurrents[0] - 1 / 175) < 1e-12);
        assert.deepEqual(result.dcOperatingPoint.ports.map(port => [port.node, port.voltage, port.current]), [[6, null, 0], [7, null, 0]]);
        assert.equal(result.dcTopology.kind, 'connection');
        assert.deepEqual(result.dcTopology.definition.components.map(p => p.id), ['p1', 'p2']);
        assert.deepEqual(result.dcTopology.definition.components.map(p => p.model.constructorName), ['NPN', 'Short']);
        assert.equal(result.voltageSource.source.voltage, -12);
        assert.equal(result.voltageSource.dc.definition.voltage, -12);
        assert.deepEqual(result.voltageSource.rf.slice(1), [[0, 0, 1, 1, 0], [1e6, 1, 0, 0, 1]]);
        assert.match(result.voltageSource.svg, /V1 = -12 V/);
        assert.equal(result.version, packageVersion);
        assert.equal(result.npn.curves.length, 4);
        assert.ok(result.npn.rf[1].every(Number.isFinite));
        assert.match(result.npn.svg, /<svg/);
        assert.equal(result.pnp.curves.length, 4);
        assert.equal(result.pnp.curves[3][0], -10);
        assert.ok(result.pnp.bias.ic < 0);
        assert.ok(result.pnp.rf[1].every(Number.isFinite));
        assert.match(result.pnp.svg, /<svg/);
        assert.equal(result.diode.curves.length, 4);
        assert.equal(result.diode.bias.vd, 0.6);
        assert.ok(result.diode.rf[1].every(Number.isFinite));
        assert.match(result.diode.svg, /<svg/);
        assert.deepEqual(result.graph.externalPorts.map(port => port.node), [45, 1]);
        assert.equal(result.graph.components.length, 2);
        assert.equal(new Set(result.graph.nodes.map(node => node.id)).size, result.graph.nodes.length);
        assert.ok(result.graph.board.boxes.every(box => !Object.hasOwn(box, 'nodeDot')));
        assert.equal(result.topology.parts.length, 2);
        assert.equal(result.ladderGraph.shape, 'ladder');
        assert.equal(result.junctionGraph.pattern, 'junction');
        assert.equal(result.junctionGraph.externalPorts.length, 4);
        assert.equal(result.junctionGraph.nodes.length, 7);
        assert.equal(result.authoredGraph.kind, 'schematic-input');
        assert.equal(result.authoredGraph.components.length, 4);
        assert.match(result.svg, /data-schematic-dot="terminal"/);
        assert.match(result.escapedSvg, /&lt;script&gt;/);
        assert.doesNotMatch(result.escapedSvg, /<script\b/i);
        assert.match(result.invalidInputError, /schematic metadata/);
        assert.equal(result.pnCount, 7);
        assert.ok(result.fftError < 1e-12);
        assert.equal(result.dbv.length, 6);
        assert.equal(result.bits, '10');
        assert.equal(result.ber, 0);
        for (const svg of [result.svg, result.cascadeSvg, result.ladderSvg, result.junctionSvg, result.authoredSvg, result.signalSvg, result.automaticBias.svg]) {
            assert.equal(typeof svg, 'string');
            assert.equal(new DOMParser().parseFromString(svg, 'image/svg+xml')
                .getElementsByTagName('parsererror').length, 0);
            assert.doesNotMatch(svg, /<(?:script|foreignObject)\b|\bon\w+\s*=|\b(?:href|src)\s*=/i);
        }
    });
