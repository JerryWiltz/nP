// Modified: 2026-10-15
import test from 'node:test';
import assert from 'node:assert/strict';

import {global} from '../src/np-global/index.js';
import {mod, demod, bitErrorRate, PN} from '../src/np-digital/index.js';
import {Thru, Attn, Amp, nodal, cascade} from '../src/np-nport/index.js';
import {nPort} from '../src/np-nport/src/nPort.js';
import {complex} from '../src/np-math/src/complex.js';

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

test('PN7 mod returns signal data and cascade reconstructs its waveform', () => {
    withGlobal(() => {
        var tx = mod({mode: 'PN7', bitRate: 1e9, samplesPerBit: 8});
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
        var received = demod(cascade(thru, {signal: tx, inputPort: 1}), {noise: false});
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

test('demod accepts a mod source directly, using its original grid and impedance', () => {
    withGlobal(() => {
        global.Ro = 75;
        for (var carrierHz of [0, 200e6]) {
            var tx = mod({mode: 'ASCII', message: 'hello', carrierHz});
            var through = cascade(Thru({fList: tx.fList}), {signal: tx});
            global.Ro = 50;
            global.fList = [2e9];

            var direct = demod(tx, {noise: false});
            var viaThru = demod(through, {noise: false});
            assert.equal(direct.out('ASCII text'), 'hello');
            assert.deepEqual(direct.out('waveform'), viaThru.out('waveform'));
            assert.deepEqual(direct.out('bits'), viaThru.out('bits'));
            assert.deepEqual(direct.out('frequencies'), tx.fList);
            assert.deepEqual(global.fList, [2e9]);
            assert.equal(tx.referenceImpedanceOhms, 75);
            assert.equal(demod(tx).out('waveform').length, tx.sampleCount + 1);
            global.Ro = 75;
        }
    });
});

test('mod defaults to a 0 Hz carrier for ASCII and PN7', () => {
    withGlobal(() => {
        for (var source of [
            {mode: 'ASCII', message: 'hello', bitRate: 1e9, samplesPerBit: 8, highVolts: 1e-3},
            {mode: 'PN7', bitRate: 1e9, samplesPerBit: 8, highVolts: 1e-3}
        ]) {
            var implicit = mod(source);
            var explicit = mod({...source, carrierHz: 0});
            assert.deepEqual(implicit.bits, explicit.bits);
            assert.deepEqual(implicit.fList, explicit.fList);
            assert.deepEqual(implicit.spectrum.map(value => [value.getR(), value.getI()]),
                explicit.spectrum.map(value => [value.getR(), value.getI()]));
            assert.equal(implicit.out('settings').carrierHz, 0);
            assert.equal(implicit.out('settings').bitRate, source.bitRate);
            assert.equal(implicit.out('settings').frequencyCount, explicit.out('frequency count'));
            var chain = cascade(Thru(), {signal: implicit});
            assert.equal(chain.signal.carrierHz, 0);
            assert.deepEqual(demod(chain, {noise: false}).out('bits'), implicit.bits);
            assert.equal(bitErrorRate(implicit, chain, {noise: false, receptions: 1}), 0);
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
        var tx = mod({mode: 'PN7'});
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
        checkSamples(demod(first, {noise: false}).out('waveform'), tx.bits, 8);
        checkSamples(demod(second, {noise: false}).out('waveform'), tx.bits, 8);
        checkSamples(demod(cascade(first, thru), {noise: false}).out('waveform'), tx.bits, 8);
    });
});

test('ten nodal blocks combine in a final nodal with one input signal', () => {
    withGlobal(() => {
        var tx = mod({mode: 'PN3', samplesPerBit: 4});
        var blocks = Array.from({length: 10}, function () {
            return nodal(
                [Thru(), 1, 2],
                [Attn(1, 0), 2, 3],
                ['out', 1, 3]
            );
        });
        var connections = blocks.map(function (block, index) {
            return [block, index + 1, index + 2];
        });
        connections.push(['out', 1, 11]);
        connections.push({signal: tx, inputPort: 1});
        var chain = nodal(...connections);
        var viaCascade = cascade(...blocks, {signal: tx, inputPort: 1});

        assert.ok(blocks.every(function (block) { return block.signal === undefined; }));
        assert.equal(chain.signal.rows.length, tx.fList.length);
        checkSamples(demod(chain, {noise: false}).out('waveform'), tx.bits, 4, 10 ** (-10 / 20));
        assert.deepEqual(demod(chain, {noise: false}).out('bits'), tx.bits);
        assert.deepEqual(chain.out('s21dB'), viaCascade.out('s21dB'));
    });
});

test('single-tone AM uses three frequencies and exposes sidebands and AM-to-PM', () => {
    withGlobal(() => {
        global.fList = [];
        var tx = mod({mode: 'AM', carrierHz: 200e6, toneHz: 300,
            modulationIndex: 0.5, carrierAmplitudeVolts: 1});
        assert.deepEqual(global.fList, [200e6 - 300, 200e6, 200e6 + 300]);
        assert.equal(tx.out('frequency count'), 3);
        assert.deepEqual(tx.out('tones').slice(1).map(function (row) { return row[1]; }),
            [0.25, 1, 0.25]);

        var through = nodal([Thru(), 1, 2], ['out', 1, 2], {signal: tx});
        assert.deepEqual(through.out('signal2V').slice(1).map(function (row) { return row[1]; }),
            [0.25, 1, 0.25]);
        assert.ok(demod(through).out('amToPmDeg') < 1e-10);
        var flatEnvelope = demod(through).out('envelope');
        assert.ok(Math.abs(flatEnvelope[1][1] - 1.5) < 1e-12);
        assert.ok(Math.abs(flatEnvelope[501][1] - 0.5) < 1e-12);
        assert.deepEqual(demod(tx).out('tones'), demod(through).out('tones'));

        var filter = new nPort();
        filter.setspars(global.fList.map(function (frequency, index) {
            var response = [0.8, 1, 0.2][index];
            return [frequency, complex(0, 0), complex(response, 0),
                complex(response, 0), complex(0, 0)];
        }));
        filter.setglobal(global);
        var viaNodal = nodal([filter, 1, 2], ['out', 1, 2], {signal: tx});
        var viaCascade = cascade(filter, {signal: tx});
        assert.deepEqual(viaNodal.out('signal2V', 'signal2Deg'),
            viaCascade.out('signal2V', 'signal2Deg'));
        viaNodal.out('signal2V').slice(1).forEach(function (row, index) {
            assert.ok(Math.abs(row[1] - [0.2, 1, 0.05][index]) < 1e-12);
        });
        assert.ok(demod(viaNodal).out('amToPmDeg') > 8);
        assert.equal(demod(viaNodal).out('phase').length, 1002);
        var nested = nodal(
            [viaNodal, 1, 2],
            [Thru(), 2, 3],
            ['out', 1, 3]
        );
        assert.equal(nested.signal.mode, 'AM');
        assert.ok(Math.abs(demod(nested).out('amToPmDeg') -
            demod(viaNodal).out('amToPmDeg')) < 1e-10);
        assert.throws(() => demod(viaNodal, {noise: true}), /random noise/);
        assert.throws(() => mod({mode: 'AM', carrierHz: 200e6, toneHz: 1e6,
            modulationIndex: 1.1}), RangeError);
    });
});

test('single-tone FM adds sidebands as beta grows and demodulates deviation', () => {
    withGlobal(() => {
        global.fList = [];
        var carrierOnly = mod({mode: 'FM', carrierHz: 200e6, toneHz: 300, beta: 0});
        assert.deepEqual(carrierOnly.fList, [200e6]);

        var tx = mod({mode: 'FM', carrierHz: 200e6, toneHz: 300, beta: 1});
        assert.equal(tx.sidebandOrder, 4);
        assert.equal(tx.out('frequency count'), 9);
        assert.deepEqual(global.fList, tx.fList);
        assert.ok(Math.abs(tx.spectrum[4].getR() - 0.7651976866) < 1e-9);
        assert.ok(Math.abs(tx.spectrum[3].getR() + tx.spectrum[5].getR()) < 1e-12);
        assert.equal(tx.out('settings').frequencyDeviationHz, 300);
        var through = nodal([Thru(), 1, 2], ['out', 1, 2], {signal: tx});
        var viaCascade = cascade(Thru(), {signal: tx});
        assert.deepEqual(through.out('signal2V', 'signal2Deg'),
            viaCascade.out('signal2V', 'signal2Deg'));
        var rx = demod(through);
        assert.ok(Math.abs(rx.out('peak frequency deviation Hz') - 300) < 1);
        var envelope = rx.out('envelope').slice(1).map(function (row) { return row[1]; });
        assert.ok(Math.max(...envelope) - Math.min(...envelope) < 0.001);
        assert.equal(rx.out('frequency deviation').length, 1002);
        assert.deepEqual(demod(tx).out('tones'), rx.out('tones'));

        var nested = nodal([through, 1, 2], [Thru(), 2, 3], ['out', 1, 3]);
        assert.equal(nested.signal.mode, 'FM');
        assert.equal(nested.signal.sidebandOrder, 4);
        assert.ok(Math.abs(demod(nested).out('peak frequency deviation Hz') -
            rx.out('peak frequency deviation Hz')) < 1e-8);

        var wide = mod({mode: 'FM', carrierHz: 200e6, toneHz: 300, beta: 20});
        assert.ok(wide.out('frequency count') > tx.out('frequency count'));
        assert.throws(() => demod(through, {noise: true}), /random receiver noise/);
        assert.throws(() => mod({mode: 'FM', carrierHz: 200e6, toneHz: 300, beta: -1}), RangeError);
    });
});

test('single-tone PM carries phase sidebands through nPorts and recovers phase swing', () => {
    withGlobal(() => {
        global.fList = [];
        var tx = mod({mode: 'PM', carrierHz: 200e6, toneHz: 300, beta: 1});
        assert.equal(tx.out('settings').peakPhaseRadians, 1);
        assert.equal(tx.out('frequency count'), 9);
        assert.ok(Math.abs(tx.spectrum[4].getR() - 0.7651976866) < 1e-9);
        assert.ok(Math.abs(tx.spectrum[3].getI() - 0.4400505857) < 1e-9);
        assert.ok(Math.abs(tx.spectrum[5].getI() - 0.4400505857) < 1e-9);
        var through = nodal([Thru(), 1, 2], ['out', 1, 2], {signal: tx});
        var viaCascade = cascade(Thru(), {signal: tx});
        assert.deepEqual(through.out('signal2V', 'signal2Deg'),
            viaCascade.out('signal2V', 'signal2Deg'));
        var rx = demod(through);
        assert.ok(Math.abs(rx.out('peak phase deviation radians') - 1) < 0.01);
        assert.ok(Math.abs(rx.out('peak frequency deviation Hz') - 300) < 1);
        assert.ok(Math.abs(rx.out('phase')[1][1] - 180 / Math.PI) < 1);
        assert.deepEqual(demod(tx).out('tones'), rx.out('tones'));
        var nested = nodal([through, 1, 2], [Thru(), 2, 3], ['out', 1, 3]);
        assert.equal(nested.signal.mode, 'PM');
        assert.ok(Math.abs(demod(nested).out('peak phase deviation radians') -
            rx.out('peak phase deviation radians')) < 1e-8);
        assert.ok(mod({mode: 'PM', carrierHz: 200e6, toneHz: 300, beta: 20})
            .out('frequency count') > tx.out('frequency count'));
        assert.throws(() => mod({mode: 'PM', carrierHz: 200e6, toneHz: 300, beta: -1}), RangeError);
        assert.throws(() => demod(through, {noise: true}), /random receiver noise/);
    });
});

test('explicit OOK and ASK modes retain their bit source and decode through nPorts', () => {
    withGlobal(() => {
        var ook = mod({mode: 'OOK', carrierHz: 200e6, message: 'Hi'});
        assert.equal(ook.out('mode'), 'OOK');
        assert.equal(ook.out('settings').dataMode, 'ASCII');
        assert.equal(ook.lowVolts, 0);
        assert.equal(ook.highVolts, 1);
        var ookChain = nodal(
            [Thru(), 1, 2],
            ['out', 1, 2],
            {signal: ook}
        );
        var ookRx = demod(ookChain, {noise: false});
        assert.equal(ookRx.out('mode'), 'OOK');
        assert.equal(ookRx.out('data mode'), 'ASCII');
        assert.equal(ookRx.out('ASCII text'), 'Hi');
        assert.equal(demod(ook, {noise: false}).out('ASCII text'), 'Hi');
        assert.equal(bitErrorRate(ook, ookChain, {noise: false, receptions: 1}), 0);

        var ask = mod({mode: 'ASK', carrierHz: 200e6, dataMode: 'bits', bits: '010110'});
        assert.equal(ask.out('mode'), 'ASK');
        assert.equal(ask.out('settings').dataMode, 'bits');
        assert.equal(ask.lowVolts, 0.5);
        assert.equal(ask.highVolts, 1);
        var askRx = demod(cascade(Attn(3, 0), {signal: ask}), {noise: false});
        assert.equal(askRx.out('mode'), 'ASK');
        assert.deepEqual(askRx.out('bits'), ask.bits);

        var pn = PN({stages: 3, time: global.tGen(0, 6e-9, 7)});
        var pnAsk = mod({mode: 'ASK', carrierHz: 200e6, input: pn});
        assert.equal(pnAsk.out('settings').dataMode, 'PN3');
        assert.deepEqual(demod(cascade(Thru(), {signal: pnAsk}),
            {noise: false}).out('bits'), pn.bits);

        assert.throws(() => mod({mode: 'OOK'}), RangeError);
        assert.throws(() => mod({mode: 'OOK', carrierHz: 200e6, lowVolts: 0.1}), RangeError);
        assert.throws(() => mod({mode: 'ASK', carrierHz: 200e6, lowVolts: 0}), RangeError);
    });
});

test('continuous-phase binary FSK survives nodal and cascade without a carrier phase reference', () => {
    withGlobal(() => {
        var tx = mod({mode: 'FSK', carrierHz: 200e6, bitRate: 10e6,
            samplesPerBit: 64, message: 'Hi'});
        assert.equal(tx.out('settings').frequencyDeviationHz, 5e6);
        assert.deepEqual([tx.out('settings').lowFrequencyHz,
            tx.out('settings').highFrequencyHz], [195e6, 205e6]);
        assert.equal(tx.out('frequency count'), 513);
        var viaNodal = nodal([Attn(3, 0), 1, 2], ['out', 1, 2], {signal: tx});
        var viaCascade = cascade(Attn(3, 0), {signal: tx});
        assert.equal(demod(viaNodal, {noise: false}).out('ASCII text'), 'Hi');
        assert.equal(demod(viaCascade, {noise: false}).out('ASCII text'), 'Hi');
        assert.equal(demod(tx, {noise: false}).out('ASCII text'), 'Hi');
        assert.deepEqual(demod(viaNodal, {noise: false}).out('bits'), tx.bits);
        assert.equal(demod(viaNodal, {noise: false}).out('tone energies').length, 17);
        var nested = nodal([viaNodal, 1, 2], [Thru(), 2, 3], ['out', 1, 3]);
        assert.equal(demod(nested, {noise: false}).out('ASCII text'), 'Hi');

        var raw = mod({mode: 'FSK', carrierHz: 200e6, bitRate: 10e6,
            samplesPerBit: 64, dataMode: 'bits', bits: '011010'});
        assert.deepEqual(demod(cascade(Thru(), {signal: raw}), {noise: false})
            .out('bits'), raw.bits);
        assert.throws(() => mod({mode: 'FSK', carrierHz: 200e6, bitRate: 10e6,
            samplesPerBit: 64, bits: '01', frequencyDeviationHz: 0}), RangeError);
        assert.throws(() => mod({mode: 'FSK', carrierHz: 200e6, bitRate: 10e6,
            samplesPerBit: 64, bits: '01', frequencyDeviationHz: 200e6}), RangeError);
    });
});

test('binary PSK recovers mixed and constant bits with a coherent carrier reference', () => {
    withGlobal(() => {
        var tx = mod({mode: 'PSK', carrierHz: 200e6, bitRate: 10e6,
            samplesPerBit: 64, message: 'Hi'});
        assert.equal(tx.out('settings').phaseZeroDeg, 180);
        assert.equal(tx.out('settings').phaseOneDeg, 0);
        assert.equal(tx.out('frequency count'), 513);
        var viaNodal = nodal([Attn(3, 0), 1, 2], ['out', 1, 2], {signal: tx});
        var viaCascade = cascade(Attn(3, 0), {signal: tx});
        assert.equal(demod(viaNodal, {noise: false}).out('ASCII text'), 'Hi');
        assert.equal(demod(viaCascade, {noise: false}).out('ASCII text'), 'Hi');
        assert.equal(demod(tx, {noise: false}).out('ASCII text'), 'Hi');
        var nested = nodal([viaNodal, 1, 2], [Thru(), 2, 3], ['out', 1, 3]);
        assert.equal(demod(nested, {noise: false}).out('ASCII text'), 'Hi');

        for (var pattern of ['00000000', '11111111']) {
            var constant = mod({mode: 'PSK', carrierHz: 200e6, bitRate: 10e6,
                samplesPerBit: 64, bits: pattern});
            assert.equal(demod(cascade(Thru(), {signal: constant}), {noise: false})
                .out('bits').join(''), pattern);
        }
        assert.throws(() => mod({mode: 'PSK', bits: '01'}), RangeError);
        assert.throws(() => mod({mode: 'PSK', carrierHz: 200e6, bits: '01',
            carrierAmplitudeVolts: 0}), RangeError);
    });
});

test('Manchester PSK reverses phase mid-bit and suppresses the carrier', () => {
    withGlobal(() => {
        var tx = mod({mode: 'PSK', encoding: 'Manchester', carrierHz: 200e6,
            bitRate: 10e6, samplesPerBit: 64, message: 'Hi'});
        assert.equal(tx.out('settings').encoding, 'Manchester');
        assert.equal(tx.out('frequency count'), 513);
        var carrierBin = tx.fList.indexOf(200e6);
        assert.ok(carrierBin >= 0);
        assert.ok(tx.spectrum[carrierBin].mag() < 1e-9);
        assert.ok(Math.abs(tx.samples[0] + tx.samples[32]) < 1e-9);
        var viaNodal = nodal([Attn(3, 0), 1, 2], ['out', 1, 2], {signal: tx});
        var viaCascade = cascade(Attn(3, 0), {signal: tx});
        assert.equal(demod(viaNodal, {noise: false}).out('ASCII text'), 'Hi');
        assert.equal(demod(viaCascade, {noise: false}).out('ASCII text'), 'Hi');
        assert.equal(demod(tx, {noise: false}).out('ASCII text'), 'Hi');
        assert.equal(demod(viaNodal, {noise: false}).out('encoding'), 'Manchester');
        var nested = nodal([viaNodal, 1, 2], [Thru(), 2, 3], ['out', 1, 3]);
        assert.equal(demod(nested, {noise: false}).out('ASCII text'), 'Hi');

        for (var pattern of ['00000000', '11111111']) {
            var manchester = mod({mode: 'PSK', encoding: 'Manchester', carrierHz: 200e6,
                bitRate: 10e6, samplesPerBit: 64, bits: pattern});
            var nrz = mod({mode: 'PSK', carrierHz: 200e6,
                bitRate: 10e6, samplesPerBit: 64, bits: pattern});
            assert.ok(manchester.spectrum[manchester.fList.indexOf(200e6)].mag() < 1e-9);
            assert.ok(nrz.spectrum[nrz.fList.indexOf(200e6)].mag() > 100);
            assert.equal(demod(cascade(Thru(), {signal: manchester}), {noise: false})
                .out('bits').join(''), pattern);
        }
        assert.throws(() => mod({mode: 'PSK', encoding: 'Manchester', carrierHz: 200e6,
            bitRate: 10e6, samplesPerBit: 63, bits: '01'}), RangeError);
        assert.throws(() => mod({mode: 'PSK', encoding: 'other', carrierHz: 200e6,
            bits: '01'}), RangeError);
    });
});

test('cascade propagates deterministic amplitude through an attenuator', () => {
    withGlobal(() => {
        var tx = mod({mode: 'bits', bits: '10110010', samplesPerBit: 4});
        var attenuationDb = 6;
        var chain = cascade(Thru(), Attn(attenuationDb, 0), {signal: tx});
        checkSamples(demod(chain, {noise: false}).out('waveform'), tx.bits, 4, 10 ** (-attenuationDb / 20));
    });
});

test('ASCII and raw 96-bit modes generate the requested bytes and bits', () => {
    withGlobal(() => {
        var ascii = mod({mode: 'ASCII', message: 'hello, world', samplesPerBit: 2});
        assert.equal(ascii.bits.length, 96);
        assert.equal(ascii.out('mode'), 'ASCII');
        assert.equal(ascii.out('bit count'), 96);
        assert.equal(ascii.out('frequency count'), 97);
        assert.equal(ascii.bits.slice(0, 8).join(''), '01101000');
        var asciiChain = cascade(Thru(), {signal: ascii});
        var Rxout = demod(asciiChain, {noise: false});
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
        assert.equal(demod(nested, {noise: false}).out('ASCII text'), 'hello, world');
        var raw = mod({mode: 'bits', bits: '01'.repeat(48), samplesPerBit: 2});
        assert.equal(raw.bits.length, 96);
        assert.equal(raw.out('mode'), 'bits');
        checkSamples(demod(cascade(Thru(), {signal: raw}), {noise: false}).out('waveform'), raw.bits, 2);
    });
});

test('raised source noise gives roughly ten percent errors over repeated receptions', () => {
    withGlobal(() => {
        var message = 'now is the time for all good men to come to the aid of their country';
        var tx = mod({mode: 'ASCII', message: message, samplesPerBit: 8});
        assert.equal(tx.out('frequency count'), 2177);
        var chain = cascade(Thru(), {signal: tx});
        var totalErrors = 0;
        var trials = 20;
        for (var trial = 0; trial < trials; trial++) {
            var waveform = demod(chain, {
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
        var tx = mod({mode: 'ASCII', message: message, highVolts: 1e-3});
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
        var tx = mod({mode: 'ASCII', message: message, samplesPerBit: 8});
        var chain = cascade(Thru(), Attn(6, 0), {signal: tx});
        assert.equal(chain.signal.samplesPerBit, 8);
        assert.equal(demod(chain, {noise: false}).out('ASCII text'), message);
    });
});

test('demod draws fresh thermal noise at the calculated output noise level', () => {
    withGlobal(() => {
        var tx = mod({mode: 'bits', bits: '0'.repeat(128), samplesPerBit: 8});
        var chain = cascade(Thru(), {signal: tx});
        var floorBefore = chain.out('noiseFloor');
        var first = demod(chain).out('waveform');
        var second = demod(chain).out('waveform');
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
        var tx = mod({mode: 'bits', bits: '0'.repeat(128), samplesPerBit: 8});
        var chain = cascade(Amp(20, 4), {signal: tx});
        var densityDbmHz = chain.out('noiseFloor')[1][1];
        var densityWattsHz = 1e-3 * 10 ** (densityDbmHz / 10);
        var expectedRms = Math.sqrt(densityWattsHz * 50 * tx.sampleRateHz / 2);
        var waveform = demod(chain).out('waveform');
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
        var tx = mod({mode: 'ASCII', message: message, highVolts: 80e-6});
        var chain = cascade(Thru(), {signal: tx});
        assert.equal(demod(chain, {noise: false}).out('ASCII text'), message);
        assert.notEqual(demod(chain, {thresholdVolts: 40e-6}).out('ASCII text'), message);
    });
});

test('digital helpers reject invalid signal descriptions and missing signal', () => {
    withGlobal(() => {
        assert.throws(() => mod({mode: 'PN7', seed: 0}), RangeError);
        assert.throws(() => mod({mode: 'ASCII', message: 'é'}), RangeError);
        assert.throws(() => mod({mode: 'bits', bits: '0102'}), TypeError);
        assert.throws(() => mod().out('unknown'), RangeError);
        assert.throws(() => demod(Thru()), TypeError);
        var tx = mod({mode: 'bits', bits: '10'});
        assert.throws(() => cascade(Thru(), {signal: tx, inputPort: 3}), RangeError);
        assert.throws(() => demod(cascade(Thru(), {signal: tx}), {outputPort: 3}), RangeError);
        assert.throws(() => demod(cascade(Thru(), {signal: tx})).out('ASCII text'), RangeError);
        assert.throws(() => demod(cascade(Thru(), {signal: tx}), {mode: 'ASCII'}), RangeError);
        assert.throws(() => demod(cascade(Thru(), {signal: tx})).out('unknown'), RangeError);
        assert.throws(() => demod(cascade(Thru(), {signal: tx}), {noise: 'yes'}), TypeError);
        assert.throws(() => bitErrorRate(tx, cascade(Thru(), {signal: tx}), {receptions: 0}), RangeError);
        assert.throws(() => mod({carrierHz: -1}), RangeError);
        assert.throws(() => bitErrorRate(tx, cascade(Thru(), {signal: tx}), {receiver: 1}), TypeError);
    });
});

test('new sampled modes recover data through cascade and nested nodal circuits', () => {
    withGlobal(() => {
        for (var mode of ['DPSK', 'QPSK', 'QAM', 'MSK', 'GMSK', 'OFDM']) {
            global.fList = [];
            var tx = mod({mode: mode, carrierHz: 200e6,
                ...(mode === 'OFDM' ? {} : {bitRate: 10e6, samplesPerBit: 64}),
                ...(mode === 'QAM' ? {} : {symbolRate: 5e6}),
                message: 'Hi'});
            var chain = cascade(Amp(20, 4), Attn(3, 0), {signal: tx});
            var nested = nodal(
                [chain, 1, 2],
                ['out', 1, 2]
            );
            assert.equal(demod(chain, {noise: false}).out('ASCII text'), 'Hi', mode + ' cascade');
            assert.equal(demod(nested, {noise: false}).out('ASCII text'), 'Hi', mode + ' nested nodal');
            assert.equal(tx.out('settings').frequencyCount, tx.fList.length);
            assert.equal(nested.signal.mode, mode);
        }
    });
});

test('QAM and OFDM support the declared constellation settings', () => {
    withGlobal(() => {
        for (var options of [
            {mode: 'QAM', order: 64, bits: '101001101011001010'},
            {mode: 'OFDM', subcarrierMode: 'QAM', order: 16,
                subcarrierCount: 8, fftSize: 128, symbolRate: 5e6, bits: '101001101011001010'}
        ]) {
            var tx = mod({...options, carrierHz: 200e6,
                ...(options.mode === 'OFDM' ? {} : {bitRate: 10e6, samplesPerBit: 64})});
            var rx = demod(cascade(Thru(), {signal: tx}), {noise: false});
            assert.deepEqual(rx.out('bits'), tx.bits);
            assert.equal(rx.out('bit count'), tx.bits.length);
            assert.equal(rx.out('symbols').length > 1, true);
        }
        var qpsk = mod({mode: 'QPSK', carrierHz: 200e6,
            symbolRate: 5e6, samplesPerBit: 64, message: 'Hi'});
        assert.equal(qpsk.out('settings').bitRate, 10e6);
        assert.equal(qpsk.out('settings').symbolRate, 5e6);
        assert.equal(demod(cascade(Thru(), {signal: qpsk}), {noise: false})
            .out('ASCII text'), 'Hi');
        var pnQam = mod({mode: 'QAM', carrierHz: 200e6,
            bitRate: 10e6, samplesPerBit: 64});
        assert.equal(pnQam.out('bit count'), 127);
        assert.deepEqual(demod(cascade(Thru(), {signal: pnQam}), {noise: false})
            .out('bits'), pnQam.bits);
        var multiBlock = mod({mode: 'OFDM', carrierHz: 200e6,
            subcarrierCount: 8, fftSize: 128, symbolRate: 5e6, message: 'hello'});
        assert.equal(multiBlock.out('settings').blockCount, 3);
        assert.equal(demod(cascade(Thru(), {signal: multiBlock}), {noise: false})
            .out('ASCII text'), 'hello');
        assert.throws(() => mod({mode: 'QAM', order: 8, carrierHz: 200e6,
            bits: '1010'}), /QAM order/);
        assert.throws(() => mod({mode: 'GMSK', bt: 0, carrierHz: 200e6,
            bits: '1010'}), /GMSK bt/);
        assert.throws(() => mod({mode: 'OFDM', carrierHz: 200e6,
            symbolRate: 7e6, bits: '1010'}), /bin-aligned/);
        assert.throws(() => mod({mode: 'OFDM', carrierHz: 200e6,
            bitRate: 10e6, bits: '1010'}), /do not apply/);
    });
});

test('single-tone SSB and DSB-SC use only occupied frequency rows', () => {
    withGlobal(() => {
        for (var options of [
            {mode: 'SSB', sideband: 'USB', count: 1},
            {mode: 'SSB', sideband: 'LSB', count: 1},
            {mode: 'DSB-SC', count: 2}
        ]) {
            var tx = mod({mode: options.mode, sideband: options.sideband,
                carrierHz: 200e6, toneHz: 300, toneAmplitudeVolts: 1});
            var chain = cascade(Thru(), {signal: tx});
            var nested = nodal(
                [chain, 1, 2],
                ['out', 1, 2]
            );
            assert.equal(tx.out('frequency count'), options.count);
            assert.equal(chain.spars.length, options.count);
            assert.equal(nested.signal.mode, options.mode);
            var waveform = demod(nested, {noise: false}).out('waveform');
            assert.ok(Math.abs(waveform[1][1] - 1) < 1e-10);
            assert.ok(Math.abs(waveform[251][1]) < 1e-10);
            assert.equal(demod(nested, {noise: false}).out('tones').length,
                options.count + 1);
        }
    });
});
