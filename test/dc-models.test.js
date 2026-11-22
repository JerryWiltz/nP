// Modified: 2026-11-22
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as nP from '../src/np-nport/src/index.js';
import {global} from '../src/np-global/src/global';
import {dcRequirements, validateDcModel} from '../src/np-nport/src/dcModel';

const synthesisHelpers = new Set(['chebyLPgk', 'chebyLPLCs', 'chebyLPNsec']);
const missingPhysicalModels = new Set(['Amp', 'NoiseDiode', 'Shift90', 'Coupler180', 'trf', 'trf4Port', 'trfAuto', 'mlin', 'mclin']);

function example(name) {
    if (name === 'nodal') return nP.nodal([nP.R(), 1, 2], ['out', 1, 2]);
    if (name === 'cascade') return nP.cascade(nP.R(), nP.C());
    return nP[name]();
}

test('every electrical export, including future constructors, has a valid DC descriptor and an audit entry', () => {
    const audit = readFileSync(new URL('../developmentDocs/components/dcConstructorAudit.md', import.meta.url), 'utf8');
    const audited = new Set([...audit.matchAll(/^\| `(\w+)` \|/gm)].map(match => match[1]));
    for (const name of Object.keys(nP)) {
        assert.ok(audited.has(name), name + ' needs a DC audit entry');
        const part = example(name);
        if (synthesisHelpers.has(name)) {
            assert.equal(part._dcModel, undefined, name);
            continue;
        }
        const model = part._dcModel;
        assert.ok(model, name + ' needs a DC descriptor');
        assert.equal(validateDcModel(model), model, name);
        assert.equal(model.constructorName, name);
        assert.ok(Object.isFrozen(model.definition), name);
        if (part.spars) assert.equal(model.portCount, Math.sqrt(part.spars[0].length - 1));
        if (missingPhysicalModels.has(name)) {
            assert.equal(model.kind, 'requiresModel', name);
            assert.ok(model.reason.length > 20, name);
        }
    }
});

test('series/shunt and series/parallel RLC definitions retain their actual branch topology', () => {
    assert.deepEqual(nP.paSeRC(123, 4e-12)._dcModel.definition.elements, [
        {type: 'resistor', terminals: [1, 'n1'], resistance: 123},
        {type: 'capacitor', terminals: ['n1', 'g'], capacitance: 4e-12}
    ]);
    assert.deepEqual(nP.sePaRC(123, 4e-12)._dcModel.definition.elements, [
        {type: 'resistor', terminals: [1, 2], resistance: 123},
        {type: 'capacitor', terminals: [1, 2], capacitance: 4e-12}
    ]);
    assert.deepEqual(nP.paL(8e-9)._dcModel.definition.joins, [[1, 2]]);
    assert.deepEqual(nP.paL(8e-9)._dcModel.definition.elements,
        [{type: 'inductor', terminals: [1, 'g'], inductance: 8e-9}]);
    assert.equal(nP.R(0)._dcModel.definition.elements[0].resistance, 0);
    assert.equal(nP.R(-1)._dcModel.kind, 'requiresModel');
    assert.deepEqual(nP.Tclin()._dcModel.definition.joins, [[1, 2], [4, 3]]);
    assert.deepEqual(nP.seriesTee()._dcModel.definition.voltageConstraint, [1, -1, 1]);
    assert.deepEqual(nP.seriesTee()._dcModel.definition.currentRatios, [1, -1, 1]);
});

test('resolved values, temperature and analysis context are owned snapshots', () => {
    const saved = {fList: global.fList, Ro: global.Ro, Temp: global.Temp};
    try {
        global.Ro = 75;
        const frequencies = [1e6, 2e6];
        const options = {resistance: 42, temperature: 330, fList: frequencies};
        const resistor = nP.R(options), load = nP.Load(), attenuator = nP.Attn(6);
        options.resistance = 99; frequencies.push(3e6); global.Ro = 50;
        resistor.global.fList.push(4e6);
        assert.equal(resistor._dcModel.definition.parameters.resistance, 42);
        assert.equal(resistor._dcModel.definition.temperature, 330);
        assert.deepEqual(resistor._dcModel.analysis.fList, [1e6, 2e6]);
        assert.equal(load._dcModel.definition.parameters.resistance, 75);
        assert.equal(attenuator._dcModel.definition.parameters.referenceImpedance, 75);
        assert.throws(() => resistor._dcModel.definition.elements.push({}), TypeError);
        assert.throws(() => resistor._dcModel.analysis.fList.push(5e6), TypeError);
    } finally { Object.assign(global, saved); }
});

test('nonlinear descriptors retain device laws and independent curve/Q-point snapshots', () => {
    const q = nP.NPN({model: 'BFR93A'}), pnp = nP.PNP(), diode = nP.D(), legacy = nP.diode1N4148();
    const model = q._dcModel;
    assert.equal(model.definition.polarity, 1);
    assert.equal(pnp._dcModel.definition.polarity, -1);
    assert.equal(model.definition.record.inductors.length, 5);
    assert.equal(model.definition.record.capacitors.length, 3);
    assert.equal(nP.NPN()._dcModel.definition.record.parameters.VAR, Infinity);
    const beta = model.definition.record.parameters.BF;
    const fixedVce = q.qPoint.vce;
    q.model.parameters.BF = 1;
    q.dc.bias.vce.points = 3;
    q.qPoint.vce = 123;
    assert.equal(model.definition.record.parameters.BF, beta);
    assert.equal(model.definition.curveSettings.vce.points, 201);
    assert.equal(model.definition.initialQPoint.vce, fixedVce);
    assert.notEqual(q.dc, model);
    assert.equal(diode._dcModel.definition.modelId, 'diode');
    assert.equal(legacy._dcModel.definition.modelId, 'legacy-diode');
    assert.ok(diode._dcModel.definition.record.leakageResistance > 0);
    assert.equal(legacy._dcModel.definition.parameters.leakageResistance, 4e9);
    const hemt = nP.HEMT();
    assert.equal(hemt._dcModel.definition.modelId, 'hemt');
    assert.equal(hemt._dcModel.definition.record.parameters.RG, 1);
    assert.ok(Object.isFrozen(hemt._dcModel.definition.record.inductors));
});

test('physical DC definitions retain finite via/film resistance and distinguish lossless lines', () => {
    for (const name of ['mvia', 'mvgnd']) {
        const part = nP[name]();
        assert.equal(part._dcModel.definition.elements[0].resistance, part.microstrip.Rdc);
        assert.ok(part.microstrip.Rdc > 0);
        part.microstrip.Rdc = 999;
        assert.notEqual(part._dcModel.definition.elements[0].resistance, 999);
    }
    assert.equal(nP.mlin()._dcModel.kind, 'requiresModel');
    assert.deepEqual(nP.mlin({resistivity: 0})._dcModel.definition.joins, [[1, 2]]);
    assert.deepEqual(nP.mclin({resistivity: 0})._dcModel.definition.joins, [[1, 2], [4, 3]]);
    const film = nP.mtfr({sections: 2, ohmsPerSquare: 50});
    assert.equal(film._dcModel.definition.construction.parameters.resistance, film.filmResistor.resistance);
    assert.equal(dcRequirements(film._dcModel).length, 0);
    assert.ok(nP.mstep()._dcModel.definition.parameters.omissions.length);
});
