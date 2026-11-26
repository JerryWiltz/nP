// Modified: 2026-11-26
const tableUnits = Symbol.for('nP.outputUnits');
const definitions = {
    frequency: {Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9, THz: 1e12},
    time: {s: 1, ms: 1e-3, us: 1e-6, ns: 1e-9, ps: 1e-12},
    voltage: {V: 1, mV: 1e-3, uV: 1e-6, nV: 1e-9, dBV: {reference: 1, logarithm: 20}},
    current: {A: 1, mA: 1e-3, uA: 1e-6, nA: 1e-9, pA: 1e-12},
    capacitance: {F: 1, mF: 1e-3, uF: 1e-6, nF: 1e-9, pF: 1e-12, fF: 1e-15},
    resistance: {ohm: 1, kohm: 1e3, Mohm: 1e6},
    temperature: {K: 1},
    angle: {deg: Math.PI / 180, rad: 1},
    power: {W: 1, mW: 1e-3, uW: 1e-6, nW: 1e-9, pW: 1e-12,
        dBm: {reference: 1e-3, logarithm: 10}, dBW: {reference: 1, logarithm: 10}},
    powerDensity: {'W/Hz': 1, 'mW/Hz': 1e-3, 'uW/Hz': 1e-6, 'nW/Hz': 1e-9, 'pW/Hz': 1e-12,
        'dBm/Hz': {reference: 1e-3, logarithm: 10}, 'dBW/Hz': {reference: 1, logarithm: 10}},
    sensitivity: {'V/W': 1, 'mV/W': 1e-3, 'uV/W': 1e-6}
};
const titles = {frequency: 'Frequency', time: 'Time', voltage: 'Voltage', current: 'Current', capacitance: 'Capacitance',
    resistance: 'Resistance', temperature: 'Temperature', angle: 'Phase', power: 'Power', powerDensity: 'Noise density', sensitivity: 'Sensitivity'};

function canonical(unit) {
    return typeof unit === 'string' ? unit.replaceAll('µ', 'u').replaceAll('μ', 'u').replaceAll('Ω', 'ohm') : unit;
}

export function unitLabel(unit) {
    return unit.replaceAll('u', 'µ').replaceAll('ohm', 'Ω');
}

export function unitColumn(quantity, unit, title, annotation) {
    return {quantity, unit: canonical(unit), title, annotation};
}

function unitDefinition(quantity, unit) {
    if (!Object.hasOwn(definitions, quantity) || typeof unit !== 'string' || !Object.hasOwn(definitions[quantity], unit)) {
        throw new RangeError('Unsupported output unit ' + String(unit) + ' for ' + String(quantity) + '.');
    }
    return definitions[quantity][unit];
}

function unitRequest(units, columns) {
    if (!units || typeof units !== 'object' || Array.isArray(units)) throw new TypeError('out() units must be an object of quantity/unit pairs.');
    const requested = {};
    for (const [quantity, value] of Object.entries(units)) {
        const unit = canonical(value);
        unitDefinition(quantity, unit);
        if (!columns.some(column => column && column.quantity === quantity)) throw new RangeError('Output has no ' + quantity + ' column to convert.');
        requested[quantity] = unit;
    }
    return requested;
}

function convert(value, quantity, from, to) {
    if (value === 'undetermined') return value;
    if (typeof value !== 'number' || Number.isNaN(value)) throw new RangeError('Output unit conversion needs numeric values.');
    if (from === to) return value;
    const source = unitDefinition(quantity, from), target = unitDefinition(quantity, to);
    let result;
    if (typeof source === 'number' && typeof target === 'number') {
        result = value * (source / target);
    } else if (typeof source === 'object' && typeof target === 'object') {
        result = value * source.logarithm / target.logarithm + target.logarithm * Math.log10(source.reference / target.reference);
    } else {
        if (typeof source === 'object') result = 10 ** (value / source.logarithm + Math.log10(source.reference / target));
        else {
            if (value < 0) throw new RangeError('Logarithmic output units require nonnegative values.');
            result = target.logarithm * (Math.log10(value) + Math.log10(source / target.reference));
        }
    }
    if (Number.isNaN(result) || Number.isFinite(value) && (!Number.isFinite(result) && result !== -Infinity ||
        typeof target === 'number' && result === 0 && (typeof source === 'object' || value !== 0))) {
        throw new RangeError('Output unit conversion exceeds the numeric range.');
    }
    return result;
}

