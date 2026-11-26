// Modified: 2026-11-26
import {withCurveOutput} from '../curveOutput';
import {global} from '../../../np-global/src/global';
import {componentSettings} from '../componentSettings';
import {analysisFrequencies} from '../analysisFrequencies';
import {nPort} from '../nPort';
import {schematicPart} from '../schematicPart';
import {diodeModel} from './diodeModels';
import {diodeTemperature, diodeOperatingPoint, diodeJunctionOperatingPoint} from './junctionDiode';
import {diodeFrequencyRow} from './diodeRf';
import {diodeTerminalCapacitance} from './diodeLinear';
import {dcModel} from '../dcModel';
import {validateDiodeState, validateDiodeDrop} from './diodeState';

function knownProperties(value, fields, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(label + ' must be an object.');
    for (const name of Object.keys(value)) if (!fields.includes(name)) throw new TypeError('Unknown ' + label + ' property: ' + name + '.');
}
function sweepSettings(value = {}, defaults = {start: 0, stop: 0.8, points: 201}, key = 'vd') {
    knownProperties(value, [key], 'D bias');
    const vd = value[key] === undefined ? {} : value[key];
    knownProperties(vd, ['start', 'stop', 'points'], 'bias.' + key);
    const sweep = {...defaults, ...vd};
    if (!Number.isFinite(sweep.start) || !Number.isFinite(sweep.stop) || sweep.stop <= sweep.start ||
        !Number.isInteger(sweep.points) || sweep.points < 2) {
        throw new RangeError('bias.' + key + ' needs an increasing finite interval and at least two points.');
    }
    return sweep;
}

function cvTable(p, resistance, packageParameters, options = {}) {
    const sweep = sweepSettings(options, {start: 0, stop: 10, points: 201}, 'vr');
    if (sweep.start < 0) throw new RangeError('cvTable vr must be nonnegative reverse voltage.');
    const table = [['vr (V)', 'cj (F)', 'ct (F)']];
    for (let index = 0; index < sweep.points; index++) {
        const voltage = index === sweep.points - 1 ? sweep.stop :
            sweep.start + index * (sweep.stop - sweep.start) / (sweep.points - 1);
        const point = diodeOperatingPoint(p, -voltage, resistance);
        table.push([voltage, point.junctionCapacitance, diodeTerminalCapacitance(point, p.RS, packageParameters)]);
    }
    return withCurveOutput(table, {axis: 'vr', measurements: ['cj', 'ct']});
}
function ivTable(p, resistance, defaults, options = {}) {
    const sweep = sweepSettings(options, defaults), table = [['vd (V)', 'id (A)']];
    for (let index = 0; index < sweep.points; index++) {
        const voltage = index === sweep.points - 1 ? sweep.stop :
            sweep.start + index * (sweep.stop - sweep.start) / (sweep.points - 1);
        table.push([voltage, diodeOperatingPoint(p, voltage, resistance).id]);
    }
    return withCurveOutput(table, {axis: 'vd', measurements: ['id']});
}

export function D(options = {}) {
    knownProperties(options, ['model', 'bias', 'qPoint', 'temperature', 'fList'], 'D');
    const record = diodeModel(options.model), sweep = sweepSettings(options.bias);
    const qPoint = options.qPoint === undefined ? {} : options.qPoint;
    knownProperties(qPoint, ['vd'], 'D qPoint');
    const voltage = qPoint.vd === undefined ? 0.6 : qPoint.vd;
    const temperature = options.temperature === undefined ? global.Temp : options.temperature;
    if (!Number.isFinite(voltage)) throw new RangeError('qPoint.vd must be finite volts.');
    if (!Number.isFinite(temperature) || temperature <= 0) throw new RangeError('D temperature must be positive kelvin.');
    const settings = componentSettings(global, options), frequencies = analysisFrequencies(settings);
    if (!frequencies.length || frequencies.some(f => !Number.isFinite(f) || f < 0) ||
        !Number.isFinite(settings.Ro) || settings.Ro <= 0) {
        throw new RangeError('D requires a nonempty nonnegative frequency list and positive reference impedance.');
    }
    const p = diodeTemperature(record.parameters, temperature);
    const point = diodeOperatingPoint(p, voltage, record.leakageResistance);
    const initialQPoint = {vd: point.vd, id: point.id, junctionVoltage: point.junctionVoltage,
        junctionCurrent: point.junctionCurrent, temperature};
    const description = dcModel('D', 2, 'nonlinear', 'physical', {modelId: 'diode', record,
        temperature, curveSettings: {vd: sweep}, initialQPoint}, settings);
    return diodeInstance(description, Object.freeze({...settings, ...description.analysis}), point);
}

