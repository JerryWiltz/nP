<!-- Modified: 2026-11-26 -->
# Transistors and Diodes

The public active-device constructors are `nP.Amp()`, `nP.NoiseDiode()`, `nP.PIN()`, `nP.D()`, `nP.diode1N4148()`, `nP.NPN()`, `nP.PNP()`, `nP.NJF()`, `nP.PJF()`, `nP.NMOS()`, `nP.PMOS()`, `nP.MESFET()` and `nP.HEMT()`. The amplifier is a configurable two-port gain/noise model. Diode and transistor models combine DC I–V curves with RF behavior at a fixed bias.

## Your own device parameters

NPN, PNP, NJF, PJF, NMOS, PMOS, MESFET, HEMT, D, NoiseDiode and PIN accept a model name or a
user-supplied record. A new part needs no catalog registration or library rebuild:

```js
var myModel = {
    name: 'My JFET',
    parameters: {VTO: -3, BETA: .001, RD: 10, RS: 10,
        CGS: 2e-12, CGD: 1e-12}
};
var q1 = nP.NJF({model: myModel});
```

These are illustrative parameters, not a measured part fit. A plain `parameters`
object is required. Omitted optional values receive generic family defaults;
they do not inherit a built-in part's fit. Optional `name` and provenance are
preserved. Source links are never fetched. Named and supplied records share the
same DC, RF, noise and weak nonlinear equations.

NoiseDiode is the fixed-bias RF/noise exception: it explicitly lacks DC I-V
and deterministic nonlinear equations. Its named and supplied records share
those same limitations. PIN defaults to a five-section charge-storage model
with automatic DC/RF/noise and cubic weak IM. Its older selected-region
SMP1307-011LF equivalent retains its separate limitations.

Use A, V, Ω, H, F, seconds and meters; TNOM is kelvin, EG eV and MOS overlap
capacitances F/m. Parameter names are case-sensitive. Unknown parameters and
conflicting polarity are errors. JFET/MOSFET/MESFET/D reject nonempty package
L/C arrays. HEMT derives its existing die/SC-70 network from parameters and
packageParameters; supplied derived fields must agree.

| Constructor | Custom record behavior |
| --- | --- |
| NPN / PNP | Generic Gummel–Poon defaults and existing BJT package mapping; see below. |
| NJF / PJF | Generic level-1 defaults: VTO=−2 V, BETA=1e-4 A/V², PB=1 V, IS=1e-14 A; zero RD/RS/CGS/CGD. VTO is negative in normalized coordinates for either polarity. |
| NMOS / PMOS | MOS1 defaults: VTO=0 V, KP=2e-5 A/V², PHI=.6 V, PB=.8 V, IS=1e-14 A, L=W=100 µm; zero parasitic capacitance/contact resistance. Body remains an options-level choice. |
| MESFET | Generic Statz/MES1 defaults: VTO=−2 V, BETA=1e-4 A/V², B=.3/V, ALPHA=2/V, PB=1 V; zero contact resistance/capacitance. Electrical temperature remains 300.15 K. |
| HEMT | Supply VTO, BETA, ALPHA, PB, DELTA1, DELTA2, VMAX, RC and CRF. Optional correlated noise P/R/C defaults to zero rather than borrowing a manufacturer fit. Existing conducting-Q and nominal-temperature limits apply. |
| D | Classical diode defaults: IS=1e-14 A, N=1, VJ=1 V, M=FC=.5, BV=Infinity; zero RS/CJO/TT. Optional leakageResistance defaults to Infinity; schematicVariant selects Schottky/varactor/Zener artwork. Optional fixed-topology LS/CP package values are described below. |
| PIN | Charge-storage records use modelType:'charge-storage', required W/TAU/REPI/RLIM (SI), generic PN/storage/noise defaults and optional L/CP. Automatic bias with cubic weak IM. The older selected-region schema requires VI/RR/TAU and operatingRange and has no IM. |
| NoiseDiode | Required avalanche/drift SI parameters and noiseFit; zero optional package/contact parasitics, length ratio .5, custom reference temperature 300.15 K. No default manufacturer fit, DC law or off-state model. |

Read resolved values from `device.model.parameters`. Complete records from
`device.model` can be reused; when reusing MOS records keep the matching body
option. Changing the public metadata does not rebuild a device: construct a new
device with changed parameters. Legacy `diode1N4148()` retains its existing flat
parameter options. This API requires a current bundle with object support.

## NPN transistor

`nP.NPN()` supports **2N3904** (default) and **BFR93A**. It returns a three-port: **1 base, 2 collector, 3 emitter**.

You can also supply a model record without adding it to the library:

```js
var myModel = {
    name: 'My NPN',
    parameters: {IS: 1e-15, BF: 150, VAF: 80, CJE: 4e-12, CJC: 3e-12}
};
var q1 = nP.NPN({model: myModel});
```

These are illustrative parameters, not a measured part fit. `parameters` is
required; omitted values use generic defaults rather than the 2N3904 values.
Metadata is optional; name defaults to `'custom'`, package L/C arrays to empty.
No source links are fetched. Both input forms use the same DC, RF, noise and
weak nonlinear equations. Names are case-sensitive inside `parameters`; unknown
keys and invalid values are rejected. Use A, V, Ω, F and seconds, with `TNOM`
in kelvin and `EG` in eV. Generic defaults include IS=1e-16 A, BF=100, BR=1;
omitted terminal resistances, junction capacitances and transit times are zero.
VAF/VAR/IKF/IKR/VTF default to Infinity. nP retains ITF=Infinity for compatibility;
supply ITF explicitly when reproducing a SPICE card. `q1.model` reports resolved
defaults. Object input requires a current bundle supporting this feature.

```js
// NPN curve tracer and RF at a selected Q point
var g = nP.global;
g.fList = g.fGen(10e6, 500e6, 51);

var q1 = nP.NPN({
    model: '2N3904',
    configuration: 'commonEmitter',
    bias: {
        ib: {start: 0, stop: 50e-6, points: 6},
        vce: {start: 0, stop: 10, points: 201}
    },
    qPoint: {ib: 20e-6, vce: 5},
    temperature: g.Temp
});
var short = nP.Short();
var amplifier = nP.nodal(
    [q1, 1, 2, 3],
    [short, 3],
    ['out', 1, 2]
);
var curves = q1.ivTable();
var rf = amplifier.out('s11dB', 's21dB');
var stability = amplifier.out('K', 'deltaMag');
var noise = amplifier.out('NF21dB');

nP.lineChart({inputTable: [curves], metricPrefix: 'none',
    title: '2N3904 curve tracer', xAxisTitle: 'VCE (V)', yAxisTitle: 'IC (A)'});
nP.lineChart({inputTable: [rf], metricPrefix: 'mega', title: 'Common-emitter RF'});
```

`bias` defines the curves; `qPoint` fixes the RF operating point. Sweeping does not move it. Construct another NPN with different `qPoint` values to select another point. With no arguments, the constructor uses the defaults above and the current `global.fList`, initially `[2e9]`, just as `R()` does. Partial nested settings keep omitted defaults.

For `commonBase`, use `bias: {ie: {...}, vcb: {...}}` and `qPoint: {ie: 2e-3, vcb: 5}`; its table plots IC versus VCB at stepped outward IE. For `commonCollector`, retain IB and positive VCE; the table reports outward IE. The DC `configuration` does not terminate an RF port: ground emitter, base or collector externally to obtain the corresponding RF configuration. `.bias`, `.qPoint`, `.smallSignal` and `.model` expose the chosen point, linearization and provenance.

Completed two-ports provide `.stability` and `.out('K', 'deltaMag')`. Unconditional small-signal stability requires K > 1 and |Δ| < 1. K comes from the final S-parameters; intermediate K < 1 is allowed. Bare three-port NPNs have no two-port K value.

BFR93A includes its published SOT23 L/C network. The 2N3904 card includes terminal resistances but no explicit package L/C model. Noise uses classical shot/thermal sources, without fitted excess-noise or high-frequency induced-noise behavior. With `global.twoTone` set before construction, IM/OIP selectors use direct Taylor current and charge terms; they omit quadratic remixing, compression and harmonic balance. Neither card models avalanche or self-heating. Networks containing an explicit `V()` supply solve their DC bias before RF analysis, for named and supplied model records alike.

