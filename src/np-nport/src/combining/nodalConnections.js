// Modified: 2026-11-24
// Normalize once, before nodal builds Gamma and the frequency-dependent W matrices.
import {validateDcNode} from '../dcModel';

function connectionRow(row) {
    if (!Array.isArray(row) || row.length < 2 || row[0] === 'out' ||
        !row[0] || !Array.isArray(row[0].spars)) {
        throw new TypeError('nodal() needs component rows [nPort, node, ...]; shape groups contain only component rows.');
    }
    return row.slice();
}

function validateConnectionLabels(connections) {
    const labels = new Map();
    connections.forEach((row, rowIndex) => {
        for (const node of row.slice(1)) {
            validateDcNode(node);
            const entry = labels.get(node) || {count: 0, outputs: 0};
            entry.count++;
            if (rowIndex === connections.length - 1) entry.outputs++;
            labels.set(node, entry);
        }
    });
    for (const [node, entry] of labels) {
        const label = JSON.stringify(node);
        if (entry.count !== 2) {
            throw new RangeError('nodal() label ' + label + ' appears ' + entry.count +
                ' times; each label must appear exactly twice. Use an explicit Tee(), Tee4() or Tee5() for branches.');
        }
        if (entry.outputs > 1) {
            throw new RangeError('nodal() output label ' + label + ' must connect one component terminal to one output port.');
        }
    }
}

export function nodalConnections(input) {
    const args = input.slice(), connections = [], groups = [];
    let signalOptions;
    if (args.length > 1 && !Array.isArray(args.at(-1)) &&
        Array.isArray(args.at(-2)) && args.at(-2)[0] === 'out') signalOptions = args.pop();
    const output = args.pop();
    if (!Array.isArray(output) || output[0] !== 'out' || output.length < 2) {
        throw new TypeError('nodal() needs a final ["out", node, ...] row, optionally followed by signal options.');
    }
    for (const argument of args) {
        if (Array.isArray(argument)) {
            connections.push(connectionRow(argument));
            continue;
        }
        if (!argument || typeof argument !== 'object' || !Object.keys(argument).length) {
            throw new TypeError('nodal() shape groups must be nonempty objects containing arrays of component rows.');
        }
        for (const [name, rows] of Object.entries(argument)) {
            if (!name.trim() || !Array.isArray(rows) || !rows.length) {
                throw new TypeError('nodal() shape groups need a name and a nonempty array of component rows.');
            }
            const components = [];
            for (const row of rows) {
                components.push(connections.length);
                connections.push(connectionRow(row));
            }
            groups.push({name, components});
        }
    }
    if (!connections.length) throw new TypeError('nodal() requires at least one component row.');
    connections.push(output.slice());
    validateConnectionLabels(connections);
    return {connections, groups, signalOptions};
}
