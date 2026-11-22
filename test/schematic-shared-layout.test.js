// Modified: 2026-11-22
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph} from '../src/np-chart/src/schematic';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';
import {schematicSymbols} from '../src/np-chart/src/schematicSymbols';
import {componentLeadDirections} from '../src/np-chart/src/schematicCaptions';

test('terminal directions use connected geometry regardless of lead-array order or shared paths', () => {
    const placement = {rotation: 0, mirrorX: false, mirrorY: false};
    for (const [name, symbol] of Object.entries(schematicSymbols)) {
        const before = JSON.stringify(symbol);
        const directions = componentLeadDirections(placement, symbol);
        const reordered = {...symbol, leads: symbol.leads.slice().reverse().map(lead => lead.slice().reverse())};
        assert.deepEqual(componentLeadDirections(placement, reordered), directions, name);
        assert.ok(directions.every(([x, y]) => Math.abs(x) + Math.abs(y) === 1), name);
        assert.equal(JSON.stringify(symbol), before);
    }
    assert.deepEqual(componentLeadDirections(placement, schematicSymbols.attenuator), [[-1, 0], [1, 0]]);
});

for (const reordered of [false, true]) test(`continuous-lead components render in connected circuits; reordered ${reordered}`, () => {
    nP.global.fList = [10e9];
    const diode = nP.NoiseDiode(), short = nP.Short(), pad = nP.Attn(10), resistor = nP.R(1200);
    const rows = [[diode, 70, 90], [short, 70], [pad, 90, 110], [resistor, 110, 130]];
    const network = nP.nodal(...(reordered ? rows.reverse() : rows), ['out', 130]);
    const before = JSON.stringify(network), graph = schematicGraph(network);
    assert.equal(graph.components.length, 4);
    assertReadableCaptions(graph);
    assert.equal(JSON.stringify(network), before);
    const description = {paths: ['7 right A1=Attn(10 dB) 8', '8 right R1=R(1200 ohm) 9']};
    assertReadableCaptions(schematicGraph(description));
});

function overlaps(a, b) {
    return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
}

function assertReadableCaptions(graph) {
    const bodies = graph.board.boxes.filter(box => box.kind === 'component');
    const occupied = bodies.map(box => box.bounds).concat(graph.wires.map(wire => {
        const [a, b] = wire.points;
        return [Math.min(a[0], b[0]) - 2, Math.min(a[1], b[1]) - 2,
            Math.max(a[0], b[0]) + 2, Math.max(a[1], b[1]) + 2];
    }));
    graph.labels.slice(0, graph.components.length).forEach((label, index) => {
        const half = Math.ceil(label.text.length * 9 / 2), [x, y] = label.at;
        const bounds = [x - half, y - 16, x + half, y + 4];
        assert.ok(!occupied.some(box => overlaps(bounds, box)), `caption collision: ${label.text}`);
        const owner = bodies[index].bounds;
        const gap = Math.hypot(Math.max(0, owner[0] - bounds[2], bounds[0] - owner[2]),
            Math.max(0, owner[1] - bounds[3], bounds[1] - owner[3]));
        assert.ok(gap <= 100, `caption left its component: ${label.text}`);
        occupied.push(bounds);
    });
}

function terminatedLadder(parts, reordered = false) {
    nP.global.fList = [1e9];
    const tee = nP.Tee(), short = nP.Short();
    const rows = parts.flatMap((chain, index) => [
        [tee, 100 + index, index + 1, index + 2],
        ...chain.map((part, position) => [part, position ? 200 + index * 10 + position - 1 : 100 + index,
            200 + index * 10 + position]),
        [short, 200 + index * 10 + chain.length - 1]
    ]);
    return nP.nodal(...(reordered ? rows.reverse() : rows), ['out', 1, parts.length + 1]);
}

