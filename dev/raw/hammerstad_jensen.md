<!-- Modified: 2026-07-02 -->

# Hammerstad/Jensen Equation Derivation Notes

This note explains how equations like the Hammerstad/Jensen microstrip equations are usually derived and how to think about them when using them in nP.

## Main Idea

Hammerstad/Jensen equations are not simple laws of nature in the same sense as Maxwell's equations. They are engineering closed-form approximations. They compress a complicated electromagnetic field problem into formulas that are fast enough to use in circuit calculators and code.

The usual path is:

1. Start with Maxwell's equations for a transmission-line cross section.
2. Make quasi-TEM assumptions so the microstrip can be treated mostly like a transmission line with voltage, current, impedance, capacitance, and effective dielectric constant.
3. Solve or approximate the two-dimensional field geometry for simplified cases.
4. Use conformal mapping and capacitance relationships to connect geometry to impedance.
5. Correct the simplified result for finite dielectric constant, conductor width, substrate height, conductor thickness, and sometimes frequency.
6. Fit the remaining error against numerical field solutions, measurements, or more exact calculations.
7. Publish compact equations with stated validity ranges.

So the formulas are partly physics, partly approximation, and partly curve fit.

## What The Maxwell Starting Point Looks Like

The physical starting point is the electromagnetic field around the microstrip cross section. The line extends in the `z` direction. The fields vary across the `x-y` plane.

Simple cross-section sketch:

```text
                 air, epsilon approximately EPSILON0

                 fringing electric field
              . . . . . . . . . . . . .
            .                               .
          .       signal strip, voltage V     .
          .        <------ Width ------>       .
          .        ====================        .  y = Height
          .          |      |      |           .
          .          |  E   |      |           .
          .          |      |      |           .
          .          v      v      v           .
          -------------------------------------  y = 0
                         ground plane

                 dielectric substrate, er
```

The full time-domain Maxwell equations are:

```text
curl(E) = -dB/dt
curl(H) = J + dD/dt
div(D)  = rho_v
div(B)  = 0
```

With material relationships:

```text
D = epsilon * E
B = mu * H
J = sigma * E
```

For a transmission line, the fields are assumed to propagate mostly along `z`:

```text
E(x, y, z, t) = E(x, y) * exp(-gamma * z) * exp(j * omega * t)
H(x, y, z, t) = H(x, y) * exp(-gamma * z) * exp(j * omega * t)
```

The hard problem is solving `E(x, y)` and `H(x, y)` in a geometry with two dielectrics:

```text
epsilon = EPSILON0          in air
epsilon = er * EPSILON0     in the substrate
```

The boundary conditions are the parts that make the problem physical:

- Tangential `E` is approximately zero on a perfect conductor.
- The signal strip is one equipotential surface, usually called voltage `V`.
- The ground plane is another equipotential surface, usually `0 V`.
- Normal `D` changes at dielectric boundaries according to free surface charge.
- Tangential `E` is continuous across the air/dielectric interface.
- Tangential `H` at conductor surfaces relates to surface current.

For a quasi-static derivation, this field problem is reduced to an electrostatic potential problem over the cross section:

```text
E = -grad(phi)
div(epsilon * grad(phi)) = 0
```

Subject to:

```text
phi = V     on the signal strip
phi = 0     on the ground plane
```

Once `phi(x, y)` is known or approximated, the electric field follows from `E = -grad(phi)`. The charge per unit length on the strip is then found from electric flux:

```text
Q' = integral(D dot n) dl
```

The capacitance per unit length is:

```text
C' = Q' / V
```

Do this twice:

```text
C_air = capacitance with all dielectric replaced by air
C_er  = capacitance with the real substrate present
```

Then the effective dielectric constant is approximately:

```text
ereff = C_er / C_air
```

The characteristic impedance can be written in terms of the air-filled capacitance and the effective dielectric constant:

```text
Zo approximately 1 / (C_air * C0 * sqrt(ereff))
```

Equivalently, using per-unit-length inductance and capacitance:

```text
Zo = sqrt(L' / C')
vp = 1 / sqrt(L' * C')
vp = C0 / sqrt(ereff)
```

That is the bridge from Maxwell's equations to a circuit model. The published Hammerstad/Jensen equations are compact fitted formulas for getting `Zo` and `ereff` without solving this two-dimensional field problem every time.

## Why Microstrip Needs Approximation

