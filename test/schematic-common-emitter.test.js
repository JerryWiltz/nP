// Modified: 2026-11-19
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {schematicGraph, schematicSvg, schematicTopology} from '../src/np-chart/src/schematic';
import {detectSchematicShapes} from '../src/np-chart/src/schematicShapeDetector';
import {schematicShapeBoards} from '../src/np-chart/src/schematicShapeBoards';
import {symbolForSchematicEntry} from '../src/np-chart/src/nodalBlockSymbol';

function amplifier({emitter = 'split', supplyBypass = true, collectorCommon = 'output', railOrder = 'collectorFirst', pnp = false, reordered = false, grouped = false} = {}) {
    const g = nP.global();
    g.fList = [1e6, 100e6];
    g.Temp = 293;
    g.Ro = 50;
    const q1 = pnp ? nP.PNP({model: '2N3906'}) : nP.NPN({model: '2N3904'});
    const v1 = nP.V(pnp ? -12 : 12), r1 = nP.R(100e3), r2 = nP.R(22e3), rc = nP.R(2.2e3);
    const c1 = nP.C(10e-9), c2 = nP.C(10e-9), c3 = nP.C(10e-9), c4 = nP.C(10e-9);
    const tee4 = nP.Tee4(), tee = nP.Tee(), short = nP.Short();
    const re = emitter === 'combined' ? nP.sePaRC(1e3, 10e-9) : nP.R(1e3);
    const collectorFirst = supplyBypass && railOrder === 'collectorFirst';
    // Both supplied drawings: npn2 collector-first and the original npnAmp.
    let rows = [
        [c1, 1, 2],
        [tee4, 9, 2, 21, 3],
        [q1, 3, 20, 11],
        [r1, 21, 6],
        [r2, 9, 10],
        [short, 10],
        collectorFirst ? [tee, 18, 6, 8] : [tee, 16, 6, 7],
        [v1, collectorFirst ? 7 : 16, 17],
        [short, 17],
        [rc, 18, 19],
        collectorCommon === 'output' ? [tee, 4, 20, 19] : [tee, 19, 20, 4],
        [c4, 4, 5]
    ];
    rows.push(...(supplyBypass ? [
        collectorFirst ? [tee, 16, 8, 7] : [tee, 18, 7, 8],
        [c2, collectorFirst ? 16 : 8, 22],
        [short, 22]
    ] : [[tee, 16, 6, 18]]));
    if (!supplyBypass) rows.splice(6, 1);
    rows.push(...(emitter === 'split' ? [
        [tee, 11, 14, 12],
        [re, 12, 13],
        [short, 13],
        [c3, 14, 15],
        [short, 15]
    ] : [[re, 11, 13], [short, 13]]));
    if (reordered) rows = rows.reverse().map(([part, ...nodes]) => [part, ...nodes.map(node => node * 7 + 103)]);
    if (grouped) return nP.nodal({commonEmitter: rows}, {series: [[nP.R(25), 5, 99]]}, ['out', 1, 99]);
    return nP.nodal(...rows, ['out', ...(reordered ? [110, 138] : [1, 5])]);
}

const detectionGeometry = {symbol: symbolForSchematicEntry,
    placement() { throw new Error('Detection must not place symbols.'); },
    bounds() { throw new Error('Detection must not calculate layout.'); }};

