// Modified: 2026-11-19
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../../physicalConstants';
import {temperatureJunction} from '../../junctionTemperature';
import {solveDcLinearSystem} from '../../dcLinearSystem';
import {devicePowers, constant, variable, add, scale, subtract, multiply, power, exponential} from '../deviceTaylor';

function bandgap(t) { return 1.16 - 7.02e-4 * t * t / (t + 1108); }
export function mosfetTemperature(parameters, temperature, polarity) {
    const p = {...parameters}, ratio = temperature / p.TNOM;
    p.VT = BOLTZMANN * temperature / ELEMENTARY_CHARGE;
    const vtNominal = BOLTZMANN * p.TNOM / ELEMENTARY_CHARGE;
    p.KP /= ratio ** 1.5;
    [, p.PHI] = temperatureJunction(0, parameters.PHI, 0, p.TNOM, temperature);
    p.VBI = polarity * parameters.VTO - p.GAMMA * Math.sqrt(parameters.PHI) +
        polarity * 0.5 * (bandgap(p.TNOM) - bandgap(temperature)) + 0.5 * (p.PHI - parameters.PHI);
    p.VTO = p.VBI + p.GAMMA * Math.sqrt(p.PHI);
    p.IS *= Math.exp(-bandgap(temperature) / p.VT + bandgap(p.TNOM) / vtNominal);
    [p.CBD, p.PB] = temperatureJunction(parameters.CBD, parameters.PB, p.MJ, p.TNOM, temperature);
    [p.CBS] = temperatureJunction(parameters.CBS, parameters.PB, p.MJ, p.TNOM, temperature);
    p.BETA = p.KP * p.W / p.L;
    return p;
}
function bodyCurrent(p, voltage) {
    // MOS1 reverse-junction continuation, excluding simulator gmin. Gate DC
    // current remains exactly zero; do not use hidden conductance to fix bias.
    return voltage[0] <= -3 * p.VT ? constant(-p.IS) : scale(subtract(exponential(scale(voltage, 1 / p.VT)), constant(1)), p.IS);
}
function bodyCharge(p, voltage, capacitance) {
    const threshold = p.FC * p.PB, exponent = 1 - p.MJ;
    if (voltage[0] < threshold) return scale(subtract(constant(1),
        power(subtract(constant(1), scale(voltage, 1 / p.PB)), exponent)), capacitance * p.PB / exponent);
    const delta = subtract(voltage, constant(threshold)), c0 = capacitance * (1 - p.FC) ** -p.MJ;
    const q0 = capacitance * p.PB * (1 - (1 - p.FC) ** exponent) / exponent;
    return add(constant(q0), add(scale(delta, c0), scale(multiply(delta, delta), c0 * p.MJ / (2 * p.PB * (1 - p.FC)))));
}
function channelCurrent(p, gs, ds, bs) {
    const reverse = ds[0] < 0, drain = reverse ? scale(ds, -1) : ds;
    const gate = reverse ? subtract(gs, ds) : gs, body = reverse ? subtract(bs, ds) : bs;
    let root;
    if (body[0] <= 0) root = power(subtract(constant(p.PHI), body), 0.5);
    else {
        root = subtract(constant(Math.sqrt(p.PHI)), scale(body, 1 / (2 * Math.sqrt(p.PHI))));
        if (root[0] <= 0) root = constant(0);
    }
    const threshold = add(constant(p.VBI), scale(root, p.GAMMA)), overdrive = subtract(gate, threshold);
    if (overdrive[0] <= 0) return {current: constant(0), threshold: threshold[0], region: 'cutoff'};
    const saturation = drain[0] >= overdrive[0];
    const current = saturation ? scale(multiply(overdrive, overdrive), 0.5) :
        multiply(drain, subtract(overdrive, scale(drain, 0.5)));
    return {current: scale(multiply(current, add(constant(1), scale(drain, p.LAMBDA))), (reverse ? -1 : 1) * p.BETA),
        threshold: threshold[0], region: (reverse ? 'inverse-' : '') + (saturation ? 'saturation' : 'linear')};
}
function physical(jet, polarity) {
    return jet.map((value, i) => value * polarity ** (1 + devicePowers[i].reduce((a, b) => a + b, 0)));
}
// Coordinates are signed intrinsic (VGS,VDS,VBS); currents enter G,D,S,B.
// Charge consists of the record's overlap capacitors and integrated body
// junction capacitance. Neither supplied record specifies TOX/inversion charge.
export function mosfetJunction(p, vgs, vds, vbs, polarity) {
    const gs = variable(polarity * vgs, 0), ds = variable(polarity * vds, 1), bs = variable(polarity * vbs, 2);
    const bd = subtract(bs, ds), channel = channelCurrent(p, gs, ds, bs);
    const ibs = bodyCurrent(p, bs), ibd = bodyCurrent(p, bd);
    const qbs = bodyCharge(p, bs, p.CBS), qbd = bodyCharge(p, bd, p.CBD);
    const qgs = scale(gs, p.CGSO * p.W), qgd = scale(subtract(gs, ds), p.CGDO * p.W);
    const qgb = scale(subtract(gs, bs), p.CGBO * p.L);
    const currents = [constant(0), subtract(channel.current, ibd), scale(add(channel.current, ibs), -1), add(ibs, ibd)];
    const charges = [add(add(qgs, qgd), qgb), scale(add(qgd, qbd), -1), scale(add(qgs, qbs), -1), subtract(add(qbs, qbd), qgb)];
    const data = {currents: currents.map(jet => physical(jet, polarity)), charges: charges.map(jet => physical(jet, polarity)),
        channel: physical(channel.current, polarity), ibs: physical(ibs, polarity), ibd: physical(ibd, polarity),
        qbs: physical(qbs, polarity), qbd: physical(qbd, polarity), region: channel.region, threshold: polarity * channel.threshold};
    if ([...data.currents.flat(), ...data.charges.flat()].some(value => !Number.isFinite(value))) {
        throw new RangeError('MOSFET state exceeds the supported level-1 model domain.');
    }
    return data;
}
export function mosfetPoint(p, intrinsicVgs, intrinsicVds, intrinsicVbs, polarity, body, vs = 0) {
    const data = mosfetJunction(p, intrinsicVgs, intrinsicVds, intrinsicVbs, polarity);
    const [ig, id, source, bulk] = data.currents.map(jet => jet[0]);
    const vgs = intrinsicVgs - p.RS * source, vds = intrinsicVds + p.RD * id - p.RS * source;
    const vbs = intrinsicVbs - p.RS * source;
    const currents = body === 'source' ? [ig, id, source + bulk] : [ig, id, source, bulk];
    return {ig, id, is: currents[2], ...(body === 'external' ? {ib: bulk} : {}), bodyCurrent: bulk, terminalCurrents: currents,
        vgs, vds, vbs, intrinsicVgs, intrinsicVds, intrinsicVbs, vs,
        vg: vs === null ? null : vs + vgs, vd: vs === null ? null : vs + vds, vb: vs === null ? null : vs + vbs,
        threshold: data.threshold, region: data.region, data};
}
export function mosfetOperatingPoint(p, vgs, vds, vbs, polarity, body) {
    let values = [vgs, vds, vbs];
    for (let iteration = 0; iteration < 400; iteration++) {
        const data = mosfetJunction(p, ...values, polarity), drain = data.currents[1], source = data.currents[2];
        const errors = [values[0] - vgs - p.RS * source[0], values[1] - vds + p.RD * drain[0] - p.RS * source[0],
            values[2] - vbs - p.RS * source[0]];
        const rows = errors.map((error, row) => ({kind: 'constraint', value: -error,
            terms: new Map(values.map((_, col) => [col, (row === col ? 1 : 0) - p.RS * source[col + 1] + (row === 1 ? p.RD * drain[col + 1] : 0)]))}));
        const solution = solveDcLinearSystem(rows, 3);
        if (solution.rank !== 3) throw new RangeError('MOSFET fixed-Q equations are singular.');
        const delta = solution.values;
        if (Math.max(...errors.map(Math.abs)) < 1e-11 && Math.max(...delta.map(Math.abs)) < 1e-9) return mosfetPoint(p, ...values, polarity, body);
        const step = Math.min(1, 0.12 / Math.max(0.12, ...delta.map(Math.abs)));
        values = values.map((value, i) => value + step * delta[i]);
    }
    throw new RangeError('MOSFET fixed-Q solve did not converge.');
}
