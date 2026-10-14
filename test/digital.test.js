// Modified: 2026-10-13
import test from 'node:test';
import assert from 'node:assert/strict';

import {global} from '../src/np-global/index.js';
import {digitalTx, digitalRx, bitErrorRate, mod, demod, PN} from '../src/np-digital/index.js';
import {Thru, Attn, Amp, nodal, cascade} from '../src/np-nport/index.js';

function withGlobal(action) {
    var previous = {fList: global.fList, Ro: global.Ro, twoTone: global.twoTone};
    global.Ro = 50;
    global.twoTone = undefined;
    try {
        return action();
    } finally {
        global.fList = previous.fList;
        global.Ro = previous.Ro;
        global.twoTone = previous.twoTone;
    }
}

function checkSamples(table, bits, samplesPerBit, scale = 1) {
    assert.equal(table.length, bits.length * samplesPerBit + 1);
    assert.deepEqual(table[0], ['Time (ns)', 'Output (V)']);
    for (var index = 0; index < bits.length * samplesPerBit; index++) {
        assert.ok(Math.abs(table[index + 1][1] - bits[Math.floor(index / samplesPerBit)] * scale) < 1e-10,
            'wrong output voltage at sample ' + index);
    }
}

test('PN7 digitalTx returns signal data and cascade reconstructs its waveform', () => {
    withGlobal(() => {
        var tx = digitalTx({mode: 'PN7', bitRate: 1e9, samplesPerBit: 8});
        assert.equal(tx.bits.length, 127);
        assert.equal(tx.bits.filter(Boolean).length, 64);
        assert.equal(tx.bits.slice(0, 8).join(''), '11111110');
        assert.equal(tx.sampleCount, 1016);
        assert.equal(tx.spectrum.length, 509);
        assert.equal(tx.out('mode'), 'PN7');
        assert.equal(tx.out('bit count'), 127);
        assert.equal(tx.out('sample count'), 1016);
        assert.equal(tx.out('frequency count'), 509);
        assert.deepEqual(tx.out('frequencies'), tx.fList);
        assert.notStrictEqual(tx.out('frequencies'), tx.fList);
        assert.equal(tx.out('spectrum').length, 509);
        assert.notStrictEqual(tx.out('spectrum')[0], tx.spectrum[0]);
        assert.equal(tx.spars, undefined);
        assert.equal(global.fList.length, 509);
        assert.equal(global.fList[0], 0);
        assert.equal(global.fList[508], 4e9);
        var thru = Thru();
        var received = digitalRx(cascade(thru, {signal: tx, inputPort: 1}), {noise: false});
        checkSamples(received.out('waveform'), tx.bits, 8);
        assert.deepEqual(received.out('bits'), tx.bits);
        assert.equal(thru.signal, undefined);
    });
});

test('PN advances on clock ticks and mod creates the FFT sampling grid', () => {
    withGlobal(() => {
        var previousTime = global.tList;
        try {
            global.tList = global.tGen(0, 126e-9, 127);
            global.fList = [];
            var pn = PN({stages: 7, time: global.tList});
            var tx = mod({input: pn});
            var stage = Attn(3, 0);
            var chain = cascade(stage, {signal: tx});

            assert.equal(pn.out('bit count'), 127);
            assert.equal(pn.out('sample count'), 127);
            assert.equal(pn.samplesPerBit, 1);
            assert.equal(pn.out('waveform').length, 128);
            assert.ok(Math.abs(pn.out('clock rate') - 1e9) < 1e-5);
            assert.equal(tx.sampleCount, 1016);
            assert.equal(tx.samplesPerBit, 8);
            assert.equal(tx.fList.length, 509);
            var frequencyTable = tx.out('frequency table');
            assert.deepEqual(frequencyTable[0], ['Bin', 'Frequency (Hz)']);
            assert.equal(frequencyTable.length, tx.out('frequency count') + 1);
            assert.deepEqual(frequencyTable[1], [0, 0]);
            assert.deepEqual(frequencyTable[509], [508, tx.fList[508]]);
            assert.equal(tx.time.length, 1016);
            assert.equal(tx.out('settings').mode, 'PN7');
            assert.deepEqual(tx.bits, pn.bits);
            assert.deepEqual(global.fList, tx.fList);
            assert.deepEqual(stage.getglobal().fList, tx.fList);
            assert.deepEqual(stage.getglobal().tList, pn.time);
            assert.deepEqual(demod(chain, {noise: false}).out('bits'), pn.bits);
            var fourSamples = mod({input: pn, samplesPerBit: 4});
            assert.equal(fourSamples.sampleCount, 508);
            assert.equal(fourSamples.fList.length, 255);
            assert.throws(() => PN({stages: 17, time: global.tList}), /2 through 16/);
            assert.throws(() => PN({stages: 7, time: [0, 1, 2]}), /multiple of 127/);
        } finally {
            global.tList = previousTime;
        }
    });
});

