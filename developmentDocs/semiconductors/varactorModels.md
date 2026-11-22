<!-- Modified: 2026-11-21 -->
# Varactor diode models

`D({model:'SMV1231-079LF',qPoint:{vd:-3}})` selects the Skyworks SC-79 varactor
and its canonical symbol. No separate Varactor constructor is introduced.
Ports remain **1 anode, 2 cathode**. Positive reverse voltage VR means negative
anode-to-cathode VD. Supply-driven networks solve VD before RF/noise/direct IM
rebuilding; stand-alone devices retain their explicit Q point. D's defaults
remain 1N4148, VD=.6 V and the 0–.8 V/201-point I–V curve.

## Source record

The manufacturer [SMV123x datasheet][datasheet], **200058AB, May 7, 2026**,
provides Figure 5, Table 5's fitted parameters and Table 1's package inductance.
The downloaded PDF was checked visually; cached web text may identify an older
200058AA edition. SHA-256 of the checked PDF:
`55f728efbd2988f9a5dabaf1ac5a420c0b6e91429dd1b3dd446c88eae8dd87db`.
The [varactor application note][appnote], 200315C, August 5, 2015, defines the
capacitance law and the fitted CP interpretation.

| Item | Supplied value | Meaning |
| --- | --- | --- |
| CJO | 1.88e-12 F | Zero-bias depletion capacitance |
| VJ | 10.13 V | Fitted junction potential |
| M | 4.999 | Hyperabrupt grading coefficient |
| RS | 2.5 Ω | Constant fitted series resistance |
| CP | .44e-12 F | Parallel capacitance outside RS/junction |
| LS | .7e-9 H | SC-79 series lead before the parallel branches |

IS=1e-14 A, N=1, TT=0, EG=1.11 eV, XTI=3, FC=.5, TNOM=300.15 K,
IBV=1e-3 A, NBV=1, KF=0 and AF=1 retain the manufacturer's generic junction
defaults. No finite fitted BV is supplied, so BV remains Infinity. The 15 V
rating is not silently substituted for breakdown voltage. No extra leakage
resistor is introduced. Forward current, leakage and breakdown are not measured
fits for this part. Nominal RS does not reproduce its voltage/temperature curves.

## Shared charge law

The ordinary diode depletion law already expresses the reverse C–V fit:

```text
Cj(V) = CJO * (1 - V/VJ)^(-M), with V = junction anode minus cathode

Q(V) = CJO*VJ * [1 - (1 - V/VJ)^(1-M)] / (1-M), M != 1
Q(V) = -CJO*VJ * ln(1 - V/VJ), M = 1
```

D now accepts every finite nonnegative M. The integrated charge uses log1p and
expm1 for accuracy around zero voltage and M=1. The logarithmic case is the
actual integral limit, not a fitted exception. Above FC*VJ, the existing
quadratic charge continuation retains continuous Q, C and first C derivative.
The second C derivative can step at that continuation boundary. DC currents
continue to use the same junction law. RF uses dQ/dV; direct weak nonlinear
sources use dC/dV and d²C/dV² from this same law.

## Package contract

Every D record may specify:

```js
var myModel = {
    name: 'My varactor',
    schematicVariant: 'varactor',
    parameters: {IS: 1e-14, N: 1, CJO: 1.88e-12, VJ: 10.13, M: 4.999,
        RS: 2.5, EG: 1.11, XTI: 3, TNOM: 300.15},
    packageParameters: {seriesInductance: .7e-9, parallelCapacitance: .44e-12}
};
var d1 = nP.D({model: myModel, qPoint: {vd: -3}});
```

The example uses the same fitted C–V/package values as the built-in record.
Both package fields default to zero and require finite nonnegative H/F values.
The supported topology is **LS in series with [CP parallel to (RS + junction)]**.
The optional existing leakageResistance stays across the public terminals.
Arbitrary L/C arrays remain rejected. The package changes no symbol terminal
order. At DC, LS shorts and CP opens, so the existing RS/junction DC reduction
is exact; package values remain in the immutable DC record.

