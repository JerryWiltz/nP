// Modified: 2026-11-21
// Standard SPICE defaults shared by the supported NPN and PNP cards.
// ITF retains nP's established disabled-correction default for compatibility.
const defaults = {IS: 1e-16, BF: 100, BR: 1, NF: 1, NR: 1, ISE: 0, ISC: 0, NE: 1.5, NC: 2,
    VAF: Infinity, IKF: Infinity, VAR: Infinity, IKR: Infinity, RB: 0, RE: 0, RC: 0,
    CJE: 0, VJE: 0.75, MJE: 0.33, CJC: 0, VJC: 0.75, MJC: 0.33,
    FC: 0.5, TF: 0, TR: 0, XTF: 0, VTF: Infinity, ITF: Infinity,
    XTI: 3, EG: 1.11, XTB: 0, TNOM: 300.15, KF: 0, AF: 1};

function plainObject(value) {
    if (value === null || typeof value !== 'object') return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || Object.getPrototypeOf(prototype) === null;
}

function modelParameters(input, type) {
    if (!plainObject(input)) throw new TypeError(type + ' model.parameters must be a plain object.');
    for (const key of Object.keys(input)) {
        if (!Object.hasOwn(defaults, key)) throw new TypeError('Unsupported ' + type + ' model parameter: ' + key + '.');
    }
    const parameters = {...defaults, ...input};
    const unlimited = ['VAF', 'VAR', 'IKF', 'IKR', 'VTF'];
    const positive = ['IS', 'BF', 'BR', 'NF', 'NR', 'NE', 'NC', 'VJE', 'VJC', 'TNOM'];
    for (const [key, value] of Object.entries(parameters)) {
        const valid = key === 'ITF' ? value >= 0 && (Number.isFinite(value) || value === Infinity) :
            unlimited.includes(key) ? value > 0 && (Number.isFinite(value) || value === Infinity) :
            Number.isFinite(value) && (positive.includes(key) ? value > 0 :
                ['XTI', 'XTB'].includes(key) ? true : ['MJE', 'MJC', 'FC'].includes(key) ? value >= 0 && value < 1 : value >= 0);
        if (!valid) throw new RangeError('Invalid ' + type + ' model parameter ' + key + '.');
    }
    return parameters;
}

function packageBranches(input, kind, type) {
    if (input === undefined) return [];
    if (!Array.isArray(input)) throw new TypeError(type + ' model.' + kind + ' must be an array.');
    return Array.from(input, row => {
        if (!Array.isArray(row) || row.length !== 3 || ![row[0], row[1]].every(node => Number.isInteger(node) && node >= 0 && node <= 10) ||
            row[0] === row[1] || !Number.isFinite(row[2]) || row[2] <= 0) {
            throw new RangeError(type + ' model.' + kind + ' needs [node, node, positive SI value] rows using nodes 0–10.');
        }
        return row.slice();
    });
}

function validatePackage(inductors, type) {
    if (!inductors.length) return;
    // The established BJT adapter assumes three independent DC lead paths.
    // Preserve that assumption instead of accepting RF wiring that changes DC.
    const groups = Array.from({length: 11}, (_, i) => i);
    for (const [a, b] of inductors) {
        const from = groups[b], to = groups[a];
        for (let i = 0; i < groups.length; i++) if (groups[i] === from) groups[i] = to;
    }
    const expected = [0, 1, 2, 0, 1, 2, 6, 7, 8, 0, 2];
    if (groups.some((group, i) => groups.some((other, j) => (group === other) !== (expected[i] === expected[j])))) {
        throw new RangeError(type + ' package inductors must retain separate B/C/E lead paths: [0,3,9], [1,4], [2,5,10].');
    }
}

export function bjtModel(records, name, fallback, type) {
    const selected = name === undefined ? fallback : name;
    let key, record;
    if (typeof selected === 'string') {
        key = selected.toUpperCase();
        if (!Object.hasOwn(records, key)) {
            throw new RangeError(type + ' model must be ' + Object.keys(records).join(' or ') + ', or a model record object.');
        }
        record = records[key];
    } else {
        if (!plainObject(selected)) throw new TypeError(type + ' model must be a model name or a plain record object.');
        record = selected;
        const metadata = ['name', 'manufacturer', 'material', 'structure', 'mathematicalModel', 'modelVersion', 'source', 'leakageSource', 'package'];
        for (const property of Object.keys(record)) {
            if (!metadata.includes(property) && !['parameters', 'inductors', 'capacitors'].includes(property)) {
                throw new TypeError('Unknown ' + type + ' model record property: ' + property + '.');
            }
            if (metadata.includes(property) && (typeof record[property] !== 'string' || !record[property].trim())) {
                throw new TypeError(type + ' model.' + property + ' must be a nonempty string.');
            }
        }
        key = record.name ?? 'custom';
    }
    const parameters = modelParameters(record.parameters, type);
    const inductors = packageBranches(record.inductors, 'inductors', type);
    const capacitors = packageBranches(record.capacitors, 'capacitors', type);
    validatePackage(inductors, type);
    return {mathematicalModel: 'SPICE modified Gummel–Poon', modelVersion: 'SPICE level 1',
        ...record, name: key, parameters, inductors, capacitors};
}
