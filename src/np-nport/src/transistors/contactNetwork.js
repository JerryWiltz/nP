// Modified: 2026-11-20
import {solveDcLinearSystem} from '../dcLinearSystem';

export function validateTerminalNetwork(network, count) {
    const node = value => Number.isInteger(value) && value >= 0 && value < network.nodeCount;
    if (!network || !Number.isInteger(network.nodeCount) || network.nodeCount < count ||
        !Array.isArray(network.ports) || network.ports.length !== count ||
        !Array.isArray(network.intrinsic) || network.intrinsic.length !== count ||
        !network.ports.every(node) || !network.intrinsic.every(node) ||
        new Set(network.ports).size !== count || new Set(network.intrinsic).size !== count) {
        throw new TypeError('Invalid nonlinear-device terminal network.');
    }
    for (const kind of ['resistors', 'inductors', 'capacitors']) {
        if (!Array.isArray(network[kind]) || network[kind].some(row => !Array.isArray(row) || row.length !== 3 ||
            !node(row[0]) || !node(row[1]) || !Number.isFinite(row[2]) || row[2] < 0)) throw new TypeError('Invalid terminal-network ' + kind + '.');
    }
    if (!Array.isArray(network.joins) || network.joins.some(row => row.length < 2 || !row.every(node))) throw new TypeError('Invalid terminal-network joins.');
    if ((network.seriesRC || []).some(row => !Array.isArray(row) || ![4, 5].includes(row.length) || !node(row[0]) || !node(row[1]) ||
        !Number.isFinite(row[2]) || row[2] <= 0 || !Number.isFinite(row[3]) || row[3] <= 0 || row.length === 5 && typeof row[4] !== 'boolean')) {
        throw new TypeError('Invalid terminal-network series RC.');
    }
    return network;
}
function root(parents, node) { while (parents[node] !== node) node = parents[node]; return node; }
function join(parents, a, b) { parents[root(parents, a)] = root(parents, b); }
function add(row, index, value) { if (index !== undefined) row.set(index, (row.get(index) || 0) + value); }

// Exact DC reduction for fixed-Q voltage control: L short, C open. Grounding
// intrinsic nodes here is only a resistance measurement; network DC retains
// the full floating contact graph. Reject cross-terminal DC coupling rather
// than approximating a general package by three independent resistances.
export function terminalContactResistances(network) {
    validateTerminalNetwork(network, network.ports.length);
    const parents = Array.from({length: network.nodeCount}, (_, i) => i);
    for (const row of network.joins) for (const node of row.slice(1)) join(parents, row[0], node);
    for (const [a, b] of network.inductors) join(parents, a, b);
    for (const [a, b, resistance] of network.resistors) if (resistance === 0) join(parents, a, b);
    const intrinsic = network.intrinsic.map(node => root(parents, node)), ports = network.ports.map(node => root(parents, node));
    if (new Set(intrinsic).size !== intrinsic.length) throw new RangeError('Contact network shorts intrinsic terminals.');
    const connected = parents.map((_, node) => root(parents, node));
    for (const [a, b] of network.resistors) join(connected, a, b);
    if (new Set(intrinsic.map(node => root(connected, node))).size !== intrinsic.length ||
        ports.some((node, port) => root(connected, node) !== root(connected, intrinsic[port]))) {
        throw new RangeError('Fixed-Q contact network needs separate connected paths for each terminal.');
    }
    const indices = new Map();
    parents.forEach((_, node) => { const group = root(parents, node); if (!intrinsic.includes(group) && !indices.has(group)) indices.set(group, indices.size); });
    const rows = Array.from(indices, () => ({terms: new Map(), value: 0, kind: 'kcl'}));
    for (const [a, b, resistance] of network.resistors) {
        if (resistance === 0) continue;
        const i = indices.get(root(parents, a)), j = indices.get(root(parents, b)), g = 1 / resistance;
        if (i !== undefined) { add(rows[i].terms, i, g); add(rows[i].terms, j, -g); }
        if (j !== undefined) { add(rows[j].terms, j, g); add(rows[j].terms, i, -g); }
    }
    return ports.map((port, currentPort) => {
        const equations = rows.map(row => ({...row, value: 0})), index = indices.get(port);
        if (index !== undefined) equations[index].value = 1;
        const solution = solveDcLinearSystem(equations, rows.length);
        if (solution.nullSpace.length) throw new RangeError('Contact network has an undefined DC contact voltage.');
        const voltages = ports.map(node => indices.has(node) ? solution.values[indices.get(node)] : 0);
        if (voltages.some((voltage, i) => i !== currentPort && Math.abs(voltage) > 1e-12)) throw new RangeError('Fixed-Q contact network couples external terminals; a multi-terminal bias adapter is required.');
        return voltages[currentPort];
    });
}
