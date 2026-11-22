// Modified: 2026-11-22
// Model parameters, not a SPICE text interpreter. More families need their own
// validated records/equations; selecting a name never executes downloaded code.
import {selectModelRecord, modelParameters, noPackageBranches} from '../semiconductorModel';
const defaults = {IS: 1e-14, N: 1, BV: Infinity, IBV: 1e-3, RS: 0,
    CJO: 0, VJ: 1, M: 0.5, FC: 0.5, TT: 0, EG: 1.11, XTI: 3,
    TNOM: 300.15, NBV: 1, KF: 0, AF: 1};
const records = {
    'BZX384-B4V7': {
        manufacturer: 'NXP/Philips (archived model attribution)', material: 'silicon', family: 'zener',
        mathematicalModel: 'SPICE junction diode with exponential reverse breakdown',
        modelVersion: 'Archived BZX384B4V7 / PH_BZX384-B4V7 single-junction card',
        source: 'https://raw.githubusercontent.com/kicad-spice-library/KiCad-Spice-Library/a8688952bcaab19f567bc4db237b60bde03ef310/Models/Diode/DIODE2.lib',
        deviceSource: 'https://assets.nexperia.com/documents/data-sheet/BZX384_SER.pdf',
        package: 'RS included; no explicit SOD323 lead inductance or package capacitance',
        pinning: 'nP port 1 anode, port 2 cathode; SOD323 physical pin 1 is cathode and pin 2 anode', schematicVariant: 'zener',
        parameters: {IS: 1.033e-15, N: 1.001, BV: 4.7, IBV: .005, RS: .387,
            CJO: 2.589e-10, VJ: .8029, M: .3636, FC: .5},
        defaultsNote: 'TT=0, EG=1.11, XTI=3, TNOM=300.15 K, NBV=1, KF=0 and AF=1 are generic SPICE defaults, not supplied fits',
        limitations: 'Archived manufacturer attribution; original hosted card unavailable at verification. Simulator agreement is not measured-device validation. No fitted breakdown temperature coefficient, avalanche excess noise, self-heating or large-signal switching model'
    },
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
    },
    SMS7621: {
        manufacturer: 'Skyworks Solutions', material: 'silicon', family: 'schottky',
        mathematicalModel: 'SPICE junction diode, per-junction Schottky parameter card',
        modelVersion: 'Skyworks 200041AH, June 13, 2024, Table 5',
        source: 'https://www.skyworksinc.com/-/media/SkyWorks/Documents/Products/201-300/Surface-Mount-Schottky-Diodes_200041AH.pdf',
        package: 'Per junction including RS; package inductance/capacitance and multi-diode package configurations excluded',
        pinning: 'nP port 1 anode, port 2 cathode; not package pin numbers',
        schematicVariant: 'schottky',
        parameters: {IS: 4e-8, RS: 12, N: 1.05, TT: 1e-11, CJO: .1e-12, M: .35,
            EG: .69, XTI: 2, FC: .5, BV: 3, IBV: 1e-5, VJ: .51,
            TNOM: 300.15, NBV: 1, KF: 0, AF: 1},
        defaultsNote: 'TNOM=27 C, NBV=1, KF=0 and AF=1 are classical SPICE defaults; not supplied fits',
        leakageResistance: Infinity,
        leakageNote: 'No external leakage resistor is specified; reverse current belongs to the junction law',
        limitations: 'No packaged RF fit, calibrated detector sensitivity, zero-bias/excess/avalanche noise or large-signal rectification; temperature follows classical SPICE laws'
    },
    SMS7630: {
        manufacturer: 'Skyworks Solutions', material: 'silicon', family: 'schottky',
        mathematicalModel: 'SPICE junction diode, per-junction Schottky parameter card',
        modelVersion: 'Skyworks 200041AH, June 13, 2024, Table 5',
        source: 'https://www.skyworksinc.com/-/media/SkyWorks/Documents/Products/201-300/Surface-Mount-Schottky-Diodes_200041AH.pdf',
        package: 'Per junction including RS; package inductance/capacitance and multi-diode package configurations excluded',
        pinning: 'nP port 1 anode, port 2 cathode; not package pin numbers',
        schematicVariant: 'schottky',
        parameters: {IS: 5e-6, RS: 20, N: 1.05, TT: 1e-11, CJO: .14e-12, M: .40,
            EG: .69, XTI: 2, FC: .5, BV: 2, IBV: 1e-4, VJ: .34,
            TNOM: 300.15, NBV: 1, KF: 0, AF: 1},
        defaultsNote: 'TNOM=27 C, NBV=1, KF=0 and AF=1 are classical SPICE defaults; not supplied fits',
        leakageResistance: Infinity,
        leakageNote: 'No external leakage resistor is specified; reverse current belongs to the junction law',
        limitations: 'No packaged RF fit, calibrated detector sensitivity, zero-bias/excess/avalanche noise or large-signal rectification; temperature follows classical SPICE laws'
    },
    'SMV1231-079LF': {
        manufacturer: 'Skyworks Solutions', material: 'silicon', family: 'varactor',
        mathematicalModel: 'SPICE junction current and integrated hyperabrupt depletion charge',
        modelVersion: 'Skyworks 200058AB, May 7, 2026, Figure 5 and Tables 1/5',
        source: 'https://www.skyworksinc.com/-/media/F9C9BC1315644EB890723BD8C726746E.pdf',
        equationSource: 'https://www.skyworksinc.com/-/media/SkyWorks/Documents/Products/1-100/Varactor_SPICE_Model_AN_200315C.pdf',
        package: 'Single SC-79: 0.7 nH lead before parallel CP and RS-plus-junction branches',
        pinning: 'nP port 1 anode, port 2 cathode', schematicVariant: 'varactor',
        parameters: {IS: 1e-14, RS: 2.5, N: 1, TT: 0, CJO: 1.88e-12,
            M: 4.999, VJ: 10.13, EG: 1.11, XTI: 3, TNOM: 300.15,
            FC: 0.5, BV: Infinity, IBV: 1e-3, NBV: 1, KF: 0, AF: 1},
        packageParameters: {seriesInductance: 0.7e-9, parallelCapacitance: 0.44e-12},
        leakageResistance: Infinity,
        defaultsNote: 'Current parameters are manufacturer generic defaults, not measured leakage/breakdown fits; no finite BV supplied',
        limitations: 'Reverse-bias C-V fit over 0-15 V; nominal RS is constant; classical noise and temperature laws are not measured varactor fits; no large-signal VCO/transient model or distributed package fit'
    }
};

