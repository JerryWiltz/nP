// Modified: 2026-11-26
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as nP from '../src/index.js';
import {outputTable, unitColumn, outputUnitInfo, explicitAxis} from '../src/np-global/src/outputUnits';
import {singleDetector} from './fixtures/rectification-networks';

function setup() { const g = nP.global(); g.fList = [1e9, 2e9]; return g; }
function close(actual, expected) { assert.ok(Math.abs(actual - expected) <= 1e-12 * Math.max(Math.abs(expected), 1e-30), `${actual} != ${expected}`); }

test('RF output selects frequency and phase units while preserving ordinary calls and source data', () => {
    setup();
    const line = nP.Tlin(), before = JSON.stringify(line), original = line.out('s21dB', 's21ang');
    const options = vm.runInNewContext('Object.freeze({units:Object.freeze({frequency:"GHz",angle:"rad"}),label:"Line"})');
    const table = line.out('s21dB', 's21ang', options);
    assert.deepEqual(table[0], ['Freq (GHz)', 'Line: s21 (dB)', 'Line: s21ang (rad)']);
    for (let row = 1; row < table.length; row++) {
        close(table[row][0], original[row][0] / 1e9);
        assert.equal(table[row][1], original[row][1]); close(table[row][2], original[row][2] * Math.PI / 180);
    }
    assert.deepEqual(line.out('s21dB', 's21ang'), original);
    assert.equal(JSON.stringify(line), before);
    assert.equal(outputUnitInfo(table).explicit, true);
    assert.equal(outputUnitInfo(original).explicit, false);
    assert.deepEqual(structuredClone(table), table);
    assert.equal(outputUnitInfo(structuredClone(table)), undefined);
});

test('noise covariance and output density use declared physical density units', () => {
    setup();
    const stage = nP.R(75), raw = stage.out('c22Re', 'c12Re', 'noiseFloor', 'NF21dB');
    const selected = stage.out('c22Re', 'c12Re', 'noiseFloor', 'NF21dB', {units: {powerDensity: 'W/Hz'}});
    for (let row = 1; row < selected.length; row++) {
        assert.equal(selected[row][1], raw[row][1]); assert.equal(selected[row][2], raw[row][2]);
        close(selected[row][3], 1e-3 * 10 ** (raw[row][3] / 10)); assert.equal(selected[row][4], raw[row][4]);
    }
    assert.ok(selected[1][2] < 0);
    assert.throws(() => stage.out('c12Re', {units: {powerDensity: 'dBm/Hz'}}), /nonnegative/);
});

test('DC and device curves share units options, including suffix overrides and undetermined observations', () => {
    setup();
    const v = nP.V(2), dc = v.solveDC();
    assert.deepEqual(dc.out('v12', {component: v, units: {voltage: 'mV'}})[1].slice(1), [2000]);
    assert.equal(dc.out('v1', {units: {voltage: 'uV'}})[1][1], 'undetermined');
    const d = nP.D(), curves = d.ivTable({vd: {points: 3}}), source = JSON.stringify(curves);
    const selected = curves.out('idmA', {units: {voltage: 'mV', current: 'uA'}});
    assert.deepEqual(selected[0], ['vd (mV)', 'id (µA)']);
    for (let row = 1; row < curves.length; row++) {
        close(selected[row][0], curves[row][0] * 1e3); close(selected[row][1], curves[row][1] * 1e6);
    }
    assert.equal(JSON.stringify(curves), source);
    const cv = d.cvTable({vr: {points: 3}}), table = cv.out('cj', 'ct', {units: {capacitance: 'pF'}});
    close(table[1][1], cv[1][1] * 1e12); assert.match(table[0][2], /pF/);
});

test('rectification converts available input power, output voltage and sensitivity without changing analysis', () => {
    setup();
    const result = singleDetector().rectify({frequencyHz: 1e9, inputPowerDbm: -70, outputNodes: ['load', 'ground']});
    const before = JSON.stringify(result);
    const table = result.out('deltaVoltage', 'sensitivityVoltsPerWatt', {units: {power: 'W', voltage: 'uV', sensitivity: 'mV/W'}});
    assert.deepEqual(table[0], ['Input (W)', 'DC change (µV)', 'Sensitivity (mV/W)']);
    close(table[1][0], 1e-10); close(table[1][1], result.deltaVoltage * 1e6); close(table[1][2], result.sensitivityVoltsPerWatt * 1e3);
    assert.equal(JSON.stringify(result), before);
});

