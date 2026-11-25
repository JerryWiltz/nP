// Modified: 2026-11-25
import {complex} from '../../np-math/src/complex';
import {dcModelOf, dcSnapshot, validateDcNode} from './dcModel';
import {dcOperatingState, dcIncrement} from './dcSolver';
import {withOperatingPoints} from './operatingPointHandoff';
import {solveConnection, diodeJunctionVoltage} from './intermod';
import {BOLTZMANN, ELEMENTARY_CHARGE} from './physicalConstants';
import {validateNetworkComponents} from './combining/connectionValidation';

const weakLimit = 0.1;

function optionsFor(part, options) {
    validateNetworkComponents([part], 'rectify()');
    const fields = ['frequencyHz', 'inputPowerDbm', 'inputPort', 'outputNodes', 'outputPath'];
    if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('rectify() needs an options object.');
    for (const key of Object.keys(options)) if (!fields.includes(key)) throw new TypeError('Unknown rectify() option: ' + key + '.');
    const {frequencyHz, inputPowerDbm, outputNodes, outputPath = '', inputPort = 1} = options;
    if (!Number.isFinite(frequencyHz) || frequencyHz <= 0 || !part.spars.some(row => row[0] === frequencyHz)) {
        throw new RangeError('rectify() frequencyHz must be positive and present in the constructed frequency grid.');
    }
    if (!(Number.isFinite(inputPowerDbm) || inputPowerDbm === -Infinity)) throw new RangeError('rectify() inputPowerDbm must be finite, or -Infinity for RF off.');
    const inputPowerWatts = 10 ** ((inputPowerDbm - 30) / 10);
    if (!Number.isFinite(inputPowerWatts) || (inputPowerWatts === 0 && inputPowerDbm !== -Infinity)) throw new RangeError('rectify() input power is outside the numeric range.');
    if (!Number.isInteger(inputPort) || inputPort < 1 || inputPort > Math.sqrt(part.spars[0].length - 1)) throw new RangeError('rectify() inputPort is outside the network boundary.');
    if (!Array.isArray(outputNodes) || outputNodes.length !== 2 || typeof outputPath !== 'string') throw new TypeError('rectify() needs two outputNodes and an optional string outputPath.');
    outputNodes.forEach(validateDcNode);
    return {frequencyHz, inputPowerDbm, inputPowerWatts, inputPort, outputNodes, outputPath};
}

function validateDevices(part, model, path = '') {
    if (part.signal) throw new RangeError('rectify() accepts its explicit single CW excitation; construct the network without attached mod()/signal data.');
    if (model.kind === 'requiresModel') throw new RangeError('rectify() needs a physical DC model at ' + (path || '(root)') + ': ' + model.reason);
    if (model.kind === 'connection') {
        const children = part._rfModel?.components;
        if (!children || children.length !== model.definition.components.length || part._intermod?.type !== 'connection') {
            throw new TypeError('rectify() needs retained RF/DC connection recipes.');
        }
        model.definition.components.forEach((child, index) => validateDevices(children[index], child.model, path ? path + '/' + child.id : child.id));
    } else if (model.kind === 'nonlinear' && model.definition.modelId !== 'diode') {
        throw new RangeError('rectify() currently supports D() nonlinear devices; no rectification adapter for ' + model.constructorName + ' at ' + (path || '(root)') + '.');
    }
}

function collectSources(part, model, path, frequency, incident, records) {
    if (model.kind === 'connection') {
        const response = solveConnection(part._intermod, frequency, incident);
        model.definition.components.forEach((child, index) => collectSources(part._rfModel.components[index], child.model,
            path ? path + '/' + child.id : child.id, frequency, response.childIncidents[index], records));
        return;
    }
    if (model.kind !== 'nonlinear') return;
    const diode = part._intermod;
    if (diode?.type !== 'diode') throw new TypeError('rectify() is missing D() nonlinear coefficients at ' + path + '.');
    const rms = diodeJunctionVoltage(part, frequency, incident, diode).mag();
    const {record, temperature} = model.definition;
    const voltageScale = Math.min(record.parameters.N, record.parameters.NBV) * BOLTZMANN * temperature / ELEMENTARY_CHARGE;
    const currentRatio = Math.SQRT2 * rms / voltageScale;
    const chargeRatio = diode.capacitance > 0 ? Math.SQRT2 * rms * Math.abs(diode.capacitanceDerivative) / diode.capacitance : 0;
    const ratio = Math.max(currentRatio, chargeRatio);
    if (!Number.isFinite(ratio) || ratio > weakLimit) throw new RangeError('rectify() exceeds the weak-signal junction limit at ' + (path || '(root)') + '; reduce input power. Large-signal detection needs a periodic nonlinear solver.');
    // RMS phasors: <(1/2) I'' v(t)^2> = (1/2) I'' Vrms^2.
    // A periodic charge has zero mean dQ/dt; charge still loads the RF solve.
    const currentAmps = 0.5 * diode.secondDerivative * rms ** 2;
    if (!Number.isFinite(currentAmps)) throw new RangeError('rectify() generated a nonfinite junction current.');
    records.push({path, model: record.name, junctionRmsVolts: rms, currentAmps, voltageScale, junctionRatio: ratio});
}

export function rectify(part, options) {
    const settings = optionsFor(part, options), model = dcModelOf(part);
    validateDevices(part, model);
    const state = dcOperatingState(part);
    const biased = state.operatingPoint.operatingPoints?.length ? withOperatingPoints(part, state.operatingPoint.operatingPoints) : part;
    const incident = Array.from({length: model.portCount}, () => complex(0, 0));
    incident[settings.inputPort - 1] = complex(Math.sqrt(settings.inputPowerWatts), 0);
    const sources = [];
    collectSources(biased, model, '', settings.frequencyHz, incident, sources);
    const response = dcIncrement(state, sources, settings.outputNodes, settings.outputPath);
    for (const source of sources) {
        source.junctionBiasShiftVolts = response.junctionShifts.find(entry => entry.path === source.path).voltage;
        if (source.junctionBiasShiftVolts === null || Math.abs(source.junctionBiasShiftVolts) / source.voltageScale > weakLimit) {
            throw new RangeError('rectify() DC bias shift exceeds the weak-signal limit at ' + (source.path || '(root)') + '; reduce input power.');
        }
    }
    return dcSnapshot({kind: 'weak-signal-rectification', method: 'second-order-dc', ...settings,
        referenceImpedanceOhms: part.global.Ro, baselineVoltage: response.baselineVoltage,
        deltaVoltage: response.deltaVoltage, voltage: response.voltage,
        sensitivityVoltsPerWatt: settings.inputPowerWatts > 0 ? response.deltaVoltage / settings.inputPowerWatts : null,
        operatingPoint: state.operatingPoint, sources, dcResponse: response,
        limits: {maxJunctionRatio: weakLimit, maxBiasShiftRatio: weakLimit,
            assumptions: ['Single CW input; matched RF source and all other external RF ports.',
                'External ports add no DC source/load; include physical DC loads and returns.',
                'Second-order steady DC correction at RF-off bias; no compression, transient, self-heating or detector-noise prediction.',
                'Weak-signal screens are not a measured accuracy guarantee.']}});
}
