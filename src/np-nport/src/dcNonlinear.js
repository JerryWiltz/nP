// Modified: 2026-11-25
import {temperatureParameters, gummelPoon} from './transistors/bjt/gummelPoon';
import {solveDcLinearSystem, dcLinearError} from './dcLinearSystem';
import {diodeDcCurrent} from './diodes/diodeDc';
import {mosfetJunction} from './transistors/fet/mosfetEquations';
import {hemtJunction} from './transistors/fet/hemtEquations';
import {mesfetJunction} from './transistors/fet/mesfetEquations';
import {jfetJunction} from './transistors/fet/jfetEquations';

export function bjtDcDevice(model, nodes, path) {
    const d = model.definition;
    return {kind: 'bjt', path, nodes, p: temperatureParameters(d.record.parameters, d.temperature), polarity: d.polarity};
}
function add(terms, index, value) {
    if (index !== null && value) terms.set(index, (terms.get(index) || 0) + value);
}
function value(values, node) { return node === null ? 0 : values[node]; }
function intrinsic(device, values) {
    if (device.controls) return device.controls.map(([a, b]) => value(values, device.nodes[a]) - value(values, device.nodes[b]));
    if (device.nodes.length === 2) return [value(values, device.nodes[0]) - value(values, device.nodes[1])];
    const [b, c, e] = device.nodes;
    return [value(values, b) - value(values, e), value(values, b) - value(values, c)];
}
function evaluate(device, values) {
    if (device.kind === 'mosfet') {
        try {
            return mosfetJunction(device.p, ...intrinsic(device, values), device.polarity).currents.map(row =>
                ({current: row[0], derivatives: [row[1], row[2], -row[1] - row[2] - row[3], row[3]]}));
        } catch (error) { if (error instanceof RangeError) return null; throw error; }
    }
    if (device.nodes.length === 2) {
        const data = diodeDcCurrent(device, intrinsic(device, values)[0]);
        if (![data.current, data.conductance].every(Number.isFinite)) return null;
        return [{current: data.current, derivatives: [data.conductance, -data.conductance]},
            {current: -data.current, derivatives: [-data.conductance, data.conductance]}];
    }
    if (['jfet', 'mesfet', 'hemt'].includes(device.kind)) {
        try {
            const equations = device.kind === 'hemt' ? hemtJunction : device.kind === 'mesfet' ? mesfetJunction : jfetJunction;
            return equations(device.p, ...intrinsic(device, values), device.polarity).currents
                .map(row => ({current: row[0], derivatives: [row[1] + row[2], -row[2], -row[1]]}));
        } catch (error) { if (error instanceof RangeError) return null; throw error; }
    }
    const [be, bc] = intrinsic(device, values), s = device.polarity;
    const data = gummelPoon(device.p, s * be, s * bc, false);
    if (data.qb <= 0 || data.currents.some(row => row.slice(0, 3).some(term => !Number.isFinite(term)))) return null;
    return data.currents.map(row => ({current: s * row[0], derivatives: [row[1] + row[2], -row[2], -row[1]]}));
}
function baseEquations(assembly, sourceScale = 1) {
    return [...assembly.kcl.values()].map(terms => ({terms: new Map(terms), value: 0, kind: 'kcl'}))
        .concat(assembly.constraints.map(row => ({...row, value: row.source ? row.value * sourceScale : row.value})));
}
function rowIndex(assembly) { return new Map([...assembly.kcl.keys()].map((node, index) => [node, index])); }
function linearization(assembly, values, sourceScale) {
    const rows = baseEquations(assembly, sourceScale), indices = rowIndex(assembly);
    for (const device of assembly.devices) {
        const currents = evaluate(device, values);
        if (!currents) return null;
        currents.forEach((entry, terminal) => {
            const row = rows[indices.get(device.nodes[terminal])];
            let offset = -entry.current;
            device.nodes.forEach((node, port) => {
                add(row.terms, node, entry.derivatives[port]);
                offset += entry.derivatives[port] * value(values, node);
            });
            row.value += offset;
        });
    }
    return rows;
}
function residual(assembly, values, sourceScale = 1) {
    const rows = baseEquations(assembly, sourceScale), indices = rowIndex(assembly);
    const currents = rows.map(() => 0), scales = rows.map(() => 0);
    for (const device of assembly.devices) {
        const data = evaluate(device, values);
        if (!data) return {norm: Infinity};
        data.forEach((entry, port) => {
            const index = indices.get(device.nodes[port]);
            currents[index] += entry.current; scales[index] += Math.abs(entry.current);
        });
    }
    let norm = 0, maxKclAmps = 0, maxVoltageResidual = 0, maxScaledResidual = 0;
    rows.forEach((row, index) => {
        let sum = currents[index] - row.value, scale = scales[index] + Math.abs(row.value);
        for (const [column, coefficient] of row.terms) {
            const term = coefficient * values[column]; sum += term; scale += Math.abs(term);
        }
        const error = Math.abs(sum), tolerance = (row.kind === 'kcl' ? 1e-12 : 1e-9) + 1e-9 * scale;
        norm = Math.max(norm, error / tolerance);
        maxScaledResidual = Math.max(maxScaledResidual, error / ((row.kind === 'kcl' ? 1e-12 : 1e-9) + scale));
        if (row.kind === 'kcl') maxKclAmps = Math.max(maxKclAmps, error);
        else maxVoltageResidual = Math.max(maxVoltageResidual, error);
    });
    return {norm, maxKclAmps, maxVoltageResidual, maxScaledResidual};
}
function fetEstimateConductance(device) {
    const u = Math.max(0, -device.p.VTO);
    return ['mesfet', 'hemt'].includes(device.kind) ? device.p.ALPHA * device.p.BETA * u * u / (1 + device.p.B * u) : 2 * device.p.BETA * u;
}
function estimate(assembly) {
    if (assembly.constraints.every(row => !row.source || row.value === 0)) return {
        values: Array(assembly.variables.length).fill(0),
        report: {method: 'zero-source', status: 'used', assumptions: []}
    };
    const regions = assembly.devices.map(device => ['jfet', 'mesfet', 'hemt'].includes(device.kind) ? 'ohmic' : device.kind === 'mosfet' ? 'cutoff' : 'forward'), attempted = new Set();
    const base = baseEquations(assembly), indices = rowIndex(assembly), size = assembly.variables.length;
    for (let attempt = 0; attempt < 8; attempt++) {
        const signature = regions.join(',');
        if (attempted.has(signature)) break;
        attempted.add(signature);
        const rows = base.map(row => ({...row, terms: new Map(row.terms)}));
        let count = size;
        assembly.devices.forEach((device, index) => {
            if (device.kind === 'mosfet') return;
            if (['jfet', 'mesfet', 'hemt'].includes(device.kind)) {
                const conductance = fetEstimateConductance(device);
                for (const [terminal, sign] of [[1, 1], [2, -1]]) {
                    add(rows[indices.get(device.nodes[terminal])].terms, device.nodes[1], sign * conductance);
                    add(rows[indices.get(device.nodes[terminal])].terms, device.nodes[2], -sign * conductance);
                }
                return;
            }
            if (regions[index] === 'off') return;
            const branches = device.kind === 'bjt' ? [{voltage: 0.7, pair: [0, 2], ratios: [1, device.p.BF, -1 - device.p.BF]}] :
                [{voltage: regions[index] === 'breakdown' ? -device.breakdownVoltage : 0.7, pair: [0, 1], ratios: [1, -1]}];
            if (device.kind === 'bjt' && regions[index] === 'saturation') branches.push({voltage: 0.55, pair: [0, 1], ratios: [1, -1 - device.p.BR, device.p.BR]});
            for (const branch of branches) {
                const current = count++, terms = new Map();
                device.nodes.forEach((node, port) => add(rows[indices.get(node)].terms, current, branch.ratios[port]));
                add(terms, device.nodes[branch.pair[0]], 1); add(terms, device.nodes[branch.pair[1]], -1);
                rows.push({terms, value: (device.polarity || 1) * branch.voltage, kind: 'constraint'});
            }
        });
        try {
            const solution = solveDcLinearSystem(rows, count), values = solution.values.slice(0, size);
            let currentIndex = size, changed = false;
            assembly.devices.forEach((device, index) => {
                if (['jfet', 'mesfet', 'hemt', 'mosfet'].includes(device.kind)) return;
                if (device.nodes.length === 2) {
                    const voltage = intrinsic(device, values)[0], previous = regions[index];
                    let next = previous;
                    if (previous === 'off') {
                        if (voltage > 0.7) next = 'forward';
                        else if (voltage < -device.breakdownVoltage) next = 'breakdown';
                    } else {
                        const current = solution.values[currentIndex++];
                        if (previous === 'forward' && current < -1e-12 || previous === 'breakdown' && current > 1e-12) next = 'off';
                    }
                    if (next !== previous) { regions[index] = next; changed = true; }
                    return;
                }
                const [be, bc] = intrinsic(device, values), s = device.polarity;
                let next = regions[index];
                if (next === 'off') { if (s * be > 0.7) next = 'forward'; }
                else {
                    const forward = s * solution.values[currentIndex++];
                    const reverse = next === 'saturation' ? s * solution.values[currentIndex++] : 0;
                    if (forward < -1e-12) next = 'off';
                    else if (next === 'forward' && s * (be - bc) < 0.15) next = 'saturation';
                    else if (next === 'saturation' && reverse < -1e-12) next = 'forward';
                }
                if (next !== regions[index]) { regions[index] = next; changed = true; }
            });
            if (!changed) return {values, report: {method: assembly.devices.every(device => device.kind === 'bjt') ? 'piecewise-bjt' :
                assembly.devices.every(device => device.nodes.length === 2) ? 'piecewise-diode' :
                assembly.devices.every(device => device.kind === 'jfet') ? 'piecewise-jfet' :
                assembly.devices.every(device => device.kind === 'mesfet') ? 'piecewise-mesfet' :
                assembly.devices.every(device => device.kind === 'hemt') ? 'piecewise-hemt' :
                assembly.devices.every(device => device.kind === 'mosfet') ? 'piecewise-mosfet' : 'piecewise-devices', status: 'used',
                assumptions: assembly.devices.map((device, index) => ({path: device.path, region: regions[index],
                    ...(device.kind === 'mosfet' ? {gateCurrent: 0, channelCurrent: 0, bodyJunctions: 'open estimate'} : ['jfet', 'mesfet', 'hemt'].includes(device.kind) ? {gateVoltage: 0, channelConductance: fetEstimateConductance(device)} :
                        {forwardVoltage: 0.7, ...(device.kind === 'bjt' ? {reverseVoltage: 0.55, beta: device.p.BF} :
                            {breakdownVoltage: device.breakdownVoltage})})}))}};
        } catch (error) {
            if (!['DC_INCONSISTENT', 'DC_NUMERICAL_FAILURE'].includes(error.code)) throw error;
            break;
        }
    }
    const solution = solveDcLinearSystem(base, size);
    return {values: solution.values, report: {method: 'open-device', status: 'fallback',
        reason: 'A consistent piecewise device estimate was unavailable; try the open-device linear state.'}};
}
function failedNewton(history, sourceScale, iterations, reason) {
    history.push({sourceScale, iterations, status: 'failed', reason});
    return null;
}
function newton(assembly, initial, sourceScale, history) {
    let values = initial.slice();
    for (let iteration = 0; iteration < 120; iteration++) {
        const error = residual(assembly, values, sourceScale), rows = linearization(assembly, values, sourceScale);
        if (!rows) return failedNewton(history, sourceScale, iteration, 'model-domain');
        let solution;
        try { solution = solveDcLinearSystem(rows, assembly.variables.length); }
        catch (failure) {
            if (['DC_INCONSISTENT', 'DC_NUMERICAL_FAILURE'].includes(failure.code)) return failedNewton(history, sourceScale, iteration, failure.code);
            throw failure;
        }
        const delta = solution.values.map((entry, index) => entry - values[index]);
        const junctionCorrection = Math.max(0, ...assembly.devices.flatMap(device => intrinsic(device, delta).map(Math.abs)));
        if (error.norm <= 1 && junctionCorrection <= 1e-8) {
            // The affine solution supplies rank/null-space information at the
            // converged state; reported values must remain the accepted state.
            solution.values = values;
            history.push({sourceScale, iterations: iteration, status: 'converged', residual: error.norm, junctionCorrection});
            return {solution, residuals: error};
        }
        let step = 1;
        for (const device of assembly.devices) {
            const changes = intrinsic(device, delta);
            step = Math.min(step, 0.12 / Math.max(0.12, ...changes.map(Math.abs)));
        }
        let accepted = false;
        for (; step >= 1e-7; step /= 2) {
            const candidate = values.map((entry, index) => entry + step * delta[index]);
            const next = residual(assembly, candidate, sourceScale);
            if (Number.isFinite(next.norm) && (next.norm < error.norm * (1 - 1e-4 * step) || next.norm <= 1)) {
                values = candidate; accepted = true; break;
            }
        }
        if (!accepted) return failedNewton(history, sourceScale, iteration + 1, 'no-descent-step');
    }
    return failedNewton(history, sourceScale, 120, 'iteration-limit');
}
// Canonicalize genuine common-mode gauges. Elimination roundoff can leave tiny
// current entries in a floating voltage mode, falsely marking physical currents
// nonunique. Explicit topology proves which translations leave all laws intact.
function cleanGaugeModes(assembly, solution) {
    const ground = -1, parents = new Map([[ground, ground]]);
    for (const node of assembly.kcl.keys()) parents.set(node, node);
    for (const row of assembly.constraints) {
        const voltages = [...row.terms].filter(([index]) => assembly.variables[index] === 'voltage');
        if (!voltages.length) continue;
        for (const [node] of voltages) joinGauge(parents, voltages[0][0], node);
        const sum = voltages.reduce((total, [, coefficient]) => total + coefficient, 0);
        const scale = voltages.reduce((total, [, coefficient]) => total + Math.abs(coefficient), 0);
        if (Math.abs(sum) > Number.EPSILON * 16 * scale) joinGauge(parents, ground, voltages[0][0]);
    }
    for (const device of assembly.devices) for (const node of device.nodes) joinGauge(parents, device.nodes[0], node);
    const groups = new Map(), reference = gaugeRoot(parents, ground);
    for (const node of assembly.kcl.keys()) {
        const root = gaugeRoot(parents, node);
        if (root === reference) continue;
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root).push(node);
    }
    if (!groups.size) return;
    const floating = [...groups.values()], numeric = solution.nullSpace;
    // The topology proves these exact translation modes, even when very weak
    // gate junctions make elimination's voltage entries differ by roundoff.
    // Retain independent nongauge modes by solving for combinations with zero
    // group-reference voltages; never enlarge a numerical cleanup threshold.
    const constraints = Array.from({length: numeric.length}, (_, row) => ({kind: 'constraint', value: 0,
        terms: new Map(row < floating.length ? numeric.map((direction, index) => [index, direction[floating[row][0]]]) : [])}));
    const combinations = solveDcLinearSystem(constraints, numeric.length);
    if (combinations.rank !== floating.length) throw dcLinearError('DC_NUMERICAL_FAILURE', 'DC null space does not preserve the topology-defined voltage gauges.');
    const remaining = combinations.nullSpace.map(coefficients => Array.from({length: assembly.variables.length}, (_, column) =>
        coefficients.reduce((sum, coefficient, index) => sum + coefficient * numeric[index][column], 0)));
    const exact = floating.map(nodes => {
        const direction = Array(assembly.variables.length).fill(0);
        for (const node of nodes) direction[node] = 1;
        return direction;
    });
    solution.nullSpace = exact.concat(remaining);
}
function gaugeRoot(parents, node) {
    while (parents.get(node) !== node) node = parents.get(node);
    return node;
}
function joinGauge(parents, a, b) { parents.set(gaugeRoot(parents, a), gaugeRoot(parents, b)); }

