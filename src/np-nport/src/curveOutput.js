// Modified: 2026-11-26
import {outputTable, unitColumn} from '../../np-global/src/outputUnits';
const contexts = new WeakMap();
const dimensions = {vd: 'voltage', vr: 'voltage', vce: 'voltage', vcb: 'voltage', vds: 'voltage',
    id: 'current', ic: 'current', ie: 'current', cj: 'capacitance', ct: 'capacitance'};
const units = {
    voltage: {V: 1, mV: 1e3, uV: 1e6},
    current: {A: 1, mA: 1e3, uA: 1e6, nA: 1e9, pA: 1e12},
    capacitance: {F: 1, mF: 1e3, uF: 1e6, nF: 1e9, pF: 1e12, fF: 1e15}
};

function measurement(selector) {
    if (typeof selector !== 'string') throw new TypeError('curve.out() selectors must be strings.');
    let name = selector, unit;
    if (!Object.hasOwn(dimensions, name)) {
        const match = /^([a-z]+?)([munpf]?[VAF])$/.exec(selector);
        if (match) { name = match[1]; unit = match[2]; }
    }
    const dimension = dimensions[name];
    if (!Object.hasOwn(dimensions, name)) throw new RangeError('Unknown curve.out() selector: ' + selector + '.');
    unit = unit || Object.keys(units[dimension])[0];
    if (!Object.hasOwn(units[dimension], unit)) throw new RangeError('curve.out() selector ' + selector + ' has incompatible units.');
    return {name, scale: units[dimension][unit], unit: unit.replace('u', 'µ')};
}

function scaled(value, selected) {
    const result = value * selected.scale;
    if (!Number.isFinite(value) || !Number.isFinite(result)) throw new RangeError('curve.out() requires finite selected data and scaled values.');
    return result;
}

function stepLabels(step) {
    if (!step) return [''];
    const scale = step.name === 'ib' ? 1e6 : step.name === 'ie' ? 1e3 : 1;
    const unit = step.name === 'ib' ? 'µA' : step.name === 'ie' ? 'mA' : 'V';
    const values = step.values.map(value => value * scale), distinct = new Set(values).size;
    let precision = 6;
    while (precision < 17 && new Set(values.map(value => Number(value.toPrecision(precision)))).size < distinct) precision++;
    return values.map(value => ', ' + step.name + '=' + Number(value.toPrecision(precision)) + ' ' + unit);
}

function curveOut(...selectors) {
    const options = selectors.length && typeof selectors.at(-1) === 'object' ? selectors.pop() : {};
    if (!options || Array.isArray(options) || Object.keys(options).some(key => !['label', 'units'].includes(key))) throw new TypeError('curve.out() accepts label and units options.');
    if (options.label !== undefined && (typeof options.label !== 'string' || !options.label.trim())) throw new TypeError('curve.out() label must be a nonempty string.');
    if (!selectors.length) throw new TypeError('curve.out() requires measurement selectors, such as idmA or cjpF.');
    const context = contexts.get(this);
    if (!context) throw new TypeError('curve.out() needs its original curve table.');
    const selected = selectors.map(measurement);
    const axis = selected[0].name === context.axis ? selected.shift() : measurement(context.axis);
    if (!selected.length) throw new TypeError('curve.out() needs a dependent measurement after its voltage axis.');
    const columns = [];
    for (const quantity of selected) {
        if (quantity.name === context.axis) throw new TypeError('curve.out() swept voltage selector must be first.');
        const matches = context.columns.filter(column => column.name === quantity.name);
        if (!matches.length) throw new RangeError('curve.out() ' + quantity.name + ' is unavailable in this curve table.');
        for (const column of matches) columns.push({...quantity, index: column.index,
            heading: quantity.name + ' (' + quantity.unit + ')' + column.stepLabel});
    }
    if (new Set(columns.map(column => column.index + ':' + column.unit)).size !== columns.length) throw new RangeError('curve.out() measurement columns must be unique.');
    const heading = [axis.name + ' (' + axis.unit + ')', ...columns.map(column => options.label ?
        columns.length === 1 ? options.label + ' (' + column.unit + ')' : options.label + ': ' + column.heading : column.heading)];
    const table = [heading, ...context.rows.map(row => [scaled(row[0], axis), ...columns.map(column => scaled(row[column.index], column))])];
    return outputTable(table, [unitColumn('voltage', axis.unit), ...columns.map(column => unitColumn(dimensions[column.name], column.unit))], options.units);
}

// Producers provide explicit quantities and step values, never parsed legends.
// The legacy array stays mutable; the reader retains its original SI samples.
export function withCurveOutput(table, {axis, measurements, step}) {
    const labels = stepLabels(step), columns = [];
    for (const name of measurements) for (const stepLabel of labels) columns.push(Object.freeze({name, stepLabel, index: columns.length + 1}));
    if (!Object.hasOwn(dimensions, axis) || columns.length !== table[0].length - 1) throw new TypeError('Curve output metadata must match its table columns.');
    contexts.set(table, Object.freeze({axis, columns: Object.freeze(columns),
        rows: Object.freeze(table.slice(1).map(row => Object.freeze(row.slice())))}));
    Object.defineProperty(table, 'out', {value: curveOut});
    return table;
}
