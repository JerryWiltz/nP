// Modified: 2026-11-21
// Two-variable Taylor coefficients, normalized by i! j!, through degree three.
// The same current/charge equations supply DC, RF and weak nonlinear analysis.
export const powers = [[0, 0], [1, 0], [0, 1], [2, 0], [1, 1], [0, 2],
    [3, 0], [2, 1], [1, 2], [0, 3]];
const products = powers.map(([i, j]) => powers.map(([k, l]) =>
    powers.findIndex(([a, b]) => a === i + k && b === j + l)));

export function constant(value) { return [value, 0, 0, 0, 0, 0, 0, 0, 0, 0]; }
export function variable(value, index) {
    const result = constant(value);
    result[index + 1] = 1;
    return result;
}
export function add(a, b) { return a.map((value, i) => value + b[i]); }
export function scale(a, b) { return a.map(value => value * b); }
export function subtract(a, b) { return add(a, scale(b, -1)); }
export function multiply(a, b) {
    const result = constant(0);
    for (let i = 0; i < 10; i++) {
        if (a[i] === 0) continue;
        for (let j = 0; j < 10; j++) {
            const index = products[i][j];
            if (index >= 0) result[index] += a[i] * b[j];
        }
    }
    return result;
}
function compose(a, derivatives) {
    const delta = a.slice();
    delta[0] = 0;
    let result = constant(derivatives[0]), term = constant(1);
    for (let degree = 1; degree <= 3; degree++) {
        term = multiply(term, delta);
        result = add(result, scale(term, derivatives[degree]));
    }
    return result;
}
export function power(a, exponent) {
    // Polynomial powers remain defined at zero; avoid 0 * x^negative in
    // the generic derivative formula. Match the three-control Taylor algebra.
    if (exponent === 0) return constant(1);
    if (exponent === 1) return a.slice();
    if (exponent === 2) return multiply(a, a);
    const x = a[0];
    return compose(a, [x ** exponent, exponent * x ** (exponent - 1),
        exponent * (exponent - 1) * x ** (exponent - 2) / 2,
        exponent * (exponent - 1) * (exponent - 2) * x ** (exponent - 3) / 6]);
}
export function divide(a, b) { return multiply(a, power(b, -1)); }
export function exponential(a) {
    const value = Math.exp(a[0]);
    return compose(a, [value, value, value / 2, value / 6]);
}
