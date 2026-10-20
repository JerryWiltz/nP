<!-- Modified: 2026-10-19 -->
# Noise

nP carries noise covariance alongside the S-parameters of each n-port. Connect components with `nP.nodal()` or `nP.cascade()`, then use `.out(...)` to measure noise figure and output noise density. For two-tone products and intercepts, see [Intermodulation](./intermodulation.md).

## Start with noisy components

`nP.Amp()` is a matched two-port with **20 dB gain** and **4 dB matched noise figure** by default. Its noise reference temperature is 290 K. `nP.Attn()` is a matched two-port with **3 dB attenuation** by default; it uses the current `nP.global.Temp` for its physical temperature. A fresh global context starts at 293 K.

```js
nP.global.fList = [1e9, 2e9];

var amp1 = nP.Amp();          // 20 dB gain, 4 dB matched NF
var amp2 = nP.Amp(15, 3);     // 15 dB gain, 3 dB matched NF
var attn1 = nP.Attn();        // 3 dB loss at nP.global.Temp
var attn2 = nP.Attn(6, 320);  // 6 dB loss at 320 K
```

Set `nP.global.fList` and the desired `nP.global.Temp` **before** making components. An attenuator keeps the temperature used when it was constructed. `Amp()` also accepts a named options object for measured `spars`, minimum noise figure `fMinDb`, optimum source reflection `gammaOpt`, noise resistance `noiseResistanceOhms`, and `referenceTemperature`; see [RF Constructors](./rf-constructors.md) for its full argument list.

## Noise figure: amplifier then attenuator

Set the frequency list before constructing components. `Amp(gainDb, noiseFigureDb)` and `Attn(attenuationDb)` make matched two-ports. The attenuator uses the current `nP.global.Temp` unless you supply its temperature as the second argument.

```js
nP.global.fList = nP.global.fGen(1e9, 2e9, 11);
nP.global.Temp = 290;

var amp = nP.Amp(20, 4);
var attenuator = nP.Attn(3);
var ampThenAtten = nP.nodal(
    [amp, 1, 2],
    [attenuator, 2, 3],
    ['out', 1, 3]
);

var result = ampThenAtten.out('s21dB', 'NF21dB', 'noiseFloor');
// Header, then one row per frequency: [Hz, gain dB, NF dB, dBm/Hz].
nP.lineTable({inputTable: [result], title: 'Gain and noise'});
```

`NF21dB` measures from input port 1 to output port 2. `noiseFloor` is the total noise density at port 2, in dBm/Hz, with a matched 290 K source and a noiseless matched output load. It includes both source and component noise.

The order matters: place the attenuator before the amplifier and its loss raises the combined NF. Either order has 17 dB matched gain. For a simple two-port chain, `nP.cascade(amp, attenuator)` gives the same result as the `nodal()` connection above. Both methods return reusable n-ports that retain their combined noise covariance.

## Choose a noise result

`.out()` returns a table headed `Freq`, followed by one numeric column for each selector. For a two-port, these are the most useful noise selectors:

| Selector | Result |
| --- | --- |
| `NF21` | Linear noise factor from input port 1 to output port 2. |
| `NF21dB` | Noise figure in dB: `10 * Math.log10(NF21)`. |
| `noiseFloor` | Total output noise density at port 2 from input port 1, in dBm/Hz. |
| `noiseFloor21dBmHz` | The same result with the port pair written explicitly. |
| `c22Re`, `c22Im` | Real or imaginary part of the component's port-2 noise covariance entry, in W/Hz. |

Noise factor is a ratio; noise figure expresses that ratio in dB. The noise floor includes source, component, and applicable termination noise. A covariance selector such as `c22Re` reads only the nPort's **own** noise covariance, so it is not the total measured output noise floor.

```js
var measurement = ampThenAtten.out('NF21', 'NF21dB', 'noiseFloor');
nP.lineTable({inputTable: [measurement], title: 'Two-port noise results'});

var covariance = ampThenAtten.out('c22Re');
nP.log(covariance); // preserves the small W/Hz value in scientific notation
```

The noise floor is a **density**, not the power in a receiver bandwidth. For approximately flat noise over `bandwidthHz`, convert a dBm/Hz result to dBm with `noiseFloorDbmHz + 10 * Math.log10(bandwidthHz)`.

## Other ports and measurement conditions

For an arbitrary n-port, the two digits in `NF31dB` select output port 3 and input port 1. `noiseFloor31dBmHz` uses the same port pair. `NF31` returns the linear noise factor. For port numbers 10 or higher, write `NF(10,1)dB` or `noiseFloor(10,1)dBmHz`.

By default, the source is matched at 290 K, other unused ports have matched 290 K terminations, and the selected output has a matched, noiseless load. These are **measurement** defaults; they do not change a component's construction temperature. Supply a final options object to change the measurement conditions:

```js
nP.global.fList = [1e9, 2e9];

var junction = nP.Tee();
var measured = junction.out('NF31dB', 'noiseFloor31dBmHz', {
    referenceTemperature: 290,
    source: {reflection: nP.complex(0.2, 0.1)},
    terminations: {
        2: {reflection: nP.complex(0, 0), temperature: 320},
        3: {reflection: nP.complex(0, 0), temperature: 0}
    }
});
```

The selected source must have reflection magnitude below 1. A termination's reflection magnitude can be at most 1. The `referenceTemperature` in `.out()` sets the source-noise reference for this measurement; it does not replace an amplifier's construction-time `referenceTemperature` or an attenuator's physical temperature.

## Noise stored on an nPort

The `.noise` property has one row per analysis frequency. Each row is `{frequency, C}`, where `C` is a square matrix of complex noise-wave covariance values in W/Hz. Its size matches the nPort's number of ports. For a two-port, `C[1][1]` is the port-2 self-noise entry represented by `c22Re` and `c22Im`:

```js
var firstNoiseRow = ampThenAtten.noise[0];
var frequencyHz = firstNoiseRow.frequency;
var port2Noise = firstNoiseRow.C[1][1]; // nP.complex() value
```

Passive components derive thermal covariance from their S-parameters and construction temperature. `Amp()` and biased `diode1N4148()` provide their own noise models. Connected nPorts retain the combined covariance, so a circuit built with `nP.nodal()` or `nP.cascade()` can be measured again or reused in a larger circuit.

## Diode noise

`nP.diode1N4148()` also provides noise covariance around its selected DC bias. Its model includes series-resistance thermal noise and an approximate junction-current noise level. These are weak-signal estimates around the bias point, not measured device specifications.
