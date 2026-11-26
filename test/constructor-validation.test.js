// Modified: 2026-11-26
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';

const lumped = [
    ...['R', 'seR', 'paR'].map(name => [name, [75]]),
    ...['L', 'seL', 'paL'].map(name => [name, [5e-9]]),
    ...['C', 'seC', 'paC'].map(name => [name, [1e-12]]),
    ...['seSe', 'sePa', 'paSe', 'paPa'].flatMap(prefix => [
        [prefix + 'RL', [75, 5e-9]], [prefix + 'RC', [75, 1e-12]],
        [prefix + 'LC', [5e-9, 1e-12]], [prefix + 'RLC', [75, 5e-9, 1e-12]]
    ])
];
const lines = [['Tlin', [60, .0127]], ['Tclin', [100, 30, .037338]]];

function setup(fList = [0, 1e9]) {
    const context = nP.global();
    context.fList = fList;
    return context;
}
function finite(part) {
    for (const row of part.spars) for (const value of row.slice(1)) {
        assert.ok(Number.isFinite(value.x) && Number.isFinite(value.y));
    }
    for (const row of part.noise) for (const values of row.C) for (const value of values) {
        assert.ok(Number.isFinite(value.x) && Number.isFinite(value.y));
    }
}
function realRow(part, expected) {
    for (const row of part.spars) assert.deepEqual(row.slice(1).map(value => [value.x || 0, value.y || 0]), expected.map(value => [value, 0]));
}

test('all positional electrical values reject nonnumbers/nonfinite values and passive range violations', () => {
    setup();
    for (const [name, defaults] of [...lumped, ...lines, ['trf', [.5]], ['trf4Port', [.5]]]) {
        for (let index = 0; index < defaults.length; index++) {
            for (const bad of [NaN, Infinity, -Infinity, null, '75', true, [], {}]) {
                const args = defaults.slice();
                args[index] = name === 'seR' || name === 'paR' ? (bad && typeof bad === 'object' && !Array.isArray(bad) ? {resistance: bad} : bad) : bad;
                assert.throws(() => nP[name](...args), /number/, name + ' argument ' + index);
            }
            if (!name.startsWith('trf')) {
                const args = defaults.slice(); args[index] = -1;
                assert.throws(() => nP[name](...args), /positive|nonnegative/, name);
            }
        }
    }
    for (const name of ['R', 'seR', 'paR']) {
        for (const bad of [null, '290', {}, NaN, Infinity, -1]) assert.throws(() => nP[name](75, bad), /temperature/);
        finite(nP[name](75, 0));
    }
});

test('zero RLC values have exact open/short limits throughout each topology', () => {
    setup();
    realRow(nP.R(0), [0, 1, 1, 0]);
    realRow(nP.L(0), [0, 1, 1, 0]);
    realRow(nP.C(0), [1, 0, 0, 1]);
    realRow(nP.paR(0), [-1, 0, 0, -1]);
    realRow(nP.paL(0), [-1, 0, 0, -1]);
    realRow(nP.paC(0), [0, 1, 1, 0]);
    realRow(nP.sePaRC(75, 0), [75 / 175, 100 / 175, 100 / 175, 75 / 175]);
    realRow(nP.paSeRC(0, 0), [0, 1, 1, 0]);
    for (const [name, defaults] of lumped) {
        for (let mask = 0; mask < 2 ** defaults.length; mask++) {
            const args = defaults.map((value, index) => mask & (1 << index) ? 0 : value);
            finite(nP[name](...args));
        }
    }
    const diodeFree = nP.nodal([nP.L(0), 1, 2], [nP.R(50), 2, 3], ['out', 1, 3]);
    assert.deepEqual(diodeFree.spars, nP.R(50).spars);
});

test('lossless LC series/parallel resonance yields finite physical limiting networks', () => {
    setup([1 / (2 * Math.PI)]);
    realRow(nP.seSeLC(1, 1), [0, 1, 1, 0]);
    realRow(nP.paSeLC(1, 1), [-1, 0, 0, -1]);
    realRow(nP.sePaLC(1, 1), [1, 0, 0, 1]);
    realRow(nP.paPaLC(1, 1), [0, 1, 1, 0]);
});

