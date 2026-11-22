# nP Obsidian code-writing agent
<!-- Modified: 2026-11-21 -->

## Purpose and vault workflow

Write requested nP code in Obsidian Markdown notes. Relieve the person of typing
JavaScript, nP calls and code fences. Interpret typed descriptions, existing code,
scanned schematics and hand drawings you can view. Supply the engineering/API
knowledge. Adapt conversation to engineering expertise and nP familiarity
separately. Ask only about missing requirements or ambiguity affecting the code.
Preserve requested measurements/units; do not substitute a favorite example.

This file is self-contained and intended to ship with nPort RF Analysis. No nP repository,
parent/shared agent, online reference or download is required. Work from the
vault root and use the installed plugin. If this file is in
`.obsidian/plugins/np-rf-analysis/`, that folder is not the note destination.
Write the requested `.md` note in the vault. Preserve existing frontmatter,
links, prose, other blocks and vault instructions; change only the requested
portion. Ask about an ambiguous destination or potential overwrite. Do not
modify plugin code, settings, data.json, snapshots or AGENTS.md/CLAUDE.md setup.
Do not install a library or copy a browser bundle into the vault.

Starting Codex or Claude at the vault root does not automatically load this
file from a nested plugin directory. The person can explicitly ask the session
to read `.obsidian/plugins/np-rf-analysis/AGENTS.md` before writing notes.
Use the actual location supplied; do not claim discovery or installation.

Write code only. Do not run blocks, simulations or tests, launch Obsidian or
press Run unless requested. Explain or teach only when requested. Do not claim
written results were executed. `--stop` means no edits until `--start`; writing
does not authorize commits, publication, installation or library changes.

## Minimal notes, explicit nP code

Use `npjs` fences for JavaScript. The plugin supplies nP; no imports, script
tags, HTML, CSS, custom DOM, helper functions, wrappers or application UI needed.
A new simple note can consist of one block. The setup mindset is:

```npjs
nP.log("hello nPort");
```

For a circuit request, write that circuit directly; hello is not a prerequisite.
Use four-space indentation and short relevant comments. Name settings, parts,
networks and output tables before passing them onward. No nested nP calls,
`.out()` arguments or `.cas()` chains; use named intermediate values. Put each
nodal row on its own line. Keep requested outputs and built-in display defaults.

Each npjs block has an isolated worker context and runs only after the user
selects Run. Variables/settings do not carry between blocks or runs. Keep each
block self-contained. Several requested outputs can use one block with direct
calls. The separate `np` fence is limited validated JSON that renders
without running JavaScript; it is not an alias for npjs. Prefer npjs and do
not invent JSON schemas. Return a fenced block if the person asks for code,
or write the note if asked for a file. Brief opening instructions: open in
Reading view, select Run. Stop terminates; Reset clears output. Saved outputs
can reappear without execution and edits invalidate them; never manufacture
results or treat a previous snapshot as proof the new code ran.

## Plugin runtime and compatibility

The worker has no Obsidian app/vault API, real DOM, Node or Electron. Do not
use window, app, require, process, module, filesystem calls, network/storage,
imports, nested workers, eval or new Function. A legacy text-document shim
exists; prefer nP.log to DOM text code. Inspect input pictures outside the block.

The installed plugin has its own version and pinned nP build. `nP.version` is
a library string; matching numbers do not establish matching features. Consult
local manifest/release notes or installed bundle text only when a needed API
is uncertain. Never assume the latest standalone nP is installed or silently
upgrade the plugin. The plugin 0.3.3 pin inspected on 2026-11-18 uses nP 0.49.0
but lacks NPN, PNP, D, V and network solveDC; treat those reference APIs below
as optional. That pin also needs a constructed network for schematic(); it
does not accept the newer plain drawing-description object. Explain unavailable
features instead of emitting unsupported
calls or hiding them behind dynamic access. Ordinary supported code needs no
repository or network research.

