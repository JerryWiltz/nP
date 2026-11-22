// Modified: 2026-11-21
// Mathematical descriptions for the audit, evaluated/differentiated by math.js.
// They intentionally do not use nP's Taylor operations. These describe the
// implemented model assumptions; they are not independent manufacturer fits.
import {npnModel} from '../src/np-nport/src/transistors/bjt/npnModels';
import {pnpModel} from '../src/np-nport/src/transistors/bjt/pnpModels';
import {gummelPoon, temperatureParameters} from '../src/np-nport/src/transistors/bjt/gummelPoon';
import {jfetModel} from '../src/np-nport/src/transistors/fet/jfetModels';
import {jfetJunction, jfetTemperature} from '../src/np-nport/src/transistors/fet/jfetEquations';
import {mosfetModel} from '../src/np-nport/src/transistors/fet/mosfetModels';
import {mosfetJunction, mosfetTemperature} from '../src/np-nport/src/transistors/fet/mosfetEquations';
import {mesfetModel} from '../src/np-nport/src/transistors/fet/mesfetModels';
import {mesfetJunction, mesfetParameters} from '../src/np-nport/src/transistors/fet/mesfetEquations';
import {hemtModel} from '../src/np-nport/src/transistors/fet/hemtModels';
import {hemtJunction, hemtParameters} from '../src/np-nport/src/transistors/fet/hemtEquations';
import {diodeModel} from '../src/np-nport/src/diodes/diodeModels';
import {diodeTemperature, junctionCurrent, depletionCharge} from '../src/np-nport/src/diodes/junctionDiode';
import {diodeTerminalCapacitance} from '../src/np-nport/src/diodes/diodeLinear';
import {diode1N4148} from '../src/np-nport/src/diodes/diode1N4148';
import {legacyJunction} from '../src/np-nport/src/diodes/legacyDiode';
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../src/np-nport/src/physicalConstants';
import * as taylor from '../src/np-nport/src/transistors/bjt/taylor';
import * as deviceTaylor from '../src/np-nport/src/transistors/deviceTaylor';

export const parameterUnits = {
    x: 'V', y: 'V', z: 'V', polarity: '',
    IS: 'A', ISE: 'A', ISC: 'A', IKF: 'A', IKR: 'A', ITF: 'A',
    VT: 'V', VTO: 'V', VAF: 'V', VAR: 'V', VTF: 'V', VJE: 'V', VJC: 'V',
    PB: 'V', VJ: 'V', VBI: 'V', PHI: 'V', DELTA1: 'V', DELTA2: 'V', VMAX: 'V',
    NF: '', NR: '', NE: '', NC: '', BF: '', BR: '', XTF: '', N: '', NBV: '',
    FC: '', M: '', MJE: '', MJC: '', MJ: '',
    BETA: 'A / V^2', B: '1 / V', ALPHA: '1 / V', LAMBDA: '1 / V', GAMMA: 'V^0.5',
    CJE: 'F', CJC: 'F', CGS: 'F', CGD: 'F', CJO: 'F', CBS: 'F', CBD: 'F',
    CGSO: 'F / m', CGDO: 'F / m', CGBO: 'F / m', W: 'm', L: 'm',
    RS: 'ohm', CP: 'F', LS: 'H', g: 'S',
    TF: 's', TR: 's', TT: 's', knee: 'V', smooth: 'V', limit: 'V',
    is: 'A', vt: 'V', leakageResistance: 'ohm', breakdownCurrent: 'A',
    breakdownVoltage: 'V', breakdownSoftness: 'V'
};

