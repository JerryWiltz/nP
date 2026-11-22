<!-- Modified: 2026-11-22 -->
# PIN diode: charge storage and selected-region models

## Charge-storage model (default)

`PIN()` now defaults to `CHARGE_STORAGE_REFERENCE`, a **generic numerical
reference**, not a manufacturer-calibrated part. The model follows the
five-section storage equivalent and level-1 capacitance described in
[Keysight ADS Nonlinear Devices (2019), pp. 361–367][ads]. Its charge-storage
basis is discussed by [Caverly and Quinn (1999)][caverly]. The older Skyworks
record remains available explicitly; its parameters are not silently reused
as a calibrated charge-storage part.

```js
nP.global.fList = nP.global.fGen(1e3, 1e9, 101);
var d1 = nP.PIN({model: 'CHARGE_STORAGE_REFERENCE', qPoint: {vd: 1.4}});
var response = d1.out('s21dB', 'NF21dB');
nP.lineTable({inputTable: response});
```

Public terminals remain **1 anode, 2 cathode**, with the dedicated PIN symbol.
Options: model, qPoint, bias, temperature, fList and optional
`region:'automatic'`. Forward/reverse/zero bias follow the same equations;
manual region selection is unnecessary and conflicting options reject.
Default VD=.8 V, temperature=record.referenceTemperature (298.15 K for this
reference), I–V sweep −5 to 1.2 V with 201 points. Frequencies must be finite
and nonnegative; use positive frequencies with nonzero flicker KF.
`ivTable({vd:{start,stop,points}})` returns V/A. `.dc.bias.vd` preserves the
construction sweep. No device-specific voltage, frequency, current or thermal
rating is implied by accepting an analysis point.

External V/R networks solve the full steady-state equation before rebuilding
RF, noise and nonlinear data independently per placement. Original templates
and supplied records remain unchanged. `.qPoint` reports vd/id,
junctionVoltage (the sensed voltage driving the two-junction pair),
junctionCurrent (the pair/ladder driving current), temperature and automatic
region; network records also report va/vk. The ladder driving current differs
from public terminal current. `.smallSignal` exposes conductance,
bulkResistance, storedCharge, carrierLifetime and junctionCapacitance.

### Equations

Two equal PN junctions, each with IS/N/RS, generate drive current d from their
combined sensed voltage u. Finite IKF optionally limits high injection:
IKMODEL=1 uses `I0/sqrt(1+I0/IKF)` (ADS/PSpice), IKMODEL=2 uses
`I0/(1+sqrt(I0/IKF))` (HSPICE/ngspice). IKF=Infinity disables this correction.
Reverse continuation and finite BV/IBV use the shared SPICE junction model.
Per-junction RS is included twice. The symmetric-junction approximation does
not implement unequal PI/IN emission splitting.

The noiseless RC ladder has five series parallel-RC sections, with a shunt
resistor after each section, i=1…5:

```text
RP_i = 4i−3                CP_i = TAU/(4i−3)
RS_i = alpha/(4i−1)        alpha = W²/(0.00048375*TAU)
WM = 10*W²/TAU            eps = 1e−12
positive(z) = (z + sqrt(z² + 4*eps²))/2
Gmod(x) = 2*positive(x)/WM
Rbulk(x) = 1 / (1/REPI + Gmod(x)/(1+RLIM*Gmod(x)))
i = ladderInputCurrent(d) + positive(d)²/IKNEE
x = voltage across the first RP/CP section
v = u + Rbulk(x)*i
Iterminal = i + v/RP + dQdepletion(v)/dt
```

The ladder uses a 1-ohm numerical current-to-voltage transresistance; its
voltage coordinates numerically represent amperes, and TAU*x is the first
section's signed storage coordinate in coulombs. `storedCharge` reports
TAU*positive(x), the smooth nonnegative carrier coordinate (including the
published eps continuation). It is not necessarily TAU*terminalCurrent.
The published constants carry implicit transport/unit scaling: alpha is
dimensionless, and WM is a voltage when x is interpreted as current. This is
a published reduced diffusion equivalent, not a spatial PDE solver.

The state capacitors retain frequency-dependent storage; they are not replaced
with a frozen resistance. At zero frequency, the RF derivative agrees with the
full DC derivative. M/FC use integrated SPICE depletion charge, continuous Q/C
at FC*VJ. CJO=0 suppresses this charge. Package topology is **CP across the
public terminal pair, L in series with the complete intrinsic device**.
PN IS and depletion parameters use the shared nominal-temperature scaling;
W/TAU and resistance values remain fixed, and no self-heating is solved.

### Noise and intermodulation

