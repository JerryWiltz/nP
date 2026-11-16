// Modified: 2026-11-15
// Model parameters, not a SPICE text interpreter. More families need their own
// validated records/equations; selecting a name never executes downloaded code.
const records = {
    '1N4148': {
        manufacturer: 'NXP Semiconductors (archived model)', material: 'silicon', family: 'signal',
        mathematicalModel: 'SPICE junction diode with external reverse-leakage resistor',
        modelVersion: 'SPICE level 1; archived NXP PSPICE subcircuit',
        source: 'https://raw.githubusercontent.com/PySpice-org/PySpice/master/examples/libraries/diode/switching/1N4148.lib',
        originalSource: 'http://www.nxp.com/documents/spice_model/1N4148.prm',
        package: 'SOD27 model; RS included; no explicit package L/C network',
        pinning: 'nP/SPICE port 1 anode, port 2 cathode; the source states physical package pin numbering differs',
        parameters: {IS: 4.352e-9, N: 1.906, BV: 110, IBV: 1e-4, RS: 0.6458,
            CJO: 7.048e-13, VJ: 0.869, M: 0.03, FC: 0.5, TT: 3.48e-9,
            EG: 1.11, XTI: 3, TNOM: 300.15, NBV: 1, KF: 0, AF: 1},
        leakageResistance: 5.827e9,
        leakageNote: 'The source explicitly describes this external resistor as a reverse-modeling element, not a physical resistor'
    }
};

export function diodeModel(name = '1N4148') {
    if (typeof name !== 'string' || !Object.hasOwn(records, name.toUpperCase())) {
        throw new RangeError('D model must be 1N4148.');
    }
    const key = name.toUpperCase(), record = records[key];
    return {...record, name: key, parameters: {...record.parameters}};
}
