<!-- Modified: 2026-07-02 -->

# Microstrip Discontinuities Derivation Notes

This note explains the theory behind microstrip discontinuity models such as bends, steps, tees, crosses, open ends, and vias. These models are used when a real layout feature cannot be represented as only an ideal transmission line.

## Main Idea

A uniform microstrip line can be modeled by characteristic impedance, propagation constant, loss, and length. A discontinuity is different. It is a small physical region where the field pattern changes abruptly.

Examples:

- a width step,
- a 90 degree bend,
- an open end,
- a tee junction,
- a cross junction,
- a via to ground,
- a thin-film resistor inserted into a line.

The discontinuity region stores extra electric or magnetic energy. In circuit form, that extra stored energy is usually represented with small equivalent capacitances and inductances. The surrounding microstrip arms are still modeled as transmission lines.

The practical model is usually:

```text
uniform microstrip line
  -> localized equivalent circuit
  -> uniform microstrip line
```

For a multiport junction such as a tee or cross, the same idea becomes:

```text
line arm 1
line arm 2
line arm 3
...
  all connected through a localized equivalent circuit
```

## Why Discontinuities Exist

In an ideal circuit schematic, a node has no size. In a microwave layout, a node has physical size. The current must spread, turn, split, crowd, or terminate. The electric and magnetic fields do not instantly reshape without stored energy.

That physical field disturbance causes:

- added shunt capacitance where electric field fringing increases,
- added series inductance where current path length or current crowding increases,
- coupling between nearby conductors,
- radiation or higher-order effects when the discontinuity is electrically large,
- mismatch because the local impedance differs from the attached line impedances.

Closed-form discontinuity models try to capture the dominant part of this behavior while staying simple enough for circuit-level simulation.

## Derivation Starting Point

The electromagnetic starting point is still Maxwell's equations:

```text
curl(E) = -dB/dt
curl(H) = J + dD/dt
div(D)  = rho_v
div(B)  = 0
```

For small microstrip discontinuities, the usual first approximation is quasi-static. The discontinuity is assumed to be physically small compared with wavelength:

```text
physical discontinuity size << wavelength
```

That lets the discontinuity be treated as a lumped region. Instead of solving a full distributed field problem at every frequency, the local field disturbance is represented with equivalent circuit values.

`Quasi-static` means the local electric and magnetic field shapes are treated as if they are static fields, even though the circuit is operating at RF or microwave frequency. The voltage and current still vary with frequency and position along the full network, but the small discontinuity itself is assumed to be compact enough that phase change across it is small.

In practical terms:

```text
small feature
  -> little phase variation across the feature
  -> field energy can be represented by lumped C and L
```

This is the reason a bend, step, tee, or via pad can be replaced by an equivalent circuit. The equivalent circuit does not reproduce the whole field shape. It reproduces the dominant stored energy and mismatch that the field shape creates.

For a discontinuity, the quasi-static approximation says:

- the electric-field disturbance can be represented mainly as capacitance,
- the magnetic-field/current disturbance can be represented mainly as inductance,
- the discontinuity can be connected to normal transmission-line arms,
- the effect is local rather than spread over a long length of line.

This approximation becomes weaker when:

- the discontinuity dimensions become a meaningful fraction of wavelength,
- radiation from the discontinuity becomes important,
- higher-order modes are excited,
- nearby layout features couple strongly to the discontinuity,
- the metal thickness, solder mask, or package environment differs from the model assumptions,
- the model is used outside the geometry range used to fit it.

The static field problem is usually reduced to:

```text
E = -grad(phi)
div(epsilon * grad(phi)) = 0
```

with conductor surfaces held at fixed potentials. From that, the electric energy and capacitance can be estimated. Magnetic field/current relationships give inductance.

## Energy Method

A common derivation path is to compare stored energy in the real discontinuity against stored energy in a uniform reference line.

Electric stored energy:

```text
We = 0.5 * integral(epsilon * |E|^2) dV
```

Magnetic stored energy:

```text
Wm = 0.5 * integral(mu * |H|^2) dV
```

Equivalent capacitance and inductance are then defined by matching energy:

```text
We = 0.5 * C * V^2
Wm = 0.5 * L * I^2
```

So if a bend, step, or tee has more electric field storage than an equivalent length of straight line, that extra storage can be represented as an added capacitance. If it has extra magnetic storage from current crowding or path length, that can be represented as an added inductance.

This is why many discontinuity models look like small capacitors and inductors attached to ideal junctions.

## From Geometry To Equivalent Circuit

The derivation usually follows this pattern:

