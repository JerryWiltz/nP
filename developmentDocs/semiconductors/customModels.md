<!-- Modified: 2026-11-22 -->
# User-supplied semiconductor models

All catalog-based semiconductor constructors accept either a built-in name or
a plain record in `model`: **NPN, PNP, NJF, PJF, NMOS, PMOS, MESFET, HEMT, D, NoiseDiode and PIN**.
A new part number needs no catalog registration, rebuild, downloaded source or
network access. It uses the same resolution, validation, equations, DC bias,
RF, noise and supported weak nonlinear construction as a built-in record.
NoiseDiode uses the separate [avalanche/drift RF/noise record](noiseDiodeModels.md):
core SI parameters and a noiseFit are required, with no borrowed part fit.
Its immutable DC requirement and deterministic-IM rejection remain identical
for named and supplied records; no missing DC or cold-state physics is implied.

```js
var myModel = {
    name: 'My JFET',
    parameters: {VTO: -3, BETA: 0.001, LAMBDA: 0.01,
        RD: 10, RS: 10, CGS: 2e-12, CGD: 1e-12}
};
var q1 = nP.NJF({model: myModel});
```

These illustrative values are not a measured device fit. `parameters` is
required. Omitted values use the family defaults below, never a built-in part's
fit. Names default to `'custom'`. The constructor determines polarity; an
optional record `polarity` must agree (+1 N-channel, −1 P-channel). JFET VTO is
negative in the engine's normalized coordinates for either polarity. MOS VTO
uses physical polarity (normally positive NMOS, negative PMOS).

The exact record returned by a family's internal `*Model` resolver can be passed
back to its constructor. The same record can later be compiled into its catalog.
`device.model` is also reusable; when reusing a MOSFET's record, its `body` field
must agree with the constructor's `body` option. This is a data API, not a SPICE
text/subcircuit importer or a way to select different device equations.

## Common record contract

- Parameter names are case-sensitive. Unknown fields/parameters and invalid
  values are errors; unsupported physical effects are never silently enabled.
- Use A, V, Ω, H, F, seconds and meters. `TNOM` is **kelvin**, not the Celsius
  used in a SPICE card. EG is eV. MOS CGSO/CGDO/CGBO are F/m; KP/BETA are A/V²;
  LAMBDA, MES/HEMT B and ALPHA are 1/V; MOS GAMMA is √V.
- Optional provenance fields include manufacturer, material, structure,
  mathematicalModel, modelVersion, source, package, noiseModel and limitations.
  Family-specific existing provenance is retained. Links are metadata and are
  never fetched. Metadata does not change equations or establish accuracy.
- Inputs are copied, never mutated or frozen. The resolved internal DC record
  is immutable. Changing a public `.model` parameter does not rebias/rebuild a
  device: construct a new device with the changed record.
- Curves, Q-point, terminal order, noise and intermodulation limitations remain
  those of the selected constructor. A default model is not a measured part fit.
- Empty `inductors`/`capacitors` may be omitted. JFET, MOSFET, MESFET and D reject
  nonempty arrays because their current adapters have no arbitrary package L/C
  wiring. BJT retains its established package mapping; HEMT derives its network.

## Defaults and supported parameters

All parameters below are finite and nonnegative unless a range exception is
specified. Positive means strictly greater than zero. An explicitly supplied
undefined value is an error rather than an omitted value.

### NPN / PNP

