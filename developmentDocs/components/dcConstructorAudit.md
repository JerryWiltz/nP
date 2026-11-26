<!-- Modified: 2026-11-26 -->
# DC constructor audit

This source-inspected inventory supports the [shared DC analysis contract](../analysis/dcAnalysis.md). Electrical constructors attach validated immutable `_dcModel` descriptors. Existing `nodal()`, `cas()` and `cascade()` preserve their component connections and child DC models. `nPort.solveDC()` implements the linear reductions/equations below. NPN/PNP, NJF/PJF, NMOS/PMOS, MESFET, HEMT and both diode adapters implement nonlinear solving and automatic DC-before-RF handoff for networks with explicit `V()` supplies. Missing physical DC laws and unsupported definitions are reported with placement paths before assembly. Existing I–V methods and 0 Hz S rows remain separate from network DC solving.

Explicit and automatic operating-point results expose a non-enumerable `.out()`
reader for device, terminal and node measurements, units and table labels.
The immutable serialized data remain compatible; charge-storage PIN qPoint adds
its already calculated bulk resistance. The reader uses the retained observation
solution for floating voltage differences without changing solve timing or stamps.
See [DC output](../analysis/dcOutput.md).

`src/np-nport/src/index.js` exports 67 functions: 61 direct components, `lpfGen()`, `nodal()`, `cascade()` and three synthesis helpers. Thus 64 return nPorts. Export-coverage tests check every export against this inventory and require each electrical result to have a validated DC descriptor. Add an explicit test fixture if a future constructor requires arguments; never silently exclude it from coverage. The `Tlin` export now uses the normal whitespace so generated symbol coverage includes it.

## Adapter classes

| Class | Meaning |
| --- | --- |
| Linear | DC equations follow from the declared circuit model; descriptors and linear stamping/reduction are implemented. |
| Nonlinear | NPN/PNP, NJF/PJF, NMOS/PMOS, MESFET, HEMT and both diode current/Jacobian adapters and RF reconstruction are implemented. |
| Composite | Preserve and compose actual child definitions and connectivity. |
| Needs model | Physical DC behavior is incomplete/unspecified; require DC data/equivalent or explicit mathematical-fixture selection. |
| Helper | Synthesis data, not an electrical component; no DC stamping. |

These classify implementation readiness. Descriptor `quality` separately identifies ideal equations, physical resistance and approximations. Below, `g` is the circuit reference and terminal currents enter the component. A shunt two-port has an ideal through connection between ports 1 and 2 plus its branch to `g`. Capture parameters directly from construction, never drawing labels.

## Basic lumped components

Source directory: `src/np-nport/src/rlc/`.

R/L/C constructors now reject nonnumeric, nonfinite and negative passive values
before RF/DC construction. Zero values retain their physical limits. Their
shared RF branch calculation preserves the DC topology below and the same
immutable descriptors; an invalid negative passive value no longer creates a
`requiresModel` placeholder. See [numeric validation](numericValidation.md).

| Constructor | Ports | Class | Planned DC behavior |
| --- | --- | --- | --- |
| `R` | 2 | Linear | Resistor `R` between 1 and 2. |
| `seR` | 2 | Linear | Same electrical adapter as `R`; preserve alias identity. |
| `paR` | 2 | Linear | Join 1–2; resistor `R` from their common node to `g`. |
| `L` | 2 | Linear | Ideal short 1–2. |
| `seL` | 2 | Linear | Ideal short 1–2; same adapter as `L`. |
| `paL` | 2 | Linear | Join 1–2 and short their common node to `g`. |
| `C` | 2 | Linear | Open 1–2. |
| `seC` | 2 | Linear | Open 1–2; same adapter as `C`. |
| `paC` | 2 | Linear | Join 1–2; capacitor-to-reference branch opens. |

## Composite lumped components

Source directory: `src/np-nport/src/rlc/`. Preserve values and internal topology even when DC reduces to a wire/open. Validate degenerate parameters before applying ideal reductions.