1. Define the physical geometry.
2. Normalize dimensions by substrate height.
3. Use a trusted microstrip line model for each attached arm.
4. Estimate extra stored electric and magnetic energy in the discontinuity.
5. Convert that extra energy into equivalent capacitance and inductance.
6. Build a Z, Y, or S-parameter model from the equivalent circuit.
7. Fit correction constants against field simulation, measurements, or published numerical data.

Common normalized variables:

```text
u = Width / Height
t = Thickness / Height
g = Gap / Height
er = relative dielectric constant
```

For a discontinuity between unequal widths:

```text
u1 = Width1 / Height
u2 = Width2 / Height
```

For a tee:

```text
u_common  = commonWidth / Height
u_branch1 = branch1Width / Height
u_branch2 = branch2Width / Height
```

## Role Of Hammerstad/Jensen

Hammerstad/Jensen equations are primarily single-line microstrip equations. They provide characteristic impedance and effective dielectric constant for a uniform microstrip line.

For discontinuity models, Hammerstad/Jensen is usually not the whole discontinuity model. Instead, it supplies the baseline for each connected line arm.

That baseline gives:

```text
Zo      = characteristic impedance of the connected arm
ereff   = effective dielectric constant of the connected arm
vp      = C0 / sqrt(ereff)
beta    = 2 * pi * frequency / vp
```

Then the discontinuity model adds local parasitic capacitance and inductance around that baseline.

For example:

```text
line arm by Hammerstad/Jensen
  + discontinuity correction from step/bend/tee equations
  + optional loss correction from rho, tand, and roughnessRms
```

This separation is useful because a discontinuity model should reduce to the attached-line behavior when the discontinuity effect becomes small. If a width step has `Width1 = Width2`, the extra step parasitics should approach zero. If a bend is mitered correctly, the excess capacitance should be reduced. If a tee branch is made very weak or removed, the model should move toward a simpler line/junction behavior.

## Width Step

A microstrip width step is a two-port junction between two different line widths.

Physical behavior:

- the wider side has more capacitance to ground,
- the abrupt width change creates fringing fields,
- current redistributes at the step,
- the discontinuity can be modeled with a small shunt capacitance and small series inductances.

A common equivalent shape is:

```text
port 1 -- L1 --+-- L2 -- port 2
               |
               C
               |
             ground
```

The line arms use their own `Zo` and `ereff`, often from Hammerstad/Jensen. The step model supplies `L1`, `L2`, and `C`.

## Bend

A right-angle microstrip bend increases capacitance because the inside corner concentrates electric field and the outside corner adds excess metal area. A mitered bend cuts away part of the corner to reduce this excess capacitance.

Physical behavior:

- unmitered bends are usually more capacitive,
- mitering reduces the excess capacitance,
- the best miter depends mainly on `Width / Height` and dielectric constant,
- the model is valid when the bend is electrically small.

A simple model treats the bend as a short equivalent transmission-line section plus added capacitance or a corrected electrical length.

## Tee Junction

A microstrip tee is a three-port discontinuity. Current and fields split between branches, and the junction area has extra capacitance. Depending on the model, the tee may also include equivalent series inductances in each arm.

For nP power-divider use, the public port convention is:

```text
          port 2
            |
port 1 -----+
            |
          port 3
```

Use:

```text
commonWidth   for port 1
branch1Width  for port 2
branch2Width  for port 3
```

The ideal `nP.Tee()` is only a connection. The physical `nP.mtee()` should represent the extra parasitic behavior of the real microstrip junction.

The usual derivation path is:

```text
Hammerstad/Jensen line model for each arm
  -> localized tee capacitance/inductance model
  -> three-port S-parameter model
```

## Cross Junction

A cross junction is a four-port discontinuity. It can be thought of as a more complicated tee where current can split into three other directions. The fields in the central junction region couple all four arms.

A practical model usually has:

- line-arm impedance/effective dielectric values,
- shunt capacitance at the central patch,
- series inductance or path correction in each arm,
- symmetry simplifications when all arms have equal width.

As with tee models, Hammerstad/Jensen supplies the uniform-arm baseline, not the central cross discontinuity by itself.

## Via And Ground Via

A via is a vertical conductor, so it is not just a planar microstrip feature. A via to ground usually behaves like a small inductance in series with a resistance, often with pad capacitance to nearby planes.

Physical behavior:

- barrel current produces inductance,
- finite metal conductivity produces resistance,
- pads and antipads produce capacitance,
- multilayer boards can add coupling to intermediate planes.

A simple ground-via model may be a one-port shunt inductance/resistance/capacitance. A multilayer through-via model may need to be a true two-port or multiport.

Hammerstad/Jensen is less central for via modeling. It may still be used for the attached microstrip lines or pads, but the via itself needs vertical interconnect equations.

## Curve Fitting In Discontinuity Models

Discontinuity equations often contain empirical constants. These are fitted because the exact field shape is complicated and depends on geometry.

