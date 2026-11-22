// Modified: 2026-11-22
import {complex} from '../../../np-math/src/complex';
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../physicalConstants';
import {pinStorage, pinBulkResistance, pinChargeParameters, pinLifetimeCurrent} from './pinChargeEquations';
import {seriesTwoPortFromImpedance} from './diodeRf';
import * as t from '../transistors/bjt/taylor';

export function pinChargeLinear(model, frequency) {
    const {record, point, temperature, referenceImpedance: ro} = model;
    const p = pinChargeParameters(record, temperature), omega = 2 * Math.PI * frequency;
    const storage = pinStorage(record, frequency), resistance = pinBulkResistance(p, t.variable(point.control, 0));
    const lifetime = pinLifetimeCurrent(p, t.variable(point.junctionCurrent, 0));
    const current = storage.current.add(complex(lifetime[1], 0)), fd = point.pair.data[1];
    const denominator = complex(1, 0).add(current.mul(complex(resistance[0] * fd, 0)))
        .add(storage.control.mul(complex(point.bulkCurrent * resistance[1] * fd, 0)));
    const junctionTransfer = denominator.inv(), driveTransfer = junctionTransfer.mul(complex(fd, 0));
    const branch = current.mul(driveTransfer);
    const core = branch.add(complex(1 / p.RP, omega * point.depletion.capacitance));
    const lead = complex(0, omega * record.packageParameters.seriesInductance);
    const outside = complex(0, omega * record.packageParameters.parallelCapacitance);
    const leadFactor = complex(1, 0).add(lead.mul(core));
    const port = core.div(leadFactor).add(outside);
    const productDenominator = leadFactor.mul(complex(1, 0).add(outside.mul(complex(2 * ro, 0))))
        .add(core.mul(complex(2 * ro, 0)));
    const loadFactor = lead.mul(complex(1, 0).add(outside.mul(complex(2 * ro, 0)))).add(complex(2 * ro, 0));
    return {p, storage, resistance, lifetime, current, junctionTransfer, driveTransfer, branch, core,
        leadFactor, productDenominator, loadFactor, port};
}

export function pinChargeFrequencyRow(model, frequency) {
    if (!Number.isFinite(frequency) || frequency < 0) throw new RangeError('PIN analysis frequencies must be finite and nonnegative.');
    const {point, temperature, referenceImpedance: ro} = model;
    const r = pinChargeLinear(model, frequency), p = r.p, kt4 = 4 * BOLTZMANN * temperature;
    // Two independent, equal PN junctions. idealConductance is for the pair;
    // each individual junction has twice that conductance.
    const gj = 2 * point.pair.idealConductance;
    const shot = 2 * ELEMENTARY_CHARGE * Math.abs(point.junctionCurrent);
    const flicker = p.KF === 0 ? 0 : frequency > 0 ? p.KF * Math.abs(point.junctionCurrent) ** p.AF / frequency ** p.FFE : Infinity;
    const bulk = r.resistance[0];
    // GRMOD and the storage approximation are noiseless, as documented in
    // the source. Only physical REPI/RLIM contribute this thermal voltage.
    const limitWeight = 1 - bulk / p.REPI;
    const bulkVoltageNoise = kt4 * (bulk ** 2 / p.REPI + p.RLIM * limitWeight ** 2);
    const sourceDensity = 2 * (shot + flicker) * r.branch.div(complex(gj, 0)).mag() ** 2 +
        r.branch.mag() ** 2 * (2 * kt4 * p.RS + bulkVoltageNoise) + kt4 / p.RP;
    const density = ro * sourceDensity / r.productDenominator.mag() ** 2;
    if (!Number.isFinite(density) || density < 0) throw new RangeError('PIN noise is nonfinite; positive frequency is required when flicker noise is enabled.');
    return {spars: seriesTwoPortFromImpedance(frequency, r.port.inv(), ro), noise: {frequency,
        C: [[complex(density, 0), complex(-density, 0)], [complex(-density, 0), complex(density, 0)]]}};
}