export function diodeModel(name = '1N4148') {
    const record = selectModelRecord(name, records, '1N4148', 'D', ['leakageResistance', 'packageParameters']);
    const parameters = modelParameters(record.parameters, defaults, 'D', {IS: 'positive', N: 'positive',
        BV: 'unlimited', IBV: 'positive', VJ: 'positive', FC: 'fraction',
        TNOM: 'positive', NBV: 'positive', XTI: 'finite'});
    const leakageResistance = record.leakageResistance === undefined ? Infinity : record.leakageResistance;
    if (!(leakageResistance > 0 && (Number.isFinite(leakageResistance) || leakageResistance === Infinity))) {
        throw new RangeError('D model.leakageResistance must be positive ohms or Infinity.');
    }
    if (record.schematicVariant !== undefined && !['schottky', 'varactor', 'zener'].includes(record.schematicVariant)) {
        throw new RangeError('D model.schematicVariant must be schottky, varactor, zener or omitted.');
    }
    const packageParameters = modelParameters(record.packageParameters === undefined ? {} : record.packageParameters,
        {seriesInductance: 0, parallelCapacitance: 0}, 'D packageParameters');
    noPackageBranches(record, 'D');
    return {mathematicalModel: 'SPICE junction diode', ...record, parameters, leakageResistance, packageParameters};
}
