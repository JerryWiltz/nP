// Modified: 2026-11-20
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../../physicalConstants';
import {constant, variable, add, subtract, scale, multiply, power, exponential} from '../bjt/taylor';
import {statzChannelCurrent} from './mesfetEquations';
import {threeTerminalFetPoint, solveThreeTerminalFet} from './threeTerminalFet';

export function hemtParameters(parameters, contacts) {
    return {...parameters, ...(contacts ? {RG: contacts[0], RD: contacts[1], RS: contacts[2]} : {}), VT: BOLTZMANN * 300.15 / ELEMENTARY_CHARGE};
}
function gateCurrent(p, voltage) {
    return scale(subtract(exponential(scale(voltage, 1 / (p.N * p.VT))), constant(1)), p.IS);
}
function gateCharges(p, gs, gd) {
    const difference = subtract(gs, gd);
    const root = power(add(multiply(difference, difference), constant(p.DELTA1 ** 2)), .5);
    const effective = scale(add(add(gs, gd), root), .5), other = subtract(effective, root);
    const offset = subtract(effective, constant(p.VTO));
    const smoothed = scale(add(add(effective, constant(p.VTO)), power(add(multiply(offset, offset), constant(p.DELTA2 ** 2)), .5)), .5);
    const limit = Math.min(p.FC * p.PB, p.VMAX), slope = 1 / Math.sqrt(1 - limit / p.PB);
    const qgs = smoothed[0] < limit ? scale(subtract(constant(1), power(subtract(constant(1), scale(smoothed, 1 / p.PB)), .5)), 2 * p.CGS * p.PB) :
        scale(add(constant(2 * p.PB * (1 - 1 / slope)), scale(subtract(smoothed, constant(limit)), slope)), p.CGS);
    return {qgs, qgd: scale(other, p.CGD)};
}
export function hemtJunction(p, vgs, vgd) {
    const gs = variable(vgs, 0), gd = variable(vgd, 1), channel = statzChannelCurrent(p, gs, gd);
    const igs = gateCurrent(p, gs), igd = gateCurrent(p, gd), {qgs, qgd} = gateCharges(p, gs, gd);
    const currents = [add(igs, igd), subtract(channel.current, igd), scale(add(channel.current, igs), -1)];
    const charges = [add(qgs, qgd), scale(qgd, -1), scale(qgs, -1)];
    if ([...currents.flat(), ...charges.flat()].some(value => !Number.isFinite(value))) throw new RangeError('HEMT state exceeds the Statz die model domain.');
    return {currents, charges, channel: channel.current, igs, igd, qgs, qgd, region: channel.region};
}
export function hemtPoint(p, intrinsicVgs, intrinsicVgd, vs = 0) {
    return threeTerminalFetPoint(hemtJunction, p, intrinsicVgs, intrinsicVgd, 1, vs);
}
export function hemtOperatingPoint(p, vgs, vds) {
    return solveThreeTerminalFet(hemtJunction, p, vgs, vds, 1, undefined, 'HEMT');
}
