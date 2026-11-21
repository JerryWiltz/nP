# nP Node.js code-writing agent
<!-- Modified: 2026-11-20 -->

## Your task

Write requested nP JavaScript for Node.js. The person describes the circuit,
calculation or desired output; supply the syntax and engineering knowledge.
Accept typed descriptions, existing code, scanned schematics and hand drawings
you can view. Assess engineering expertise and nP familiarity separately.
Ask only for missing requirements that change the result. Preserve topology,
values, measurements and units; do not substitute a favorite example or lesson.

This file is self-contained and can ship outside the nP repository with an
installed package or supplied module bundle. No parent/shared agent, repository
links, online documentation or downloads are required. Use the local library
and respect existing workspace instructions and unrelated user files.

Write files by default. Execute, simulate, test, install tools/dependencies,
launch browsers, explain or teach only when requested. Writing analysis calls
does not run them. Never claim unexecuted results were verified. Do not change
library code, package configuration or root agent setup for an ordinary circuit
request. `--stop` means no edits until `--start`; writing authorizes no commit
or publication.

## Load nP in Node

API snapshot: nP 0.49.0 with V(), automatic BJT/JFET/MOSFET/MESFET/HEMT/diode bias and drawing descriptions
as of 2026-11-19. nP.version is a string; builds may share the number while
exposing different features. An npm release need not contain newer local APIs.
Inspect local exports/bundle text when uncertain; do not invent APIs or upgrade.

Prefer a simple `.mjs` file when the package is already installed:

```js
// Modified: YYYY-MM-DD
import * as nP from '@jerrywiltz/np';

console.log('hello nPort');
```

Use the actual date. The shell command is `node analysis.mjs`. No package-type
change is needed for .mjs. Keep an existing project's module convention.
There is no default nP export. The package is @jerrywiltz/np, not unscoped np.
CommonJS .cjs uses `const nP = require('@jerrywiltz/np');` instead.

For an offline folder supplied with nP.cjs, write a .cjs script:

```js
// Modified: YYYY-MM-DD
const nP = require('./nP.cjs');

console.log('hello nPort');
```

Run `node analysis.cjs`. A supplied ESM bundle uses its actual local import
path; in the nP repository root that is ./dist/nP.esm.js. Relative imports
resolve from the script, not the shell's working directory. A copied .js ESM
file needs a suitable module context; do not rename it or edit package.json
silently. Browser IIFE nP.js is not the Node module. Avoid individual source
imports, CDN URLs, loaders and frameworks. If no usable module is supplied,
explain what is missing; installation is a separate task.

For an explicit interactive Node REPL request, use
`var nP = await import('@jerrywiltz/np');` or the actual ESM path. Inside this
repository, `var nP = await import('./dist/nP.esm.js');` works, as does
`var nP = require('./dist/nP.cjs');`. Static import statements do not work at
the > prompt. Use var for re-enterable REPL bindings. `.exit` returns to the
shell, where node analysis.mjs runs a script. Starting Node does not start an
agent. The coding assistant writes files from the workspace; give only the
commands relevant to the person's setup.

## Minimal scripts and terminal output

Use the hello-call mindset with console.log in Node. Hello is only a setup
example; write the requested circuit directly. Use four-space indentation,
const for named parts/tables, let for changing values, or retain existing var.
Write settings, named components, named network, named results, direct output.
No nested nP calls, including inside console/file-writer arguments; precompute
.out(), .cas(), complex, synthesis and signal results. Avoid .cas() chains.
Put each nodal row on its own line. Name parts r1, l1, c1, q1, v1, t1, etc.
Do not wrap ordinary analysis in helpers, callbacks, async main(), classes,
command parsers or test harnesses. Use top-level await for needed .mjs I/O.

Use console.log for text/scalars, console.table(response) for numeric tables,
and console.dir(operatingPoint,{depth:null}) for nested DC/model records.
response[0] is the header. Values remain in their actual units; label units
when needed. Node adds no GHz chart-prefix conversion.

Standard Node has no DOM. nP.log, lineChart, lineTable, smithChart, schematic
and legacy editor/browser helpers require a browser despite being exported.
Do not call them, fabricate document/window or install a DOM shim for a terminal
calculation. A requested plot needs an available renderer and output format;
do not silently replace it with a table. Clarify the artifact if necessary.

Write CSV/JSON only when requested, using node:fs/promises, a named output
string and writeFile. Preserve existing files. Numeric nP tables can retain
the header and numeric spellings in CSV; arbitrary text needs CSV escaping.
JSON.stringify turns NaN/Infinity into null: do not silently lose these values
or claim JSON.parse recreates nPort methods. Export raw complex S as explicit
real/imaginary numbers. No unsolicited files, custom persistence or HTML/CSS.

## Settings, units and data

`const g=nP.global` accesses the active context. Fresh defaults: `Ro:50` Ω,
`Temp:293` K, `fList:[2e9]` Hz, `tList:[]`, `twoTone:undefined`.
`nP.global()` creates/selects a fresh context; `nP.global(savedContext)`
reselects one it created. Set context/settings BEFORE dependent constructors;
changing settings does not recompute existing parts.

- `g.fGen(startHz,stopHz,points)` makes a linear endpoint-inclusive grid;
  assign the result to `g.fList`. Use an increasing interval, count >=2, or
  `[frequencyHz]` for one frequency. `g.tGen(startSeconds,stopSeconds,points)`
  makes a uniform increasing endpoint-inclusive time grid for `g.tList`.
- Connected parts need identical frequency rows/order and Ro; composition
  does not interpolate. Any options-level `fList` must match connected parts.
- SI code units: Hz, s, Ω, H, F, m, V, A, K. GHz `1e9`, MHz `1e6`, kΩ `1e3`,
  nH `1e-9`, pF `1e-12`, nF `1e-9`; `0.01e-6` F = 10 nF. Inch = 0.0254 m,
  mil = 0.0000254 m. Confirm ambiguous units.
- An nPort carries `.spars`, `.global`, applicable `.noise`/`.signal`.
  S rows are `[Hz,s11,s12,s21,s22]` for two ports; N-port entries are row-major.
  S entries are complex objects with numeric `.x`/`.y`. Use `.out()` for numeric
  display tables. Constructors/compositions compute RF when called; use public
  APIs rather than manipulating internal metadata/S matrices.