See the complete [BJT parameter/default table and package-node convention](transistorModels.md#supported-parameters-and-defaults).
Named 2N3904, BFR93A and 2N3906 calls retain their previous behavior, including
nP's ITF=Infinity compatibility default.

### NJF / PJF

| Parameters | Defaults |
| --- | --- |
| VTO, BETA, LAMBDA | −2 V, 1e-4 A/V², 0 |
| RD, RS, CGS, CGD, KF | 0 |
| IS, PB, FC | 1e-14 A, 1 V, 0.5 |
| TNOM, TCV, BEX, NLEV, AF | 300.15 K, 0, 0, 1, 1 |

VTO must be negative; BETA/IS/PB/TNOM positive; TCV/BEX may be any finite value;
0 ≤ FC < 1; NLEV must be 1. The implemented channel law has fixed B=1; arbitrary
Parker–Skellern B or other noise selectors remain unsupported. Defaults follow
the [ngspice JFET parameter definitions][jfet].

### NMOS / PMOS

| Parameters | Defaults |
| --- | --- |
| LEVEL, VTO, KP, GAMMA, PHI | 1, 0 V, 2e-5 A/V², 0, 0.6 V |
| LAMBDA, RD, RS, CBD, CBS, CGSO, CGDO, CGBO, KF | 0 |
| IS, PB, MJ, FC | 1e-14 A, 0.8 V, 0.5, 0.5 |
| L, W, TNOM, AF | 100e-6 m, 100e-6 m, 300.15 K, 1 |

LEVEL must be 1; KP/PHI/IS/PB/L/W/TNOM positive; VTO any finite value;
0 ≤ MJ/FC < 1. L/W use nP's existing default discrete-device geometry. Other
defaults follow the supported [MOS1 parameters][mos]. TOX/inversion charge,
MOS2/MOS3, BSIM, sheet/area-derived contacts and extra junction geometries are
not added by this input API. `body: 'source'` or `'external'` remains a constructor
option, independent of model parameters.

### MESFET

| Parameters | Defaults |
| --- | --- |
| VTO, BETA, B, ALPHA, LAMBDA | −2 V, 1e-4 A/V², 0.3/V, 2/V, 0 |
| RD, RS, CGS, CGD, KF | 0 |
| PB, IS, AF, FC | 1 V, 1e-14 A, 1, 0.5 |

VTO must be negative; BETA/ALPHA/IS positive; PB > 0.5 V because the existing
MES1 charge continuation uses 0.5 V; 0 ≤ FC < 1. FC is retained source data but
is inactive in Berkeley MES1. Defaults follow [Statz/MES1][mes], with the existing
gate-current IS default. Electrical referenceTemperature stays 300.15 K; a
different value is rejected. The analysis temperature continues to affect
thermal noise only.

### HEMT

This remains the implemented Statz/Divekar adaptation. There is no generic
manufacturer die/noise fit to fall back to. Supply these core parameters:

**VTO, BETA, ALPHA, PB, DELTA1, DELTA2, VMAX, RC, CRF.**

| Other supported parameters | Defaults |
| --- | --- |
| B, LAMBDA, RG, RD, RS, LG, LD, LS, CGS, CGD, CDS | 0 |
| IS, N, FC | 1e-14 A, 1, 0.5 |
| P, R, C, FNC, KF, AF, FFE | 0, 0, 0, 0, 0, 1, 1 |

VTO is negative; BETA/ALPHA/PB/IS/N/DELTA1/DELTA2/RC/CRF positive;
0 ≤ FC < 1; −1 ≤ C ≤ 1. Remaining supported values, including VMAX, are finite
and nonnegative. P/R/C default to no correlated gate/channel noise fit; this is
not a claim of noiseless measured behavior. Existing nominal-temperature,
positive-frequency and conducting-Q restrictions apply. Electrical
referenceTemperature is fixed at 300.15 K.

`packageParameters` is null/omitted for the die topology. To use the existing
common-source SC-70 network, supply all of **La, Lb, Lc, Ld, Rb, Rbridge, Ca, Cb**
in H/Ω/F (finite, nonnegative). This describes the existing topology with new
values, not arbitrary package wiring. The resolver regenerates terminalNetwork,
contactResistances and the L/C arrays from parameters/packageParameters. These
derived fields may be present in a complete resolved record, but must match the
regenerated values. When changing raw parameters, omit stale derived fields.
See the [HEMT equation/package contract](hemtModels.md) for the retained model
assumptions and evidence gaps.

### D: junction and Schottky diodes

| Parameters | Defaults |
| --- | --- |
| IS, N, BV, IBV | 1e-14 A, 1, Infinity, 1e-3 A |
| RS, CJO, TT, KF | 0 |
| VJ, M, FC | 1 V, 0.5, 0.5 |
| EG, XTI, TNOM, NBV, AF | 1.11 eV, 3, 300.15 K, 1, 1 |

IS/N/IBV/VJ/TNOM/NBV are positive; BV positive or Infinity (no breakdown);
M is finite and nonnegative (including 1 and hyperabrupt values); 0 ≤ FC < 1; XTI any finite value. These are the supported classical diode
defaults; see [ngspice diode parameters][diode]. `leakageResistance` is an
optional record-level positive resistance in Ω, default Infinity. It is outside
RS. Set `schematicVariant: 'schottky'`, `'varactor'` or `'zener'` for the corresponding symbol; omit for the
ordinary junction symbol. Symbols do not change the diode equations. Zener records use BV/IBV/NBV for the existing exponential breakdown law; select negative VD explicitly. This does not add avalanche excess noise or a breakdown temperature coefficient. See [Zener records](zenerModels.md).

```js
var myDiode = {
    name: 'My Schottky',
    schematicVariant: 'schottky',
    parameters: {IS: 5e-6, RS: 20, N: 1.05, CJO: .14e-12,
        M: .4, VJ: .34, EG: .69, BV: 2, IBV: 1e-4}
};
var d1 = nP.D({model: myDiode, qPoint: {vd: .05}});
```

D also accepts `packageParameters: {seriesInductance, parallelCapacitance}`
with finite nonnegative H/F values, both defaulting to zero. LS is in series
with [CP parallel to (RS + junction)]. Arbitrary package arrays stay unsupported.
`d1.cvTable({vr:{start:0,stop:15,points:31}})` produces V/F/F rows for reverse
voltage, depletion CJ and low-frequency terminal CT. VR defaults to 0–10 V with
201 points and must be nonnegative/increasing. The curve does not move Q.
The [varactor record](varactorModels.md) illustrates the package and M=1/hyperabrupt
charge support with SMV1231-079LF, through the same named-or-record path.

The legacy `diode1N4148()` keeps its existing flat custom-parameter options; it
has no catalog record selector. Its planned removal is separate from this work.

### PIN

The default charge-storage engine accepts `modelType:'charge-storage'`, with
required positive W (m), TAU (s), REPI and RLIM (ohms, RLIM < REPI).
Optional IS/N/RS, high-injection IKF/IKMODEL, lifetime IKNEE, BV/IBV,
RP, depletion CJO/VJ/M/FC, EG/XTI and KF/AF/FFE use generic defaults.
Package seriesInductance/parallelCapacitance default to zero H/F.
referenceTemperature defaults to 298.15 K. Named and supplied records share
automatic DC bias, dynamic RF/noise and cubic IM paths. The built-in reference
is generic, not a manufacturer fit; see the full units/defaults/limitations in
[PIN models](pinModels.md). No provenance URL is fetched.

The retained selected-region engine (SMP1307-011LF, or its supplied schema)
requires positive VI (V), RR (Ω), TAU (s) and an operatingRange with positive
minFrequency/maxFrequency (Hz) and minForwardCurrent/maxForwardCurrent (A),
with increasing intervals. Generic IS=1e-14 A, N=1, RS=RRF=CJO=0, VJ=1 V,
M=FC=.5 do not borrow a named part's fit. Optional packageParameters are
seriesInductance (H), middleCapacitance and parallelCapacitance (F), each default
0. Custom referenceTemperature defaults to 300.15 K; temperature must equal it.
Select forward/reverse region before DC/RF; named and supplied records retain
independent network handoff and reject unsupported IM. See [full contract](pinModels.md).

## Verification

`test/semiconductor-model-record.test.js` checks all eleven built-in records
from the five newly extended selectors. Named/object calls match exactly at
two temperatures, including source-tied/external MOS bodies, fixed-Q curves,
S/noise/Taylor data, computed weak products, external DC networks and automatic
RF handoff. BJT has its separate equivalent tests. Generic defaults, immutable
copies, no registration, polarity errors and stale HEMT package data are checked.
Plain records created in separate REPL/iframe contexts are checked across the
original nine constructors; their prototypes need not come from the library's context.
`test/pin-charge.test.js` verifies charge-storage supplied records and weak IM against SPICE; `test/pin.test.js` separately checks named/supplied/foreign-context PIN records,
independent per-placement DC/RF handoff, and explicit unsupported IM behavior.
Existing independent simulator-reference tests remain the numerical evidence
for the unchanged equations; equivalence alone is not measured-device validation.

[jfet]: https://nmg.gitlab.io/ngspice-manual/jfets/jfetmodels_njf_pjf/jfetlevel1modelwithparkerskellernmodification.html
[mos]: https://nmg.gitlab.io/ngspice-manual/mosfets/mosfetmodels_nmos_pmos/ngspicelevel1,2,3and6parameters.html
[mes]: https://nmg.gitlab.io/ngspice-manual/mesfets/mesfetmodels_nmf_pmf/modelbystatze_a.html
[diode]: https://nmg.gitlab.io/ngspice-manual/diodes/diodemodel_d.html
