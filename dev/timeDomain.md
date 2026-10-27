<!-- Modified: 2026-10-20 -->
# Time-domain development

## 1. Purpose

Send the ASCII message `now is the time for all good men to come to the aid of their country` through a matched 290 K attenuator. `mod()` returns signal data: bit pattern, complex FFT spectrum, frequency list, sample rate, and reference impedance. It also sets `global.fList`. Construct the attenuator after `mod()`, then give the signal to `nodal()` at port 1. The completed nPort carries the resulting complex output waves. Increasing attenuation lowers the received signal while the matched 290 K noise floor remains about the same. This example sets the attenuation near the point where BER is $10^{-2}$ and measures it over repeated receptions. A separate PN7 section plots the clocked and received waveforms.

## 2. The example

```js
var message = 'now is the time for all good men to come to the aid of their country';
var g = nP.global;
g.tList = g.tGen(0, 4351 / 8e9, 4352);
g.fList = [];
var tx = nP.mod({mode: 'ASCII', message: message, bitRate: 1e9, samplesPerBit: 8, highVolts: 1e-3});
var attenuationDb = 17.6;
var attenuator = nP.Attn(attenuationDb, 290);
var chain = nP.nodal(
    [attenuator, 1, 2],
    ['out', 1, 2],
    {signal: tx, inputPort: 1}
);
nP.log('Transmitted: ' + message);
var rx = nP.demod(chain);
var text = rx.out('ASCII text');
nP.log('Received: ' + text);
nP.log('Attenuation: ' + attenuationDb + ' dB');
var ber = nP.bitErrorRate(tx, chain, {receptions: 100});
nP.log('Measured BER: ' + ber.toExponential(2));
```

`demod()` returns a receiver result. Its `out('ASCII text')` method returns the received string; the page passes that string to `nP.log()`. The same result also provides `out('bits')`, `out('bit count')`, `out('sample count')`, `out('frequency count')`, `out('frequencies')`, `out('spectrum')`, and `out('waveform')`. `bitErrorRate()` compares received bit decisions with the known transmitter bits over 100 independent noise draws. The receiver itself does not need the transmitter.

`Attn(17.6, 290)` is a normal nPort with $S_{11}=S_{22}=0$ and $S_{12}=S_{21}=10^{-17.6/20}\approx0.132$ at every frequency, including DC. It also has its own 290 K noise covariance. The signal is applied at external port 1. The matched reference impedance is `nP.global.Ro` (50 Ω by default). For a two-port chain, the equivalent call is `nP.cascade(attenuator, {signal: tx, inputPort: 1})`.

## 3. Frequencies and signal data

The 68 characters in the message become 544 bits: eight bits per ASCII character, most-significant bit first. At 1 Gbit/s and eight samples per bit, one repeating message has 4,352 time samples and 2,177 nonnegative FFT bins from DC to 4 GHz. `tx.out('frequency count')` returns `2177`; the frequency spacing is $R_b/544$, about 1.838 MHz. `rx.out('ASCII text')` samples the center of each bit, estimates the centers of the two received voltage levels, groups bit decisions into bytes, and returns the text. An explicit `thresholdVolts` option is available when a known decision level is preferred.

`tx.spectrum` contains complex input-voltage FFT bins, and `tx.fList` contains their frequencies. Neither `tx` nor its spectrum is an nPort or a circuit stage. After the signal is applied, the resulting nPort's `.signal` contains the sample rate, sample count, reference impedance, and a complex outgoing-wave vector for each S-parameter frequency row. A later `nodal()` or `cascade()` call can reuse that nPort and propagate its signal. Thus `demod(chain)` does not need the transmitter. The complex waves retain amplitude and phase.

`mod()` also accepts `{mode: 'PN7'}` or `{mode: 'bits', bits: '0101'}` (or an array of zeros and ones). All modes treat the supplied bit sequence as one *repeating* period. The default voltage levels are 0 and 1 V; this example sets the high level to 1 mV. `demod()` draws a fresh random noise waveform by default from the output noise density of the nPort, including source and component noise. `out('waveform')` returns a noisy voltage table in nanoseconds and volts; `demod(chain, {noise: false}).out('waveform')` returns the exact signal-only table. ASCII decoding uses the `samplesPerBit` metadata carried by the nPort; it does not perform clock recovery or error correction.

## 4. Noise floor and bit errors

At the default 290 K source temperature, a matched 50 Ω input produces about 28 µV RMS noise over the 4 GHz receiver bandwidth. The attenuator is also at 290 K, so it reduces the source noise and adds its own thermal noise; the total output noise stays near 28 µV RMS. The transmitted high level is 1 mV. At 17.6 dB attenuation, the received high level is about 132 µV.

With a decision threshold near 66 µV, the 132 µV level separation gives approximately 1% bit-error probability. One 544-bit message is too short for a steady BER estimate: at $10^{-2}$, it has about five errors on average. `bitErrorRate(tx, chain, {receptions: 100})` compares 54,400 bit decisions, with a fresh noise draw for each reception. The measured BER varies around $10^{-2}$. `rx.out('ASCII text')` displays one noisy reception. The average 290 K output noise floor can be read with `chain.out('noiseFloor')`.

`nP.FFT()` and `nP.invFFT()` remain public math helpers for other sampled-signal work. The public FFT requires one selected `global.tList` time per sample, then fills `global.fList` with the signed bin frequencies. Both transforms return complex arrays. The forward transform is unscaled; the inverse divides by the sample count. `mod()` and `demod()` use the same transform internally, so the user need not manage FFT bins to run this example.

This first calculation is linear and periodic. The final bit transitions back to the first bit at the repetition boundary. A later capacitor example can show DC rejection and baseline wander, but startup from arbitrary stored charge is outside this periodic FFT calculation.

## 5. PN7 on a 200 MHz carrier

The final section uses a new circuit context. `tGen(0, 126e-9, 127)` provides 127 clock ticks, 1 ns apart. `PN()` advances its seven-stage register once at each tick and produces one 127-bit period. `mod()` makes eight samples per bit, multiplies them by a 200 MHz cosine, runs the FFT, and fills the context's initially empty `fList`. Construct the attenuator after `mod()` so its S-parameter rows match those 509 frequency bins.

```js
var pnCircuit = nP.global();
var pnClockTimes = pnCircuit.tGen(0, 126e-9, 127);
pnCircuit.tList = pnCircuit.tGen(0, 1015 / 8e9, 1016);
pnCircuit.fList = [];

var pn = nP.PN({stages: 7, time: pnClockTimes});
var pnTx = nP.mod({input: pn, carrierHz: 200e6});
var pnAttenuator = nP.Attn(3, 0);
var pnChain = nP.cascade(pnAttenuator, {signal: pnTx});
var pnRx = nP.demod(pnChain, {noise: false});
```

`pn.out('waveform')` supplies the voltage at each clock tick. `pnRx.out('carrier waveform')` supplies the 1,016 received passband samples, while `pnRx.out('waveform')` supplies the coherently recovered bit levels. The page plots all three. The receiver uses the known 200 MHz carrier frequency and zero phase; it correlates each bit's samples with the carrier. The 0 K attenuator and `{noise: false}` make this a direct signal-path check; `pnRx.out('bits')` matches the transmitted 127 bits.

The 127 ns PN record contains 25.4 carrier cycles. Its FFT treats the record as periodic, so the carrier has a phase discontinuity at the record boundary and spreads over nearby frequency bins. The matched attenuator has the same response at every bin, so the recovered bits remain exact in this demonstration. Five consecutive PN periods would contain an integer 127 carrier cycles and avoid that boundary discontinuity.
