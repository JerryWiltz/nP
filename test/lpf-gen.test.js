// Modified: 2026-11-18
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';
import {analysisFrequencies} from '../src/np-nport/src/analysisFrequencies';
import {dcRequirements} from '../src/np-nport/src/dcModel';

const filterValues = [50, 16.41818746502858e-12, 45.65360855435164e-9, 16.418187465028578e-12, 50];

function withSettings(action, twoTone) {
    const previous = {...nP.global};
    Object.assign(nP.global, {fList: [0, 1e6, 100e6, 200e6, 1e9], Ro: 50, Temp: 310, twoTone});
    try { action(); }
    finally { Object.assign(nP.global, previous); }
}

function close(actual, expected, absolute = 1e-10) {
    assert.ok(Number.isFinite(actual) && Number.isFinite(expected));
    assert.ok(Math.abs(actual - expected) <= absolute, `${actual} differs from ${expected}`);
}

test('lpfGen preserves caller values across repeated calls and accepts frozen arrays', () => {
    withSettings(() => {
        const values = filterValues.slice();
        const first = nP.lpfGen(values);
        const second = nP.lpfGen(values);
        const frozen = nP.lpfGen(Object.freeze(values.slice()));
        assert.deepEqual(values, filterValues);
        assert.notEqual(first, second);
        assert.deepEqual(first.spars, second.spars);
        assert.deepEqual(first.spars, frozen.spars);
        assert.deepEqual(first.noise, second.noise);
        assert.deepEqual(first._dcModel, second._dcModel);
        assert.deepEqual(first._dcModel.definition.construction.parameters.filter, filterValues);
        values[1] *= 2;
        assert.equal(first._dcModel.definition.construction.parameters.filter[1], filterValues[1]);
        assert.ok(Object.isFrozen(first._dcModel.definition.construction.parameters.filter));
    });
});

test('lpfGen validates shape and each value without changing rejected inputs', () => {
    withSettings(() => {
        for (const value of [null, 50, 'filter', {0: 50, length: 3}, new Float64Array(filterValues)]) {
            assert.throws(() => nP.lpfGen(value), {name: 'TypeError', message: /lpfGen.*array/});
        }
        for (const values of [[], [50], [50, 50]]) {
            const before = values.slice();
            assert.throws(() => nP.lpfGen(values), {name: 'RangeError', message: /at least one shunt capacitor/});
            assert.deepEqual(values, before);
        }
        const cases = [
            [[0, 1e-12, 50], /filt\[0\].*source resistance/],
            [[50, 1e-12, Infinity], /filt\[2\].*load resistance/],
            [[50, 0, 50], /filt\[1\].*shunt capacitance/],
            [[50, NaN, 50], /filt\[1\].*shunt capacitance/],
            [[50, '1e-12', 50], /filt\[1\].*shunt capacitance/],
            [[50, -1e-12, 50], /filt\[1\].*shunt capacitance/],
            [[50, 1e-12, -5e-9, 50], /filt\[2\].*series inductance/],
            [[50, 1e-12, 0, 50], /filt\[2\].*series inductance/],
            [[50, 1e-12, 5e-9, undefined, 50], /filt\[3\].*shunt capacitance/],
            [[50, , 50], /filt\[1\].*shunt capacitance/]
        ];
        for (const [values, message] of cases) {
            const before = values.slice();
            assert.throws(() => nP.lpfGen(values), {name: 'RangeError', message});
            assert.deepEqual(values, before);
        }
    });
});

test('default, single-capacitor and C-L ladders retain their RF behavior and explicit grids', () => {
    withSettings(() => {
        const defaults = nP.lpfGen();
        const supplied = nP.lpfGen(filterValues);
        assert.deepEqual(defaults.spars, supplied.spars);
        const a = nP.paC(filterValues[1]), b = nP.seL(filterValues[2]), c = nP.paC(filterValues[3]);
        assert.deepEqual(defaults.spars, nP.cascade(a, b, c).spars);
        const frequencies = [10e6, 150e6];
        const single = nP.lpfGen(Object.freeze([75, 1e-12, 100]), {fList: frequencies});
        assert.deepEqual(single.spars, nP.paC(1e-12, {fList: frequencies}).spars);
        const pair = nP.lpfGen([50, 1e-12, 5e-9, 75]);
        assert.deepEqual(pair.spars, nP.cascade(nP.paC(1e-12), nP.seL(5e-9)).spars);
        assert.deepEqual(single.spars.map(row => row[0]), frequencies);
        assert.deepEqual(single._dcModel.analysis.fList, frequencies);
        assert.equal(single._dcModel.constructorName, 'lpfGen');
    });
});

