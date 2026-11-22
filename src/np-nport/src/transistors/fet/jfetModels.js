// Modified: 2026-11-21
import {selectModelRecord, modelParameters, noPackageBranches} from '../../semiconductorModel';
// Resolved parameter data from the cited manufacturer records. No downloaded
// model text is executed or bundled; package parasitics are not inferred.
const common = {TNOM: 300.15, TCV: 0, BEX: 0, NLEV: 1};
const defaults = {...common, VTO: -2, BETA: 1e-4, LAMBDA: 0, RD: 0, RS: 0,
    IS: 1e-14, CGS: 0, CGD: 0, PB: 1, FC: 0.5, KF: 0, AF: 1};
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
    const type = polarity === 1 ? 'NJF' : 'PJF';
    const record = selectModelRecord(name, records, polarity === 1 ? 'MMBF5457LT1' : 'MMBFJ175LT1', type, [], polarity);
    const parameters = modelParameters(record.parameters, defaults, type, {VTO: 'negative', BETA: 'positive',
        IS: 'positive', PB: 'positive', TNOM: 'positive', TCV: 'finite', BEX: 'finite', FC: 'fraction', NLEV: 1});
    noPackageBranches(record, type);
    return {mathematicalModel: 'SPICE level-1 JFET (Shichman-Hodges, B=1)',
        ...record, polarity, parameters, inductors: [], capacitors: []};
}
