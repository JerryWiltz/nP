<!-- Modified: 2026-11-17 -->
# Bipolar transistor models

`nP.NPN()` and `nP.PNP()` return three-port RF networks and DC curve-tracer tables from one shared bias-dependent model. NPN supports **2N3904** (default) and **BFR93A**; PNP supports **2N3906** (default). Ports are **1 base, 2 collector, 3 emitter**, each referenced to the selected context's `Ro` (normally 50 Ω). SPICE Q-instance order is collector, base, emitter; the implementation translates it explicitly.

## Curve tracer and fixed RF operating point

```js
// NPN curve tracer and common-emitter RF analysis
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
var fixedBias = q1.bias;
var rf = amplifier.out('s11dB', 's21dB');
var stability = amplifier.out('K', 'deltaMag');
var noise = amplifier.out('NF21dB', 'noiseFloor');

nP.lineChart({inputTable: [curves], metricPrefix: 'none',
    title: '2N3904 curve tracer', xAxisTitle: 'VCE (V)', yAxisTitle: 'IC (A)'});
nP.lineChart({inputTable: [rf], metricPrefix: 'mega', title: 'Common-emitter RF'});
nP.log(fixedBias);
```

`bias` controls the curves. `qPoint` explicitly selects the fixed DC operating point for **every RF frequency**. `ivTable()` never moves it. Select another point by constructing another NPN with the desired `qPoint`; clicking a curve does not automatically rebias the device. The sweep table is generated when requested rather than stored redundantly in each RF component.

`NPN()` with no options uses the defaults above. Frequencies come from the current `global.fList`, initially `[2e9]`, just as for `R()`. Options-level `fList` overrides it. Partial nested settings retain defaults: `qPoint: {ib: 30e-6}` keeps `vce: 5`; `bias: {vce: {points: 51}}` keeps 0–10 V. Temperature defaults to `global.Temp` in kelvin (293 K in a new context).

These are the NPN defaults; the PNP signed equivalents are described below.

| `configuration` | Horizontal sweep | Stepped family | Vertical result | Default Q point |
| --- | --- | --- | --- | --- |
| `commonEmitter` | Positive `vce`, 0–10 V, 201 points | `ib`, 0–50 µA, 6 points | `ic` in A | `ib: 20e-6, vce: 5` |
| `commonBase` | `vcb`, 0–10 V, 201 points | Outward `ie`, 0–5 mA, 6 points | `ic` in A | `ie: 2e-3, vcb: 5` |
| `commonCollector` | Positive `vce`, 0–10 V, 201 points | `ib`, 0–50 µA, 6 points | Outward `ie` in A | `ib: 20e-6, vce: 5` |

Common collector retains positive VCE rather than silently changing to VEC. Common base accepts negative VCB to inspect the knee. IB and IC enter the device; reported IE leaves it, so `ie = ib + ic`. IC can become slightly negative near VCE = 0 in saturation; it is not clipped.

`ivTable()` returns a header row followed by numeric rows: one voltage column and one current column per stepped curve. Overrides use the same fields, for example `q1.ivTable({ib: {points: 3}, vce: {points: 51}})`. Each call returns new arrays and preserves the fixed RF data and caller's options.

`configuration` defines the DC family and constraints. It **does not ground an RF terminal**. Wire the three-port with `nodal()`: short emitter for CE, base for CB, or collector for CC. RF bypass and matching networks can replace that ideal short. A general DC solution through those external components is future work.

## PNP uses the same API with signed bias

```js
// PNP defaults: a 2N3906 with negative base current and VCE
var q1 = nP.PNP({
    model: '2N3906',
    configuration: 'commonEmitter',
    bias: {
        ib: {start: 0, stop: -50e-6, points: 6},
        vce: {start: 0, stop: -10, points: 201}
    },
    qPoint: {ib: -20e-6, vce: -5},
    temperature: nP.global.Temp
});
var curves = q1.ivTable();
```

`PNP()` with no arguments supplies these defaults and the current frequency list. The names, units, three RF terminals, partial-default merging and returned API match NPN. Values are physical signed quantities: IB and IC enter the device, so both are negative for a forward-active PNP. The library reports outward IE, which is also negative because current enters the emitter. VBE, VCE and reverse-biased VCB are negative. Sweep endpoints run from 0 toward negative values; table rows retain that sweep order and all currents stay in amperes.

PNP `commonBase` uses `bias.ie` from 0 to −5 mA and `bias.vcb` from 0 to −10 V; its default Q point is `ie: -2e-3, vcb: -5`. `commonCollector` keeps negative IB/VCE and reports negative outward IE. RF configuration still comes from external wiring. No terminal is silently grounded and no magnitude-only sign conversion is hidden in the returned data.