for (const reordered of [false, true]) {
    test(`shared shunt baselines follow branch structure with unequal lengths; reordered ${reordered}`, () => {
        nP.global.fList = [1e9];
        const network = terminatedLadder([[nP.R(100)], [nP.C(1e-12)], [nP.R(75), nP.L(5e-9)]], reordered);
        const before = JSON.stringify(network);
        const graph = schematicGraph(network, {shapes: ['ladder']});
        const shorts = graph.components.filter(part => part.symbol === 'short');
        assert.equal(shorts.length, 3);
        assert.equal(new Set(shorts.map(part => part.ports[0].at[1])).size, 1);
        assert.equal(JSON.stringify(network), before);
        assertReadableCaptions(graph);
    });
}

test('wide shunts are measured without a per-shape spacing opt-in', () => {
    nP.global.fList = [1e9];
    const rlc = nP.paSeRLC(100, 5e-9, 1e-12);
    const network = terminatedLadder([[rlc], [rlc]]);
    assert.equal(schematicShapeBoards.ladder.board.spacing, undefined);
    const graph = schematicGraph(network, {shapes: ['ladder']});
    assert.equal(graph.components.length, 6);
    assert.equal(new Set(graph.components.filter(part => part.symbol === 'short').map(part => part.ports[0].at[1])).size, 1);
});

test('named layouts express relationships without corrective coordinates or lead lengths', () => {
    const definitions = [schematicShapeBoards.powerDivider,
        schematicShapeBoards.commonEmitter, ...schematicShapeBoards.commonEmitter.alternatives];
    for (const definition of definitions) {
        assert.equal(definition.board.layout, 'relations');
        for (const tile of definition.board.components) for (const key of ['at', 'from', 'offset']) {
            assert.equal(Object.hasOwn(tile, key), false, `${definition.name}: ${tile.slot}.${key}`);
        }
        assert.ok(definition.board.externalPorts.every(port => !Object.hasOwn(port, 'cells')));
    }
});

test('long numerical captions reserve space in ordinary series and shunt paths', () => {
    nP.global.fList = [1e9];
    const r1 = nP.R(123456789), r2 = nP.R(987654321), c1 = nP.C(123.456e-15);
    const network = nP.nodal([r1, 1, 2], [r2, 2, 3], ['out', 1, 3]);
    assertReadableCaptions(schematicGraph(network, {significantDigits: 15}));
    assertReadableCaptions(schematicGraph(terminatedLadder([[r1], [r2], [c1]]), {significantDigits: 15}));
});

test('drawing descriptions reserve nearby captions while preserving explicit alignment', () => {
    const description = {paths: ['1 down TOP=R(123456789 ohm) 2', '3 down BOTTOM=C(123456789 pF) 4',
        'alignY TOP.1 BOTTOM.1']};
    const graph = schematicGraph(description);
    assert.equal(graph.components[0].ports[0].at[1], graph.components[1].ports[0].at[1]);
    assertReadableCaptions(graph);
});

test('generic one-port attachments use terminal geometry without a selected-device flag', () => {
    nP.global.fList = [1e9];
    const junction = nP.Tee4(), short = nP.Short(), load = nP.Load(50);
    const network = nP.nodal([junction, 1, 2, 3, 4], [short, 3], [load, 4], ['out', 1, 2]);
    const graph = schematicGraph(network, {shapes: ['generic']});
    assert.equal(graph.components.find(part => part.symbol === 'short').id, 'SHORT1');
    assert.equal(new Set(graph.components.map(part => part.id)).size, graph.components.length);
    assertReadableCaptions(graph);
});

test('a coupled section with outward terminations composes without a tuned display lead', () => {
    nP.global.fList = [1e9];
    const line = nP.Tclin(), load = nP.Load(50), r1 = nP.R(25);
    const network = nP.nodal(
        {edgeCoupledFilter: [[line, 1, 10, 2, 11], [load, 10], [load, 11]]},
        {series: [[r1, 2, 3]]},
        ['out', 1, 3]
    );
    const before = JSON.stringify(network);
    const graph = schematicGraph(network);
    assert.deepEqual(graph.shapes.map(shape => shape.name), ['edgeCoupledFilter', 'series']);
    assert.deepEqual(graph.crossings, []);
    assertReadableCaptions(graph);
    assert.equal(JSON.stringify(network), before);
});