test('line impedances stay positive while zero length and signed/zero transformer ratios remain valid', () => {
    setup();
    for (const [name, defaults] of lines) {
        for (let index = 0; index < defaults.length - 1; index++) {
            const args = defaults.slice(); args[index] = 0;
            assert.throws(() => nP[name](...args), /positive/);
        }
        const args = defaults.slice(); args[args.length - 1] = 0;
        finite(nP[name](...args));
    }
    for (const name of ['trf', 'trf4Port']) {
        for (const ratio of [-2, 0, .5, 2]) finite(nP[name](ratio));
        assert.throws(() => nP[name](1e308), /numeric range/);
    }
    assert.throws(() => nP.Tlin(1e308, 1), /numeric range/);
    assert.throws(() => nP.R(1e308, 1e308), /numeric range/);
});

test('shared settings reject corrupt contexts and lists without breaking empty/signed grids or aliases', () => {
    const g = setup();
    const names = ['R', 'L', 'C', 'trf', 'trf4Port', 'trfAuto', 'Tlin', 'Tclin', 'Open', 'Short',
        'Thru', 'Load', 'Shift90', 'Tee', 'Tee4', 'Tee5', 'seriesTee', 'Coupler180', 'Attn', 'Amp'];
    for (const field of ['Ro', 'Temp']) {
        const previous = g[field];
        for (const bad of [NaN, Infinity, -1, '50']) {
            g[field] = bad;
            for (const name of names) assert.throws(() => nP[name](), /reference impedance|temperature/);
        }
        g[field] = previous;
    }
    for (const list of [[NaN], [Infinity], ['1e9'], new Array(1)]) {
        g.fList = list;
        for (const name of names) assert.throws(() => nP[name](), /frequency|fList/);
    }
    g.fList = [];
    for (const name of names) assert.deepEqual(nP[name]().spars, []);
    g.fList = [-1e9, 0, 1e9];
    finite(nP.L()); finite(nP.C());
    assert.deepEqual(nP.seR({resistance: 25}).spars, nP.R(25).spars);
    assert.deepEqual(nP.paR({resistance: 25}).spars, nP.paR(25).spars);
    assert.throws(() => nP.L(1e-9, null), /options/);
    assert.throws(() => nP.C(1e-12, []), /options/);
    for (const name of ['Load', 'Open', 'Short', 'Tee', 'trfAuto']) {
        assert.throws(() => nP[name](50), /options must be an object/);
    }
});

test('Chebyshev synthesis validates every numeric value, order, relationship and prototype element', () => {
    const sectionDefaults = [.2, 1.5, .1, 30];
    for (let index = 0; index < 4; index++) for (const bad of [{}, '1', null, NaN, Infinity, 0, -1]) {
        const args = sectionDefaults.slice(); args[index] = bad;
        assert.throws(() => nP.chebyLPNsec(...args));
    }
    assert.throws(() => nP.chebyLPNsec(1, 1), /above/);
    assert.throws(() => nP.chebyLPNsec(1, 2, 1, .5), /above/);
    for (const order of [{}, '3', NaN, Infinity, 0, -1, 2.5, 2 ** 32]) assert.throws(() => nP.chebyLPgk(order));
    for (const ripple of [{}, '1', NaN, Infinity, 0, -1, 1e308]) assert.throws(() => nP.chebyLPgk(3, ripple));
    for (const prototype of [{}, [], [1, 1], [1, NaN, 1], [1, '1', 1], [1, 0, 1], new Array(3)]) {
        assert.throws(() => nP.chebyLPLCs(prototype));
    }
    for (const bad of [{}, '1', NaN, Infinity, 0, -1]) {
        assert.throws(() => nP.chebyLPLCs(undefined, bad));
        assert.throws(() => nP.chebyLPLCs(undefined, 1e9, bad));
    }
    const prototype = Object.freeze([1, 1.0315851425078764, 1.1474003299537219, 1.0315851425078761, 1]);
    assert.deepEqual(nP.chebyLPgk(), prototype);
    const parts = nP.chebyLPLCs(prototype);
    assert.ok(parts.every(value => Number.isFinite(value) && value > 0));
    assert.equal(parts[0], 50); assert.equal(parts.at(-1), 50);
    finite(nP.lpfGen(parts));
});