test('selectable PN lengths produce full periods and pass through mod and demod', () => {
    withGlobal(() => {
        var previousTime = global.tList;
        try {
            Array.from({length: 15}, function (_, index) { return index + 2; }).forEach(function (stages) {
                var period = 2 ** stages - 1;
                var time = global.tGen(0, (period - 1) * 1e-9, period);
                var pn = PN({stages: stages, time: time});
                assert.equal(pn.mode, 'PN' + stages);
                assert.equal(pn.out('bit count'), period);
                assert.equal(pn.bits.filter(Boolean).length, 2 ** (stages - 1));
                assert.throws(() => PN({stages: stages, time: time.slice(1)}),
                    new RegExp('multiple of ' + period));
            });
            global.tList = global.tGen(0, 6e-9, 7);
            var pn3 = PN({stages: 3, time: global.tList});
            var tx = mod({input: pn3, carrierHz: 200e6});
            assert.equal(tx.out('mode'), 'PN3');
            assert.equal(tx.out('sample count'), 56);
            assert.equal(tx.out('frequency count'), 29);
            assert.deepEqual(demod(cascade(Thru(), {signal: tx}), {noise: false}).out('bits'), pn3.bits);
            var shortcut = mod({mode: 'PN3'});
            assert.deepEqual(shortcut.bits, pn3.bits);
            assert.equal(shortcut.out('frequency count'), 29);
            assert.throws(() => mod({mode: 'PN17'}), /2 through 16/);
            assert.throws(() => PN({stages: 3, time: global.tList, seed: 0}), /nonzero/);
        } finally {
            global.tList = previousTime;
        }
    });
});

test('200 MHz PN carrier survives an attenuator and coherent demodulation', () => {
    withGlobal(() => {
        var previousTime = global.tList;
        try {
            global.tList = global.tGen(0, 126e-9, 127);
            global.fList = [];
            var pn = PN({stages: 7, time: global.tList});
            var tx = mod({input: pn, carrierHz: 200e6});
            var attenuator = Attn(3, 0);
            var cascaded = cascade(attenuator, {signal: tx});
            var connected = nodal(
                [attenuator, 1, 2],
                ['out', 1, 2],
                {signal: tx, inputPort: 1}
            );

            assert.equal(tx.out('settings').carrierHz, 200e6);
            assert.equal(tx.out('waveform').length, 1017);
            assert.equal(cascaded.signal.carrierHz, 200e6);
            assert.equal(connected.signal.carrierHz, 200e6);
            assert.deepEqual(global.fList, tx.fList);
            assert.deepEqual(demod(cascaded, {noise: false}).out('bits'), pn.bits);
            assert.deepEqual(demod(connected, {noise: false}).out('bits'), pn.bits);
            assert.equal(demod(cascaded, {noise: false}).out('carrier waveform').length, 1017);
            assert.equal(bitErrorRate(tx, cascaded, {receiver: demod, noise: false, receptions: 1}), 0);
            assert.throws(() => mod({input: pn, carrierHz: 4.1e9}), /Nyquist/);
            var ascii = mod({mode: 'ASCII', message: 'hello', carrierHz: 200e6});
            assert.equal(demod(cascade(Thru(), {signal: ascii}), {noise: false}).out('ASCII text'), 'hello');
        } finally {
            global.tList = previousTime;
        }
    });
});

test('0 Hz mod and demod match digitalTx and digitalRx for ASCII and PN7', () => {
    withGlobal(() => {
        for (var source of [
            {mode: 'ASCII', message: 'hello', bitRate: 1e9, samplesPerBit: 8, highVolts: 1e-3},
            {mode: 'PN7', bitRate: 1e9, samplesPerBit: 8, highVolts: 1e-3}
        ]) {
            var original = digitalTx(source);
            var replacement = mod({...source, carrierHz: 0});
            assert.deepEqual(replacement.bits, original.bits);
            assert.deepEqual(replacement.fList, original.fList);
            assert.deepEqual(replacement.spectrum.map(value => [value.getR(), value.getI()]),
                original.spectrum.map(value => [value.getR(), value.getI()]));
            assert.equal(replacement.out('settings').carrierHz, 0);
            assert.equal(replacement.out('settings').bitRate, source.bitRate);
            assert.equal(replacement.out('settings').frequencyCount, original.out('frequency count'));
            var oldChain = cascade(Thru(), {signal: original});
            var newChain = cascade(Thru(), {signal: replacement});
            assert.equal(newChain.signal.carrierHz, 0);
            assert.deepEqual(demod(newChain, {noise: false}).out('bits'),
                digitalRx(oldChain, {noise: false}).out('bits'));
            assert.equal(bitErrorRate(replacement, newChain, {
                receiver: demod, noise: false, receptions: 1
            }), 0);
        }
    });
});

