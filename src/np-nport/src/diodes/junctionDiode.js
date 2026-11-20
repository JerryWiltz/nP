// Modified: 2026-11-19
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../physicalConstants';
import {temperatureJunction} from '../junctionTemperature';

export function diodeTemperature(parameters, temperature) {
    const p = {...parameters}, ratio = temperature / p.TNOM;
    p.VT = BOLTZMANN * temperature / ELEMENTARY_CHARGE;
    p.IS *= Math.exp(((ratio - 1) * p.EG / p.VT + p.XTI * Math.log(ratio)) / p.N);
    [p.CJO, p.VJ] = temperatureJunction(p.CJO, p.VJ, p.M, p.TNOM, temperature);
    p.breakdownKnee = p.BV;
    if (p.IBV >= p.IS * p.BV / p.VT) {
        let knee = p.BV - p.NBV * p.VT * Math.log1p(p.IBV / p.IS);
        for (let i = 0; i < 25; i++) {
            const next = p.BV - p.NBV * p.VT * Math.log(p.IBV / p.IS + 1 - knee / p.VT);
            if (Math.abs(next - knee) < 1e-13) { knee = next; break; }
            knee = next;
        }
        p.breakdownKnee = knee;
    }
    return p;
}

// Current and its first three derivatives, in junction-voltage coordinates.
export function junctionCurrent(p, voltage) {
    const vt = p.N * p.VT;
    if (voltage >= -3 * vt) {
        const exponential = p.IS * Math.exp(voltage / vt);
        return {current: p.IS * Math.expm1(voltage / vt), conductance: exponential / vt,
            second: exponential / vt ** 2, third: exponential / vt ** 3};
    }
    if (voltage >= -p.breakdownKnee) {
        const coefficient = p.IS * (3 * vt / Math.E) ** 3;
        return {current: -p.IS - coefficient / voltage ** 3,
            conductance: 3 * coefficient / voltage ** 4,
            second: -12 * coefficient / voltage ** 5, third: 60 * coefficient / voltage ** 6};
    }
    const reverseVt = p.NBV * p.VT;
    const current = -p.IS * Math.exp(-(p.breakdownKnee + voltage) / reverseVt);
    return {current, conductance: -current / reverseVt,
        second: current / reverseVt ** 2, third: -current / reverseVt ** 3};
}

// Charge is integrated before differentiation. The continuation at FC*VJ
// keeps Q and C continuous instead of clamping a singular forward-bias law.
export function depletionCharge(p, voltage) {
    const threshold = p.FC * p.VJ;
    if (voltage < threshold) {
        const remaining = 1 - voltage / p.VJ;
        const capacitance = p.CJO * remaining ** -p.M;
        return {charge: p.CJO * p.VJ * (1 - remaining ** (1 - p.M)) / (1 - p.M),
            capacitance, derivative: capacitance * p.M / (p.VJ - voltage),
            second: capacitance * p.M * (p.M + 1) / (p.VJ - voltage) ** 2};
    }
    const q0 = p.CJO * p.VJ * (1 - (1 - p.FC) ** (1 - p.M)) / (1 - p.M);
    const c0 = p.CJO * (1 - p.FC) ** -p.M;
    const slope = c0 * p.M / (p.VJ * (1 - p.FC)), delta = voltage - threshold;
    return {charge: q0 + c0 * delta + slope * delta ** 2 / 2,
        capacitance: c0 + slope * delta, derivative: slope, second: 0};
}

export function diodeJunctionOperatingPoint(p, voltage, junctionVoltage, leakageResistance) {
    const junction = junctionCurrent(p, junctionVoltage), depletion = depletionCharge(p, junctionVoltage);
    const diffusionCapacitance = p.TT * junction.conductance;
    return {vd: voltage, id: junction.current + voltage / leakageResistance,
        junctionVoltage, junctionCurrent: junction.current, conductance: junction.conductance,
        secondDerivative: junction.second, thirdDerivative: junction.third,
        junctionCapacitance: depletion.capacitance, diffusionCapacitance,
        totalCapacitance: depletion.capacitance + diffusionCapacitance,
        capacitanceDerivative: depletion.derivative + p.TT * junction.second,
        capacitanceSecondDerivative: depletion.second + p.TT * junction.third,
        charge: depletion.charge + p.TT * junction.current};
}

export function diodeOperatingPoint(p, voltage, leakageResistance) {
    let low = Math.min(voltage, 0), high = Math.max(voltage, 0), junctionVoltage = voltage;
    for (let iteration = 0; iteration < 160; iteration++) {
        const junction = junctionCurrent(p, junctionVoltage);
        const residual = junctionVoltage + p.RS * junction.current - voltage;
        if (Math.abs(residual) <= 1e-12 + Math.abs(voltage) * 1e-12) {
            return diodeJunctionOperatingPoint(p, voltage, junctionVoltage, leakageResistance);
        }
        if (residual > 0) high = junctionVoltage; else low = junctionVoltage;
        let next = junctionVoltage - residual / (1 + p.RS * junction.conductance);
        if (!Number.isFinite(next) || next <= low || next >= high) next = (low + high) / 2;
        junctionVoltage = next;
    }
    throw new RangeError('D bias did not converge at ' + voltage + ' V.');
}
