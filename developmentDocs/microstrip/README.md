<!-- Modified: 2026-09-06 -->
# Microstrip Development Notes

The physical microstrip constructors live in `src/np-nport/src/mlin/`. They turn geometry, material properties, loss parameters, and frequency into n-port-compatible S-parameter rows.

These are engineering closed-form and equivalent-circuit models, not full-wave electromagnetic simulation. Every model must retain its source family, assumptions, validity limits, and reference-plane convention.

## Shared constants

Use the names exported by `src/np-nport/src/mlin/constants.js`:

| Constant | Meaning |
| --- | --- |
| `INCH_TO_METER` | Exactly `0.0254`. |
| `MIL_TO_METER` | One thousandth of an inch in meters. |
| `C0` | Speed of light in vacuum. |
| `EPSILON0` | Vacuum permittivity. |
| `MU0` | Vacuum permeability. |
| `VACUUM_IMPEDANCE` | `120π` ohms in the current implementation. |
| `COPPER_RESISTIVITY` | Copper resistivity used by conductor-loss and via models. |

Do not introduce alternate spellings or duplicate nearby constants. Convert user-facing inch or mil examples to meters before calling a constructor.

## Common parameter meanings

Most models use some subset of:

| Name | Meaning and unit |
| --- | --- |
| `width` or named width | Conductor width in meters. |
| `spacing` | Edge-to-edge coupled-line spacing in meters. |
| `height` | Substrate or connection height in meters. |
| `length` | Physical propagation length in meters. |
| `thickness` | Conductor thickness in meters. |
| `relativePermittivity` | Relative dielectric constant; dimensionless. |
| `resistivity` | Absolute bulk resistivity in ohm-meters. |
| `lossTangent` | Dielectric loss tangent; dimensionless. |
| `roughnessRms` | RMS conductor roughness in meters. |
| `Ro` | Reference impedance taken from `global.Ro`, in ohms. |

The canonical object API and compatibility rules are defined in [`../physical-model-api.md`](../physical-model-api.md). Legacy `rho` remains constructor-specific only so existing scripts keep their numerical behavior:

- In `mlin()` and `mclin()`, default `rho = 1` acts as a multiplier on `COPPER_RESISTIVITY`; `rho = 0` disables conductor loss.
- In `mvgnd()` and `mvia()`, default `rho = COPPER_RESISTIVITY` is an absolute resistivity in ohm-meters.
- Some discontinuity option objects retain `rho`, `tand`, and `roughnessRms` for a common physical interface even where the current junction equivalent circuit does not apply those losses directly.

New code must use absolute `resistivity`. Supplying both names is an error.

## Uniform line: `mlin()`

```js
nP.mlin({ width, height, length, thickness, relativePermittivity, resistivity, lossTangent, roughnessRms })
```

The implementation performs:

1. Normalize width and thickness by substrate height.
2. Apply a finite-thickness effective-width correction.
3. Calculate quasi-static effective dielectric constant and impedance with Hammerstad/Jensen-style equations.
4. Apply frequency dispersion to effective dielectric constant and impedance.
5. Calculate conductor loss from surface resistance, skin depth, and optional roughness correction.
6. Calculate dielectric loss from loss tangent.
7. Form the complex propagation constant.
8. Convert the transmission-line section to a reciprocal two-port S matrix referenced to `global.Ro`.

The returned `.microstrip` object contains geometry, material inputs, quasi-static values, first-frequency values, and a per-frequency `analysis` array with dispersive impedance, effective dielectric constant, loss, and skin depth.

## Coupled line: `mclin()`

```js
nP.mclin({ width, spacing, height, thickness, length, relativePermittivity, resistivity, lossTangent, roughnessRms })
```

`mclin()` uses the Kirschning/Jansen equal-width coupled-microstrip equation family, with Qucs used as a cross-check. It computes quasi-static and dispersive even- and odd-mode quantities:

```text
Zoe, Zoo, effectiveErEven, effectiveErOdd
```

Separate mode loss and propagation constants produce even- and odd-mode two-ports. Those modes are recombined into the public four-port S matrix.

Public ports are clockwise from the upper left:

```text
port 1  ---- coupled line ----  port 2
port 4  ---- coupled line ----  port 3
```

At port 1 excitation, port 2 is through, port 4 is coupled, and port 3 is isolated. The `.microstrip.dispersion` array records both modes at every frequency.

Useful checks include `Zoe > Zoo`, reciprocity, finite values, large-spacing behavior, known calculator anchors, and reduced transmission when losses are enabled.

## Tee junction: `mtee()`

```js
nP.mtee({
    commonWidth,
    branch1Width,
    branch2Width,
    height,
    thickness,
    relativePermittivity,
    resistivity,
    lossTangent,
    roughnessRms
})
```

The implementation uses the Qucs microstrip Tee equations 11.207–11.224 and the Hammerstad/Bekkadal-style junction family discussed by Edwards/Steer. It calculates arm baselines, reference-plane shifts, transformer ratios, and shunt susceptance.