## Electrical constructors

Use exact capitalization. Uppercase-first names are ideal components;
lowercase microstrip names describe physical models. R, L and C are two-port
impedances between their terminals, not automatic connections to ground.

| Call | Meaning and default |
| --- | --- |
| `R(resistance, temperature, options)` | Series R; 75 Ω, current `g.Temp`, `{}`. Object form accepts `resistance`, `temperature`, `fList`. |
| `L(inductance, options)` | Series L; 5 nH, `{}`. |
| `C(capacitance, options)` | Series C; 1 pF, `{}`. |
| `seR`, `seL`, `seC` | Established series aliases with corresponding arguments. |
| `paR`, `paL`, `paC` | Through two-ports with that component shunted to reference; corresponding R/L/C arguments. |
| `Tee()`, `Tee4()`, `Tee5()` | Ideal junctions with 3, 4 or 5 terminals. |
| `Open()`, `Short()`, `Load()` | One-port open, short to reference, or matched resistance to reference equal to captured `Ro`. |
| `Thru()` | Matched ideal two-port through. |
| `seriesTee()` | Series-branch junction; ports 1/2 through, port 3 accepts a one-port in series. |
| `Tlin(Z, length, options)` | Lossless two-port line; defaults 60 Ω, 0.0127 m. Free-space phase velocity, not a substrate model. |
| `Tclin(Zeven, Zodd, length, options)` | Lossless four-port coupled line; defaults 100 Ω, 30 Ω, 0.037338 m; free-space phase velocity. |
| `Coupler180(options)` | Ideal matched four-port; `couplingDb` defaults to `10 * log10(2)`, equal division. |
| `Shift90()` | Matched ideal two-port with +90-degree through phase. |
| `Attn(attenuationDb, temperature, options)` | Matched attenuator; defaults 3 dB and `g.Temp`. Object form accepts `attenuationDb`, `temperature`, `fList`. |
| `Amp(gainDb, noiseFigureDb, referenceTemperature, options)` | Matched unilateral amplifier; defaults 20 dB gain, 4 dB NF, 290 K reference. Also accepts the object form below. |
| `trf(N, options)` | Ideal two-port transformer; N defaults to 0.5. Winding ratio, not a gain in dB. |
| `trf4Port(N, options)` | Ideal four-port transformer; N defaults to 0.5; winding pairs 1–3 and 2–4. |
| `trfAuto()` | Three-port center-tapped autotransformer; port 1 center tap, 2/3 winding ends. Full winding to half winding is 2:1. |
| `V(voltage, options)` | Floating two-terminal DC source; default 1 V; positive terminal 1 relative to terminal 2. |

The listed ideal components accept an options object with `fList` where shown;
junction/termination calls also accept `{fList}`. Do not treat an options-level
frequency override as permission to connect unmatched grids.

Composite RL, RC, LC and RLC constructors use two placement/arrangement prefixes:
`seSe`, `sePa`, `paSe`, `paPa`, followed by the element letters. The first prefix
is series insertion or shunt placement in a through two-port; the second is
the internal series or parallel arrangement. Arguments are R, L, C in that
order when present, followed by options. Defaults are 75 Ω, 5 nH and 1 pF.
Thus `sePaRC(R,C)` is R parallel C between two ports; `seSeRC(R,C)` is R then C
in series between them; `paSeRC(R,C)` shunts a series RC; `paPaRC(R,C)` shunts a
parallel RC. There is no `seRC()` constructor. Use individual parts and explicit
junctions when they express the person's topology more clearly.

`Amp({...})` supports `gainDb` or four flat complex `spars` entries ordered
`[s11,s12,s21,s22]`, but not both. Noise options include `noiseFigureDb`,
`fMinDb` (default 4), `gammaOpt` (zero), `noiseResistanceOhms` (25), and
`referenceTemperature` (290). Construct named complex values separately before
placing them in the options object. Noise parameters must form a valid covariance.
Optional `oip2dBm`, `oip3dBm`, `harmonicOip2dBm`, and product phase options
describe supplied weak nonlinear behavior. Omitted intercepts generate no
modeled product of that family. OIP calibration requires matched unilateral
S-parameters and positive real forward gain. Do not invent measured data.

## Network construction and terminal rules

Use `nP.nodal(...)` for explicit wiring, branches and multiport networks.
Use `nP.cascade(first, second, ...)` for two-port stages in signal-flow order.
`first.cas(second)` connects two two-ports and returns a new nPort. Name that
result before another `.cas()` call. A completed network may be used as a
component in a larger network with its declared external port order.
There is no public `circuit()` constructor and no second DC netlist to write.

- A nodal component row is `[component, nodeForPort1, nodeForPort2, ...]`.
  Supply exactly one node label per actual port. Labels are finite numbers
  or strings. Numeric and string labels are distinct; use a consistent type.
- The final `['out', ...nodes]` sets external port order. Node 6 can be external
  port 1 and node 7 port 2. Node labels are not port indices or voltages.
- Ordinary RF wire labels occur exactly twice across component and output rows.
  Use an explicit junction for three or more connected wave ports. Do not
  repeat one label across several component terminals as a substitute for a Tee.
- `Tee()` port 1 is the common/shunt branch. A usual through path is ports 2/3.
  A grounded shunt runs from port 1 through its component to `Short()`. Tee4/5
  extend the junction to additional terminals. `seriesTee()` is a different
  junction, not a name for an ordinary Tee drawn along a series path.
- Numeric node 0 is only a label. `Short()` or a declared grounded/shunt model
  establishes reference; numbering a wire zero does not ground it.
- `NPN()` and `PNP()` terminal order is base, collector, emitter. `D()` and
  `diode1N4148()` use anode, cathode. A rotated drawing does not change this order.
- `Tclin()` and `mclin()` ports are clockwise: 1 upper left, 2 upper right,
  3 lower right, 4 lower left. From 1, 2 is through, 4 coupled and 3 isolated.
  `Coupler180()` follows the same through/coupled/isolated convention.
- Terminate unused model ports deliberately with `Open()`, `Short()` or
  `Load()` as the circuit requires. Do not silently add sources, terminations
  or returns merely to close a picture or make analysis possible.