test('waveform and PN keep legacy time defaults and support requested time/voltage units', () => {
    const g = setup(); g.tList = g.tGen(0, 6e-9, 7);
    const wave = nP.waveform({shape: 'triangle', period: 8e-9});
    const pn = nP.PN({stages: 3});
    assert.equal(wave.out()[0][0], 'Time (s)'); assert.equal(pn.out('waveform')[0][0], 'Time (ns)');
    for (const [result, sourceScale] of [[wave, 1e6], [pn, 1e-3]]) {
        const raw = result.out('waveform'), selected = result.out('waveform', {units: {time: 'us', voltage: 'mV'}});
        assert.deepEqual(selected[0].map(h => h.match(/\((.*?)\)/)[1]), ['µs', 'mV']);
        for (let row = 1; row < selected.length; row++) {
            close(selected[row][0], raw[row][0] * sourceScale); close(selected[row][1], raw[row][1] * 1e3);
        }
        assert.throws(() => result.out('samples', {units: {voltage: 'V'}}), /measurement table/);
    }
});

test('digital source/receiver tables use common options without converting bits or metadata', () => {
    const g = setup(); g.tList = g.tGen(0, 15 / 8e9, 16);
    const tx = nP.mod({mode: 'bits', bits: [0, 1]}), rx = nP.demod(tx, {noise: false});
    for (const result of [tx, rx]) {
        const raw = result.out('waveform'), selected = result.out('waveform', {units: {time: 'ps', voltage: 'mV'}});
        for (let row = 1; row < raw.length; row++) {
            close(selected[row][0], raw[row][0] * 1e3); close(selected[row][1], raw[row][1] * 1e3);
        }
        assert.throws(() => result.out('bits', {units: {voltage: 'V'}}), /measurement table/);
        assert.throws(() => result.out('settings', {units: {frequency: 'MHz'}}), /measurement table/);
    }
    const frequencies = tx.out('frequency table', {units: {frequency: 'GHz'}});
    assert.equal(frequencies[0][0], 'Bin'); assert.equal(frequencies[0][1], 'Frequency (GHz)');
    assert.deepEqual(tx.bits, [0, 1]);
    assert.deepEqual(rx.out('bits'), [0, 1]);
    assert.ok(explicitAxis([frequencies], undefined, 'chart'));
});

test('analog demodulation declares envelope volts, phase degrees and frequency deviation Hz', () => {
    const g = setup(); g.tList = g.tGen(0, 1e-6, 2);
    for (const mode of ['AM', 'FM', 'PM', 'SSB', 'DSB-SC']) {
        const tx = nP.mod({mode, carrierHz: 1e9, toneHz: 1e6, ...(['FM', 'PM'].includes(mode) ? {beta: .5} : {})});
        const rx = nP.demod(tx, {noise: false, points: 17});
        const raw = rx.out('envelope'), selected = rx.out('envelope', {units: {time: 'us', voltage: 'mV'}});
        close(selected[2][0], raw[2][0] * 1e6); close(selected[2][1], raw[2][1] * 1e3);
        if (['AM', 'FM', 'PM'].includes(mode)) {
            const phase = rx.out('phase', {units: {angle: 'rad'}});
            close(phase[2][1], rx.out('phase')[2][1] * Math.PI / 180);
            assert.match(phase[0][1], /rad/); assert.ok(!phase[0][1].includes('deg'));
        }
        if (mode === 'FM') {
            const deviation = rx.out('frequency deviation', {units: {frequency: 'kHz'}});
            close(deviation[1][1], rx.out('frequency deviation')[1][1] / 1e3);
        }
        const tones = tx.out('tones', {units: {frequency: 'GHz', voltage: 'mV', angle: 'rad'}});
        close(tones[1][0], tx.out('tones')[1][0] / 1e9);
        const received = rx.out('tones', {units: {power: 'mW', voltage: 'mV'}});
        const native = rx.out('tones');
        close(received[1][1], native[1][1] * 1e3);
        close(received[1][3], native[1][1] ** 2 / (2 * tx.referenceImpedanceOhms) * 1e3);
    }
});

test('normalized VNA and decoded-symbol waveforms are not relabeled as physical volts', () => {
    const g = setup(); g.tList = g.tGen(0, 7e-9, 8);
    const tx = nP.mod({mode: 'VNA-time'}), reference = nP.demod(tx, {noise: false});
    const rx = nP.demod(tx, {noise: false, referenceReceiver: reference});
    assert.throws(() => rx.out('waveform', {units: {voltage: 'mV'}}), /no voltage column/);
    assert.equal(rx.out('waveform', {units: {time: 'us'}})[0][1], 'Normalized response');
    g.tList = g.tGen(0, 31 / 8e9, 32);
    const qpsk = nP.mod({mode: 'QPSK', bits: [0, 1, 1, 0], carrierHz: 1e9});
    const decoded = nP.demod(qpsk, {noise: false});
    assert.equal(decoded.out('waveform', {units: {time: 'ns'}})[0][1], 'Decoded bit');
    assert.throws(() => decoded.out('waveform', {units: {voltage: 'V'}}), /no voltage column/);
});

