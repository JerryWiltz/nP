// Modified: 2026-11-26
import {withCurveOutput} from '../curveOutput';
import {nPort} from '../nPort';
import {dcModel} from '../dcModel';
import {analysisFrequencies} from '../analysisFrequencies';
import {schematicPart} from '../schematicPart';
import {validateDiodeState, validateDiodeDrop} from './diodeState';
import {pinChargePoint} from './pinChargeEquations';
import {pinChargeFrequencyRow} from './pinChargeRf';

function sweep(input = {}, defaults = {start: -5, stop: 1.2, points: 201}) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => key !== 'vd')) throw new TypeError('PIN bias needs only vd.');
    const vd = input.vd === undefined ? {} : input.vd;
    if (!vd || typeof vd !== 'object' || Array.isArray(vd) || Object.keys(vd).some(key => !['start', 'stop', 'points'].includes(key))) throw new TypeError('PIN bias.vd needs start, stop and points only.');
    const range = {...defaults, ...vd};
    if (![range.start, range.stop].every(Number.isFinite) || range.stop <= range.start || !Number.isInteger(range.points) || range.points < 2) throw new RangeError('PIN sweep needs an increasing finite voltage range and at least two points.');
    return range;
}
function ivTable(record, temperature, defaults, options = {}) {
    const range = sweep(options, defaults), result = [['vd (V)', 'id (A)']];
    for (let i = 0; i < range.points; i++) {
        const vd = i === range.points - 1 ? range.stop : range.start + (range.stop - range.start) * i / (range.points - 1);
        result.push([vd, pinChargePoint(record, temperature, vd).id]);
    }
    return withCurveOutput(result, {axis: 'vd', measurements: ['id']});
}
export function pinCharge(record, options, settings) {
    if (options.region !== undefined && options.region !== 'automatic') throw new RangeError('Charge-storage PIN determines its state from bias; region must be automatic or omitted.');
    const temperature = options.temperature === undefined ? record.referenceTemperature : options.temperature;
    if (!Number.isFinite(temperature) || temperature <= 0) throw new RangeError('PIN temperature must be positive kelvin.');
    const q = options.qPoint === undefined ? {} : options.qPoint;
    if (!q || typeof q !== 'object' || Array.isArray(q) || Object.keys(q).some(key => key !== 'vd')) throw new TypeError('PIN qPoint needs vd only.');
    const vd = q.vd === undefined ? .8 : q.vd;
    if (!Number.isFinite(vd)) throw new RangeError('PIN qPoint.vd must be finite volts.');
    const curveSettings = {vd: sweep(options.bias)}, point = pinChargePoint(record, temperature, vd);
    const description = dcModel('PIN', 2, 'nonlinear', 'physical', {modelId: 'pin-charge', record, temperature,
        curveSettings, initialQPoint: {vd, id: point.id, junctionVoltage: point.junctionVoltage}}, settings);
    return instance(description, Object.freeze({...settings, ...description.analysis}), point);
}
function instance(description, settings, point, terminals) {
    const {record, temperature, curveSettings} = description.definition;
    const model = {type: 'pin-charge', record, point, temperature, referenceImpedance: settings.Ro};
    const rows = analysisFrequencies(settings).map(frequency => pinChargeFrequencyRow(model, frequency));
    const result = new nPort();
    result.setspars(rows.map(row => row.spars)); result.setglobal(settings); result.noise = rows.map(row => row.noise);
    result.model = {...record, parameters: {...record.parameters}, packageParameters: {...record.packageParameters}};
    result.qPoint = {vd: point.vd, id: point.id, junctionVoltage: point.junctionVoltage,
        junctionCurrent: point.junctionCurrent, temperature, region: 'automatic', ...(terminals ? {va: terminals.va, vk: terminals.vk} : {})};
    result.bias = {...result.qPoint};
    result.smallSignal = {conductance: point.conductance, bulkResistance: point.bulkResistance,
        storedCharge: point.storedCharge, carrierLifetime: record.parameters.TAU, junctionCapacitance: point.depletion.capacitance};
    result.dc = {bias: {vd: {...curveSettings.vd}}};
    result.ivTable = ivTable.bind(null, record, temperature, curveSettings.vd);
    result._dcModel = description;
    result._rfModel = Object.freeze({atOperatingPoint: atOperatingPoint.bind(null, description, settings)});
    result._intermod = model;
    result._schematic = schematicPart('PIN', {labelPrefix: 'PIN', value: record.name});
    return result;
}
function atOperatingPoint(description, settings, input) {
    const state = validateDiodeState(input), {record, temperature} = description.definition;
    const point = pinChargePoint(record, temperature, state.vd);
    validateDiodeDrop({vd: state.junctionVoltage}, point.junctionVoltage);
    return instance(description, settings, point, state);
}
