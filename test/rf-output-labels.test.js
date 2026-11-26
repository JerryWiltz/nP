// Modified: 2026-11-26
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nP from '../src/index.js';

test('RF labels name one trace or prefix multiple selectors without changing numeric rows', () => {
    const g = nP.global();
    g.fList = [1e9, 2e9, 3e9];
    const r = nP.R(75), c = nP.C(10e-12), network = nP.cascade(r, c);
    const selectors = Object.freeze(['s11dB', 's21dB', 's21ang']);
    const options = Object.freeze({label: 'Amplifier α'});
    const original = network.out(...selectors);
    const labeled = network.out(...selectors, options);
    assert.deepEqual(original[0], ['Freq', ...selectors]);
    assert.deepEqual(labeled[0], ['Freq', ...selectors.map(s => 'Amplifier α: ' + s)]);
    assert.deepEqual(labeled.slice(1), original.slice(1));
    assert.deepEqual(network.out('s21dB', options)[0], ['Freq', 'Amplifier α']);
    assert.deepEqual(network.out('s21dB', options).slice(1), network.out('s21dB').slice(1));
    labeled[0][1] = 'Edited'; labeled[1][1] = 999;
    assert.deepEqual(network.out(...selectors), original);
    assert.deepEqual(network.out(...selectors, {}), original);
    assert.deepEqual(network.out(...selectors, {label: undefined}), original);
    const tee = nP.Tee();
    assert.deepEqual(tee.out('s31mag', {label: 'Branch'})[0], ['Freq', 'Branch']);
    assert.deepEqual(tee.out('s31mag', {label: 'Branch'}).slice(1), tee.out('s31mag').slice(1));
});

test('RF output requires a selector even when measurement options are provided', () => {
    const g = nP.global();
    g.fList = [1e9];
    const r = nP.R(75), open = nP.Open(), before = r.out('s21dB');
    const options = Object.freeze({label: 'Gain'});
    for (const part of [r, open, nP.R(75, undefined, {fList: []})]) {
        for (const args of [[], [{}], [options], [{source: {reflection: 0}}]]) {
            assert.throws(() => part.out(...args), {name: 'TypeError', message: /requires a measurement selector.*s21dB/});
        }
    }
    assert.deepEqual(r.out('s21dB'), before);
    assert.deepEqual(r.out('s21dB', options).slice(1), before.slice(1));
    assert.equal(open.out('s11Re')[1][1], 1);
});

test('RF labels coexist with noise conditions, two-tone overrides and mixed analysis selectors', () => {
    const g = nP.global();
    g.fList = [1e9, 2e9];
    g.twoTone = {spacingHz: 1e6, p1dBm: -30, p2dBm: -25};
    const amp = nP.Amp({gainDb: 20, oip3dBm: 30});
    const options = Object.freeze({
        source: Object.freeze({reflection: .1, temperature: 310}),
        terminations: Object.freeze({2: Object.freeze({reflection: .2, temperature: 50})}),
        referenceTemperature: 300,
        twoTone: Object.freeze({spacingHz: 1e6, p1dBm: -40, p2dBm: -35})
    });
    const selectors = ['s21dB', 'NF21dB', 'noiseFloor', 'c22Re', 'K', 'deltaMag', 'IM3lower21dBm', 'OIP3lower21dBm'];
    const original = amp.out(...selectors, options);
    const labeled = amp.out(...selectors, {...options, label: 'Stage'});
    assert.deepEqual(labeled[0], ['Freq', ...selectors.map(s => 'Stage: ' + s)]);
    assert.deepEqual(labeled.slice(1), original.slice(1));
    assert.equal(labeled.length, g.fList.length + 1);
    assert.notEqual(original[1][7], amp.out('IM3lower21dBm')[1][1]);
    assert.deepEqual(amp.out(...selectors, options), original);
});

test('invalid RF labels fail explicitly and leave subsequent output unchanged', () => {
    const g = nP.global();
    g.fList = [1e9];
    const r = nP.R(75), original = r.out('s21dB');
    for (const label of ['', '  ', 3, true, null, [], {}]) {
        assert.throws(() => r.out('s21dB', {label}), /label must be a nonempty string/);
    }
    for (const options of [null, []]) assert.throws(() => r.out('s21dB', options), /options must be an object/);
    assert.deepEqual(r.out('s21dB'), original);
});
