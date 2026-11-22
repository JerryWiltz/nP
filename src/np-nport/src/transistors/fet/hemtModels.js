// Modified: 2026-11-21
import {terminalContactResistances} from '../contactNetwork';
import {hemtTopology} from './hemtTopology';
import {selectModelRecord, modelParameters, checkDerivedModelData} from '../../semiconductorModel';
// Core Statz/charge and empirical RC values require supplied data; generic
// defaults must not silently import a manufacturer's fitted die parameters.
const defaults = {VTO: undefined, BETA: undefined, ALPHA: undefined, B: 0, LAMBDA: 0,
    RG: 0, RD: 0, RS: 0, LG: 0, LD: 0, LS: 0, CGS: 0, CGD: 0, CDS: 0,
    PB: undefined, IS: 1e-14, N: 1, DELTA1: undefined, DELTA2: undefined,
    FC: 0.5, VMAX: undefined, RC: undefined, CRF: undefined,
    P: 0, R: 0, C: 0, FNC: 0, KF: 0, AF: 1, FFE: 1};
const packageDefaults = {La: undefined, Lb: undefined, Lc: undefined, Ld: undefined,
    Rb: undefined, Rbridge: undefined, Ca: undefined, Cb: undefined};
const atf35143 = {
    name: 'ATF35143_DIE', manufacturer: 'Agilent/Avago', manufacturerPart: 'ATF-35143', material: 'GaAs',
    structure: 'N-channel depletion pseudomorphic HEMT', referenceTemperature: 300.15,
    mathematicalModel: 'Manufacturer Statz current and Divekar-partitioned static gate charge; nominal-temperature die model',
    modelVersion: 'ATF-35143 datasheet p.16, W=400 micrometers; ADS Statz_Model equations',
    source: 'https://sites.units.it/carrato/didatt/corsi_old/E2_web/modulo_carrato/doc/datasheet_discreti/HEMT_ATF35143.pdf',
    equationSource: 'https://edadownload.software.keysight.com/eedl/ads/2019update1/pdf/Nonlinear_Devices.pdf',
    package: 'Die equivalent LG/LD/LS, RG/RD/RS, CDS and empirical RC/CRF only; external SC-70 package network omitted; one common source terminal',
    temperatureModel: 'Electrical parameters fixed at 300.15 K; selected temperature affects noise only',
    noiseModel: 'Manufacturer P/R/C correlated drain and induced-gate noise, FNC/f flicker and contact thermal noise; no gate shot noise',
    limitations: 'Die model, not the packaged part; positive conducting RF bias only; no electrical temperature scaling, trapping, self-heating, avalanche, transit delay or large-signal solution',
    parameters: {VTO: -.95, BETA: .12, B: .8, ALPHA: 4, LAMBDA: .09,
        RG: 1, RD: .5, RS: .25, LG: 15e-12, LD: 15e-12, LS: 5e-12,
        CGS: .4e-12, CGD: .08e-12, CDS: .02e-12, PB: .7, IS: 1e-9, N: 1,
        DELTA1: .25, DELTA2: .2, FC: .5, VMAX: .5, RC: 250, CRF: .1,
        P: .65, R: .17, C: .2, FNC: 1e6, KF: 0, AF: 1, FFE: 1}
    // The printed legacy DELTA=.2 supplies threshold smoothing. No Delta1
    // is given: Statz uses 1/ALPHA as its drain transition, here .25 V.
};
const records = {ATF35143_DIE: atf35143, ATF35143: {...atf35143,
    packageParameters: {La: .1e-9, Lb: .1e-9, Lc: .8e-9, Ld: .6e-9, Rb: .1, Rbridge: .1, Ca: .15e-12, Cb: .15e-12},
    package: 'Manufacturer p.16 SC-70 network; both external source pins joined at port 3, all three source bond paths retained; test-board vias excluded',
    modelVersion: atf35143.modelVersion + '; p.16 package network, optimized 0.1-6 GHz',
    limitations: 'Nominal-temperature Statz adaptation; common external source pins only; test-board vias excluded; positive conducting RF bias only; no electrical temperature scaling, trapping, self-heating, avalanche, transit delay or large-signal solution'}};
export function hemtModel(name = 'ATF35143_DIE') {
    const record = selectModelRecord(name, records, 'ATF35143_DIE', 'HEMT',
        ['packageParameters', 'terminalNetwork', 'contactResistances'], 1);
    const parameters = modelParameters(record.parameters, defaults, 'HEMT', {VTO: 'negative',
        BETA: 'positive', ALPHA: 'positive', PB: 'positive', IS: 'positive', N: 'positive',
        DELTA1: 'positive', DELTA2: 'positive', FC: 'fraction', RC: 'positive', CRF: 'positive', C: 'correlation'});
    if (record.referenceTemperature !== undefined && record.referenceTemperature !== 300.15) {
        throw new RangeError('HEMT model electrical referenceTemperature is fixed at 300.15 K.');
    }
    const packageParameters = record.packageParameters == null ? null :
        modelParameters(record.packageParameters, packageDefaults, 'HEMT packageParameters');
    const terminalNetwork = hemtTopology(parameters, packageParameters);
    const derived = {terminalNetwork,
        contactResistances: terminalContactResistances(terminalNetwork),
        inductors: terminalNetwork.inductors.map(row => row.slice()), capacitors: terminalNetwork.capacitors.map(row => row.slice())};
    checkDerivedModelData(record, derived, 'HEMT');
    return {mathematicalModel: 'Statz current and Divekar-partitioned static gate charge', referenceTemperature: 300.15,
        ...record, parameters, packageParameters, ...derived};
}
