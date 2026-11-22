<!-- Modified: 2026-11-22 -->
# Zener diode records

`D({model: 'BZX384-B4V7', qPoint: {vd: -4.7}})` uses the existing
single-junction SPICE diode engine and selects the canonical Zener symbol.
No separate constructor, equations, DC netlist or layout correction is needed.
Port 1 is **anode**, port 2 **cathode**; VD = VA − VK and ID flows A to K.
Reverse breakdown therefore has negative VD and ID. Physical SOD323 pin numbers
are the opposite: pin 1 K, pin 2 A.

## Parameter provenance

The [pinned model archive][card] contains matching `BZX384B4V7` and
`PH_BZX384-B4V7` cards attributed to NXP/Philips. Its header identifies an
archived July 2013 LTspice Wiki collection. This is an **archived attributed
card**, not a newly authenticated manufacturer download: the original hosted
model could not be retrieved. The [Nexperia datasheet][datasheet] independently
identifies the part, pinning and ratings, but is not the source of the fitted
SPICE coefficients. Preserve that distinction.

Archive revision: `a8688952bcaab19f567bc4db237b60bde03ef310`.
SHA-256 of DIODE2.lib:
`30ed855dc84e2de25e560deac3c77134cb73d072e10199aa8de3d2a7155af902`.

| Supplied parameters | Values and units |
| --- | --- |
| IS, N | 1.033e-15 A, 1.001 |
| BV, IBV | 4.7 V, 5e-3 A |
| RS | 0.387 Ω |
| CJO, VJ, M, FC | 258.9e-12 F, 0.8029 V, 0.3636, 0.5 |
| Generic omitted defaults | TT=0 s, EG=1.11 eV, XTI=3, TNOM=300.15 K, NBV=1, KF=0, AF=1 |

The archive's Iave/Vpk/mfg/type annotations are ratings or identifiers, not
additional electrical coefficients. nP retains provenance and family metadata;
it does not silently add unsupported device physics. There is no external
leakage resistor or explicit package L/C in this card.

## Equations and assumptions

The [common diode law](diodeModels.md) adjusts its intrinsic breakdown knee
from BV/IBV and uses `Ij = -IS * exp(-(knee + Vj)/(NBV*VT))` below it.
Current and its first three derivatives come from that same equation.
The terminal voltage also includes RS: at approximately −IBV, VD is
approximately `−BV − RS*IBV`, rather than exactly −BV. Depletion charge and
its derivatives supply RF capacitance and direct weak nonlinear sources.

Classical noise is `2q*abs(Ij)` junction shot noise, RS thermal noise and
optional KF/AF flicker, through the same RF network. **Avalanche multiplication,
excess breakdown noise and measured Zener-noise fits are absent.** Passing a
SPICE noise comparison verifies this classical approximation, not physical
noise accuracy in breakdown. NBV controls the exponential slope; it is not an
avalanche-noise factor. No breakdown temperature coefficient is supplied;
temperature uses the existing generic diode law. There is no self-heating,
pulse-energy/rating enforcement, transient recovery, compression or rectified
bias shift. Weak IM includes direct second/third-order terms, not quadratic
remixing or large-signal clipping.

## User-supplied parts

```js
var myZener = {
    name: 'My Zener',
    schematicVariant: 'zener',
    parameters: {IS: 1.033e-15, N: 1.001, BV: 4.7, IBV: .005,
        RS: .387, CJO: 258.9e-12, VJ: .8029, M: .3636, FC: .5}
};
var d1 = nP.D({model: myZener, qPoint: {vd: -4.7}});
```

This example reproduces the named card; change the name and parameters for
another compatible part. No registration, rebuild or URL fetch is required.
`schematicVariant: 'zener'` selects artwork only; BV/IBV/NBV supply breakdown
parameters. Defaults and validation match named records. Multi-diode/controlled
source SPICE subcircuits cannot be flattened into this single-junction record.

Standalone D defaults remain VD=+0.6 V and a 0–0.8 V I–V sweep; explicitly
choose reverse bias and `ivTable({vd:{start:-4.8,stop:-4.4,points:81}})` or
supply a network. I–V rows stay in V/A; convert a separate display table to mA
when plotting. External V/R networks solve before RF and rebuild each device
placement without changing templates or curve settings.

## Independent checks

[SPICE deck](../../test/fixtures/zener-bzx384.cir) and
[noise deck](../../test/fixtures/zener-bzx384-noise.cir) run with ngspice 39.3;
the [stored fixture](../../test/fixtures/zener-reference.js) comes from these
outputs, not nP. Re-run from the repository root with `ngspice -b <deck>`;
raw files go to `/tmp/zener-*`. The decks make generic defaults explicit and
use gmin=1e-24 S. Coverage includes VD −2/−4.6/−4.7/−4.8/+0.6 V at
300.15/338.15 K, all four complex S entries at 1/10/100/1000 MHz, classical
noise, and a −8 V/2 kΩ series feed. RF ports are DC isolated; chokes/coupling
capacitors approximate ideal bias tees.

Maximum observed complex-S component error is 3.15e-6; tests allow 4e-6.
Current/conductance differences are under 10 ppm outside negligible blocking
conductance; noise differs by under 2e-5 dB. Tolerances cover historical
simulator constants, gmin and finite reference bias elements. External bias
gives VD ≈ −4.67218555 V and ID ≈ −1.66390723 mA at 300.15 K.

[Tests](../../test/zener.test.js) also verify named/supplied equivalence,
foreign-context records, immutable handoff, current derivatives and 2:1/3:1
weak-product slopes. The symbolic equation audit adds the Zener's blocking,
breakdown and forward expressions with SI units. Its existing three legacy
diode clamp failures remain unrelated and reported.

The datasheet's 4.61–4.79 V limits at 5 mA and 25 °C are a bounds check only;
agreement does not establish a measured curve or manufacturer-certified RF fit.
See the minimal [externally biased example](../../dev/zener.html).

The follow-up [breakdown-noise investigation](zenerNoise.md) identifies the
missing RF noise characterization, relevant published models, required data
and recommended implementation/validation path.

[card]: https://raw.githubusercontent.com/kicad-spice-library/KiCad-Spice-Library/a8688952bcaab19f567bc4db237b60bde03ef310/Models/Diode/DIODE2.lib
[datasheet]: https://assets.nexperia.com/documents/data-sheet/BZX384_SER.pdf