An ideal coaxial line or parallel-plate line has a relatively clean field geometry. Microstrip does not. A microstrip line has a conductor on top of a dielectric substrate with a ground plane underneath. Some electric field is inside the dielectric and some is in air.

That means the wave does not see only `er`, and it does not see only air. It sees an effective dielectric constant:

```text
1 < effective dielectric constant < er
```

The exact value depends on the field distribution. The field distribution depends on geometry:

- `Width`
- `Height`
- `Thickness`
- dielectric constant `er`
- frequency, when dispersion is included

Because the field boundary is not simple, exact hand equations are not practical for normal design work. Hammerstad/Jensen-style formulas exist to make this geometry usable.

## Static Quasi-TEM Foundation

The first approximation is usually quasi-static or quasi-TEM. In this approximation, the cross-sectional electric and magnetic fields are solved as if they are static fields. That gives per-unit-length capacitance and inductance. From those, the line impedance and propagation velocity can be estimated.

`Quasi-static` means "almost static." The fields are not truly DC fields, because the wave is moving down the transmission line. But over the cross section of the line, the field shape is treated as if it adjusts instantly compared with the distance the wave travels along the line.

Another way to say this is:

```text
cross-section dimensions are small compared with wavelength
```

When this is true, the fields across the width and height of the microstrip look almost like electrostatic fields at each instant. The voltage between strip and ground is allowed to vary along the `z` direction, but each local cross section can still be solved like a static capacitor problem.

This is why the static potential equation is useful:

```text
div(epsilon * grad(phi)) = 0
```

The static solve gives capacitance per unit length. A matching magnetic/static-current view gives inductance per unit length. Those per-unit-length values are then used in transmission-line equations.

`Quasi-TEM` means "almost transverse electromagnetic." In a true TEM line, the electric and magnetic fields are entirely transverse to the direction of propagation. Coaxial cable and ideal parallel-plate line can support true TEM propagation. Microstrip cannot support perfect TEM propagation because part of the field is in air and part is in dielectric, so the wave has small longitudinal field components.

For ordinary microstrip dimensions and frequencies, those longitudinal components are often small enough that the line can be treated as quasi-TEM. That is the approximation behind using a characteristic impedance, effective dielectric constant, and propagation constant in a simple transmission-line model.

The approximation becomes weaker when:

- the line cross section is no longer small compared with wavelength,
- the frequency is high enough for dispersion to matter strongly,
- the substrate is very thick,
- the dielectric constant is very high,
- higher-order modes or radiation become important,
- the layout has abrupt features that are electrically large.

Important relationships:

```text
Zo approximately depends on sqrt(L / C)
velocity approximately depends on 1 / sqrt(L * C)
effective dielectric constant controls velocity
```

For a microstrip, a common method is to compare two capacitances:

```text
C_air  = capacitance of the same geometry with air everywhere
C_er   = capacitance of the geometry with the dielectric substrate
```

The ratio gives an effective dielectric constant:

```text
ereff approximately C_er / C_air
```

Then the characteristic impedance can be related to the air-filled impedance and the effective dielectric constant.

## Conformal Mapping Role

Conformal mapping is a mathematical technique that transforms a hard two-dimensional electrostatic field shape into an easier shape while preserving useful field relationships. It is commonly used in stripline, microstrip, coplanar waveguide, and coupled-line derivations.

For microstrip, the hard geometry is the field around a finite-width strip above a ground plane, with part of the field in air and part in dielectric. A conformal map changes that cross-section into a simpler mathematical plane where the field lines and equipotential lines are easier to describe.

The important point is that conformal mapping preserves angles. In a two-dimensional electrostatic problem, preserving angles preserves the relationship between field lines and equipotential lines. That means the transformed problem has the same useful capacitance information as the original geometry, but in a shape that is easier to solve.

The rough workflow is:

1. Draw the physical cross section: strip, substrate, ground plane, and surrounding air.
2. Treat the strip and ground as equipotential conductors.
3. Map the awkward cross section into a simpler plane.
4. Solve for the capacitance per unit length in the simpler plane.
5. Convert that capacitance back into impedance and effective dielectric constant for the original line.

The reason capacitance is central is that a quasi-TEM transmission line can be described by per-unit-length capacitance and inductance:

```text
Zo = sqrt(L' / C')
vp = 1 / sqrt(L' * C')
```

