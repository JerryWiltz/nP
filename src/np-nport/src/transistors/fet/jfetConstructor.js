// Modified: 2026-11-19
import {global} from '../../../../np-global/src/global';
import {nPort} from '../../nPort';
import {componentSettings} from '../../componentSettings';
import {analysisFrequencies} from '../../analysisFrequencies';
import {schematicPart} from '../../schematicPart';
import {dcModel} from '../../dcModel';
import {BOLTZMANN} from '../../physicalConstants';
import {threeTerminalFrequencyRow} from '../threeTerminalRf';
import {properties, interval, atInterval} from './fetOptions';
import {jfetModel} from './jfetModels';
import {jfetTemperature, jfetOperatingPoint, jfetPoint} from './jfetEquations';

function curves(input, polarity, threshold) {
    if (input === undefined) input = {};
    properties(input, ['vgs', 'vds'], 'JFET bias');
    return {vgs: interval(input.vgs, {start: 0, stop: polarity * threshold, points: 5}, -polarity, 'bias.vgs'),
        vds: interval(input.vds, {start: 0, stop: polarity * 10, points: 101}, polarity, 'bias.vds')};
}
function ivTable(description, input = {}) {
    const {record, polarity, temperature, curveSettings} = description.definition;
    properties(input, ['vgs', 'vds'], 'JFET ivTable');
    if (input.vgs !== undefined) properties(input.vgs, ['start', 'stop', 'points'], 'ivTable.vgs');
    if (input.vds !== undefined) properties(input.vds, ['start', 'stop', 'points'], 'ivTable.vds');
    const settings = curves({vgs: {...curveSettings.vgs, ...input.vgs}, vds: {...curveSettings.vds, ...input.vds}}, polarity, record.parameters.VTO);
    const p = jfetTemperature(record.parameters, temperature), table = [['vds (V)']];
    for (let gate = 0; gate < settings.vgs.points; gate++) table[0].push('id (A), vgs=' + Number(atInterval(settings.vgs, gate).toPrecision(6)) + ' V');
    for (let drain = 0; drain < settings.vds.points; drain++) {
        const voltage = atInterval(settings.vds, drain), row = [voltage];
        for (let gate = 0; gate < settings.vgs.points; gate++) row.push(jfetOperatingPoint(p, atInterval(settings.vgs, gate), voltage, polarity).id);
        table.push(row);
    }
    return table;
}

export function jfetConstructor(options, polarity) {
    const type = polarity === 1 ? 'NJF' : 'PJF';
    properties(options, ['model', 'bias', 'qPoint', 'temperature', 'fList'], type);
    const record = jfetModel(options.model, polarity), temperature = options.temperature === undefined ? global.Temp : options.temperature;
    if (!Number.isFinite(temperature) || temperature <= 0) throw new RangeError(type + ' temperature must be positive kelvin.');
    const settings = componentSettings(global, options), frequencies = analysisFrequencies(settings);
    if (!frequencies.length || frequencies.some(f => !Number.isFinite(f) || f < 0) || !Number.isFinite(settings.Ro) || settings.Ro <= 0) {
        throw new RangeError(type + ' requires nonnegative frequencies and positive reference impedance.');
    }
    const input = options.qPoint === undefined ? {} : options.qPoint;
    properties(input, ['vgs', 'vds'], type + ' qPoint');
    const vgs = input.vgs === undefined ? -polarity : input.vgs, vds = input.vds === undefined ? polarity * 10 : input.vds;
    if (![vgs, vds].every(Number.isFinite)) throw new RangeError('JFET qPoint voltages must be finite.');
    const curveSettings = curves(options.bias, polarity, record.parameters.VTO);
    const point = jfetOperatingPoint(jfetTemperature(record.parameters, temperature), vgs, vds, polarity);
    const {data, ...initialQPoint} = point;
    const description = dcModel(type, 3, 'nonlinear', 'physical', {modelId: 'jfet', record, polarity, temperature,
        curveSettings, initialQPoint}, settings);
    return jfetInstance(description, Object.freeze({...settings, ...description.analysis}), point);
}

function noiseSources(p, point, temperature, frequency) {
    // Classical SPICE NLEV=1: channel thermal plus flicker noise. As in that
    // model, induced gate noise/gate shot noise are not added. NLEV=1 has a
    // known limitation in the ohmic region; no measured noise fit is implied.
    const gm = point.data.channel[1] + point.data.channel[2];
    const flicker = frequency > 0 ? p.KF * Math.abs(point.id) ** p.AF / frequency : 0;
    return [[1, 2, 4 * BOLTZMANN * temperature * (2 / 3) * Math.abs(gm) + flicker]];
}

function jfetInstance(description, settings, point) {
    const {record, polarity, temperature} = description.definition, p = jfetTemperature(record.parameters, temperature);
    const model = {type: 'jfet', p, point, record, referenceImpedance: settings.Ro, temperature, rows: new Map(),
        seriesResistances: [0, p.RD, p.RS], noiseSources: noiseSources.bind(null, p, point, temperature)};
    const spars = [], noise = [];
    for (const frequency of analysisFrequencies(settings)) {
        const row = threeTerminalFrequencyRow(model, frequency); spars.push(row.spars); noise.push(row.noise);
    }
    const result = new nPort();
    result.setspars(spars); result.setglobal(settings); result.noise = noise;
    const {data, ...bias} = point;
    result.bias = {...bias, temperature}; result.qPoint = {...result.bias};
    result.model = {...record, parameters: {...record.parameters}, inductors: [], capacitors: []};
    result.dc = {current: 'id', bias: {vgs: {...description.definition.curveSettings.vgs}, vds: {...description.definition.curveSettings.vds}}};
    result.smallSignal = {gm: data.channel[1] + data.channel[2], gds: -data.channel[2],
        ggs: data.igs[1], ggd: data.igd[2],
        cgs: data.qgs[1], cgd: data.qgd[2], rd: p.RD, rs: p.RS};
    result.ivTable = ivTable.bind(null, description);
    result._intermod = model;
    result._schematic = schematicPart(polarity === 1 ? 'NJF' : 'PJF', {model: record.name});
    result._dcModel = description;
    result._rfModel = Object.freeze({atOperatingPoint: jfetAtOperatingPoint.bind(null, description, settings)});
    return result;
}

function jfetAtOperatingPoint(description, settings, state) {
    properties(state, ['intrinsicVgs', 'intrinsicVgd', 'vs'], 'solved JFET state');
    const vs = state.vs === undefined ? 0 : state.vs;
    if (![state.intrinsicVgs, state.intrinsicVgd].every(Number.isFinite) || vs !== null && !Number.isFinite(vs)) {
        throw new RangeError('JFET solved state needs finite intrinsic voltages and a finite or null source reference.');
    }
    const {record, temperature, polarity} = description.definition;
    return jfetInstance(description, settings, jfetPoint(jfetTemperature(record.parameters, temperature), state.intrinsicVgs, state.intrinsicVgd, polarity, vs));
}
