// Modified: 2026-11-22
import {selectModelRecord, modelParameters, noPackageBranches} from '../semiconductorModel';
import {pinChargeReference, resolvePinChargeRecord} from './pinChargeModel';

const records = {
    'CHARGE_STORAGE_REFERENCE': pinChargeReference,
    'SMP1307-011LF': {
        manufacturer: 'Skyworks Solutions', material: 'silicon', family: 'PIN', modelType: 'selected-region',
        mathematicalModel: 'Libra-style selected-region DC/linear RF equivalent',
        modelVersion: 'Skyworks 200313B Figure 8, October 4, 2011',
        source: 'https://www.skyworksinc.com/-/media/SkyWorks/Documents/Products/1-100/200313B.pdf',
        package: 'SOD323: Cg parallel to intrinsic RF branch, 1.5 nH series lead, Cp across terminals',
        pinning: 'nP 1 anode, 2 cathode; not physical package pin numbering',
        referenceTemperature: 300.15,
        parameters: {IS: 1e-8, N: 2.2, RS: 1.48, VI: .08, RR: 4e6, RRF: 2.2,
            CJO: 1.8e-15, VJ: 1, M: 1.01, FC: .5, TAU: 1.5e-6},
        packageParameters: {seriesInductance: 1.5e-9, middleCapacitance: .10e-12, parallelCapacitance: .08e-12},
        operatingRange: {minFrequency: 10e6, maxFrequency: 3e9, minForwardCurrent: 20e-6, maxForwardCurrent: .1},
        defaultsNote: 'Figure 8 IS=1e-8 A and RR=4e6 ohms selected; Table 1/2 instead give 4e5 and 1.1e-8. TAU is the reported physical lifetime, not the unused Libra TAU placeholder',
        noiseModel: 'Equivalent RF-resistance thermal approximation; no calibrated PIN excess-noise fit',
        limitations: 'Selected forward/reverse region, fixed nominal temperature, small-signal RF only. No automatic region switching, carrier-storage transient, intermodulation, breakdown, self-heating or rectified bias shift'
    }
};

export function pinModel(input) {
    const record = selectModelRecord(input, records, 'CHARGE_STORAGE_REFERENCE', 'PIN', ['packageParameters', 'operatingRange', 'modelType']);
    const selectedRegion = record.modelType === 'selected-region' || (record.modelType === undefined &&
        ['VI', 'RR', 'RRF'].some(key => Object.hasOwn(record.parameters, key)));
    if (record.modelType === 'charge-storage' || (record.modelType === undefined && !selectedRegion)) {
        return resolvePinChargeRecord({...record, modelType: 'charge-storage'});
    }
    if (record.modelType !== undefined && record.modelType !== 'selected-region') throw new RangeError('PIN modelType must be charge-storage or selected-region.');
    const parameters = modelParameters(record.parameters, {IS: 1e-14, N: 1, RS: 0,
        VI: undefined, RR: undefined, RRF: 0, CJO: 0, VJ: 1, M: .5, FC: .5, TAU: undefined}, 'PIN',
    {IS: 'positive', N: 'positive', VI: 'positive', RR: 'positive', VJ: 'positive', FC: 'fraction', TAU: 'positive'});
    const packageParameters = modelParameters(record.packageParameters === undefined ? {} : record.packageParameters,
        {seriesInductance: 0, middleCapacitance: 0, parallelCapacitance: 0}, 'PIN packageParameters');
    const operatingRange = modelParameters(record.operatingRange === undefined ? {} : record.operatingRange,
        {minFrequency: undefined, maxFrequency: undefined, minForwardCurrent: undefined, maxForwardCurrent: undefined},
        'PIN operatingRange', {minFrequency: 'positive', maxFrequency: 'positive', minForwardCurrent: 'positive', maxForwardCurrent: 'positive'});
    if (operatingRange.maxFrequency <= operatingRange.minFrequency || operatingRange.maxForwardCurrent <= operatingRange.minForwardCurrent) {
        throw new RangeError('PIN operatingRange frequency and current intervals must increase.');
    }
    noPackageBranches(record, 'PIN');
    return {...record, parameters, packageParameters, operatingRange, referenceTemperature: record.referenceTemperature ?? 300.15};
}