test('VNA-frequency phase tables select frequency and angle units', () => {
    setup();
    const tx = nP.mod({mode: 'VNA-frequency', fList: [1e9, 2e9]}), line = nP.Tlin();
    const network = nP.cascade(line, {signal: tx}), rx = nP.demod(network, {noise: false});
    const raw = rx.out('response phase'), table = rx.out('response phase', {units: {frequency: 'GHz', angle: 'rad'}});
    assert.deepEqual(table[0], ['Freq (GHz)', 'Response phase (rad)']);
    close(table[1][0], 1); close(table[1][1], raw[1][1] * Math.PI / 180);
});

test('FFT scales frequency/time axes and calibrated RMS output without assigning volts to raw DFT values', () => {
    const g = setup(); g.tList = g.tGen(0, 3e-9, 4);
    const spectrum = nP.FFT([0, 1, 0, -1]), raw = spectrum.out('dBV');
    const table = spectrum.out('dBV', {floorDbv: -60, units: {frequency: 'MHz', voltage: 'mV'}});
    assert.deepEqual(table[0], ['Frequency (MHz)', 'Amplitude (mV)']);
    close(table[1][1], 1); close(table[2][1], 1e3 / Math.SQRT2);
    close(table[2][0], raw[2][0] / 1e6);
    assert.throws(() => spectrum.out('magnitude', {units: {voltage: 'V'}}), /no voltage column/);
    const recovered = nP.invFFT(spectrum), time = recovered.out('real', {units: {time: 'ns'}});
    close(time[2][0], 1); assert.deepEqual(recovered.out('real')[0], ['Time (s)', 'Real']);
});

test('invalid unit requests, impossible conversions and incompatible plot axes fail explicitly', () => {
    setup(); const part = nP.R(75), original = part.out('s21dB');
    for (const units of [null, [], 'GHz', {typo: 'GHz'}, {frequency: 'V'}, {frequency: 1}, {time: 'ns'}, {voltage: 'mV'}]) {
        assert.throws(() => part.out('s21dB', {units}));
    }
    const ghz = part.out('s21dB', {units: {frequency: 'GHz'}}), mhz = part.out('s21dB', {units: {frequency: 'MHz'}});
    assert.deepEqual(part.out('s21dB'), original);
    assert.equal(explicitAxis([ghz], undefined, 'chart').xTitle, 'Freq (GHz)');
    assert.throws(() => explicitAxis([ghz], 'giga', 'chart'), /already selected/);
    assert.throws(() => explicitAxis([ghz, mhz], undefined, 'chart'), /matching output axis units/);
    const curve = nP.D().ivTable({vd: {points: 3}});
    assert.throws(() => curve.out('id', 'idmA', {units: {current: 'mA'}}), /duplicate column headings/);
});

test('shared log/linear conversion preserves power references, zero and signed linear values', () => {
    const p = outputTable([['Input (dBm)'], [-30], [0]], [unitColumn('power', 'dBm')], {power: 'W'});
    close(p[1][0], 1e-6); close(p[2][0], 1e-3);
    const zero = outputTable([['P'], [0]], [unitColumn('power', 'W')], {power: 'dBm'});
    assert.equal(zero[1][0], -Infinity);
    const dbw = outputTable([['P'], [-3000]], [unitColumn('power', 'dBm')], {power: 'dBW'});
    assert.equal(dbw[1][0], -3030);
    const tiny = outputTable([['V'], [Number.MIN_VALUE]], [unitColumn('voltage', 'V')], {voltage: 'dBV'});
    assert.ok(Number.isFinite(tiny[1][0]));
    assert.throws(() => outputTable([['P'], [-1]], [unitColumn('power', 'W')], {power: 'dBm'}), /nonnegative/);
    assert.throws(() => outputTable([['V'], [Number.MAX_VALUE]], [unitColumn('voltage', 'V')], {voltage: 'uV'}), /numeric range/);
    assert.throws(() => outputTable([['P'], [-4000]], [unitColumn('power', 'dBm')], {power: 'W'}), /numeric range/);
});
