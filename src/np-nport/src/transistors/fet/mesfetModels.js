// Modified: 2026-11-19
// Published SPICE3 manual example-column values and documented defaults. This
// is a numerical reference profile, not a fitted commercial transistor card.
const reference = {
    name: 'SPICE3_REFERENCE', manufacturer: null, referenceTemperature: 300.15, material: 'GaAs model reference',
    structure: 'N-channel depletion MESFET reference primitive',
    mathematicalModel: 'SPICE level-1 Statz current and total-gate-charge model',
    modelVersion: 'SPICE3f manual section 3.4.10 example-column profile',
    source: 'https://pages.hmc.edu/harris/class/e158/07/spice3man.pdf',
    equationSource: 'https://ngspice.sourceforge.io/docs/ngspice-39-manual.pdf',
    package: 'Reference RD/RS only; no characterized commercial package or lead L/C',
    temperatureModel: 'Electrical law fixed at 300.15 K; temperature changes channel/contact thermal noise only',
    noiseModel: 'Classical MES1 channel/contact thermal noise, KF=0; no measured noise fit',
    limitations: 'Not a commercial part fit; no dispersion, trapping, self-heating, avalanche, gate shot or induced-gate noise',
    parameters: {VTO: -2, BETA: 1e-3, B: 0.3, ALPHA: 2, LAMBDA: 1e-4,
        RD: 100, RS: 100, CGS: 5e-12, CGD: 1e-12, PB: 0.6, IS: 1e-14, KF: 0, AF: 1},
    inductors: [], capacitors: []
};
export function mesfetModel(name = 'SPICE3_REFERENCE') {
    if (typeof name !== 'string' || name.toUpperCase() !== reference.name) throw new RangeError('MESFET currently supports model SPICE3_REFERENCE only; commercial part fits are not supplied.');
    return {...reference, parameters: {...reference.parameters}, inductors: [], capacitors: []};
}
