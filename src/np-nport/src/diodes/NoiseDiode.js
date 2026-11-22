// Modified: 2026-11-22
import {global} from '../../../np-global/src/global';
import {complex} from '../../../np-math/src/complex';
import {componentSettings} from '../componentSettings';
import {analysisFrequencies} from '../analysisFrequencies';
import {nPort} from '../nPort';
import {dcSnapshot, requiredDcModel} from '../dcModel';
import {schematicPart} from '../schematicPart';
import {seriesTwoPortFromImpedance} from './diodeRf';
import {noiseDiodeModel} from './noiseDiodeModels';
import {avalancheNoisePoint} from './avalancheNoise';
import {BOLTZMANN} from '../physicalConstants';

function properties(value, allowed, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(label + ' must be an object.');
    for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new TypeError('Unknown ' + label + ' property: ' + key + '.');
}

function sourceTable(record, settings, options = {}) {
    properties(options, ['coldTemperature', 'referenceTemperature'], 'NoiseDiode noiseTable');
    const cold = options.coldTemperature ?? 290, reference = options.referenceTemperature ?? 290;
    if (!Number.isFinite(cold) || cold < 0 || !Number.isFinite(reference) || reference <= 0) {
        throw new RangeError('noiseTable needs nonnegative coldTemperature and positive referenceTemperature in kelvin.');
    }
    const table = [['Freq', 'enr (dB)', 'noiseTemperature (K)', 'availableNoise (dBm/Hz)',
        'deliveredNoise (dBm/Hz)', 'sourceReflectionMag']];
    for (const frequency of settings.fList) {
        const point = avalancheNoisePoint(record, frequency), z = point.impedance;
        const reflection = z.sub(complex(settings.Ro, 0)).div(z.add(complex(settings.Ro, 0))).mag();
        const excess = (point.noiseTemperature - cold) / reference;
        if (!(excess > 0)) throw new RangeError('NoiseDiode noiseTable ENR needs hot noise temperature above the specified cold reference.');
        const delivered = point.voltageDensity * settings.Ro / z.add(complex(settings.Ro, 0)).mag() ** 2;
        table.push([frequency, 10 * Math.log10(excess), point.noiseTemperature,
            10 * Math.log10(BOLTZMANN * point.noiseTemperature / 1e-3),
            10 * Math.log10(delivered / 1e-3), reflection]);
    }
    return table;
}

export function NoiseDiode(options = {}) {
    properties(options, ['model', 'fList', 'temperature'], 'NoiseDiode');
    const record = dcSnapshot(noiseDiodeModel(options.model));
    const temperature = options.temperature ?? record.referenceTemperature;
    if (temperature !== record.referenceTemperature) {
        throw new RangeError('NoiseDiode has a fixed-temperature research/characterized fit; supply a model record at the requested temperature.');
    }
    const settings = componentSettings(global, options);
    Object.freeze(settings.fList); Object.freeze(settings);
    const frequencies = analysisFrequencies(settings);
    if (!frequencies.length || !Number.isFinite(settings.Ro) || settings.Ro <= 0) {
        throw new RangeError('NoiseDiode needs a nonempty characterized RF band and positive reference impedance.');
    }
    const result = new nPort(), spars = [], noise = [];
    for (const frequency of frequencies) {
        const point = avalancheNoisePoint(record, frequency);
        spars.push(seriesTwoPortFromImpedance(frequency, point.impedance, settings.Ro));
        const density = settings.Ro * point.voltageDensity /
            point.impedance.add(complex(2 * settings.Ro, 0)).mag() ** 2;
        noise.push({frequency, C: [[complex(density, 0), complex(-density, 0)],
            [complex(-density, 0), complex(density, 0)]]});
    }
    result.setspars(spars); result.setglobal(settings); result.noise = noise;
    result.model = {...record, parameters: {...record.parameters}, noiseFit: {...record.noiseFit,
        coefficientsDb: record.noiseFit.coefficientsDb.slice()}};
    result.qPoint = {id: -record.parameters.biasCurrent, vd: null, temperature};
    result.noiseTable = sourceTable.bind(null, record, settings);
    result._schematic = schematicPart('NoiseDiode', {labelPrefix: 'ND', value: record.name});
    result._dcModel = requiredDcModel('NoiseDiode', 2,
        'Supply a validated avalanche diode DC I-V model before solving external bias; the fixed-bias RF/noise fit does not define DC conduction.',
        {record, temperature}, settings);
    result._intermod = dcSnapshot({type: 'requiresModel', reason:
        'NoiseDiode has no nonlinear current/charge fit; avalanche noise is not a deterministic intermodulation model.'});
    return result;
}
