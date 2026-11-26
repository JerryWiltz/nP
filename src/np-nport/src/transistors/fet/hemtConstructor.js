// Modified: 2026-11-26
import {withCurveOutput} from '../../curveOutput';
import {global} from '../../../../np-global/src/global';
import {nPort} from '../../nPort';
import {componentSettings} from '../../componentSettings';
import {analysisFrequencies} from '../../analysisFrequencies';
import {schematicPart} from '../../schematicPart';
import {dcModel} from '../../dcModel';
import {BOLTZMANN} from '../../physicalConstants';
import {complex} from '../../../../np-math/src/complex';
import {deviceFrequencyRow} from '../deviceRf';
import {powers} from '../bjt/taylor';
import {properties, interval, atInterval} from './fetOptions';
import {hemtModel} from './hemtModels';
import {hemtParameters, hemtOperatingPoint, hemtPoint} from './hemtEquations';

function curves(input = {}, threshold) {
    properties(input, ['vgs', 'vds'], 'HEMT bias');
    return {vgs: interval(input.vgs, {start: 0, stop: threshold, points: 5}, -1, 'bias.vgs'),
        vds: interval(input.vds, {start: 0, stop: 3, points: 101}, 1, 'bias.vds')};
}
function ivTable(description, input = {}) {
    const {record, curveSettings} = description.definition;
    properties(input, ['vgs', 'vds'], 'HEMT ivTable');
    if (input.vgs !== undefined) properties(input.vgs, ['start', 'stop', 'points'], 'ivTable.vgs');
    if (input.vds !== undefined) properties(input.vds, ['start', 'stop', 'points'], 'ivTable.vds');
    const settings = curves({vgs: {...curveSettings.vgs, ...input.vgs}, vds: {...curveSettings.vds, ...input.vds}}, record.parameters.VTO);
    const p = hemtParameters(record.parameters, record.contactResistances), table = [['vds (V)']];
    for (let gate = 0; gate < settings.vgs.points; gate++) table[0].push('id (A), vgs=' + Number(atInterval(settings.vgs, gate).toPrecision(6)) + ' V');
    for (let drain = 0; drain < settings.vds.points; drain++) {
        const voltage = atInterval(settings.vds, drain), row = [voltage];
        for (let gate = 0; gate < settings.vgs.points; gate++) row.push(hemtOperatingPoint(p, atInterval(settings.vgs, gate), voltage).id);
        table.push(row);
    }
    return withCurveOutput(table, {axis: 'vds', measurements: ['id'],
        step: {name: 'vgs', values: Array.from({length: settings.vgs.points}, (_, gate) => atInterval(settings.vgs, gate))}});
}
export function hemtConstructor(options) {
    properties(options, ['model', 'bias', 'qPoint', 'temperature', 'fList'], 'HEMT');
    const record = hemtModel(options.model), temperature = options.temperature === undefined ? global.Temp : options.temperature;
    if (!Number.isFinite(temperature) || temperature <= 0) throw new RangeError('HEMT temperature must be positive kelvin.');
    const settings = componentSettings(global, options), frequencies = analysisFrequencies(settings);
    if (!frequencies.length || frequencies.some(f => !Number.isFinite(f) || f <= 0) || !Number.isFinite(settings.Ro) || settings.Ro <= 0) {
        throw new RangeError('HEMT requires positive RF frequencies and positive reference impedance; use ivTable/solveDC for DC.');
    }
    const input = options.qPoint === undefined ? {} : options.qPoint;
    properties(input, ['vgs', 'vds'], 'HEMT qPoint');
    const vgs = input.vgs === undefined ? -.6 : input.vgs, vds = input.vds === undefined ? 2 : input.vds;
    if (![vgs, vds].every(Number.isFinite)) throw new RangeError('HEMT qPoint voltages must be finite.');
    const curveSettings = curves(options.bias, record.parameters.VTO);
    const point = hemtOperatingPoint(hemtParameters(record.parameters, record.contactResistances), vgs, vds), {data, ...initialQPoint} = point;
    const description = dcModel('HEMT', 3, 'nonlinear', 'approximate', {modelId: 'hemt', record, polarity: 1,
        temperature, curveSettings, initialQPoint, terminalNetwork: record.terminalNetwork}, settings);
    return hemtInstance(description, Object.freeze({...settings, ...description.analysis}), point);
}
function noiseDensities(p, point, temperature, frequency) {
    const gm = point.data.channel[1] + point.data.channel[2], cgs = point.data.charges[0][1], omega = 2 * Math.PI * frequency;
    const thermal = 4 * BOLTZMANN * temperature;
    return {drain: thermal * gm * p.P * (1 + p.FNC / frequency) + p.KF * Math.abs(point.id) ** p.AF / frequency ** p.FFE,
        gate: thermal * cgs ** 2 * omega ** 2 * p.R / gm,
        cross: complex(0, thermal * cgs * omega * Math.sqrt(p.P * p.R) * p.C)};
}
function noiseSources(p, point, temperature, frequency) {
    const density = noiseDensities(p, point, temperature, frequency);
    return [[1, 2, density.drain], [0, 2, density.gate]];
}
function noiseCorrelations(p, point, temperature, frequency) {
    return [{first: [0, 2], second: [1, 2], density: noiseDensities(p, point, temperature, frequency).cross}];
}
function hemtInstance(description, settings, point) {
    const {record, temperature} = description.definition, p = hemtParameters(record.parameters, record.contactResistances), gm = point.data.channel[1] + point.data.channel[2];
    if (point.intrinsicVgs <= point.intrinsicVgd || gm <= 0) {
        throw new RangeError('HEMT RF/noise requires positive intrinsic Vds and a conducting Q point (gm > 0); DC curves may include cutoff.');
    }
    const rfTopology = {...record.terminalNetwork, controls: [[0, 2], [0, 1]], powers};
    // RC/CRF is the empirical high-frequency output-conductance correction,
    // not an extra physical contact-noise source in the published model.
    const model = {type: 'hemt', p, point, record, rfTopology, referenceImpedance: settings.Ro, temperature, rows: new Map(),
        noiseSources: noiseSources.bind(null, p, point, temperature), noiseCorrelations: noiseCorrelations.bind(null, p, point, temperature)};
    const spars = [], noise = [];
    for (const frequency of analysisFrequencies(settings)) {
        const row = deviceFrequencyRow(model, frequency); spars.push(row.spars); noise.push(row.noise);
    }
    const result = new nPort(), {data, ...bias} = point;
    result.setspars(spars); result.setglobal(settings); result.noise = noise;
    result.bias = {...bias, temperature, electricalTemperature: record.referenceTemperature}; result.qPoint = {...result.bias};
    result.model = {...record, parameters: {...record.parameters}, inductors: record.inductors.map(row => row.slice()), capacitors: record.capacitors.map(row => row.slice())};
    result.dc = {current: 'id', bias: {vgs: {...description.definition.curveSettings.vgs}, vds: {...description.definition.curveSettings.vds}}};
    result.smallSignal = {gm, gds: -data.channel[2], ggs: data.igs[1], ggd: data.igd[2],
        cgs: data.charges[0][1], cgd: data.charges[0][2], rg: p.RG, rd: p.RD, rs: p.RS};
    result.ivTable = ivTable.bind(null, description); result._intermod = model;
    result._schematic = schematicPart('HEMT', {model: record.name, labelPrefix: 'Q', value: record.name});
    result._dcModel = description;
    result._rfModel = Object.freeze({atOperatingPoint: hemtAtOperatingPoint.bind(null, description, settings)});
    return result;
}
function hemtAtOperatingPoint(description, settings, state) {
    properties(state, ['intrinsicVgs', 'intrinsicVgd', 'vs'], 'solved HEMT state');
    const vs = state.vs === undefined ? 0 : state.vs;
    if (![state.intrinsicVgs, state.intrinsicVgd].every(Number.isFinite) || vs !== null && !Number.isFinite(vs)) {
        throw new RangeError('HEMT solved state needs finite intrinsic voltages and a finite or null source reference.');
    }
    const record = description.definition.record;
    return hemtInstance(description, settings, hemtPoint(hemtParameters(record.parameters, record.contactResistances), state.intrinsicVgs, state.intrinsicVgd, vs));
}