test('mod fills independent FFT lists for two circuits without changing the global default', () => {
    withGlobal(() => {
        global.fList = [2e9];
        var firstFftList = [];
        var secondFftList = [];
        var firstTx = mod({mode: 'PN7', fftList: firstFftList});
        var firstChain = nodal(
            [Attn({attenuationDb: 0, temperature: 0, fList: firstFftList}), 1, 2],
            ['out', 1, 2],
            {signal: firstTx, inputPort: 1}
        );
        var firstFrequencies = firstFftList.slice();
        var secondTx = mod({mode: 'ASCII', message: 'hello', fftList: secondFftList});
        var secondChain = cascade(Thru({fList: secondFftList}), {signal: secondTx});

        assert.deepEqual(global.fList, [2e9]);
        assert.equal(firstFftList.length, 509);
        assert.equal(secondFftList.length, 161);
        assert.deepEqual(firstFftList, firstFrequencies);
        assert.deepEqual(firstTx.out('frequencies'), firstFftList);
        assert.deepEqual(secondTx.out('frequencies'), secondFftList);
        assert.notStrictEqual(firstTx.fList, firstFftList);
        assert.notStrictEqual(secondTx.fList, secondFftList);
        assert.deepEqual(firstChain.getglobal().fList, firstFftList);
        assert.deepEqual(secondChain.getglobal().fList, secondFftList);
        assert.deepEqual(demod(firstChain, {noise: false}).out('bits'), firstTx.bits);
        assert.equal(demod(secondChain, {noise: false}).out('ASCII text'), 'hello');
        assert.throws(() => cascade(Thru({fList: firstFftList}), Thru({fList: secondFftList})),
            /matching frequency rows/);
    });
});

test('mod can fill global.fList in place when it is explicitly selected', () => {
    withGlobal(() => {
        global.fList = [];
        var fftList = global.fList;
        var tx = mod({mode: 'bits', bits: '1010', fftList: fftList});
        assert.strictEqual(global.fList, fftList);
        assert.deepEqual(fftList, tx.out('frequencies'));
        assert.deepEqual(demod(cascade(Thru(), {signal: tx}), {noise: false}).out('bits'), tx.bits);
        assert.throws(() => mod({mode: 'PN7', fftList: {}}), /fftList must be an array/);
    });
});

test('two mod circuits follow the default global frequency workflow', () => {
    withGlobal(() => {
        var g = global;
        g.fList = [];
        var firstList = g.fList;
        var firstTx = mod({mode: 'PN7', fftList: g.fList});
        var firstStage = Attn(0, 0);
        var firstChain = cascade(firstStage, {signal: firstTx});

        g.fList = [];
        var secondList = g.fList;
        var secondTx = mod({mode: 'ASCII', message: 'hello', fftList: g.fList});
        var secondStage = Thru();
        var secondChain = nodal(
            [secondStage, 1, 2],
            ['out', 1, 2],
            {signal: secondTx, inputPort: 1}
        );

        assert.notStrictEqual(firstList, secondList);
        assert.equal(firstList.length, 509);
        assert.equal(secondList.length, 161);
        assert.deepEqual(firstStage.getglobal().fList, firstList);
        assert.deepEqual(firstChain.getglobal().fList, firstList);
        assert.deepEqual(secondStage.getglobal().fList, secondList);
        assert.deepEqual(secondChain.getglobal().fList, secondList);
        assert.deepEqual(demod(firstChain, {noise: false}).out('bits'), firstTx.bits);
        assert.equal(demod(secondChain, {noise: false}).out('ASCII text'), 'hello');
    });
});

test('nodal carries driven signal when its result is reused', () => {
    withGlobal(() => {
        var tx = digitalTx({mode: 'PN7'});
        var thru = Thru();
        var first = nodal(
            [thru, 1, 2],
            ['out', 1, 2],
            {signal: tx, inputPort: 1}
        );
        var second = nodal(
            [first, 1, 2],
            [thru, 2, 3],
            ['out', 1, 3]
        );
        checkSamples(digitalRx(first, {noise: false}).out('waveform'), tx.bits, 8);
        checkSamples(digitalRx(second, {noise: false}).out('waveform'), tx.bits, 8);
        checkSamples(digitalRx(cascade(first, thru), {noise: false}).out('waveform'), tx.bits, 8);
    });
});