function depletion(v, capacitance, potential, grading, fc, forward, logarithmic = false) {
    const q = logarithmic ? `-${capacitance}*${potential}*log(1-(${v})/${potential})` :
        `${capacitance}*${potential}*(1-(1-(${v})/${potential})^(1-${grading}))/(1-${grading})`;
    if (!forward) return q;
    const delta = `((${v})-${fc}*${potential})`;
    const knee = logarithmic ? `-${capacitance}*${potential}*log(1-${fc})` :
        `${capacitance}*${potential}*(1-(1-${fc})^(1-${grading}))/(1-${grading})`;
    return knee +
        `+${capacitance}*(1-${fc})^(-${grading})*${delta}` +
        `+${capacitance}*(1-${fc})^(-${grading})*${grading}*${delta}^2/(2*${potential}*(1-${fc}))`;
}
function gateCurrent(v, thermal, reverse) {
    return reverse ? `-IS-IS*(3*${thermal}/exp(1))^3/(${v})^3` : `IS*(exp((${v})/${thermal})-1)`;
}
function statz(p, gs, gd, gsValue, gdValue) {
    const reverse = gsValue < gdValue, drain = reverse ? `((${gd})-(${gs}))` : `((${gs})-(${gd}))`;
    const overdrive = `((${reverse ? gd : gs})-VTO)`;
    if (Math.max(gsValue, gdValue) <= p.VTO) return '0*IS';
    const saturation = Math.abs(gsValue - gdValue) >= 3 / p.ALPHA;
    return `${reverse ? '-' : ''}BETA*${overdrive}^2/(1+B*${overdrive})*(1+LAMBDA*${drain})` +
        (saturation ? '' : `*(1-(1-ALPHA*${drain}/3)^3)`);
}
function entry(label, scope, variables, expressions, actual, units) {
    return {label, scope, variables, expressions, actual, units};
}

