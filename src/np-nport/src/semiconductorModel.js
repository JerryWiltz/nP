// Modified: 2026-11-21
// Data-only named/custom record selection; each equation family owns its defaults.
import {dcSnapshot} from './dcModel';

function plainObject(value) {
    if (value === null || typeof value !== 'object') return false;
    const prototype = Object.getPrototypeOf(value);
    // REPLs/iframes have their own Object.prototype. Match the data-only
    // DC snapshot contract rather than requiring this module's realm.
    return prototype === null || Object.getPrototypeOf(prototype) === null;
}

export function selectModelRecord(input, records, fallback, type, extra = [], polarity) {
    const selected = input === undefined ? fallback : input;
    let record;
    if (typeof selected === 'string') {
        const name = selected.toUpperCase();
        if (!Object.hasOwn(records, name)) throw new RangeError(type + ' model must be ' + Object.keys(records).join(' or ') + ', or a model record object.');
        record = {...records[name], name};
    } else {
        if (!plainObject(selected)) throw new TypeError(type + ' model must be a name or a plain record object.');
        const metadata = ['name', 'manufacturer', 'material', 'structure', 'mathematicalModel', 'modelVersion',
            'source', 'originalSource', 'equationSource', 'deviceSource', 'modelPublisher', 'manufacturerPart',
            'package', 'temperatureModel', 'noiseModel', 'limitations', 'pinning', 'family', 'schematicVariant',
            'leakageNote', 'defaultsNote'];
        for (const key of Object.keys(selected)) {
            if (!metadata.includes(key) && !['parameters', 'polarity', 'referenceTemperature', 'inductors', 'capacitors', ...extra].includes(key)) {
                throw new TypeError('Unknown ' + type + ' model record property: ' + key + '.');
            }
            if (metadata.includes(key) && !(key === 'manufacturer' && selected[key] === null) &&
                (typeof selected[key] !== 'string' || !selected[key].trim())) throw new TypeError(type + ' model.' + key + ' must be a nonempty string.');
        }
        record = {...dcSnapshot(selected), name: selected.name ?? 'custom'};
    }
    if (!plainObject(record.parameters)) throw new TypeError(type + ' model.parameters must be a plain object.');
    if (record.polarity !== undefined && record.polarity !== polarity) throw new RangeError(type + ' model polarity conflicts with the constructor.');
    if (record.referenceTemperature !== undefined && (!Number.isFinite(record.referenceTemperature) || record.referenceTemperature <= 0)) {
        throw new RangeError(type + ' model.referenceTemperature must be positive kelvin.');
    }
    return record;
}

function validParameter(value, rule) {
    if (rule === 'unlimited') return value > 0 && (Number.isFinite(value) || value === Infinity);
    if (!Number.isFinite(value)) return false;
    if (typeof rule === 'number') return value === rule;
    if (rule === 'finite') return true;
    if (rule === 'positive') return value > 0;
    if (rule === 'negative') return value < 0;
    if (rule === 'fraction') return value >= 0 && value < 1;
    if (rule === 'correlation') return Math.abs(value) <= 1;
    if (rule === 'aboveHalf') return value > 0.5;
    return value >= 0;
}

export function modelParameters(input, defaults, type, rules = {}) {
    if (!plainObject(input)) throw new TypeError(type + ' model.parameters must be a plain object.');
    for (const key of Object.keys(input)) {
        if (!Object.hasOwn(defaults, key)) throw new TypeError('Unsupported ' + type + ' model parameter: ' + key + '.');
    }
    const parameters = {...defaults, ...input};
    for (const [key, value] of Object.entries(parameters)) {
        if (value === undefined) throw new TypeError(type + ' model requires parameter ' + key + '.');
        if (!validParameter(value, rules[key])) throw new RangeError('Invalid ' + type + ' model parameter ' + key + '.');
    }
    return parameters;
}

export function noPackageBranches(record, type) {
    for (const key of ['inductors', 'capacitors']) {
        if (record[key] !== undefined && (!Array.isArray(record[key]) || record[key].length)) {
            throw new RangeError(type + ' model.' + key + ' must be empty; this adapter has no explicit package L/C model.');
        }
    }
}

export function checkDerivedModelData(input, derived, type) {
    for (const [key, value] of Object.entries(derived)) {
        if (input[key] !== undefined && !sameData(input[key], value)) {
            throw new RangeError(type + ' model.' + key + ' conflicts with the network derived from parameters/packageParameters.');
        }
    }
}

function sameData(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && sameData(a[key], b[key]));
}
