// Modified: 2026-11-22
import {complex} from '../../../np-math/src/complex';
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../physicalConstants';
import {diodeOperatingPoint, diodeJunctionOperatingPoint, depletionCharge} from './junctionDiode';
import {seriesTwoPortFromImpedance} from './diodeRf';

export function pinDcParameters(record, temperature, region) {
    const p = record.parameters;
    return {...p, VT: BOLTZMANN * temperature / ELEMENTARY_CHARGE, BV: Infinity, breakdownKnee: Infinity,
        NBV: 1, TT: 0, CJO: 0, RS: p.RS + (region === 'reverse' ? p.RR : 0)};
}

export function pinPoint(record, temperature, region, voltage, junctionVoltage) {
    const p = pinDcParameters(record, temperature, region), drop = region === 'forward' ? p.VI : 0;
    const point = junctionVoltage === undefined ? diodeOperatingPoint(p, voltage - drop, Infinity) :
        diodeJunctionOperatingPoint(p, voltage - drop, junctionVoltage, Infinity);
    return {...point, vd: voltage};
}

export function pinRfPoint(record, region, point) {
    const p = record.parameters, range = record.operatingRange;
    if (region === 'forward' && (point.id < range.minForwardCurrent || point.id > range.maxForwardCurrent)) {
        throw new RangeError('PIN forward RF bias current is outside operatingRange; supply a characterized record covering the solved bias.');
    }
    if (region === 'reverse' && point.vd > 1e-10) throw new RangeError('PIN reverse region requires nonpositive terminal voltage.');
    const resistance = region === 'forward' ? p.VI / point.id : p.RR;
    const capacitance = region === 'forward' ? depletionCharge(p, p.VI).capacitance : 0;
    return {intrinsicResistance: resistance, intrinsicCapacitance: capacitance,
        rfSeriesResistance: p.RRF, storedCharge: p.TAU * Math.max(point.id, 0)};
}

export function pinFrequencyRow(record, rf, temperature, frequency, ro) {
    const range = record.operatingRange;
    if (!Number.isFinite(frequency) || frequency < range.minFrequency || frequency > range.maxFrequency) {
        throw new RangeError('PIN requires every analysis frequency inside operatingRange.');
    }
    const omega = 2 * Math.PI * frequency, pkg = record.packageParameters;
    const intrinsic = complex(1 / rf.intrinsicResistance, omega * rf.intrinsicCapacitance).inv();
    const contact = intrinsic.add(complex(rf.rfSeriesResistance, 0));
    const middle = contact.inv().add(complex(0, omega * pkg.middleCapacitance)).inv();
    const lead = middle.add(complex(0, omega * pkg.seriesInductance));
    const impedance = lead.inv().add(complex(0, omega * pkg.parallelCapacitance)).inv();
    const density = 4 * BOLTZMANN * temperature * impedance.x * ro / impedance.add(complex(2 * ro, 0)).mag() ** 2;
    if (![impedance.x, impedance.y, density].every(Number.isFinite) || impedance.x < 0 || density < 0) {
        throw new RangeError('PIN RF parameters produce nonfinite impedance or invalid noise.');
    }
    return {spars: seriesTwoPortFromImpedance(frequency, impedance, ro), noise: {frequency,
        C: [[complex(density, 0), complex(-density, 0)], [complex(-density, 0), complex(density, 0)]]}};
}
