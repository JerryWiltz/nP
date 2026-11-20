// Modified: 2026-11-19
import {global} from '../../../../np-global/src/global';
import {nPort} from '../../nPort';
import {componentSettings} from '../../componentSettings';
import {analysisFrequencies} from '../../analysisFrequencies';
import {schematicPart} from '../../schematicPart';
import {powers} from './taylor';
import {temperatureParameters, operatingPoint, junctionOperatingPoint} from './gummelPoon';
import {bjtFrequencyRow} from './bjtRf';
import {dcModel} from '../../dcModel';
import {ELEMENTARY_CHARGE} from '../../physicalConstants';

function knownProperties(object, names, label) {
    if (!object || typeof object !== 'object' || Array.isArray(object)) throw new TypeError(label + ' must be an object.');
    for (const key of Object.keys(object)) {
        if (!names.includes(key)) throw new TypeError('Unknown ' + label + ' property: ' + key + '.');
    }
}
function interval(value, defaults, label, nonnegative, polarity) {
    const input = value === undefined ? {} : value;
    knownProperties(input, ['start', 'stop', 'points'], label);
    const result = {...defaults, ...input};
    if (!Number.isFinite(result.start) || !Number.isFinite(result.stop) || (result.stop - result.start) * polarity <= 0 ||
        (nonnegative && result.start * polarity < 0) || !Number.isInteger(result.points) || result.points < 2) {
        throw new RangeError(label + ' needs a finite interval in the device forward-bias direction and at least two points.');
    }
    return result;
}
function curveSettings(options, configuration, polarity) {
    const cb = configuration === 'commonBase', current = cb ? 'ie' : 'ib', voltage = cb ? 'vcb' : 'vce';
    knownProperties(options, [current, voltage], 'bias');
    return {
        current, voltage,
        stepped: interval(options[current], {start: 0, stop: polarity * (cb ? 5e-3 : 50e-6), points: 6}, 'bias.' + current, true, polarity),
        swept: interval(options[voltage], {start: 0, stop: polarity * 10, points: 201}, 'bias.' + voltage, !cb, polarity)
    };
}
function sweepValues(interval) {
    const result = [];
    for (let i = 0; i < interval.points; i++) {
        result.push(i === interval.points - 1 ? interval.stop : interval.start +
            (interval.stop - interval.start) * i / (interval.points - 1));
    }
    return result;
}
function ivTable(p, configuration, bias, polarity, options = {}) {
    knownProperties(options, [bias.current, bias.voltage], 'ivTable');
    if (options[bias.current] !== undefined) knownProperties(options[bias.current], ['start', 'stop', 'points'], 'ivTable.' + bias.current);
    if (options[bias.voltage] !== undefined) knownProperties(options[bias.voltage], ['start', 'stop', 'points'], 'ivTable.' + bias.voltage);
    const selected = curveSettings({
        [bias.current]: {...bias.stepped, ...options[bias.current]},
        [bias.voltage]: {...bias.swept, ...options[bias.voltage]}
    }, configuration, polarity);
    const stepped = sweepValues(selected.stepped), swept = sweepValues(selected.swept);
    const measured = configuration === 'commonCollector' ? 'ie' : 'ic';
    const table = [[selected.voltage + ' (V)']];
    const labelScale = selected.current === 'ib' ? 1e6 : 1e3;
    const labelUnit = selected.current === 'ib' ? ' µA' : ' mA';
    for (const current of stepped) table[0].push(measured + ' (A), ' + selected.current + '=' +
        Number((current * labelScale).toPrecision(6)) + labelUnit);
    for (const voltage of swept) table.push([voltage]);
    for (const current of stepped) {
        // Continue from high voltage into saturation for reliable low-voltage knees.
        let initial;
        for (let row = swept.length - 1; row >= 0; row--) {
            const point = operatingPoint(p, current * polarity, swept[row] * polarity, configuration, initial);
            table[row + 1].push(point[measured] * polarity);
            initial = [point.intrinsicVbe, point.intrinsicVbc];
        }
    }
    return table;
}

function polarizedCoefficients(row, polarity) {
    return row.map((value, index) => value * polarity ** (powers[index][0] + powers[index][1] + 1));
}
function polarizedPoint(point, polarity) {
    if (polarity === 1) return point;
    const {data, ...bias} = point;
    for (const key of Object.keys(bias)) bias[key] = bias[key] === 0 ? 0 : bias[key] * polarity;
    return {...bias, data: {
        ...data,
        currents: data.currents.map(row => polarizedCoefficients(row, polarity)),
        charges: data.charges.map(row => polarizedCoefficients(row, polarity)),
        qbe: polarizedCoefficients(data.qbe, polarity),
        qbc: polarizedCoefficients(data.qbc, polarity),
        forward: data.forward * polarity, reverse: data.reverse * polarity,
        ibe: data.ibe * polarity, ibc: data.ibc * polarity
    }};
}

