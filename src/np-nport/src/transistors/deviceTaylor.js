// Modified: 2026-11-19
// Factorial-normalized Taylor coefficients through degree three. Three control
// voltages support a four-terminal device without grounding or deleting its body.
export const devicePowers = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1],
    [2, 0, 0], [1, 1, 0], [1, 0, 1], [0, 2, 0], [0, 1, 1], [0, 0, 2],
    [3, 0, 0], [2, 1, 0], [2, 0, 1], [1, 2, 0], [1, 1, 1], [1, 0, 2],
    [0, 3, 0], [0, 2, 1], [0, 1, 2], [0, 0, 3]];
const products = devicePowers.map(a => devicePowers.map(b => devicePowers.findIndex(c =>
    c.every((degree, axis) => degree === a[axis] + b[axis]))));
export function constant(value) { const result = Array(devicePowers.length).fill(0); result[0] = value; return result; }
export function variable(value, axis) { const result = constant(value); result[axis + 1] = 1; return result; }
export function add(a, b) { return a.map((value, i) => value + b[i]); }
export function scale(a, factor) { return a.map(value => value * factor); }
export function subtract(a, b) { return add(a, scale(b, -1)); }
export function multiply(a, b) {
    const result = constant(0);
    for (let i = 0; i < a.length; i++) if (a[i]) for (let j = 0; j < b.length; j++) {
        const index = products[i][j];
        if (index >= 0 && b[j]) result[index] += a[i] * b[j];
    }
    return result;
}
function compose(a, coefficients) {
    const delta = a.slice(); delta[0] = 0;
    let result = constant(coefficients[0]), term = constant(1);
    for (let degree = 1; degree <= 3; degree++) {
        term = multiply(term, delta); result = add(result, scale(term, coefficients[degree]));
    }
    return result;
}
export function power(a, exponent) {
    if (exponent === 0) return constant(1);
    if (exponent === 1) return a.slice();
    if (exponent === 2) return multiply(a, a);
    const x = a[0];
    return compose(a, [x ** exponent, exponent * x ** (exponent - 1),
        exponent * (exponent - 1) * x ** (exponent - 2) / 2,
        exponent * (exponent - 1) * (exponent - 2) * x ** (exponent - 3) / 6]);
}
export function exponential(a) { const x = Math.exp(a[0]); return compose(a, [x, x, x / 2, x / 6]); }
