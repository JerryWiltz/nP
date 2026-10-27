// Modified: 2026-10-27
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph, schematicSvg, schematicTopology} from '../src/np-chart/src/schematic.js';

function amSignalPath() {
    const g = nP.global;
    g.tList = g.tGen(0, 1e-3, 2);
    g.fList = [];
    const transmitter = nP.mod({mode: 'AM', carrierHz: 200e6,
        toneHz: 300, modulationIndex: 0.5});
    const circuit = nP.cascade(nP.Attn(3), {signal: transmitter});
    const receiver = nP.demod(circuit, {noise: false});
    return {transmitter, circuit, receiver};
}

test('a signal-path schematic includes its transmitter and receiver', () => {
    const path = amSignalPath();
    const graph = schematicGraph(path);
    const topology = schematicTopology(path);
    const svg = schematicSvg(path);

    assert.equal(graph.kind, 'signal-flow');
    assert.deepEqual(graph.components.map(part => part.symbol), ['mod', 'attenuator', 'demod']);
    assert.deepEqual(graph.components.map(part => part.value), ['AM', 3, 'AM']);
    assert.deepEqual(topology.parts.map(part => part.type), ['mod', 'attenuator', 'demod']);
    assert.match(svg, /Signal path schematic/);
    assert.match(svg, />MOD</);
    assert.match(svg, />DEMOD</);
    assert.equal(path.circuit._schematic.symbol, 'attenuator');
});

test('a signal-path schematic may end at the RF circuit without a receiver', () => {
    const {transmitter, circuit} = amSignalPath();
    const graph = schematicGraph({transmitter, circuit});
    assert.deepEqual(graph.components.map(part => part.symbol), ['mod', 'attenuator']);
    assert.throws(() => schematicGraph({transmitter: {mode: 'PSK'}, circuit}),
        /transmitter mode/);
});