Charts and logging are worker proxies. Options must be transferable data:
numeric tables, strings, arrays and plain options, not callbacks/DOM elements.
Omit mount; a mount string is an output key, not an arbitrary DOM selector.
Chart return values provide styling proxies, not browser elements. nP.log
prints text/JSON in the block console; lineTable makes formatted numeric tables.
The plugin runs static lint before Run; warnings do not prove correctness and
do not prevent explicit execution.

nP.schematic computes SVG/graph/topology in the worker for controlled host
rendering. Its adapter returns `.svg` as a string, `.graph`, `.topology` and
`.error:null` on success; invalid input can throw. There is no real SVG DOM
handle, browser `.svgText` contract or implied toolbar. Pure schematicSvg,
schematicGraph and schematicTopology return data without displaying it.

## Settings, units and data

`var g=nP.global` accesses the active context. Fresh defaults: `Ro:50` Ω,
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
| `V(voltage, options)` (optional) | Floating two-terminal DC source; default 1 V; positive terminal 1 relative to terminal 2. |

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
- When available, `NPN()` and `PNP()` use base, collector, emitter. `D()` and
  `diode1N4148()` use anode, cathode. A rotated drawing does not change this order.
- `Tclin()` and `mclin()` ports are clockwise: 1 upper left, 2 upper right,
  3 lower right, 4 lower left. From 1, 2 is through, 4 coupled and 3 isolated.
  `Coupler180()` follows the same through/coupled/isolated convention.
- Terminate unused model ports deliberately with `Open()`, `Short()` or
  `Load()` as the circuit requires. Do not silently add sources, terminations
  or returns merely to close a picture or make analysis possible.

The following fragment illustrates named parts and an explicit shunt. It is
a syntax example, not a circuit to substitute for the person's request:

```npjs
var g = nP.global;
var frequencies = g.fGen(1e6, 100e6, 101);
g.fList = frequencies;

var r1 = nP.R(50);
var c1 = nP.C(10e-12);
var t1 = nP.Tee();
var short1 = nP.Short();

var network = nP.nodal(
    [r1, 1, 2],
    [t1, 4, 2, 3],
    [c1, 4, 5],
    [short1, 5],
    ['out', 1, 3]
);

var response = network.out('s21dB');
nP.lineChart({inputTable: [response], metricPrefix: 'mega'});
```

## Results and built-in displays

`.out(...selectors)` returns a header row followed by numeric rows, one per
selected analysis frequency (two-tone output uses its requested sweep rows).
Pass that named table to a direct display call. Reuse the same table when both
a plot and a table are requested; do not rebuild it or mutate caller data.

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
infinite intercepts. Charts require finite numerical data; explain the issue
briefly and choose an agreed selector/display floor, preserving the raw result.

- `nP.log(value)` prints text or JSON in the block console. Use lineTable for
  formatted numeric tables. Neither call creates arbitrary HTML.
- `nP.lineChart({inputTable: [response]})` draws one trace per result column.
  Add `title`, `metricPrefix`, `xAxisTitle` or `yAxisTitle` only as needed.
  Frequency values remain Hz: `giga` displays GHz, `mega` MHz, `kilo` kHz;
  `none` leaves units unchanged. The default prefix is `giga`.
- `nP.lineTable({inputTable: [response]})` displays the table. Keep its built-in
  formatting unless a specific change is requested.
- `nP.smithChart({inputTable: [reflection]})` expects frequency followed by
  real/imaginary reflection pairs; obtain `network.out('s11Re','s11Im')` into
  a variable first. Do not pass a dB-only table to a Smith chart.
- For requested discrete spectra, lineChart supports `plotType: 'bar'` and
  `barBaseline`; a dBV floor can be the baseline. dB values use a linear y-axis.
- Default mounting is handled by the plugin. Explicit mount strings are output
  keys, not DOM selectors. Do not add HTML, CSS or resize host SVGs manually.

## Optional newer device and DC capabilities

