<!-- Modified: 2026-07-01 -->

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

- Static impedance/effective dielectric constant use Hammerstad/Jensen-style single microstrip equations.
- Finite conductor thickness is handled by applying an effective-width correction before calculating the single-line impedance and effective dielectric constant.
- Dispersion uses the same single-line dispersion equation family used as the isolated-line baseline for `mclin()`.
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

Qualitative Hammerstad/Jensen role in `mclin()`:

- Hammerstad/Jensen is used as the trusted single-microstrip reference model before the coupled-line corrections are applied.
- The single-line result establishes what one isolated trace with the same `Width`, `Height`, `Thickness`, and `er` would look like. This includes the isolated-line characteristic impedance and effective dielectric constant.
- That isolated-line baseline gives the coupled-line model a physically reasonable starting point. If the two traces were pulled far apart, the coupled-line behavior should approach the behavior of two independent `mlin()` lines. The Hammerstad/Jensen baseline is the reference for that limiting case.
- The coupled case then moves away from the isolated-line baseline by splitting the behavior into even and odd modes. These modes are not extra physical ports; they are a mathematical way to describe the fields on the two conductors.
- The even mode has the two conductors driven in phase. The voltage between the two traces is small, so less electric field is forced directly across the spacing gap. More of the field pattern resembles a wider, shared microstrip structure over the ground plane. This changes the modal capacitance, effective dielectric constant, and impedance compared with the isolated-line value.
- The odd mode has the two conductors driven out of phase. The voltage between the two traces is large, so a stronger electric field appears in the spacing gap. This makes the odd-mode capacitance and field distribution different from the even mode, and it is why `Zoo` is normally much lower than `Zoe` for a closely spaced pair.
- Width, height, and dielectric constant affect both the isolated-line baseline and the coupled-line corrections. Spacing mainly controls how strongly the even and odd modes separate from each other. Thickness makes a smaller but still important correction because finite copper thickness changes the effective width and edge-field behavior.
- For loose coupling, where `Space` is large compared with `Height`, `Zoe` and `Zoo` should move closer together and the four-port should look more like two weakly interacting lines. For tight coupling, where the spacing is small, the even/odd split becomes larger and the coupling term in the four-port response becomes stronger.
- The effective dielectric constants `ereoe` and `ereoo` are modal propagation quantities. They determine phase velocity for the even and odd waves, so mismatch between them affects phase balance, isolation, and coupled-port behavior along `Length`.
- The coupled-line S-parameters are built by solving the even-mode and odd-mode two-port behavior and then recombining those modal results into physical ports 1, 2, 3, and 4. This is why good modal values are more important than only matching a single through response.
- In this implementation, Hammerstad/Jensen does not directly produce the final four-port S-parameters. It supplies the single-line quantities that support the later coupled-line equations.
- The final `Zoe`, `Zoo`, `ereoe`, and `ereoo` values come from the coupled-line equation family after applying spacing, even/odd mode, finite-thickness, and dispersion effects.
- This division is useful because the single-line microstrip problem and the coupled-line modal problem are related but not identical. Keeping the single-line baseline separate makes it easier to compare `mlin()` and `mclin()` behavior and to diagnose errors in width, substrate height, thickness, or dielectric assumptions.
- A useful debugging check is to compare the isolated baseline against `mlin()` for the same geometry, then compare `Zoe`, `Zoo`, `ereoe`, and `ereoo` against a known coupled-line calculator. If the isolated baseline is wrong, the problem is probably in the single-line microstrip assumptions. If the isolated baseline is reasonable but the even/odd values are wrong, the problem is probably in spacing, finite-thickness correction, modal equations, or frequency dispersion.
- The Wcalc comparison in this file is useful because it checks the modal quantities directly, not just a final plotted S-parameter. Matching `Zoe`, `Zoo`, `ereoe`, and `ereoo` gives confidence that the geometry-to-modal-parameter stage is behaving properly before looking at loss, length, or port recombination.

## `nP.mtee()`

`nP.mtee()` is the microstrip tee-junction constructor. It is more mature than the first placeholder implementation, but it should still be treated as less validated than `mlin()` and `mclin()` until it has external reference checks.

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

Current argument names and defaults:

```js
nP.mtee({
    commonWidth = 0.023 inch,
    branch1Width = 0.023 inch,
    branch2Width = 0.023 inch,
    Height = 0.025 inch,
    Thickness = 0.0000125 inch,
    er = 10,
    rho = 1,
    tand = 0.001,
    roughnessRms = 0
})
```

