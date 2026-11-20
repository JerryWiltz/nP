// Modified: 2026-11-19
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../physicalConstants';

export function legacyJunction(p, voltage) {
    const vt = p.n * BOLTZMANN * p.temperatureK / ELEMENTARY_CHARGE;
    const exponential = p.is * Math.exp(Math.min(voltage / vt, 80));
    const excess = Math.max(-voltage - p.breakdownVoltage, 0);
    const avalanche = -p.breakdownCurrent * Math.expm1(excess / p.breakdownSoftness);
    const slope = excess > 0 ? p.breakdownCurrent * Math.exp(excess / p.breakdownSoftness) : 0;
    return {current: exponential - p.is + voltage / p.leakageResistance + avalanche,
        conductance: exponential / vt + 1 / p.leakageResistance + slope / p.breakdownSoftness,
        second: exponential / vt ** 2 - slope / p.breakdownSoftness ** 2,
        third: exponential / vt ** 3 + slope / p.breakdownSoftness ** 3,
        forwardCurrent: p.is * Math.expm1(Math.min(voltage / vt, 80)), avalanche};
}

export function legacyDiodeCurrentAtVoltage(voltage, p) {
    const vt = BOLTZMANN * p.temperatureK / ELEMENTARY_CHARGE;
    let current = voltage >= 0 ? voltage / Math.max(p.rs + p.n * vt / p.is, 1) : -p.is;
    for (let iteration = 0; iteration < 60; iteration++) {
        const junction = legacyJunction(p, voltage - current * p.rs);
        const next = current - (current - junction.current) / (1 + p.rs * junction.conductance);
        if (Math.abs(next - current) <= Math.max(1e-15, Math.abs(next) * 1e-12)) return next;
        current = next;
    }
    return current;
}

export function legacyDiodeAdmittance(p, voltage = p.biasVoltage, junctionVoltage) {
    const current = junctionVoltage === undefined ? legacyDiodeCurrentAtVoltage(voltage, p) : legacyJunction(p, junctionVoltage).current;
    if (junctionVoltage === undefined) junctionVoltage = voltage - current * p.rs;
    const junction = legacyJunction(p, junctionVoltage);
    return {current, junctionVoltage, conductance: junction.conductance,
        resistance: junction.conductance > 0 ? 1 / junction.conductance : Infinity};
}
