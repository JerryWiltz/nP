// Modified: 2026-11-16
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {nPort} from '../src/np-nport/src/nPort';
import {dcConnection, dcModel, dcRequirements, validateDcModel} from '../src/np-nport/src/dcModel';

function resistorCard(resistance = 75) {
    return {version: 1, constructorName: 'CustomResistor', portCount: 2, kind: 'linear', quality: 'ideal',
        definition: {modelId: 'lumped', terminals: [1, 2], joins: [],
            elements: [{type: 'resistor', terminals: [1, 2], resistance}]}};
}

test('network construction exposes only the existing composition APIs', () => {
    assert.equal('circuit' in nP, false);
    const raw = resistorCard(), nodes = [0, 'shared'], outputs = [3, 0];
    const model = dcConnection('nodal', [{part: raw, nodes}, {part: raw, nodes: ['shared', 3]}], outputs);
    raw.definition.elements[0].resistance = 999;
    nodes[0] = 88; outputs[0] = 99;
    assert.deepEqual(model.definition.externalNodes, [3, 0]);
    assert.deepEqual(model.definition.components.map(p => p.nodes), [[0, 'shared'], ['shared', 3]]);
    assert.equal(model.definition.components[0].model.definition.elements[0].resistance, 75);
    assert.throws(() => model.definition.externalNodes.push(4), TypeError);
});

test('groups and nested repeated placements retain unique paths and their terminal boundaries', () => {
    const q = nP.NPN();
    const child = nP.nodal({amplifier: [[q, 1, 2, 3]]}, ['out', 1, 2, 3])._dcModel;
    const parent = nP.nodal([q, 1, 2, 3], [q, 4, 5, 6], ['out', 1, 2, 3, 4, 5, 6])._dcModel;
    const nested = dcConnection('nodal', [{part: child, nodes: [10, 11, 12]},
        {part: child, nodes: [20, 21, 22]}], [10, 21]);
    assert.deepEqual(parent.definition.components.map(p => p.id), ['p1', 'p2']);
    assert.deepEqual(child.definition.groups, [{name: 'amplifier', components: [0]}]);
    assert.deepEqual(nested.definition.components.map(p => p.nodes), [[10, 11, 12], [20, 21, 22]]);
    assert.equal(nested.definition.components[0].model.definition.components[0].id, 'p1');
    assert.equal(nested.definition.components[1].model.definition.components[0].id, 'p1');
    // Identical immutable templates can be shared; p1/p1 and p2/p1 remain
    // distinct placement identities for later node allocation and solved state.
    assert.equal(parent.definition.components[0].model, parent.definition.components[1].model);
    q.qPoint.ib = 999;
    assert.notEqual(child.definition.components[0].model.definition.initialQPoint.ib, 999);
});

test('missing DC information is reported at each placement, including custom nPorts', () => {
    const custom = new nPort();
    const through = nP.Thru();
    custom.setspars(through.spars);
    custom.setglobal(through.global);
    const child = nP.nodal([nP.Amp(), 1, 2], [custom, 2, 3], ['out', 1, 3]);
    const parent = nP.nodal([child, 10, 11], [child, 11, 12], ['out', 10, 12]);
    const requirements = dcRequirements(parent._dcModel);
    assert.deepEqual(requirements.map(r => [r.path, r.constructorName]),
        [['p1/p1', 'Amp'], ['p1/p2', 'nPort'], ['p2/p1', 'Amp'], ['p2/p2', 'nPort']]);
    assert.ok(requirements.every(r => r.reason.length > 20));
    custom._dcModel = validateDcModel(resistorCard(42));
    assert.equal(dcRequirements(nP.nodal([custom, 1, 2], ['out', 1, 2])._dcModel).length, 0);
    assert.equal(dcRequirements(child._dcModel).length, 2);
});

test('nodal, cas, cascade, filter and film construction preserve DC child topology', () => {
    const r = nP.R(12), c = nP.C(2e-12);
    const nodal = nP.nodal({path: [[r, 1, 2], [c, 2, 3]]}, ['out', 3, 1]);
    assert.deepEqual(nodal._dcModel.definition.externalNodes, [3, 1]);
    assert.deepEqual(nodal._dcModel.definition.groups, [{name: 'path', components: [0, 1]}]);
    const method = r.cas(c), helper = nP.cascade(r, c);
    assert.deepEqual(method._dcModel, helper._dcModel);
    assert.deepEqual(method._dcModel.definition.components.map(p => p.nodes), [[1, 2], [2, 3]]);
    const nested = nP.cascade(nodal, r);
    assert.equal(nested._dcModel.definition.components[0].model, nodal._dcModel);
    const filter = nP.lpfGen([50, 1e-12, 5e-9, 1e-12, 75]);
    assert.deepEqual(filter._dcModel.definition.construction.parameters.filter, [50, 1e-12, 5e-9, 1e-12, 75]);
    assert.equal(filter._dcModel.kind, 'connection');
    assert.equal(nP.mtfr({sections: 2})._dcModel.kind, 'connection');
});

test('single-stage signal attachment retains its DC model without creating a bias source', () => {
    const previous = nP.global();
    try {
        nP.global.tList = nP.global.tGen(0, 7 / 4e9, 8);
        nP.global.fList = [];
        const tx = nP.mod({mode: 'bits', bits: '10', samplesPerBit: 4});
        const resistor = nP.R();
        const driven = nP.cascade(resistor, {signal: tx});
        assert.notEqual(driven, resistor);
        assert.equal(driven._dcModel, resistor._dcModel);
        assert.ok(driven.signal);
        assert.deepEqual(dcRequirements(driven._dcModel), []);
    } finally { nP.global(previous); }
});

test('DC topology validation rejects incorrect terminal counts, model definitions and cyclic data', () => {
    assert.throws(() => dcConnection('nodal', [{part: resistorCard(), nodes: [1]}], [1]), /each component terminal/);
    assert.throws(() => dcConnection('nodal', [{part: resistorCard(), nodes: [{}, 2]}], [1]), /node labels/);
    assert.throws(() => validateDcModel({...resistorCard(), version: 2}), /version/);
    assert.throws(() => validateDcModel({...resistorCard(), kind: 'requiresModel'}), /explain/);
    assert.throws(() => dcModel('Bad', 2, 'linear', 'ideal', {modelId: 'unknown'}), /Unknown linear/);
    const malformed = resistorCard();
    malformed.definition.elements[0].terminals = [1, 9];
    assert.throws(() => validateDcModel(malformed), /element/);
    const cyclic = {version: 1, constructorName: 'Cycle', kind: 'connection', quality: 'composite', portCount: 1,
        definition: {modelId: 'connection', terminals: [1], externalNodes: [1], components: []}};
    cyclic.definition.components.push({id: 'p1', nodes: [1], model: cyclic});
    assert.throws(() => validateDcModel(cyclic), /cycles/);
    const custom = new nPort();
    const through = nP.Thru();
    custom.setspars(through.spars);
    custom.setglobal(through.global);
    custom._dcModel = {...resistorCard(), portCount: 1, definition: {modelId: 'junction', terminals: [1], joins: [], opens: [[1, 'g']]}};
    assert.throws(() => dcConnection('nodal', [{part: custom, nodes: [1]}], [1]), /RF terminal counts/);
});
