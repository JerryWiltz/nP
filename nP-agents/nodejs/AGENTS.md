# nP Node.js code-writing agent
<!-- Modified: 2026-11-26 -->

## Read this complete file first

Automatic instruction loading may supply only a prefix of this file. Before
using this guide to write or change a circuit, explicitly read its complete
local text in consecutive, bounded ranges through the final end marker:
`<!-- End of nP nodejs agent instructions -->`. A mention of that marker here is not the end.
Retrieve missing ranges if output is truncated; a preview or search is not a
complete reading. Reuse a complete reading while this file remains unchanged.
Reading instructions is allowed during `--stop` and does not authorize running
code, installing tools or modifying files. This guide needs no additional files
or downloads to supply its instructions.

When asked to maintain this guide itself, follow the contributor instructions
applying to its location, including required verification and managed-copy
updates. The circuit-writing persona and execution restrictions below apply to
using the guide for user circuits, not to requested maintenance of the guide.
Respect applicable workspace instructions and explicit user directions.

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

- `g.fGen(startHz,stopHz,points)` returns a fresh linear grid in Hz. Both
  endpoints must be finite numbers and points an integer >=1. One point returns
  `[startHz]` after validating stopHz; a literal `[frequencyHz]` is also valid.
  Multiple points include exact endpoints. Descending, constant and signed
  frequency lists are supported, subject to the consuming analysis's limits.
  Assign the returned array to `g.fList`; generation does not assign it.
- `g.tGen(startSeconds,stopSeconds,points)` returns a fresh endpoint-inclusive
  time grid in seconds, with finite endpoints, stop > start and integer count
  >=2. Time samples need an interval; a single RF frequency stands alone.
  Negative time origins are allowed if the consuming mode supports them.
  Assign the returned array to `g.tList` before dependent digital calls.
- Current standalone generators reject nonnumeric/nonfinite endpoints, invalid
  counts (zero, negative, fractional, nonfinite or above 4294967295), interval
  overflow and nonconstant spacing that collapses at numeric resolution. Older
  supplied/pinned builds may lack these stricter checks; always write valid
  counts and bounds. Do not silently upgrade a pin or add a validation wrapper.
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
| `R(resistance, temperature, options)` | Series R; numeric resistance in Ω, default 75; temperature defaults to `g.Temp`; third argument `{fList}` is optional. Use `R(75)`, without a first-argument object. |
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

Numeric validation in current standalone bundles covers R/L/C and their
combined forms, ideal lines, transformers, ideal fixtures and Chebyshev helpers.
R/L/C values are finite nonnegative Ω/H/F; resistor temperature is finite
nonnegative K. Zero R/L is a short and zero C an open; shared branch equations
handle DC, zero values and exact LC resonance. Negative passive values reject.
Tlin/Tclin impedances are finite positive Ω and lengths finite nonnegative m.
Transformer ratios are finite signed numbers, retaining the zero-ratio ideal
limit. R() remains numeric-only; seR/paR retain their existing object forms.
Captured Ro must be positive finite, Temp nonnegative finite and frequency
entries finite/dense. Empty construction grids and signed frequency rows retain
their existing behavior; two-tone tones must stay positive. Invalid numeric
arguments and unrepresentable RF/noise calculations throw errors instead of
returning NaN rows. This does not make every options object strictly validated.
Chebyshev synthesis needs positive values/integer order, stop frequency above
pass frequency, rejection above ripple, and a positive prototype array containing
source/load plus reactive entries. Older/pinned bundles may lack these checks;
write valid numeric arguments in every environment.

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

Current standalone builds validate connections before automatic DC bias or RF:
frequency rows and positive finite Ro must match across all components. nodal()
rejects wire labels that do not appear exactly twice and duplicate output labels;
each output label must pair with one component terminal. Older or pinned bundles
may not enforce these errors; always follow the connection rules below.

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

RF `.out()` accepts a final nonempty string label in current capable bundles:
`var response = network.out('s21dB', {label: 'Amplifier gain (dB)'});`.
One selector uses that exact heading; multiple selectors prefix each selector,
for example `Amplifier: s11dB` and `Amplifier: s21dB` for `{label:'Amplifier'}`.
Labels change only headings/trace names: frequency stays `Freq`, and numeric
values, frequencies and units do not change. Units are not appended to a custom
single-trace label; include them when needed. Empty/nonstring labels reject.
Without a label, headings stay unchanged. The same final object may contain
existing noise conditions or twoTone overrides. Do not rename table cells or
write a helper to label traces. Always supply a measurement selector, such as
network.out('s21dB'). Current standalone RF output rejects empty or options-only
calls with an actionable error; it no longer returns frequency-only rows.
DC and rectification output also require explicit selectors. Older runtimes
may retain their previous defaults; always writing selectors works with both.
This requirement does not change FFT or demodulation defaults.

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
supports BFR93A; PNP uses 2N3906. Put custom parameters inside model.parameters.
Terminals remain base/collector/emitter. No terminal is silently grounded.


