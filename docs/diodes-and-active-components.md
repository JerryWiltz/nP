<!-- Modified: 2026-10-19 -->
# Diodes and active components

The public active-device constructors are `nP.Amp()` and `nP.diode1N4148()`. An amplifier is a configurable two-port gain and noise model. The diode combines a DC I–V curve with a small-signal RF n-port around one chosen bias point.

## Amplifier

`nP.Amp()` defaults to a matched, unilateral **20 dB gain** stage with **4 dB noise figure**, referenced to **290 K**. Its default S-parameters are frequency-flat across the selected list. The first two positional arguments change gain and noise figure; an options object supports measured S-parameters and other noise properties.

```js
nP.global.fList = nP.global.fGen(1e9, 2e9, 11);

var amp1 = nP.Amp();      // 20 dB gain, 4 dB NF
var amp2 = nP.Amp(15, 3); // 15 dB gain, 3 dB NF

var gainAndNoise = amp2.out('s21dB', 'NF21dB');
nP.lineTable({inputTable: [gainAndNoise], title: 'Amplifier'});
```

For two-tone intermodulation, the object form can supply `oip2dBm`, `oip3dBm`, and `harmonicOip2dBm`. None is present by default:

```js
var amp3 = nP.Amp({
    gainDb: 20,
    noiseFigureDb: 4,
    oip3dBm: 30
});
```

The full options include `spars`, `fMinDb`, `gammaOpt`, `noiseResistanceOhms`, and `referenceTemperature`. See [Noise](./noise.md) and [Intermodulation](./intermodulation.md) for measurement setup and the limits of the intercept calculation.

## 1N4148 diode: RF and DC

`nP.diode1N4148()` returns a **two-port series diode**. Its default applied bias is **0 V**, and its temperature defaults to `nP.global.Temp`. A new global context uses 293 K. The RF response is the small-signal behavior around the selected bias; the I–V method uses the same device parameters.

```js
nP.global.fList = nP.global.fGen(100e6, 2.1e9, 101);

var diode = nP.diode1N4148({biasVoltage: 0});
var rfResponse = diode.out('s11dB', 's21dB');
var dcCurve = diode.ivTable(0, 0.8, 101);

nP.lineChart({
    inputTable: [rfResponse],
    title: '1N4148 RF response',
    metricPrefix: 'giga'
});
nP.lineChart({
    inputTable: dcCurve,
    title: '1N4148 forward I–V',
    metricPrefix: 'none',
    xAxisTitle: 'Voltage (V)',
    yAxisTitle: 'Current (A)'
});
```

`ivTable(start, stop, points)` returns a table headed `['vD', 'iD']`, with volts and amperes. If you omit those arguments, the sweep defaults to **−110 V through 1 V**, **401 points**. The default RF frequency list is the selected `nP.global.fList`; `fList` in the constructor options can override it.

## Diode options and defaults

| Option | Default | Meaning |
| --- | ---: | --- |
| `is` | `2.75e-11` A | Saturation current. |
| `n` | `2` | Ideality factor. |
| `rs` | `0.568` Ω | Series resistance. |
| `cj0` | `4e-12` F | Zero-bias junction capacitance. |
| `vj` | `0.75` V | Junction potential. |
| `m` | `0.5` | Capacitance exponent. |
| `tt` | `4e-9` s | Transit time. |
| `leakageResistance` | `4e9` Ω | Parallel leakage resistance. |
| `breakdownVoltage` | `100` V | Reverse-breakdown magnitude. |
| `biasVoltage` | `0` V | Applied DC bias. |
| `temperatureK` | `nP.global.Temp` | Device temperature. |

The model also accepts `breakdownCurrent` (default **100 µA**), `breakdownSoftness` (default **2 V**), and `ivStart`, `ivStop`, `ivPoints` for the default displayed I–V sweep.

## Inspect the bias point

The returned `.diode` metadata includes normalized parameters and the calculated bias point. This helps tie the RF response to the DC condition:

```js
var diode = nP.diode1N4148({biasVoltage: 0.5});
nP.log(diode.diode.bias.current);          // amperes
nP.log(diode.diode.bias.dynamicResistance); // ohms
nP.log(diode.diode.bias.totalCapacitance);  // farads
```

The diode also supplies noise covariance and weak-signal IM2, IM3, and second-harmonic sources when used in the corresponding analyses. Its RF model is linearized at one bias point; it does not simulate large-signal switching, compression, or transient charge storage. See [Noise](./noise.md#diode-noise) and [Intermodulation](./intermodulation.md#diode-intermodulation).
