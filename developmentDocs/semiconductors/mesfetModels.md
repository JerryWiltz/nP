<!-- Modified: 2026-11-21 -->
# MESFET model and analysis contract

`MESFET()` implements the N-channel SPICE level-1 Statz/MES1 primitive. Its
default record, **SPICE3_REFERENCE**, uses the example-column values in
[SPICE3f manual §3.4.10](https://pages.hmc.edu/harris/class/e158/07/spice3man.pdf)
and documented defaults. **It is a numerical reference profile, not a fit to a
commercial transistor.** **NE760** additionally selects the commercial NEC-family
card published by Intusoft, described below. HEMT has its own
[nominal Statz pHEMT die adaptation](hemtModels.md); characterized MESFET
package/microwave noise fits remain pending. Both immutable DC descriptors
have `quality: 'approximate'`.

## API, terminals and defaults

```js
nP.global.fList = [10e6, 100e6, 1e9];
var q1 = nP.MESFET({
    model: 'SPICE3_REFERENCE',
    qPoint: {vgs: -0.5, vds: 2},
    temperature: 300.15
});
var curves = q1.ivTable();
var response = q1.out('s11dB', 's21dB');
```

The shown model and Q-point values are defaults; temperature defaults to
`global.Temp` (293 K). `fList` may also be supplied as an option. Unknown
properties/models, nonfinite voltages, nonpositive temperature and invalid
frequency grids are rejected. No P-channel, area scaling or arbitrary SPICE
card import is offered.

Public terminals are **1 gate, 2 drain, 3 source**; SPICE Z-instance order is
D/G/S. All `ig/id/is` currents enter the component and sum to zero. Q-point
fields include external `vgs/vds`, intrinsic `intrinsicVgs/intrinsicVgd`,
`vg/vd/vs`, region, selected noise temperature and `electricalTemperature`.
Standalone absolute voltages reference VS=0. Floating network references may
be null without making the differential bias undefined.

`bias: {vgs: {start: 0, stop: -2, points: 5}, vds: {start: 0, stop: 3,
points: 101}}` is the reference profile's default curve family. `ivTable()` accepts partial
interval overrides, returning a header then numeric rows in V and A. Curves
and the public `.dc` configuration never change the RF Q point. `smallSignal`
reports intrinsic gm/gds, ggs/ggd, cgs/cgd and external rd/rs; these are not a
complete terminal Y matrix.

## Commercial-family NE760 record

```js
nP.global.fList = [10e6, 100e6, 1e9];
var q1 = nP.MESFET({model: 'NE760', qPoint: {vgs: -0.5, vds: 2}});
var curves = q1.ivTable();
var response = q1.out('s11dB', 's21dB');
```

The card comes from [Intusoft's IsSpice4 User's Guide](http://www.intusoft.com/lit/IsSpice4.pdf),
chapter 8, printed pages 193–194 (PDF pages 203–204). That section identifies level 1 as Berkeley
SPICE3 Statz and prints the NE760 NMF card. The manufacturer is NEC; the model
publisher is Intusoft. The [NEC/CEL NE76000 datasheet](https://homepages.uc.edu/~ferendam/Courses/EE_711/NE76000_data.pdf)
establishes the commercial GaAs family and distinguishes chip/bond-wire test
conditions. The card specifies no package suffix, so **NE760 is not an alias
for NE76000, NE76084 or another packaged variant**. We preserve the source name.

| Parameter | NE760 value |
| --- | --- |
| VTO | −1 V |
| BETA | 0.1275 A/V² |
| B, ALPHA | 0.3 /V, 2 /V |
| LAMBDA | 0.0155 /V (`15.5M` in SPICE means milli) |
| RD, RS | 5.45, 4.88 ohms |
| CGS, CGD | 0.34, 0.03 pF |
| PB, IS | 1 V, 19.8 pA |
| FC | 0.2, retained source parameter; inactive in Berkeley MES1 |
| KF, AF | 0, 1 (SPICE defaults; absent from the printed card) |

No equation substitution or device-specific compensation is needed. The same
current, charge, contact, DC handoff, RF and weak nonlinear engine serves both
records. Gate curves default to 0…VTO: −1 V for NE760, −2 V for the reference.
Other API defaults, including the −0.5 V/2 V Q point, remain unchanged. Names
are case-insensitive; unsupported suffixes are rejected. `.model` exposes the
publisher, device/source URLs, parameter snapshot and stated omissions.

**Validation means agreement with this published card in independent ngspice,
not certification against hardware.** The record has no lead/bond-wire L/C,
measured noise fit, trapping, dispersion, breakdown or electrical temperature
scaling. Do not treat classical calculated NF as datasheet NFmin or extrapolate
the basic model into a guaranteed microwave performance specification.
The historical MES1 total-gate-charge function does not use FC; it retains the
fixed 0.5 V continuation described below, rather than substituting the JFET
depletion law at FC×PB.

## Reference parameters and current law

| Parameter | Value | Meaning |
| --- | --- | --- |
| VTO | −2 V | Threshold |
| BETA | 1 mA/V² | Current scale |
| B | 0.3 /V | Gate-overdrive compression |
| ALPHA | 2 /V | Drain saturation rate |
| LAMBDA | 0.0001 /V | Channel-length modulation |
| RD, RS | 100 ohms each | Contact resistances |
| CGS, CGD | 5 pF, 1 pF | Gate-charge scales |
| PB | 0.6 V | Gate potential |
| IS | 10 fA | Schottky junction scale |
| KF, AF | 0, 1 | Flicker settings (disabled) |

For forward VDS and `u = VGS − VTO > 0`:

```
Ich = BETA * u² / (1 + B*u) * (1 + LAMBDA*VDS) * F(VDS)
F   = 1 - (1 - ALPHA*VDS/3)³   when VDS < 3/ALPHA
F   = 1                        otherwise
```

Cutoff gives zero channel current. Reverse operation swaps the controlling
gate voltages and channel direction. Both Schottky gate junctions use MES1's
exponential law and reverse continuation. RD/RS drops are included in fixed-Q
and network solves. There are no package lead inductors or stray capacitors.

Historical MES1 uses a fixed reference thermal voltage at **300.15 K** and
provides no electrical temperature coefficients. Changing `temperature`
changes contact/channel thermal noise only; it does not produce a calibrated
hot GaAs I–V/charge model. This matches the supported SPICE primitive.

## Gate charge and differential capacitances

The Statz total-gate-charge law smooths the effective gate voltages using
1/ALPHA drain smoothing, a 0.2 V threshold transition and a 0.5 V forward
continuation boundary. Those are equation constants. Its derivatives are
`Cgs = ∂Qg/∂Vgs` and `Cgd = ∂Qg/∂Vgd`, each depending on **both** controls.

MES1 partitions the dynamic currents as:

```
Icap_gs = Cgs(Vgs,Vgd) * dVgs/dt
Icap_gd = Cgd(Vgs,Vgd) * dVgd/dt
```

Their sum is dQg/dt, but the individual branches need not have independent
static charge potentials. The shared RF engine stamps these differential
branches directly. Weak nonlinear sources use their capacitance derivatives
through second degree times the control-voltage derivative, giving direct
current sources through third degree. They do not substitute JFET junction
charge or incorrectly multiply each mixed branch by output-frequency jω.
The separate static terminal-charge arrays are zero to avoid double counting.

## External bias, noise and weak nonlinearity

Supply-driven `nodal()/cas()/cascade()` networks solve bias first, with C open
and L short. An initial zero-gate conductance
`ALPHA*BETA*(-VTO)²/(1-B*VTO)` is refined with the shared damped Newton solver
and source stepping when necessary. RD/RS and gate leakage remain in the
assembly. Handoff records `{path, intrinsicVgs, intrinsicVgd, vs}` rebuild each
placement's RF/noise/nonlinear data using its captured context. Reused input
objects and curve settings remain unchanged. Without a V supply, RF retains
the selected fixed Q point; `.solveDC()` is explicit and returns a snapshot.

Noise uses independent contact thermal sources and classical MES1 channel
noise `4*k*T*(2/3)*abs(gm)` plus its KF term (zero in both supplied records). Gate shot
noise and induced gate noise are absent. This classical law is approximate,
especially in the linear region; it is not a measured microwave noise fit.
Direct Taylor IM2/IM3 sources include channel, gate-current and differential
capacitance derivatives. Quadratic remixing, compression, large-signal
switching, trapping, dispersion, avalanche and self-heating are unsupported.

## Verification and drawing

Companion `.cir` decks under `test/fixtures/mesfet-*` provide independent
ngspice 39.3 DC, 3-port AC, noise, hot-state and self-bias references. AC
references deembed their bias-isolation capacitors. Tests check every S entry,
current/charge derivatives, covariance, IM slopes, mixed-device bias,
independent placement handoff and a time-domain Fourier check of mixed-control
capacitance currents. The shared JFET/MOSFET/BJT regressions remain applicable.

`mesfet-ne760*.cir` and `mesfet-ne760.js` cover the published NE760 card:
cutoff, linear, saturation, forward-gate and inverse DC states; all nine complex
S entries from 10 MHz to 10 GHz; classical two-port NF; fixed electrical/hot
noise scaling; and external self-bias. Tests verify record identity survives
DC-to-RF reconstruction, preserves templates and responds to a changed source
resistance. The largest S-component discrepancy is below 2e-8. This is a
numerical conformance range, not a measured device bandwidth rating.

MESFET shares the canonical NJF geometry with G/D/S numbers. Its instance
caption identifies the selected record. HEMT has a separate numerical constructor
with a different static charge partition and correlated noise. Existing shared commonSource boards render the circuit
without new coordinates or corrective overrides. Open the minimal
[self-bias harness](../../dev/shapes/mesfetCommonSource.html) for a DC table, RF
chart and schematic.

The separate [NE760 self-bias harness](../../dev/shapes/mesfetNe760.html) uses a
5 V supply, 150 ohm drain load and 47 ohm bypassed source resistor. It solves
ID≈12.950169 mA, VS≈0.608658 V and VD≈3.057475 V before plotting S11/S21.
