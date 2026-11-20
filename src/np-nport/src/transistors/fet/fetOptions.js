// Modified: 2026-11-19
export function properties(value, keys, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(label + ' must be an object.');
    for (const key of Object.keys(value)) if (!keys.includes(key)) throw new TypeError('Unknown ' + label + ' property: ' + key + '.');
}
export function interval(input, defaults, direction, label) {
    if (input === undefined) input = {};
    properties(input, ['start', 'stop', 'points'], label);
    const result = {...defaults, ...input};
    if (![result.start, result.stop].every(Number.isFinite) || (result.stop - result.start) * direction <= 0 ||
        !Number.isInteger(result.points) || result.points < 2) throw new RangeError(label + ' needs an interval in the device sweep direction and at least two points.');
    return result;
}
export function atInterval(interval, index) {
    return index === interval.points - 1 ? interval.stop : interval.start + index * (interval.stop - interval.start) / (interval.points - 1);
}
