# nP Obsidian code-writing agent
<!-- Modified: 2026-11-18 -->

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
bias, qPoint, temperature (K), fList; no invented beta/SPICE parameter options.
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
Newer network diode adapters remain unsupported. Parallel emitter bypass C
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

The plugin adapter displays the SVG and returns its string in `.svg`, plus
`.graph`, `.topology`, `.error:null`. Errors can throw; no DOM or .svgText
contract/toolbar is implied. Do not alter the circuit to force a drawing.

Network shape guidance is optional: series, ladder, bridgedT,
edgeCoupledFilter, branchline, powerDivider, powerCombiner; generic fallback.
Shapes affect geometry, not connectivity/matching. There is no amplifier shape.
Nodal groups such as `{series:[[r1,1,2],[l1,2,3]]}` can guide sections in one
network; repeated groups need separate objects. Complex routing has limits;
a layout error does not establish that the electrical circuit is invalid.

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
