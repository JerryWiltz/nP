// Modified: 2026-11-26
import {dcResultSnapshot, validateDcNode} from './dcModel';
import {dcLinearValue} from './dcLinearSystem';
import {outputTable, unitColumn} from '../../np-global/src/outputUnits';

const contexts = new WeakMap();
const pointFields = {
    ib: 'current', ic: 'current', ie: 'current', ig: 'current', id: 'current', is: 'current', bodyCurrent: 'current',
    vb: 'voltage', vc: 'voltage', ve: 'voltage', va: 'voltage', vk: 'voltage', vg: 'voltage', vd: 'voltage', vs: 'voltage',
    vbe: 'voltage', vce: 'voltage', vcb: 'voltage', vgs: 'voltage', vds: 'voltage', vbs: 'voltage',
    intrinsicVbe: 'voltage', intrinsicVbc: 'voltage', intrinsicVgs: 'voltage', intrinsicVgd: 'voltage',
    intrinsicVds: 'voltage', intrinsicVbs: 'voltage', junctionVoltage: 'voltage', junctionCurrent: 'current',
    temperature: 'temperature', bulkResistance: 'resistance'
};
const units = {
    voltage: {V: 1, mV: 1e3, uV: 1e6}, current: {A: 1, mA: 1e3, uA: 1e6},
    resistance: {ohm: 1, kohm: 1e-3}, temperature: {K: 1}
};

function baseMeasurement(name) {
    if (name === 'voltage') return {kind: 'node', dimension: 'voltage', title: name};
    if (Object.hasOwn(pointFields, name)) return {kind: 'point', field: name, dimension: pointFields[name], title: name};
    let match = /^i([1-9]\d*)$/.exec(name);
    if (match) return {kind: 'current', ports: [Number(match[1])], dimension: 'current', title: name};
    match = /^v([1-9])([1-9])$/.exec(name) || /^v\(([1-9]\d*),([1-9]\d*)\)$/.exec(name);
    if (match) return {kind: 'voltage', ports: [Number(match[1]), Number(match[2])], dimension: 'voltage', title: name};
    match = /^v([1-9])$/.exec(name) || /^v\(([1-9]\d*)\)$/.exec(name);
    if (match) return {kind: 'voltage', ports: [Number(match[1])], dimension: 'voltage', title: name};
    return null;
}

function measurement(selector) {
    if (typeof selector !== 'string') throw new TypeError('dc.out() selectors must be strings.');
    let selected = baseMeasurement(selector), unit;
    if (!selected) for (const suffix of ['kohm', 'ohm', 'mV', 'uV', 'V', 'mA', 'uA', 'A', 'K']) {
        if (!selector.endsWith(suffix)) continue;
        selected = baseMeasurement(selector.slice(0, -suffix.length));
        if (selected) { unit = suffix; break; }
    }
    if (!selected) throw new RangeError('Unknown dc.out() selector: ' + selector + '.');
    unit = unit || Object.keys(units[selected.dimension])[0];
    if (!Object.hasOwn(units[selected.dimension], unit)) throw new RangeError('dc.out() selector ' + selector + ' has incompatible units.');
    return {...selected, unit, scale: units[selected.dimension][unit], heading: selected.title + ' (' +
        unit.replace('u', 'µ').replace('kohm', 'kΩ').replace('ohm', 'Ω') + ')'};
}

function optionsFor(selectors) {
    const options = selectors.length && typeof selectors.at(-1) === 'object' ? selectors.pop() : {};
    if (!options || Array.isArray(options) || Object.keys(options).some(key => !['component', 'node', 'nodes', 'path', 'label', 'units'].includes(key))) {
        throw new TypeError('dc.out() options are component, node/nodes, path, label and units.');
    }
    if (options.label !== undefined && (typeof options.label !== 'string' || !options.label.trim())) throw new TypeError('dc.out() label must be a nonempty string.');
    if (options.path !== undefined && typeof options.path !== 'string') throw new TypeError('dc.out() node path must be a string.');
    if (!selectors.length) throw new TypeError('dc.out() needs measurement selectors, such as v12 or i1mA.');
    return options;
}

function selectedComponents(result, context, options, columns) {
    if (options.node !== undefined || options.nodes !== undefined || options.path !== undefined) throw new TypeError('dc.out() node options require the voltage selector.');
    if (options.component === undefined) {
        const records = columns.some(column => column.kind === 'point') ? result.components.filter(record => record.qPoint) : result.components;
        if (!records.length) throw new RangeError('dc.out() has no components with the requested operating-point data.');
        return records;
    }
    let records;
    if (typeof options.component === 'string') records = result.components.filter(record => record.path === options.component);
    else if (options.component && typeof options.component === 'object' && options.component._dcModel) {
        const paths = context.assembly.components.filter(part => part.model === options.component._dcModel).map(part => part.path);
        records = result.components.filter(record => paths.includes(record.path));
    } else throw new TypeError('dc.out() component must be an original component object or a placement path string.');
    if (!records.length) throw new RangeError('dc.out() component was not found in this DC result.');
    if (records.length > 1) throw new RangeError('dc.out() component is reused at ' + records.map(record => record.path).join(', ') + '; select a placement path.');
    return records;
}