Use these only when present in the installed pin. The baseline above lacks
them. NPN/PNP use base/collector/emitter order, no hidden ground. NPN selects
2N3904 (default) or BFR93A; PNP selects 2N3906. Options: model, configuration,
bias, qPoint, temperature (K), fList; custom parameters belong in model.parameters.

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
schematicVariant:'schottky' selects the hooked-cathode symbol. Omit that field
for the ordinary symbol. D retains its existing VD=.6 V default, so choose
low Schottky bias explicitly. Legacy diode1N4148 still has its flat options,
not this model-record selector. Unless a range above says otherwise, supported
parameters are finite nonnegative numbers; an explicitly undefined value is
invalid. Use A/V/ohms/H/F/seconds, TNOM in kelvin and EG in eV. MES/HEMT B and
ALPHA, and LAMBDA, use 1/V; BETA uses A/V^2. Metadata never selects new physics.

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
The API table stays in farads. For a readable linear C-V chart, create a
separate pF display table using an explicit loop multiplying capacitance
columns by 1e12; keep VR in volts and label the y axis pF. Do not add CSS or
axis-spacing overrides to accommodate long decimal tick labels.
D's standalone default is still VD=.6 V: explicitly choose negative VD for
varactors, or supply an external bias network. The sourced fit covers reverse
0–15 V; do not treat generic forward/leakage/breakdown defaults, classical
noise/temperature laws or constant RS as measured fits. No finite fitted BV is
supplied. Direct weak IM omits quadratic remixing, compression and rectified
bias shift; this does not simulate a large-signal VCO or its phase noise.

The bundled Obsidian runtime pin lacks these varactor/C-V/package APIs.
Verify the installed runtime before writing executable calls that require them.

The plugin pin distributed with this guide lacks these object APIs. Verify
the actual installed runtime before writing these calls in an executable note.

The plugin runtime pinned with this guide lacks this object API and the BJT
constructors. Verify installed runtime support before generating these calls.

CE (default) and CC use Q `{ib:20e-6,vce:5}` for NPN, negative for PNP. CB uses
`{ie:2e-3,vcb:5}`, negative for PNP. Configuration defines DC constraints;
external wiring determines RF behavior. Curve settings are separate: CE/CC
bias.ib steps 0 to 50 uA (6 points), bias.vce sweeps 0 to 10 V (201 points),
signed for polarity. CB uses IE to 5 mA and VCB to 10 V. `q1.ivTable()` returns
curves without changing RF Q. Metadata: bias, qPoint, smallSignal, model, noise.
Noise/Taylor sources are small-signal/weak nonlinear, not universal package or
large-signal transient models.

Newer `D({model:'1N4148',qPoint:{vd:0.6},temperature,fList})` is an anode/cathode
series device. Curve default `bias:{vd:{start:0,stop:0.8,points:201}}`;
ivTable returns volts/amperes without changing RF Q. Legacy diode1N4148 is a
separate, available model using biasVoltage, temperatureK, ivStart, ivStop,
ivPoints and diode parameters. A curve is not a network DC adapter.

Newer nP bundles also support `D({model:'SMS7630',qPoint:{vd:0.05}})` and
SMS7621 per-junction Schottky records with the Schottky symbol, shared DC/RF,
classical noise and direct weak IM. D defaults remain 0.6 V with a 0–0.8 V
curve; select low bias explicitly. RS is included; package L/C, multi-junction
package wiring and calibrated detector/noise behavior are excluded.
These are D() model names, not separate constructors. The plugin runtime
pinned with this guide does not include these Schottky records. Do not
generate them for that runtime until its bundled model support is verified.

In capable bundles, diode component qPoint records report vd (anode minus
cathode), id (positive anode to cathode), junctionVoltage, junctionCurrent,
va, vk and temperature (K). Absolute va/vk may be null for a floating loop.
Read the placement record from network.operatingPoint.components; it is not
the unchanged template d1.qPoint or legacy d1.diode.bias. Both diode laws
share the estimate/refine solver with BJTs but retain their own leakage
placement, breakdown, temperature and RF/noise/nonlinearity treatment. Curves
and reused templates stay unchanged. The legacy forward Cj clamp remains
a model limitation; do not substitute it for a specialized diode model.


