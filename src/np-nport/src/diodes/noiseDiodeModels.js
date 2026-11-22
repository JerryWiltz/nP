// Modified: 2026-11-22
import {selectModelRecord, modelParameters, noPackageBranches} from '../semiconductorModel';
import {noiseDiodeFit} from './noiseDiodeFit';

const {transitTime, ...spectralFit} = noiseDiodeFit;
const records = {
    NC406_REFERENCE: {
        manufacturer: 'Noisecom (device identified by research authors)', family: 'avalanche noise diode',
        mathematicalModel: 'Maya/Lazaro/Pradell avalanche-zone and drift-zone RF/noise equivalent',
        modelVersion: 'DOI 10.1002/mop.10979, Table 1 and plot-derived 16.7 mA fits',
        source: 'https://upcommons.upc.edu/server/api/core/bitstreams/01200fd7-3902-48b4-a987-161b9dd9a521/content',
        referenceTemperature: 300,
        package: 'Published lead inductance, contact resistance and shunt capacitance; JMICRO transition excluded',
        pinning: 'nP port 1 anode, port 2 cathode; fixed reverse-bias current magnitude 16.7 mA',
        parameters: {leadInductance: 165.5e-12, packageCapacitance: 160e-15, seriesResistance: 5.43,
            depletionResistance: 102.58, driftCapacitance: 169.44e-15, driftResistance: 4.85,
            avalancheFrequency: 26.59e9, transitTime, avalancheLengthRatio: .5, biasCurrent: .0167},
        noiseFit: spectralFit,
        limitations: 'Plot-derived research reference, not a calibrated noise source. Transit time fitted to Figure 4; multiplier fitted to Figure 5. Figure 6 is at a different plane and is not imposed. No DC I-V, cold state, bias/temperature extrapolation or nonlinear current/charge fit; source voltage captions disagree'
    }
};

export function noiseDiodeModel(input) {
    const record = selectModelRecord(input, records, 'NC406_REFERENCE', 'NoiseDiode', ['noiseFit']);
    const parameters = modelParameters(record.parameters, {leadInductance: 0, packageCapacitance: 0,
        seriesResistance: 0, depletionResistance: undefined, driftCapacitance: undefined,
        driftResistance: undefined, avalancheFrequency: undefined, transitTime: undefined,
        avalancheLengthRatio: .5, biasCurrent: undefined}, 'NoiseDiode', {
        depletionResistance: 'positive', driftCapacitance: 'positive', driftResistance: 'positive',
        avalancheFrequency: 'positive', transitTime: 'positive', biasCurrent: 'positive'});
    const fit = record.noiseFit;
    if (!fit || typeof fit !== 'object' || Array.isArray(fit)) throw new TypeError('NoiseDiode model requires noiseFit data.');
    const keys = ['referenceFrequency', 'kneeFrequency', 'coefficientsDb', 'minFrequency', 'maxFrequency'];
    for (const key of Object.keys(fit)) if (!keys.includes(key)) throw new TypeError('Unknown NoiseDiode noiseFit property: ' + key + '.');
    for (const key of keys.filter(key => key !== 'coefficientsDb')) {
        if (!Number.isFinite(fit[key]) || fit[key] <= 0) throw new RangeError('NoiseDiode noiseFit.' + key + ' must be positive Hz.');
    }
    if (fit.maxFrequency <= fit.minFrequency || fit.kneeFrequency < fit.minFrequency || fit.kneeFrequency > fit.maxFrequency ||
        !Array.isArray(fit.coefficientsDb) || fit.coefficientsDb.length !== 3 ||
        Array.from(fit.coefficientsDb).some(value => !Number.isFinite(value))) {
        throw new RangeError('NoiseDiode noiseFit needs an increasing frequency interval, an in-band knee and three finite dB coefficients.');
    }
    noPackageBranches(record, 'NoiseDiode');
    return {...record, parameters, referenceTemperature: record.referenceTemperature ?? 300.15,
        noiseFit: {...fit, coefficientsDb: fit.coefficientsDb.slice()}};
}
