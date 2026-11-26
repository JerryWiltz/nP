// Modified: 2026-11-26
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';

test('R uses numeric ohms with the existing default, RF, noise and DC contracts', () => {
    const context = nP.global();
    context.fList = [1e9];
    context.Ro = 50;
    context.Temp = 320;
    const defaultResistor = nP.R(), explicit = nP.R(75);
    assert.deepEqual(defaultResistor.spars, explicit.spars);
    const frequencies = [0, 2e9];
    const resistor = nP.R(75, 290, {fList: frequencies});
    assert.deepEqual(resistor.spars.map(row => row[0]), frequencies);
    assert.equal(resistor.spars[1][3].x, 100 / 175);
    assert.equal(resistor.noise[1].C[0][0].x, 1.380649e-23 * 290 * 4 * 75 * 50 / 175 ** 2);
    const dc = resistor.solveDC();
    assert.equal(dc.components[0].constructorName, 'R');
    assert.equal(resistor._schematic.value, 75);
    assert.equal(nP.R(0).spars[0][3].x, 1);
    frequencies.push(3e9);
    assert.deepEqual(resistor.global.fList, [0, 2e9]);
});

test('R rejects options objects and other nonnumeric resistance arguments', () => {
    for (const value of [{}, {resistance: 75}, {resistance: 75, temperature: 290},
        {fList: [1e9]}, null, [75], '75', true]) {
        assert.throws(() => nP.R(value), {name: 'TypeError', message: /resistance.*number/});
    }
});
