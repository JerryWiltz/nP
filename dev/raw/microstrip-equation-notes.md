<!-- Modified: 2026-06-30 -->

# Microstrip Equation Notes

These notes track the equation sources used for nP microstrip constructors. They are intentionally short so the implementation is tied to identifiable references without copying long source text or papers into the repo.

Future transmission-media notes can follow this pattern, for example `stripline-equation-notes.md` and `waveguide-equation-notes.md`.

## Shared Inputs

Use the same physical names and units across microstrip constructors:

- `Width`: conductor width, meters.
- `Space`: spacing between coupled traces, meters.
- `Height`: substrate height, meters.
- `Thickness`: conductor thickness, meters.
- `Length`: line length, meters.
- `er`: relative dielectric constant.
- `rho`: conductor resistivity relative to copper.
- `tand`: dielectric loss tangent.
- `roughnessRms`: optional RMS surface roughness, meters.

Shared constants come from `src/np-nport/src/mlin/constants.js`:

- `INCH_TO_METER`
- `MIL_TO_METER`
- `C0`
- `EPSILON0`
- `MU0`
- `VACUUM_IMPEDANCE`
- `COPPER_RESISTIVITY`

## `nP.mlin()`

`nP.mlin()` models a single microstrip transmission line as a two-port.

Current argument order:

```js
nP.mlin(
    Width,
    Height,
    Length,
    Thickness,
    er,
    rho,
    tand,
    roughnessRms
)
```

Current defaults:

```text
Width = 0.023 inch
Height = 0.025 inch
Length = 0.5 inch
Thickness = 0.0000125 inch
er = 10
rho = 1
tand = 0.001
roughnessRms = 0
```

Model notes:

- Static impedance/effective dielectric constant currently follow the older Gupta-style implementation already present in nP.
- Dispersion moves the microstrip impedance/effective dielectric constant toward a stripline limiting value.
- Conductor loss uses `rho` through copper-relative surface resistance.
- Dielectric loss uses `tand`.
- Surface roughness increases conductor surface resistance when `roughnessRms > 0`:

```text
Rs *= 1 + (2 / pi) * atan(1.4 * (roughnessRms / skinDepth)^2)
```

The roughness default is zero so older calls remain compatible.

## `nP.mclin()`

`nP.mclin()` models equal-width, parallel coupled microstrip lines as a four-port. The public port order is clockwise from the upper-left port:

```text
port 1  ---- coupled line ----  port 2
port 4  ---- coupled line ----  port 3
```

Current argument order:

```js
nP.mclin(
    Width,
    Space,
    Height,
    Thickness,
    Length,
    er,
    rho,
    tand,
    roughnessRms
)
```

Current defaults:

```text
Width = 19.1155 mil
Space = 5.82185 mil
Height = 25 mil
Thickness = 0.0000125 inch
Length = 719.794 mil
er = 10
rho = 1
tand = 0.001
roughnessRms = 0
```

Model notes:

- The model assumes symmetric coupled lines with one shared `Width`.
- Hammerstad/Jensen single microstrip equations provide the single-line baseline impedance and effective dielectric constant used by the coupled-line equations.
- Kirschning/Jansen-style equations provide even/odd quasi-static impedance, even/odd effective dielectric constant, and frequency dispersion.
- `frequency * Height / 1e6` is the normalized `GHz-mm` frequency variable when frequency is in Hz and height is in meters.
- The n-port assembly uses even/odd two-port sections and recombines them into the four-port S-parameter matrix.
- Loss includes conductor loss, dielectric loss, and optional RMS roughness correction. The roughness default is zero so older calls remain compatible.

## `nP.mtee()`

`nP.mtee()` is the microstrip tee-junction constructor. It is still early compared with `mlin()` and `mclin()`.

Public port convention follows the ideal `nP.Tee()` power-divider use:

```text
          port 2
            |
port 1 -----+
            |
          port 3
```

Use:

- `commonWidth` for port 1.
- `branch1Width` for port 2.
- `branch2Width` for port 3.

Continue collecting mtee-specific equations here or in focused raw notes until the model is mature.

## Sources

- K. C. Gupta, Ramesh Garg, Inder Bahl, and Prakash Bhartia, "Microstrip Lines and Slotlines" / Gupta microwave CAD material as captured in `dev/raw/mclin.pdf`. Used for older capacitance and microstrip-line context.
- Manfred Kirschning and Rolf Jansen, "Accurate Wide-Range Design Equations for the Frequency-Dependent Characteristic of Parallel Coupled Microstrip Lines", IEEE Transactions on Microwave Theory and Techniques, vol. 32, no. 1, January 1984. Used for the coupled-line quasi-static and dispersion equation family.
- Rolf Jansen, "High-Speed Computation of Single and Coupled Microstrip Parameters Including Dispersion, High-Order Modes, Loss and Finite Strip Thickness", IEEE Transactions on Microwave Theory and Techniques, vol. 26, no. 2, February 1978. Used for finite strip-thickness treatment.
- Hammerstad/Jensen single microstrip equations are used as the single-line baseline.
- Qucs `qucs-transcalc/c_microstrip.cpp` and Qucsator `src/components/microstrip/mscoupled.cpp` were used as open implementation cross-checks, not copied as source. Qucs code is GPL, so nP should keep its implementation independently written from the published equations.

## Reference Check

For the current `nP.mclin()` default geometry at 1.8 GHz:

```text
Width = 19.1155 mil
Space = 5.82185 mil
Height = 25 mil
Thickness = 0.0000125 inch
Length = 719.794 mil
er = 10
tand = 0.001
rho = 1
```

The model gives:

```text
Zoe   = 72.25036995770157 ohms
Zoo   = 34.59185454255114 ohms
ereoe = 7.112784879904657
ereoo = 5.672289633106345
```

These are close to the Wcalc values used during development:

```text
Zeven = 72.2452 ohms
Zodd  = 34.6044 ohms
keven = 7.11099
kodd  = 5.67166
```
