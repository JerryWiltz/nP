// Modified: 2026-11-19
// Resolved parameter data from the cited manufacturer records. No downloaded
// model text is executed or bundled; package parasitics are not inferred.
const common = {TNOM: 300.15, TCV: 0, BEX: 0, NLEV: 1};
const records = {
    MMBF5457LT1: {
        polarity: 1, manufacturer: 'onsemi', material: 'silicon', structure: 'N-channel junction FET',
        mathematicalModel: 'SPICE level-1 JFET (Shichman-Hodges, B=1)', modelVersion: 'Manufacturer record dated 2002-12-06',
        source: 'https://www.onsemi.com/download/models/lib/mmbf5457lt1.lib',
        package: 'Drain/source contact resistances included; no explicit SOT23 lead L/C network',
        noiseModel: 'ngspice level-1 NLEV=1 channel thermal and flicker noise; not a measured noise fit',
        parameters: {...common, VTO: -3.86852, BETA: 0.000307346, LAMBDA: 0.00449867,
            RD: 15.735, RS: 49.9999, IS: 1e-14, CGS: 1e-12, CGD: 1e-12, PB: 1, FC: 0.5, KF: 1e-20, AF: 0.2},
        inductors: [], capacitors: []
    },
    MMBFJ175LT1: {
        polarity: -1, manufacturer: 'onsemi', material: 'silicon', structure: 'P-channel junction FET',
        mathematicalModel: 'SPICE level-1 JFET (Shichman-Hodges, B=1)', modelVersion: 'Manufacturer record dated 1998-04-14',
        source: 'https://www.onsemi.com/download/models/lib/mmbfj175lt1.lib',
        package: 'Drain/source contact resistances included; no explicit SOT23 lead L/C network',
        noiseModel: 'ngspice level-1 NLEV=1 channel thermal and flicker noise; not a measured noise fit',
        parameters: {...common, VTO: -4.25882, BETA: 0.00388105, LAMBDA: 0.00751457,
            RD: 114.077, RS: 42.5978, IS: 3.40344e-10, CGS: 7.1608e-12, CGD: 1.66048e-11,
            PB: 0.757866, FC: 0.5, KF: 1e-20, AF: 0.2},
        inductors: [], capacitors: []
    }
};

export function jfetModel(name, polarity) {
    const selected = name === undefined ? polarity === 1 ? 'MMBF5457LT1' : 'MMBFJ175LT1' : name;
    if (typeof selected !== 'string' || !Object.hasOwn(records, selected.toUpperCase()) || records[selected.toUpperCase()].polarity !== polarity) {
        throw new RangeError((polarity === 1 ? 'NJF' : 'PJF') + ' model must be ' + (polarity === 1 ? 'MMBF5457LT1' : 'MMBFJ175LT1') + '.');
    }
    const record = records[selected.toUpperCase()];
    return {...record, name: selected.toUpperCase(), parameters: {...record.parameters}, inductors: [], capacitors: []};
}