test('ideal filter adds no noise and preserves source noise and amplifier noise propagation', () => {
    withSettings(() => {
        const filter = nP.lpfGen(filterValues);
        for (const row of filter.noise) {
            assert.ok(row.C.every(values => values.every(value => value.mag() < 1e-32)));
        }
        for (const row of filter.out('s21dB', 'NF21dB', 'noiseFloor').slice(1)) {
            close(row[2], 0);
            close(row[3], 10 * Math.log10(1.380649e-23 * 290 * 1000) + row[1]);
        }
        const amp = nP.Amp(20, 4);
        for (const row of nP.cascade(amp, filter).out('NF21dB').slice(1)) close(row[1], 4);
        const explicit = nP.cascade(nP.paC(filterValues[1]), nP.seL(filterValues[2]), nP.paC(filterValues[3]));
        const actual = nP.cascade(filter, amp).out('s21dB', 'NF21dB', 'noiseFloor');
        const expected = nP.cascade(explicit, amp).out('s21dB', 'NF21dB', 'noiseFloor');
        for (let row = 1; row < actual.length; row++) {
            for (let column = 1; column < actual[row].length; column++) close(actual[row][column], expected[row][column]);
        }
    });
});

test('filter creates no intermodulation and applies transmission at each product frequency', () => {
    withSettings(() => {
        nP.global.fList = [150e6, 250e6];
        const filter = nP.lpfGen(filterValues);
        assert.deepEqual(filter.spars.map(row => row[0]), analysisFrequencies(nP.global));
        const bare = filter.out('IM2sum21dBm', 'IM3lower21dBm', 'OIP3lower21dBm');
        assert.equal(bare.length, 3);
        for (const row of bare.slice(1)) assert.deepEqual(row.slice(1), [-Infinity, -Infinity, Infinity]);
        const amp = nP.Amp({gainDb: 20, oip2dBm: 42, oip3dBm: 30});
        const chain = nP.cascade(amp, filter);
        const selectors = ['IM2sum21dBm', 'IM3lower21dBm', 'IM3upper21dBm'];
        const before = amp.out(...selectors), after = chain.out(...selectors);
        for (let row = 1; row < before.length; row++) {
            const f1 = before[row][0], f2 = f1 + nP.global.twoTone.spacingHz;
            const frequencies = [f1 + f2, 2 * f1 - f2, 2 * f2 - f1];
            for (let product = 0; product < frequencies.length; product++) {
                const response = filter.spars.find(entry => entry[0] === frequencies[product]);
                close(after[row][product + 1] - before[row][product + 1], response[3].mag20dB());
            }
        }
    }, {spacingHz: 10e6, p1dBm: -30, p2dBm: -27});
});

test('filter retains immutable DC topology and carries DC through open-C short-L reduction', () => {
    withSettings(() => {
        nP.global.fList = [1e6, 100e6];
        const values = [75, filterValues[1], filterValues[2], filterValues[3], 100];
        const filter = nP.lpfGen(values);
        assert.deepEqual(dcRequirements(filter._dcModel), []);
        assert.ok(Object.isFrozen(filter._dcModel));
        assert.equal(filter.solveDC().converged, true);
        const source = nP.V(1), ground = nP.Short(), t1 = nP.Tee(), t2 = nP.Tee(), load = nP.R(175);
        const network = nP.nodal(
            [source, 10, 11],
            [ground, 11],
            [t1, 10, 1, 2],
            [filter, 1, 3],
            [t2, 4, 3, 5],
            [load, 4, 6],
            [ground, 6],
            ['out', 2, 5]
        );
        const point = network.solveDC();
        assert.equal(point.converged, true);
        const resistors = point.components.filter(part => part.constructorName === 'R');
        assert.equal(resistors.length, 1); // Endpoints are not physical resistors.
        close(resistors[0].terminalCurrents[0], 1 / 175);
        const elements = point.components.flatMap(part => part.elements || []);
        const capacitors = elements.filter(element => element.type === 'capacitor');
        assert.equal(capacitors.length, 2);
        assert.ok(capacitors.every(element => element.current === 0 && element.reduction === 'open'));
        const inductor = elements.find(element => element.type === 'inductor');
        close(inductor.voltage, 0);
        close(inductor.current, 1 / 175);
        assert.deepEqual(values, [75, filterValues[1], filterValues[2], filterValues[3], 100]);
    });
});
