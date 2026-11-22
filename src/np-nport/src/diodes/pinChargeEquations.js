// Modified: 2026-11-22
import {complex} from '../../../np-math/src/complex';
import {diodeTemperature, junctionCurrent, depletionCharge} from './junctionDiode';
import * as t from '../transistors/bjt/taylor';

// Units in the published equivalent: ladder voltages numerically represent A,
// CP values TAU/(4i-3) represent charge storage; this ladder is noiseless.
export function pinStorage(record, frequency = 0) {
    const p = record.parameters, alpha = p.W ** 2 / (.00048375 * p.TAU);
    let impedance = complex(0, 0);
    for (let i = 5; i >= 1; i--) {
        const shunt = complex(alpha / (4 * i - 1), 0);
        const rest = i === 5 ? shunt : shunt.mul(impedance).div(shunt.add(impedance));
        const branch = complex((4 * i - 3), 0).div(complex(1, 2 * Math.PI * frequency * p.TAU));
        impedance = branch.add(rest);
        if (i === 1) return {current: impedance.inv(), control: branch.div(impedance)};
    }
}

export function pinChargeParameters(record, temperature) {
    return diodeTemperature({...record.parameters, TNOM: record.referenceTemperature,
        NBV: 1, TT: 0}, temperature);
}

function compose(x, coefficients) {
    const delta = x.slice(); delta[0] = 0;
    let result = t.constant(coefficients[0]), power = t.constant(1);
    for (let i = 1; i <= 3; i++) {
        power = t.multiply(power, delta);
        result = t.add(result, t.scale(power, coefficients[i]));
    }
    return result;
}
// Exact smooth positive-part derivatives. Differentiating x+sqrt(x²+4eps²)
// by generic floating-point polynomial operations loses the tiny higher
// derivatives far from the knee. These equivalent forms avoid cancellation.
export function pinPositive(x) {
    const value = x[0], root = Math.hypot(value, 2e-12);
    const positive = value < 0 ? 2e-24 / (root - value) : (value + root) / 2;
    return compose(x, [positive, positive / root, 1e-24 / root ** 3, -1e-24 * value / root ** 5]);
}

export function pinBulkResistance(p, control) {
    const g = t.scale(pinPositive(control), 2 / (10 * p.W ** 2 / p.TAU));
    return t.power(t.add(t.constant(1 / p.REPI), t.divide(g, t.add(t.constant(1), t.scale(g, p.RLIM)))), -1);
}

function idealPair(p, voltage) {
    const raw = junctionCurrent({...p, N: 2 * p.N, BV: 2 * p.BV, breakdownKnee: 2 * p.breakdownKnee, NBV: 2}, voltage);
    let data = t.constant(raw.current);
    data[1] = raw.conductance; data[3] = raw.second / 2; data[6] = raw.third / 6;
    if (raw.current > 0 && Number.isFinite(p.IKF)) {
        const scaled = t.scale(data, 1 / p.IKF);
        const denominator = p.IKMODEL === 2 ? t.add(t.constant(1), t.power(scaled, .5)) : t.power(t.add(t.constant(1), scaled), .5);
        data = t.divide(data, denominator);
    }
    return data;
}

// Two equal PN junctions, each with RS. Their emission coefficients sum to 2N.
export function pinPair(p, voltage) {
    let low = Math.min(voltage, 0), high = Math.max(voltage, 0), u = voltage;
    for (let i = 0; i < 180; i++) {
        const d = idealPair(p, u), f = u + 2 * p.RS * d[0] - voltage;
        if (Math.abs(f) < 1e-13 + Math.abs(voltage) * 1e-13) {
            const denominator = 1 + 2 * p.RS * d[1], result = t.constant(d[0]);
            result[1] = d[1] / denominator;
            result[3] = d[3] / denominator ** 3;
            result[6] = d[6] / denominator ** 4 - 4 * p.RS * d[3] ** 2 / denominator ** 5;
            return {data: result, idealVoltage: u, idealConductance: d[1]};
        }
        if (f > 0) high = u; else low = u;
        const next = u - f / (1 + 2 * p.RS * d[1]);
        u = Number.isFinite(next) && next > low && next < high ? next : (low + high) / 2;
    }
    throw new RangeError('PIN junction pair did not converge.');
}

export function pinLifetimeCurrent(p, drive) {
    if (!Number.isFinite(p.IKNEE)) return t.constant(0);
    const value = drive[0], root = Math.hypot(value, 2e-12);
    const positive = value < 0 ? 2e-24 / (root - value) : (value + root) / 2;
    return t.scale(compose(drive, [positive ** 2, 2 * positive ** 2 / root,
        positive ** 2 / root ** 2 + 2e-24 * positive / root ** 3, 4e-48 / root ** 5]), 1 / p.IKNEE);
}

function dcAtJunction(p, record, voltage) {
    const pair = pinPair(p, voltage), storage = pinStorage(record), drive = pair.data;
    const current = t.add(t.scale(drive, storage.current.x), pinLifetimeCurrent(p, drive));
    const control = t.scale(drive, storage.control.x), resistance = pinBulkResistance(p, control);
    const terminalVoltage = t.add(t.variable(voltage, 0), t.multiply(resistance, current));
    return {pair, drive, current, control, resistance, terminalVoltage};
}

export function pinChargePoint(record, temperature, voltage) {
    const p = pinChargeParameters(record, temperature);
    let low = Math.min(voltage, 0), high = Math.max(voltage, 0), u = voltage;
    for (let iteration = 0; iteration < 180; iteration++) {
        const d = dcAtJunction(p, record, u), error = d.terminalVoltage[0] - voltage;
        if (Number.isFinite(error) && Math.abs(error) <= 1e-12 + Math.abs(voltage) * 1e-12) {
            const g = d.current[1] / d.terminalVoltage[1] + 1 / p.RP;
            return {vd: voltage, id: d.current[0] + voltage / p.RP, junctionVoltage: u,
                junctionCurrent: d.drive[0], conductance: g, bulkCurrent: d.current[0],
                control: d.control[0], bulkResistance: d.resistance[0],
                storageCoordinate: p.TAU * d.control[0], storedCharge: p.TAU * pinPositive(t.constant(d.control[0]))[0], pair: d.pair,
                depletion: depletionCharge(p, voltage), temperature};
        }
        if (error > 0 || !Number.isFinite(error)) high = u; else low = u;
        const next = u - error / d.terminalVoltage[1];
        u = Number.isFinite(next) && next > low && next < high ? next : (low + high) / 2;
    }
    throw new RangeError('PIN charge-storage DC solve did not converge at ' + voltage + ' V.');
}