NPN/PNP also accept a user-supplied record in current capable bundles:
`var myModel = {name:'My transistor', parameters:{IS:1e-15,BF:150}};`
then `var q1 = nP.NPN({model:myModel});` (or PNP with its own parameters).
No registration, rebuild or network fetch is required. This illustrative record
is not a measured part fit. A plain `parameters` object is required; it may be
empty. Missing values use generic defaults, not the default part's parameters.
The constructor selects polarity. Existing named model calls remain unchanged.
Optional nonempty strings: name (default 'custom'), manufacturer, material,
structure, mathematicalModel, modelVersion, source, leakageSource, package.
Links are provenance only; metadata never changes the equation engine.
Caller records are copied without mutation; the DC snapshot is immutable.
Resolved defaults are visible in q1.model.parameters. Parameters are uppercase,
case-sensitive, numeric; unknown keys and invalid values are rejected.
Supported defaults (A, V, ohms, F, seconds; TNOM in K, EG in eV):
IS=1e-16; BF=100; BR=1; NF=NR=1; NE=1.5; NC=2;
VAF=VAR=IKF=IKR=VTF=Infinity; ISE=ISC=RB=RE=RC=0;
CJE=CJC=TF=TR=XTF=0; VJE=VJC=0.75; MJE=MJC=0.33; FC=0.5;
ITF=Infinity; XTI=3; EG=1.11; XTB=0; TNOM=300.15; KF=0; AF=1.
ITF retains nP's compatibility default instead of SPICE's zero; specify it when
reproducing a source card. Convert SPICE TNOM from Celsius to kelvin.
IS/BF/BR/NF/NR/NE/NC/VJE/VJC/TNOM must be finite positive; MJE/MJC/FC are in
[0,1); XTI/XTB may be any finite value; other finite parameters are nonnegative.
VAF/VAR/IKF/IKR/VTF accept positive finite values or Infinity; ITF also accepts 0.
Optional inductors/capacitors default to []; rows are [nodeA,nodeB,value], with
positive finite H/F values and distinct integer internal nodes 0–10. These are
package nodes, not nodal circuit labels: 0/1/2 external B/C/E, 3/4/5 outer contact
nodes, 6/7/8 intrinsic B/C/E, 9/10 extra outer B/E nodes. Without inductors,
0–3,1–4,2–5,0–9,2–10 are joined. With inductors, their DC shorts must form exactly
[0,3,9], [1,4], [2,5,10], leaving intrinsic nodes separate. Other lead wiring is
rejected. Omit arrays when package data is unavailable; do not invent parasitics.
Object-valued model selection is also available for NJF, PJF, NMOS, PMOS,
MESFET, HEMT and D in current capable bundles. Use a named model-record variable,
then pass it as model; no catalog registration, rebuild or source-link fetch.
For example: `var myJfet = {name:'My JFET',parameters:{VTO:-3,BETA:.001}};`
then `var q1 = nP.NJF({model:myJfet});`. These are illustrative values, not a fit.
Optional provenance strings preserve the family's existing record data. Names
are labels; the constructor selects equations and polarity. If record.polarity
is present it must agree with the constructor (+1 N, -1 P). Unknown parameters
are errors. Empty package inductors/capacitors may be omitted. JFET, MOSFET,
MESFET and D reject nonempty arrays; their adapters have no arbitrary package
L/C support. This API does not import SPICE text/subcircuits or select new engines.

For NJF/PJF, supported generic defaults are VTO=-2, BETA=1e-4, LAMBDA=0,
RD=RS=CGS=CGD=KF=0, IS=1e-14, PB=1, FC=.5, TNOM=300.15, TCV=BEX=0,
NLEV=1, AF=1. VTO is negative for both polarities (normalized coordinates);
BETA/IS/PB/TNOM are positive, TCV/BEX finite, 0<=FC<1, NLEV must equal 1.
The fixed channel law is B=1; an arbitrary Parker-Skellern B is unsupported.

For NMOS/PMOS, defaults are LEVEL=1,VTO=0,KP=2e-5,GAMMA=0,PHI=.6,
LAMBDA=RD=RS=CBD=CBS=CGSO=CGDO=CGBO=KF=0,IS=1e-14,PB=.8,MJ=FC=.5,
L=W=100e-6,TNOM=300.15,AF=1. LEVEL must be 1; KP/PHI/IS/PB/L/W/TNOM
positive; VTO may be any finite value and uses physical polarity. MJ/FC are
in [0,1). L/W are meters; overlap CGSO/CGDO/CGBO are F/m, KP is A/V^2 and
GAMMA sqrt(V). body remains an options-level choice. A reused q.model.body
must agree with that option. TOX/inversion charge, BSIM, extra geometries and
arbitrary package wiring remain unsupported.

MESFET defaults: VTO=-2,BETA=1e-4,B=.3,ALPHA=2,LAMBDA=0,
RD=RS=CGS=CGD=KF=0,PB=1,IS=1e-14,AF=1,FC=.5. VTO negative,
BETA/ALPHA/IS positive; PB>.5 V for the existing charge continuation. FC in
[0,1) is retained but inactive. Electrical referenceTemperature stays 300.15 K;
other values are rejected. Selected analysis temperature affects thermal noise.