Noise follows the documented equivalent: independent PN shot/flicker sources,
thermal sources in each PN RS and in RP/REPI/RLIM. Storage-ladder resistors
and the controlled conductivity are noiseless. Every source propagates through
the coupled storage and package response. This is a compact-model noise law,
not measured excess-noise calibration for a commercial PIN part.

Two-tone analysis uses a **cubic Volterra expansion** of the same PN,
conductivity, lifetime and depletion equations. Storage is evaluated at each
mixing frequency. Local DC/difference/harmonic second-order feedback is retained
when computing third-order products under the component's real reference
terminations. This supports finite IM2/IM3/OIP results and weak-level slopes.
Finite IKF has no unique cubic Taylor expansion at exactly zero pair
current; IM rejects that point rather than reporting fictitious derivatives.

The shared network engine combines generated sources but **does not feed
second-order products between separate nonlinear devices back into their IM3**.
That limitation matters in interacting multi-device distortion circuits.
This implementation is weak-signal frequency-domain analysis, not a general
harmonic-balance/compression or electrical network transient solver. The
five-section model also omits advanced level-2 frequency-dependent depletion,
area/multiplicity scaling, unequal junctions and moving-boundary recovery.
Unsupported record properties reject; there are no undocumented part-specific
corrections or fits.

### Supplied charge-storage records

```js
var myPin = {
    name: 'My PIN', modelType: 'charge-storage', referenceTemperature: 298.15,
    parameters: {IS: 1e-10, N: 1, RS: 1, IKF: .01, IKMODEL: 2,
        RP: 1e8, REPI: 1000, RLIM: 2, W: 20e-6, TAU: 100e-9,
        IKNEE: .02, CJO: 2e-13, VJ: 1, M: 0, FC: .5, KF: 0},
    packageParameters: {seriesInductance: 1e-9, parallelCapacitance: .08e-12}
};
var d2 = nP.PIN({model: myPin, qPoint: {vd: 1}});
```

This is test data, not a fitted part. modelType may be omitted for new full
records: charge storage is the default schema. Old supplied records containing
VI/RR/RRF retain selected-region interpretation; mixed/unknown parameters
reject. No registration, build or URL retrieval is needed. Named/supplied records share the same validated construction,
DC/RF/noise/IM and bias-handoff path, including plain browser/Node objects.

| Parameter | Units / constraints | Generic default |
| --- | --- | --- |
| W, TAU | m, s; positive | **required** |
| REPI, RLIM | ohms; positive, RLIM < REPI | **required** |
| IS, N | A, dimensionless; positive | 1e−14, 1 |
| RS | ohms per junction; nonnegative | 0 |
| IKF, IKNEE | A; positive or Infinity | Infinity |
| IKMODEL | 1 ADS/PSpice or 2 HSPICE/ngspice | 1 |
| BV, IBV | per-junction V, A; positive, BV may be Infinity | Infinity, .001 |
| RP | ohms; positive | 1e9 |
| CJO, VJ, M, FC | F, V, dimensionless; CJO/M >=0, VJ>0, 0<=FC<1 | 0, 1, 0, .5 |
| EG, XTI | eV, dimensionless; nonnegative | 1.11, 3 |
| KF, AF, FFE | SPICE flicker coefficient, current/frequency exponents; nonnegative | 0, 1, 1 |
| seriesInductance, parallelCapacitance | H, F; nonnegative | 0, 0 |
| referenceTemperature | K; positive | 298.15 |

The built-in numerical reference uses the published typical defaults:
REPI=1e3, RLIM=.001, W=100 µm, TAU=1 µs, CJO=1 fF, other generic values as
above. Do not describe these as a real part's complete spec sheet.
Unknown keys, legacy VI/RR/RRF, middleCapacitance, operatingRange and nonempty
L/C arrays are not accepted by the charge-storage record schema. An explicit
`modelType:'selected-region'` or the existing legacy VI/RR/RRF schema
uses the older contract below.

### Independent evidence

`test/pin-charge.test.js` compares DC, complex S and source noise with the
separate five-section ngspice subcircuit in
`test/fixtures/pin-charge-storage.cir`. It also compares IM2, IM3, harmonics
and fundamental complex voltages with Fourier analysis of a SPICE transient
run (`pin-charge-two-tone.cir`), at two excitation levels. Worst product-level
difference in those runs is under .016 dB. This verifies the implementation
against a separately simulated equivalent, not against measured part data.

