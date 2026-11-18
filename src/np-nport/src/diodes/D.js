// Modified: 2026-11-16
import {global} from '../../../np-global/src/global';
import {componentSettings} from '../componentSettings';
import {analysisFrequencies} from '../analysisFrequencies';
import {nPort} from '../nPort';
import {schematicPart} from '../schematicPart';
import {diodeModel} from './diodeModels';
import {diodeTemperature, diodeOperatingPoint} from './junctionDiode';
import {diodeFrequencyRow} from './diodeRf';
import {dcModel} from '../dcModel';

function knownProperties(value, fields, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(label + ' must be an object.');
    for (const name of Object.keys(value)) if (!fields.includes(name)) throw new TypeError('Unknown ' + label + ' property: ' + name + '.');
}
function sweepSettings(value = {}, defaults = {start: 0, stop: 0.8, points: 201}) {
    knownProperties(value, ['vd'], 'D bias');
    const vd = value.vd === undefined ? {} : value.vd;
    knownProperties(vd, ['start', 'stop', 'points'], 'bias.vd');
    const sweep = {...defaults, ...vd};
    if (!Number.isFinite(sweep.start) || !Number.isFinite(sweep.stop) || sweep.stop <= sweep.start ||
        !Number.isInteger(sweep.points) || sweep.points < 2) {
        throw new RangeError('bias.vd needs an increasing finite interval and at least two points.');
    }
    return sweep;
}
function ivTable(p, resistance, defaults, options = {}) {
    const sweep = sweepSettings(options, defaults), table = [['vd (V)', 'id (A)']];
    for (let index = 0; index < sweep.points; index++) {
        const voltage = index === sweep.points - 1 ? sweep.stop :
            sweep.start + index * (sweep.stop - sweep.start) / (sweep.points - 1);
        table.push([voltage, diodeOperatingPoint(p, voltage, resistance).id]);
    }
    return table;
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
    const result = new nPort(), spars = [], noise = [];
    for (const frequency of frequencies) {
        const row = diodeFrequencyRow(p, point, frequency, settings.Ro, temperature, record.leakageResistance);
        spars.push(row.spars); noise.push(row.noise);
    }
    result.setspars(spars); result.setglobal(settings); result.noise = noise;
    result.model = record;
    result.bias = {vd: point.vd, id: point.id, junctionVoltage: point.junctionVoltage,
        junctionCurrent: point.junctionCurrent, temperature};
    result.qPoint = {...result.bias};
    result.dc = {bias: {vd: {...sweep}}};
    result.smallSignal = {conductance: point.conductance,
        dynamicResistance: 1 / (point.conductance / (1 + p.RS * point.conductance) + 1 / record.leakageResistance),
        seriesResistance: p.RS, leakageResistance: record.leakageResistance,
        junctionCapacitance: point.junctionCapacitance, diffusionCapacitance: point.diffusionCapacitance,
        totalCapacitance: point.totalCapacitance};
    result.ivTable = ivTable.bind(null, p, record.leakageResistance, sweep);
    result._intermod = {type: 'diode', conductance: point.conductance, capacitance: point.totalCapacitance,
        seriesResistance: p.RS, referenceImpedance: settings.Ro,
        externalConductance: 1 / record.leakageResistance,
        secondDerivative: point.secondDerivative, thirdDerivative: point.thirdDerivative,
        capacitanceDerivative: point.capacitanceDerivative,
        capacitanceSecondDerivative: point.capacitanceSecondDerivative};
    result._schematic = schematicPart('D', {model: record.name});
    result._dcModel = dcModel('D', 2, 'nonlinear', 'physical', {modelId: 'diode', record,
        temperature, curveSettings: result.dc.bias, initialQPoint: result.qPoint}, settings);
    return result;
}