HEMT custom records require VTO,BETA,ALPHA,PB,DELTA1,DELTA2,VMAX,RC,CRF.
Do not fill missing core fit values with the ATF-35143 card. Optional defaults:
B=LAMBDA=RG=RD=RS=LG=LD=LS=CGS=CGD=CDS=P=R=C=FNC=KF=0,
IS=1e-14,N=1,FC=.5,AF=FFE=1. VTO negative; BETA/ALPHA/PB/IS/N/DELTA1/
DELTA2/RC/CRF positive; FC in [0,1); C in [-1,1]. P/R/C=0 is no supplied
correlated noise fit, not a measured noiseless-device claim. HEMT uses its
existing nominal 300.15 K electrical law, positive RF frequencies and a
conducting Q point with positive intrinsic VDS. packageParameters defaults to
null (die topology); the existing common-source SC-70 topology requires all
La,Lb,Lc,Ld,Rb,Rbridge,Ca,Cb in H/ohms/F, finite and nonnegative. The resolver
regenerates terminalNetwork/contactResistances/inductors/capacitors. Complete
resolved records may contain these fields, but they must match; omit stale
derived fields when editing raw parameters. No arbitrary package graph import.

D defaults: IS=1e-14,N=1,BV=Infinity,IBV=1e-3,RS=CJO=TT=KF=0,
VJ=1,M=FC=.5,EG=1.11,XTI=3,TNOM=300.15,NBV=AF=1. IS/N/IBV/VJ/TNOM/NBV
positive; BV positive or Infinity; M finite/nonnegative, FC in [0,1); XTI any finite value.
Optional record-level leakageResistance defaults to Infinity (positive ohms);
schematicVariant:'schottky' selects the hooked-cathode symbol; 'zener' selects
the angled-cathode symbol. Omit that field
for the ordinary symbol. D retains its existing VD=.6 V default, so choose
low Schottky bias explicitly. Legacy diode1N4148 still has its flat options,
not this model-record selector. Unless a range above says otherwise, supported
parameters are finite nonnegative numbers; an explicitly undefined value is
invalid. Use A/V/ohms/H/F/seconds, TNOM in kelvin and EG in eV. MES/HEMT B and
ALPHA, and LAMBDA, use 1/V; BETA uses A/V^2. Metadata never selects new physics.

PIN in a current capable bundle defaults to the fuller charge-storage model:
`PIN({model:'CHARGE_STORAGE_REFERENCE',qPoint:{vd:.8}})`. The built-in reference
is generic numerical data, not a manufacturer-calibrated PIN. Floating terminals
are 1 anode/2 cathode; its own pin-diode.svg symbol is used automatically.
The five-section ambipolar storage ladder, two equal PN junctions, controlled
bulk conductivity and optional high-injection/lifetime knees share their DC,
RF, noise and cubic Volterra equations. External V/R networks set each
placement's bias before RF/IM rebuilding, including reused templates.
Omit region or use 'automatic'; this engine does not require manual on/off
selection. qPoint uses vd in V; default .8 V. temperature is positive K,
default record.referenceTemperature (298.15 K for the numerical reference).
Nominal PN/depletion temperature scaling is included; W/TAU/resistances stay
fixed and self-heating is not solved. Frequencies are finite, nonnegative Hz;
use positive frequencies when KF is nonzero. No accepted point implies a real
part's safe operating rating or measured calibration.

For a supplied full record use `model:{modelType:'charge-storage',
parameters:{W:20e-6,TAU:100e-9,REPI:1000,RLIM:2}}`, optionally name and
referenceTemperature. W (m), TAU (s), REPI and RLIM (ohms) are required,
positive; RLIM<REPI. Generic optional defaults: IS=1e-14 A,N=1,RS=0 ohms
per junction,IKF=IKNEE=BV=Infinity,IBV=.001 A,RP=1e9 ohms,CJO=0 F,VJ=1 V,
M=0,FC=.5,EG=1.11 eV,XTI=3,KF=0,AF=FFE=1,IKMODEL=1. IKF/IKNEE are positive
A or Infinity; BV positive V or Infinity. IS/N/IBV/RP/VJ are positive;
RS/CJO/M/EG/XTI/KF/AF/FFE nonnegative; 0<=FC<1. IKMODEL=1 is ADS/PSpice
I0/sqrt(1+I0/IKF); 2 is HSPICE/ngspice I0/(1+sqrt(I0/IKF)). Fixed package
fields seriesInductance (H) and parallelCapacitance (F) default zero, with CP
across the terminals and L in series with the intrinsic model. Unknown keys,
legacy VI/RR/RRF, operatingRange, middleCapacitance and nonempty L/C arrays
reject. New compatible parts need no registration, build or provenance fetch.
Complete device.model records work through the same construction/bias path.
modelType may be omitted for new full records; the legacy VI/RR/RRF schema
retains selected-region interpretation. Mixed/unknown parameters reject.

ivTable({vd:{start,stop,points}}) returns VD/ID in V/A; default -5 to1.2 V,
201 points. dc.bias.vd retains that sweep. qPoint.junctionVoltage drives the
pair; junctionCurrent drives its storage ladder and differs from terminal id.
smallSignal reports conductance, bulkResistance, storedCharge (C),
carrierLifetime (s) and junctionCapacitance (F). storedCharge uses the smooth
nonnegative first-section coordinate; it is not simply TAU*terminalCurrent.
Noise propagates independent PN shot/flicker and physical-resistor thermal
sources; the storage ladder and controlled conductivity are noiseless. This
is compact-model noise, not measured excess noise for a commercial part.
Cubic Volterra IM retains local quadratic feedback at real Ro terminations;
finite IKF rejects cubic IM at exactly zero pair current (the branchwise
high-injection correction has no unique cubic expansion there).
The shared network engine omits quadratic remixing between separate nonlinear
devices. No general electrical transient/HB, compression, advanced level-2
depletion, unequal junctions, moving-boundary recovery or self-heating solver
is supplied. For switching waveforms, report that missing network capability.
Verify the exact loaded bundle: earlier bundles may have only the selected-
region PIN; the pinned Obsidian 0.3.3 runtime has neither PIN engine.