The reference uses IKMODEL=2 because native ngspice's high-injection convention
differs from ADS's default. Historical physical constants account for several
ppm DC/RF differences. SPICE's 1e−14 S ground shunts stabilize its internal
saturated-junction midpoint; reverse-bias noise checks compare total noise,
avoiding an ill-conditioned subtraction of much larger source noise.
The cubic source slopes and DC/RF derivative identity are checked separately.
The equation audit differentiates conductivity, lifetime and both high-injection
laws with math.js; it does not certify device calibration.

[ads]: https://edadownload.software.keysight.com/eedl/ads/2019update1/pdf/Nonlinear_Devices.pdf
[caverly]: https://static.aminer.org/pdf/PDF/000/427/053/a_spice_model_for_simulating_the_impedance_frequency_characteristics_of.pdf

## Older selected-region model

`PIN({model: 'SMP1307-011LF'})` implements a **selected-region, small-signal** model based on Skyworks
[200313B, Figure 8 and Figures 9–10][skyworks]. Legacy named record: `SMP1307-011LF`. Terminals are **1 anode, 2 cathode**. This is a separate
constructor and `pin-diode.svg` symbol, not a new name for `D()`.

```js
nP.global.fList = [10e6, 100e6, 1e9, 2e9, 3e9];
var d1 = nP.PIN({model: 'SMP1307-011LF', region: 'forward', qPoint: {vd: .8}});
var response = d1.out('s21dB');
nP.lineTable({inputTable: response});
```

### Region and analysis contract

Options are `model`, `region`, `qPoint`, `bias`, `temperature`, `fList` only.
`region` is `forward` (default) or `reverse`, selected **before** analysis.
The reference uses different DC/RF equivalents after selecting its operating
region. This first implementation does not automatically switch between them.
A solved bias incompatible with the selected region is an error.

Default forward Q is `vd=.8 V`; reverse Q is `vd=0 V`. Temperature defaults to
the record's reference temperature (named record **300.15 K**) and must equal
it. A different temperature needs characterized data, not implicit scaling.
Frequency follows `global.fList`. Every analysis frequency must lie inside
the supplied `operatingRange`; the named reference uses **10 MHz–3 GHz**,
the application note's demonstrated circuit-model band, not a guaranteed
calibration of every individual diode.

Forward RF current must be **20 µA–100 mA** in this reference; this bounds the
illustrated resistance range. Reverse RF voltage must be nonpositive. No
breakdown law, punchthrough transition, zero-to-forward interpolation or
large-signal rectification is supplied. Reverse parameters are equivalent-model
inputs, not a measured reverse I–V characterization.

`nodal()`, `cas()` and `cascade()` retain an immutable PIN DC model. An explicit
external `V()` triggers the ordinary nonlinear solve, followed by independent
RF/noise rebuilding for each placement. The network sets current and RF
resistance **within the selected region**. Reusing one PIN template in several
branches does not share their solved states or mutate the template.

`qPoint`/`bias` report VD, ID, PN junction voltage/current, region and temperature;
network rebuilding also includes VA/VK. `.smallSignal` reports intrinsic RF
resistance/capacitance, residual RF series resistance and steady stored charge
`TAU*max(ID,0)`. This stored-charge diagnostic is not a transient state solver.

`ivTable({vd:{start,stop,points}})` returns VD in V and ID in A without changing
Q. Defaults: forward VI–1.1 V, reverse −20–0 V, 201 points. Forward sweeps must
start at/above VI; reverse sweeps end at/below zero. RF current restrictions do
not truncate the selected branch's DC curve.

### Equations and package

The forward DC branch is a PN diode with IS/N/RS plus the constant I-region
drop VI. Reverse DC retains RR in series with that PN branch. For PN voltage Vj:

```text
Forward: VD = VI + Vj + RS*ID
Reverse: VD = Vj + (RS+RR)*ID
ID = IS*(exp(Vj/(N*VT))-1)                (forward PN branch)
```

The existing SPICE junction evaluator supplies reverse continuation and its
Jacobian; no finite breakdown is assumed. The forward DC VI source is a
constitutive element, not an externally applied supply. PN RS is **1.48 Ω**;
it must not be substituted for residual RF resistance **2.2 Ω**.

