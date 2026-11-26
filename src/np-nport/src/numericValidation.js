// Modified: 2026-11-26
import {componentSettings} from './componentSettings';
import {analysisFrequencies} from './analysisFrequencies';

export function requireNumber(caller, name, value, {positive = false, nonnegative = false, integer = false} = {}) {
    if (typeof value !== 'number') throw new TypeError(caller + ' ' + name + ' must be a number.');
    if (!Number.isFinite(value) || (positive && value <= 0) || (nonnegative && value < 0) ||
        (integer && !Number.isSafeInteger(value))) {
        throw new RangeError(caller + ' ' + name + ' must be a finite ' +
            (positive ? 'positive ' : nonnegative ? 'nonnegative ' : '') + (integer ? 'integer.' : 'number.'));
    }
    return value;
}

export function validatedComponentSettings(global, options, caller) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError(caller + ' options must be an object.');
    const settings = componentSettings(global, options);
    requireNumber(caller, 'reference impedance (ohms)', settings.Ro, {positive: true});
    requireNumber(caller, 'temperature (kelvin)', settings.Temp, {nonnegative: true});
    // Preserve empty construction grids and signed frequency rows used by existing callers.
    Array.from(settings.fList).forEach((frequency, index) => requireNumber(caller, 'fList[' + index + '] (Hz)', frequency));
    analysisFrequencies(settings).forEach(frequency => requireNumber(caller, 'analysis frequency (Hz)', frequency));
    return settings;
}

export function checkedSpars(caller, rows) {
    if (rows.some(row => !Number.isFinite(row[0]) || row.slice(1).some(value => !Number.isFinite(value.x) || !Number.isFinite(value.y)))) {
        throw new RangeError(caller + ' parameters/frequencies exceed the supported numeric range for S-parameters.');
    }
    return rows;
}

export function checkedNoise(caller, rows) {
    if (rows.some(row => row.C.some(values => values.some(value => !Number.isFinite(value.x) || !Number.isFinite(value.y))))) {
        throw new RangeError(caller + ' parameters/temperature exceed the supported numeric range for noise.');
    }
    return rows;
}
