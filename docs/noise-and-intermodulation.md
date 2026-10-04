<!-- Modified: 2026-10-04 -->
# Noise figure and intermodulation

nP carries S-parameters and noise covariance in each n-port. An amplifier can also carry output intercept specifications for a one-pass, two-tone intermodulation analysis. Connect components with `nP.nodal()` or `nP.cascade()`, then use the same `.out(...)` method for gain, noise, and intermodulation results.

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
```

`NF21dB` measures from input port 1 to output port 2. `noiseFloor` is the total noise density at port 2, in dBm/Hz, with a matched 290 K source and a noiseless matched output load. It includes both source and component noise. To get noise power over a specified bandwidth, add `10 * Math.log10(bandwidthHz)` to the dBm/Hz result.

The order matters: place the attenuator before the amplifier and its loss raises the combined NF. Either order has 17 dB matched gain. For a simple two-port chain, `nP.cascade(amp, attenuator)` gives the same result as the `nodal()` connection above. Both methods return reusable n-ports that retain their combined noise covariance.

### Other ports and measurement conditions

For an arbitrary n-port, the two digits in `NF31dB` select output port 3 and input port 1. `noiseFloor31dBmHz` uses the same port pair. `NF31` returns the linear noise factor. For port numbers 10 or higher, write `NF(10,1)dB` or `noiseFloor(10,1)dBmHz`.

By default, the source is matched at 290 K, other unused ports have matched 290 K terminations, and the selected output has a matched, noiseless load. Supply a final options object to change the measurement conditions:

```js
var measured = threePort.out('NF31dB', 'noiseFloor31dBmHz', {
    referenceTemperature: 290,
    source: {reflection: nP.complex(0.2, 0.1)},
    terminations: {
        2: {reflection: nP.complex(0, 0), temperature: 320},
        3: {reflection: nP.complex(0, 0), temperature: 0}
    }
});
```

The selected source must have reflection magnitude below 1. These settings describe the measurement; each component's own temperature remains the one used to construct its noise covariance. `Amp()` also accepts an options object with `spars`, `fMinDb`, complex `gammaOpt`, `noiseResistanceOhms`, and `referenceTemperature` when a source-dependent amplifier noise model is available.

## Two-tone IP2, IP3, and harmonics

Set `global.twoTone` **before** constructing the components. `fList` contains the swept first-tone frequencies, `spacingHz` places the second tone above each first-tone point, and `p1dBm` and `p2dBm` are the two available source powers. They may differ.

```js
nP.global.fList = nP.global.fGen(1e9, 2e9, 11);
nP.global.twoTone = {
    spacingHz: 1e6,
    p1dBm: -30,
    p2dBm: -25
};

var amp = nP.Amp({
    gainDb: 20,
    noiseFigureDb: 4,
    oip2dBm: 42,
    oip3dBm: 30,
    harmonicOip2dBm: 40
});
var attenuator = nP.Attn(3);
var ampThenAtten = nP.nodal(
    [amp, 1, 2],
    [attenuator, 2, 3],
    ['out', 1, 3]
);

var results = ampThenAtten.out(
    'NF21dB', 'IM2sum21dBm', 'OIP2sum21dBm',
    'IM3lower21dBm', 'OIP3lower21dBm', 'H2f121dBm'
);
// Header, then 11 rows indexed by the first-tone frequency in Hz.
```

`oip2dBm` and `oip3dBm` describe *two-tone* output intercepts for a matched amplifier. `harmonicOip2dBm` separately describes the second-harmonic output intercept. Omitting an intercept means the amplifier generates no product of that type. nP does not infer a harmonic intercept from two-tone IP2 or vice versa.

| Selector for ports 2 ← 1 | Output |
| --- | --- |
| `IM2diff21dBm`, `IM2sum21dBm` | Power at `f₂ − f₁` and `f₁ + f₂` |
| `IM3lower21dBm`, `IM3upper21dBm` | Power at `2f₁ − f₂` and `2f₂ − f₁` |
| `H2f121dBm`, `H2f221dBm` | Power at `2f₁` and `2f₂` |
| `OIP2sum21dBm`, `OIP3lower21dBm` | Extrapolated two-tone output intercepts |
| `OIP2f121dBm`, `OIP2f221dBm` | Extrapolated harmonic output intercepts |

Replace the final two port digits for another output/input pair; for a port numbered 10 or higher use parentheses, for example `IM3lower(10,1)dBm`. `.out()` returns one row per `fList` point even though every built-in n-port constructor creates extra internal S-parameter rows at both fundamentals and all six listed product frequencies. With the sweep above, they create 75 unique frequency rows. Each sweep point is analyzed separately, including when product frequencies from different points coincide.

To chart one result, pass its `.out()` table directly to `lineChart()`:

```js
var ip3 = ampThenAtten.out('OIP3lower21dBm');
nP.lineChart({
    inputTable: [ip3],
    mount: '#ip3-chart',
    title: 'Output IP3 versus first-tone frequency',
    metricPrefix: 'giga'
});
```

Use a page element such as `<div id="ip3-chart"></div>` for the chart mount. `nP.cascade(amp, attenuator)` and nested `nodal()` or `cascade()` calls retain the known internal amplifier sources. Product waves propagate with their complex phase through the S-parameter network at each product frequency. Optional `phase1Deg` and `phase2Deg` set input phases; `im2PhaseDeg`, `im3PhaseDeg`, and `harmonic2PhaseDeg` set amplifier product phases.

This is a one-pass, weak-nonlinearity calculation. It does not model compression or products generated by remixing earlier products. Linear passive parts generate no intrinsic IP2 or IP3 products; they transmit existing product waves at their own frequencies. A custom n-port must provide matching S and noise rows at every required frequency. An OIP selector raises an error when its product coincides with a fundamental or another product, because the separate intercept cannot then be recovered from the combined wave.

The built-in `diode1N4148()` also supports noise and intermodulation around its selected DC bias. Its noise covariance uses series-resistance thermal noise and an approximate junction-current noise level. Its one-pass IM2, IM3, and harmonic waves come from the junction current and charge derivatives. These are weak-signal estimates around the bias point; the model does not include large-signal compression or a datasheet-calibrated intercept.