function diodeInstance(description, settings, point, terminals) {
    const {record, temperature, curveSettings} = description.definition;
    const p = diodeTemperature(record.parameters, temperature), sweep = curveSettings.vd;
    const frequencies = analysisFrequencies(settings);
    const result = new nPort(), spars = [], noise = [];
    for (const frequency of frequencies) {
        const row = diodeFrequencyRow(p, point, frequency, settings.Ro, temperature, record.leakageResistance, record.packageParameters);
        spars.push(row.spars); noise.push(row.noise);
    }
    result.setspars(spars); result.setglobal(settings); result.noise = noise;
    result.model = {...record, parameters: {...record.parameters}, packageParameters: {...record.packageParameters}};
    result.bias = {vd: point.vd, id: point.id, junctionVoltage: point.junctionVoltage,
        junctionCurrent: point.junctionCurrent, temperature, ...(terminals ? {va: terminals.va, vk: terminals.vk} : {})};
    result.qPoint = {...result.bias};
    result.dc = {bias: {vd: {...sweep}}};
    result.smallSignal = {conductance: point.conductance,
        dynamicResistance: 1 / (point.conductance / (1 + p.RS * point.conductance) + 1 / record.leakageResistance),
        seriesResistance: p.RS, leakageResistance: record.leakageResistance,
        junctionCapacitance: point.junctionCapacitance, diffusionCapacitance: point.diffusionCapacitance,
        totalCapacitance: point.totalCapacitance,
        packageCapacitance: record.packageParameters.parallelCapacitance,
        terminalCapacitance: diodeTerminalCapacitance(point, p.RS, record.packageParameters),
        seriesInductance: record.packageParameters.seriesInductance};
    result.ivTable = ivTable.bind(null, p, record.leakageResistance, sweep);
    result.cvTable = cvTable.bind(null, p, record.leakageResistance, record.packageParameters);
    result._intermod = {type: 'diode', conductance: point.conductance, capacitance: point.totalCapacitance,
        seriesResistance: p.RS, referenceImpedance: settings.Ro,
        externalConductance: 1 / record.leakageResistance,
        packageParameters: record.packageParameters,
        secondDerivative: point.secondDerivative, thirdDerivative: point.thirdDerivative,
        capacitanceDerivative: point.capacitanceDerivative,
        capacitanceSecondDerivative: point.capacitanceSecondDerivative};
    result._schematic = schematicPart('D', {labelPrefix: 'D', value: record.name, model: record.name}, record.schematicVariant);
    result._dcModel = description;
    result._rfModel = Object.freeze({atOperatingPoint: diodeAtOperatingPoint.bind(null, description, settings)});
    return result;
}

function diodeAtOperatingPoint(description, settings, input) {
    const state = validateDiodeState(input), {record, temperature} = description.definition;
    const p = diodeTemperature(record.parameters, temperature);
    const point = diodeJunctionOperatingPoint(p, state.vd, state.junctionVoltage, record.leakageResistance);
    validateDiodeDrop(state, point.junctionVoltage + p.RS * point.junctionCurrent);
    if (Object.values(point).some(value => !Number.isFinite(value))) throw new RangeError('Solved diode state exceeds the model domain.');
    return diodeInstance(description, settings, point, state);
}