Published equations use the order `[branch1, branch2, common]`; nP remaps them to `[common, branch1, branch2]`. Public port 1 is therefore always the common branch.

The metadata records arm calculations, junction capacitance, per-frequency intermediate values, source text, and limitations. The cited caution is increasing discrepancy when twice the effective width divided by guided wavelength exceeds about `0.3`, or when impedance ratio exceeds roughly `2`.

## Step discontinuity: `mstep()`

`mstep({ width1, width2, Height, Thickness, er, ... })` models a width transition with an equivalent shunt capacitance and split series inductance.

The implementation selects between the Edwards/Steer and Garg/Bahl slight-step and large-step capacitance forms based on width ratio. Metadata records the selected equation and its stated range. The inductance approximation is documented for width ratio no greater than about five and is best stated near narrow-width-to-height ratio one.

Changing the direction of the step must preserve the correct public port geometry and reciprocal network behavior.

## Bend discontinuity: `mbend()`

`mbend({ Width, miterLength, Height, Thickness, er, ... })` currently applies Edwards/Steer capacitance and inductance equations for an unmitered bend.

The object reports a recommended miter fraction and requested miter geometry, but the current C/L equations do not modify the S matrix for that miter. Do not describe the present model as a solved mitered-bend model.

Metadata preserves the published dielectric and width-to-height validity ranges.

## Cross junction: `mcross()`

`mcross()` creates a four-port equivalent circuit with arm capacitances, arm inductances, and a center inductance. It reduces internal nodes through complex admittance matrices and converts the external admittance matrix to S parameters.

The source family is Qucs equations 11.226–11.231 and Edwards/Steer section 9.6.3. The documented limitation is important: theory-to-experiment agreement is weak, especially for inductance parameters, and asymmetric widths remain an engineering approximation until independently benchmarked.

Public width names are `leftWidth`, `topWidth`, `rightWidth`, and `bottomWidth`; preserve that physical order in the four-port matrix.

## Thin-film resistor: `mtfr()`

`mtfr()` represents sheet resistance distributed along a microstrip path. It calculates the number of squares, temperature-adjusted total resistance, divides the structure into sections, and cascades:

```text
half microstrip line → series resistor → half microstrip line
```

Automatic segmentation is bounded between 10 and 200 sections. The returned `.filmResistor` metadata records sheet resistance, geometry, segmentation, total resistance, and temperature inputs.

`global.Temp` and canonical `referenceTemperature` are absolute temperatures in kelvin; `referenceTemperature` defaults to `298.15`. The legacy `temperatureReference` alias retains its historical behavior of using the same scale as `global.Temp` so existing Celsius-based calls remain compatible.

## Via models

### `mvgnd()`

`mvgnd()` is a one-port via-to-ground model. It combines DC resistance, frequency-dependent resistance, and barrel inductance. Its Goldfarb/Pucel validity note states `Height < 0.03 × free-space wavelength`.

### `mvia()`

`mvia()` is a two-port through-via model. It uses a series barrel impedance with optional shunt capacitance for pads, antipads, and unused stubs. Barrel resistance and inductance follow the same basic via family; pad and stub capacitances are first-order coaxial approximations.

Keep the distinction clear: `mvgnd()` terminates to ground and returns one port; `mvia()` transfers between two signal reference planes and returns two ports.

## Metadata contract

Most physical constructors attach `.microstrip` with:

- Original geometry and material inputs.
- Derived quasi-static or equivalent-circuit values.
- A per-frequency `analysis` array where appropriate.
- Source or model-family notes.
- Validity ranges and limitations.

This metadata is intentionally inspectable for development and verification. It does not replace the common `.spars` interface.

## Source material

The working source notes are under `dev/raw/`, including:

- `hammerstad_jensen.md`
- `microstrip_discontinuities.md`
- Captured Edwards/Steer PDF excerpts for bends, steps, and junctions.

Raw notes may contain competing equations or unfinished interpretation. Once an equation family is selected, record that decision and the symbol mapping in this directory and keep the implementation metadata aligned with it.

Use canonical spellings: Hammerstad/Jensen, Kirschning/Jansen, Edwards/Steer, Garg/Bahl, Goldfarb/Pucel, and Qucs.

## Verification checklist

For every physical model:

1. Confirm all length inputs are meters.
2. Confirm reference planes and public port order.
3. Pin at least one external or published result.
4. Test symmetry and reciprocity required by the model.
5. Test finite values throughout the stated validity range.
6. Test a physical limit such as zero loss, zero length, large spacing, or equal widths.
7. Verify loss and roughness move transmission in the expected direction.
8. Verify metadata matches the values actually used to create the S matrix.
9. Verify direct use and `nP.nodal()` composition.
10. Render a focused browser example when the result is intended for interactive inspection.
