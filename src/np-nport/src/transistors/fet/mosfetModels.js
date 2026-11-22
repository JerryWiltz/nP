// Modified: 2026-11-21
import {selectModelRecord, modelParameters, noPackageBranches} from '../../semiconductorModel';
// Manufacturer parameter facts, not executable model text. Geometry is part of
// each discrete-device fit; these are not scalable foundry/process models.
const defaults = {LEVEL: 1, TNOM: 300.15, L: 100e-6, W: 100e-6, FC: 0.5, KF: 0, AF: 1};
const generic = {...defaults, VTO: 0, KP: 2e-5, GAMMA: 0, PHI: 0.6, LAMBDA: 0,
    RD: 0, RS: 0, IS: 1e-14, PB: 0.8, MJ: 0.5, CBD: 0, CBS: 0, CGSO: 0, CGDO: 0, CGBO: 0};
const diodesMetadata = {manufacturer: 'Diodes Incorporated', material: 'silicon',
    mathematicalModel: 'SPICE level-1 Shichman-Hodges; overlap and body junction charge',
    modelVersion: 'Manufacturer discrete-device record, retrieved 2026-11-19',
    package: 'RD/RS included; no explicit package L/C or gate resistance; single channel only',
    limitations: 'No TOX/inversion charge, ESD clamp, avalanche, self-heating, measured noise fit or inter-channel coupling',
    noiseModel: 'Classical MOS1 channel thermal and contact thermal noise; vendor KF defaults to zero'};
const records = {
    DMN55D0UT: {...diodesMetadata, polarity: 1, structure: 'N-channel enhancement MOSFET',
        source: 'https://www.diodes.com/spice/download/1842/DMN55D0UT.spice.txt',
        parameters: {...defaults, VTO: 1, KP: 0.324, GAMMA: 1.24, PHI: 0.75, LAMBDA: 133e-6,
            RD: 0.560, RS: 0.560, IS: 80e-15, PB: 0.800, MJ: 0.460,
            CBD: 9.60e-12, CBS: 11.5e-12, CGSO: 25.2e-9, CGDO: 21.0e-9, CGBO: 204e-9}},
    DMP58D0SV: {...diodesMetadata, polarity: -1, structure: 'P-channel enhancement MOSFET, one channel of the dual device',
        source: 'https://www.diodes.com/spice/download/2329/DMP58D0SV.spice.txt',
        parameters: {...defaults, VTO: -2.10, KP: 25e-3, GAMMA: 2.60, PHI: 0.75, LAMBDA: 133e-6,
            RD: 1.12, RS: 1.12, IS: 80e-15, PB: 0.800, MJ: 0.460,
            CBD: 12.8e-12, CBS: 15.4e-12, CGSO: 16.8e-9, CGDO: 14.0e-9, CGBO: 239e-9}}
};
export function mosfetModel(name, polarity, body = 'source') {
    const type = polarity === 1 ? 'NMOS' : 'PMOS';
    const record = selectModelRecord(name, records, polarity === 1 ? 'DMN55D0UT' : 'DMP58D0SV', type, ['body'], polarity);
    if (record.body !== undefined && record.body !== body) {
        throw new RangeError(type + ' model.body conflicts with the constructor body option.');
    }
    const parameters = modelParameters(record.parameters, generic, type, {LEVEL: 1, TNOM: 'positive',
        L: 'positive', W: 'positive', VTO: 'finite', KP: 'positive', PHI: 'positive', IS: 'positive',
        PB: 'positive', MJ: 'fraction', FC: 'fraction'});
    noPackageBranches(record, type);
    const {body: modelBody, ...data} = record;
    return {mathematicalModel: 'SPICE level-1 Shichman-Hodges; overlap and body junction charge',
        ...data, polarity, parameters, inductors: [], capacitors: []};
}
