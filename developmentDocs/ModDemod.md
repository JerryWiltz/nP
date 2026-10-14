<!-- Modified: 2026-10-14 -->
# Modulation and demodulation in nP

`nP.mod()` describes a signal to apply to a circuit. It produces the frequencies the circuit must analyze and the complex input voltage at each frequency. It does **not** return an nPort. Build components after calling `mod()`, combine them with `nodal()` or `cascade()`, and attach the transmitter to the completed circuit. `nP.demod()` then reads the signal carried by that nPort and reconstructs or measures its output.

```js
var g = nP.global();
g.fList = [];

var tx = nP.mod({mode: 'PSK', encoding: 'Manchester',
    carrierHz: 200e6, bitRate: 10e6, samplesPerBit: 64,
    message: 'Hi'});
var amp = nP.Amp(20, 4);
var attenuator = nP.Attn(3);
var chain = nP.cascade(amp, attenuator, {signal: tx, inputPort: 1});
var rx = nP.demod(chain, {outputPort: 2});
nP.log(rx.out('ASCII text'));
```

`mod()` fills the selected context's `fList` before `Amp()` and `Attn()` are constructed. The components therefore have S-parameter rows at every transmitted frequency. For an arbitrary connection, replace the `cascade()` line with:

```js
var chain = nP.nodal(
    [amp, 1, 2],
    [attenuator, 2, 3],
    ['out', 1, 3],
    {signal: tx, inputPort: 1}
);
```

The trailing `{signal: tx, inputPort: 1}` is the **signal attachment object** for either combiner. It is separate from the `mod({...})` options object. `inputPort` defaults to 1. `demod(tx)` also works for a direct ideal connection with no explicit nPort.

## Implemented and suggested modes

The applications below are examples, not exclusive uses. The links lead to standards bodies or the organizations that operate the cited systems. **Suggested** rows describe possible future nP work; their example objects later in this note are proposals and are not accepted by the current API.