For many quasi-TEM lines, the capacitance calculation is the easier side of the problem. Once capacitance is known for the real dielectric case and the air-filled case, the effective dielectric constant and impedance can be estimated.

The two capacitance calculations are:

```text
C_air = capacitance per unit length if the whole space were air
C_er  = capacitance per unit length with the real dielectric substrate
```

Then:

```text
ereff approximately C_er / C_air
```

The air-filled capacitance also connects to the air-filled characteristic impedance:

```text
Zo_air approximately 1 / (C0 * C_air)
```

The real microstrip impedance is then approximately:

```text
Zo approximately Zo_air / sqrt(ereff)
```

So the short phrase "use conformal mapping and capacitance relationships to connect geometry to impedance" really means:

```text
geometry
  -> mapped electrostatic field problem
  -> capacitance per unit length
  -> effective dielectric constant
  -> characteristic impedance
```

For microstrip, conformal mapping helps create baseline expressions for capacitance and impedance as functions of normalized dimensions such as:

```text
u = Width / Height
t = Thickness / Height
```

Using normalized dimensions matters because the field shape depends mostly on ratios, not absolute size, in the static lossless problem. A 10 mil wide line over a 25 mil substrate and a 20 mil wide line over a 50 mil substrate have the same `Width / Height`, so their idealized field shapes are similar.

These baseline expressions are usually best for idealized conductors and static fields. They still need corrections before they behave well across practical PCB geometries.

## Empirical Fitting Role

The published Hammerstad/Jensen equations include fitted terms. Those terms make the formulas match more accurate data over useful ranges of `Width / Height` and `er`.

This is why the equations sometimes contain constants or exponents that do not look obvious from first principles. Those numbers are often regression or correction constants chosen to reduce error.

In practice, a good closed-form microwave equation has three jobs:

- preserve the correct limiting behavior,
- fit trusted reference data across the intended design range,
- stay simple and stable enough for hand calculation or fast software calculation.

## How The Curve Fitting Is Usually Done

The fitting process is partly scientific and partly engineering judgment. It is not random, but it is also not a pure symbolic derivation. The usual approach is to start with the physics-based shape of the answer, then add correction terms that reduce the error against trusted reference data.

The reference data may come from:

- full-wave electromagnetic simulation,
- conformal-mapping calculations that are too complicated for direct design use,
- numerical static-field solvers,
- measured test structures,
- previously published benchmark tables.

The first step is to choose the variables that matter. For single microstrip, the common normalized variables are:

```text
u = Width / Height
t = Thickness / Height
er = relative dielectric constant
```

For coupled microstrip, more variables are needed:

```text
g = Space / Height
u = Width / Height
er = relative dielectric constant
frequency * Height as a normalized dispersion variable
```

The next step is to choose a formula shape. This is where the art enters. A good empirical equation is not just a polynomial through data points. It is usually built to satisfy known physical behavior:

- it should approach the correct result when `Width / Height` is very small,
- it should approach the correct result when `Width / Height` is very large,
- it should behave smoothly between narrow-line and wide-line regions,
- it should not produce impossible values such as negative impedance,
- it should remain numerically stable,
- it should use dimensionless ratios where possible.

This is why microwave closed-form equations often contain logarithms, square roots, powers, and rational functions. Those forms are chosen because the underlying field solutions often have similar behavior. The fitted constants then tune the expression.

A typical fitting workflow looks like this:

1. Generate or collect a grid of reference cases.
2. Normalize the geometry into dimensionless variables such as `Width / Height`.
3. Start with a known limiting expression or a previous approximate formula.
4. Add one correction term at a time.
5. Use least-squares or weighted least-squares optimization to choose constants.
6. Inspect the maximum error, average error, and error trends.
7. Adjust the formula if errors cluster in one part of the design space.
8. Check physical limits and monotonic behavior.
9. State the validity range.

The weighting matters. A fit that minimizes average error may still be poor in an important design region. For example, a microwave designer may care more about common PCB ranges than extreme geometries. The author may weight the practical range more heavily.

The final expression is often a compromise:

```text
accuracy vs. simplicity
wide validity range vs. best accuracy in a narrow range
smooth behavior vs. exact fit to scattered data
hand usability vs. computer-only complexity
```

That is why it can feel like art. The science supplies the field equations, boundary conditions, limiting behavior, and reference data. The engineering judgment is in choosing a compact equation that behaves well and is useful.