| Constructor | Ports | Class | Planned DC behavior |
| --- | --- | --- | --- |
| `seSeRL` | 2 | Linear | Series R–L branch between 1 and 2 becomes resistor `R`. |
| `paSeRL` | 2 | Linear | Join 1–2; shunt series R–L branch becomes resistor `R` to `g`. |
| `seSeRC` | 2 | Linear | Series R–C branch between 1 and 2 opens. |
| `paSeRC` | 2 | Linear | Join 1–2; shunt series R–C branch opens. |
| `seSeLC` | 2 | Linear | Series L–C branch between 1 and 2 opens. |
| `paSeLC` | 2 | Linear | Join 1–2; shunt series L–C branch opens. |
| `seSeRLC` | 2 | Linear | Series R–L–C branch between 1 and 2 opens. |
| `paSeRLC` | 2 | Linear | Join 1–2; shunt series R–L–C branch opens. |
| `paPaRL` | 2 | Linear | Join 1–2; shunt parallel R/L branch shorts their common node to `g`. |
| `sePaRL` | 2 | Linear | Parallel R/L branch between 1 and 2 shorts through L. |
| `paPaRC` | 2 | Linear | Join 1–2; shunt parallel R/C branch retains resistor `R` to `g`. |
| `sePaRC` | 2 | Linear | Parallel R/C branch between 1 and 2 retains resistor `R`. |
| `paPaLC` | 2 | Linear | Join 1–2; shunt parallel L/C branch shorts their common node to `g`. |
| `sePaLC` | 2 | Linear | Parallel L/C branch between 1 and 2 shorts through L. |
| `paPaRLC` | 2 | Linear | Join 1–2; shunt parallel R/L/C branch shorts their common node to `g`. |
| `sePaRLC` | 2 | Linear | Parallel R/L/C branch between 1 and 2 shorts through L. |

## Ideal connections, fixtures and transformers

Sources: `src/np-nport/src/idealComponents/` and the three `rlc/trf*.js` files.

| Constructor | Ports | Class | Planned DC behavior |
| --- | --- | --- | --- |
| `Thru` | 2 | Linear | Short 1–2. |
| `Open` | 1 | Linear | Open terminal 1 to `g`. |
| `Short` | 1 | Linear | Short terminal 1 to `g`. |
| `Load` | 1 | Linear | Resistor from 1 to `g`, equal to captured construction-time `Ro`; an explicit part, not a measurement termination. |
| `Tee` | 3 | Linear | Join all terminals; retain common/shunt branch numbering in metadata. |
| `Tee4` | 4 | Linear | Join all four terminals. |
| `Tee5` | 5 | Linear | Join all five terminals. |
| `seriesTee` | 3 | Linear | Preserve `V1 - V2 + V3 = 0` and `I1 = I3 = -I2`. Do not join all three terminals. |
| `Tlin` | 2 | Linear | Declared lossless ideal line: short 1–2, no conductor resistance. |
| `Tclin` | 4 | Linear | Short conductor 1–2 and conductor 4–3 independently. No DC connection between conductors. |
| `Attn` | 2 | Linear | Declare a matched resistive equivalent at captured `Ro`. For `t = 10^(-attenuationDb/20)` in `(0,1)`, a π equivalent has series `Ro*(1-t²)/(2*t)` and two shunts `Ro*(1+t)/(1-t)` to `g`. At 0 dB use a through short. This does not model hidden blocking capacitors in vendor hardware. |
| `Amp` | 2 | Needs model | Gain/S/noise/IP data specify neither a physical DC path nor supply current. Require an equivalent; an intentional real controlled-source fixture is an explicit separate policy. |
| `Shift90` | 2 | Needs model | Constant imaginary transmission has no real static DC relation. Require an equivalent or explicitly declared blocking path. |
| `Coupler180` | 4 | Needs model | Its real hybrid S matrix permits an optional algebraic fixture relation, not a unique physical galvanic topology. Require an equivalent or explicit algebraic-fixture selection. Preserve clockwise ports 1–2–3–4. |
| `trf` | 2 | Needs model | Mathematical fixture: `V1 = N*V2`, `I2 = -N*I1` relative to `g`. Physical winding DC needs winding resistance and return/reference data. Do not silently assume DC voltage transformation or a port-to-port short. |
| `trf4Port` | 4 | Needs model | Mathematical fixture: `V1 - V3 = N*(V2 - V4)`, currents `[I,-N*I,-I,N*I]`. Winding pairs are 1–3 and 2–4; a physical DC model needs their resistance/isolation. |
| `trfAuto` | 3 | Needs model | Center tap 1, ends 2/3. Mathematical fixture: `2*V1 = V2 + V3`, currents proportional to `[2,-1,-1]`. Physical DC behavior needs winding resistances. |

