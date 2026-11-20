// Modified: 2026-11-19
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {mosfetNetwork} from './fixtures/mosfet-network';
import {schematicGraph, schematicSvg} from '../src/np-chart/src/schematic';
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


for (const name of ['NMOS', 'PMOS']) for (const source of ['split', 'combined', 'resistor']) {
    for (const bypass of [false, true]) for (const common of ['output', 'supply']) {
        for (const railOrder of bypass ? ['sourceFirst', 'collectorFirst'] : ['sourceFirst']) {
            test(name + ' divider commonSource ' + source + ', bypass ' + bypass + ', common ' + common + ', ' + railOrder, () => {
                nP.global.fList = [1e6];
                const network = mosfetNetwork({name, source, bypass, common, railOrder}), before = JSON.stringify(network);
                const graph = schematicGraph(network); assertConnected(graph); assert.equal(graph.shape, 'commonSource');
                assert.equal(graph.components.length, network._schematic.components.length);
                graph.components.forEach((part, i) => assert.deepEqual(part.ports.map(port => port.node), network._schematic.components[i].nodes));
                const bySlot = slot => graph.components.find(part => part.boardTile.id === slot);
                const q = bySlot('device'), supply = bySlot('source'), output = bySlot('output');
                assert.equal(q.symbol, name.toLowerCase());
                assert.ok(q.ports[0].at[0] < q.ports[1].at[0]);
                assert.ok(q.ports[1].at[1] < q.ports[0].at[1]); assert.ok(q.ports[2].at[1] > q.ports[0].at[1]);
                assert.ok(supply.ports[0].at[0] > output.ports[1].at[0]);
                if (source === 'split') assert.equal(bySlot('returnGround').ports[0].at[1], bySlot('returnBypassGround').ports[0].at[1]);
                if (bypass) assert.equal(bySlot('sourceGround').ports[0].at[1], bySlot('supplyBypassGround').ports[0].at[1]);
                assert.equal(JSON.stringify(network), before);
            });
        }
    }
}
test('divider commonSource preserves row/node changes, reflection, composition and explicit guidance', () => {
    nP.global.fList = [1e6];
    for (const options of [{reordered: true}, {name: 'PMOS'}, {grouped: true}]) {
        const network = mosfetNetwork(options);
        for (const flipVertical of [false, true]) {
            const graph = schematicGraph(network, {flipVertical}); assertConnected(graph);
            if (options.grouped) assert.deepEqual(graph.shapes.map(shape => shape.name), ['commonSource', 'series']);
            else { assert.equal(graph.shape, 'commonSource'); assertConnected(schematicGraph(network, {shapes: ['commonSource'], flipVertical})); }
        }
        assert.match(schematicSvg(network), /<svg/);
    }
});
test('an independent-body MOSFET has canonical four-terminal SVG without pretending it matches the three-terminal amplifier board', () => {
    nP.global.fList = [1e6];
    for (const constructor of [nP.NMOS, nP.PMOS]) {
        const q = constructor({body: 'external'}); const graph = schematicGraph(q);
        assert.equal(graph.components[0].ports.length, 4); assert.match(schematicSvg(q), /<svg/);
    }
    assert.throws(() => schematicGraph(mosfetNetwork({q: nP.NMOS({body: 'external'})}), {shapes: ['commonSource']}), /does not match/i);
});