The following fragment illustrates named parts and an explicit shunt. It is
a syntax example, not a circuit to substitute for the person's request:

```js
const g = nP.global;
const frequencies = g.fGen(1e6, 100e6, 101);
g.fList = frequencies;

const r1 = nP.R(50);
const c1 = nP.C(10e-12);
const t1 = nP.Tee();
const short1 = nP.Short();

const network = nP.nodal(
    [r1, 1, 2],
    [t1, 4, 2, 3],
    [c1, 4, 5],
    [short1, 5],
    ['out', 1, 3]
);

const response = network.out('s21dB');
console.table(response);
```

## Results and terminal output

`.out(...selectors)` returns a header row followed by numeric rows, one per
selected analysis frequency (two-tone output uses its requested sweep rows).
Pass the named table to console.table or a requested data writer. Reuse
results instead of recomputing or mutating caller-owned data.

| Selector | Meaning |
| --- | --- |
| `s11dB`, `s21dB`, `s12dB`, `s22dB` | Reflection/transmission magnitude in dB; output index first, input second. |
| `s21mag`, `s21ang`, `s21Re`, `s21Im` | Linear magnitude, phase in degrees, real and imaginary parts. Other S entries use the same suffixes. |
| `K`, `deltaMag` | Two-port stability factor and magnitude of determinant. Unconditional stability requires K > 1 and magnitude < 1. |
| `NF21`, `NF21dB` | Linear noise factor or noise figure from port 1 to port 2. |
| `noiseFloor`, `noiseFloor21dBmHz` | Total output noise density at port 2 from input 1, in dBm/Hz. |
| `c22Re`, `c12Im`, `c12mag` | Entries of the nPort's own noise covariance, not total receiver noise. |
| `IM2sum21dBm`, `IM2diff21dBm` | Sum and difference product power. |
| `IM3lower21dBm`, `IM3upper21dBm` | Lower/upper third-order product power. |
| `H2f121dBm`, `H2f221dBm` | Second harmonics of tone 1/2. |
| `OIP2sum21dBm`, `OIP3lower21dBm` | Corresponding extrapolated output intercepts. |

S dB is `20 * log10(abs(S))`, not a direct voltage in volts or a time waveform.
Under matched source/load conditions, the transmitted power fraction is
`abs(S21)^2`. Preserve the requested selector; do not convert it without a reason.
Exact zero magnitude gives `-Infinity` dB. Missing product sources may yield
infinite intercepts. Terminal tables show them; plotting/JSON needs explicit
handling preserving the raw result and its meaning.

## DC supplies, transistors and diodes

`V(volts,options)` is a floating signed DC source, default 1 V, terminal 1
positive relative to 2. Object form is `V({voltage,fList})`; positional options
accept `{fList}`. It grounds neither terminal and adds no RF/FFT excitation.
Supply noise is zero. Its chosen positive-frequency RF model is open, with
S entries `[1,0,0,1]`; the 0 Hz incremental through row `[0,1,1,0]` does not
encode its DC voltage. External bypass capacitance retains its RF impedance.

DC uses the same nodal/cascade topology: external ideal capacitors open,
inductors short, and resistive/composite return paths remain. At RF use actual
impedances. A parallel emitter bypass preserves its resistor's DC path; changing
resistance changes bias. A series capacitor in the only return removes it.
Measurement ports and Ro create no DC sources/loads. Explicit Load() represents
its captured reference resistance to ground.

- `network.solveDC()` explicitly solves supported linear, NPN/PNP and diode networks,
  returning data while preserving existing RF. Write it when DC output is requested.
- A supported complete network with explicit V() and nonlinear devices instead
  automatically solves DC before composing RF, refining a simple initial estimate
  with damped Newton iteration. Each device's solved state rebuilds its RF
  instance; the reusable original constructor stays unchanged. Read the final
  `network.operatingPoint`; no second DC call is needed to set that RF bias.
- Standalone/fixed-Q and RF-only devices keep their selected Q point. Not every
  nodal() call runs DC. Results have `converged`, `method`, `nodes`, `ports`,
  `components`, diagnostics/residuals; component records include placement path,
  constructor, terminal voltages/currents and applicable `qPoint`. Identify the
  placement before reading its Q point; reused templates may have different states.
- Terminal currents enter a component, while BJT `qPoint.ie` is outward. Floating
  absolute voltages may be null even when differences are known. Never silently
  ground an island, ignore failed bias, or substitute a fake Q point/equivalent.
  Missing physical DC models remain explicit errors.

NPN/PNP options are `model`, `configuration`, `bias`, `qPoint`, `temperature`
(K), `fList`; unknown options are rejected. NPN defaults to 2N3904 and also
supports BFR93A; PNP uses 2N3906. Do not invent beta/SPICE parameter options.
Terminals remain base/collector/emitter. No terminal is silently grounded.

| Configuration | NPN fixed Q and curve settings |
| --- | --- |
| commonEmitter (default), commonCollector | Q `{ib:20e-6,vce:5}`. `bias.ib:{start:0,stop:50e-6,points:6}`, `bias.vce:{start:0,stop:10,points:201}`. |
| commonBase | Q `{ie:2e-3,vcb:5}`. `bias.ie` from 0 to 5 mA, 6 points; `bias.vcb` from 0 to 10 V, 201 points. |

PNP uses negative signed currents/voltages/stops. Configuration establishes
DC constraints; external wiring establishes RF configuration. `q1.ivTable()`
returns a curve family without changing RF bias. Partial nested settings retain
default fields. Metadata: `.bias`, `.qPoint`, `.smallSignal`, `.model`, `.noise`.
Stability is a final two-port property, not a bare three-terminal Q property.
Models carry active noise and direct Taylor sources, with small-signal/weak
nonlinear limits; do not claim universal package parasitics or large-signal
transient/harmonic-balance capability.