The retained Skyworks selected-region record has a separate contract:
`PIN({model:'SMP1307-011LF',
region:'forward',qPoint:{vd:.8}})` is a floating two-port, 1 anode/2 cathode,
with its own pin-diode.svg symbol. Region is selected before DC/RF: forward
(default VD=.8 V) or reverse (default VD=0). The named reference uses fixed
300.15 K, 10 MHz–3 GHz, forward current 20 uA–100 mA. Reverse VD must be <=0.
External V/R networks solve current before independent placement RF rebuilding
within that region; conflicting solved bias fails. It does not automatically
switch regions. Reused templates retain separate placement states.

Forward DC is a PN junction with RS plus constant VI drop; reverse adds RR to
PN RS. RF uses Ri=VI/ID (forward) or RR (reverse), separate residual RRF, Cg
parallel to the inner RF branch, L in series and Cp across the terminals.
The named record's DC RS=1.48 ohms differs from RF RRF=2.2 ohms.
`ivTable({vd:{start,stop,points}})` returns V/A; defaults forward VI–1.1 V,
reverse -20–0 V, 201 points. Forward sweeps start >=VI, reverse end <=0.
smallSignal reports intrinsicResistance/intrinsicCapacitance, rfSeriesResistance
and storedCharge=TAU*max(ID,0). This is a steady diagnostic, not a transient
charge solver. Noise is explicitly equivalent RF-resistance thermal noise,
not measured excess/shot noise. IM requests reject the absent nonlinear
carrier-storage model; no switching speed, automatic transition, compression,
self-heating or calibrated NF/OIP3 is implied.

A supplied `model` needs positive VI (V), RR (ohms), TAU (s). Generic defaults:
IS=1e-14 A,N=1,RS=RRF=0 ohms,CJO=0 F,VJ=1 V,M=FC=.5; IS/N/VJ positive,
M nonnegative, 0<=FC<1, all values finite. Optional packageParameters:
seriesInductance (H), middleCapacitance (F), parallelCapacitance (F), each 0
by default and nonnegative. All operatingRange fields are required: positive
minFrequency/maxFrequency (Hz), minForwardCurrent/maxForwardCurrent (A), with
increasing bounds. Custom referenceTemperature defaults to 300.15 K; the
options.temperature must equal it. Unknown parameters (including TT), unknown
keys and nonempty L/C arrays fail. No manufacturer fit is borrowed or URL
fetched. A complete device.model can be supplied directly without registration
or rebuilding, including plain browser/Node records. The named model uses
Figure 8 values IS=1e-8 A and RR=4e6 ohms; source tables differ. It is a
selected-region equivalent, not a general PIN SPICE or large-signal engine.
Verify PIN in the actual runtime. The pinned Obsidian 0.3.3 bundle lacks PIN;
updating this guide alone does not upgrade it.

Avalanche noise in current capable bundles uses a separate constructor:
`NoiseDiode({model:'NC406_REFERENCE',fList,temperature:300})`, with floating
ports 1 anode, 2 cathode and its own noise-diode.svg symbol/gallery entry.
The geometry matches Zener artwork; the symbol identity and file are independent. This research
reference is plot-derived at 16.7 mA reverse current, 300 K, 2–40 GHz, not a
calibrated noise source. Set a matching frequency grid before all components.
There is no DC I-V, off-state fit, bias/temperature interpolation or deterministic
nonlinear current/charge fit. solveDC and IM requests reject missing models;
external bias cannot rebuild this fixed-Q device. qPoint has negative id and
vd:null because voltage is unknown. Do not substitute an ordinary D Zener.

`var table = nd1.noiseTable({coldTemperature:290,referenceTemperature:290});`
returns a header then rows of Hz, ENR dB, available noise temperature K,
available noise dBm/Hz, delivered noise dBm/Hz, source reflection magnitude.
The cold temperature is an assumption, not a modeled off state. Available
power is k*Thot; delivered power includes mismatch to global.Ro. Reflection
means (Z-Ro)/(Z+Ro) with the opposite terminal grounded, not the bare two-port
S11. Ground one terminal with Short through nodal to make a source; its
covariance propagates through connected components. NF/noiseFloor are not
standalone-source ENR. The paper's on-wafer ENR curve includes an unspecified
transition and differs from the diode-plane equations; no correction is hidden.

A supplied record needs `parameters` with positive depletionResistance (ohms),
driftCapacitance (F), driftResistance (ohms), avalancheFrequency (Hz), transitTime
(s), biasCurrent (A, reverse magnitude). Generic optional leadInductance (H),
packageCapacitance (F), seriesResistance (ohms) default to 0; nonnegative
avalancheLengthRatio defaults to .5. All values must be finite. Record-level
referenceTemperature defaults to 300.15 K, positive; options.temperature must
equal it. No custom record borrows the named part's fit.
Required noiseFit fields: positive referenceFrequency/kneeFrequency/minFrequency/
maxFrequency in Hz, increasing bounds, in-band knee, coefficientsDb:[c0,c1,c2]
finite. The exact law is 10log10(M²)=c0+c1*ln(f/referenceFrequency)+
c2*max(ln(f/kneeFrequency),0)^2. Every analysis frequency must lie in the band.
Unknown keys and nonempty package arrays are rejected. Use
`var nd1 = nP.NoiseDiode({model:myModel});` with named intermediate data; a
complete nd1.model can also be reused. No URL fetch, registration or rebuild is
needed for compatible supplied data. A different bias needs corresponding RF
and noise data, not a current change alone. Verify NoiseDiode exists in the
actual supplied/pinned runtime before writing code; updating this guide does
not upgrade it. The pinned Obsidian 0.3.3 runtime does not export NoiseDiode.

