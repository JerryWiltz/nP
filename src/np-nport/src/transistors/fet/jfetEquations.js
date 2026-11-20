// Modified: 2026-11-19
import {threeTerminalFetPoint, solveThreeTerminalFet} from './threeTerminalFet';
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../../physicalConstants';
import {temperatureJunction} from '../../junctionTemperature';
import {powers, constant, variable, add, subtract, multiply, scale, power, exponential} from '../bjt/taylor';

export function jfetTemperature(parameters, temperature) {
    const p = {...parameters}, ratio = temperature / p.TNOM;
    p.VT = BOLTZMANN * temperature / ELEMENTARY_CHARGE;
    p.IS *= Math.exp((ratio - 1) * 1.11 / p.VT);
    p.VTO -= p.TCV * (temperature - p.TNOM);
    p.BETA *= ratio ** p.BEX;
    [p.CGS, p.PB] = temperatureJunction(parameters.CGS, parameters.PB, 0.5, p.TNOM, temperature);
    [p.CGD] = temperatureJunction(parameters.CGD, parameters.PB, 0.5, p.TNOM, temperature);
    return p;
}

function gateCurrent(p, voltage) {
    if (voltage[0] < -3 * p.VT) {
        return subtract(constant(-p.IS), scale(power(voltage, -3), p.IS * (3 * p.VT / Math.E) ** 3));
    }
    return scale(subtract(exponential(scale(voltage, 1 / p.VT)), constant(1)), p.IS);
}

function gateCharge(p, voltage, capacitance) {
    const threshold = p.FC * p.PB;
    if (voltage[0] < threshold) {
        return scale(subtract(constant(1), power(subtract(constant(1), scale(voltage, 1 / p.PB)), 0.5)), 2 * capacitance * p.PB);
    }
    const c0 = capacitance / Math.sqrt(1 - p.FC), delta = subtract(voltage, constant(threshold));
    const q0 = 2 * capacitance * p.PB * (1 - Math.sqrt(1 - p.FC));
    return add(constant(q0), add(scale(delta, c0), scale(multiply(delta, delta), c0 / (4 * p.PB * (1 - p.FC)))));
}

function channelCurrent(p, gs, gd) {
    const reverse = gs[0] < gd[0], vds = reverse ? subtract(gd, gs) : subtract(gs, gd);
    const overdrive = subtract(reverse ? gd : gs, constant(p.VTO));
    if (overdrive[0] <= 0) return {current: constant(0), region: 'cutoff'};
    const saturation = vds[0] >= overdrive[0];
    const current = saturation ? multiply(overdrive, overdrive) : multiply(vds, subtract(scale(overdrive, 2), vds));
    return {current: scale(multiply(current, add(constant(1), scale(vds, p.LAMBDA))), (reverse ? -1 : 1) * p.BETA),
        region: (reverse ? 'inverse-' : '') + (saturation ? 'saturation' : 'linear')};
}

function physicalCoefficients(row, polarity) {
    return row.map((value, index) => value * polarity ** (powers[index][0] + powers[index][1] + 1));
}

// Current/charge jets use (Vgs,Vgd), normalized by factorials through degree 3.
// Their sum is exactly zero: source currents and charges are never inferred by
// grounding the source terminal in the RF model.
export function jfetJunction(p, vgs, vgd, polarity = 1) {
    const gs = variable(polarity * vgs, 0), gd = variable(polarity * vgd, 1);
    const igs = gateCurrent(p, gs), igd = gateCurrent(p, gd), channel = channelCurrent(p, gs, gd);
    const qgs = gateCharge(p, gs, p.CGS), qgd = gateCharge(p, gd, p.CGD);
    const currents = [add(igs, igd), subtract(channel.current, igd), scale(add(channel.current, igs), -1)];
    const charges = [add(qgs, qgd), scale(qgd, -1), scale(qgs, -1)];
    const data = {currents: currents.map(row => physicalCoefficients(row, polarity)),
        charges: charges.map(row => physicalCoefficients(row, polarity)),
        channel: physicalCoefficients(channel.current, polarity), qgs: physicalCoefficients(qgs, polarity),
        qgd: physicalCoefficients(qgd, polarity), igs: physicalCoefficients(igs, polarity),
        igd: physicalCoefficients(igd, polarity), region: channel.region};
    if ([...data.currents.flat(), ...data.charges.flat(), ...data.channel].some(value => !Number.isFinite(value))) {
        throw new RangeError('JFET state is outside the supported level-1 model domain.');
    }
    return data;
}

export function jfetPoint(p, intrinsicVgs, intrinsicVgd, polarity, vs = 0) {
    return threeTerminalFetPoint(jfetJunction, p, intrinsicVgs, intrinsicVgd, polarity, vs);
}
export function jfetOperatingPoint(p, vgs, vds, polarity, initial) {
    return solveThreeTerminalFet(jfetJunction, p, vgs, vds, polarity, initial, 'JFET');
}