| Status | Modulation or encoding | Typical application and source |
| --- | --- | --- |
| Implemented | Analog `AM` | AM broadcasting and aeronautical VHF voice. [ICAO aviation handbook](https://www.icao.int/sites/default/files/FSMP/Doc.9718-Vol-II-2nd-Edition-2022_corr000.pdf) |
| Implemented | Analog `FM` | FM broadcasting and analog two-way voice. [FCC FM definitions](https://docs.fcc.gov/public/attachments/DOC-395110A1.pdf) |
| Implemented | Analog `PM` | Phase-modulation experiments and spacecraft telemetry schemes. [NASA telemetry discussion](https://ntrs.nasa.gov/api/citations/19830028031/downloads/19830028031.pdf) |
| Implemented | Digital `OOK` | On/off optical signalling. [ITU optical-system formats](https://www.itu.int/epublications/publication/itu-t-g-suppl-39-2025-03-optical-system-design-and-engineering-considerations) |
| Implemented | Digital `ASK` | RFID interrogator-to-tag links. [GS1 UHF Gen2 air interface](https://ref.gs1.org/standards/gen2/) |
| Implemented | Digital `FSK` | Low-rate radio data and radio teletype. [FCC FSK/RTTY discussion](https://docs.fcc.gov/public/attachments/DA-08-1082A1.pdf) |
| Implemented | Digital binary `PSK` | Spacecraft command and telemetry links. [JPL Deep Space Network handbook](https://deepspace.jpl.nasa.gov/dsndocs/810-005/206/206C.pdf) |
| Implemented PSK encoding | `Manchester` | A mid-bit transition for timing; historically 10BASE-T and some telemetry. [IEEE Ethernet discussion](https://www.ieee802.org/3/10SPE/public/Sept2016_Interim/Graber_10SPE_02a_0916.pdf), [JPL BPSK/Bi-φ comparison](https://tda.jpl.nasa.gov/1990-1999/progress_report/42-136/136D.pdf) |
| Suggested | Differential PSK | Decode phase changes rather than an absolute carrier phase; early Wi-Fi used DBPSK and DQPSK. [IEEE 802.11 history](https://grouper.ieee.org/groups/802/11/main.html) |
| Suggested | QPSK | Bandwidth-efficient satellite and radio data links. [JPL Deep Space Network handbook](https://deepspace.jpl.nasa.gov/dsndocs/810-005/206/206C.pdf) |
| Suggested | QAM | Cable data and data-bearing multicarrier systems. [ITU cable recommendation](https://www.itu.int/ITU-T/recommendations/rec.aspx?lang=en&rec=5652), [ITU multicarrier report](https://www.itu.int/dms_pub/itu-r/opb/rep/R-REP-BT.2049-4-2011-PDF-E.pdf) |
| Suggested | MSK / GMSK | Continuous-phase mobile radio; GSM uses GMSK. [ETSI GSM specification](https://www.etsi.org/deliver/etsi_ts/100500_100599/100573/08.05.00_60/ts_100573v080500p.pdf) |
| Suggested | SSB / suppressed-carrier AM | Bandwidth-limited HF voice. [FCC marine-radio study material](https://docs.fcc.gov/public/attachments/DOC-315661A2.pdf) |
| Suggested | OFDM | Multicarrier digital broadcasting and wireless data, often with QPSK or QAM per subcarrier. [ITU multicarrier report](https://www.itu.int/dms_pub/itu-r/opb/rep/R-REP-BT.2049-4-2011-PDF-E.pdf) |

`PN2` through `PN16`, `ASCII`, and `bits` choose the **data source**, not a radio modulation scheme. The digital modulation modes infer ASCII from `message` and raw bits from `bits`; otherwise their data source defaults to `PN7`. `Manchester` is a PSK encoding option, not a separate `mode`.

## Implemented `mod({...})` objects

The analog implementations below use **one sinusoidal modulation tone**. They do not yet accept an arbitrary audio waveform. `beta` means peak frequency deviation divided by tone frequency for FM; for PM, it means peak phase swing in radians.

```js
var am = nP.mod({mode: 'AM', carrierHz: 200e6, toneHz: 300,
    modulationIndex: 0.5, carrierAmplitudeVolts: 1});

var fm = nP.mod({mode: 'FM', carrierHz: 200e6, toneHz: 300,
    beta: 5, carrierAmplitudeVolts: 1,
    sidebandPowerTolerance: 1e-6});

var pm = nP.mod({mode: 'PM', carrierHz: 200e6, toneHz: 300,
    beta: 0.1, carrierAmplitudeVolts: 1,
    sidebandPowerTolerance: 1e-6});
```

Run each `mod()` call in its own circuit context or with its own `fftList` when building separate circuits. Each call selects a frequency list for the components created afterward.

The digital examples use a 200 MHz carrier, 10 Mbit/s data, and 64 samples per bit. Those values put the carrier below the 320 MHz sample Nyquist frequency. The default sampled-data rate is 1 Gbit/s with eight samples per bit; check the selected carrier and sample rate when changing these values.

```js
var ook = nP.mod({mode: 'OOK', carrierHz: 200e6,
    bitRate: 10e6, samplesPerBit: 64, message: 'Hi'});

var ask = nP.mod({mode: 'ASK', carrierHz: 200e6,
    bitRate: 10e6, samplesPerBit: 64, message: 'Hi',
    lowVolts: 0.5, highVolts: 1});

var fsk = nP.mod({mode: 'FSK', carrierHz: 200e6,
    bitRate: 10e6, samplesPerBit: 64, message: 'Hi',
    frequencyDeviationHz: 5e6, carrierAmplitudeVolts: 1});

var psk = nP.mod({mode: 'PSK', carrierHz: 200e6,
    bitRate: 10e6, samplesPerBit: 64, message: 'Hi'});

var manchester = nP.mod({mode: 'PSK', encoding: 'Manchester',
    carrierHz: 200e6, bitRate: 10e6, samplesPerBit: 64,
    message: 'Hi'});
```

For FSK, `frequencyDeviationHz` defaults to half the bit rate. Binary PSK sends 1 at 0° and 0 at 180°. Its default `encoding: 'NRZ'` holds that phase for the whole bit. `encoding: 'Manchester'` reverses phase halfway through every bit: 1 is 0° then 180°, and 0 is 180° then 0°. Manchester requires an even `samplesPerBit`. In an aligned FFT analysis, its equal and opposite half-bits cancel the carrier bin even for a run of identical bits.

These are data-source shortcuts, not additional RF modes:

```js
var pn = nP.mod({mode: 'PN7'}); // 127-bit sequence at baseband by default
var text = nP.mod({mode: 'ASCII', message: 'Hi', carrierHz: 200e6});
var bits = nP.mod({mode: 'bits', bits: '10110010', carrierHz: 200e6});
```

## Suggested `mod({...})` objects — proposals only

**None of the objects in this section works in the current source.** Their property names and receiver behavior still need design decisions. They show how each suggested mode might fit the one-options-object workflow.

```js
var dpsk = nP.mod({mode: 'DPSK', carrierHz: 200e6,
    bitRate: 10e6, message: 'Hi'});

var qpsk = nP.mod({mode: 'QPSK', carrierHz: 200e6,
    symbolRate: 5e6, message: 'Hi'});

var qam = nP.mod({mode: 'QAM', order: 16, carrierHz: 200e6,
    symbolRate: 2.5e6, message: 'Hi'});

var msk = nP.mod({mode: 'MSK', carrierHz: 200e6,
    bitRate: 10e6, message: 'Hi'});

var gmsk = nP.mod({mode: 'GMSK', carrierHz: 200e6,
    bitRate: 10e6, bt: 0.3, message: 'Hi'});

var ssb = nP.mod({mode: 'SSB', sideband: 'USB',
    carrierHz: 200e6, toneHz: 300, toneAmplitudeVolts: 1});

var suppressedAm = nP.mod({mode: 'DSB-SC', carrierHz: 200e6,
    toneHz: 300, toneAmplitudeVolts: 1});

var ofdm = nP.mod({mode: 'OFDM', carrierHz: 200e6,
    subcarrierCount: 64, subcarrierMode: 'QPSK',
    symbolRate: 5e6, message: 'Hi'});
```

QPSK, QAM, and OFDM would need I/Q symbol mapping and demapping. Differential PSK would need a starting phase convention. GMSK would need a pulse-shaping definition. These are implementation questions, not hidden features of `mod()` today.

## How `fList` is populated

For sampled digital signals, `mod()` first forms the time samples and runs `FFT()`. If there are `B` bits and `P` samples per bit, then `N = B × P` samples and the sample rate is `fs = bitRate × P`. The frequency list contains the `floor(N / 2) + 1` nonnegative FFT bins:

```text
fList[k] = k × fs / N,   k = 0, 1, ..., floor(N / 2)
```

The complex `tx.spectrum[k]` carries that bin's magnitude and phase. Negative-frequency bins are implicit for the real sampled waveform and are restored during inverse FFT. The samples are treated as one periodic record. Digital FFT coefficients use the FFT's scaling; they are not individual peak-voltage phasors without normalization.

For example, ASCII `Hi` has 16 bits. At 64 samples per bit and 10 Mbit/s, `N = 1024`, `fs = 640 MHz`, bin spacing is `625 kHz`, and `fList` has **513 frequencies** from DC through 320 MHz. A 200 MHz carrier lies at bin 320. Inspect the size before building a large nodal circuit:

```js
var g = nP.global();
g.fList = [];
var tx = nP.mod({mode: 'PSK', carrierHz: 200e6,
    bitRate: 10e6, samplesPerBit: 64, message: 'Hi'});
nP.log(tx.out('frequency count')); // 513
nP.log(tx.out('frequency table'));
```

Analog single-tone AM uses exactly `[carrierHz - toneHz, carrierHz, carrierHz + toneHz]`. FM and PM calculate the carrier and sidebands from the modulation phase, then retain orders `-N` through `+N` until the omitted power fraction meets `sidebandPowerTolerance`; their row count is `2N + 1` and grows with `beta`. Their `tx.spectrum` entries are complex **peak-voltage tone phasors**, unlike the unnormalized sampled FFT bins.

By default, `mod()` replaces the selected `nP.global` context's `fList`. Passing a caller-owned `fftList` instead fills that array in place and leaves the selected default `fList` alone:

```js
var frequencies = [];
var tx = nP.mod({mode: 'AM', carrierHz: 200e6,
    toneHz: 300, fftList: frequencies});
var attenuator = nP.Attn({attenuationDb: 3, fList: frequencies});
var chain = nP.cascade(attenuator, {signal: tx});
```

Every component in a circuit must have the **same frequency values in the same row order** as `tx.fList`. Constructors using the selected context do this when built after `mod()`. Constructors given an explicit `fList` do it for that list. The sampled path includes DC, so a component used with it also needs a valid DC S-parameter row.

## What the combiners carry and what `demod()` reads

`tx` contains `fList`, a complex `spectrum` aligned with that list, and the settings needed for its mode. A sampled digital transmitter also has `bits`, `sampleCount`, `sampleRateHz`, and `samplesPerBit`. `referenceImpedanceOhms` is captured from `nP.global.Ro`. Depending on the mode, settings include `carrierHz`, `dataMode`, `encoding`, `frequencyDeviationHz`, `toneHz`, or `beta`. `tx.out('settings')`, `out('frequencies')`, and `out('spectrum')` are inspection APIs; sampled modes also expose `out('waveform')`.

When the trailing `{signal: tx, inputPort: 1}` is supplied, `nodal()` or `cascade()` first computes the combined nPort's S rows and noise covariance. It then applies each complex input spectrum entry through the corresponding S row at `inputPort`. The resulting nPort carries `.signal` with the mode and timing metadata plus frequency-aligned rows of outgoing complex waves:

```js
chain.signal = {
    mode: 'PSK',
    dataMode: 'ASCII',
    encoding: 'Manchester',
    carrierHz: 200e6,
    sampleCount: 1024,
    sampleRateHz: 640e6,
    samplesPerBit: 64,
    referenceImpedanceOhms: 50,
    rows: [
        {frequency: 0, waves: [/* port 1 complex wave, port 2 complex wave */]},
        // ... one row per S-parameter frequency
    ]
};
```

This is an **illustration of the shape**, not code to assign to `chain.signal`. The actual `.signal` also has mode-specific fields, and each `waves` entry is a `nP.complex()` object in power-wave units. It is not merely a pointer back to the transmitter. If a combined nPort is used in another `nodal()` or `cascade()` call, the complex wave rows and compatible metadata propagate with it. The combiners require matching component frequency rows. When multiple sampled sources are combined, the current metadata check compares their sample count, sample rate, carrier frequency, encoding, and reference impedance. It does not yet check every digital mode setting, such as FSK deviation; do not assume differently modulated sources can be mixed safely in one connection.

`demod(chain)` reads the output port's wave rows and reconstructs the received signal. For sampled digital modes it also draws a new noise realization from the chain's source, termination, and component noise unless `{noise: false}` is passed. One returned `rx` object uses the same draw for all its `.out()` calls. FSK compares energy at its two tones and does not require absolute carrier phase; PSK, including Manchester coding, assumes a known carrier phase and bit timing. The current analog AM/FM/PM receiver paths are deterministic and reject `{noise: true}`. Use `demod(chain, {outputPort: 3})` for a different nPort output.

| Received signal | Useful `rx.out(...)` selectors |
| --- | --- |
| Analog AM | `'envelope'`, `'phase'`, `'amToPmDeg'`, `'tones'` |
| Analog FM | `'envelope'`, `'phase'`, `'frequency deviation'`, `'peak frequency deviation Hz'`, `'tones'` |
| Analog PM | `'envelope'`, `'phase'`, `'peak phase deviation radians'`, `'frequency deviation'`, `'tones'` |
| Sampled baseband, OOK, ASK | `'waveform'`, `'bits'`, `'ASCII text'`, `'carrier waveform'` when a carrier is used |
| FSK | `'waveform'`, `'bits'`, `'ASCII text'`, `'tone energies'`, `'tone frequencies Hz'` |
| PSK, including Manchester | `'waveform'`, `'bits'`, `'ASCII text'`, `'encoding'`, `'carrier waveform'` |

For digital bit-error measurements, `nP.bitErrorRate(tx, chain, {receptions: 100})` compares repeated noisy decisions with the known transmitter bits. The receiver needs only `chain` for ordinary decoding; the BER helper also needs `tx` to know which bits were sent.

No selected input power is required for a digital voltage signal: `carrierAmplitudeVolts` or the chosen voltage levels define its drive. The receiver's decoded text, bits, waveform, or analog envelope are requested from its `.out()` method; the nPort's `.out()` remains the way to inspect circuit quantities such as S-parameters, noise figure, and noise floor.