Model notes:

- Each tee arm now uses the same Hammerstad/Jensen-style single microstrip baseline used by `mlin()`.
- Finite conductor thickness is handled through the same effective-width style correction used for the other microstrip constructors.
- The public nP order is `[common, branch1, branch2]`. Internal equation names may use side/main-arm naming, so keep the remap explicit.
- The returned object exposes `mtee.microstrip.commonArm`, `branch1Arm`, `branch2Arm`, `Ct`, and a per-frequency `analysis` array.
- `rho`, `tand`, and `roughnessRms` are accepted and preserved for API consistency with the other microstrip constructors. The current junction model itself is a discontinuity model without physical line length, so these values do not yet add separate conductor or dielectric attenuation at the tee. Loss should normally be supplied by the connected `mlin()` sections.
- The next maturity step is to find an external reference case or a published benchmark for a symmetric microstrip tee and pin the expected S-parameters in tests.

## `nP.mstep()`

`nP.mstep()` is the microstrip impedance-step constructor. It is a two-port discontinuity between two microstrip widths.

Public port convention:

```text
port 1 -- width1 step width2 -- port 2
```

Current argument names and defaults:

```js
nP.mstep({
    width1 = 0.046 inch,
    width2 = 0.023 inch,
    Height = 0.025 inch,
    Thickness = 0.0000125 inch,
    er = 10,
    rho = 1,
    tand = 0.001,
    roughnessRms = 0
})
```

Model notes:

- The equivalent circuit follows the QUCS technical manual microstrip impedance-step section.
- The model is a two-port Z-parameter discontinuity with one shunt capacitance `Cs` and two series inductance portions `L1` and `L2`.
- `Cs` is computed from the ratio of the wider trace to the narrower trace. The published capacitance validity statement is `er <= 10` and `1.5 <= Wwide / Wnarrow <= 3.5`.
- Total step inductance `Ls` is split into `L1` and `L2` using each port's microstrip line inductance per meter, `Z * sqrt(ere) / C0`.
- The published inductance validity statement is `Wwide / Wnarrow <= 5`, with the best-stated case at `Wnarrow / Height = 1`.
- `rho`, `tand`, and `roughnessRms` are accepted and preserved for API consistency. As with other zero-length discontinuity models, physical line loss should normally be supplied by connected `mlin()` sections.

## `nP.mbend()`

`nP.mbend()` is the 90-degree microstrip bend constructor. It is a two-port discontinuity with equal-width arms and an optional mitered corner length.

Public port convention:

```text
port 1 -- 90 degree bend -- port 2
```

Current argument names and defaults:

```js
nP.mbend({
    Width = 0.023 inch,
    miterLength = 0.5 * sqrt(2) * Width,
    Height = 0.025 inch,
    Thickness = 0.0000125 inch,
    er = 10,
    rho = 1,
    tand = 0.001,
    roughnessRms = 0
})
```

Model notes:

- The equivalent circuit follows the QUCS technical manual microstrip-corner section.
- The model is a symmetric two-port Z-parameter discontinuity with one shunt capacitance and one effective series inductance.
- The QUCS source gives separate capacitance and inductance equations for an unmitered corner and a 50% mitered bend.
- The default `miterLength` is `0.5 * sqrt(2) * Width`, which corresponds to the documented 50% mitered-bend endpoint.
- If a different `miterLength` is supplied, `mbend()` converts it to `miterFraction = miterLength / (sqrt(2) * Width)` and linearly interpolates between the unmitered and 50% mitered endpoint equations. Values above 50% use the 50% endpoint.
- The published validity statement is `0.2 <= Width / Height <= 6.0`, `2.36 <= er <= 10.4`, and operation up to 14 GHz. Qucsator additionally checks `frequency * Height <= 12e6`.
- `rho`, `tand`, and `roughnessRms` are accepted and preserved for API consistency. As with other zero-length discontinuity models, physical line loss should normally be supplied by connected `mlin()` sections.

## `nP.mtfr()`

`nP.mtfr()` is a microstrip thin-film resistor constructor. It represents a rectangular resistive film section, such as a Nichrome film resistor sputtered or evaporated onto an insulating substrate.

Current argument names and defaults:

