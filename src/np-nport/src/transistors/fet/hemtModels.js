// Modified: 2026-11-20
import {terminalContactResistances} from '../contactNetwork';
import {hemtTopology} from './hemtTopology';
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
        P: .65, R: .17, C: .2, FNC: 1e6, KF: 0, AF: 1, FFE: 1},
    // The printed legacy DELTA=.2 supplies threshold smoothing. No Delta1
    // is given: Statz uses 1/ALPHA as its drain transition, here .25 V.
    inductors: [[0, 3, 15e-12], [1, 4, 15e-12], [2, 5, 5e-12]],
    capacitors: [[7, 8, .02e-12]]
};
export function hemtModel(name = 'ATF35143_DIE') {
    if (typeof name !== 'string' || !['ATF35143_DIE', 'ATF35143'].includes(name.toUpperCase())) {
        throw new RangeError('HEMT supports ATF35143_DIE and ATF35143 (SC-70 package, common external source).');
    }
    const packaged = name.toUpperCase() === 'ATF35143';
    const packageParameters = packaged ? {La: .1e-9, Lb: .1e-9, Lc: .8e-9, Ld: .6e-9,
        Rb: .1, Rbridge: .1, Ca: .15e-12, Cb: .15e-12} : null;
    const parameters = {...atf35143.parameters}, terminalNetwork = hemtTopology(parameters, packageParameters);
    return {...atf35143, name: packaged ? 'ATF35143' : atf35143.name, parameters, packageParameters, terminalNetwork,
        contactResistances: terminalContactResistances(terminalNetwork),
        ...(packaged ? {package: 'Manufacturer p.16 SC-70 network; both external source pins joined at port 3, all three source bond paths retained; test-board vias excluded',
            modelVersion: atf35143.modelVersion + '; p.16 package network, optimized 0.1-6 GHz',
            limitations: 'Nominal-temperature Statz adaptation; common external source pins only; test-board vias excluded; positive conducting RF bias only; no electrical temperature scaling, trapping, self-heating, avalanche, transit delay or large-signal solution'} : {}),
        inductors: terminalNetwork.inductors.map(row => row.slice()), capacitors: terminalNetwork.capacitors.map(row => row.slice())};
}