Try [NPN curve tracer and RF in the REPL](/repl#example-npn-curve-tracer).

## Read device-curve results

I–V and C–V methods retain their existing SI table arrays and add `.out()`:

```js
var q1 = nP.NPN();
var curves = q1.ivTable();
var current = curves.out('icmA', {label: 'Q1'});
nP.lineChart({inputTable: [current], metricPrefix: 'none',
    xAxisTitle: 'VCE (V)', yAxisTitle: 'Collector current (mA)'});
```

`icmA` retains every stepped base-current trace and its label. Common-collector
curves use `iemA`; FET and diode curves use `idmA`. Select `cjpF` and/or `ctpF`
from a C–V result. Unsuffixed fields use A/F. Current suffixes are A/mA/uA/nA/pA;
capacitance suffixes are F/mF/uF/nF/pF/fF. Optionally put the existing swept
voltage first to select V/mV/uV, for example `curves.out('vcemV', 'icuA')`.

At least one dependent measurement is required. Labels name a single trace
with units, or prefix multiple quantity/bias headings. Each call returns fresh
rows, preserving polarity and bias-step order. Editing a display table or the
original array does not change captured curve samples or the device Q point.
JSON and structured clones omit `.out()` while retaining ordinary table data.
These methods require a current capable bundle; older/pinned builds may return
only the original table arrays.

## PNP transistor

`nP.PNP()` supports **2N3906** using the same model engine and APIs as NPN. Its ports remain **1 base, 2 collector, 3 emitter**.

It also accepts `nP.PNP({model: myPnpModel})` with the same record structure and
generic defaults described above; supply the parameters of the desired PNP.

Use physical signed PNP values:

```js
// PNP curve tracer and RF
var g = nP.global;
g.fList = g.fGen(10e6, 500e6, 51);
var q1 = nP.PNP({
    model: '2N3906',
    configuration: 'commonEmitter',
    bias: {
        ib: {start: 0, stop: -50e-6, points: 6},
        vce: {start: 0, stop: -10, points: 201}
    },
    qPoint: {ib: -20e-6, vce: -5},
    temperature: g.Temp
});
var short = nP.Short();
var amplifier = nP.nodal(
    [q1, 1, 2, 3],
    [short, 3],
    ['out', 1, 2]
);
var curves = q1.ivTable();
var rf = amplifier.out('s11dB', 's21dB');
nP.lineChart({inputTable: [curves], metricPrefix: 'none',
    title: '2N3906 curve tracer', xAxisTitle: 'VCE (V)', yAxisTitle: 'IC (A)'});
nP.lineChart({inputTable: [rf], metricPrefix: 'mega', title: 'PNP common-emitter RF'});
nP.schematic(amplifier);
```

`PNP()` with no options uses these defaults and the current frequency context. IB and IC are negative. The reported outward IE is negative too: current physically enters the emitter. Curves retain their 0-to-negative sweep order; they do not change the RF Q point. For common base use negative `ie`/`vcb`, defaulting to `qPoint: {ie: -2e-3, vcb: -5}`. Common collector uses negative IB/VCE and plots outward IE. Configuration selects DC constraints; the RF network still needs explicit terminal connections.

PNP supplies its own active noise covariance and bias-dependent nonlinear coefficients, and its completed two-port supports K. The 2N3906 card includes RB/RC but no explicit package L/C network. The NPN model limits and direct Taylor intercept approximation also apply here. The symbol's emitter arrow points inward; its numbered ports stay fixed during rotation or mirroring.

Try [PNP curve tracer and RF in the REPL](/repl#example-pnp-curve-tracer).

## Amplifier

`nP.Amp()` defaults to a matched, unilateral **20 dB gain** stage with **4 dB noise figure**, referenced to **290 K**. Its default S-parameters are frequency-flat across the selected list. The first two positional arguments change gain and noise figure; an options object supports measured S-parameters and other noise properties.

```js
nP.global.fList = nP.global.fGen(1e9, 2e9, 11);

var amp1 = nP.Amp();      // 20 dB gain, 4 dB NF
var amp2 = nP.Amp(15, 3); // 15 dB gain, 3 dB NF

var gainAndNoise = amp2.out('s21dB', 'NF21dB');
nP.lineTable({inputTable: [gainAndNoise], title: 'Amplifier'});
```

![Amplifier stage schematic](/schematics/amplifier.svg)

For two-tone intermodulation, the object form can supply `oip2dBm`, `oip3dBm`, and `harmonicOip2dBm`. None is present by default:

```js
var amp3 = nP.Amp({
    gainDb: 20,
    noiseFigureDb: 4,
    oip3dBm: 30
});
```

The full options include `spars`, `fMinDb`, `gammaOpt`, `noiseResistanceOhms`, and `referenceTemperature`. See [Noise](./noise.md) and [Intermodulation](./intermodulation.md) for measurement setup and the limits of the intercept calculation.

## SPICE-style diode

`nP.D()` selects **1N4148**, a silicon signal diode, or the Skyworks **SMS7621/SMS7630** per-junction Schottky records, or the SMV1231-079LF varactor or archived BZX384-B4V7 Zener. Like the transistor constructors, it keeps the displayed DC sweep separate from an explicit RF Q point. Port **1 is the anode**; port **2 is the cathode**.

```js
// 1N4148 curves and RF at a fixed operating point
var g = nP.global;
g.fList = g.fGen(10e6, 1e9, 51);

var d1 = nP.D({
    model: '1N4148',
    bias: {
        vd: {start: 0, stop: 0.8, points: 201}
    },
    qPoint: {vd: 0.6},
    temperature: g.Temp
});

var curves = d1.ivTable();
var response = d1.out('s11dB', 's21dB');
var noise = d1.out('NF21dB');
var fixedBias = d1.bias;

nP.log(fixedBias);
nP.schematic(d1);
nP.lineChart({
    inputTable: [curves],
    title: '1N4148 DC curve',
    xAxisTitle: 'Anode-to-cathode voltage (V)',
    yAxisTitle: 'Anode current (A)',
    metricPrefix: 'none'
});
nP.lineChart({
    inputTable: [response],
    title: '1N4148 RF at VD = 0.6 V',
    xAxisTitle: 'Frequency (MHz)',
    yAxisTitle: 'S-parameters (dB)',
    metricPrefix: 'mega'
});
```

These are also the defaults for `D()`, except that its frequency grid follows the current `global.fList`, initially `[2e9]`. Temperature follows `global.Temp`, initially 293 K. Partial nested options keep omitted defaults. `vd` means anode minus cathode, in volts; `id` is positive from anode to cathode, in amperes.

`ivTable()` returns a directly plottable table. `ivTable({vd: {start: -5, stop: 0.8, points: 301}})` selects another curve range without moving the Q point. `.bias` and `.qPoint` report the solved currents and voltages; `.smallSignal` reports the bias-dependent conductance, resistance and capacitance. `.model` records the selected card and its provenance. `.dc.bias` records the sweep. Without a DC supply, RF networks preserve the device's selected bias. A supported nodal/cascade network containing V() automatically solves its external bias before rebuilding diode RF, noise and weak nonlinear data. Read network.operatingPoint; the original diode object and I–V curve settings stay unchanged.

The archived NXP SPICE card includes series resistance, leakage, junction charge and transit-time charge. It is a different parameter set from `diode1N4148()` below. It has no explicit package L/C network or large-signal transient simulation. Its noise follows classical SPICE junction shot noise plus resistor thermal noise; it does not model calibrated avalanche or excess noise. Weak nonlinear products use local current/charge derivatives and the existing two-tone analysis, with the same direct-source approximation described in [Intermodulation](./intermodulation.md#diode-intermodulation).

Try [1N4148 DC and RF in the REPL](/repl#example-diode-dc-rf).

### PIN diode

`PIN()` defaults to `CHARGE_STORAGE_REFERENCE`: a generic numerical reference
for the published five-section charge-storage equivalent, not a fitted part.
Two PN junctions and a dynamic storage ladder determine conductivity from the
bias. The same equations supply DC, frequency-dependent RF, compact-model
shot/flicker/thermal noise and cubic weak intermodulation.

```js
nP.global.fList = [1e3, 1e6, 10e6, 100e6, 1e9];
var d1 = nP.PIN({qPoint: {vd: 1.4}});
var response = d1.out('s21dB', 'NF21dB');
nP.lineTable({inputTable: response});
```

Forward, zero and reverse bias use one continuous model. Omit region or use
'automatic'; external V/R networks set an independent bias for every placement
before RF/noise/IM rebuilding. Default VD=.8 V and reference temperature
298.15 K; I–V sweeps default to −5…1.2 V, 201 points.
A supplied full record uses modelType:'charge-storage', with positive W (m),
TAU (s), REPI/RLIM (ohms, RLIM<REPI). Other parameters receive generic defaults;
no fitted part data are borrowed. The full parameter contract documents both
SPICE high-injection conventions, lifetime knee, depletion, noise, package
and temperature assumptions.

This is a reduced dynamic model with weak Volterra analysis, not a general
network transient or harmonic-balance solver. Local quadratic feedback is
included; quadratic remixing between separate nonlinear devices is not.
The reference is not manufacturer-calibrated noise, distortion or switching
data. See [equations, parameters and independent SPICE checks](https://github.com/JerryWiltz/nP/blob/master/developmentDocs/semiconductors/pinModels.md).

The older Skyworks selected-region equivalent remains available explicitly:

```js
nP.global.fList = [10e6, 100e6, 1e9, 2e9, 3e9];
var d1 = nP.PIN({model: 'SMP1307-011LF', region: 'forward', qPoint: {vd: .8}});
var response = d1.out('s21dB');
nP.lineChart({inputTable: [response], title: 'PIN diode at selected forward bias'});
```

PIN is a floating two-port: **1 anode, 2 cathode**. It accepts a name or a
complete supplied model record. Its own pin-diode.svg artwork is distinct
from ordinary D's symbol identity.

Select `region:'forward'` (default VD=.8 V) or `region:'reverse'` (default VD=0)
before analysis. External V/R networks determine current and rebuild each
placement's RF impedance within that region. A conflicting solved bias is an
error; this model does not switch regions automatically. For the named record,
RF uses 10 MHz–3 GHz and forward current 20 µA–100 mA, at fixed 300.15 K.
`ivTable()` returns VD/ID in V/A. `.smallSignal` reports RF R/C and the steady
stored-charge diagnostic. At 1 mA the intrinsic plus residual RF resistance is
82.2 Ω; at 10 mA, 10.2 Ω, before package effects.

This is the source's selected-bias linear RF equivalent, with an approximate
RF-resistance thermal-noise covariance. It supplies no carrier-storage
transient, automatic switching, calibrated noise or deterministic IM model;
IM requests reject explicitly. See [full parameter/default/package contract
and independent checks](https://github.com/JerryWiltz/nP/blob/master/developmentDocs/semiconductors/pinModels.md).

### Avalanche noise source

`NoiseDiode()` supplies the separate avalanche/drift equivalent circuit:

```js
nP.global.fList = [2e9, 10e9, 20e9, 40e9];
var nd1 = nP.NoiseDiode({model: 'NC406_REFERENCE'});
var noise = nd1.noiseTable();
nP.lineTable({inputTable: noise});
```

Ports are 1 anode, 2 cathode. This is a plot-derived research reference at
16.7 mA reverse current and 300 K, valid 2–40 GHz; it is not calibrated ENR.
The table contains Hz, ENR dB, available temperature K, available/delivered noise
dBm/Hz and source reflection magnitude. ENR defaults to an assumed 290 K cold
reference and 290 K normalization; there is no modeled off state.

Ground one terminal with `Short()` through `nodal()` to form a one-port source.
The covariance then propagates source noise and mismatch through the network.
The paper's Figure 6 includes a transition, so its fitted ENR is not imposed
on the diode-plane model. A discrepancy remains documented.

There is no DC I-V or deterministic nonlinear current/charge fit: `solveDC()`
and IM requests reject those missing models. The fixed RF/noise bias cannot
be rebuilt from an external bias network. Named or supplied compatible records
use the same path; a new record must provide core RF data and `noiseFit`, not
only a part name. Temperature must equal its reference temperature; no bias,
temperature or frequency extrapolation is supplied. See [parameters, fits,
equations and validation limits](https://github.com/JerryWiltz/nP/blob/master/developmentDocs/semiconductors/noiseDiodeModels.md).

### Zener record

```js
nP.global.fList = nP.global.fGen(1e6, 1e9, 51);
var d1 = nP.D({model: 'BZX384-B4V7', qPoint: {vd: -4.7}, temperature: 300.15});
var response = d1.out('s11dB', 's21dB');
nP.lineChart({inputTable: [response], title: 'Zener at VD = -4.7 V'});
nP.schematic(d1);
```

VD is anode minus cathode; current is negative in reverse breakdown. The
standalone default remains +0.6 V, so select reverse bias explicitly or let an
external supply/resistor network determine it before RF. Use
`d1.ivTable({vd:{start:-4.8,stop:-4.4,points:81}})` for a separate reverse
curve in V/A. Convert a display copy to mA if needed; the sweep does not move Q.

This is an archived NXP/Philips-attributed single-junction card. Its original
manufacturer-hosted model could not be retrieved. SPICE checks verify the
implemented equations; they do not certify measured-device behavior. The card
includes RS and depletion capacitance, with no explicit package L/C or fitted
breakdown temperature coefficient. Classical shot/thermal noise omits avalanche
excess noise. Direct weak IM does not calculate large-signal clipping or
rectified bias shifts. A supplied record works through the same path: choose
`schematicVariant:'zener'` and compatible BV/IBV/NBV parameters. See
[provenance and independent checks](https://github.com/JerryWiltz/nP/blob/master/developmentDocs/semiconductors/zenerModels.md).

### Schottky records

```js
nP.global.fList = nP.global.fGen(10e6, 3e9, 51);
var d1 = nP.D({model: 'SMS7630', qPoint: {vd: 0.05}, temperature: 300.15});
var curves = d1.ivTable({vd: {start: -0.1, stop: 0.35, points: 101}});
var response = d1.out('s11dB', 's21dB');
nP.lineChart({inputTable: [curves], metricPrefix: 'none'});
nP.lineChart({inputTable: [response], metricPrefix: 'giga'});
nP.schematic(d1);
```

Select `model: 'SMS7621'` for the other published card. Terminal order, units, curve methods and external-network bias handoff are the same as for 1N4148. Defaults remain VD=0.6 V and a 0–0.8 V curve; choose a lower bias explicitly for detector studies. Both Schottky records include the printed RS and select the canonical hooked-cathode symbol. They exclude package L/C, multi-junction package wiring and measured detector/noise fits. Small-signal RF and weak IM do not compute finite-power rectified detector output. See the [model sources and independent checks](https://github.com/JerryWiltz/nP/blob/master/developmentDocs/semiconductors/schottkyModels.md).

### Varactor record and C–V curves

```js
nP.global.fList = nP.global.fGen(10e6, 2e9, 51);

var d1 = nP.D({model: 'SMV1231-079LF', qPoint: {vd: -3}, temperature: 300.15});
var capacitance = d1.cvTable({vr: {start: 0, stop: 15, points: 31}});
var capacitancePf = capacitance.out('cjpF', 'ctpF');
var response = d1.out('s11dB', 's21dB');

nP.schematic(d1);
nP.lineChart({inputTable: [capacitancePf], metricPrefix: 'none',
    title: 'SMV1231-079LF C-V', xAxisTitle: 'Reverse voltage (V)', yAxisTitle: 'Capacitance (pF)'});
nP.lineChart({inputTable: [response], metricPrefix: 'giga', title: 'Varactor at VR = 3 V'});
```

This Skyworks record includes the fitted hyperabrupt junction, RS=2.5 Ω,
CP=.44 pF and SC-79 LS=.7 nH. The varactor symbol is selected automatically.
The package is LS in series with CP parallel to the RS-plus-junction branch.
DC shorts LS and opens CP; RF, noise and weak products include their loading.

`cvTable()` returns `[vr (V), cj (F), ct (F)]` after a header row. VR is positive
reverse voltage, so VD is negative. CJ is depletion capacitance; CT is effective
low-frequency terminal capacitance, including package effects. It defaults to
0–10 V with 201 points, accepts a nonnegative increasing VR interval, and does
not move the RF Q point or change I–V settings. The fitted C–V law covers 0–15 V;
the measured-data comparison has about 4.4% maximum deviation from typical CT.

Custom records work through `D({model: myModel})`. M can now be any finite
nonnegative value, including the logarithmic M=1 case. Optional
`packageParameters: {seriesInductance, parallelCapacitance}` uses H/F values,
both default zero. This supports the fixed package topology above, with unknown
keys and arbitrary L/C arrays rejected. Source links are never fetched.

D still defaults to VD=.6 V; select reverse bias explicitly or let an external
`V()` network set it. Classical noise/temperature laws and constant RS are not
measured varactor fits. Weak products do not model VCO oscillation, compression,
phase noise or rectified bias shifts. See the [model source and independent checks](https://github.com/JerryWiltz/nP/blob/master/developmentDocs/semiconductors/varactorModels.md).

## Legacy 1N4148 diode: RF and DC

`nP.diode1N4148()` returns a **two-port series diode**. Its default applied bias is **0 V**, and its temperature defaults to `nP.global.Temp`. A new global context uses 293 K. The RF response is the small-signal behavior around the selected bias; the I–V method uses the same device parameters.

```js
nP.global.fList = nP.global.fGen(100e6, 2.1e9, 101);

var diode = nP.diode1N4148({biasVoltage: 0});
var rfResponse = diode.out('s11dB', 's21dB');
var dcCurve = diode.ivTable(0, 0.8, 101);

nP.lineChart({
    inputTable: [rfResponse],
    title: '1N4148 RF response',
    metricPrefix: 'giga'
});
nP.lineChart({
    inputTable: dcCurve,
    title: '1N4148 forward I–V',
    metricPrefix: 'none',
    xAxisTitle: 'Voltage (V)',
    yAxisTitle: 'Current (A)'
});
```

`ivTable(start, stop, points)` returns a table headed `['vD', 'iD']`, with volts and amperes. If you omit those arguments, the sweep defaults to **−110 V through 1 V**, **401 points**. The default RF frequency list is the selected `nP.global.fList`; `fList` in the constructor options can override it.

### Legacy diode options and defaults

| Option | Default | Meaning |
| --- | ---: | --- |
| `is` | `2.75e-11` A | Saturation current. |
| `n` | `2` | Ideality factor. |
| `rs` | `0.568` Ω | Series resistance. |
| `cj0` | `4e-12` F | Zero-bias junction capacitance. |
| `vj` | `0.75` V | Junction potential. |
| `m` | `0.5` | Capacitance exponent. |
| `tt` | `4e-9` s | Transit time. |
| `leakageResistance` | `4e9` Ω | Parallel leakage resistance. |
| `breakdownVoltage` | `100` V | Reverse-breakdown magnitude. |
| `biasVoltage` | `0` V | Applied DC bias. |
| `temperatureK` | `nP.global.Temp` | Device temperature. |

The model also accepts `breakdownCurrent` (default **100 µA**), `breakdownSoftness` (default **2 V**), and `ivStart`, `ivStop`, `ivPoints` for the default displayed I–V sweep.

### Inspect the legacy bias point

The returned `.diode` metadata includes normalized parameters and the calculated bias point. This helps tie the RF response to the DC condition:

```js
var diode = nP.diode1N4148({biasVoltage: 0.5});
var biasCurrent = diode.diode.bias.current;
var dynamicResistance = diode.diode.bias.dynamicResistance;
var totalCapacitance = diode.diode.bias.totalCapacitance;

nP.log(biasCurrent);       // amperes
nP.log(dynamicResistance); // ohms
nP.log(totalCapacitance);  // farads
```

The diode also supplies noise covariance and weak-signal IM2, IM3, and second-harmonic sources when used in the corresponding analyses. Its RF model is linearized at one bias point; it does not simulate large-signal switching, compression, or transient charge storage. See [Noise](./noise.md#diode-noise) and [Intermodulation](./intermodulation.md#diode-intermodulation).

## JFET transistors

`NJF()` and `PJF()` return **1 gate, 2 drain, 3 source**. Defaults select onsemi **MMBF5457LT1** and **MMBFJ175LT1** silicon records. The shared SPICE level-1 model includes contact resistance, gate leakage and nonlinear junction charge.

```js
nP.global.fList = nP.global.fGen(1e6, 100e6, 51);
var q1 = nP.NJF({qPoint: {vgs: -1, vds: 10}});
var curves = q1.ivTable({vgs: {points: 3}, vds: {points: 21}});
nP.lineChart({inputTable: [curves], title: 'JFET drain curves', metricPrefix: 'none'});
```

The NJF Q point above is the default; PJF defaults to VGS=+1 V and VDS=−10 V. Options are `model`, `qPoint`, `bias`, `temperature` (K), `fList` (Hz). Curves return VDS in volts and signed drain current in amperes, without changing RF bias. All three JFET currents enter the device. Networks with `V()` solve external bias first, then rebuild RF, noise and weak nonlinear data per placement. Without a supply, the constructor Q point remains the RF bias.

The `commonSource` schematic board covers self-bias with a gate resistor, drain load, AC coupling, optional source bypass and optional supply bypass, for either polarity. NLEV=1 channel/flicker noise has an ohmic-region limitation; gate shot/induced noise and measured package/noise fitting are absent. Direct Taylor intermodulation omits quadratic remixing and large-signal effects. MESFET has Statz reference and NE760 family records; HEMT has a nominal Statz pHEMT die model; advanced MOS engines remain future work.

## MOSFET transistors

`NMOS()` selects Diodes [DMN55D0UT](https://www.diodes.com/spice/download/1842/DMN55D0UT.spice.txt); `PMOS()` selects [DMP58D0SV](https://www.diodes.com/spice/download/2329/DMP58D0SV.spice.txt), **one channel** of the dual part. Both use level-1 Shichman–Hodges equations with body effect, contact resistances and the records' body-junction/overlap charge.

The default `body: 'source'` gives ports **1 gate, 2 drain, 3 source**, tying body to external source. `body: 'external'` exposes **4 body**. This equation-level body option does not imply an accessible body pin on these packages.

```js
nP.global.fList = [10e6, 100e6];
var q1 = nP.NMOS({body: 'external', qPoint: {vgs: 1.5, vds: 5, vbs: -0.25}});
var short1 = nP.Short();
var network = nP.nodal(
    [q1, 1, 2, 3, 4],
    [short1, 3],
    [short1, 4],
    ['out', 1, 2]
);
var response = network.out('s21dB', 'NF21dB');
nP.lineTable({inputTable: [response]});
```

This uses a fixed Q point. An explicit V supply selects external network DC solving before RF. An unconnected insulated gate has undetermined DC bias; the solver reports it. A constructor Q point supplies no hidden DC source.

Options are `model`, `body`, `qPoint`, `bias`, `temperature` (K), `fList` (Hz). Default NMOS Q: VGS=1.5 V, VDS=5 V, VBS=0; PMOS: −2.6 V, −5 V, 0. Source-tied bodies reject nonzero VBS. `bias.vgs`/`bias.vds` accept {start,stop,points}; default VGS curves span 0 to +2 V or −3.1 V (5 curves), VDS 0 to ±5 V (101 points). `bias.vbs` is constant volts. `.ivTable({vgs,vds,vbs})` returns terminal volts versus signed amperes without moving RF bias. All public terminal currents enter the device; three-port IS includes its body return.

The `commonSource` board supports three-terminal MOSFET divider bias, source resistance with split/combined/no bypass, optional supply bypass and both rail orders. Standalone four-terminal symbols work; an independent-body amplifier board remains future work.

These records omit TOX, so inversion/Meyer charge is absent. Classical channel/contact thermal noise is approximate, with no fitted 1/f term (KF defaults to zero), body shot or induced gate noise. No avalanche, ESD clamp, package L/C, self-heating, BSIM/EKV or large-signal switching behavior is claimed. Direct Taylor IM2/IM3 omits quadratic remixing and compression.

## MESFET transistors

`MESFET()` returns **1 gate, 2 drain, 3 source**, using N-channel Statz/MES1.
The default **SPICE3_REFERENCE** is a numerical example profile, not a commercial
fit. **NE760** selects the NEC-family Statz card published in
[Intusoft's IsSpice4 User's Guide, pp. 193–194](http://www.intusoft.com/lit/IsSpice4.pdf).
It includes RD=5.45 ohms and RS=4.88 ohms, without a package suffix or lead L/C.
It is not a manufacturer-certified fit. Both records retain default Q point
VGS=−0.5 V, VDS=2 V. Gate/drain curves use the JFET interval API: gate 0 to
VTO (−2 V reference, −1 V NE760) in 5 curves; drain 0…3 V in 101 points.

```js
nP.global.fList = [10e6, 100e6, 1e9];
var q1 = nP.MESFET({model: 'NE760'});
var short1 = nP.Short();
var network = nP.nodal(
    [q1, 1, 2, 3],
    [short1, 3],
    ['out', 1, 2]
);
var response = network.out('s21dB', 'NF21dB');
nP.lineTable({inputTable: [response]});
```

Supply-driven networks solve DC before RF using contacts and Schottky gate
currents. Voltage-dependent gate capacitances preserve MES1's differential
branch partition. Classical channel/contact noise and direct weak Taylor
products are approximate. Electrical temperature stays fixed at 300.15 K;
selected temperature changes thermal noise only. There is no fitted microwave
noise, package L/C, trapping, dispersion, self-heating or P-channel profile.
NE760 was checked against independent ngspice DC,
all nine S entries and classical noise, not measured hardware performance.
The source card's FC=.2 is preserved as metadata; Berkeley MES1 uses a fixed
0.5 V charge continuation. A 5 V, 150 ohm drain/47 ohm source self-biased stage
solves to about 12.95 mA before RF analysis.

## HEMT/pHEMT transistors

HEMT() returns gate/drain/source ports 1/2/3. Its first model,
**ATF35143_DIE**, adapts the [manufacturer's Statz die record](https://sites.units.it/carrato/didatt/corsi_old/E2_web/modulo_carrato/doc/datasheet_discreti/HEMT_ATF35143.pdf),
at nominal electrical temperature 300.15 K. It includes die parasitics and
correlated gate/drain noise, with distinct static Qgs/Qgd charge partitioning.
Select `model: 'ATF35143'` for the p.16 SC-70 package network with both external
source pins joined at port 3; all three source bonds remain internal.
ATF35143_DIE stays the default. The nominal package model is intended for
0.1–6 GHz; test-board vias are excluded.

```js
nP.global.fList = [100e6, 1e9, 3e9];
var q1 = nP.HEMT({model: 'ATF35143', qPoint: {vgs: -0.6, vds: 2}});
var short1 = nP.Short();
var network = nP.nodal(
    [q1, 1, 2, 3],
    [short1, 3],
    ['out', 1, 2]
);
var response = network.out('s21dB', 'NF21dB');
nP.lineTable({inputTable: [response]});
```

Default gate curves span 0…−0.95 V in 5 curves; drain curves span 0…3 V in
101 points. ivTable() returns V/A rows without moving the RF Q point.
Networks with V() solve external bias through gate/drain/source resistances
before RF/noise reconstruction. RF requires positive frequencies, positive
intrinsic VDS and gm>0; DC curves may include cutoff. Temperature scales noise
only. The current implementation omits electrical temperature scaling, trapping,
self-heating, avalanche and large-signal behavior. Calculated die NF is not a
packaged-device datasheet guarantee.

The packaged model agrees numerically with independent SPICE. Comparing with
the manufacturer's measured 2 V/15 mA table gives maximum S21 magnitude and
phase differences of about 2.1 dB and 28° over 0.5–6 GHz. The measured fixture
includes source vias beyond the package model. This adaptation is not a close
measured-data fit; no parameters were adjusted to force agreement.