```js
nP.mtfr({
    ohmsPerSquare = 50,
    Width = 10 mil,
    Length = 10 mil,
    temperatureCoefficient = 0,
    temperatureReference = 25
})
```

Model notes:

- The current model is a two-port series sheet resistance.
- Resistance is calculated from the number of squares:

```text
R = ohmsPerSquare * Length / Width
```

- The default geometry is one square, so the default resistance is 50 ohms.
- `temperatureCoefficient` is optional and uses the current `global.Temp`:

```text
R = Rref * (1 + temperatureCoefficient * (global.Temp - temperatureReference))
```

- This is intentionally a first-order model. It captures the dominant sheet resistance of a very lossy film section but does not yet include pad capacitance, resistor parasitic inductance, substrate coupling, distributed RC behavior, or thermal power handling.
- In layout terms it can be thought of as a very lossy zero-length `mlin()`-like element, but electrically it currently reduces to a series resistor whose value is geometry-derived.

## `nP.mvgnd()`

`nP.mvgnd()` is a one-port grounded microstrip via-hole constructor. It models a cylindrical via from the microstrip plane to ground.

Current argument names and defaults:

```js
nP.mvgnd({
    Diameter = 100e-6,
    Height = 0.025 inch,
    Thickness = 0.0000125 inch,
    rho = COPPER_RESISTIVITY
})
```

Model notes:

- The source model is the Goldfarb/Pucel cylindrical via model as documented in the QUCS technical manual microstrip via-hole section.
- The via impedance is a series resistance plus inductance:

```text
Z = R(f) + j * 2 * pi * frequency * L
```

- The DC resistance uses the cylindrical copper wall area:

```text
Rdc = rho * Height / (pi * (radius^2 - (radius - Thickness)^2))
```

- The frequency-dependent resistance follows:

```text
R(f) = Rdc * sqrt(1 + frequency / fdelta)
fdelta = rho / (pi * MU0 * Thickness^2)
```

- The inductance follows the QUCS/Goldfarb-Pucel expression using via radius and substrate height.
- QUCS implements the via as a path between two nodes; nP exposes `mvgnd()` as a grounded one-port, so its S-parameter is the reflection coefficient of that via impedance against `global.Ro`.
- The published validity statement is `Height < 0.03 * lambda0`.

## `nP.mvia()`

`nP.mvia()` is a two-port via-through constructor for first-order multilayer via work. It models a via barrel between two conductor layers rather than assuming the far end is grounded.

Current argument names and defaults:

```js
nP.mvia({
    Diameter = 100e-6,
    connectionHeight = 0.025 inch,
    Thickness = 0.0000125 inch,
    rho = COPPER_RESISTIVITY,
    er = 10,
    padDiameter = 0,
    antipadDiameter = 0,
    topPadHeight = 0,
    bottomPadHeight = 0,
    topStubLength = 0,
    bottomStubLength = 0
})
```

Model notes:

- The via barrel resistance and inductance use the same QUCS/Goldfarb-Pucel expressions as `mvgnd()`.
- The barrel is represented as a two-port series impedance between port 1 and port 2.
- Optional `padDiameter`, `antipadDiameter`, `topPadHeight`, and `bottomPadHeight` add first-order shunt capacitance at the two ports using a coaxial annular-capacitance approximation.
- Optional `topStubLength` and `bottomStubLength` add first-order open-stub shunt capacitance for unused via barrel portions.
- The network is evaluated as a pi-style ABCD cascade: input shunt capacitance, series via barrel impedance, output shunt capacitance.
- This is more appropriate than `mvgnd()` for multilayer printed wiring board connections, but it is still first order. It does not yet model plane resonances, full pad stackup, via antipad shapes, return-path discontinuities, or coupled vias.

## `nP.mcross()`

`nP.mcross()` is the microstrip cross-junction constructor. It is a four-port companion to `mtee()` and should be treated as an early model until it has external reference checks.

Public port convention:

```text
          port 2
            |
port 1 -----+----- port 3
            |
          port 4
```

Current argument names and defaults:

```js
nP.mcross({
    leftWidth = 0.023 inch,
    topWidth = 0.023 inch,
    rightWidth = 0.023 inch,
    bottomWidth = 0.023 inch,
    Height = 0.025 inch,
    Thickness = 0.0000125 inch,
    er = 10,
    rho = 1,
    tand = 0.001,
    roughnessRms = 0
})
```