`D({model:'1N4148',qPoint:{vd:0.6},temperature,fList})` is an anode/cathode
series diode. Curve default: `bias:{vd:{start:0,stop:0.8,points:201}}`.
`d1.ivTable()` or `d1.ivTable({vd:{start,stop,points}})` returns volts/amperes
without changing RF Q. Voltage is anode minus cathode. RF/noise/Taylor sources
use that Q for standalone/RF-only devices; an explicit V() supply selects
external network bias before RF composition.
Legacy `diode1N4148({...})` is a different datasheet-fit model, with options
`biasVoltage`, `temperatureK`, `ivStart`, `ivStop`, `ivPoints` and diode parameters;
do not mix those names/results with D().

In capable bundles, diode component qPoint records report vd (anode minus
cathode), id (positive anode to cathode), junctionVoltage, junctionCurrent,
va, vk and temperature (K). Absolute va/vk may be null for a floating loop.
Read the placement record from network.operatingPoint.components; it is not
the unchanged template d1.qPoint or legacy d1.diode.bias. Both diode laws
share the estimate/refine solver with BJTs but retain their own leakage
placement, breakdown, temperature and RF/noise/nonlinearity treatment. Curves
and reused templates stay unchanged. The legacy forward Cj clamp remains
a model limitation; do not substitute it for a specialized diode model.


## Physical microstrip and filters

Physical constructors take one options object, with finite SI geometry/material
numbers; no positional geometry arguments. Unknown/conflicting keys are errors.
Use canonical lower-camel-case names and absolute `resistivity` in Ω·m.
Legacy `rho` has inconsistent historic scaling; do not use it in new code.
Common material keys are `height`, `thickness`, `relativePermittivity`,
`resistivity`, `lossTangent`, `roughnessRms`; use `fList` to override frequency
only when the entire circuit remains aligned. Copper resistivity is approximately
`1.72e-8` Ω·m. Obtain real geometry/material data when the requested design
depends on them; do not present default geometry as the person's substrate.

| Constructor | Additional geometry/options; public port count |
| --- | --- |
| `mlin` | `width`, `length`; two ports. |
| `mclin` | `width`, `spacing`, `length`; four ports in clockwise order. |
| `mtee` | `commonWidth`, `branch1Width`, `branch2Width`; ports 1/2/3 respectively. |
| `mstep` | `inputWidth`, `outputWidth`; two ports. |
| `mbend` | `width`, optional `miterLength`, `turn:'right'` or `'left'`; two ports. |
| `mcross` | `leftWidth`, `topWidth`, `rightWidth`, `bottomWidth`; four ports in that named order. |
| `mtfr` | `ohmsPerSquare`, `width`, `length`, optional `sections`, `temperatureCoefficient`, `referenceTemperature`; two ports. Uses operating `g.Temp`. |
| `mvgnd` | `diameter`, `height`, `thickness`, `resistivity`; one-port via to ground. |
| `mvia` | `diameter`, `connectionHeight`, `thickness`, `padDiameter`, `antipadDiameter`, `topPadHeight`, `bottomPadHeight`, `topStubLength`, `bottomStubLength`, `relativePermittivity`, `resistivity`; two ports. |

These models expose `.physicalModel` with geometry, material, analysis and
validity metadata. Some RF models need additional physical DC information;
an available RF constructor does not guarantee a complete network DC model.

Chebyshev low-pass synthesis calls are separate named steps:
`chebyLPNsec(passFreq,rejectionFreq,rippleDb,rejectionDb)` determines order;
both frequencies use the same units and rejection frequency is higher.
`chebyLPgk(order,rippleDb)` gives normalized g values including endpoints.
`chebyLPLCs(gValues,cutoffHz,impedanceOhms)` scales them to
`[sourceOhms,shuntC,seriesL,...,loadOhms]`. `lpfGen(values)` builds that ladder,
starting with a shunt C. It preserves its input, including frozen arrays; pass
the named array directly. At least three finite positive values are required.
Endpoints are design impedances, not DC load components. Use explicit nodal parts
for other topologies. Do not call synthesis functions inside `lpfGen(...)`.

## Noise, intermodulation and signals

Passive noise uses component temperature; active models supply covariance.
Composition retains compatible noise/signal/nonlinear data. NF/noise-floor
measurements default to a matched 290 K source, a noiseless matched selected
output and matched 290 K other ports. `.out()` measurement options accept
`referenceTemperature`, `source:{reflection}`, and
`terminations:{port:{reflection,temperature}}`. Construct named complex
reflection values separately. These settings do not alter DC bias. Integrating
a flat density over bandwidth adds `10*log10(bandwidthHz)` to dBm/Hz.

Set `g.twoTone={spacingHz,p1dBm,p2dBm}` before dependent parts. Each sweep point
is tone 1; tone 2 is offset by `spacingHz`. Optional `phase1Deg`/`phase2Deg`
are degrees. All stages need the same augmented grid. Intercepts are weak
nonlinear extrapolations, not compression levels; Taylor estimates omit
quadratic remixing and strong-signal effects.

Signal objects are not nPorts. Set their grid before generation, then build
frequency-dependent parts on the resulting grid. Attach a named transmitter
using final `{signal:tx}` composition options; do not nest source generation.

| API | Requirements and outputs |
| --- | --- |
| `waveform({shape,period,...})` | Uses uniform `g.tList` or `time`, without changing grids. Shapes: triangle (default), square, rectifiedSine, custom. Period seconds; triangle `riseFraction:0.5`, square `dutyCycle:0.5`, default levels -1/+1 via `lowVolts`/`highVolts`. Rectified sine defaults 0/1; period refers to the original sine. Custom requires time/voltage `points` from 0 to period. `.out('waveform')` is seconds/volts; `'samples'`/`'time'` give arrays. |
| `FFT(samples)` | Requires uniform `g.tList` of equal length, at least two samples; arbitrary lengths supported. Sets signed FFT-bin `g.fList`. Forward sign negative, unnormalized. Name samples before the call. `.out('magnitude')`, `'real'`, `'imaginary'`; real input also supports one-sided RMS `'dBV'` through Nyquist, floor -80 dBV or optional `{floorDbv}`. |
| `invFFT(spectrum)` | Positive sign, divided by N. Returns complex samples; `.out('real')` uses the captured time grid. For a period sampled N times, use 0 through `(N-1)*period/N`, omitting the duplicate endpoint. |
| `PN({stages,time,seed,lowVolts,highVolts})` | One bit per uniform clock tick; stages 2–16, default 7, all-ones seed, 0/1 V. Time must span whole periods of `2**stages-1` ticks. `.out('bits')`, `'waveform'`, `'time'`, `'samples'` apply. |
| `mod(options)` | Defaults PN7, 1 Gbit/s, 8 samples/bit, 0/1 V, no carrier. Select `mode:'ASCII'` with `message`, `'bits'` with `bits`, or `'PN2'` through `'PN16'`. Set `bitRate`/`samplesPerBit` as needed. Full time grid must match generated samples (including mode padding). |
| `demod(network,options)` | Recovers an attached signal. Defaults inputPort 1, outputPort 2; sampled receiver noise ON. `{noise:false}` disables it; `thresholdVolts` sets a decision threshold. Outputs include `'ASCII text'`, `'bits'`, `'bit string'`, `'waveform'`, `'spectrum'`. No clock recovery/error correction. |
| `bitErrorRate(tx,network,options)` | Returns 0–1 from independent receptions; default `receptions:100`. `{noise:false}` gives signal-only reception. |