The fitting approach is similar to line equations:

1. Generate trusted data from measurement, field solver, or published numerical tables.
2. Choose physically meaningful normalized variables.
3. Pick a circuit form that matches expected behavior.
4. Fit constants to minimize error.
5. Check limiting cases.
6. Publish validity ranges.

The equivalent-circuit form is important. A fitted capacitance attached to a physically wrong circuit can match one case but fail badly outside the fitted range.

## Validity Limits

Microstrip discontinuity equations are usually valid only within stated geometry and frequency ranges.

Important cautions:

- Lumped discontinuity models fail when the feature is not small compared with wavelength.
- Very high `er`, extreme `Width / Height`, or very small gaps may be outside the fit range.
- Thickness, solder mask, plating, and roughness may not be included unless explicitly modeled.
- Radiation is often ignored.
- Coupling to nearby layout features is usually ignored.
- Launches, connectors, and packaging can dominate measured behavior.

## What This Means For nP

For nP source code, use a layered model:

```text
uniform line arm model
  -> discontinuity equivalent circuit
  -> nPort S-parameter assembly
```

Implementation guidance:

- Use shared constants from `src/np-nport/src/mlin/constants.js`.
- Keep physical dimensions in meters internally.
- Keep argument names consistent with `mlin()` and `mclin()`: `Height`, `Thickness`, `er`, `rho`, `tand`, and `roughnessRms`.
- Use Hammerstad/Jensen-style line calculations for attached microstrip arms when appropriate.
- Keep the discontinuity parasitic model separate from line loss.
- Expose useful intermediate values for debugging, such as arm `Zo`, arm `ereff`, equivalent capacitance, and equivalent inductance.
- Compare against at least one external calculator, published example, or field-solver benchmark before treating a model as mature.

## Source Trail

Useful source families for microstrip discontinuity work:

- Hammerstad/Jensen equations for uniform microstrip line impedance and effective dielectric constant.
- QUCS technical documentation for practical equivalent-circuit discontinuity models.
- Gupta, Garg, Bahl, and Bhartia microwave CAD texts for microstrip discontinuities and equivalent circuits.
- Kirschning/Jansen and related papers when a discontinuity depends on coupled-line or dispersive behavior.
- Field-solver or measured benchmark cases for validating fitted constants and port behavior.

## Implemented Equation Source Map

The current nP discontinuity constructors use the QUCS technical manual as the immediate equation source for the first closed-form implementations. The original papers behind the QUCS references should still be tracked later when they are available, but the equation numbers below are the exact source trail for the formulas currently in code.

QUCS source pages used:

```text
Single microstrip line: https://qucs.sourceforge.net/tech/node75.html
Microstrip corner: https://qucs.sourceforge.net/tech/node76.html
Microstrip impedance step: https://qucs.sourceforge.net/tech/node80.html
Microstrip tee junction: https://qucs.sourceforge.net/tech/node81.html
Microstrip cross: https://qucs.sourceforge.net/tech/node82.html
Microstrip via hole: https://qucs.sourceforge.net/tech/node83.html
```

Uniform microstrip arm baseline:

```text
nP.mtee(), nP.mstep(), and nP.mcross() use Hammerstad/Jensen-style single-line calculations for arm Zo and effective dielectric constant.
Immediate source: QUCS technical manual, Single microstrip line.
Key equations: 11.4 through 11.6 for homogeneous impedance shape, 11.15 through 11.18 for effective dielectric constant, and 11.22 through 11.25 for thickness correction concepts.
```

Microstrip bend:

```text
nP.mbend()
Immediate source: QUCS technical manual, Microstrip corner.
Equations used: 11.84 and 11.85 for unmitered corner C and L.
Equations used: 11.86 and 11.87 for 50% mitered corner C and L.
Equation shape used: 11.88 for the Z-parameter equivalent circuit.
Validity noted by source: Width / Height from 0.2 to 6.0, er from 2.36 to 10.4, up to 14 GHz, approximate precision 0.3%.
Implementation note: nP linearly interpolates between unmitered and 50% mitered values for intermediate miter lengths. That interpolation is an nP approximation, not a separately sourced published fit.
```

Microstrip impedance step:

```text
nP.mstep()
Immediate source: QUCS technical manual, Microstrip impedance step.
Equations used: 11.202 for Cs.
Equations used: 11.203 and 11.204 for splitting Ls into L1 and L2.
Equation used: 11.205 for line inductance weighting.
Equation used: 11.206 for Ls.
Validity noted by source: Cs error below 10% for er <= 10 and 1.5 <= W1/W2 <= 3.5. Ls error below 5% for W1/W2 <= 5 and W2/Height = 1.
```

Microstrip tee junction:

```text
nP.mtee()
Immediate source: QUCS technical manual, Microstrip tee junction.
Equation used: 11.207 for equivalent parallel-plate line width D.
Equation used: 11.208 for first higher-order mode cutoff fp.
Equation used: 11.209 for effective wavelength.
Equations used: 11.210 through 11.216 for reference-plane displacement, transformer ratios, R, Q, and shunt susceptance BT.
Equations used: 11.219 through 11.224 for the three-port S-parameters.
Implementation note: QUCS labels the tee arms as a, b, and 2. nP remaps that to public order [common, branch1, branch2] to match nP.Tee() power-divider use.
```

Microstrip cross junction:

```text
nP.mcross()
Immediate source: QUCS technical manual, Microstrip cross.
Equations used: 11.226 and 11.227 for arm capacitance.
Equations used: 11.228 and 11.229 for arm inductance.
Equation used: 11.230 for center inductance.
Equation used: 11.231 for adapting capacitance away from er = 9.9.
Validity noted by source: capacitance equations within about 5% for 0.3 <= W1/Height <= 3 and 0.1 <= W2/Height <= 3. Inductance equations within about 5% for 0.5 <= W1,2/Height <= 2.
Implementation note: QUCS notes that L3 is negative and that multiplying it by 0.8 improves results. nP follows that 0.8 correction.
```

Microstrip via to ground:

```text
nP.mvgnd()
Immediate source: QUCS technical manual, Microstrip via hole.
Source authors named by QUCS: Marc E. Goldfarb and Robert A. Pucel.
Equation used: 11.232 for via inductance.
Equation used: 11.233 for frequency-dependent resistance.
Equation used: 11.234 for fdelta.
Validity noted by source: cylindrical via model verified numerically and experimentally for Height < 0.03 * lambda0.
```

Two-port via:

```text
nP.mvia()
Immediate source: nP extension of the same Goldfarb/Pucel-style via barrel model used by nP.mvgnd().
Equations inherited: QUCS via equations 11.232 through 11.234 for barrel L, R(f), and fdelta.
Implementation note: nP adds first-order pad, antipad, and unused-stub capacitance terms. Those pad/stub capacitance terms are first-order coaxial approximations and need stronger source tracing before calling the two-port mvia model mature.
```

## Current Reference Comparisons

These values are not independent measurements. They are reference calculations from the cited equation forms, pinned so future code changes do not silently alter the implemented models. They should be supplemented later with external calculator, field-solver, or measured examples.

Default geometry unless otherwise stated:

```text
Width = 0.023 inch
Height = 0.025 inch
Thickness = 0.0000125 inch
er = 10
rho = 1
tand = 0.001
frequency = 1 GHz
Ro = 50 ohms
```

Reference values currently pinned by Node tests:

```text
mstep(), QUCS equations 11.202 through 11.206
CsPf = 0.007510008588927712
LsNh = 0.011507946456502898
L1Nh = 0.004783294294823262
L2Nh = 0.006724652161679638

mbend(), QUCS equations 11.84 through 11.88
unmitered CpF = 0.075455272
unmitered LnH = -0.020961611167322106
50% mitered CpF = 0.06807472288
50% mitered LnH = 0.02744836347075028
default CpF = 0.06807472288
default LnH = 0.027448363470750275

mtee(), QUCS equations 11.207 through 11.224
common arm Zo = 50.80674831133571
common arm ereff = 6.66084124751819
R = 1
Q = 0.0009763030970527234
da = 0.00010021500592968646
db = 0.00010021500592968646
d2 = 0.000563084028445046
Ta2 = 0.9996318411080485
Tb2 = 0.9996318411080485
na = 0.9998159036082835
nb = 0.9998159036082835
BT = -0.00006255957028808236

mcross(), QUCS equations 11.226 through 11.231
Ct = -2.889780775500356e-14
Lcenter = -1.74771255961485e-10
each arm capacitance = -7.22445193875089e-15
each arm inductance = 9.503576111752356e-11

mvgnd(), QUCS equations 11.232 through 11.234
L = 2.349199007351922e-10
Rdc = 0.10984736623502148
fdelta = 43219650533.77667
R at 1 GHz = 0.11111090272099025
X at 1 GHz = 1.4760452686634467
```

Maturity status:

```text
mstep(): sourced and pinned to equation outputs; still needs independent calculator or field-solver comparison.
mbend(): sourced and pinned to equation outputs; intermediate miter interpolation is an nP approximation.
mtee(): sourced and pinned to intermediate equation outputs; still needs external S-parameter benchmark.
mcross(): sourced and pinned to equation outputs; asymmetric width handling is first-order, following QUCS guidance.
mvgnd(): sourced and pinned to equation outputs.
mvia(): partially sourced through mvgnd barrel equations; pad/stub additions need stronger source tracing.
```
