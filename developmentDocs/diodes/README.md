<!-- Modified: 2026-07-15 -->
# Diode Development Notes

Diode and nonlinear-device models live under `src/np-diodes/`. The current public model is `nP.diode1N4148()`.

The design goal is to keep DC device behavior and small-signal RF behavior visibly connected. One constructor defines the physical and fitted parameters, calculates the operating point, emits an n-port-compatible RF result, and exposes a DC I-V table.

## Public workflow

```js
var g = nP.global;
g.fList = g.fGen(100e6, 2.1e9, 101);
g.Ro = 50;
g.Temp = 293;

var diode = nP.diode1N4148({ biasVoltage: 0 });

var rfOutput = diode.out('s11dB', 's21dB');
var dcOutput = diode.ivTable(-1, 1, 201);
```

`rfOutput` follows the normal n-port numeric-table shape. `dcOutput` begins with `['vD', 'iD']` and contains volts and amperes.

The development examples are:

- `dev/diodeDevelopment.html` for direct browser execution.
- `dev/diodeDevelopment.md` for the Obsidian `npjs` workflow.

## Current 1N4148 model

`src/np-diodes/src/diode1N4148.js` returns a reciprocal series two-port. It combines:

- Shockley forward current.
- Series resistance.
- Parallel leakage resistance.
- Soft reverse-breakdown current.
- Bias-dependent junction capacitance.
- Transit-time-derived diffusion capacitance.
- A small-signal conductance calculated at the requested bias.

The model metadata identifies Vishay and onsemi 1N4148/1N4x48 datasheet families as its parameter anchors.

## Options and units

| Option | Default | Meaning |
| --- | ---: | --- |
| `is` | `2.75e-11` | Saturation current in amperes. |
| `n` | `2` | Emission or ideality coefficient. |
| `rs` | `0.568` | Series resistance in ohms. |
| `cj0` | `4e-12` | Zero-bias junction capacitance in farads. |
| `vj` | `0.75` | Junction potential in volts. |
| `m` | `0.5` | Junction grading coefficient. |
| `tt` | `4e-9` | Transit time in seconds. |
| `leakageResistance` | `4e9` | Parallel leakage resistance in ohms. |
| `breakdownVoltage` | `100` | Reverse-breakdown magnitude in volts. |
| `breakdownCurrent` | `100e-6` | Breakdown scale current in amperes. |
| `breakdownSoftness` | `2` | Exponential softening voltage in volts. |
| `biasVoltage` | `0` | External DC bias voltage in volts. |
| `temperatureK` | `global.Temp` | Absolute temperature in kelvin. |
| `ivStart` | `-110` | Default I-V start voltage. |
| `ivStop` | `1` | Default I-V stop voltage. |
| `ivPoints` | `401` | Default number of I-V samples. |

The elementary charge and Boltzmann constant use exact SI values, and thermal voltage is:

```text
VT = kT / q
```

## DC operating-point calculation

For a requested external voltage, the junction voltage depends on series-resistance drop:

```text
Vjunction = Vexternal - I × Rs
```

The current therefore cannot be obtained by one direct Shockley evaluation. The implementation uses Newton iteration to solve the combined forward exponential, leakage, series resistance, and reverse-breakdown terms.

The current iteration:

- Starts from a simple polarity-dependent estimate.
- Limits the forward exponential argument to `80` to avoid immediate overflow.
- Includes the derivative of the leakage and breakdown terms.
- Stops when the current change meets an absolute or relative tolerance.
- Runs at most 60 iterations and returns the last estimate if convergence is not reached earlier.

New diode work should expose convergence failure explicitly if it adds parameter ranges where silent non-convergence is plausible.

## Junction and diffusion capacitance

Below the junction potential, depletion capacitance is calculated as:

```text
Cj = Cj0 / (1 - Vjunction / Vj)^m
```