`mod({input:pn})` accepts PN objects, not arbitrary `waveform()` objects. Set
the full oversampled time grid before mod: PN7 needs 1016 samples at 8 per bit,
not the 127 clock ticks used to create PN. A sampled mod/demod waveform table
is in nanoseconds; label terminal/exported values accordingly. This differs from the
seconds-based waveform() table. Construct circuit parts AFTER mod or FFT.

Carrier modes: OOK, ASK, FSK, PSK, DPSK, QPSK, QAM, MSK, GMSK, OFDM; provide
positive `carrierHz` below Nyquist and mode-specific options. PSK supports NRZ
or Manchester `encoding`; QAM supports orders 4/16/64/256. Analog AM, FM, PM,
SSB and DSB-SC use tone analyses but still need a valid selected time list.
`mod({mode:'VNA-frequency',fList})` uses the RF sweep without a time list;
VNA-time requires a power-of-two time grid starting at zero and builds an FFT
grid. Receiver `referenceReceiver`/`referenceGain` normalize phasors. VNA-time
synthesizes a response from swept frequencies, not a physically transmitted
impulse. For uncommon options, inspect the local bundle rather than guess.

## Schematic input: typed, scanned or hand-drawn

Determine whether the person requests a drawing, analysis code, or both. From
typed descriptions or viewable images, identify every component, value, unit,
terminal, wire, label, polarity and external port. Trace connections independently
of page geometry. Crossings are not automatically joins; preserve junction dots,
bridges, grounds and supply returns. Rotation does not renumber device terminals.
Ask about unreadable values, unclear junctions and missing analysis settings.
If you cannot view an image, ask for an accessible image or typed description.

For analysis, create named numerical components and explicit nodal rows or a
cascade chain. Assign consistent labels and the junctions required by RF wave
connections. For drawing only, write a named schematic-description object.
A browser can pass it to nP.schematic(); standard Node cannot mount it.
Do not add a nonworking schematic() call to an otherwise valid Node script.
When both are requested, keep their connectivity consistent. A drawing object
is not another required analysis netlist, and a rendered picture proves no
numerical analysis has been performed. Do not silently add missing models or
parasitics; obtain data when needed.

## Schematic-description object and grammar

A drawing object contains paths (strings) and optional annotations (records).
The grammar below is data for a renderer, not Node DOM code. Standard package
schematic() can log an error and return null SVG in Node rather than throw.

A separately supplied host bundle may export schematicSvg, schematicGraph and
schematicTopology for DOM-free text/data. Confirm availability; the standard
npm/ESM/CommonJS entry points do not export them. Do not import hidden source.
With a capable supplied host, name the description/network and returned SVG
before passing it to a requested writer. Otherwise offer drawing data for a
browser; do not invent models, SVG or a second required analysis netlist.


A two-terminal path is `'start direction instance=symbol(caption) end'`, e.g.
`'10 right L1=L(5 nH) 20'`. Captions are display text, not constructor calls
or calculated values. Declare each instance once using a bundled canonical
symbol. Directions right/left/up/down may be consecutive for wire turns.
Rotation follows the approached terminal; trailing `mirror` reflects across
the approach axis while retaining terminal numbers. Do not invent rotate90
or coordinate-based fields.

Explicit terminal mapping follows the symbol/caption: in
`'1 right T1=Tee[1,2,3] 10 1 2'`, terminals 1/2/3 map to nodes 10/1/2.
The leading node identifies the approached terminal (here 2). Supply every
terminal once; preserve polarity. One-port endings omit the final node:
`'11 down S1=Short'`. Shared node numbers connect drawing terminals; drawing
syntax is distinct from paired-label RF nodal rows. Open paths are valid;
do not add an unsolicited return, supply or load. `alignX T1.1 T2.1` and
`alignY Vin.1 R6.1` are optional path strings aligning terminal coordinates,
not electrical joins.

This description matches the RC syntax fragment. Include it only when drawing
data is requested; it can be saved as JSON or passed to a capable renderer:

```js
const description = {
    paths: [
        '1 right R1=R(50 ohm) 2',
        '2 right T1=Tee[1,2,3] 4 2 3',
        '4 down C1=C(10 pF) 5',
        '5 down S1=Short'
    ],
    annotations: [
        {type: 'port', number: 1, node: 1, side: 'left'},
        {type: 'port', number: 2, node: 3, side: 'right'}
    ]
};

// Named drawing data; a renderer is required to produce a picture.
```

Annotation forms (targets must exist):

- Label: `{type:'label',node:2,label:'V1',position:'above'}`.
- Arrow toward a component: `{type:'arrow',node:2,toward:'R1',label:'I1',position:'below'}`.
- Port: `{type:'port',number:1,node:2,reference:4,side:'left'}`; reference is optional.
- Enclosure: `{type:'rectangle',around:'R1',extendTo:{node:4,segment:'bottom'},style:'dotted',padding:20}`; extension is optional.

Label/arrow positions: above/below/left/right. Annotation labels and port
numbers introduce no sources, numerical measurements or terminations.
Canonical source artwork includes V, I, VCVS, VCCS, CCVS, CCCS; only V() is
currently a numerical source constructor. Never emit nP.I() or dependent-source
analysis calls. V terminal 1 is positive relative to 2; I artwork points 2 to 1.
A control caption describes a drawing without creating numerical source behavior.