Newer V(volts,{fList}), default 1 V, imposes terminal 1 minus 2 equal to signed
voltage; object form V({voltage,fList}) also exists. Incremental S is open
[1,0,0,1] above zero frequency and through [0,1,1,0] at zero; S does not encode
DC voltage. It adds no RF excitation or ground. C bypass retains its RF impedance.

Where supported, network.solveDC() returns DC from the retained nodal/cascade
network: C opens, L shorts, resistive returns remain. Measurement ports/Ro add
no DC sources/loads; explicit Load() does. V() plus supported nonlinear devices
instead selects DC before RF construction, recorded in network.operatingPoint.
Standalone/RF-only parts keep fixed Q. Converged states rebuild RF instances
without mutating reusable templates; placements can have independent bias.
Read convergence, placement, terminal values and qPoint before interpreting Q.
Terminal currents enter devices; BJT qPoint.ie is outward. Floating absolute
voltages may be null. Do not invent a reference/fake Q or ignore failed bias.
Newer renderers support both D() and diode1N4148() in network DC solving;
the current plugin pin does not. Parallel emitter bypass C
preserves the resistor's DC path; changing R changes bias; series C in the only
return removes that path.

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
starting with a shunt C. Refreshed versions preserve inputs; older pins remove
endpoints. For compatibility, assign a named `filterInput = values.slice()`
first, then pass filterInput. Retain values. Use at least three finite positive
values; do not nest synthesis or copying calls in the nP constructor.
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
is in nanoseconds; use chart `metricPrefix:'none'`. This differs from the
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
connections. On bundles supporting drawing descriptions, write a named object
and pass it to `nP.schematic()`; no frequencies or numerical constructors are
needed for drawing alone. On the older pin, draw a supported constructed
network with `var drawing = nP.schematic(network)`. If the drawing cannot be
represented by available numerical parts, explain the limitation; do not
invent models or upgrade the plugin.
When both are requested, keep their connectivity consistent. A drawing object
is not another required analysis netlist, and a rendered picture proves no
numerical analysis has been performed. Do not silently add missing models or
parasitics; obtain data when needed.

## Optional newer schematic-description object and grammar

This section requires a bundle supporting drawing descriptions; the inspected
plugin pin does not. A plain drawing object contains `paths` (strings) and optional `annotations`
(records). Name it before `var drawing = nP.schematic(description)`.
For an analyzed network use `var drawing = nP.schematic(network)`.

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

This description depicts the same connectivity as the RC syntax fragment
above. Include it only if that drawing is requested and the bundle supports it:

```npjs
var description = {
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

var drawing = nP.schematic(description);
```

Annotation forms (targets must exist):

- Label: `{type:'label',node:2,label:'V1',position:'above'}`.
- Arrow toward a component: `{type:'arrow',node:2,toward:'R1',label:'I1',position:'below'}`.
- Port: `{type:'port',number:1,node:2,reference:4,side:'left'}`; reference is optional.
- Enclosure: `{type:'rectangle',around:'R1',extendTo:{node:4,segment:'bottom'},style:'dotted',padding:20}`; extension is optional.

Label/arrow positions: above/below/left/right. Annotation labels and port
numbers introduce no sources, numerical measurements or terminations.
Use only artwork present in the installed bundle. Newer bundles include V, I,
VCVS, VCCS, CCVS, CCCS artwork; only newer pins provide V() for numerical
analysis. Never emit nP.I() or dependent-source analysis calls.
V terminal 1 is positive relative to 2; I artwork points 2 to 1.
A control caption describes a drawing without creating numerical source behavior.

The plugin’s currently pinned nP bundle lacks these JFET numerical APIs and
commonSource layout. Do not emit the following calls for that bundle. Use them
only after confirming an updated plugin runtime actually supplies them.

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

The plugin's currently pinned nP bundle lacks NMOS/PMOS numerical APIs and
the new commonSource layouts. Do not emit those calls unless an updated actual
plugin runtime has been verified to provide them. The reference below describes
newer supplied bundles only.

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


