<!-- Modified: 2026-10-19 -->
# Digital signals

Use `nP.mod()` to make a signal, send it through an n-port circuit, and use `nP.demod()` to recover the output. `nP.PN()` makes a clocked pseudorandom bit pattern when you need control over the clock ticks. `nP.bitErrorRate()` measures the fraction of received bits in error.

## Send text through a circuit

```js
var circuit = nP.global();
circuit.fList = [];

var tx = nP.mod({
    mode: 'ASCII',
    message: 'Hello, nPort!'
});

var attenuator = nP.Attn(3);
var chain = nP.cascade(attenuator, {signal: tx});
var rx = nP.demod(chain, {noise: false});

nP.log(rx.out('ASCII text'));
nP.lineChart({
    inputTable: rx.out('waveform'),
    title: 'Received waveform',
    metricPrefix: 'none'
});
```

`mod()` fills the selected circuit's frequency list with the signal's FFT frequencies. Create the attenuator **after** `mod()` so its S-parameter rows use those frequencies. `{signal: tx}` attaches the transmitter to the circuit. `demod()` normally includes receiver noise; `{noise: false}` makes this first example repeatable. The waveform table's time values are already in nanoseconds, so the chart uses `metricPrefix: 'none'`.

## Make a transmitter with `mod()`

With no options, `nP.mod()` makes one period of PN7 bits at **1 Gbit/s**, with **8 samples per bit**, **0 V for zero**, and **1 V for one**. The carrier defaults to **0 Hz**, giving a baseband signal. The resulting object describes a signal; it is not itself an n-port.

```js
var tx = nP.mod(); // PN7 baseband, 127 bits
var textTx = nP.mod({
    mode: 'ASCII',
    message: 'Hi',
    bitRate: 10e6,
    samplesPerBit: 64
});
var bitTx = nP.mod({mode: 'bits', bits: '0101'});
```

Use `mode: 'ASCII'` with a nonempty seven-bit ASCII `message`, `mode: 'bits'` with a nonempty 0/1 string or array, or `mode: 'PN2'` through `'PN16'` for a repeating pseudorandom sequence. Set `bitRate`, `samplesPerBit`, `lowVolts`, and `highVolts` in the options object as needed. An RF carrier must remain below the sample Nyquist frequency; increase `samplesPerBit` when raising `carrierHz`.

To put bits on an RF carrier, select a modulation mode and provide a positive `carrierHz`:

```js
var tx = nP.mod({
    mode: 'PSK',
    message: 'Hi',
    carrierHz: 200e6,
    bitRate: 10e6,
    samplesPerBit: 64
});
```

| Mode | Signal |
| --- | --- |
| `OOK` | Carrier on for 1, off for 0; default levels 0 V and 1 V. |
| `ASK` | Two nonzero carrier levels; default levels 0.5 V and 1 V. |
| `FSK` | Two carrier frequencies; default deviation is half the bit rate. |
| `PSK`, `DPSK` | Binary phase and differential phase modulation. `PSK` uses NRZ encoding by default; it also supports `encoding: 'Manchester'`. |
| `QPSK`, `QAM` | I/Q symbols. QAM defaults to 16 points and supports orders 4, 16, 64, and 256. |
| `MSK`, `GMSK` | Continuous-phase modulation; GMSK defaults to `bt: 0.3`. |
| `OFDM` | Multicarrier modulation using `symbolRate` and `fftSize`. |

For these RF modes, `message` or `bits` chooses the data automatically; otherwise the data defaults to PN7. You can set `dataMode` explicitly to `'ASCII'`, `'bits'`, or a PN mode. `mod()` also supports the analog modes `AM`, `FM`, `PM`, `SSB`, and `DSB-SC`; those modes create tone-based analyses rather than sampled digital bit streams.

## Inspect the transmitter

`tx.out('waveform')` returns a chart-ready table with `Time (ns)` and `Output (V)` columns. Other useful selectors are:

| Selector | Result |
| --- | --- |
| `'settings'` | Mode, rates, levels, carrier, sample count, and other applicable settings. |
| `'mode'` | Selected mode name. |
| `'bit count'`, `'sample count'`, `'frequency count'` | Counts. |
| `'frequencies'` | FFT frequencies in hertz. |
| `'frequency table'` | Table of FFT bin numbers and frequencies. |
| `'spectrum'` | Array of complex FFT values. |

`tx.bits` contains the transmitted bits. For separate circuits, create a new context with `nP.global()` before each `mod()` call; its frequency list can start empty. If you pass `fftList: someArray`, `mod()` fills that array instead of the selected context's `fList`.

## Make a clocked PN pattern

`nP.PN()` defaults to **7 stages**, an all-ones seed, and **0 V / 1 V** output. It uses `nP.global.tList` unless you supply `time`. Each time entry is one clock tick. The time list must increase uniformly and contain a whole number of PN periods; a period has `2 ** stages - 1` ticks.

```js
var circuit = nP.global();
circuit.tList = circuit.tGen(0, 6e-9, 7); // PN3: seven 1 ns ticks

var pn = nP.PN({stages: 3});
nP.lineChart({
    inputTable: pn.out('waveform'),
    title: 'PN3 clocked waveform',
    metricPrefix: 'none'
});
```

`pn.out('bits')`, `out('samples')`, and `out('time')` return arrays. `out('waveform')` returns a chart table; `out('bit count')`, `out('sample count')`, `out('bit rate')`, `out('sample rate')`, and `out('clock rate')` return counts or rates. To send this exact clocked pattern through a circuit, use `nP.mod({input: pn})` before constructing the n-port components. Modulation expands each PN clock tick to 8 samples by default; set `samplesPerBit` to change that density.

## Recover a signal with `demod()`

`nP.demod(chain)` reads the signal attached to the completed n-port. For a quick ideal connection, `nP.demod(tx)` accepts a transmitter directly. Receiver noise is **on by default** for sampled digital signals; each `demod()` call draws a new noise waveform. Outputs read from one `rx` object use the same draw.

```js
var rx = nP.demod(chain, {
    noise: false,
    outputPort: 2
});

nP.log(rx.out('ASCII text'));
nP.log(rx.out('bits'));
```

The output port defaults to **2**, and the input port defaults to **1**. Set `outputPort` or `inputPort` for a different circuit port. `thresholdVolts` overrides the automatically estimated bit-decision threshold. `rx.out('waveform')` returns received voltage versus time in nanoseconds; `out('bits')` returns decided bits, and `out('ASCII text')` decodes complete eight-bit bytes. Other useful outputs include `'bit count'`, `'sample count'`, `'frequency count'`, `'frequencies'`, and `'spectrum'`. For carrier modes, `'carrier waveform'` returns the received passband samples while `'waveform'` returns the recovered levels. ASCII decoding has no clock recovery or error correction.

## Measure bit error rate

`nP.bitErrorRate(tx, chain)` compares the known transmitted bits with **100 independent receptions** by default and returns the error fraction from **0 to 1**. Set `receptions` to change the number of trials. Receiver options such as `noise`, `outputPort`, and `thresholdVolts` can be passed in the same object.

```js
var ber = nP.bitErrorRate(tx, chain, {receptions: 100});
nP.log(ber);
```

Each reception calls `demod()` again, so a noisy result can differ between runs. For a signal-only check, pass `{noise: false}`. The transmitter and circuit must carry the same bit pattern and frequency grid.