Model notes:

- Each cross arm uses the same Hammerstad/Jensen-style single microstrip baseline used by `mlin()` and `mtee()`.
- Finite conductor thickness is handled through the same effective-width style correction used for the other microstrip constructors.
- The returned object exposes `mcross.microstrip.leftArm`, `topArm`, `rightArm`, `bottomArm`, `armCaps`, `armInds`, `Lcenter`, `Ct`, and a per-frequency `analysis` array.
- The current S-parameter model is a six-node equivalent circuit. Ports 1 and 3 connect through arm inductances to one internal horizontal node; ports 2 and 4 connect through arm inductances to one internal vertical node; the two internal nodes are coupled by a center inductance; each external port has a shunt capacitance representing local discontinuity capacitance.
- The six-node admittance matrix is reduced to the four external ports by eliminating the two internal nodes, then converted to a four-port S-parameter matrix.
- The equivalent-circuit topology and component equations follow the QUCS technical manual microstrip-cross section. That source describes the four capacitances, four arm inductances, center inductance, validity ranges, 0.8 center-inductance correction, dielectric correction, and first-order asymmetric-width approximation.
- The model is originally limited to opposite arms with equal width and `er = 9.9`; the QUCS technical manual gives the correction used here for other substrate permittivities and the arithmetic-mean approximation used here for mildly asymmetric opposite arms.
- The center inductance can be negative; the source explicitly notes this and treats the model as a fitted discontinuity equivalent circuit that is unphysical without external microstrip lines. For some geometries the fitted capacitance expression may also produce negative capacitance values, so tests check finiteness and reference values rather than forcing every extracted element to be positive.
- Qucsator's GPL `MSCROSS` implementation was used as an implementation cross-check. The source of authority for the equations is the QUCS technical manual page, not copied GPL code.
- This is a meaningful structural improvement over an ideal four-way node, but it is still worth benchmarking against EM simulation for important geometries.
- `rho`, `tand`, and `roughnessRms` are accepted and preserved for API consistency. As with `mtee()`, physical line loss should normally be supplied by connected `mlin()` sections.

## Sources

- K. C. Gupta, Ramesh Garg, Inder Bahl, and Prakash Bhartia, "Microstrip Lines and Slotlines" / Gupta microwave CAD material as captured in `dev/raw/mclin.pdf`. Used for older capacitance and microstrip-line context.
- Manfred Kirschning and Rolf Jansen, "Accurate Wide-Range Design Equations for the Frequency-Dependent Characteristic of Parallel Coupled Microstrip Lines", IEEE Transactions on Microwave Theory and Techniques, vol. 32, no. 1, January 1984. Used for the coupled-line quasi-static and dispersion equation family.
- Rolf Jansen, "High-Speed Computation of Single and Coupled Microstrip Parameters Including Dispersion, High-Order Modes, Loss and Finite Strip Thickness", IEEE Transactions on Microwave Theory and Techniques, vol. 26, no. 2, February 1978. Used for finite strip-thickness treatment.
- Hammerstad/Jensen single microstrip equations are used as the single-line baseline.
- QUCS technical manual, "Microstrip corner", `https://qucs.sourceforge.net/tech/node76.html`. Used for `mbend()` unmitered and 50% mitered bend capacitance, inductance, equivalent circuit, and validity ranges.
- QUCS technical manual, "Microstrip impedance step", `https://qucs.sourceforge.net/tech/node80.html`. Used for `mstep()` capacitance, inductance, validity ranges, and equivalent circuit.
- Qucs `qucs-transcalc/c_microstrip.cpp` and Qucsator `src/components/microstrip/mscoupled.cpp` were used as open implementation cross-checks, not copied as source. Qucs code is GPL, so nP should keep its implementation independently written from the published equations.
- QUCS technical manual, "Microstrip cross", `https://qucs.sourceforge.net/tech/node82.html`. Used for `mcross()` equivalent-circuit equations, limitations, dielectric correction, and asymmetric approximation.
- QUCS technical manual, "Microstrip via hole", `https://qucs.sourceforge.net/tech/node83.html`. Used for `mvgnd()` and `mvia()` via resistance, inductance, frequency correction, and validity range.
- Qucsator `src/components/microstrip/mscross.cpp` was used as an implementation cross-check for the microstrip cross-junction equivalent-circuit shape, not copied as source.

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
