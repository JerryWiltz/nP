// Modified: 2026-11-26
import {withCurveOutput} from '../../curveOutput';
import {global} from '../../../../np-global/src/global';
import {nPort} from '../../nPort';
import {componentSettings} from '../../componentSettings';
import {analysisFrequencies} from '../../analysisFrequencies';
import {schematicPart} from '../../schematicPart';
import {dcModel} from '../../dcModel';
import {BOLTZMANN, EPSILON0} from '../../physicalConstants';
import {deviceFrequencyRow} from '../deviceRf';
import {devicePowers} from '../deviceTaylor';
import {properties, interval, atInterval} from './fetOptions';
import {mosfetModel} from './mosfetModels';
import {mosfetTemperature, mosfetOperatingPoint, mosfetPoint} from './mosfetEquations';

function bodyVoltage(value, body, label) {
    if (!Number.isFinite(value) || body === 'source' && value !== 0) throw new RangeError(label + ' needs finite volts; a source-tied body requires vbs=0.');
    return value;
}
function curves(input, polarity, threshold, body) {
    if (input === undefined) input = {};
    properties(input, ['vgs', 'vds', 'vbs'], 'MOSFET bias');
    return {vgs: interval(input.vgs, {start: 0, stop: polarity * (Math.abs(threshold) + 1), points: 5}, polarity, 'bias.vgs'),
        vds: interval(input.vds, {start: 0, stop: polarity * 5, points: 101}, polarity, 'bias.vds'),
        vbs: bodyVoltage(input.vbs === undefined ? 0 : input.vbs, body, 'bias.vbs')};
}
function ivTable(description, input = {}) {
    const {record, polarity, temperature, curveSettings, body} = description.definition;
    properties(input, ['vgs', 'vds', 'vbs'], 'MOSFET ivTable');
    if (input.vgs !== undefined) properties(input.vgs, ['start', 'stop', 'points'], 'ivTable.vgs');
    if (input.vds !== undefined) properties(input.vds, ['start', 'stop', 'points'], 'ivTable.vds');
    const settings = curves({vgs: {...curveSettings.vgs, ...input.vgs}, vds: {...curveSettings.vds, ...input.vds},
        vbs: input.vbs === undefined ? curveSettings.vbs : input.vbs}, polarity, record.parameters.VTO, body);
    const p = mosfetTemperature(record.parameters, temperature, polarity), table = [['vds (V)']];
    for (let gate = 0; gate < settings.vgs.points; gate++) table[0].push('id (A), vgs=' + Number(atInterval(settings.vgs, gate).toPrecision(6)) + ' V');
    for (let drain = 0; drain < settings.vds.points; drain++) {
        const voltage = atInterval(settings.vds, drain), row = [voltage];
        for (let gate = 0; gate < settings.vgs.points; gate++) row.push(mosfetOperatingPoint(p, atInterval(settings.vgs, gate), voltage, settings.vbs, polarity, body).id);
        table.push(row);
    }
    return withCurveOutput(table, {axis: 'vds', measurements: ['id'],
        step: {name: 'vgs', values: Array.from({length: settings.vgs.points}, (_, gate) => atInterval(settings.vgs, gate))}});
}
export function mosfetConstructor(options, polarity) {
    const type = polarity === 1 ? 'NMOS' : 'PMOS';
    properties(options, ['model', 'body', 'qPoint', 'bias', 'temperature', 'fList'], type);
    const body = options.body === undefined ? 'source' : options.body;
    if (!['source', 'external'].includes(body)) throw new RangeError(type + ' body must be source or external.');
    const record = mosfetModel(options.model, polarity, body), temperature = options.temperature === undefined ? global.Temp : options.temperature;
    if (!Number.isFinite(temperature) || temperature <= 0) throw new RangeError(type + ' temperature must be positive kelvin.');
    const settings = componentSettings(global, options), frequencies = analysisFrequencies(settings);
    if (!frequencies.length || frequencies.some(f => !Number.isFinite(f) || f < 0) || !Number.isFinite(settings.Ro) || settings.Ro <= 0) {
        throw new RangeError(type + ' requires nonnegative frequencies and positive reference impedance.');
    }
    const input = options.qPoint === undefined ? {} : options.qPoint;
    properties(input, ['vgs', 'vds', 'vbs'], type + ' qPoint');
    const vgs = input.vgs === undefined ? polarity * (Math.abs(record.parameters.VTO) + 0.5) : input.vgs;
    const vds = input.vds === undefined ? polarity * 5 : input.vds;
    const vbs = bodyVoltage(input.vbs === undefined ? 0 : input.vbs, body, 'qPoint.vbs');
    if (![vgs, vds].every(Number.isFinite)) throw new RangeError('MOSFET qPoint voltages must be finite.');
    const curveSettings = curves(options.bias, polarity, record.parameters.VTO, body);
    const point = mosfetOperatingPoint(mosfetTemperature(record.parameters, temperature, polarity), vgs, vds, vbs, polarity, body);
    const {data, ...initialQPoint} = point;
    const descriptor = dcModel(type, body === 'external' ? 4 : 3, 'nonlinear', 'physical',
        {modelId: 'mosfet', record, polarity, temperature, body, curveSettings, initialQPoint}, settings);
    return mosfetInstance(descriptor, Object.freeze({...settings, ...descriptor.analysis}), point);
}
function noiseSources(p, point, temperature, frequency) {
    const cox = 3.9 * EPSILON0 / 1e-7;
    const flicker = p.KF && frequency > 0 ? p.KF * Math.abs(point.id) ** p.AF / (frequency * p.W * p.L * cox * cox) : 0;
    return [[1, 2, 4 * BOLTZMANN * temperature * (2 / 3) * Math.abs(point.data.channel[1]) + flicker]];
}
function rfTopology(body, p) {
    // The internal body connection is to the external source, just as when
    // tying ports 3 and 4 of the four-terminal form. RS is not bypassed.
    const count = body === 'external' ? 4 : 3;
    return {nodeCount: count + 4, ports: Array.from({length: count}, (_, i) => i), intrinsic: [count, count + 1, count + 2, count + 3],
        controls: [[0, 2], [1, 2], [3, 2]], powers: devicePowers,
        joins: [[0, count], [body === 'external' ? 3 : 2, count + 3]],
        resistors: [[1, count + 1, p.RD], [2, count + 2, p.RS]], inductors: [], capacitors: []};
}
function mosfetInstance(description, settings, point) {
    const {record, polarity, body, temperature} = description.definition, p = mosfetTemperature(record.parameters, temperature, polarity);
    const model = {type: 'mosfet', p, point, record, referenceImpedance: settings.Ro, temperature, rows: new Map(),
        rfTopology: rfTopology(body, p), noiseSources: noiseSources.bind(null, p, point, temperature)};
    const spars = [], noise = [];
    for (const f of analysisFrequencies(settings)) { const row = deviceFrequencyRow(model, f); spars.push(row.spars); noise.push(row.noise); }
    const result = new nPort(); result.setspars(spars); result.setglobal(settings); result.noise = noise;
    const {data, ...bias} = point;
    result.bias = {...bias, terminalCurrents: bias.terminalCurrents.slice(), body, temperature}; result.qPoint = {...result.bias, terminalCurrents: bias.terminalCurrents.slice()};
    result.model = {...record, body, parameters: {...record.parameters}, inductors: [], capacitors: []};
    result.dc = {current: 'id', bias: {vgs: {...description.definition.curveSettings.vgs}, vds: {...description.definition.curveSettings.vds}, vbs: description.definition.curveSettings.vbs}};
    result.smallSignal = {gm: data.channel[1], gds: data.channel[2], gmb: data.channel[3],
        cgs: p.CGSO * p.W, cgd: p.CGDO * p.W, cgb: p.CGBO * p.L, cbs: data.qbs[3], cbd: data.qbd[3], rd: p.RD, rs: p.RS};
    result.ivTable = ivTable.bind(null, description); result._intermod = model; result._dcModel = description;
    result._schematic = schematicPart(polarity === 1 ? 'NMOS' : 'PMOS', {model: record.name}, body === 'external' ? 'external' : undefined);
    result._rfModel = Object.freeze({atOperatingPoint: atOperatingPoint.bind(null, description, settings)});
    return result;
}
function atOperatingPoint(description, settings, state) {
    properties(state, ['intrinsicVgs', 'intrinsicVds', 'intrinsicVbs', 'vs'], 'solved MOSFET state');
    const vs = state.vs === undefined ? 0 : state.vs;
    if (![state.intrinsicVgs, state.intrinsicVds, state.intrinsicVbs].every(Number.isFinite) || vs !== null && !Number.isFinite(vs)) {
        throw new RangeError('MOSFET solved state needs finite intrinsic voltages and a finite or null source reference.');
    }
    const {record, temperature, polarity, body} = description.definition;
    const point = mosfetPoint(mosfetTemperature(record.parameters, temperature, polarity), state.intrinsicVgs, state.intrinsicVds, state.intrinsicVbs, polarity, body, vs);
    if (body === 'source' && Math.abs(point.vbs) > 1e-8) throw new RangeError('Solved MOSFET state violates its body-to-source connection.');
    return mosfetInstance(description, settings, point);
}