Zener support in current capable bundles: `D({model:'BZX384-B4V7',qPoint:{vd:-4.7},temperature:300.15})`
selects an archived NXP/Philips-attributed single-junction card and the canonical
Zener symbol. The original manufacturer-hosted model was unavailable at
verification; independent SPICE agreement is not measured-device certification.
Ports are 1 anode, 2 cathode (not SOD323 physical pin numbering). VD=VA−VK and
ID flows A-to-K, so both are negative in reverse breakdown. Standalone defaults
remain VD=+.6 V and a 0–.8 V curve; choose negative Q explicitly or use external
V/R bias before RF. `ivTable({vd:{start:-4.8,stop:-4.4,points:81}})` returns
V/A rows without changing Q. Use the returned curve's .out('idmA') for a
current display in mA when the runtime supports this reader. The named card has IS=1.033e-15 A,N=1.001,BV=4.7 V,IBV=.005 A,
RS=.387 ohms,CJO=258.9e-12 F,VJ=.8029 V,M=.3636,FC=.5. Omitted TT=0,EG=1.11,
XTI=3,TNOM=300.15,NBV=1,KF=0,AF=1 are generic defaults, not fitted data.
No explicit package L/C, fitted breakdown temperature coefficient, self-heating
or avalanche excess-noise model is supplied. Classical shot/thermal noise and
direct weak IM are available; no large-signal clipping, quadratic remixing or
rectified bias-shift calculation within the IM path. The separate rectify()
method below supplies a weak DC correction in capable runtimes. A model symbol
never changes the equations.

A supplied Zener works without registration, rebuilding or fetching URLs:
`var myZener = {name:'My Zener',schematicVariant:'zener',parameters:{IS:1.033e-15,N:1.001,BV:4.7,IBV:.005,RS:.387,CJO:258.9e-12,VJ:.8029,M:.3636,FC:.5}};`
then `var d1 = nP.D({model:myZener,qPoint:{vd:-4.7}});`.
This reproduces the named card through the same DC/RF/noise/weak nonlinear path;
change the parameters for another compatible part. Raw SPICE multi-diode or
controlled-source subcircuits are not single-junction records. For pinned or
older bundles, verify D and this model selector before using them; updating
this guide alone does not upgrade the supplied runtime.

Varactor support in current capable bundles: D({model:'SMV1231-079LF',
qPoint:{vd:-3},temperature:300.15}) selects a Skyworks SC-79 record and varactor
symbol. It uses CJO=1.88e-12 F,VJ=10.13 V,M=4.999,RS=2.5 ohms,CP=.44e-12 F,
LS=.7e-9 H. DC/RF/noise/direct IM share the same charge and package laws.
M may be any finite nonnegative value; M=1 uses the logarithmic charge integral.
This extends D generally; do not clamp a manufacturer's M or VJ to simulator
limits. Named and supplied varactor records use the same path.

D model records may include packageParameters:{seriesInductance,
parallelCapacitance}; both default to zero and require finite nonnegative H/F.
The fixed topology is LS in series with [CP parallel to (RS + junction)].
leakageResistance stays across the public terminals. At DC LS shorts and CP
opens. Tone and product-frequency package loading is included in weak IM;
ideal LS/CP add no noise. Arbitrary package L/C arrays remain unsupported.
Example record (illustrative source-fit values, not a new measured device):
`var myVaractor = {name:'My varactor',schematicVariant:'varactor',parameters:{CJO:1.88e-12,VJ:10.13,M:4.999,RS:2.5},packageParameters:{seriesInductance:.7e-9,parallelCapacitance:.44e-12}};`
then `var d1 = nP.D({model:myVaractor,qPoint:{vd:-3}});`.

Every current D has cvTable({vr:{start:0,stop:15,points:31}}). It returns a
header ['vr (V)','cj (F)','ct (F)'] followed by numeric V/F/F rows. VR is
nonnegative reverse voltage, equal to -VD; defaults 0–10 V/201 points.
VR must increase and have at least two integer points. CJ is depletion
capacitance, CT is effective zero-frequency terminal capacitance. In reverse
blocking CT is effectively intrinsic-plus-diffusion capacitance plus CP;
conducting models also include contact/lead effects. This is not an RF
capacitance at resonance. The curve preserves Q, RF/noise rows and I-V settings.
smallSignal.totalCapacitance remains intrinsic; packageCapacitance,
terminalCapacitance and seriesInductance expose the added package quantities.
The original API array stays in farads. In capable bundles, assign the C-V
result to capacitance, then use capacitance.out('cjpF','ctpF') for a pF display
table; VR stays in volts. Use metricPrefix:'none' and label the y axis pF.
Do not write conversion loops or add CSS/axis-spacing overrides. Older pins
may lack this reader; report that limit rather than adding a helper wrapper.
D's standalone default is still VD=.6 V: explicitly choose negative VD for
varactors, or supply an external bias network. The sourced fit covers reverse
0–15 V; do not treat generic forward/leakage/breakdown defaults, classical
noise/temperature laws or constant RS as measured fits. No finite fitted BV is
supplied. Direct weak IM omits quadratic remixing, compression and rectified
bias shift; this does not simulate a large-signal VCO or its phase noise.

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
Schottky support in current bundles: `D({model:'SMS7630',qPoint:{vd:0.05},temperature:300.15})`
or `model:'SMS7621'` selects a Skyworks per-junction card and the hooked-cathode
symbol. No Schottky() or part-number constructor exists. D defaults stay
VD=0.6 V and the 0–0.8 V/201-point sweep, so select low bias explicitly.
The same external DC/RF/noise/direct-IM handoff applies. RS is included;
package L/C and multi-junction package wiring are absent. No extra leakage
resistor is added. The classical noise/direct Taylor law is not a measured
detector fit or large-signal rectification simulation. Older bundles may
export D() without these records; verify the supplied bundle supports the
requested model.