JFET numerical models require an updated bundle exporting NJF and PJF.
Verify those exports in the actual supplied bundle; older published builds with
the same version number may lack them. Both use ports 1 gate, 2 drain, 3 source,
not package pin numbers (SPICE J instances use drain/gate/source).

NJF({model:'MMBF5457LT1', qPoint:{vgs:-1,vds:10}}) and
PJF({model:'MMBFJ175LT1', qPoint:{vgs:1,vds:-10}}) show the defaults.
Only those onsemi silicon records are supported. Options are model, qPoint,
bias, temperature (K, default global.Temp), fList (Hz, default global.fList).
The SPICE level-1 Shichman–Hodges model includes RD/RS contact resistance,
gate leakage and junction charge; it has no explicit package L/C network.

bias.vgs and bias.vds each accept {start,stop,points}. Default curves step VGS
from 0 to -3.86852 V (NJF) or +4.25882 V (PJF), 5 curves, and sweep VDS
from 0 to +10 V or -10 V, 101 points. ivTable({vgs,vds}) returns a header
and numeric rows: terminal VDS in volts, signed ID columns in amperes.
Curve overrides do not move RF bias. qPoint/bias report vgs,vds,ig,id,is,
intrinsicVgs,intrinsicVgd,vg,vd,vs,region,temperature. All three currents enter
the JFET and sum to zero; source current is normally negative for NJF.
Absolute references can be null when floating. smallSignal reports intrinsic
gm,gds,ggs,ggd,cgs,cgd and contact rd,rs in SI units.

For a fixed-bias common-source RF result, after loading nP:

```js
nP.global.fList = [10e6];
var q1 = nP.NJF();
var short1 = nP.Short();
var network = nP.nodal(
    [q1, 1, 2, 3],
    [short1, 3],
    ['out', 1, 2]
);
var response = network.out('s21dB', 'NF21dB');
```

With an explicit V supply, nodal/cascade solve the external bias network first
and rebuild RF, active noise and weak nonlinear data for each JFET placement.
Read the immutable network.operatingPoint and component qPoint; do not invent
a second netlist or reuse a template's original qPoint as the solved result.
An unpowered explicit solveDC() finds the unpowered state. Without a supply,
RF retains the selected fixed Q point. External C opens and L shorts only
for DC; bypass capacitance retains its RF impedance. V is RF-open, so include
an actual supply bypass when a return is needed.

Noise is approximate NLEV=1 channel thermal plus KF*abs(Id)^AF/f and RD/RS
thermal noise, not measured NF. Gate shot and induced gate noise are absent;
NLEV=1 has an ohmic-region limitation. Intermodulation is direct weak Taylor
IM2/IM3, omitting quadratic remixing, compression and large-signal switching.
No gate/drain breakdown, self-heating or trapping is modeled.

Drawing descriptions can use '1 right J1=NJF[1,2,3] 1 2 3' or PJF without
running a numerical constructor. MESFET has reference and NE760 records in updated bundles; HEMT supports ATF35143_DIE and ATF35143 models in updated bundles.
Updated renderers detect commonSource or accept {shapes:['commonSource']}.
It covers self-bias with gate resistor to reference, drain load, V supply,
AC-coupled ports and source resistance with separate R/C, combined sePaRC,
or no bypass; supply bypass is optional. Both polarities retain G/D/S roles.
The source and its ground appear right of the supply bypass. Three-terminal
FET divider bias is also supported by newer renderers; common-gate/common-drain
and multiple-FET boards remain future work.

MOSFET numerical models require an updated supplied bundle exposing NMOS and
PMOS. Verify the exports; published/pinned builds may share nP.version while
lacking them. NMOS defaults to Diodes DMN55D0UT; PMOS to one DMP58D0SV channel
of the dual part. These sourced silicon enhancement records use SPICE level-1
Shichman–Hodges, body effect, RD/RS and body-junction/overlap charge. Their fixed
L=W=100 um is part of the discrete fit; there is no geometry scaling option.

NMOS({body:'source', qPoint:{vgs:1.5,vds:5,vbs:0}}) shows defaults; PMOS Q
defaults to vgs=-2.6, vds=-5, vbs=0. body:'source' gives ports 1 gate, 2 drain,
3 source, tying body to the EXTERNAL source while retaining RS. body:'external'
adds independent port 4 body, in the same constructor. This exposes primitive
equations, not an accessible pin on these packages. SPICE M order is D/G/S/B.
Only model,body,qPoint,bias,temperature (K),fList (Hz) are accepted; temperature
and frequencies default to captured global settings. A source tie rejects
nonzero qPoint.vbs or curve VBS.

bias.vgs/bias.vds take {start,stop,points}. Default gate sweeps: 0 to +2 V or
-3.1 V, 5 curves; drain: 0 to +5 V or -5 V, 101 points. bias.vbs is constant
volts, default zero. ivTable({vgs,vds,vbs}) returns a header and signed terminal
VDS (V) versus ID (A) columns without moving RF Q. qPoint/bias include external
vgs/vds/vbs, ig/id/is, ib only with external body, bodyCurrent, terminalCurrents,
intrinsicVgs/Vds/Vbs, absolute vg/vd/vs/vb (possibly null), threshold,region,
body,temperature. Public currents enter the device and their array sums to zero.
Three-port IS includes the body return; bodyCurrent is an internal diagnostic.
smallSignal reports intrinsic gm/gds/gmb, cgs/cgd/cgb/cbs/cbd and rd/rs in SI.

A fixed-bias four-terminal RF example after loading nP:

```js
nP.global.fList = [10e6];
var q1 = nP.NMOS({body: 'external', qPoint: {vgs: 1.5, vds: 5, vbs: -0.25}});
var short1 = nP.Short();
var network = nP.nodal(
    [q1, 1, 2, 3, 4],
    [short1, 3],
    [short1, 4],
    ['out', 1, 2]
);
var response = network.out('s21dB', 'NF21dB');
```