Transformer/hybrid fixture equations are algebraic inferences from the current source-defined real S matrices. They define intentionally selected mathematical models, not real magnetic steady-state DC behavior. Choose and record the policy before enabling these paths in bias analysis. Explicit equivalent models also accommodate different packaged amplifier/attenuator/coupler implementations.

## Physical microstrip components

Source directory: `src/np-nport/src/mlin/`. Preserve `.physicalModel` options/materials. Opening ideal parasitic capacitors and shorting ideal parasitic inductors must retain finite conductor/sheet resistance.

| Constructor | Ports | Class | Planned DC behavior |
| --- | --- | --- | --- |
| `mlin` | 2 | Needs model | Existing RF loss gives lossless 0 Hz transmission even for finite resistivity. Add a declared DC resistance law. A conductor-only rectangular approximation uses `rho*length/(width*thickness)` with positive thickness and ideal return plane; record omitted return/contact/spreading resistance. Finite resistivity and positive length with zero thickness need more data. Zero length or deliberately zero resistivity gives a short. |
| `mclin` | 4 | Needs model | Resolve DC resistance independently along 1–2 and 4–3, with the same thickness/return assumptions as `mlin`. Current RF equations omit physical DC conductor resistance. Do not join the conductors. |
| `mtee` | 3 | Linear | Current ideal discontinuity model joins all terminals; shunt capacitance opens. Record omitted junction/contact resistance despite material metadata. Adjacent line resistance belongs to line components. |
| `mcross` | 4 | Linear | Current ideal L/C discontinuity joins all four terminals. No crossing isolation or finite conductor resistance. |
| `mstep` | 2 | Linear | Current ideal L/C discontinuity shorts 1–2; record omitted conductor/contact resistance. |
| `mbend` | 2 | Linear | Current ideal L/C discontinuity shorts 1–2; same for both drawing variants. Record omitted conductor/contact resistance. |
| `mtfr` | 2 | Composite | Preserve resolved `filmResistor.resistance` and its temperature convention. Internal zero-resistivity lines short, leaving the series sheet resistance. Expand or use a verified equivalent; do not count that resistance twice. |
| `mvgnd` | 1 | Linear | Resistor `microstrip.Rdc` from 1 to `g`; internal via L shorts. Deliberately zero resistivity uses an ideal-short limit. |
| `mvia` | 2 | Linear | Resistor `microstrip.Rdc` between 1 and 2; barrel L shorts, pad/stub capacitances open. Deliberately zero resistivity uses an ideal-short limit. |

## Nonlinear devices

Sources: `src/np-nport/src/transistors/` and `src/np-nport/src/diodes/`. Preserve model-local temperature/parameters independently of any previous Q point.

All eleven catalog-based semiconductor constructors also accept supplied records.
Named and supplied records retain the same immutable DC definition and supported
RF handoff (NoiseDiode explicitly lacks a DC law); see [custom defaults, required values and package limits](../semiconductors/customModels.md).
The legacy diode keeps its existing flat custom-parameter options.