`NPN.js` and `PNP.js` are thin entries into `bjtConstructor.js`. `bjtModel.js` shares SPICE defaults and model-record validation. The current/charge engine solves normalized forward-bias coordinates; PNP reverses the terminal voltages and currents. For polarity p = ±1, physical current or charge follows:

\[
F_p(v) = p F_n(pv)
\]

Consequently a Taylor coefficient of total degree n scales by p^(n+1). PNP reverses the DC and quadratic coefficients while preserving the linear and cubic coefficients. This matters for IM2 phase and mixed current/charge terms; replacing the NPN arrow alone would not implement a PNP model. Tests explicitly check these source polarities and all nine S entries.

## Published parameter records

| Part | Source | Package coverage |
| --- | --- | --- |
| 2N3904 | [Fairchild datasheet SPICE card](https://media.digikey.com/pdf/Data%20Sheets/Fairchild%20PDFs/2N3904.pdf); ISE's femtoampere unit cross-checked against the [OUP/PSpice listing](https://learninglink.oup.com/protected/files/content/file/1574079180264-SedraSmith8e_SPICE_Problem_Guide_AppendixB.pdf) | RB = 10 Ω, RC = 1 Ω. No explicit TO-92 lead L or package C. Manufacturer XTF = 2 is retained. |
| BFR93A | [Philips/NXP SPICE subcircuit](https://www.nxp.com/downloads/en/spice-model/BFR93A_SPICE.prm), September 1995, BFR91A die model version 1.0, February 1992 | Exact five-inductor, three-capacitor SOT23 network; RB = 10 Ω, RC = 9 Ω, RE = 0.763636 Ω. |
| 2N3906 | [Fairchild PNP datasheet SPICE card](https://www2.ensc.sfu.ca/reference/data-sheets/2N3906.PDF), including VTF = 4 | RB = 10 Ω, RC = 2.5 Ω. No explicit TO-92 package L/C network. |

`.model` identifies the part, manufacturer, material, structure, model/version, source, nominal temperature and package coverage. A card does not represent every manufacturer's variant or every package. All three cards have constant RB; BFR93A's published RBM equals RB, so IRB has no effect. None supplies a calibrated flicker-noise coefficient; KF defaults to zero.

## Shared DC and charge equations

The engine uses SPICE level-1 modified Gummel–Poon equations: forward/reverse transport, base leakage/recombination, forward/reverse Early effects, high-current rolloff and terminal resistances. Curve families are not constructed by multiplying IB by a constant beta.

For intrinsic junction voltages, thermal voltage and transport currents are:

\[
V_T = k_B T/q
\]

\[
I_F = I_S\left(e^{v_{be}/(N_F V_T)}-1\right)
\]

\[
I_R = I_S\left(e^{v_{bc}/(N_R V_T)}-1\right)
\]

\[
q_1 = \left(1-v_{bc}/V_{AF}-v_{be}/V_{AR}\right)^{-1}
\]

\[
q_2 = I_F/I_{KF}+I_R/I_{KR}
\]

\[
q_b = \tfrac12 q_1\left(1+\sqrt{1+4q_2}\right)
\]

\[
I_{BE} = I_F/B_F+I_{SE}\left(e^{v_{be}/(N_E V_T)}-1\right)
\]

\[
I_{BC} = I_R/B_R+I_{SC}\left(e^{v_{bc}/(N_C V_T)}-1\right)
\]

\[
I_B = I_{BE}+I_{BC}
\]

\[
I_C = (I_F-I_R)/q_b-I_{BC}
\]

\[
I_{E,\mathrm{out}} = I_B+I_C
\]

Terminal resistances relate these intrinsic voltages to external bias:

\[
V_{BE} = v_{be}+R_B I_B+R_E I_{E,\mathrm{out}}
\]

\[
V_{CE} = v_{be}-v_{bc}+R_C I_C+R_E I_{E,\mathrm{out}}
\]

A damped Newton solve enforces IB/VCE for CE and CC, or outward IE/VCB for CB. It limits voltage steps and checks current and voltage residuals. Sweep continuation runs from high voltage into saturation. Convergence failures report the requested bias instead of returning a guessed point.

IS, leakage, beta, junction potentials and zero-bias capacitance receive SPICE temperature scaling. Terminal R and package L/C have no invented temperature coefficients. Equations were checked against the [ngspice BJT implementation](https://github.com/ngspice/ngspice/tree/master/src/spicelib/devices/bjt). This is an independent JavaScript model, not a SPICE text parser.

Depletion capacitance below FC × Vj follows:

\[
C_j(v) = C_{j0}(1-v/V_j)^{-m}
\]

Its integral supplies charge; a forward-bias continuation preserves charge and capacitance continuity. Forward diffusion charge includes TF/XTF/VTF/ITF bias dependence; reverse diffusion charge uses TR. Terminal currents and charges sum to zero.

## RF, noise and nonlinear data flow

1. `NPN.js` or `PNP.js` selects the device type and model resolver. `bjtConstructor.js` validates settings, supplies signed defaults and solves the standalone fixed Q point. Its shared instance builder also accepts an already solved intrinsic state through an internal adapter, without rerunning the fixed-current bias solver.
2. `gummelPoon.js` evaluates current and charge equations using `taylor.js`, a two-variable polynomial through degree three. Coefficients are derivatives divided by factorials.
3. `bjtRf.js` stamps first derivatives, terminal resistances and the package into a small complex modified nodal system. Zero resistance merges nodes exactly. Each package inductor adds a branch-current unknown and the voltage equation `Va - Vb - jωL I = 0`, which also enforces its short at DC. This avoids the large `1/(jωL)` admittances that caused numerical cancellation near DC. Three external matched loads establish the RF reference without grounding an intrinsic terminal.
4. Exciting each external port produces all nine S entries. The same inverse matrix transfers internal noise and weak nonlinear sources to outgoing waves.
5. `nodal()`, `cas()` and `cascade()` capture the complete DC topology first. With an explicit `V()` supply and nonlinear devices, they solve coupled DC bias, rebuild independent transistor instances, and then combine RF/noise/intermodulation data. The solved data is exposed as `.operatingPoint`. RF-only networks preserve fixed-Q behavior.

`.bias` and `.qPoint` report IB, IC, outward IE, terminal voltages, intrinsic VBE/VBC, temperature and configuration. Standalone DC terminal voltages use emitter zero as reference. An internal handoff can supply a finite absolute emitter voltage, or `null` when the absolute reference is undetermined; junction/terminal voltage differences and currents remain defined. `.smallSignal` reports `gm`, `gpi`, `gmu`, `go`, `cpi`, `cmu`, `cbeCross`, `rb`, `rc`, `re` in SI units. These come from the same equations, not a second independent fit.

The intrinsic hybrid-π conductances satisfy `dIB = gpi dVbe + gmu dVbc` and `dIC = (gm + go) dVbe - (go + gmu) dVbc`. Thus `go = -∂IC/∂Vbc - gmu` and `gm = ∂IC/∂Vbe - go`, with the other intrinsic junction voltage held fixed for each partial derivative. The `gmu` correction matters in saturation; it is negligible at the forward-active reference points. These definitions apply to both NPN and signed PNP coordinates. Terminal resistances and package elements are included separately in the RF system.

The active noise model uses independent base/collector shot sources, `2q|IB|` and `2q|IC|` A²/Hz, and resistor thermal sources `4kBT/R`. Their transferred outer products produce the full Hermitian three-port noise-wave covariance in W/Hz. Shared sources therefore create correlations between external ports. This is the classical shot/thermal approximation; it has no fitted high-frequency induced-noise correlation or measured optimum-noise model. Zero KF does not mean the real device has no excess low-frequency noise.

The internal operating-point handoff is documented in [dcAnalysis.md](dcAnalysis.md#internal-operating-point-handoff). It evaluates current/charge derivatives afresh at signed intrinsic VBE/VBC, then rebuilds all RF/noise/Taylor data with a fresh frequency cache. Placement paths distinguish reused templates and nested networks. The nonlinear network solver now supplies those states automatically before RF combination when an explicit DC supply is present. It first estimates with fixed VBE/constant beta, then refines with the shared nonlinear current/Jacobian engine and reports any source stepping. See the [external divider-bias example](np-nport/constructorCatalog.md#external-transistor-bias). Diode network DC adapters remain future work.

Set two-tone settings before the transistor and dependent parts:

```js
// NPN direct weak nonlinear estimates
var g = nP.global;
g.fList = g.fGen(10e6, 100e6, 11);
g.twoTone = {spacingHz: 1e6, p1dBm: -70, p2dBm: -70};
var q1 = nP.NPN({model: 'BFR93A', qPoint: {ib: 20e-6, vce: 5}});
var short = nP.Short();
var amplifier = nP.nodal(
    [q1, 1, 2, 3],
    [short, 3],
    ['out', 1, 2]
);
var intercepts = amplifier.out('OIP2sum21dBm', 'OIP3lower21dBm');
nP.lineChart({inputTable: [intercepts], metricPrefix: 'mega', title: 'Model output intercepts'});
```

Embedded fundamental VBE/VBC phasors drive all quadratic/cubic current and charge terms. Charge becomes current through jω. Product-frequency sources propagate through the connected RF circuit, with explicit RMS/Fourier scaling. No fixed IP value is assigned to a part.

This implementation computes **direct Taylor products**. It omits quadratic-product remixing into third order, a complete Volterra solution, compression, clipping and harmonic balance. Its IP2/IP3 values are estimates under that approximation, not measured specifications. Keep tones small. The two-tone product grid and existing frequency-coincidence restrictions still apply.

## Stability of the completed two-port

\[
\Delta = S_{11}S_{22}-S_{12}S_{21}
\]

\[
K = \frac{1-|S_{11}|^2-|S_{22}|^2+|\Delta|^2}{2|S_{12}S_{21}|}
\]

Every two-port exposes `.stability` rows `{frequency, K, deltaMag, unconditionallyStable}` and `.out('K', 'deltaMag')`. Values are calculated from its current S-parameters; component K values are never combined. Intermediate K < 1 is allowed. A bare three-port has no K dataset. The unconditional test requires K > 1 **and** |Δ| < 1, using the [standard two-port criterion](https://www.keysight.com/hk/en/assets/7018-03364/application-notes/5990-9974.pdf). A unilateral limit can give infinite K; 0/0 stays NaN and does not pass the test. This does not test large-signal or DC stability.

## Independent checks and limits

The reference decks `test/fixtures/npn-2n3904.cir` and `npn-bfr93a.cir` were run in ngspice 39.3. Run copies in a temporary directory; `.control` writes DC and three AC excitation files. With 1 A Norton excitation at each 50 Ω port, `Sij = 2 × Vi / 50 − δij`. Coupling capacitors and bias-feed inductors separate DC constraints from RF loads; their small residual RF impedance is covered by the 1e-6 absolute S comparison tolerance.

At IB = 20 µA, VCE = 5 V, 300.15 K, reference IC is **3.174504 mA** for 2N3904 and **1.624672 mA** for BFR93A. All nine complex S entries agree within 5e-7 at 10 MHz, 100 MHz and 1 GHz. The adjacent `*-noise.cir` decks verify CE noise figure with a 50 Ω source and noiseless matched load; agreement is within 3e-6 dB at those frequencies. Temperature checks at 330 K also agree for IC and capacitances. Tests cover bias/sweep ownership, CE/CB/CC polarity, saturation and Early slopes, derivatives, charge conservation, floating-port wave sums, noise covariance, circuit embedding, two-tone slopes and final-network K.

The cards do not define avalanche breakdown, self-heating, safe operating area or substrate behavior. The 2N3904 card lacks an explicit package L/C model. A computed 2 GHz default row does not guarantee useful gain or manufacturer-validated accuracy at that frequency. General DC circuit analysis and nonlinear transient simulation are outside this constructor.

`test/bjt-linearization.test.js` checks the exposed hybrid-π conductances against finite differences of all three DC terminal currents in saturation and forward-active bias for both NPN cards and the PNP card. BFR93A checks cover cutoff, forward-active and saturated bias from DC through 1 Hz, including 1 pHz and 1 µHz: S rows and noise remain continuous toward DC, row/column sums preserve the floating three-terminal network, and noise covariance remains Hermitian.

The browser harnesses are [dev/npn.html](../dev/npn.html) and [dev/pnp.html](../dev/pnp.html). Numerical calculations need no DOM, clipboard, canvas or network access. Both constructors are exported by the restricted plugin bundle; adopting them in Obsidian requires the usual separate vendor-bundle update.

## Schematic orientation

The canonical NPN symbol has base left, collector above right and emitter below right. Its `automatic` metadata in `schematics/runtime-symbol-layout.json` keeps that orientation in generic network drawings. ORI uses the same metadata to put an attached one-port termination along its terminal's outward lead, rather than in a new signal-flow column. External input/output ports face left/right through orthogonal wire boxes. For CE this gives a collector output above the symbol and a short directly below the emitter. CB and CC retain their actual terminal assignments. Explicit drawing-language rotations and mirrors remain available.

This is a shared generic-board placement rule, not hand-coded NPN circuit coordinates. Its implementation is in `schematicBoardGraph.js`; its preferences travel with the canonical symbol through the generated runtime bundle. Tests cover both model names, reordered nodal rows, arbitrary node numbers and the CE/CB/CC connections.

PNP uses the same canonical terminal positions and placement preferences, with an inward emitter arrow. The shared ORI rules therefore also keep its emitter short local without additional device-specific layout code. PNP SPICE reference decks are `test/fixtures/pnp-2n3906.cir` and `pnp-2n3906-noise.cir`. At −20 µA IB, −5 V VCE and 300.15 K, reference IC is approximately −4.251348 mA. DC, all nine RF entries and CE noise figure are checked independently against ngspice 39.3. The same model limits and direct Taylor intercept approximation apply to PNP.