Without a V supply, RF retains the selected Q point. With a V supply, the
complete graph solves DC first and reconstructs each placement's RF/noise/IM.
Read network.operatingPoint.components for solved bias; templates and curve
settings stay intact. An insulated floating gate produces DC_FLOATING_BIAS.
Never supply hidden gate leakage, assume a Q point is a DC source, or silently
ground a terminal. A floating body's voltage can be set by its real junction
current balance. External capacitors open only for DC, retaining RF impedance.

Noise is classical channel/contact thermal noise, not measured NF; KF=0 means
no fitted 1/f contribution. Body shot/induced gate noise is absent and the channel
formula has an ohmic-region limitation. The records omit TOX/inversion charge,
ESD clamps, avalanche, explicit package L/C, self-heating and inter-channel
coupling. Direct Taylor IM2/IM3 omits quadratic remixing, compression and switching.
MOS3/BSIM/EKV and generic model-text import are not implemented.

Updated commonSource boards support three-terminal MOSFET/FET divider bias with
a Tee4 gate junction, two bias resistors, drain load, V supply, AC-coupled ports,
optional supply bypass and source R, split R/C or sePaRC. Both rail orders share
the divider-amplifier layout rules with BJTs; do not add corrective coordinates.
Self-bias drawings also work, but an enhancement FET returned to zero gate bias
can remain off. Independent-body amplifier boards remain unsupported; standalone
four-terminal drawings work. Do not change topology to force a named shape.

Drawing descriptions use NMOS/PMOS or NMOS4/PMOS4 aliases, with G/D/S/B order.
There are no NMOS4()/PMOS4() constructors: use NMOS/PMOS({body:'external'}).
Depletion names NMOSD/PMOSD/NMOSD4/PMOSD4 remain drawing-only, without numerical
constructors. A four-terminal path is '1 right M1=NMOS4[1,2,3,4] 1 2 3 4'.
Current drawing-description layout rejects a repeated node on two terminals of
one component. Use the three-terminal form for its internal body/source tie;
report other requested self-connection layout limits without changing the circuit.


MESFET supports SPICE3_REFERENCE (the default numerical reference, not a
commercial fit) and NE760 (NEC family, Intusoft-published Statz card). NE760
requires a newer bundle than the original MESFET export: verify the supplied
bundle accepts model: 'NE760' before emitting that option. Never silently
substitute the reference profile for a requested part. HEMT has a separate constructor with die/package records in updated bundles.
NE760 is not a manufacturer-certified or package-specific fit; do not infer an
NE76084 or other suffix. It includes RD=5.45 and RS=4.88 ohms, with no lead L/C
or measured noise fit. FC=.2 is retained as provenance but inactive in Berkeley
MES1's total-gate-charge law. Both records use approximate classical noise.

MESFET({model:'SPICE3_REFERENCE', qPoint:{vgs:-0.5,vds:2}}) shows defaults.
Ports are G/D/S (1/2/3), all ig/id/is currents enter the device. It uses
N-channel Statz/MES1, Schottky gate currents, record-specific RD/RS and differential
voltage-dependent gate capacitances. No P-channel, arbitrary card import or
area scaling is available. temperature defaults to global.Temp in kelvin,
fList to global.fList. Electrical temperature stays fixed at 300.15 K in
this historical primitive; selected temperature changes thermal noise only.

bias and ivTable() accept vgs/vds {start,stop,points} intervals, defaulting
to gate 0 to VTO (5 curves: -2 V reference, -1 V NE760), drain 0 to 3 V
(101 points). ivTable() returns
one header followed by numeric voltage/current rows in V/A and leaves Q point
and .dc curve settings unchanged. qPoint/bias expose external vgs/vds,
intrinsicVgs/intrinsicVgd, entering ig/id/is, vg/vd/vs and temperature;
standalone results also report region and electricalTemperature. Floating
absolute node references can be null. smallSignal reports intrinsic gm/gds,
ggs/ggd, cgs/cgd and rd/rs. Do not treat it as a full external Y matrix.

Networks containing V() solve DC first and rebuild each device placement's
RF/noise/weak nonlinear data; inspect network.operatingPoint. With no supply,
RF retains the selected Q point and solveDC() is an explicit snapshot. Current
curves, contacts, RF and nonlinear sources share one model. Classical
channel/contact thermal noise is approximate; KF=0. Gate shot/induced noise,
measured NF, package L/C, trapping, dispersion, avalanche, self-heating,
compression and large-signal/harmonic-balance behavior are not supplied.
Direct IM2/IM3 includes differential C(V)*dV/dt sources, without quadratic
remixing. Use the existing commonSource shape for supported self/divider bias;
there is no MESFET-specific coordinate adjustment.

