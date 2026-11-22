// Modified: 2026-11-22
import {modelParameters, noPackageBranches} from '../semiconductorModel';

// A numerical reference, not a fitted manufacturer part. Parameters and the
// five-section model follow Keysight ADS Nonlinear Devices (2019), pp. 361–367.
export const pinChargeReference = {
    manufacturer: null, family: 'PIN', material: 'silicon', modelType: 'charge-storage',
    mathematicalModel: 'Five-section ambipolar charge-storage equivalent, SPICE capacitance continuation',
    modelVersion: 'ADS documented charge-storage equations, level-1 capacitance',
    source: 'https://edadownload.software.keysight.com/eedl/ads/2019update1/pdf/Nonlinear_Devices.pdf',
    referenceTemperature: 298.15,
    parameters: {IS: 1e-14, N: 1, RS: 0, IKF: Infinity, IKMODEL: 1, BV: Infinity, IBV: .001,
        RP: 1e9, REPI: 1e3, RLIM: .001, W: 1e-4, TAU: 1e-6, IKNEE: Infinity,
        CJO: 1e-15, VJ: 1, M: 0, FC: .5, EG: 1.11, XTI: 3, KF: 0, AF: 1, FFE: 1},
    packageParameters: {seriesInductance: 0, parallelCapacitance: 0},
    noiseModel: 'Documented independent PN shot/flicker and physical-resistor thermal sources; storage ladder noiseless',
    limitations: 'Generic numerical reference, not calibrated to a part. Five-section storage approximation; no self-heating, spatial moving-boundary recovery or advanced frequency-dependent depletion model'
};

export function resolvePinChargeRecord(record) {
    const parameters = modelParameters(record.parameters, {IS: 1e-14, N: 1, RS: 0,
        IKF: Infinity, IKMODEL: 1, BV: Infinity, IBV: .001, RP: 1e9, REPI: undefined, RLIM: undefined,
        W: undefined, TAU: undefined, IKNEE: Infinity, CJO: 0, VJ: 1, M: 0, FC: .5,
        EG: 1.11, XTI: 3, KF: 0, AF: 1, FFE: 1}, 'PIN charge-storage',
    {IS: 'positive', N: 'positive', IKF: 'unlimited', BV: 'unlimited', IBV: 'positive',
        RP: 'positive', REPI: 'positive', RLIM: 'positive', W: 'positive', TAU: 'positive',
        IKNEE: 'unlimited', VJ: 'positive', FC: 'fraction'});
    if (parameters.RLIM >= parameters.REPI) throw new RangeError('PIN RLIM must be smaller than REPI.');
    if (![1, 2].includes(parameters.IKMODEL)) throw new RangeError('PIN IKMODEL must be 1 (ADS/PSpice) or 2 (HSPICE/ngspice).');
    const packageParameters = modelParameters(record.packageParameters === undefined ? {} : record.packageParameters,
        {seriesInductance: 0, parallelCapacitance: 0}, 'PIN charge-storage packageParameters');
    if (record.operatingRange !== undefined) throw new TypeError('Charge-storage PIN uses its equations across bias/frequency; legacy operatingRange is not supported.');
    noPackageBranches(record, 'PIN charge-storage');
    return {...record, parameters, packageParameters, referenceTemperature: record.referenceTemperature ?? 298.15};
}