test('cascade propagates deterministic amplitude through an attenuator', () => {
    withGlobal(() => {
        var tx = digitalTx({mode: 'bits', bits: '10110010', samplesPerBit: 4});
        var attenuationDb = 6;
        var chain = cascade(Thru(), Attn(attenuationDb, 0), {signal: tx});
        checkSamples(digitalRx(chain, {noise: false}).out('waveform'), tx.bits, 4, 10 ** (-attenuationDb / 20));
    });
});

test('ASCII and raw 96-bit modes generate the requested bytes and bits', () => {
    withGlobal(() => {
        var ascii = digitalTx({mode: 'ASCII', message: 'hello, world', samplesPerBit: 2});
        assert.equal(ascii.bits.length, 96);
        assert.equal(ascii.out('mode'), 'ASCII');
        assert.equal(ascii.out('bit count'), 96);
        assert.equal(ascii.out('frequency count'), 97);
        assert.equal(ascii.bits.slice(0, 8).join(''), '01101000');
        var asciiChain = cascade(Thru(), {signal: ascii});
        var Rxout = digitalRx(asciiChain, {noise: false});
        assert.equal(Rxout.out('bit count'), 96);
        assert.equal(Rxout.out('sample count'), 192);
        assert.equal(Rxout.out('frequency count'), 97);
        assert.deepEqual(Rxout.out('frequencies'), ascii.fList);
        assert.notStrictEqual(Rxout.out('frequencies'), ascii.fList);
        assert.equal(Rxout.out('spectrum').length, 97);
        assert.ok(Math.abs(Rxout.out('spectrum')[0].getR() - ascii.spectrum[0].getR()) < 1e-9);
        assert.notStrictEqual(Rxout.out('spectrum')[0], Rxout.out('spectrum')[0]);
        checkSamples(Rxout.out('waveform'), ascii.bits, 2);
        assert.deepEqual(Rxout.out(), Rxout.out('waveform'));
        assert.equal(Rxout.out('ASCII text'), 'hello, world');
        var nested = nodal(
            [asciiChain, 1, 2],
            [Thru(), 2, 3],
            ['out', 1, 3]
        );
        assert.equal(digitalRx(nested, {noise: false}).out('ASCII text'), 'hello, world');
        var raw = digitalTx({mode: 'bits', bits: '01'.repeat(48), samplesPerBit: 2});
        assert.equal(raw.bits.length, 96);
        assert.equal(raw.out('mode'), 'bits');
        checkSamples(digitalRx(cascade(Thru(), {signal: raw}), {noise: false}).out('waveform'), raw.bits, 2);
    });
});

test('raised source noise gives roughly ten percent errors over repeated receptions', () => {
    withGlobal(() => {
        var message = 'now is the time for all good men to come to the aid of their country';
        var tx = digitalTx({mode: 'ASCII', message: message, samplesPerBit: 8});
        assert.equal(tx.out('frequency count'), 2177);
        var chain = cascade(Thru(), {signal: tx});
        var totalErrors = 0;
        var trials = 20;
        for (var trial = 0; trial < trials; trial++) {
            var waveform = digitalRx(chain, {
                thresholdVolts: 0.5,
                referenceTemperature: 5.5126e10
            }).out('waveform');
            for (var bit = 0; bit < tx.bits.length; bit++) {
                var sample = waveform[1 + bit * tx.samplesPerBit + tx.samplesPerBit / 2][1];
                if ((sample > 0.5 ? 1 : 0) !== tx.bits[bit]) totalErrors++;
            }
        }
        var errorRate = totalErrors / (trials * tx.bits.length);
        assert.ok(errorRate > 0.07 && errorRate < 0.13, 'unexpected bit-error rate: ' + errorRate);
    });
});

test('290 K attenuator sets BER near one percent for a 1 mV signal', () => {
    withGlobal(() => {
        var message = 'now is the time for all good men to come to the aid of their country';
        var tx = digitalTx({mode: 'ASCII', message: message, highVolts: 1e-3});
        var chain = nodal(
            [Attn(17.6, 290), 1, 2],
            ['out', 1, 2],
            {signal: tx, inputPort: 1}
        );
        var ber = bitErrorRate(tx, chain, {receptions: 100});
        assert.ok(ber > 0.006 && ber < 0.014, 'unexpected BER: ' + ber);
        assert.equal(bitErrorRate(tx, chain, {noise: false, receptions: 1}), 0);
    });
});

