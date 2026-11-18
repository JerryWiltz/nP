// Modified: 2026-11-17
import {temperatureParameters, gummelPoon} from './transistors/bjt/gummelPoon';
import {solveDcLinearSystem, dcLinearError} from './dcLinearSystem';

export function bjtDcDevice(model, nodes, path) {
    const d = model.definition;
    return {path, nodes, p: temperatureParameters(d.record.parameters, d.temperature), polarity: d.polarity};
}
function add(terms, index, value) {
    if (index !== null && value) terms.set(index, (terms.get(index) || 0) + value);
}
function value(values, node) { return node === null ? 0 : values[node]; }
function intrinsic(device, values) {
    const [b, c, e] = device.nodes;
    return [value(values, b) - value(values, e), value(values, b) - value(values, c)];
}
function evaluate(device, values) {
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
function estimate(assembly) {
    if (assembly.constraints.every(row => !row.source || row.value === 0)) return {
        values: Array(assembly.variables.length).fill(0),
        report: {method: 'zero-source', status: 'used', assumptions: []}
    };
    const regions = assembly.devices.map(() => 'forward'), attempted = new Set();
    const base = baseEquations(assembly), indices = rowIndex(assembly), size = assembly.variables.length;
    for (let attempt = 0; attempt < 8; attempt++) {
        const signature = regions.join(',');
        if (attempted.has(signature)) break;
        attempted.add(signature);
        const rows = base.map(row => ({...row, terms: new Map(row.terms)}));
        let count = size;
        assembly.devices.forEach((device, index) => {
            if (regions[index] === 'off') return;
            const branches = [{voltage: 0.7, pair: [0, 2], ratios: [1, device.p.BF, -1 - device.p.BF]}];
            if (regions[index] === 'saturation') branches.push({voltage: 0.55, pair: [0, 1], ratios: [1, -1 - device.p.BR, device.p.BR]});
            for (const branch of branches) {
                const current = count++, terms = new Map();
                device.nodes.forEach((node, port) => add(rows[indices.get(node)].terms, current, branch.ratios[port]));
                add(terms, device.nodes[branch.pair[0]], 1); add(terms, device.nodes[branch.pair[1]], -1);
                rows.push({terms, value: device.polarity * branch.voltage, kind: 'constraint'});
            }
        });
        try {
            const solution = solveDcLinearSystem(rows, count), values = solution.values.slice(0, size);
            let currentIndex = size, changed = false;
            assembly.devices.forEach((device, index) => {
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
            if (!changed) return {values, report: {method: 'piecewise-bjt', status: 'used',
                assumptions: assembly.devices.map((device, index) => ({path: device.path, region: regions[index],
                    forwardVoltage: 0.7, reverseVoltage: 0.55, beta: device.p.BF}))}};
        } catch (error) {
            if (!['DC_INCONSISTENT', 'DC_NUMERICAL_FAILURE'].includes(error.code)) throw error;
            break;
        }
    }
    const solution = solveDcLinearSystem(base, size);
    return {values: solution.values, report: {method: 'open-device', status: 'fallback',
        reason: 'A consistent piecewise transistor estimate was unavailable; try the open-device linear state.'}};
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
    solution.nullSpace = solution.nullSpace.map(direction => {
        const remaining = direction.slice(), exact = Array(direction.length).fill(0);
        for (const nodes of groups.values()) {
            const common = direction[nodes[0]];
            for (const node of nodes) { remaining[node] -= common; exact[node] = common; }
        }
        return Math.max(...remaining.map(Math.abs)) <= 32 * solution.tolerance ? exact : direction;
    });
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
        if (scale < 1) throw dcLinearError('DC_NONCONVERGENCE', 'DC transistor bias did not converge at the original source values.');
    }
    const checked = residual(assembly, result.solution.values);
    if (!Number.isFinite(checked.norm) || checked.norm > 1) throw dcLinearError('DC_NONCONVERGENCE', 'DC nonlinear residual checks failed.');
    cleanGaugeModes(assembly, result.solution);
    return {...result, initialEstimate: initial.report, convergence: {method: 'damped-newton', history,
        sourceStepping: history.some(entry => entry.sourceScale !== 1), iterations: history.reduce((sum, entry) => sum + entry.iterations, 0)}};
}
