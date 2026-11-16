// Modified: 2026-11-15
// Standard SPICE defaults shared by the supported NPN and PNP cards.
const defaults = {NF: 1, NR: 1, ISE: 0, ISC: 0, NE: 1.5, NC: 2,
    VAR: Infinity, IKR: Infinity, RB: 0, RE: 0, RC: 0,
    CJE: 0, VJE: 0.75, MJE: 0.33, CJC: 0, VJC: 0.75, MJC: 0.33,
    FC: 0.5, TF: 0, TR: 0, XTF: 0, VTF: Infinity, ITF: Infinity,
    XTI: 3, EG: 1.11, XTB: 0, TNOM: 300.15, KF: 0, AF: 1};

export function bjtModel(records, name, fallback, type) {
    const selected = name === undefined ? fallback : name;
    if (typeof selected !== 'string' || !Object.hasOwn(records, selected.toUpperCase())) {
        throw new RangeError(type + ' model must be ' + Object.keys(records).join(' or ') + '.');
    }
    const key = selected.toUpperCase(), record = records[key];
    return {...record, name: key, parameters: {...defaults, ...record.parameters},
        inductors: record.inductors.map(row => row.slice()),
        capacitors: record.capacitors.map(row => row.slice())};
}