function heading(original, column, unit) {
    const suffix = ' (' + unitLabel(unit) + (column.annotation ? ', ' + column.annotation : '') + ')';
    if (column.title !== undefined) return column.title + suffix;
    const previous = '(' + unitLabel(column.unit) + ')';
    return original.includes(previous) ? original.replace(previous, '(' + unitLabel(unit) + ')') : original + suffix;
}

export function outputTable(table, columns, units) {
    if (columns.length !== table[0].length) throw new TypeError('Output unit metadata must match table columns.');
    const explicit = units !== undefined, requested = explicit ? unitRequest(units, columns) : {};
    const resolved = columns.map(column => column && column.quantity ? {...column, unit: requested[column.quantity] || column.unit} : column);
    const result = explicit ? [table[0].map((title, index) => resolved[index]?.unit !== undefined ?
        heading(title, columns[index], resolved[index].unit) : resolved[index]?.title ?? title), ...table.slice(1).map(row => row.map((value, index) => {
        const column = columns[index];
        return column && column.quantity ? convert(value, column.quantity, column.unit, resolved[index].unit) : value;
    }))] : table;
    if (explicit && new Set(result[0]).size !== result[0].length) throw new RangeError('Output units produce duplicate column headings; select each measurement once.');
    Object.defineProperty(result, tableUnits, {value: Object.freeze({explicit,
        columns: Object.freeze(resolved.map(column => column && Object.freeze({...column})))} )});
    return result;
}

export function outputUnitInfo(table) { return table && table[tableUnits]; }

function resultOut(...args) {
    const options = args.length && typeof args.at(-1) === 'object' ? args.at(-1) : undefined;
    if (!options || options.units === undefined) return this.read.apply(this.owner, args);
    if (Array.isArray(options) || Object.keys(options).some(key => key !== 'units')) throw new TypeError('This output accepts only a units option.');
    const selection = args.length > 1 && args[0] !== undefined ? args[0] : this.defaultSelector;
    const columns = this.profile[selection];
    if (!columns) throw new RangeError('Units require a supported measurement table, not bits, raw samples, scalars or settings.');
    unitRequest(options.units, columns);
    const table = this.read.call(this.owner, selection);
    return outputTable(table, outputUnitInfo(table)?.columns || columns, options.units);
}

export function withOutputUnits(result, profile, defaultSelector) {
    result.out = resultOut.bind({owner: result, read: result.out, profile, defaultSelector});
    return result;
}

export function explicitAxis(tables, metricPrefix, caller) {
    if (!tables.some(table => outputUnitInfo(table)?.explicit)) return null;
    if (metricPrefix !== undefined && !['none', 'one'].includes(metricPrefix)) throw new RangeError(caller + ': output units are already selected; omit metricPrefix or use none.');
    const first = outputUnitInfo(tables[0])?.columns[0];
    if (tables.some(table => {
        const axis = outputUnitInfo(table)?.columns[0];
        return !outputUnitInfo(table) || axis?.quantity !== first?.quantity || axis?.unit !== first?.unit;
    })) throw new RangeError(caller + ': use matching output axis units for every input table.');
    const measurements = tables.flatMap(table => outputUnitInfo(table).columns.slice(1));
    const common = measurements[0];
    const same = common && common.quantity && measurements.every(column => column && column.quantity === common.quantity && column.unit === common.unit);
    const sameUnit = common?.unit && measurements.every(column => column?.unit === common.unit);
    const title = same ? titles[common.quantity] + ' (' + unitLabel(common.unit) + ')' : sameUnit ? unitLabel(common.unit) : 'Value';
    return {xTitle: tables[0][0][0], yTitle: title};
}