function assertConnected(graph) {
    for (const node of graph.nodes) {
        const ends = graph.components.flatMap(part => part.ports).concat(graph.externalPorts)
            .filter(port => port.node === node.id);
        assert.equal(ends.length, 2);
        const neighbors = new Map();
        for (const wire of graph.wires.filter(wire => wire.node === node.id)) {
            const [a, b] = wire.points;
            assert.ok(a[0] === b[0] || a[1] === b[1]);
            assert.notDeepEqual(a, b);
            assert.ok([...a, ...b].every(value => value % 10 === 0));
            for (const [from, to] of [[a, b], [b, a]]) {
                const key = from.join(',');
                neighbors.set(key, [...(neighbors.get(key) || []), to.join(',')]);
            }
        }
        const pending = [ends[0].at.join(',')], seen = new Set();
        while (pending.length) {
            const key = pending.pop();
            if (seen.has(key)) continue;
            seen.add(key);
            pending.push(...(neighbors.get(key) || []));
        }
        assert.ok(ends.every(end => seen.has(end.at.join(','))), `node ${node.id} is disconnected`);
        assert.equal(seen.size, neighbors.size);
    }
    assert.deepEqual(graph.crossings, []);
    assert.ok(graph.board.boxes.every(box => !Object.hasOwn(box, 'nodeDot')));
    for (const box of graph.board.boxes.filter(box => box.kind === 'component')) {
        const [left, top, right, bottom] = box.bounds;
        for (const {points: [a, b]} of graph.wires) {
            const crosses = a[0] === b[0] ? a[0] > left && a[0] < right &&
                Math.max(a[1], b[1]) > top && Math.min(a[1], b[1]) < bottom :
                a[1] > top && a[1] < bottom && Math.max(a[0], b[0]) > left && Math.min(a[0], b[0]) < right;
            assert.equal(crosses, false, `a wire crosses component ${box.id}`);
        }
    }
}

for (const emitter of ['split', 'combined', 'resistor']) for (const supplyBypass of [true, false]) {
    for (const collectorCommon of ['output', 'supply']) for (const railOrder of supplyBypass ? ['collectorFirst', 'sourceFirst'] : ['sourceFirst']) {
        test(`commonEmitter detects ${emitter}, supply bypass ${supplyBypass}, collector common ${collectorCommon}, ${railOrder}`, () => {
            const network = amplifier({emitter, supplyBypass, collectorCommon, railOrder});
            const before = JSON.stringify(network);
            assert.equal(network.operatingPoint.converged, true);
            const point = network.operatingPoint.components.find(part => part.qPoint).qPoint;
            assert.ok(Math.abs(point.ic - 0.0013077639633126996) < 1e-12);
            assert.deepEqual(detectSchematicShapes(network, schematicShapeBoards, detectionGeometry), {shapes: ['commonEmitter']});
            const graph = schematicGraph(network);
            const guided = schematicGraph(network, {shapes: ['commonEmitter']});
            assert.equal(graph.shape, 'commonEmitter');
            assert.deepEqual(graph, guided);
            assert.equal(graph.components.length, network._schematic.components.length);
            graph.components.forEach((part, index) => {
                assert.deepEqual(part.ports.map(port => port.node), network._schematic.components[index].nodes);
            });
            assertConnected(graph);
            const q1 = graph.components.find(part => part.symbol === 'npn');
            assert.ok(q1.ports[0].at[0] < q1.ports[1].at[0]);
            assert.ok(q1.ports[1].at[1] < q1.ports[0].at[1]);
            assert.ok(q1.ports[2].at[1] > q1.ports[0].at[1]);
            assert.ok(graph.externalPorts[0].at[0] < q1.ports[0].at[0]);
            assert.ok(graph.externalPorts[1].at[0] > q1.ports[1].at[0]);
            const supply = graph.components.find(part => part.boardTile.id === 'source');
            const output = graph.components.find(part => part.boardTile.id === 'output');
            assert.ok(supply.ports[0].at[0] > output.ports[1].at[0]);
            assert.ok(graph.externalPorts[1].at[0] > supply.ports[0].at[0]);
            if (emitter === 'split') {
                const resistorGround = graph.components.find(part => part.boardTile.id === 'emitterGround');
                const capacitorGround = graph.components.find(part => part.boardTile.id === 'emitterBypassGround');
                assert.equal(capacitorGround.ports[0].at[1], resistorGround.ports[0].at[1]);
            }
            if (supplyBypass) {
                const bypass = graph.components.find(part => part.boardTile.id === 'supplyBypass');
                const supplyGround = graph.components.find(part => part.boardTile.id === 'sourceGround');
                const bypassGround = graph.components.find(part => part.boardTile.id === 'supplyBypassGround');
                assert.ok(supply.ports[0].at[0] > bypass.ports[0].at[0]);
                assert.equal(supply.ports[0].at[1] + supply.ports[1].at[1],
                    bypass.ports[0].at[1] + bypass.ports[1].at[1]);
                assert.equal(supplyGround.ports[0].at[1], bypassGround.ports[0].at[1]);
                if (railOrder === 'collectorFirst') {
                    const collectorTee = graph.components.find(part => part.boardTile.id === 'supplyJunction');
                    const bypassTee = graph.components.find(part => part.boardTile.id === 'railJunction');
                    assert.deepEqual(collectorTee.ports.map(port => port.node), [18, 6, 8]);
                    assert.deepEqual(bypassTee.ports.map(port => port.node), [16, 8, 7]);
                    assert.ok(collectorTee.ports[0].at[0] < bypassTee.ports[0].at[0]);
                    assert.ok(bypassTee.ports[0].at[0] < supply.ports[0].at[0]);
                    assert.equal(supply.ports[0].node, 7);
                    assert.equal(bypass.ports[0].node, 16);
                }
            }
            assert.equal(JSON.stringify(network), before, 'drawing must not change DC/RF/noise/nonlinear state');
        });
    }
}

