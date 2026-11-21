// Modified: 2026-11-20
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
// Intusoft's published NE760 card, not an inferred package-specific model.
// FC is retained as source data; Berkeley MES1's total-gate-charge law does
// not use it (its forward continuation is fixed at 0.5 V).
const ne760 = {
    name: 'NE760', manufacturer: 'NEC', modelPublisher: 'Intusoft', referenceTemperature: 300.15,
    material: 'GaAs', structure: 'N-channel depletion MESFET',
    mathematicalModel: 'SPICE level-1 Statz current and total-gate-charge model',
    modelVersion: 'IsSpice4 User\'s Guide, chapter 8, pages 193-194, Statz model example',
    source: 'http://www.intusoft.com/lit/IsSpice4.pdf',
    deviceSource: 'https://homepages.uc.edu/~ferendam/Courses/EE_711/NE76000_data.pdf',
    equationSource: 'https://ngspice.sourceforge.io/docs/ngspice-39-manual.pdf',
    package: 'Published RD/RS only; no package suffix, lead L/C or bond-wire model specified',
    temperatureModel: 'Electrical law fixed at 300.15 K; temperature changes channel/contact thermal noise only',
    noiseModel: 'Classical MES1 channel/contact thermal noise, default KF=0/AF=1; no measured noise fit',
    limitations: 'Simulator-published commercial-family card, not a manufacturer-certified or package-specific fit; no measured microwave noise, dispersion, trapping, self-heating, avalanche, gate shot or induced-gate noise; FC is inactive in Berkeley MES1',
    parameters: {VTO: -1, BETA: 0.1275, B: 0.3, ALPHA: 2, LAMBDA: 0.0155,
        RD: 5.45, RS: 4.88, CGS: 0.34e-12, CGD: 0.03e-12, PB: 1, IS: 19.8e-12, FC: 0.2, KF: 0, AF: 1},
    inductors: [], capacitors: []
};
const models = {SPICE3_REFERENCE: reference, NE760: ne760};
export function mesfetModel(name = 'SPICE3_REFERENCE') {
    const record = typeof name === 'string' && Object.hasOwn(models, name.toUpperCase()) ? models[name.toUpperCase()] : undefined;
    if (!record) throw new RangeError('MESFET supports models SPICE3_REFERENCE and NE760.');
    return {...record, parameters: {...record.parameters}, inductors: [], capacitors: []};
}