### Weak-signal RF-to-DC detection

Current standalone bundles provide
`network.rectify({frequencyHz,inputPowerDbm,inputPort:1,outputNodes:[positive,negative],outputPath:''})`.
Verify the supplied runtime exposes rectify; older bundles and the pinned
Obsidian worker may not. Do not emulate this API with a diode I-V lookup or
AM demodulation when it is absent.

Frequency is required positive Hz already in the constructed grid. Input power
is available source dBm; `-Infinity` means RF off. inputPort is one-based and
defaults to 1. The source and all unused external RF ports are matched to captured
Ro. They add no DC source/load. Explicitly include DC returns, loads, bias and
RF bypass/isolation components. outputNodes are positive/negative wire labels
in outputPath (root default ''); nested namespaces use solveDC placement IDs.
Numbers and strings are different node labels. Internal nodes can be measured
without adding an external RF output port or its matched RF load.

For power sweeps pass inputPowerDbm as a nonempty dBm array or
{start:-90,stop:-60,points:7}. Ranges are linear in dBm, include both endpoints,
and need distinct finite endpoints and an integer count >=2; descending ranges
work. Lists preserve order. A sweep returns immutable inputPowerDbm and results
arrays, one full scalar result per power, with a shared RF-off bias solution.
A failing weak-signal point rejects the entire call.

Scalar and sweep results provide .out(...selectors, {label}). Always specify
at least one measurement, for example .out('deltaVoltageuV'). Empty and label-only
calls reject in current capable bundles. Select baselineVoltage, deltaVoltage or voltage in V; append mV
or uV for millivolts or microvolts (for example deltaVoltageuV). Also supported:
sensitivityVoltsPerWatt (V/W). Optional nonempty label names a single trace or
prefixes multiple trace names. The fresh table starts with Input (dBm) and
measurement headers with units. Use metricPrefix:'none' in chart/table calls.
Do not write loops, push table rows or multiply voltages to produce a detector
power plot. Use named analysis results and their .out() tables. Tables require
finite powers/results; inspect RF-off scalar fields directly. Methods are not
included in JSON/structured clones. Older rectify-capable bundles may lack
sweeps/.out; verify the supplied runtime before using this newer API.

The method independently solves RF-off DC, including passive zero-bias circuits,
and rebuilds each D() placement at that bias. It calculates loaded junction RMS
RF voltages, their average quadratic currents and the coupled DC Jacobian
response. Both diodes of a detector/reference pair and their shared bias network
participate; reference RF leakage is calculated from the actual network. Use
matching records and specified temperatures to study tracking; no package
thermal coupling, mismatch or guaranteed sensitivity compensation is implied.

Immutable outputs: baselineVoltage (RF off), deltaVoltage (RF-induced change),
voltage (their sum), sensitivityVoltsPerWatt (delta/input watts, null at RF off),
operatingPoint (RF-off nodes/placements), sources (per-placement junctionRmsVolts,
currentAmps equivalent generated current, junctionBiasShiftVolts and junctionRatio),
and dcResponse. Its node deltaVoltage and component terminalVoltages/currents are
increments, not totals. RF-off output polarity and finite DC return matter.
Existing template Q, spars, ivTable and ordinary solveDC semantics stay unchanged.

Named/supplied D() records share the same rectification path. Other nonlinear
families, missing physical DC models and attached mod()/signal data reject.
RF peak/thermal-voltage and charge-curvature ratios, and DC-shift/thermal-voltage
ratio, must each be at most 0.1; excessive drive rejects. This is second-order
single-CW square-law detection, with no guaranteed error bound near model
boundaries, high-power peak detection, compression, charging/envelope transient,
self-heating, harmonic balance or detector-noise/TSS calculation. This new method
is separate from the existing two-tone IM results.

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


### Common output units for measurement tables

Current capable bundles accept a final units object across RF, DC, device
curves, rectification, waveform/PN/mod/demod measurement tables and FFT output.
Keep underlying settings and samples in their existing SI/native units; request
display conversion inside .out(), without loops or helpers. Existing calls and
legacy ns/s waveform defaults remain compatible.

```js
var response = network.out('s21dB', {units: {frequency: 'GHz'}});
console.table(response);
```