function bjtCases() {
    const cases = [];
    for (const record of [npnModel('2N3904'), npnModel('BFR93A'), pnpModel()]) {
        for (const temperature of [300.15, 338.15]) for (const [x, y] of [[-.1, -.4], [.65, -2], [.6, .5]]) {
            const p = temperatureParameters(record.parameters, temperature), data = gummelPoon(p, x, y);
            const f = '(IS*(exp(x/(NF*VT))-1))', r = '(IS*(exp(y/(NR*VT))-1))';
            const early = [Number.isFinite(p.VAF) ? 'y/VAF' : '0', Number.isFinite(p.VAR) ? 'x/VAR' : '0'];
            const injection = [`${f}/IKF`, Number.isFinite(p.IKR) ? `${r}/IKR` : '0'];
            const qb = `((1+sqrt(1+4*(${injection.join('+')})))/(2*(1-${early.join('-')})))`;
            const ibc = `(${r}/BR+ISC*(exp(y/(NC*VT))-1))`;
            const ib = `${f}/BF+ISE*(exp(x/(NE*VT))-1)+${ibc}`;
            const ic = `(${f}-${r})/${qb}-${ibc}`;
            const correction = p.XTF && Number.isFinite(p.ITF) ?
                `(1+XTF*exp(y/(1.44*VTF))*(${f}/(${f}+ITF))^2)` : '1';
            const storage = x > 0 && p.TF ? `TF*${f}*${correction}/${qb}` : '0*CJE*VT';
            const qbe = `(${depletion('x', 'CJE', 'VJE', 'MJE', 'FC', x >= p.FC * p.VJE)})+${storage}`;
            const qbc = `(${depletion('y', 'CJC', 'VJC', 'MJC', 'FC', y >= p.FC * p.VJC)})+TR*${r}`;
            cases.push(entry(`${record.name} ${temperature}K (${x},${y})`, {...p, x, y}, ['x', 'y'],
                {ib, ic, qbe, qbc}, {ib: data.currents[0], ic: data.currents[1], qbe: data.qbe, qbc: data.qbc},
                {ib: 'A', ic: 'A', qbe: 'C', qbc: 'C'}));
        }
    }
    return cases;
}
function jfetCases() {
    const cases = [];
    for (const polarity of [1, -1]) {
        const record = jfetModel(undefined, polarity), p = jfetTemperature(record.parameters, 300.15);
        for (const [gs, gd] of [[-1, -6], [-6, -1], [-6, -8], [-1, -1.1], [.5, -.5]]) {
            const x = polarity * gs, y = polarity * gd, data = jfetJunction(p, x, y, polarity);
            const g = '(polarity*x)', d = '(polarity*y)', reverse = gs < gd;
            const vds = reverse ? `(${d}-${g})` : `(${g}-${d})`, u = `(${reverse ? d : g}-VTO)`;
            const channel = Math.max(gs, gd) <= p.VTO ? '0*IS' :
                `${reverse ? '-' : ''}BETA*(1+LAMBDA*${vds})*` +
                (Math.abs(gs - gd) >= Math.max(gs, gd) - p.VTO ? `${u}^2` : `${vds}*(2*${u}-${vds})`);
            const expressions = {
                channel: `polarity*(${channel})`,
                igs: `polarity*(${gateCurrent(g, 'VT', gs < -3 * p.VT)})`,
                igd: `polarity*(${gateCurrent(d, 'VT', gd < -3 * p.VT)})`,
                qgs: `polarity*(${depletion(g, 'CGS', 'PB', '.5', 'FC', gs >= p.FC * p.PB)})`,
                qgd: `polarity*(${depletion(d, 'CGD', 'PB', '.5', 'FC', gd >= p.FC * p.PB)})`
            };
            cases.push(entry(`${record.name} (${x},${y})`, {...p, x, y, polarity}, ['x', 'y'], expressions, data,
                {channel: 'A', igs: 'A', igd: 'A', qgs: 'C', qgd: 'C'}));
        }
    }
    return cases;
}
function mosfetCases() {
    const cases = [];
    for (const polarity of [1, -1]) {
        const record = mosfetModel(undefined, polarity), p = mosfetTemperature(record.parameters, 300.15, polarity);
        for (const [gs, ds, bs] of [[p.VTO + .7, 3, -.2], [p.VTO + .7, .1, -.2],
            [p.VTO - 1, 2, -.2], [p.VTO + .7, -.1, -.3], [p.VTO + .7, 3, .2]]) {
            const [x, y, z] = [gs, ds, bs].map(value => value * polarity);
            const data = mosfetJunction(p, x, y, z, polarity);
            const g = '(polarity*x)', d = '(polarity*y)', b = '(polarity*z)', bd = `(${b}-${d})`;
            const reverse = ds < 0, drain = reverse ? `(-${d})` : d;
            const gate = reverse ? `(${g}-${d})` : g, body = reverse ? bd : b, bodyValue = reverse ? bs - ds : bs;
            const root = bodyValue <= 0 ? `sqrt(PHI-${body})` :
                Math.sqrt(p.PHI) - bodyValue / (2 * Math.sqrt(p.PHI)) > 0 ? `(sqrt(PHI)-${body}/(2*sqrt(PHI)))` : '0*sqrt(PHI)';
            const threshold = p.VBI + p.GAMMA * (bodyValue <= 0 ? Math.sqrt(p.PHI - bodyValue) :
                Math.max(0, Math.sqrt(p.PHI) - bodyValue / (2 * Math.sqrt(p.PHI))));
            const u = `(${gate}-VBI-GAMMA*${root})`, overdrive = (reverse ? gs - ds : gs) - threshold;
            const channel = overdrive <= 0 ? '0*IS' : `${reverse ? '-' : ''}BETA*(1+LAMBDA*${drain})*` +
                (Math.abs(ds) >= overdrive ? `${u}^2/2` : `${drain}*(${u}-${drain}/2)`);
            const expressions = {
                channel: `polarity*(${channel})`,
                ibs: bs <= -3 * p.VT ? '-polarity*IS' : `polarity*IS*(exp(${b}/VT)-1)`,
                ibd: bs - ds <= -3 * p.VT ? '-polarity*IS' : `polarity*IS*(exp(${bd}/VT)-1)`,
                qbs: `polarity*(${depletion(b, 'CBS', 'PB', 'MJ', 'FC', bs >= p.FC * p.PB)})`,
                qbd: `polarity*(${depletion(bd, 'CBD', 'PB', 'MJ', 'FC', bs - ds >= p.FC * p.PB)})`,
                qg: `polarity*(CGSO*W*${g}+CGDO*W*(${g}-${d})+CGBO*L*(${g}-${b}))`
            };
            cases.push(entry(`${record.name} (${x},${y},${z})`, {...p, x, y, z, polarity}, ['x', 'y', 'z'],
                expressions, {...data, qg: data.charges[0]}, {channel: 'A', ibs: 'A', ibd: 'A', qbs: 'C', qbd: 'C', qg: 'C'}));
        }
    }
    return cases;
}
function statzCases() {
    const cases = [];
    for (const [kind, record] of [['MESFET', mesfetModel()], ['MESFET', mesfetModel('NE760')], ['HEMT', hemtModel()]]) {
        const p = kind === 'HEMT' ? hemtParameters(record.parameters) : mesfetParameters(record.parameters);
        for (const [x, y] of [[-.5, -2.5], [-.5, -.6], [-3, -5], [.5, -.5], [-2.5, -.5]]) {
            const data = kind === 'HEMT' ? hemtJunction(p, x, y) : mesfetJunction(p, x, y);
            const scope = {...p, x, y, smooth: kind === 'HEMT' ? p.DELTA2 : .2,
                limit: kind === 'HEMT' ? Math.min(p.FC * p.PB, p.VMAX) : .5};
            const delta = kind === 'HEMT' ? 'DELTA1' : '(1/ALPHA)';
            const root = `sqrt((x-y)^2+${delta}^2)`, v1 = `((x+y+${root})/2)`, v2 = `((x+y-${root})/2)`;
            const vn = `((${v1}+VTO+sqrt((${v1}-VTO)^2+smooth^2))/2)`;
            const value = ((x + y + Math.hypot(x - y, kind === 'HEMT' ? p.DELTA1 : 1 / p.ALPHA)) / 2 + p.VTO +
                Math.hypot((x + y + Math.hypot(x - y, kind === 'HEMT' ? p.DELTA1 : 1 / p.ALPHA)) / 2 - p.VTO, scope.smooth)) / 2;
            const qgs = value < scope.limit ? `2*CGS*PB*(1-sqrt(1-${vn}/PB))` :
                `CGS*(2*PB*(1-sqrt(1-limit/PB))+(${vn}-limit)/sqrt(1-limit/PB))`;
            const qgd = `CGD*${v2}`;
            const expressions = {channel: statz(p, 'x', 'y', x, y),
                igs: kind === 'HEMT' ? 'IS*(exp(x/(N*VT))-1)' : gateCurrent('x', 'VT', x <= -3 * p.VT),
                igd: kind === 'HEMT' ? 'IS*(exp(y/(N*VT))-1)' : gateCurrent('y', 'VT', y <= -3 * p.VT),
                ...(kind === 'HEMT' ? {qgs, qgd} : {gateCharge: `(${qgs})+${qgd}`})};
            cases.push(entry(`${record.name} (${x},${y})`, scope, ['x', 'y'], expressions, data,
                {channel: 'A', igs: 'A', igd: 'A', qgs: 'C', qgd: 'C', gateCharge: 'C'}));
        }
    }
    return cases;
}
function diodeCases() {
    const cases = [];
    for (const name of ['1N4148', 'SMS7621', 'SMS7630', 'SMV1231-079LF']) {
        const p = diodeTemperature(diodeModel(name).parameters, 300.15);
        const voltages = name === 'SMV1231-079LF' ? [-10, -3, -.5, 0, .1] :
            name === '1N4148' ? [-p.breakdownKnee - .03, -2, -.02, .3, .6] :
            [-p.breakdownKnee - .03, -.2, 0, .1, .25];
        for (const x of voltages) {
            const i = junctionCurrent(p, x), q = depletionCharge(p, x);
            const current = x >= -3 * p.N * p.VT ? 'IS*(exp(x/(N*VT))-1)' : x >= -p.breakdownKnee ?
                '-IS-IS*(3*N*VT/exp(1))^3/x^3' : '-IS*exp(-(knee+x)/(NBV*VT))';
            const charge = depletion('x', 'CJO', 'VJ', 'M', 'FC', x >= p.FC * p.VJ);
            cases.push(entry(`D ${name} (${x})`, {...p, x, knee: p.breakdownKnee}, ['x'], {current, charge},
                {current: [i.current, i.conductance, i.second / 2, i.third / 6],
                    charge: [q.charge, q.capacitance, q.derivative / 2, q.second / 6]}, {current: 'A', charge: 'C'}));
        }
    }
    for (const M of [.9999, 1, 1.0001, 4.999]) for (const x of [-3, .1, .49, .51]) {
        const scope = {CJO: 2e-12, VJ: 1, FC: .5, M, x}, q = depletionCharge(scope, x);
        const charge = depletion('x', 'CJO', 'VJ', 'M', 'FC', x >= scope.FC * scope.VJ, M === 1);
        cases.push(entry(`D grading ${M} (${x})`, scope, ['x'], {charge},
            {charge: [q.charge, q.capacitance, q.derivative / 2, q.second / 6]}, {charge: 'C'}));
    }
    for (const g of [0, 1e-6, .03]) {
        const scope = {CJO: 2e-12, CP: 1e-12, LS: 1e-6, RS: 50, g, x: -.5};
        const ct = diodeTerminalCapacitance({conductance: g, totalCapacitance: scope.CJO}, scope.RS,
            {seriesInductance: scope.LS, parallelCapacitance: scope.CP});
        cases.push(entry(`D package low-frequency charge (${g})`, scope, ['x'],
            {charge: '(CJO/(1+RS*g)^2+CP-LS*(g/(1+RS*g))^2)*x'},
            {charge: [ct * scope.x, ct, 0, 0]}, {charge: 'C'}));
    }
    const legacy = diode1N4148({fList: [1e9]}).diode.parameters;
    const vt = legacy.n * BOLTZMANN * legacy.temperatureK / ELEMENTARY_CHARGE;
    for (const x of [-102, -20, 0, .6, 81 * vt]) {
        const data = legacyJunction(legacy, x), forward = x / vt < 80 ? 'x/vt' : '80';
        const avalanche = x < -legacy.breakdownVoltage ? '-breakdownCurrent*(exp((-x-breakdownVoltage)/breakdownSoftness)-1)' : '0*is';
        cases.push(entry(`legacy diode (${x})`, {...legacy, x, vt}, ['x'],
            {current: `is*(exp(${forward})-1)+x/leakageResistance+${avalanche}`},
            {current: [data.current, data.conductance, data.second / 2, data.third / 6]}, {current: 'A'}));
    }
    return cases;
}

