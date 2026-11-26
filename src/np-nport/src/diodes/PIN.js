// Modified: 2026-11-26
import {withCurveOutput} from '../curveOutput';
import {global} from '../../../np-global/src/global';
import {componentSettings} from '../componentSettings';
import {analysisFrequencies} from '../analysisFrequencies';
import {nPort} from '../nPort';
import {dcModel, dcSnapshot} from '../dcModel';
import {schematicPart} from '../schematicPart';
import {pinModel} from './pinModels';
import {pinPoint, pinRfPoint, pinFrequencyRow, pinDcParameters} from './pinEquations';
import {validateDiodeState, validateDiodeDrop} from './diodeState';
import {pinCharge} from './pinCharge';

function properties(value, allowed, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(label + ' must be an object.');
    for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new TypeError('Unknown ' + label + ' property: ' + key + '.');
}
function sweep(options, defaults, region, record) {
    properties(options, ['vd'], 'PIN bias');
    properties(options.vd === undefined ? {} : options.vd, ['start', 'stop', 'points'], 'PIN bias.vd');
    const value = {...defaults, ...options.vd};
    if (!Number.isFinite(value.start) || !Number.isFinite(value.stop) || value.stop <= value.start ||
        !Number.isInteger(value.points) || value.points < 2 ||
        (region === 'forward' ? value.start < record.parameters.VI : value.stop > 0)) {
        throw new RangeError('PIN sweep needs an increasing region-compatible voltage interval and at least two points.');
    }
    return value;
}
function ivTable(record, temperature, region, defaults, options = {}) {
    const range = sweep(options, defaults, region, record), table = [['vd (V)', 'id (A)']];
    for (let i = 0; i < range.points; i++) {
        const vd = i === range.points - 1 ? range.stop : range.start + i * (range.stop - range.start) / (range.points - 1);
        table.push([vd, pinPoint(record, temperature, region, vd).id]);
    }
    return withCurveOutput(table, {axis: 'vd', measurements: ['id']});
}

export function PIN(options = {}) {
    properties(options, ['model', 'region', 'qPoint', 'bias', 'temperature', 'fList'], 'PIN');
    const record = pinModel(options.model);
    const settings = componentSettings(global, options), frequencies = analysisFrequencies(settings);
    if (!frequencies.length || !Number.isFinite(settings.Ro) || settings.Ro <= 0) throw new RangeError('PIN needs RF frequencies and positive reference impedance.');
    if (record.modelType === 'charge-storage') return pinCharge(record, options, settings);
    const region = options.region === undefined ? 'forward' : options.region;
    if (!['forward', 'reverse'].includes(region)) throw new RangeError('PIN region must be forward or reverse.');
    const temperature = options.temperature === undefined ? record.referenceTemperature : options.temperature;
    if (temperature !== record.referenceTemperature) throw new RangeError('PIN fit is fixed at referenceTemperature; supply characterized data at the requested temperature.');
    const q = options.qPoint === undefined ? {} : options.qPoint;
    properties(q, ['vd'], 'PIN qPoint');
    const vd = q.vd === undefined ? (region === 'forward' ? .8 : 0) : q.vd;
    if (!Number.isFinite(vd)) throw new RangeError('PIN qPoint.vd must be finite volts.');
    const defaults = region === 'forward' ? {start: record.parameters.VI, stop: 1.1, points: 201} : {start: -20, stop: 0, points: 201};
    const range = sweep(options.bias === undefined ? {} : options.bias, defaults, region, record);
    const point = pinPoint(record, temperature, region, vd);
    const description = dcModel('PIN', 2, 'nonlinear', 'approximate', {modelId: 'pin', record,
        temperature, region, curveSettings: {vd: range}, initialQPoint: {vd, id: point.id, junctionVoltage: point.junctionVoltage}}, settings);
    return pinInstance(description, Object.freeze({...settings, ...description.analysis}), point);
}

function pinInstance(description, settings, point, terminals) {
    const {record, region, temperature, curveSettings} = description.definition;
    const rf = pinRfPoint(record, region, point), result = new nPort();
    const rows = analysisFrequencies(settings).map(frequency => pinFrequencyRow(record, rf, temperature, frequency, settings.Ro));
    result.setspars(rows.map(row => row.spars)); result.setglobal(settings); result.noise = rows.map(row => row.noise);
    result.model = {...record, parameters: {...record.parameters}, packageParameters: {...record.packageParameters}, operatingRange: {...record.operatingRange}};
    result.bias = {vd: point.vd, id: point.id, junctionVoltage: point.junctionVoltage, junctionCurrent: point.junctionCurrent,
        region, temperature, ...(terminals ? {va: terminals.va, vk: terminals.vk} : {})};
    result.qPoint = {...result.bias}; result.smallSignal = {...rf};
    result.dc = {bias: {vd: {...curveSettings.vd}}};
    result.ivTable = ivTable.bind(null, record, temperature, region, curveSettings.vd);
    result._dcModel = description;
    result._rfModel = Object.freeze({atOperatingPoint: pinAtOperatingPoint.bind(null, description, settings)});
    result._intermod = dcSnapshot({type: 'requiresModel', reason: 'PIN is a selected-bias linear RF model; a validated nonlinear carrier-storage model is required for intermodulation.'});
    result._schematic = schematicPart('PIN', {labelPrefix: 'PIN', value: record.name});
    return result;
}

function pinAtOperatingPoint(description, settings, input) {
    const state = validateDiodeState(input), {record, region, temperature} = description.definition;
    const p = pinDcParameters(record, temperature, region);
    const point = pinPoint(record, temperature, region, state.vd, state.junctionVoltage);
    validateDiodeDrop(state, point.junctionVoltage + p.RS * point.id + (region === 'forward' ? p.VI : 0));
    return pinInstance(description, settings, point, state);
}