function voltageValue(context, indices) {
    const terms = new Map();
    indices.forEach((index, position) => {
        const coefficient = (terms.get(index) || 0) + (position === 0 ? 1 : -1);
        if (coefficient) terms.set(index, coefficient);
        else terms.delete(index);
    });
    return dcLinearValue(context.solution, terms);
}

function componentValue(record, context, column) {
    if (column.kind === 'point') {
        if (!record.qPoint || !Object.hasOwn(record.qPoint, column.field)) throw new RangeError('dc.out() ' + column.field + ' is unavailable on ' + record.constructorName + ' at ' + (record.path || '(root)') + '.');
        return record.qPoint[column.field];
    }
    const part = context.assembly.components.find(entry => entry.path === record.path);
    if (column.ports.some(port => !Number.isSafeInteger(port) || port > part.nodes.length)) throw new RangeError('dc.out() selected terminal is outside ' + record.constructorName + ' at ' + (record.path || '(root)') + '.');
    if (column.kind === 'current') return record.terminalCurrents[column.ports[0] - 1];
    return voltageValue(context, column.ports.map(port => part.nodes[port - 1]));
}

function scaled(value, column) {
    if (value === null) return 'undetermined';
    const result = value * column.scale;
    if (!Number.isFinite(result)) throw new RangeError('dc.out() selected value exceeds the numeric range.');
    return result;
}

function nodeRows(result, context, options, columns) {
    if (options.component !== undefined || (options.node !== undefined && options.nodes !== undefined)) throw new TypeError('dc.out() selects component, node or nodes, without mixing them.');
    const path = options.path || '';
    if (options.nodes !== undefined) {
        if (!Array.isArray(options.nodes) || options.nodes.length !== 2) throw new TypeError('dc.out() nodes needs [positive, negative].');
        const labels = Array.from(options.nodes);
        labels.forEach(validateDcNode);
        const indices = labels.map(node => {
            const found = context.assembly.nodes.find(entry => !entry.internal && entry.path === path && entry.node === node);
            if (!found) throw new RangeError('dc.out() node ' + JSON.stringify(node) + ' was not found at ' + (path || '(root)') + '.');
            return found.index;
        });
        const value = voltageValue(context, indices);
        return [[options.label || labels.map(node => JSON.stringify(node)).join(' − '), ...columns.map(column => scaled(value, column))]];
    }
    if (options.node !== undefined) validateDcNode(options.node);
    const nodes = result.nodes.filter(node => !node.internal && node.path === path && (options.node === undefined || node.node === options.node));
    if (!nodes.length) throw new RangeError('dc.out() node/path was not found.');
    return nodes.map(node => [options.label ? options.label + (nodes.length > 1 ? ': ' + JSON.stringify(node.node) : '') : JSON.stringify(node.node),
        ...columns.map(column => scaled(node.voltage, column))]);
}

function dcOut(...selectors) {
    const options = optionsFor(selectors), columns = selectors.map(measurement), context = contexts.get(this);
    if (!context) throw new TypeError('dc.out() needs its original DC result.');
    const nodeMode = columns.some(column => column.kind === 'node');
    if (nodeMode && columns.some(column => column.kind !== 'node')) throw new TypeError('dc.out() node voltage and component measurements need separate calls.');
    const headings = columns.map(column => column.heading);
    if (new Set(headings).size !== headings.length) throw new RangeError('dc.out() measurement columns must be unique.');
    const rows = nodeMode ? nodeRows(this, context, options, columns) :
        selectedComponents(this, context, options, columns).map(record => [options.label ? options.label + (options.component === undefined ? ': ' + (record.path || '(root)') : '') :
            record.constructorName + (record.path ? ' ' + record.path : ''), ...columns.map(column => scaled(componentValue(record, context, column), column))]);
    return outputTable([[nodeMode ? 'Node' : 'Component', ...headings], ...rows],
        [null, ...columns.map(column => unitColumn(column.dimension, column.unit))], options.units);
}

export function withDcOutput(data, assembly, solution) {
    const result = dcResultSnapshot(data, dcOut);
    contexts.set(result, {assembly, solution});
    return result;
}