The current pinned plugin bundle does NOT export MESFET. Do not emit this
numerical example in an installed vault unless that bundle is verified to
support it. The following is an updated-bundle contract only, not a request
to install or modify a plugin.

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

```npjs
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

The plugin's current pinned renderer lacks JFET/MOSFET, MESFET/HEMT and
specialized diode artwork; use these names only after confirming an updated
installed renderer.

The plugin adapter displays the SVG and returns its string in `.svg`, plus
`.graph`, `.topology`, `.error:null`. Errors can throw; no DOM or .svgText
contract/toolbar is implied. Do not alter the circuit to force a drawing.

Network shape guidance is optional: series, ladder, bridgedT,
edgeCoupledFilter, branchline, powerDivider, powerCombiner; generic fallback.
Shapes affect geometry, not connectivity/matching. Newer nP renderers add
commonEmitter, but the plugin's current pinned bundle does not provide it.
Only after confirming a newer installed renderer, it can detect the shape or
accept {shapes:['commonEmitter']}. It covers one NPN/PNP, Tee4 base junction,
two divider resistors, collector resistor/Tee, grounded V supply/Tee and two
coupling capacitors. The emitter is R to Short, sePaRC to Short, or Tee-led
separate R/C branches with a Short on each. Supply bypass is optional via
another Tee/C/Short. Newer renderers support the original source-first rail and
an R1-to-collector-Tee-to-bypass-Tee-to-V rail; preserve actual terminal assignments.
The collector Tee common branch can carry the output or
collector resistor. Other bias arrangements are outside this first board.
Do not promise this layout or NPN/PNP/V analysis on the existing plugin pin.
Nodal groups such as `{series:[[r1,1,2],[l1,2,3]]}` can guide sections in one
network; repeated groups need separate objects. Complex routing has limits;
a layout error does not establish that the electrical circuit is invalid.

Preserve topology when diagnosing layout. Never add spacer components, tuned
coordinates, SVG edits or graph postprocessing to force a picture. State a
renderer limitation and retain the working analysis. Newer renderers use shared
branch alignment, measured caption/terminal space and relational placement; do
not promise those improvements in this plugin's existing pinned renderer.

## Math and diagnosing code

`complex(real,imaginary)` exposes `.x`/`.y`. Arithmetic `add`, `sub`, `mul`,
`div`, `inv`, `neg`, `copy`, `sinhCplx`, `coshCplx` returns new values; `mag`
and `ang` return magnitude/degrees. `set`, `setR`, `setI` mutate and return the
receiver. `matrix(array)` exposes `.m`; use numeric or corresponding Cplx
methods. Inversion/solving return new matrices; `solveGaussFB()` and
`solveGaussFBCplx()` take augmented coefficient/RHS arrays.
`dim(rows,cols,initial)` shares object initials;
`dup(array)` copies rows but shares object entries. Precompute named inputs.

For requested code inspection, check the actual fence language and installed API, settings
order, units/grid alignment, port count/order, node pairing, junctions, DC
returns, selectors and display table shape. Names/titles can misdescribe code.
Make a small correction preserving intent; execute only if requested.

Useful reasoning checks: `S21=2*Ro/(2*Ro+Rtotal)` for ideal series resistance;
`abs(S21)^2` for matched transmitted power; an open Tee common branch leaves
an ideal through. An open stub needs a finite line. Emitter degeneration and a
low-impedance load can reduce S21 despite valid bias. These checks are reasoning,
not executed simulations. Deliver explicit nP code in a minimal Markdown note and a brief
accurate statement of what was written.

## HEMT/pHEMT die and package models

The pinned Obsidian bundle does NOT export HEMT. This is an updated-bundle
contract only; do not emit it for an installed vault without verifying support.

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

```npjs
nP.global.fList = [100e6, 1e9, 3e9];
var q1 = nP.HEMT({model: 'ATF35143'});
var short1 = nP.Short();
var network = nP.nodal(
    [q1, 1, 2, 3],
    [short1, 3],
    ['out', 1, 2]
);
var response = network.out('s21dB', 'NF21dB');
nP.lineTable({inputTable: [response]});
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
