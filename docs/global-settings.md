<!-- Modified: 2026-10-19 -->
# Global settings

`nP.global` provides the settings for the currently selected analysis context. A context is a saved set of frequencies, times, reference impedance, temperature, and optional two-tone settings. Set the values you need before creating components: each n-port saves its settings when it is constructed.

## Default settings

| Property | Default | Meaning |
| --- | --- | --- |
| `nP.global.fList` | `[2e9]` | Analysis frequencies in hertz |
| `nP.global.tList` | `[]` | Sample times in seconds |
| `nP.global.Ro` | `50` | S-parameter reference impedance in ohms |
| `nP.global.Temp` | `293` | Component temperature in kelvin |
| `nP.global.twoTone` | `undefined` | Optional two-tone input settings |

These properties refer to the currently selected context. Changing one affects components created afterward; it does not recalculate components already created.

## Frequency list

Assign an array of frequencies in hertz, or use `fGen(start, stop, points)` to make an evenly spaced list that includes both endpoints.

```js
nP.global.fList = nP.global.fGen(100e6, 2e9, 51);

var r1 = nP.R(50);
var response = r1.out('s11dB');
```

This example analyzes 51 frequencies from 100 MHz through 2 GHz. `response` has a heading row followed by one result row for each frequency.

Each n-port also stores **frequency rows** in its `.spars` array. A row starts with its frequency in hertz and then contains that frequency's complex S-parameters. For a two-port, the shape is `[frequency, s11, s12, s21, s22]`. Two components have matching frequency rows when these frequencies appear in the same order, one for one. `nP.nodal()` and `nP.cascade()` require that match when connecting components; having the same number of rows is not enough. When two-tone analysis is enabled, constructors add rows for the additional tone and product frequencies too.

A constructor can use a separate frequency list by accepting `fList` in its options. Components intended for the same network still need matching rows. See [RF Constructors](./rf-constructors.md) for the component families.

## Time list

`tGen(start, stop, points)` creates an evenly spaced array of time samples in seconds, including both endpoints. It requires finite start and stop values, an increasing interval, and at least two points.

```js
nP.global.tList = nP.global.tGen(0, 1e-6, 101);
```

`nP.PN()` uses `tList` for its clock times unless you pass a `time` array directly to `PN()`. The list must also meet that function's sequence-length requirements. See the [Tutorial](./tutorial.md) for a signal-through-circuit example.

## Reference impedance and temperature

`Ro` is the impedance used as the reference for S-parameters; it defaults to 50 Ω. `Temp` is the temperature used by components with thermal noise; it defaults to 293 K. Set either value before creating components that use it.

```js
nP.global.Ro = 50;
nP.global.Temp = 290;
nP.global.fList = [1e9, 2e9];

var attenuator = nP.Attn(3);
```

The 3 dB attenuator in this example uses a 50 Ω reference and the selected 290 K temperature for its passive noise model.

## Two-tone analysis

Set `twoTone` before constructing components for an intermodulation analysis. `fList` contains the swept first-tone frequencies; `spacingHz` is the frequency difference between the first and second tones. `p1dBm` and `p2dBm` are their input powers in dBm (decibels relative to 1 mW).

```js
nP.global.fList = nP.global.fGen(1e9, 2e9, 11);
nP.global.twoTone = {
    spacingHz: 1e6,
    p1dBm: -30,
    p2dBm: -25
};

var amp = nP.Amp({gainDb: 20, oip3dBm: 30});
```

Use `nP.global.twoTone = undefined` when returning to an ordinary frequency sweep. See [Intermodulation](./intermodulation.md) for product and intercept selectors. For noise measurement conditions, see [Noise](./noise.md).

## Independent circuits

Call `nP.global()` to start a circuit with a fresh set of the default analysis settings. Save the returned context so you can select that circuit again. Select it with `nP.global(savedContext)` before creating its components.

```js
var circuitA = nP.global();
circuitA.fList = [1e9, 2e9];

var circuitB = nP.global();
circuitB.fList = [3e9, 4e9];

nP.global(circuitA);
var r1 = nP.R(50);

nP.global(circuitB);
var r2 = nP.R(75);

nP.global(circuitA);
var r3 = nP.R(50);
```

`r1` and `r3` have rows at 1 and 2 GHz; `r2` has rows at 3 and 4 GHz. They cannot be connected in one network because their frequency rows do not match. Assigning `circuitA.fList` alone does not select circuit A: call `nP.global(circuitA)` to select it. Switching contexts changes which settings future constructors read; it does not change components already created.