The RF, noise and intermodulation paths share `diodeLinearResponse()`.
It computes the port admittance, terminal-to-junction voltage transfer and
internal-current-to-output-wave transfer at each required frequency. Thus CP
loads the fundamental voltages and the product currents; LS affects both.
RS thermal noise, junction shot/flicker noise and optional external leakage
thermal noise use their own transfer factors. Ideal LS/CP add no noise.
Existing no-package records reduce to the original diode circuit.

## C–V output

`d1.cvTable({vr:{start:0,stop:15,points:31}})` returns:

```text
['vr (V)', 'cj (F)', 'ct (F)']
[reverse voltage, junction depletion capacitance, low-frequency total capacitance]
```

VR defaults to 0–10 V with 201 points. It must be finite, nonnegative and
increasing, with at least two integer points. CJ uses the solved intrinsic
junction voltage at the applied reverse voltage, including any DC RS drop.
CT is the zero-frequency limit of Im(Yport)/omega. In reverse blocking it is
effectively junction-plus-diffusion capacitance plus CP. More generally it is
`(Cj+Cd)/(1+RS*g)^2 + CP - LS*(g/(1+RS*g))^2`, where g is junction conductance.
Thus a conducting model can have an inductive (negative) terminal slope; CT is
not an RF equivalent at finite frequency/resonance. Sweeping never mutates caller settings,
fixed Q, S/noise rows or I–V defaults. Existing smallSignal.totalCapacitance
remains the intrinsic junction-plus-diffusion value. Added fields are
packageCapacitance, terminalCapacitance and seriesInductance.

## Verification and limits

- `test/varactor.test.js` checks sourced data, symbol/terminal identity, named
  versus supplied record equality, external bias and RF handoff, immutable
  settings, M=1/hyperabrupt charge derivatives, continuation and package IM.
- All four complex S entries at three biases (.5/3/10 V reverse) and four
  frequencies (10/100 MHz, 1/2 GHz) agree with independently executed ngspice
  39.3 circuits within 1e-7. DC current/voltage and classical NF are also checked;
  NF differs by less than 3e-6 dB using the same source temperature.
- A raw ngspice D card is **not** the reference: version 39 clamps M to .9 and
  VJ to 2 V. The checked decks use a primitive for conduction with CJO=0 and an
  independent behavioral capacitor implementing the manufacturer's integrated
  charge, plus explicit RS/CP/LS. This preserves the supplied fit. See
  `test/fixtures/varactor-smv1231*.cir` and `varactor-reference.js`.
- At the datasheet's 25 °C, the modeled low-frequency CT differs from Table 4's
  typical values by at most about **4.42%** over 0–15 V. A fitted curve is not
  identical to a typical-data table or a guarantee for every manufactured part.
- Math.js separately checks varactor charge through third derivatives and
  explicit units, including M=1 and nearby values. The audit retains its three
  pre-existing legacy-diode clamp failures.
- Direct IM2/IM3 terms have their expected power slopes. An independent
  impedance-divider calculation checks the package's fundamental and product
  transfer for IM3. This omits quadratic remixing, compression, rectified bias
  shifts and harmonic balance, as the existing diode model does.
- Noise uses classical current/contact sources, not measured varactor noise or
  VCO phase noise. The existing SPICE temperature law is not a fitted C(T)/R(T)
  model. Package elements are lumped; no distributed microwave fit is claimed.

The runnable [example](../../dev/varactor.html) contains an external −3 V bias,
C–V curves, RF plots and schematic. General supplied-record instructions are
in [customModels.md](customModels.md).

[datasheet]: https://www.skyworksinc.com/-/media/F9C9BC1315644EB890723BD8C726746E.pdf
[appnote]: https://www.skyworksinc.com/-/media/SkyWorks/Documents/Products/1-100/Varactor_SPICE_Model_AN_200315C.pdf
