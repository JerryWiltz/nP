// Modified: 2026-11-26
import {withCurveOutput} from '../../curveOutput';
import {global} from '../../../../np-global/src/global';
import {nPort} from '../../nPort';
import {componentSettings} from '../../componentSettings';
import {analysisFrequencies} from '../../analysisFrequencies';
import {schematicPart} from '../../schematicPart';
import {dcModel} from '../../dcModel';
import {BOLTZMANN} from '../../physicalConstants';
import {threeTerminalFrequencyRow} from '../threeTerminalRf';
import {properties, interval, atInterval} from './fetOptions';
import {mesfetModel} from './mesfetModels';
import {mesfetParameters, mesfetOperatingPoint, mesfetPoint} from './mesfetEquations';

function curves(input, polarity, threshold) {
    if (input === undefined) input = {};
    properties(input, ['vgs', 'vds'], 'MESFET bias');
    return {vgs: interval(input.vgs, {start: 0, stop: polarity * threshold, points: 5}, -polarity, 'bias.vgs'),
        vds: interval(input.vds, {start: 0, stop: polarity * 3, points: 101}, polarity, 'bias.vds')};
}
function ivTable(description, input = {}) {
    const {record, polarity, curveSettings} = description.definition;
    properties(input, ['vgs', 'vds'], 'MESFET ivTable');
    if (input.vgs !== undefined) properties(input.vgs, ['start', 'stop', 'points'], 'ivTable.vgs');
    if (input.vds !== undefined) properties(input.vds, ['start', 'stop', 'points'], 'ivTable.vds');
    const settings = curves({vgs: {...curveSettings.vgs, ...input.vgs}, vds: {...curveSettings.vds, ...input.vds}}, polarity, record.parameters.VTO);
    const p = mesfetParameters(record.parameters), table = [['vds (V)']];
    for (let gate = 0; gate < settings.vgs.points; gate++) table[0].push('id (A), vgs=' + Number(atInterval(settings.vgs, gate).toPrecision(6)) + ' V');
    for (let drain = 0; drain < settings.vds.points; drain++) {
        const voltage = atInterval(settings.vds, drain), row = [voltage];
        for (let gate = 0; gate < settings.vgs.points; gate++) row.push(mesfetOperatingPoint(p, atInterval(settings.vgs, gate), voltage).id);
        table.push(row);
    }
    return withCurveOutput(table, {axis: 'vds', measurements: ['id'],
        step: {name: 'vgs', values: Array.from({length: settings.vgs.points}, (_, gate) => atInterval(settings.vgs, gate))}});
}

export function mesfetConstructor(options) {
    const type = 'MESFET', polarity = 1;
    properties(options, ['model', 'bias', 'qPoint', 'temperature', 'fList'], type);
    const record = mesfetModel(options.model), temperature = options.temperature === undefined ? global.Temp : options.temperature;
    if (!Number.isFinite(temperature) || temperature <= 0) throw new RangeError(type + ' temperature must be positive kelvin.');
    const settings = componentSettings(global, options), frequencies = analysisFrequencies(settings);
    if (!frequencies.length || frequencies.some(f => !Number.isFinite(f) || f < 0) || !Number.isFinite(settings.Ro) || settings.Ro <= 0) {
        throw new RangeError(type + ' requires nonnegative frequencies and positive reference impedance.');
    }
    const input = options.qPoint === undefined ? {} : options.qPoint;
    properties(input, ['vgs', 'vds'], type + ' qPoint');
    const vgs = input.vgs === undefined ? -0.5 : input.vgs, vds = input.vds === undefined ? 2 : input.vds;
    if (![vgs, vds].every(Number.isFinite)) throw new RangeError('MESFET qPoint voltages must be finite.');
    const curveSettings = curves(options.bias, polarity, record.parameters.VTO);
    const point = mesfetOperatingPoint(mesfetParameters(record.parameters), vgs, vds);
    const {data, ...initialQPoint} = point;
    const description = dcModel(type, 3, 'nonlinear', 'approximate', {modelId: 'mesfet', record, polarity, temperature,
        curveSettings, initialQPoint}, settings);
    return mesfetInstance(description, Object.freeze({...settings, ...description.analysis}), point);
}

function noiseSources(p, point, temperature, frequency) {
    // Classical SPICE MES1: channel thermal plus flicker noise. As in that
    // model, induced gate noise/gate shot noise are not added. The classical law has a
    // known limitation in the ohmic region; no measured noise fit is implied.
    const gm = point.data.channel[1] + point.data.channel[2];
    const flicker = frequency > 0 ? p.KF * Math.abs(point.id) ** p.AF / frequency : 0;
    return [[1, 2, 4 * BOLTZMANN * temperature * (2 / 3) * Math.abs(gm) + flicker]];
}

function mesfetInstance(description, settings, point) {
    const {record, temperature} = description.definition, p = mesfetParameters(record.parameters);
    const model = {type: 'mesfet', p, point, record, referenceImpedance: settings.Ro, temperature, rows: new Map(),
        seriesResistances: [0, p.RD, p.RS], noiseSources: noiseSources.bind(null, p, point, temperature)};
    const spars = [], noise = [];
    for (const frequency of analysisFrequencies(settings)) {
        const row = threeTerminalFrequencyRow(model, frequency); spars.push(row.spars); noise.push(row.noise);
    }
    const result = new nPort();
    result.setspars(spars); result.setglobal(settings); result.noise = noise;
    const {data, ...bias} = point;
    result.bias = {...bias, temperature, electricalTemperature: 300.15}; result.qPoint = {...result.bias};
    result.model = {...record, parameters: {...record.parameters}, inductors: [], capacitors: []};
    result.dc = {current: 'id', bias: {vgs: {...description.definition.curveSettings.vgs}, vds: {...description.definition.curveSettings.vds}}};
    result.smallSignal = {gm: data.channel[1] + data.channel[2], gds: -data.channel[2],
        ggs: data.igs[1], ggd: data.igd[2],
        cgs: data.capacitances[0].coefficients[0], cgd: data.capacitances[1].coefficients[0], rd: p.RD, rs: p.RS};
    result.ivTable = ivTable.bind(null, description);
    result._intermod = model;
    result._schematic = schematicPart('MESFET', {model: record.name, labelPrefix: 'Q', value: record.name});
    result._dcModel = description;
    result._rfModel = Object.freeze({atOperatingPoint: mesfetAtOperatingPoint.bind(null, description, settings)});
    return result;
}

function mesfetAtOperatingPoint(description, settings, state) {
    properties(state, ['intrinsicVgs', 'intrinsicVgd', 'vs'], 'solved MESFET state');
    const vs = state.vs === undefined ? 0 : state.vs;
    if (![state.intrinsicVgs, state.intrinsicVgd].every(Number.isFinite) || vs !== null && !Number.isFinite(vs)) {
        throw new RangeError('MESFET solved state needs finite intrinsic voltages and a finite or null source reference.');
    }
    const {record} = description.definition;
    return mesfetInstance(description, settings, mesfetPoint(mesfetParameters(record.parameters), state.intrinsicVgs, state.intrinsicVgd, vs));
}
