// Modified: 2026-11-26
import {complex} from '../../np-math/src/complex';
import {outputTable, unitColumn} from '../../np-global/src/outputUnits';
import {dcModelOf, dcSnapshot, validateDcNode} from './dcModel';
import {dcOperatingState, dcIncrement} from './dcSolver';
import {withOperatingPoints} from './operatingPointHandoff';
import {solveConnection, diodeJunctionVoltage} from './intermod';
import {BOLTZMANN, ELEMENTARY_CHARGE} from './physicalConstants';
import {validateNetworkComponents} from './combining/connectionValidation';

const weakLimit = 0.1;

function powerWatts(inputPowerDbm) {
    if (!(Number.isFinite(inputPowerDbm) || inputPowerDbm === -Infinity)) throw new RangeError('rectify() inputPowerDbm must be finite, or -Infinity for RF off.');
    const watts = 10 ** ((inputPowerDbm - 30) / 10);
    if (!Number.isFinite(watts) || (watts === 0 && inputPowerDbm !== -Infinity)) throw new RangeError('rectify() input power is outside the numeric range.');
    return watts;
}

function powerValues(input) {
    if (typeof input === 'number') return [input];
    if (Array.isArray(input)) {
        if (!input.length) throw new RangeError('rectify() power list must not be empty.');
        return Array.from(input);
    }
    if (!input || typeof input !== 'object' || Object.keys(input).some(key => !['start', 'stop', 'points'].includes(key))) {
        throw new TypeError('rectify() inputPowerDbm needs a number, power list or {start, stop, points}.');
    }
    const {start, stop, points} = input;
    if (!Number.isFinite(start) || !Number.isFinite(stop) || start === stop ||
        !Number.isFinite(stop - start) || !Number.isSafeInteger(points) || points < 2) {
        throw new RangeError('rectify() power sweep needs distinct finite endpoints and at least two points.');
    }
    return Array.from({length: points}, (_, index) => index === points - 1 ? stop : start + (stop - start) * (index / (points - 1)));
}

function optionsFor(part, options) {
    validateNetworkComponents([part], 'rectify()');
    const fields = ['frequencyHz', 'inputPowerDbm', 'inputPort', 'outputNodes', 'outputPath'];
    if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('rectify() needs an options object.');
    for (const key of Object.keys(options)) if (!fields.includes(key)) throw new TypeError('Unknown rectify() option: ' + key + '.');
    const {frequencyHz, inputPowerDbm, outputNodes, outputPath = '', inputPort = 1} = options;
    if (!Number.isFinite(frequencyHz) || frequencyHz <= 0 || !part.spars.some(row => row[0] === frequencyHz)) {
        throw new RangeError('rectify() frequencyHz must be positive and present in the constructed frequency grid.');
    }
    const powers = powerValues(inputPowerDbm);
    const settings = powers.map(power => ({inputPowerDbm: power, inputPowerWatts: powerWatts(power)}));
    if (!Number.isInteger(inputPort) || inputPort < 1 || inputPort > Math.sqrt(part.spars[0].length - 1)) throw new RangeError('rectify() inputPort is outside the network boundary.');
    if (!Array.isArray(outputNodes) || outputNodes.length !== 2 || typeof outputPath !== 'string') throw new TypeError('rectify() needs two outputNodes and an optional string outputPath.');
    outputNodes.forEach(validateDcNode);
    return {common: {frequencyHz, inputPort, outputNodes, outputPath}, settings,
        sweep: typeof inputPowerDbm !== 'number'};
}

const outputColumns = {
    baselineVoltage: ['baselineVoltage', 1, 'RF-off DC', 'V'],
    baselineVoltagemV: ['baselineVoltage', 1e3, 'RF-off DC', 'mV'],
    baselineVoltageuV: ['baselineVoltage', 1e6, 'RF-off DC', 'µV'],
    deltaVoltage: ['deltaVoltage', 1, 'DC change', 'V'],
    deltaVoltagemV: ['deltaVoltage', 1e3, 'DC change', 'mV'],
    deltaVoltageuV: ['deltaVoltage', 1e6, 'DC change', 'µV'],
    voltage: ['voltage', 1, 'DC output', 'V'],
    voltagemV: ['voltage', 1e3, 'DC output', 'mV'],
    voltageuV: ['voltage', 1e6, 'DC output', 'µV'],
    sensitivityVoltsPerWatt: ['sensitivityVoltsPerWatt', 1, 'Sensitivity', 'V/W']
};

function rectificationOut(...selectors) {
    let label, units;
    if (selectors.length && typeof selectors.at(-1) === 'object') {
        const options = selectors.pop();
        if (!options || Array.isArray(options) || Object.keys(options).some(key => !['label', 'units'].includes(key)) ||
            options.label !== undefined && (typeof options.label !== 'string' || !options.label.trim())) throw new TypeError('rectification.out() accepts a nonempty label and units options.');
        label = options.label;
        units = options.units;
    }
    if (!selectors.length) throw new TypeError('rectification.out() requires a measurement selector, such as deltaVoltageuV.');
    const columns = selectors.map(selector => {
        if (typeof selector !== 'string' || !Object.hasOwn(outputColumns, selector)) throw new RangeError('Unknown rectification.out() selector: ' + String(selector) + '.');
        return outputColumns[selector];
    });
    const header = ['Input (dBm)', ...columns.map(([, , title, unit]) =>
        (label ? label + (columns.length > 1 ? ': ' + title : '') : title) + ' (' + unit + ')')];
    if (new Set(header).size !== header.length) throw new RangeError('rectification.out() selectors must have unique columns.');
    const rows = (this.results || [this]).map(result => {
        const row = [result.inputPowerDbm, ...columns.map(([field, scale]) => result[field] === null ? NaN : result[field] * scale)];
        if (row.some(value => !Number.isFinite(value))) throw new RangeError('rectification.out() tables need finite powers and results; inspect RF-off scalar fields directly.');
        return row;
    });
    return outputTable([header, ...rows], [unitColumn('power', 'dBm'), ...columns.map(([field, , , unit]) =>
        unitColumn(field === 'sensitivityVoltsPerWatt' ? 'sensitivity' : 'voltage', unit))], units);
}

function withOutput(data) {
    // Keep data serializable: the method is immutable and non-enumerable.
    return Object.freeze(Object.defineProperty({...dcSnapshot(data)}, 'out', {value: rectificationOut}));
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

function rectifyPoint(part, model, state, biased, settings) {
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
    return withOutput({kind: 'weak-signal-rectification', method: 'second-order-dc', ...settings,
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

export function rectify(part, options) {
    const {common, settings, sweep} = optionsFor(part, options), model = dcModelOf(part);
    validateDevices(part, model);
    const state = dcOperatingState(part);
    const biased = state.operatingPoint.operatingPoints?.length ? withOperatingPoints(part, state.operatingPoint.operatingPoints) : part;
    const results = settings.map(power => rectifyPoint(part, model, state, biased, {...common, ...power}));
    if (!sweep) return results[0];
    return Object.freeze(Object.defineProperty({...dcSnapshot(common), kind: 'weak-signal-rectification-sweep',
        method: 'second-order-dc', inputPowerDbm: Object.freeze(settings.map(power => power.inputPowerDbm)),
        results: Object.freeze(results)}, 'out', {value: rectificationOut}));
}
