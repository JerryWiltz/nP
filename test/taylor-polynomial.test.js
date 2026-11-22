// Modified: 2026-11-21
import test from 'node:test';
import assert from 'node:assert/strict';
import * as twoControl from '../src/np-nport/src/transistors/bjt/taylor';
import * as threeControl from '../src/np-nport/src/transistors/deviceTaylor';

const factorial = [1, 1, 2, 6];

for (const [name, engine, powers] of [
    ['two-control', twoControl, twoControl.powers],
    ['three-control', threeControl, threeControl.devicePowers]
]) {
    test(`${name} polynomial powers retain every mixed derivative at zero and nonzero values`, () => {
        const weights = [2, -3, 1.5].slice(0, powers[0].length);
        for (const base of [0, -2, 2]) {
            const input = Object.freeze(weights.reduce((jet, weight, axis) =>
                engine.add(jet, engine.scale(engine.variable(0, axis), weight)), engine.constant(base)));
            const before = input.slice();
            for (const exponent of [0, 1, 2, 3]) {
                const actual = engine.power(input, exponent);
                // Multinomial coefficients of (base + sum(weight_i * delta_i))^n.
                // Terms above degree n vanish, including at base = 0.
                const expected = powers.map(degrees => {
                    const degree = degrees.reduce((sum, value) => sum + value, 0);
                    if (degree > exponent) return 0;
                    return factorial[exponent] / factorial[exponent - degree] * base ** (exponent - degree) *
                        degrees.reduce((product, value, axis) => product * weights[axis] ** value / factorial[value], 1);
                });
                actual.forEach((coefficient, index) => {
                    assert.ok(Number.isFinite(coefficient));
                    assert.ok(Math.abs(coefficient - expected[index]) < 1e-12,
                        `${name}: base ${base}, power ${exponent}, term ${powers[index]}: ${coefficient} != ${expected[index]}`);
                });
                assert.notEqual(actual, input);
                assert.deepEqual(input, before);
            }
        }
    });
    test(`${name} power one preserves an arbitrary higher-order jet without aliasing it`, () => {
        const input = Object.freeze(powers.map((_, index) => index / 8));
        const result = engine.power(input, 1);
        assert.deepEqual(result, input);
        assert.notEqual(result, input);
        result[1] = 99;
        assert.equal(input[1], 1 / 8);
    });
}