At or above `Vj`, the current implementation clamps the denominator base to `1e-12`. This prevents a direct invalid power operation but can produce an extremely large capacitance. It is a pragmatic numerical guard, not a physically complete forward-bias depletion-capacitance model.

Diffusion capacitance is:

```text
Cdiffusion = tt × smallSignalConductance
```

Total small-signal capacitance is the sum of junction and diffusion capacitance.

## Small-signal RF model

At `biasVoltage`, the constructor calculates:

- DC current.
- Internal junction voltage.
- Incremental junction conductance.
- Dynamic resistance.
- Junction capacitance.
- Diffusion capacitance.

For each frequency:

```text
Yjunction = conductance + jωCtotal
Zjunc     = 1 / Yjunction
Ztotal    = Rs + Zjunc
```

`Ztotal` is converted to a reciprocal series two-port referenced to `global.Ro`:

```text
S11 = S22 = Ztotal / (Ztotal + 2 Ro)
S21 = S12 = 2 Ro / (Ztotal + 2 Ro)
```

The returned rows are therefore compatible with `.out()`, `nP.nodal()`, `nP.cascade()`, and the chart/table renderers.

This is a linearized small-signal RF model at one bias point. It is not a large-signal transient, harmonic-balance, switching-storage, or intermodulation simulation.

## DC I-V table

The returned method:

```js
diode.ivTable(start, stop, points)
```

uses the same DC solver and parameter set as the RF bias calculation. That shared parameter path is important: the plotted I-V curve and the RF small-signal operating point should not silently describe different devices.

The table current is in amperes. A chart that labels milliamperes must multiply the data by `1000`, as the development example does.

## Metadata

The returned `.diode` object contains:

- `partNumber` and model description.
- Source summary.
- The normalized parameter object.
- Bias-point current, junction voltage, dynamic resistance, and capacitances.
- Datasheet anchor descriptions for forward voltage, capacitance, recovery, leakage, and breakdown.

Preserve this inspectable metadata when extending the model. If a parameter is fitted rather than taken directly from a datasheet, say so and document the fitting target.

## Known limitations

- The RF equivalent circuit currently contains series resistance and the parallel small-signal junction branch, but no explicit package inductance.
- Junction-capacitance behavior above `Vj` is a numerical clamp rather than a full forward-bias capacitance model.
- Reverse breakdown is a soft empirical exponential.
- Parameters are representative datasheet anchors, not a statistical production spread.
- Temperature scaling is included through thermal voltage, but not every physical parameter has an independent temperature coefficient.
- The model assumes one bias point for the entire frequency sweep.
- Noise, charge conservation, transient recovery, and large-signal distortion are not modeled.

These limits should remain visible so the convenience of the model is not mistaken for greater physical fidelity.

## Adding another diode

1. Identify the intended use: small-signal RF, detector, switching, varactor, power rectifier, or another class.
2. Record datasheet revision, parameter provenance, fitted values, units, and temperature conditions.
3. Define one normalized parameter object used by both DC and RF calculations.
4. Add package and junction parasitics appropriate to the intended frequency range.
5. Solve and expose the DC operating point.
6. Build a square n-port S matrix at every configured frequency.
7. Expose an I-V table and any other useful engineering curves.
8. Attach bias, parameter, source, and validity metadata.
9. Export the constructor through `src/np-diodes/index.js` and the root `src/index.js` path.
10. Add tests and browser/Obsidian development examples showing both RF and DC behavior.

## Verification checklist

- S-row count follows `global.fList`.
- Every RF row has `1 + n²` entries.
- Reciprocal terms agree when reciprocity is assumed.
- DC current is monotonic over ordinary forward bias.
- Zero-bias and reverse-bias capacitance follow the intended model.
- The default model meets its pinned forward-current and breakdown anchors.
- Small-signal resistance agrees with the derivative of the DC equation at bias.
- Increasing loss or series resistance affects RF transmission in the expected direction.
- I-V table headers and current units are correct.
- All values remain finite over the documented operating range, except intentionally represented open-circuit limits.