test('ASCII reception recovers a longer message through an attenuator', () => {
    withGlobal(() => {
        var message = 'now is the time for all good men to come to the aid of their country';
        var tx = digitalTx({mode: 'ASCII', message: message, samplesPerBit: 8});
        var chain = cascade(Thru(), Attn(6, 0), {signal: tx});
        assert.equal(chain.signal.samplesPerBit, 8);
        assert.equal(digitalRx(chain, {noise: false}).out('ASCII text'), message);
    });
});

test('digitalRx draws fresh thermal noise at the calculated output noise level', () => {
    withGlobal(() => {
        var tx = digitalTx({mode: 'bits', bits: '0'.repeat(128), samplesPerBit: 8});
        var chain = cascade(Thru(), {signal: tx});
        var floorBefore = chain.out('noiseFloor');
        var first = digitalRx(chain).out('waveform');
        var second = digitalRx(chain).out('waveform');
        var floorAfter = chain.out('noiseFloor');
        assert.deepEqual(floorAfter, floorBefore);
        assert.notDeepEqual(second, first);
        var meanSquare = first.slice(1).reduce(function (total, row) {
            return total + row[1] ** 2;
        }, 0) / tx.sampleCount;
        var expectedRms = Math.sqrt(1.380649e-23 * 290 * 50 * tx.sampleRateHz / 2);
        assert.ok(Math.sqrt(meanSquare) > expectedRms * 0.75);
        assert.ok(Math.sqrt(meanSquare) < expectedRms * 1.25);
    });
});

test('amplifier noise samples follow its output noise floor', () => {
    withGlobal(() => {
        var tx = digitalTx({mode: 'bits', bits: '0'.repeat(128), samplesPerBit: 8});
        var chain = cascade(Amp(20, 4), {signal: tx});
        var densityDbmHz = chain.out('noiseFloor')[1][1];
        var densityWattsHz = 1e-3 * 10 ** (densityDbmHz / 10);
        var expectedRms = Math.sqrt(densityWattsHz * 50 * tx.sampleRateHz / 2);
        var waveform = digitalRx(chain).out('waveform');
        var meanSquare = waveform.slice(1).reduce(function (total, row) {
            return total + row[1] ** 2;
        }, 0) / tx.sampleCount;
        assert.ok(Math.sqrt(meanSquare) > expectedRms * 0.75);
        assert.ok(Math.sqrt(meanSquare) < expectedRms * 1.25);
    });
});

test('a weak ASCII signal can acquire bit errors from default receiver noise', () => {
    withGlobal(() => {
        var message = 'now is the time for all good men to come to the aid of their country';
        var tx = digitalTx({mode: 'ASCII', message: message, highVolts: 80e-6});
        var chain = cascade(Thru(), {signal: tx});
        assert.equal(digitalRx(chain, {noise: false}).out('ASCII text'), message);
        assert.notEqual(digitalRx(chain, {thresholdVolts: 40e-6}).out('ASCII text'), message);
    });
});

test('digital helpers reject invalid signal descriptions and missing signal', () => {
    withGlobal(() => {
        assert.throws(() => digitalTx({mode: 'PN7', seed: 0}), RangeError);
        assert.throws(() => digitalTx({mode: 'ASCII', message: 'é'}), RangeError);
        assert.throws(() => digitalTx({mode: 'bits', bits: '0102'}), TypeError);
        assert.throws(() => digitalTx().out('unknown'), RangeError);
        assert.throws(() => digitalRx(Thru()), TypeError);
        var tx = digitalTx({mode: 'bits', bits: '10'});
        assert.throws(() => cascade(Thru(), {signal: tx, inputPort: 3}), RangeError);
        assert.throws(() => digitalRx(cascade(Thru(), {signal: tx}), {outputPort: 3}), RangeError);
        assert.throws(() => digitalRx(cascade(Thru(), {signal: tx})).out('ASCII text'), RangeError);
        assert.throws(() => digitalRx(cascade(Thru(), {signal: tx}), {mode: 'ASCII'}), RangeError);
        assert.throws(() => digitalRx(cascade(Thru(), {signal: tx})).out('unknown'), RangeError);
        assert.throws(() => digitalRx(cascade(Thru(), {signal: tx}), {noise: 'yes'}), TypeError);
        assert.throws(() => bitErrorRate(tx, cascade(Thru(), {signal: tx}), {receptions: 0}), RangeError);
        assert.throws(() => mod({carrierHz: -1}), RangeError);
        assert.throws(() => bitErrorRate(tx, cascade(Thru(), {signal: tx}), {receiver: 1}), TypeError);
    });
});