Other examples: dc.out('ic',{component:q1,units:{current:'mA'}}),
curves.out('ic',{units:{current:'mA'}}),
source.out('waveform',{units:{time:'us',voltage:'mV'}}), and
spectrum.out('dBV',{units:{frequency:'MHz',voltage:'mV'}}).
Use named results before chart/table calls; do not nest nP calls.

Accepted quantity/unit pairs (case-sensitive):
- frequency: Hz/kHz/MHz/GHz/THz; time: s/ms/us/ns/ps.
- voltage: V/mV/uV/nV/dBV; current: A/mA/uA/nA/pA.
- capacitance: F/mF/uF/nF/pF/fF; resistance: ohm/kohm/Mohm; temperature: K.
- angle: deg/rad; power: W/mW/uW/nW/pW/dBm/dBW.
- powerDensity: W/Hz,mW/Hz,uW/Hz,nW/Hz,pW/Hz,dBm/Hz,dBW/Hz.
- sensitivity: V/W,mV/W,uV/W.
ASCII u displays as µ; micro signs and Ω/kΩ/MΩ aliases are accepted.
A requested quantity must exist in the table. Unknown, incompatible and unused
requests reject. All columns of that quantity convert. Unspecified quantities
retain their chosen units. A units map overrides a selector suffix for the same
quantity; prefer unsuffixed selectors with the map. Duplicate resulting headings
reject. Existing label, component/node and FFT floor options remain supported
where those readers already define them. Digital table readers accept units
only; do not invent other options. Underlying results and captured data do not
change. An empty units object makes declared units explicit without rescaling.

Original unit-selected tables tell lineChart/lineTable/smithChart not to apply
another default giga division. Omit metricPrefix or use 'none'/'one'; another
explicit prefix rejects. Use matching horizontal units across one plot's input
tables. Default line-chart axes follow unit declarations; explicit titles win.
For copied, JSON/structured-cloned or worker-transported tables, use
metricPrefix:'none': copies retain converted values/headings but lose private
metadata. Always using none for unit-selected output is portable and simple.

Units do not change amplitude convention. RF signal voltage is peak; FFT dBV
is calibrated one-sided RMS with its existing floor. Raw FFT coefficients do
not become volts. S/NF ratios keep their existing dB/linear selectors; they are
not absolute power. Available input power, IM/OIP and noise density retain their
references when converted (dBm=1mW, dBW=1W, dBV=1V). Negative arguments cannot
become logarithms; zero becomes -Infinity without an invented floor. Signed
linear currents/covariances and undetermined DC values retain their meaning.
Advanced decoded-symbol waveform outputs contain bits, not volts: unit-selected
headers say Decoded bit. Normalized VNA responses are dimensionless. Request a
carrier waveform for physical voltage. Raw bits, settings, scalar outputs, raw
sample vectors and complex spectra reject units requests; use a supported
measurement table. Older outTable/noiseOut methods keep their legacy signatures.

Only use this option with a verified capable runtime. Older supplied bundles
and the baseline Obsidian pin may lack it or ignore it. Do not silently upgrade
a pin, infer capability from the version string or add compatibility wrappers.

### Device-curve result output

In current capable bundles, every ivTable()/cvTable() result remains its
original mutable SI table array and also exposes .out(...selectors, {label}).
Use named steps; let the library select columns, label traces and convert units:

```js
var curves = q1.ivTable();
var current = curves.out('icmA', {label: 'Q1'});
```

BJT common-emitter/common-base curves select ic; common-collector selects
outward ie. FET and diode curves select id. C-V selects cj and/or ct, such as
var capacitancePf = capacitance.out('cjpF', 'ctpF');. All existing stepped
bias traces, signs and sweep order are preserved. Raw arrays remain V/A/F.
Current suffixes: A/mA/uA/nA/pA; capacitance: F/mF/uF/nF/pF/fF.
Optional first selector chooses the existing voltage axis in V/mV/uV:
var current = curves.out('vcemV', 'icuA');. Omit it to keep the original V axis.
Use only the table's supplied axis (vd,vr,vce,vcb,vds) and measurements.
Do not select bias-step conditions as if they were measured columns; individual
step filtering is not provided. At least one dependent measurement is required.
Missing/unavailable measurements, incompatible units, duplicate columns and
unknown options reject. Selected data and scaled values must be finite.

A nonempty label names one column with units, or prefixes each quantity/bias
heading for multiple columns. ASCII u displays as µ. Each .out() returns fresh
rows from captured SI samples, without changing Q, RF, noise, curves or supplied
records. Edits to the raw array or display rows do not change captured data.
JSON/structured clones and ordinary array copies retain table data without the
reader; call .out on the original result. Legacy diode1N4148 keeps its original
positional ivTable and vD/iD headers; its reader selects lowercase vd/id.
Display the named table with console.table(current) in Node.js.

Older bundles may return bare arrays. Verify the actual runtime before using
this reader; do not write a conversion/helper wrapper or silently upgrade a pin.

### DC measurement tables in current standalone bundles

Both network.solveDC() and the automatic network.operatingPoint result expose
.out(...selectors, options). Verify this reader in older/pinned runtimes before
using it; the pinned Obsidian bundle may still expose raw data only. Do not
manufacture an HTML/npjs compatibility helper when the reader is absent.

Use a named DC result, then a named table, then the built-in table renderer:

```js
var dc = network.operatingPoint;
var biasTable = dc.out('vgs', 'vds', 'idmA', {component: q1, label: 'Q1'});
```