For nP work, the important lesson is not to treat every fitted constant as adjustable. Once a formula is selected from a published source, keep the constants as published unless there is a clear reason and a test case. If nP results disagree with another calculator, first check units, port order, reference impedance, conductor thickness convention, and frequency normalization before changing curve-fit constants.

## Thickness Corrections

Zero-thickness conductors are mathematically convenient, but real copper has finite thickness. A common approach is to convert physical width into an effective width:

```text
effective width = Width + deltaWidth
```

Then the zero-thickness impedance/effective-dielectric equations are reused with the corrected width.

This is an approximation. It works because finite thickness mostly changes the edge-field shape, and increasing the apparent width captures much of that effect.

## Dispersion Corrections

At low frequency, the quasi-static effective dielectric constant is a good approximation. At higher frequency, the field distribution changes and the effective dielectric constant becomes frequency dependent.

Dispersion equations usually start with the static result and move it toward a high-frequency limit:

```text
ereff(f) changes from ereff_static toward a higher-frequency behavior
Zo(f) changes consistently with that dielectric behavior
```

These formulas are also approximate and often have stricter validity ranges than the static impedance equations.

## Loss Corrections

Loss is usually layered on top of the geometry model.

Dielectric loss uses `tand`. It represents energy lost in the dielectric material.

Conductor loss uses conductor resistance, skin depth, and resistivity. In nP notes and code, `rho` is relative to copper, and the shared copper value should come from:

```text
COPPER_RESISTIVITY
```

Surface roughness is another correction on conductor loss. It increases effective surface resistance because current follows a rougher path than the ideal smooth conductor case.

These loss corrections are not the same as deriving the lossless impedance. They are additional models coupled to the same physical geometry.

## Coupled Microstrip Case

For coupled microstrip, the derivation is more complicated because there are two conductors plus a ground plane. The natural modes are even and odd:

```text
even mode: both lines driven in phase
odd mode:  both lines driven out of phase
```

The equations estimate:

```text
Zoe    even-mode impedance
Zoo    odd-mode impedance
ereoe  even-mode effective dielectric constant
ereoo  odd-mode effective dielectric constant
```

The final four-port S-parameters are built from those modal quantities. The modal equations are usually derived from a mix of field approximations, conformal mapping, and fitted corrections, just like the single-line case.

The single-line Hammerstad/Jensen result is often used as a baseline. The coupled-line model then adds spacing-dependent even/odd corrections. This gives the correct intuition:

- large spacing should approach two isolated microstrip lines,
- small spacing should produce a larger split between `Zoe` and `Zoo`,
- odd mode usually has stronger electric field between the traces.

## What This Means For nP

For nP implementation work, treat Hammerstad/Jensen-style equations as validated engineering models, not exact symbolic derivations.

Good implementation practice:

- record the source, equation numbers, and validity range,
- keep all dimensions in meters internally,
- normalize geometry explicitly, such as `Width / Height`,
- keep physical constants from `src/np-nport/src/mlin/constants.js`,
- expose intermediate values such as `Zo`, `ereff`, `Zoe`, and `Zoo` when useful for debugging,
- compare against at least one trusted calculator or published example,
- avoid changing curve-fit constants unless a source or test case justifies it.

Useful debug checks:

- If `Space` becomes very large, `mclin()` should move toward weak coupling.
- If `Thickness` is zero, thickness correction should disappear.
- If `rho = 0` and `tand = 0`, insertion loss should be only from mismatch or ideal phase behavior, not material loss.
- If `roughnessRms = 0`, roughness correction should disappear.
- If frequency changes but geometry does not, dispersion and loss should change smoothly.

## Source Trail

Primary equation families to track when implementing or reviewing nP microstrip code:

- E. Hammerstad and O. Jensen, microstrip characteristic impedance and effective dielectric constant closed-form equations.
- M. Kirschning and R. H. Jansen, coupled microstrip and frequency-dispersion equations.
- I. J. Bahl and D. K. Trivedi / Garg and Bahl style coupled microstrip design equations.
- Gupta, Garg, Bahl, and Bhartia, *Microstrip Lines and Slotlines* and related microwave CAD texts.
- QUCS technical documentation for practical equivalent-circuit models of microstrip discontinuities.

When adding exact equations to code, use the original source or a clearly attributed secondary source and write down page, figure, and equation numbers in this folder.