| Constructor | Ports | Class | Planned DC behavior |
| --- | --- | --- | --- |
| `NPN` | 3 | Nonlinear | B/C/E = 1/2/3. Fixed-VBE/constant-beta estimate, then shared Gummel–Poon currents/Jacobian. Retain RB/RC/RE and the selected package, with internal package L shorted and C opened. Named and supplied model records use the same validated immutable definition and RF handoff. Repeated placements get independent states. |
| `PNP` | 3 | Nonlinear | Same B/C/E order/engine and named-or-record model support, with signed physical voltages/currents. Entering emitter terminal current differs in sign from legacy outward `.bias.ie`. |
| `HEMT` | 3 | Nonlinear | ATF35143_DIE and ATF35143 SC-70 nominal Statz pHEMT adaptations, G/D/S with common package source pins; full contact graph retained, inductors short and capacitors/RC-CRF open for DC. Shared solve and placement handoff rebuild partitioned charge, RF and correlated noise. Positive conducting RF bias required. |
| `MESFET` | 3 | Nonlinear | N-channel Statz/MES1 SPICE reference plus Intusoft NE760 family card (no package-specific fit), G/D/S currents, RD/RS, Schottky gates; shared DC solve and intrinsic-voltage RF/noise/nonlinear handoff. Electrical temperature fixed at 300.15 K. |
| `NJF` | 3 | Nonlinear | Level-1 G/D/S JFET, signed entering currents, gate leakage and RD/RS; shared Newton solve and intrinsic-voltage RF handoff. |
| `PJF` | 3 | Nonlinear | P-channel signed counterpart with its own onsemi record; same G/D/S order and DC/RF reconstruction. |
| `NMOS` | 3 or 4 | Nonlinear | Level-1 G/D/S plus optional B. Default ties B to external S; RD/RS and body junctions remain. Shared Newton solve and three intrinsic-voltage RF handoff. A floating gate gives DC_FLOATING_BIAS. |
| `PMOS` | 3 or 4 | Nonlinear | P-channel signed counterpart, one DMP58D0SV channel. Same body contract; external body uses the equation-level primitive, not an accessible package pin. |
| `D` | 2 | Nonlinear | Anode/cathode = 1/2. Selected SPICE-style junction law and RS: 1N4148, Skyworks SMS7621/SMS7630 Schottky records, SMV1231-079LF varactor or archived BZX384-B4V7 Zener. Zener reverse breakdown reuses BV/IBV/NBV and the common per-placement handoff. The varactor package LS shorts and CP opens; supplied package values stay in the immutable record. The 1N4148 leakage resistor is outside the RS-plus-junction branch; Schottky cards specify no extra resistor. Retain supported temperature/breakdown behavior. |
| `diode1N4148` | 2 | Nonlinear | Reuse legacy current law/parameters: leakage inside the junction branch, series resistance and its own breakdown continuation. The reusable legacyDiode.js evaluator serves DC and RF without substituting the D() card or noise treatment. |
| `PIN` | 2 | Nonlinear | Default charge-storage reference: automatic bias, two PN junctions, five-section steady storage reduction, conductivity modulation, independent DC/RF/noise/IM handoff. Older SMP1307-011LF selected-region Libra-style equivalent: Anode/cathode 1/2. Forward DC: PN junction and RS plus constant VI drop; reverse DC: PN junction plus RS+RR. The region is selected before solving; RF rebuild checks its solved bias domain. Each placement retains an immutable record and independent current/RF resistance. No automatic region switching or transient storage model. |
| `NoiseDiode` | 2 | Needs model | Anode/cathode = 1/2. Fixed-bias avalanche RF/noise reference; no DC I-V law is supplied. Named and supplied records retain an immutable `requiresModel` definition. `solveDC()` rejects it with an actionable request for validated DC data; no bias voltage or per-placement RF rebuild is invented. |