Use network.solveDC() for an explicit solve; reading .out does not solve again
or change device bias. component:q1 selects the original component's captured
model, independent of row ordering. If that template is placed more than once,
select component:'p6' or a nested placement path such as 'p1/p3'; ambiguity is
an error. A newly constructed equivalent part is not the original placement.
label is optional nonempty text naming the selected table row.

Selectors are required. Device fields include vbe/vce/vcb, ib/ic/ie,
vgs/vds/vbs, ig/id/is, external terminal voltages, intrinsic voltages,
junctionVoltage/junctionCurrent and temperature where the solved qPoint supplies
them. Fields unavailable on a selected device reject. bulkResistance is available
for the charge-storage PIN's solved DC state. BJT ie is outward, while i3 enters
terminal 3. Default units V/A/ohm/K; append V/mV/uV, A/mA/uA, ohm/kohm or K as
appropriate, for example ibuA, icmA, v12mV and bulkResistancekohm. ASCII u
renders as µ in headings. Incompatible units and duplicate columns reject.

Generic terminal selectors: v1 through v9 are absolute terminal voltage;
v12/v21 mean first minus second terminal; v(12) or v(12,3) disambiguate
multi-digit ports. i1/i2/... are entering terminal currents. All port numbering
uses the constructor's public order. For a resistor use
var resistorTable = dc.out('v12','i1mA',{component:r1,label:'R1'});

Node observations: dc.out('voltage',{node:'rail'}) for one absolute voltage;
dc.out('voltagemV',{nodes:['detector','reference']}) for a difference. path:''
is the root node namespace; another string selects a nested namespace. Numeric
and string node IDs stay distinct. The label 'g' does not select an implicit
ground. Differential measurements use the retained observation equations, so
known differences remain measurable between floating nodes. Undetermined values
are text 'undetermined' in tables, while raw result fields remain null.

Without component, device-field selectors read all qPoint-bearing devices;
generic terminal selectors read all component records. Without node/nodes,
voltage lists user nodes in the selected namespace. Do not mix component and
node measurements in one call. Every requested field must exist on selected
rows; use separate calls for incompatible device families.

Tables have a text Component/Node column followed by measurements with unit
headings. Display with console.table(biasTable). These are static DC
observations, not numeric-x curve data for lineChart. Output rows are fresh
copies; results remain deeply frozen. Non-enumerable .out methods are omitted
from JSON/structured clones; cloned data do not retain the reader. Do not loop
through component records, reconstruct a device to display DC bias, multiply
currents for display, or hand-build DC tables when this API is available.


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
'1 right Q1=NPN(HBT)[1,2,3] 1 2 3' (base/collector/emitter). PIN uses its own symbol, e.g. '1 right PIN1=PIN 2' (anode/cathode).
The older D(PIN) caption remains drawing-only and selects no PIN numerical
behavior. HBT captions select no new numerical behavior. Confirm even the reused artwork exists
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

Current capable renderers also infer straight runs from uniquely opposed
connected terminal directions in the automatic graph layout. Shared constraints
align their terminal axes and reserve measured body/label space before routing.
A longer label can require more space without introducing a jog. Branches,
bends and ambiguous fanouts retain their topology. This needs no per-symbol
alignment opt-in or compensating coordinates; confirm the supplied renderer
supports it. The existing Obsidian 0.3.3 pin does not promise this improvement.

Measured straight-run compaction also removes unused coarse-packing gaps.
It reserves separate symbol, caption, terminal-escape and external-port spaces,
preserves branch order and retains existing loop interiors. Do not shorten
canonical pins or add per-part wire-length overrides to compensate for layout.
Verify this behavior in the supplied renderer; the pinned Obsidian runtime has
not been upgraded by these instructions.

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

### Detector shapes and measured schematic labels (newer renderer)

This is browser-renderer reference information for writing HTML. It does not
provide a Node DOM or a public headless SVG-export API.

Current standalone browser renderers detect diodeDetector and differentialDetector,
or accept `nP.schematic(network,{shapes:['diodeDetector']})` and the corresponding
differentialDetector name. They have one RF input; the DC measurement uses
internal nodes and does not need another RF port.

Single diode: optional series input C, Tee with L/R-to-Short input return,
anode-to-cathode diode and output Tee with separate R-to-Short and C-to-Short
load/bypass branches. Pair: coupled RF input to one diode, separate bias chokes,
a common bias Tee/R and V/Short supply, and separate R/C output branches for
both diodes. A supply Tee/C/Short bypass is optional. Junction, Schottky, Zener
and varactor symbols preserve their numbered anode/cathode terminals. Other
bias circuits or combined RC parts need another supported layout; do not alter
the circuit to make this shape match.

The shared engine places RF left, common bias above and related output/load
branches on aligned baselines. Do not supply tuned coordinates, compensating
spacing or graph/SVG corrections. Grouped/composed paths may end in these
one-port boards: their interface is from:[1],to:[], so explicit sections use
from:inputNode,to:[]. Boundaries accept string/finite-number labels; numeric
and string IDs remain distinct. Two-port boards still require their output.

Numeric R/L/C captions use engineering units such as 10 kΩ, 1 µH and 100 pF
at the selected significantDigits. Named/wide node IDs use measured rounded
enclosures; ordinary short numeric IDs keep circles. These presentation rules
preserve the analysis and node identities. Verify availability in the supplied
bundle.

<!-- End of nP nodejs agent instructions -->
