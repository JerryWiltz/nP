// Modified: 2026-11-19
// Manufacturer parameter facts, not executable model text. Geometry is part of
// each discrete-device fit; these are not scalable foundry/process models.
const defaults = {LEVEL: 1, TNOM: 300.15, L: 100e-6, W: 100e-6, FC: 0.5, KF: 0, AF: 1};
const records = {
    DMN55D0UT: {polarity: 1, structure: 'N-channel enhancement MOSFET',
        source: 'https://www.diodes.com/spice/download/1842/DMN55D0UT.spice.txt',
        parameters: {...defaults, VTO: 1, KP: 0.324, GAMMA: 1.24, PHI: 0.75, LAMBDA: 133e-6,
            RD: 0.560, RS: 0.560, IS: 80e-15, PB: 0.800, MJ: 0.460,
            CBD: 9.60e-12, CBS: 11.5e-12, CGSO: 25.2e-9, CGDO: 21.0e-9, CGBO: 204e-9}},
    DMP58D0SV: {polarity: -1, structure: 'P-channel enhancement MOSFET, one channel of the dual device',
        source: 'https://www.diodes.com/spice/download/2329/DMP58D0SV.spice.txt',
        parameters: {...defaults, VTO: -2.10, KP: 25e-3, GAMMA: 2.60, PHI: 0.75, LAMBDA: 133e-6,
            RD: 1.12, RS: 1.12, IS: 80e-15, PB: 0.800, MJ: 0.460,
            CBD: 12.8e-12, CBS: 15.4e-12, CGSO: 16.8e-9, CGDO: 14.0e-9, CGBO: 239e-9}}
};
export function mosfetModel(name, polarity) {
    const selected = name === undefined ? polarity === 1 ? 'DMN55D0UT' : 'DMP58D0SV' : name;
    if (typeof selected !== 'string' || !Object.hasOwn(records, selected.toUpperCase()) || records[selected.toUpperCase()].polarity !== polarity) {
        throw new RangeError((polarity === 1 ? 'NMOS' : 'PMOS') + ' model must be ' + (polarity === 1 ? 'DMN55D0UT' : 'DMP58D0SV') + '.');
    }
    const record = records[selected.toUpperCase()];
    return {...record, name: selected.toUpperCase(), parameters: {...record.parameters}, manufacturer: 'Diodes Incorporated', material: 'silicon',
        mathematicalModel: 'SPICE level-1 Shichman-Hodges; overlap and body junction charge',
        modelVersion: 'Manufacturer discrete-device record, retrieved 2026-11-19',
        package: 'RD/RS included; no explicit package L/C or gate resistance; single channel only',
        limitations: 'No TOX/inversion charge, ESD clamp, avalanche, self-heating, measured noise fit or inter-channel coupling',
        noiseModel: 'Classical MOS1 channel thermal and contact thermal noise; vendor KF defaults to zero',
        inductors: [], capacitors: []};
}