## Composition and synthesis

Sources: `src/np-nport/src/combining/`, `src/np-nport/src/filters/` and `src/np-nport/src/nPort.js`.

| Constructor | Ports | Class | Planned DC behavior |
| --- | --- | --- | --- |
| `nodal` | Variable | Composite | Retain normalized component/port/node rows alongside RF results. Preserve output order, placement identity and internal-node scope. Output terminals add no DC loads. |
| `cascade` | 2 | Composite | Connect consecutive output/input terminals; preserve placements and reference convention, including its one-operand signal-copy path. |
| `lpfGen` | 2 | Composite | Expand the actual `paC`/`seL` ladder. Shunt C branches open; series L branches short. Synthesis endpoint numbers are not constructed terminating resistors. |
| `chebyLPgk` | None | Helper | Returns prototype coefficients; model the generated circuit instead. |
| `chebyLPLCs` | None | Helper | Returns element values/endpoint impedances, not physical placements. |
| `chebyLPNsec` | None | Helper | Returns a section count; no electrical terminals or stamp. |

`nPort.cas()` is an additional composition entry point, not a standalone index export. Preserve both operands' DC definitions/recipes. Bare/custom nPorts need a supplied DC model; `setspars()`/`setglobal()` cannot reconstruct it. Signal attachment through `mod()`, `demod()` or composition options does not create a bias source/termination. Digital/math/chart helpers are not electrical component constructors and have no DC stamping role.

## Numerical sources

`V()` is implemented in `src/np-nport/src/sources/V.js` as a floating two-port nPort with an immutable DC voltage-source definition. The other source drawings below still lack numerical constructors. `solveDC()` stamps the voltage constraint and source-current unknown. NPN/PNP, NJF/PJF, NMOS/PMOS, D() and diode1N4148() nonlinear solving and RF rebuilding are implemented.

| Constructor | Ports | Class | DC and incremental RF behavior |
| --- | --- | --- | --- |
| `V` | 2 | Linear | Enforce `V1 - V2 = voltage` in DC, positive terminal 1 and negative terminal 2. At 0 Hz its incremental S matrix is through; at positive frequencies `s11 = s22 = 1` and `s12 = s21 = 0`. The chosen RF model is open and adds zero noise. Neither terminal is implicitly grounded. |

These drawing names are absent from the numerical n-port export list. Their implementation is additional work, not covered by counting current RF exports.

| Drawing symbol | Required numerical behavior |
| --- | --- |
| `I` | Signed independent DC current source; separate RF equivalent/excitation. |
| `VCVS` | Oriented voltage-control/output pairs; dimensionless gain. |
| `VCCS` | Oriented voltage-control/current-output pairs; transconductance in siemens. |
| `CCVS` | Identifiable oriented control-branch current; transresistance in ohms. |
| `CCCS` | Identifiable oriented control-branch current; dimensionless gain. |

## Completion rules

Descriptors are implemented/tested for every electrical row, including actionable requirements for behavior absent from current inputs. New constructors must supply the same contract and update this inventory and its coverage tests. Recognizing `requiresModel` does not establish a physical DC law. `solveDC()` reports every missing or unsupported nonlinear model before solving; never skip an unsupported component because it lies outside a guessed bias path.

Check coverage against actual exports whenever constructors change. Verify reductions against hand calculations, declared model limits or independent simulator references. Check terminal order/signs for series junctions, transformers and coupled lines: a finite matrix alone does not establish correct DC topology.

## Weak RF-to-DC response

`rectify()` is an nPort method rather than another electrical constructor. It
uses the same immutable descriptors and retained placements, solves RF-off DC
even without V(), then solves a second-order increment from D() junction
currents. Existing solveDC and automatic supply-bias behavior are unchanged.
Other nonlinear families and requiresModel leaves reject; external RF ports
add no DC loads. See [rectification](../analysis/rectification.md).