A minimal fixed-Q MESFET result, when the bundle supports the NE760 record:

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
console.table(response);
```

MESFET and HEMT share the N-channel NJF artwork,
with terminals 1 gate, 2 drain, 3 source. Use an instance caption to identify
the family, e.g. '1 right Q1=HEMT(HEMT)[1,2,3] 1 2 3'. Shared geometry
does not select material, operating mode or model equations. Schottky, Zener
and Varactor are drawing-only diode names with 1 anode, 2 cathode; e.g.
'1 right D1=Varactor 2'. Their distinct cathode markings provide no DC/RF,
noise or intermodulation model. Do not invent nP.Schottky(), nP.Zener() or nP.Varactor() calls. Check the supplied bundle
contains this artwork. Existing standalone D()/diode1N4148() models are retained.
For drawing descriptions, HBTs reuse NPN/PNP with an HBT caption, e.g.
'1 right Q1=NPN(HBT)[1,2,3] 1 2 3' (base/collector/emitter). PIN diodes
reuse D artwork, e.g. '1 right D1=D(PIN) 2' (anode/cathode). Captions
select no HBT/PIN numerical behavior. Confirm even the reused artwork exists
in the supplied renderer; the drawing grammar never invokes constructors.

Browser schematic() returns svg (DOM), svgText, graph, topology, detected
and error; this contract does not make it work in Node. Pure host renderers
may throw on invalid input. Never alter the circuit to force a picture or
present a partial drawing as success.

Optional shapes affect geometry, not electrical behavior. Newer browser/host
renderers detect commonEmitter automatically or accept {shapes:['commonEmitter']}.
It covers one NPN/PNP, Tee4 base junction, two divider resistors, collector
resistor/Tee, grounded V supply/Tee and two coupling capacitors. The emitter
is R to Short, sePaRC to Short, or Tee-led separate R/C branches with a Short
on each. Supply bypass is optional via another Tee/C/Short. Both the original
source-first rail and an R1-to-collector-Tee-to-bypass-Tee-to-V rail are supported;
preserve the supplied numbered terminal assignments. The collector
Tee common branch can carry the output or collector resistor. Other bias
arrangements are outside this first board. Confirm host renderer availability;
the standard Node bundle still supplies no DOM and no pure schematic exports.
A layout failure does not establish that the circuit is invalid.

Preserve topology when diagnosing layout. Never add spacer components, tuned
coordinates, SVG edits or graph postprocessing to force a picture. Current
renderers infer related branch baselines, measure caption/terminal space and
solve amplifier/transformer placement from terminal directions and ordering.
Use supported shape guidance or drawing-language directions/alignment to express
engineering intent. Confirm these capabilities in older supplied renderers;
report a layout limitation without disguising it or invalidating the analysis.

## Math and diagnosing code

`complex(real,imaginary)` exposes `.x`/`.y`. Arithmetic `add`, `sub`, `mul`,
`div`, `inv`, `neg`, `copy`, `sinhCplx`, `coshCplx` returns new values; `mag`
and `ang` return magnitude/degrees. `set`, `setR`, `setI` mutate and return the
receiver. `matrix(array)` exposes `.m`; use numeric or corresponding Cplx
methods. Inversion/solving return new matrices; `solveGaussFB()` and
`solveGaussFBCplx()` take augmented coefficient/RHS arrays.
`dim(rows,cols,initial)` shares object initials;
`dup(array)` copies rows but shares object entries. Precompute named inputs.

For requested code inspection, check the module path/format/API, Node/browser distinction, settings
order, units/grid alignment, port count/order, node pairing, junctions, DC
returns, selectors and display table shape. Names/titles can misdescribe code.
Make a small correction preserving intent; execute only if requested.

Useful reasoning checks: `S21=2*Ro/(2*Ro+Rtotal)` for ideal series resistance;
`abs(S21)^2` for matched transmitted power; an open Tee common branch leaves
an ideal through. An open stub needs a finite line. Emitter degeneration and a
low-impedance load can reduce S21 despite valid bias. These checks are reasoning,
not executed simulations. Deliver the explicit Node script, its shell run command and a brief
accurate statement of what was written and whether it was executed.

## HEMT/pHEMT die and package models

Verify the supplied bundle exports HEMT and accepts the requested model.
The newer ATF35143 package record is not implied by the presence of HEMT.
HEMT({model:'ATF35143_DIE',qPoint:{vgs:-0.6,vds:2}}) shows defaults.
Ports 1/2/3 are gate/drain/source, all ig/id/is currents enter. This adapts the
manufacturer's ATF-35143 nominal Statz die record at W=400 µm. The supported
device is an N-channel depletion pHEMT (pseudomorphic HEMT). It includes
RG/RD/RS, die LG/LD/LS, CDS and empirical series RC/CRF output conductance.
It omits the separate SC-70 package network and individual source leads; do
not rename it to the packaged part or promise packaged S-parameters/NF.

Static Qgs/Qgd use the Divekar charge partition; they differ from MES1's
differential capacitance branches. Manufacturer P/R/C drain and induced-gate
noise, their imaginary correlation, FNC/f flicker and contact thermal noise
are included. RC/CRF is an empirical AC correction, not a physical contact
noise source. No gate shot noise, electrical temperature scaling, trapping,
self-heating, avalanche or large-signal/harmonic-balance behavior is supplied.
Electrical parameters stay at 300.15 K; temperature (default global.Temp)
scales noise only. Direct Taylor IM2/IM3 omits quadratic remixing.

RF needs positive frequencies, positive intrinsic VDS and gm>0. Invalid cutoff
or reverse RF bias raises an actionable error; DC curves may include cutoff
and zero drain voltage. bias/ivTable() use vgs/vds {start,stop,points}: gate
0 to -.95 V in 5 curves, drain 0 to 3 V in 101 points. Curves return one header
then numeric V/A rows, preserving Q point and .dc settings. qPoint reports
external and intrinsic voltages, signed currents and temperature. smallSignal
includes gm/gds, ggs/ggd, cgs/cgd and rg/rd/rs; it is not the full terminal Y.

V()-driven nodal/cascade networks solve external bias before RF/noise/weak
nonlinear rebuilding; inspect network.operatingPoint. Reused templates keep
independent placement biases. Without a supply, RF uses the selected Q point
and solveDC() is a separate snapshot. Use the existing commonSource layout.

A minimal fixed-Q HEMT result, when supported by the supplied bundle:

```js
nP.global.fList = [100e6, 1e9, 3e9];
var q1 = nP.HEMT({model: 'ATF35143'});
var short1 = nP.Short();
var network = nP.nodal(
    [q1, 1, 2, 3],
    [short1, 3],
    ['out', 1, 2]
);
var response = network.out('s21dB', 'NF21dB');
console.table(response);
```

For the packaged part choose HEMT({model:'ATF35143'}). It adds the manufacturer's
p.16 SC-70 L/R/C circuit, retaining both source-pin paths and all three source
bonds. Public G/D/S ports stay 1/2/3, with both external source pins common at
port 3; independent source-pin termination is unavailable. ATF35143_DIE remains
the default and keeps die-only behavior. Nominal package range is 0.1–6 GHz.
DC shorts L, opens C and retains every resistor/current split. Fixed-Q control
derives effective contacts from that graph: rg=1.1, rd=.6, rs=.283333333333 ohms
including die contacts. smallSignal rg/rd/rs report these effective contacts;
model.parameters retains die values, with packageParameters and terminalNetwork
for the package. All physical package resistors contribute thermal noise.
The same bias handoff and nonlinear sources apply. The measured source-via
fixture is excluded. Independent SPICE agreement is tight, but comparison with
the measured 2 V/15 mA table shows up to about 2.1 dB S21 magnitude and 28° phase
difference over 0.5–6 GHz. Do not promise a close measured-data fit, packaged
NF or large-signal behavior. Existing nominal-temperature limitations apply.