test('the two ideal supply-tee groupings retain the same DC bias and RF/noise results', () => {
    const original = amplifier({railOrder: 'sourceFirst'});
    const revised = amplifier({railOrder: 'collectorFirst'});
    const oldResponse = original.out('s11dB', 's21dB', 'NF21dB');
    const newResponse = revised.out('s11dB', 's21dB', 'NF21dB');
    assert.deepEqual(newResponse[0], oldResponse[0]);
    newResponse.slice(1).forEach((row, index) => row.forEach((value, column) => {
        assert.ok(Math.abs(value - oldResponse[index + 1][column]) < 1e-8);
    }));
    const oldPoint = original.operatingPoint.components.find(part => part.qPoint).qPoint;
    const newPoint = revised.operatingPoint.components.find(part => part.qPoint).qPoint;
    for (const [key, value] of Object.entries(newPoint)) {
        if (typeof value === 'number') assert.ok(Math.abs(value - oldPoint[key]) < 1e-12, key);
        else assert.equal(value, oldPoint[key]);
    }
});

test('commonEmitter preserves renamed nodes, row order and reused templates', () => {
    const network = amplifier({reordered: true});
    const graph = schematicGraph(network);
    assert.equal(graph.shape, 'commonEmitter');
    assertConnected(graph);
    assert.deepEqual(graph.externalPorts.map(port => port.node), [110, 138]);
    assert.equal(schematicTopology(network).connections.flatMap(connection => connection.externalPorts).length, 2);
    assert.match(schematicSvg(network), /<svg/);
});

test('commonEmitter draws PNP polarity and supports whole-board reflection', () => {
    const network = amplifier({pnp: true});
    const graph = schematicGraph(network);
    assert.equal(graph.shape, 'commonEmitter');
    assert.equal(graph.components.filter(part => part.symbol === 'pnp').length, 1);
    const reflected = schematicGraph(network, {shapes: ['commonEmitter'], flipVertical: true});
    assertConnected(reflected);
    assert.deepEqual(reflected.components.map(part => part.ports.map(port => port.node)),
        graph.components.map(part => part.ports.map(port => port.node)));
});

test('commonEmitter composes with a following series section in one analyzed network', () => {
    const network = amplifier({grouped: true});
    const graph = schematicGraph(network);
    assert.deepEqual(graph.shapes.map(shape => shape.name), ['commonEmitter', 'series']);
    assert.equal(graph.components.length, network._schematic.components.length);
    assertConnected(graph);
});

test('commonEmitter matching rejects changed device terminals, source polarity and extra parts', () => {
    const network = amplifier();
    for (const change of ['terminals', 'source', 'extra']) {
        const root = structuredClone(network._schematic);
        if (change === 'terminals') root.components.find(entry => entry.part.symbol === 'npn').nodes.reverse();
        if (change === 'source') root.components.find(entry => entry.part.symbol === 'voltage-source').nodes.reverse();
        if (change === 'extra') root.components.push({part: nP.R(10)._schematic, nodes: [1000, 1001]});
        assert.equal(detectSchematicShapes({_schematic: root}, {commonEmitter: schematicShapeBoards.commonEmitter}, detectionGeometry), null);
        assert.throws(() => schematicGraph({_schematic: root}, {shapes: ['commonEmitter']}), /does not match/i);
    }
});