export function semiconductorCases() {
    return [...bjtCases(), ...jfetCases(), ...mosfetCases(), ...statzCases(), ...diodeCases()];
}
export function taylorCases() {
    const cases = [];
    for (const [name, engine, variables] of [['two-control', taylor, ['x', 'y']], ['three-control', deviceTaylor, ['x', 'y', 'z']]]) {
        for (const x of [0, .4]) for (const exponent of [0, 1, 2, 3, -1, .5]) {
            if (x === 0 && (exponent === -1 || exponent === .5)) continue; // Singular/nondifferentiable domains.
            const coefficients = engine.power(engine.variable(x, 0), exponent);
            cases.push(entry(`${name} x^${exponent} at ${x}`, {x, y: .2, z: .3}, variables,
                {power: `x^${exponent}`}, {power: coefficients}, {power: ''}));
        }
        const [x, y, z] = [.4, -.2, .3], a = engine.variable(x, 0), b = engine.variable(y, 1);
        const c = variables.length === 3 ? engine.variable(z, 2) : engine.constant(z);
        const polynomial = engine.add(engine.multiply(engine.multiply(a, a), b), engine.multiply(engine.multiply(a, b), c));
        const value = engine.exponential(engine.scale(engine.power(engine.add(engine.constant(2), polynomial), -.5), .3));
        cases.push(entry(`${name} mixed exp/reciprocal/square-root`, {x, y, z}, variables,
            {mixed: variables.length === 3 ? 'exp(.3*(2+x^2*y+x*y*z)^(-.5))' : 'exp(.3*(2+x^2*y+.3*x*y)^(-.5))'},
            {mixed: value}, {mixed: ''}));
    }
    return cases;
}