export function solveDcNonlinear(assembly) {
    const history = [], initial = estimate(assembly);
    let result = newton(assembly, initial.values, 1, history);
    if (!result) {
        // Source stepping is a reported continuation only. Final acceptance
        // always checks the original full-strength sources and original model.
        const zeroRows = baseEquations(assembly, 0);
        let values = solveDcLinearSystem(zeroRows, assembly.variables.length).values;
        const zero = newton(assembly, values, 0, history);
        if (!zero) throw dcLinearError('DC_NONCONVERGENCE', 'DC nonlinear solve could not establish a zero-source starting state.');
        values = zero.solution.values;
        let scale = 0, increment = 0.1;
        while (scale < 1) {
            const next = Math.min(1, scale + increment), trial = newton(assembly, values, next, history);
            if (trial) { scale = next; values = trial.solution.values; result = trial; increment = Math.min(0.25, increment * 1.5); }
            else { increment /= 2; if (increment < 1e-5) break; }
        }
        if (scale < 1) throw dcLinearError('DC_NONCONVERGENCE', 'DC device bias did not converge at the original source values.');
    }
    const checked = residual(assembly, result.solution.values);
    if (!Number.isFinite(checked.norm) || checked.norm > 1) throw dcLinearError('DC_NONCONVERGENCE', 'DC nonlinear residual checks failed.');
    cleanGaugeModes(assembly, result.solution);
    return {...result, initialEstimate: initial.report, convergence: {method: 'damped-newton', history,
        sourceStepping: history.some(entry => entry.sourceScale !== 1), iterations: history.reduce((sum, entry) => sum + entry.iterations, 0)}};
}

// Second-order DC forcing acts on the first-order Jacobian at RF-off bias.
// Independent DC supplies have zero increments; generated junction currents
// enter at intrinsic device nodes, so contact drops and shared bias are solved.
export function solveDcIncrement(assembly, values, sources) {
    const rows = linearization(assembly, values, 1), indices = rowIndex(assembly);
    if (!rows) throw dcLinearError('DC_NUMERICAL_FAILURE', 'Cannot linearize the DC operating point.');
    for (const row of rows) row.value = 0;
    for (const source of sources) {
        const device = assembly.devices.find(entry => entry.path === source.path);
        if (!device || device.nodes.length !== 2 || !Number.isFinite(source.currentAmps)) {
            throw new TypeError('DC increment needs a finite two-terminal junction current at a known placement.');
        }
        rows[indices.get(device.nodes[0])].value -= source.currentAmps;
        rows[indices.get(device.nodes[1])].value += source.currentAmps;
    }
    const solution = solveDcLinearSystem(rows, assembly.variables.length);
    cleanGaugeModes(assembly, solution);
    return solution;
}