For forward RF, `Ri=VI/ID` and `Ci` is the SPICE depletion capacitance evaluated
at VI, with the existing FC continuation. Reverse RF uses `Ri=RR`, `Ci=0`
(the source's CMIN). Both remain fixed throughout a small-signal analysis.

```text
Zi = 1/(1/Ri+jωCi)
Zm = (RRF+Zi) || 1/(jωCg)
Z = (Zm+jωL) || 1/(jωCp)
```

Cg is inside the series lead, Cp across the public terminals. In DC, both
capacitors open and the physical lead shorts. The reference's enormous
PN-bypass capacitor and RF-resistor-bypass inductor express analysis-specific
ideals; they are reduced to their intended limits, not treated as real package
parts. Thus the PN branch sets DC while Ri/RRF set RF. This is not a general
time-domain SPICE netlist or a physically broadband transition model.

At 1 mA, `Ri+RRF=82.2 Ω`; at 10 mA, `10.2 Ω`, before package effects. These
are model calculations. Figure 10 shows imperfect agreement with measured
resistance, especially at low current; no correction was fitted to hide it.

Noise is an **equivalent RF-resistance thermal approximation**:
`Sv_open=4kT Re(Z)` in V²/Hz. With real reference Ro, floating two-port
covariance has diagonal `Ro*Sv_open/abs(Z+2Ro)^2` and negative off-diagonals.
This is not measured PIN excess noise, shot noise or a calibrated NF fit.

**Intermodulation requests reject explicitly**, including in networks. Frozen
bias resistance and one nominal lifetime do not define nonlinear carrier
dynamics, switching time, compression or OIP3. No infinite-IP claim is made.

### Built-in provenance and supplied records

Figure 8 supplies IS=1e-8 A and RR=4e6 Ω. Tables 1/2 instead give 1.1e-8 A
and 4e5 Ω; nP deliberately uses the **figure**, preserving the discrepancy in
metadata. TAU=1.5 µs is the reported physical lifetime, not the unused 1 ps
Libra placeholder. Package data are L=1.5 nH, Cg=.10 pF, Cp=.08 pF.
No board/matching network is included.

Named and plain supplied records use the same resolver, DC stamping, handoff,
RF/noise and missing-IM behavior. For example:

```js
var myModel = {
    name: 'My PIN', referenceTemperature: 300.15,
    parameters: {IS: 1e-8, N: 2.2, RS: 1.48, VI: .08, RR: 4e6,
        RRF: 2.2, CJO: 1.8e-15, VJ: 1, M: 1.01, FC: .5, TAU: 1.5e-6},
    packageParameters: {seriesInductance: 1.5e-9, middleCapacitance: .10e-12,
        parallelCapacitance: .08e-12},
    operatingRange: {minFrequency: 10e6, maxFrequency: 3e9,
        minForwardCurrent: 20e-6, maxForwardCurrent: .1}
};
var d1 = nP.PIN({model: myModel, region: 'forward', qPoint: {vd: .8}});
```

| Parameter | Unit / rule | Generic default |
| --- | --- | --- |
| VI | V, positive I-region drop | Required |
| RR | Ω, positive reverse I-region resistance | Required |
| TAU | s, positive lifetime for stored-charge diagnostic | Required |
| IS, N | A, dimensionless; positive PN parameters | 1e-14, 1 |
| RS, RRF | Ω, nonnegative DC PN / residual RF resistance | 0, 0 |
| CJO, VJ | F nonnegative, V positive | 0, 1 |
| M, FC | Dimensionless; M nonnegative, 0 ≤ FC < 1 | .5, .5 |

Values are finite. Custom referenceTemperature defaults to 300.15 K.
Package parameters default individually to zero and use H/F. All four
operatingRange values are required: positive finite Hz/A with increasing
frequency/current intervals. Unknown keys, unsupported package arrays and
unsupported parameters such as TT are rejected. No supplied record inherits
the SMP1307 fit or fetches provenance links. Complete `.model` records can be
reused, including objects originating in Node REPLs/browser frames.

### Verification

[pin-smp1307.cir](../../test/fixtures/pin-smp1307.cir) independently implements
the DC branches and frozen-bias RF package in ngspice 39.3. References cover
0.1/1/10/50 mA DC, reverse leakage, and all four S entries/noise at five
frequencies for 1/10 mA and reverse bias. Small DC tolerances account for
ngspice's historical physical constants. A matched-resistor noise witness
measures its Boltzmann constant; reference thermal noise is normalized to the
same SI constant as nP after removing input-source noise. This is constant
normalization, not a device fit.

[Tests](../../test/pin.test.js) cover supplied/foreign-context equivalence,
ownership, independent repeated placements, external forward/reverse bias,
domain errors and the separate symbol. Simulator-equivalent checks do not
establish measured noise or large-signal performance. The optional math.js
audit checks the reused PN current derivatives and explicit RF resistance /
stored-charge dimensions. The [browser harness](../../dev/pin.html) shows a
series PIN with an external voltage/resistor bias network.

[skyworks]: https://www.skyworksinc.com/-/media/SkyWorks/Documents/Products/1-100/200313B.pdf
