// Modified: 2026-11-19
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../../physicalConstants';
import {powers, constant, variable, add, subtract, scale, multiply, divide, power, exponential} from '../bjt/taylor';
import {threeTerminalFetPoint, solveThreeTerminalFet} from './threeTerminalFet';

export function mesfetParameters(parameters) {
    // MES1 is the historical fixed-reference electrical law, not a GaAs
    // temperature fit. Keep the selected noise temperature separate.
    return {...parameters, VT: BOLTZMANN * 300.15 / ELEMENTARY_CHARGE};
}
function gateCurrent(p, voltage) {
    if (voltage[0] <= -3 * p.VT) return subtract(constant(-p.IS), scale(power(voltage, -3), p.IS * (3 * p.VT / Math.E) ** 3));
    return scale(subtract(exponential(scale(voltage, 1 / p.VT)), constant(1)), p.IS);
}
function channelCurrent(p, gs, gd) {
    const reverse = gs[0] < gd[0], drain = reverse ? subtract(gd, gs) : subtract(gs, gd);
    const overdrive = subtract(reverse ? gd : gs, constant(p.VTO));
    if (overdrive[0] <= 0) return {current: constant(0), region: 'cutoff'};
    let current = divide(multiply(overdrive, overdrive), add(constant(1), scale(overdrive, p.B)));
    const saturation = drain[0] >= 3 / p.ALPHA;
    if (!saturation) {
        const factor = subtract(constant(1), scale(drain, p.ALPHA / 3));
        current = multiply(current, subtract(constant(1), multiply(multiply(factor, factor), factor)));
    }
    return {current: scale(multiply(current, add(constant(1), scale(drain, p.LAMBDA))), (reverse ? -1 : 1) * p.BETA),
        region: (reverse ? 'inverse-' : '') + (saturation ? 'saturation' : 'linear')};
}
function totalGateCharge(p, gs, gd) {
    const difference = subtract(gs, gd);
    const root = power(add(multiply(difference, difference), constant(1 / (p.ALPHA * p.ALPHA))), 0.5);
    const effective = scale(add(add(gs, gd), root), 0.5), other = subtract(effective, root);
    const offset = subtract(effective, constant(p.VTO));
    const smoothed = scale(add(add(effective, constant(p.VTO)), power(add(multiply(offset, offset), constant(0.2 ** 2)), 0.5)), 0.5);
    // Statz/MES1 uses a 0.5 V continuation boundary and 0.2 V smoothing.
    // PB must exceed that boundary. These are documented equation constants,
    // not corrections for a particular circuit or transistor.
    const charge = smoothed[0] < 0.5 ? scale(subtract(constant(1),
        power(subtract(constant(1), scale(smoothed, 1 / p.PB)), 0.5)), 2 * p.PB) :
        add(constant(2 * p.PB * (1 - Math.sqrt(1 - 0.5 / p.PB))), scale(subtract(smoothed, constant(0.5)), 1 / Math.sqrt(1 - 0.5 / p.PB)));
    return add(scale(charge, p.CGS), scale(other, p.CGD));
}
function differentiate(jet, axis) {
    return powers.map((power, index) => {
        if (power[0] + power[1] >= 3) return 0;
        const target = power.map((degree, i) => degree + (i === axis ? 1 : 0));
        const term = powers.findIndex(candidate => candidate.every((degree, i) => degree === target[i]));
        return target[axis] * jet[term];
    });
}
export function mesfetJunction(p, vgs, vgd) {
    const gs = variable(vgs, 0), gd = variable(vgd, 1), channel = channelCurrent(p, gs, gd);
    const igs = gateCurrent(p, gs), igd = gateCurrent(p, gd), gateCharge = totalGateCharge(p, gs, gd);
    const currents = [add(igs, igd), subtract(channel.current, igd), scale(add(channel.current, igs), -1)];
    const capacitances = [{positive: 0, negative: 2, control: 0, coefficients: differentiate(gateCharge, 0)},
        {positive: 0, negative: 1, control: 1, coefficients: differentiate(gateCharge, 1)}];
    if ([...currents.flat(), ...gateCharge, ...capacitances.flatMap(cap => cap.coefficients)].some(value => !Number.isFinite(value))) throw new RangeError('MESFET state exceeds the Statz model domain.');
    // Branch partition is differential/path-dependent, as in MES1. Do not
    // invent separate static Qgs/Qgd functions or double-count total Qg.
    return {currents, charges: [constant(0), constant(0), constant(0)], capacitances,
        gateCharge, channel: channel.current, igs, igd, region: channel.region};
}
export function mesfetPoint(p, intrinsicVgs, intrinsicVgd, vs = 0) {
    return threeTerminalFetPoint(mesfetJunction, p, intrinsicVgs, intrinsicVgd, 1, vs);
}
export function mesfetOperatingPoint(p, vgs, vds) {
    return solveThreeTerminalFet(mesfetJunction, p, vgs, vds, 1, undefined, 'MESFET');
}
