// Modified: 2026-11-15
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../../physicalConstants';
import {temperatureJunction} from '../../junctionTemperature';
import {constant, variable, add, subtract, multiply, scale, power, divide, exponential} from './taylor';

export function temperatureParameters(parameters, temperature) {
    const p = {...parameters}, ratio = temperature / p.TNOM;
    p.VT = BOLTZMANN * temperature / ELEMENTARY_CHARGE;
    const logarithm = (ratio - 1) * p.EG / p.VT + p.XTI * Math.log(ratio);
    const betaFactor = ratio ** p.XTB;
    p.IS *= Math.exp(logarithm);
    p.ISE *= Math.exp(logarithm / p.NE) / betaFactor;
    p.ISC *= Math.exp(logarithm / p.NC) / betaFactor;
    p.BF *= betaFactor;
    p.BR *= betaFactor;
    [p.CJE, p.VJE] = temperatureJunction(p.CJE, p.VJE, p.MJE, p.TNOM, temperature);
    [p.CJC, p.VJC] = temperatureJunction(p.CJC, p.VJC, p.MJC, p.TNOM, temperature);
    return p;
}
function diodeCurrent(voltage, saturation, thermalVoltage) {
    return scale(subtract(exponential(scale(voltage, 1 / thermalVoltage)), constant(1)), saturation);
}
function junctionCharge(voltage, capacitance, potential, grading, fc) {
    if (voltage[0] < fc * potential) {
        return scale(subtract(constant(1), power(subtract(constant(1), scale(voltage, 1 / potential)),
            1 - grading)), capacitance * potential / (1 - grading));
    }
    const knee = fc * potential;
    const qKnee = capacitance * potential * (1 - (1 - fc) ** (1 - grading)) / (1 - grading);
    const cKnee = capacitance * (1 - fc) ** -grading;
    const slope = cKnee * grading / (potential * (1 - fc));
    const delta = subtract(voltage, constant(knee));
    return add(constant(qKnee), add(scale(delta, cKnee), scale(multiply(delta, delta), slope / 2)));
}
export function gummelPoon(p, vbeValue, vbcValue, charges = true) {
    const vbe = variable(vbeValue, 0), vbc = variable(vbcValue, 1);
    const forward = diodeCurrent(vbe, p.IS, p.NF * p.VT);
    const reverse = diodeCurrent(vbc, p.IS, p.NR * p.VT);
    const early = power(subtract(constant(1), add(scale(vbc, 1 / p.VAF), scale(vbe, 1 / p.VAR))), -1);
    const highInjection = add(scale(forward, 1 / p.IKF), scale(reverse, 1 / p.IKR));
    const qb = scale(multiply(early, add(constant(1), power(add(constant(1), scale(highInjection, 4)), 0.5))), 0.5);
    const ibe = add(scale(forward, 1 / p.BF), diodeCurrent(vbe, p.ISE, p.NE * p.VT));
    const ibc = add(scale(reverse, 1 / p.BR), diodeCurrent(vbc, p.ISC, p.NC * p.VT));
    const transport = divide(subtract(forward, reverse), qb);
    const ib = add(ibe, ibc), ic = subtract(transport, ibc), ie = scale(add(ib, ic), -1);
    let qbe = constant(0), qbc = constant(0);
    if (charges) {
        let storage = constant(0);
        if (vbeValue > 0 && p.TF !== 0) {
            const fraction = divide(forward, add(forward, constant(p.ITF)));
            const correction = scale(multiply(exponential(scale(vbc, 1 / (1.44 * p.VTF))),
                multiply(fraction, fraction)), p.XTF);
            storage = scale(divide(multiply(forward, add(constant(1), correction)), qb), p.TF);
        }
        qbe = add(junctionCharge(vbe, p.CJE, p.VJE, p.MJE, p.FC), storage);
        qbc = add(junctionCharge(vbc, p.CJC, p.VJC, p.MJC, p.FC), scale(reverse, p.TR));
    }
    return {currents: [ib, ic, ie], charges: [add(qbe, qbc), scale(qbc, -1), scale(qbe, -1)],
        qbe, qbc, forward: forward[0], reverse: reverse[0], ibe: ibe[0], ibc: ibc[0], qb: qb[0]};
}
function biasResidual(p, vbe, vbc, current, voltage, configuration) {
    const data = gummelPoon(p, vbe, vbc, false), [ib, ic, ie] = data.currents;
    const terminalVoltage = configuration === 'commonBase' ?
        add(scale(variable(vbc, 1), -1), subtract(scale(ic, p.RC), scale(ib, p.RB))) :
        add(subtract(variable(vbe, 0), variable(vbc, 1)), subtract(scale(ic, p.RC), scale(ie, p.RE)));
    const terminalCurrent = configuration === 'commonBase' ? scale(ie, -1) : ib;
    return {data, a: subtract(terminalCurrent, constant(current)), b: subtract(terminalVoltage, constant(voltage))};
}
export function operatingPoint(p, current, voltage, configuration, initial) {
    let vbe = initial ? initial[0] : p.NF * p.VT * Math.log1p(current *
        (configuration === 'commonBase' ? 1 : p.BF) / p.IS);
    let vbc = initial ? initial[1] : configuration === 'commonBase' ? -voltage : vbe - voltage;
    const currentScale = Math.max(current, 1e-9);
    for (let iteration = 0; iteration < 120; iteration++) {
        const {a, b} = biasResidual(p, vbe, vbc, current, voltage, configuration);
        const error = Math.abs(a[0]) / currentScale + Math.abs(b[0]);
        if (Math.abs(a[0]) < 1e-13 + current * 1e-10 && Math.abs(b[0]) < 1e-9) {
            const data = gummelPoon(p, vbe, vbc), [ib, ic, ieEntering] = data.currents.map(row => row[0]);
            const vbeExternal = vbe + p.RB * ib - p.RE * ieEntering;
            const vce = vbe - vbc + p.RC * ic - p.RE * ieEntering;
            return {ib, ic, ie: -ieEntering, vbe: vbeExternal, vce, vcb: vce - vbeExternal,
                vb: vbeExternal, vc: vce, ve: 0, intrinsicVbe: vbe, intrinsicVbc: vbc, data};
        }
        const determinant = a[1] * b[2] - a[2] * b[1];
        let dx = (-a[0] * b[2] + a[2] * b[0]) / determinant;
        let dy = (-a[1] * b[0] + a[0] * b[1]) / determinant;
        const limit = Math.max(1, Math.abs(dx) / 0.15, Math.abs(dy) / 0.3);
        dx /= limit; dy /= limit;
        let accepted = false;
        for (let step = 1; step >= 1 / 4096; step /= 2) {
            const next = biasResidual(p, vbe + step * dx, vbc + step * dy, current, voltage, configuration);
            const nextError = Math.abs(next.a[0]) / currentScale + Math.abs(next.b[0]);
            if (Number.isFinite(nextError) && nextError < error) {
                vbe += step * dx; vbc += step * dy; accepted = true; break;
            }
        }
        if (!accepted) break;
    }
    throw new RangeError('BJT bias did not converge at ' + current + ' A, ' + voltage + ' V (' + configuration + ').');
}