export function bjtConstructor(options, type, resolveModel, polarity) {
    knownProperties(options, ['model', 'configuration', 'bias', 'qPoint', 'temperature', 'fList'], type);
    const record = resolveModel(options.model), configuration = options.configuration ?? 'commonEmitter';
    if (!['commonEmitter', 'commonBase', 'commonCollector'].includes(configuration)) {
        throw new RangeError(type + ' configuration must be commonEmitter, commonBase or commonCollector.');
    }
    const temperature = options.temperature === undefined ? global.Temp : options.temperature;
    if (!Number.isFinite(temperature) || temperature <= 0) throw new RangeError(type + ' temperature must be positive kelvin.');
    const settings = componentSettings(global, options), frequencies = analysisFrequencies(settings);
    if (!Number.isFinite(settings.Ro) || settings.Ro <= 0 || frequencies.length === 0 ||
        frequencies.some(frequency => !Number.isFinite(frequency) || frequency < 0)) {
        throw new RangeError(type + ' requires positive reference impedance and a nonempty nonnegative frequency list.');
    }
    const bias = curveSettings(options.bias ?? {}, configuration, polarity), qInput = options.qPoint ?? {};
    knownProperties(qInput, [bias.current, bias.voltage], 'qPoint');
    const current = qInput[bias.current] === undefined ? polarity * (configuration === 'commonBase' ? 2e-3 : 20e-6) : qInput[bias.current];
    const voltage = qInput[bias.voltage] === undefined ? polarity * 5 : qInput[bias.voltage];
    if (!Number.isFinite(current) || current * polarity < 0 || !Number.isFinite(voltage) ||
        (configuration !== 'commonBase' && voltage * polarity < 0)) throw new RangeError('Invalid ' + type + ' qPoint current or voltage.');
    const p = temperatureParameters(record.parameters, temperature);
    const point = polarizedPoint(operatingPoint(p, current * polarity, voltage * polarity, configuration), polarity);
    const {data, ...qPoint} = point;
    const description = dcModel(type, 3, 'nonlinear', 'physical', {modelId: 'bjt', record,
        polarity, temperature, configuration, curveSettings: {[bias.current]: bias.stepped, [bias.voltage]: bias.swept},
        initialQPoint: {...qPoint, temperature, configuration}}, settings);
    return bjtInstance(description, Object.freeze({...settings, ...description.analysis}), point);
}

function bjtNoiseSources(p, point, frequency) {
    const sources = [[0, 2, 2 * ELEMENTARY_CHARGE * Math.abs(point.ib)], [1, 2, 2 * ELEMENTARY_CHARGE * Math.abs(point.ic)]];
    if (p.KF > 0 && frequency > 0) sources.push([0, 2, p.KF * Math.abs(point.ib) ** p.AF / frequency]);
    return sources;
}

// Both construction paths use exactly the same RF/noise/nonlinearity builder.
function bjtInstance(description, settings, point) {
    const {constructorName: type, definition} = description;
    const {record, configuration, polarity, temperature} = definition;
    const p = temperatureParameters(record.parameters, temperature);
    const frequencies = analysisFrequencies(settings), bias = curveSettings(definition.curveSettings, configuration, polarity);
    const model = {type: 'bjt', p, point, record, referenceImpedance: settings.Ro, temperature, rows: new Map(),
        seriesResistances: [p.RB, p.RC, p.RE], noiseSources: bjtNoiseSources.bind(null, p, point)};
    const spars = [], noise = [];
    for (const frequency of frequencies) {
        const row = bjtFrequencyRow(model, frequency);
        spars.push(row.spars); noise.push(row.noise);
    }
    const result = new nPort();
    result.setspars(spars); result.setglobal(settings); result.noise = noise;
    const {data, ...qPoint} = point;
    result.bias = {...qPoint, temperature, configuration};
    result.qPoint = {...result.bias};
    result.model = {...record, parameters: {...record.parameters},
        inductors: record.inductors.map(row => row.slice()),
        capacitors: record.capacitors.map(row => row.slice())};
    result.dc = {configuration, current: bias.current, voltage: bias.voltage,
        bias: {[bias.current]: {...bias.stepped}, [bias.voltage]: {...bias.swept}}};
    const gmu = data.currents[0][2], go = -data.currents[1][2] - gmu;
    // Hybrid-pi collector current: dIc = (gm + go) dVbe - (go + gmu) dVbc.
    result.smallSignal = {
        gm: data.currents[1][1] - go,
        gpi: data.currents[0][1], gmu, go,
        cpi: data.qbe[1], cmu: data.qbc[2], cbeCross: data.qbe[2],
        rb: p.RB, rc: p.RC, re: p.RE
    };
    result.ivTable = ivTable.bind(null, p, configuration, bias, polarity);
    result._intermod = model;
    result._schematic = schematicPart(type, {model: record.name});
    result._dcModel = description;
    result._rfModel = Object.freeze({atOperatingPoint: bjtAtOperatingPoint.bind(null, description, settings)});
    return result;
}

function bjtAtOperatingPoint(description, settings, state) {
    knownProperties(state, ['intrinsicVbe', 'intrinsicVbc', 've'], 'solved BJT operating point');
    const ve = state.ve === undefined ? 0 : state.ve;
    if (!Number.isFinite(state.intrinsicVbe) || !Number.isFinite(state.intrinsicVbc) ||
        (ve !== null && !Number.isFinite(ve))) {
        throw new RangeError('Solved BJT state needs finite signed intrinsicVbe/intrinsicVbc and a finite or null ve.');
    }
    const {record, temperature, polarity} = description.definition;
    const p = temperatureParameters(record.parameters, temperature);
    const point = polarizedPoint(junctionOperatingPoint(p, polarity * state.intrinsicVbe, polarity * state.intrinsicVbc), polarity);
    const {data, ...bias} = point;
    if (Object.values(bias).some(value => !Number.isFinite(value)) || data.qb <= 0 ||
        [data.currents.flat(), data.charges.flat(), data.qbe, data.qbc,
            [data.forward, data.reverse, data.ibe, data.ibc, data.qb]].some(row => row.some(value => !Number.isFinite(value)))) {
        throw new RangeError('Solved BJT state is outside the supported Gummel-Poon model domain.');
    }
    point.ve = ve;
    point.vb = ve === null ? null : ve + point.vbe;
    point.vc = ve === null ? null : ve + point.vce;
    if (ve !== null && (!Number.isFinite(point.vb) || !Number.isFinite(point.vc))) {
        throw new RangeError('Solved BJT terminal voltages exceed the supported numerical range.');
    }
    return bjtInstance(description, settings, point);
}
