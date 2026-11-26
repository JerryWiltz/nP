<!-- Modified: 2026-11-26 -->
# Shared circuit description and DC operating-point analysis

This is the contract for circuit-derived bias in nP. The shared immutable DC descriptors and topology preservation within `nodal()`, `cas()` and `cascade()` are implemented. These existing composition APIs are the public network entry points. `network.solveDC()` solves linear, NPN/PNP and diode nonlinear DC models without a second netlist. Networks containing an explicit `V()` supply and nonlinear devices automatically solve DC before RF combination; supported transistor and diode states pass through the internal RF handoff. The result is exposed as `network.operatingPoint`. Standalone constructors and RF-only networks retain their selected fixed Q points. Both D() and diode1N4148() retain their own device equations, temperatures and leakage placement. Missing physical DC laws remain explicit errors.

The [constructor audit](../components/dcConstructorAudit.md) covers every export from `src/np-nport/src/index.js`, plus `nPort.cas()`, custom nPorts and the source symbols that need numerical constructors. The [constructor catalog](../components/constructorCatalog.md) describes the current public API.

## Decisions

1. Describe the circuit once, using the component/port/node relationships already expressed by `nodal()` and `cascade()`.
2. Give every electrical constructor a DC model or an explicit requirement for additional DC information. Missing support is an error, never an implicit open or short.
3. At DC, external ideal capacitors open and external ideal inductors short. Preserve resistances that remain in composite or physical components.
4. Estimate device bias with a simple device approximation, then refine with the existing nonlinear equations.
5. Build RF, noise and weak nonlinear data from the converged device states, using one consistent final device model.
6. Preserve fixed-Q constructors and existing RF composition behavior. An explicit DC supply selects circuit-derived bias for nonlinear networks before RF combination.

## Current implementation boundaries

`combining/nodalConnections.js` normalizes component rows, output nodes and drawing groups. `nodal.js` first captures an immutable `_dcModel` connection descriptor. `dcBias.js` checks for a DC supply and nonlinear devices, solves qualifying networks and hands solved states to their RF builders before nodal RF matrices are computed. `nPort.cas()` retains both child DC models and their connections, and `cascade()` delegates to it. `solveDC()` consumes these DC descriptors; drawing and intermodulation metadata are not DC model definitions.

The RF connection matrix pairs wave ports. DC analysis must use node membership and KCL rather than interpret that matrix as a general DC incidence matrix. Preserve explicit junctions in RF examples; extending RF multiway-node semantics is outside this change.

Do not reconstruct electrical values from drawing symbols, labels or `_schematic`. Do not infer physical DC behavior by evaluating or extrapolating `.spars` at 0 Hz. Existing 0 Hz rows provide comparison cases where a model has a declared DC limit. Some physical models omit DC resistance, and some fixtures specify no physical bias path.

## Component contract

Each electrical constructor attaches an internal `_dcModel` descriptor distinct from public transistor/diode `.dc` curve settings. Shared helpers validate, copy and deeply freeze the data. `_dcModel` is an internal interface, not an extra option accepted by existing constructors.

| Field | Contract |
| --- | --- |
| `version` | Integer schema version, initially 1. |
| `constructorName` | Exact public constructor name, preserving aliases for diagnostics. |
| `portCount` | Number of public electrical terminals; agrees with the RF boundary. |
| `kind` | `linear`, `nonlinear`, `connection` or `requiresModel`. |
| `quality` | `ideal`, `physical`, `approximate`, `composite` or `unspecified`. Describes the equations, not manufacturer validation. |
| `definition` | Resolved model data or child circuit, including terminal mapping and internal nodes. |
| `reason` | Required for `requiresModel`: missing information and how to supply it. |
| `analysis` | Snapshot of `Ro`, `Temp`, `fList`, `tList` and `twoTone`; never an implicit DC load. |

For example:

```js
// Internal descriptor shape, abbreviated to omit the analysis context.
{
    version: 1,
    constructorName: 'R',
    portCount: 2,
    kind: 'linear',
    quality: 'ideal',
    definition: {
        modelId: 'lumped',
        terminals: [1, 2],
        parameters: {resistance: 75},
        placement: 'series',
        arrangement: 'series',
        elements: [{type: 'resistor', terminals: [1, 2], resistance: 75}],
        joins: []
    }
}
```

Definitions contain copied, resolved SI parameters, model identity/provenance, local temperature and required material/geometry data. Named model-adapter modules translate definitions into equations. Do not put executable source strings or duplicate nonlinear equations into descriptors. New model identifiers need validation, a terminal map and an audit entry.

`dcModel.js` validates version/kind, terminal boundaries and the supported definition types; `physicalDcModel.js` supplies the physical-component descriptors. Supported model identifiers are `lumped`, `junction`, `attenuator`, `series-junction`, `linear-constraints`, `voltage-source`, `bjt`, `diode`, `legacy-diode`, `connection` and `unspecified` for missing models. Stored definitions contain no solver callbacks. SPICE cards retain meaningful `Infinity` defaults, so these snapshots support structured data transfer but are not a lossless JSON interchange format.

Definitions must accommodate resistive/open branches, ideal connections, linear multiport constraints, independent/dependent sources and nonlinear current/Jacobian evaluation. Zero resistance becomes a connection. Negative or nonfinite resistance needs a separately declared active model or a validation error. Report eliminated or nonunique ideal-wire currents explicitly rather than inventing them.

`requiresModel` is a recognized capability, not completed numerical support. Before solving, report every such placement with its constructor, instance path, reason and required information. A user-supplied DC equivalent may resolve it; validate terminal count, units, orientation and approximation, and retain that choice in the result.

## Terminals and reference

- Keep public terminal numbers. NPN/PNP ports 1/2/3 are base/collector/emitter; diode ports 1/2 are anode/cathode.
- Terminal currents enter the component. Convert the existing BJT outward `.bias.ie` explicitly when reporting uniform terminal currents.
- Branch voltage is `Va - Vb`; positive branch current flows from `a` to `b`.
- The circuit reference is explicit. `Short()` and grounded/shunt models connect to it. An ordinary existing nodal label `0` must not silently acquire grounding semantics. A future reference-node option must be explicit.
- Unreferenced bias islands require a diagnostic or a documented gauge choice if only absolute voltage is undetermined. Do not silently ground another transistor terminal.
- Output/measurement ports add no DC loads. `global.Ro`, incident RF signals and noise-termination settings are not DC sources or resistors.
- An explicitly constructed `Load()` does represent a resistor to reference equal to captured construction-time `Ro`. `Attn()` also uses captured `Ro` to define its nominal matched resistor equivalent. Later RF measurement-reference changes do not change those resolved resistances.

## Shared topology and placement identity

The connection descriptor contains child component definitions, ordered terminal-to-node assignments, external terminal order and optional presentation groups. `lpfGen()` and `mtfr()` also retain resolved construction parameters under `definition.construction`. RF S/noise rows are analysis products, not inputs to this description. Runtime RF construction recipes now support internal NPN/PNP reconstruction. These recipes retain executable RF objects/functions separately from the immutable data-only DC definitions; there is no public rebuild method.

Allocate a unique instance path for every placement, including repeated use of one JavaScript component object. Two placements of an NPN template can solve at different biases. Scope internal nodes and device states to the instance path. Copy resolved constructor settings and analysis context so later changes to caller-owned options or `global` cannot alter the captured circuit.

| Construction path | Required preservation |
| --- | --- |
| `nodal()` syntax | Original node identities, ordered component terminals, output-terminal order and distinct placement paths. Flatten drawing groups without changing electrical identity. |
| `nPort.cas()` | Both operands, left port 2 connected to right port 1, two external ports and shared reference convention. |
| `cascade()` | Every operand placement; preserve descriptions/recipes on its one-operand signal-copy path too. |
| `lpfGen()` | Actual child ladder and connections. Synthesis endpoint impedance numbers are not automatically DC terminating resistors. |
| Nested networks | Map child public terminals to parent nodes, namespace internal nodes and preserve reference requirements. |
| Custom nPort | Supplied DC model or actionable missing-model error, even when S data contain 0 Hz. |

The common reference in existing RF compositions remains common through nested blocks; do not make a separate floating reference inside every child. Additional floating returns must be real public terminals or require a richer boundary, never a hidden extra connection behind a two-port label.

`nodal()` requires RF components with matching frequency rows and the same positive, finite reference impedance. Wire labels must occur exactly twice, with each output label paired to one component terminal. Connection validation runs before DC inspection, automatic bias solving and RF assembly; `cas()` and `cascade()` also validate construction contexts before bias solving. Its internal `_dcModel` preserves the same component rows, output nodes and drawing groups for DC analysis. `cas()` and `cascade()` preserve equivalent connection descriptors. Users construct each network once with these existing APIs.

Each placement has a local `id` such as `p1`; concatenate parent/child IDs to obtain a unique instance path. Internal `dcRequirements()` traverses the retained definitions to report missing models with placement paths, constructor names, terminal counts and reasons. These helpers are internal implementation details, not public network constructors. Node labels are strings or finite numbers, and output nodes remain observations. `solveDC()` solves supported linear, BJT and diode definitions; unsupported definitions and missing-model placements produce explicit errors before matrix assembly.

## Linear reduction and equations

Open external ideal capacitors and short external ideal inductors in the DC graph. An opened shunt capacitor leaves a through connection; an opened series capacitor interrupts it. A shorted shunt inductor grounds the through node. Reduce composite RLC definitions by their actual internal topology, retaining each resistor that remains in the DC circuit. Track eliminated branches for diagnostics.

Physical components retain finite DC resistance. Existing via models calculate `Rdc`, and the film resistor calculates a temperature-dependent resistance. Do not turn a whole via into an ideal short because it contains inductance. The audit identifies line models needing a separate DC conductor-resistance law.

Use real modified nodal equations for node voltages and necessary branch currents. A resistor gives `I = (Va - Vb)/R`. Voltage sources add voltage constraints and source-current unknowns. Zero-volt sources remain valid current-sensing branches.

Keep linear constraints implicit when converting to impedance/admittance would be singular. A deliberately declared **real DC** multiport at equal resistance `Rref` can use:

```text
(I - Sdc) v - Rref (I + Sdc) i = 0
```

This supports explicitly supplied algebraic DC models; it does not authorize arbitrary RF S data as physical DC behavior. Validate dimensions, finite coefficients and reference metadata. Complex phase fixtures need a real DC equivalent. Ideal transformers/hybrids need a declared mathematical-fixture policy or physical winding/DC-path data; do not silently merge their ports.

## Sources

`V()` is implemented as a two-port nPort in `src/np-nport/src/sources/V.js`. `I`, `VCVS`, `VCCS`, `CCVS` and `CCCS` still have drawing support only. Numerical source definitions belong outside transistor directories. Drawing text alone does not create an electrical source.

`V(voltage = 1, options)` or `V({voltage: 1, fList})` stores a finite signed voltage in volts. Its `voltage-source` DC definition has oriented terminals 1 and 2 and imposes `V1 - V2 = voltage`; no terminal is implicitly grounded. The public `.source` metadata reports the value, polarity and the chosen RF/noise model. Descriptor values are separate immutable snapshots.

The supply convention is through incremental S at 0 Hz and an open at every positive frequency: `s11 = s22 = 1`, `s12 = s21 = 0`. Terminating a tee branch with `V()` then leaves an ideal through connection between the other two tee ports. Removing that tee/V/short branch and reconnecting its through path leaves all four positive-frequency S-parameters unchanged. An external bypass capacitor still supplies its own RF impedance. This convention represents an ideal DC feed isolated from RF, rather than the incremental short of a conventional ideal voltage supply. The source adds zero noise through explicit covariance rows.

The through 0 Hz S row alone does not generate a DC voltage. The nonzero excitation is the separate DC constraint, stamped by `solveDC()` along with a source-current unknown. `nodal()` propagates incremental S/noise after automatic DC bias solving in networks with supplies and nonlinear devices. Purely linear networks can use the explicit `.solveDC()` method. Neither path inserts a supply voltage into `.signal`.

| Planned primitive | DC contract |
| --- | --- |
| Independent voltage | `Va - Vb = Vdc`, volts; retain its source-current unknown. |
| Independent current | Specified signed current from `a` to `b`, amperes. |
| VCVS | `Vout = gain * Vcontrol`; oriented output/control pairs, dimensionless gain. |
| VCCS | `Iout = transconductance * Vcontrol`; oriented pairs, gain in siemens. |
| CCVS | `Vout = transresistance * Icontrol`; an identifiable oriented control branch, gain in ohms. |
| CCCS | `Iout = gain * Icontrol`; an identifiable oriented control branch, dimensionless gain. |

Separate DC values from RF excitation and internal impedance. A conventional ideal DC voltage supply is zero incremental voltage in RF; the current `V()` instead uses the explicitly selected open positive-frequency convention described above. An ideal current supply is zero incremental current only when its declared RF equivalent is an open. Preserve explicitly modeled source impedance and bias-feed networks. An RF signal's DC spectral bin is not automatically a bias source.

## Implemented linear solve

Call `network.solveDC()` with no arguments on an existing nPort. The method returns a new deeply frozen result with serializable data and a non-enumerable `.out()` reader. It reads only validated DC descriptors; it never reads S entries, uses `Ro` as a measurement load, changes global settings, modifies RF/noise/signal data or overwrites transistor/diode `.dc` curve settings. `reference: 'g'` denotes the common reference of explicit grounded models, not a user node named `0` or `'g'`.

Explicit and automatically solved results share
`dc.out('vgs', 'vds', 'idmA', {component: q1, label: 'Q1'})` for device tables and
`dc.out('v12', 'i1mA', {component: r1})` for terminal measurements. Node selection
uses `dc.out('voltage', {node: 3})` or `{nodes: [positive, negative], path: ''}`.
Units, labels and fresh table rows belong to the reader; raw data, solve timing
and placement bias handoff remain unchanged. Undetermined values display as text
while raw nulls remain intact. JSON/structured clones carry data without methods.
See [DC output](dcOutput.md) for selectors, units, identity and floating differences.

`dcSolver.js` expands nested connection descriptors into placement-scoped nodes. Zero-volt interfaces retain nested-block terminal currents and keep repeated use of the same component template independent. Supported adapters are `lumped`, `junction`, `voltage-source`, `attenuator`, `series-junction` and `linear-constraints`. R branches retain resistance; external C branches open; external L and zero R branches impose zero voltage. Attenuators use their declared real DC voltage/current constraints, including 0 dB, without singular impedance conversion. Physical via and film resistances remain finite. Approximate model omissions appear in diagnostics.

The solver assembles real modified nodal equations with branch-current unknowns. `dcLinearSystem.js` copies the system, equilibrates rows and columns, uses complete-pivot elimination and retains a null-space basis. This differs from the general matrix solver because it must distinguish determined observations from undetermined voltages/currents in a rank-deficient system. It adds no numerical shunt conductance or hidden reference. A particular solution is used internally for residual checks, while every reported value is tested for independence from the null space.

| Result field | Meaning |
| --- | --- |
| `kind`, `method`, `converged` | `'dc-operating-point'`, `'linear'` or `'nonlinear'`, and `true` after residual checks. |
| `model` | Immutable construction-time DC definition and analysis context. |
| `nodes` | `{path, node, internal, voltage}`; path `''` identifies the root netlist. Strings and numbers remain distinct labels. |
| `ports` | External RF port order, root node label, DC voltage and zero entering DC current. Measurement ports add no load. |
| `components` | Placement path, constructor/model identity, quality, terminal voltages/currents and primitive element voltage/current/reduction records. Paths include nested components, such as `p5/p1`. |
| `diagnostics` | Floating node voltages, nonunique branch/terminal currents and approximate-model omissions. |
| `residuals` | Maximum KCL residual in amperes and maximum scaled equation residual. |
| `linearSystem` | Rank and number of unknowns. |

Voltages are volts; currents are amperes entering the numbered terminal. Element current enters the first listed element terminal. A delivering positive voltage source normally has a negative port-1 current. Absolute voltages without a reference are `null` with `floating-node` diagnostics. Uniquely determined differences and currents are still returned. Nonunique currents in ideal loops or parallel identical voltage sources are `null`, with `indeterminate-current` diagnostics; they are never silently divided equally. Capacitor currents remain exactly zero even if their voltages are undetermined.

`DC_UNSUPPORTED_MODELS` errors include all missing or unsupported nonlinear placements in a frozen `issues` array with paths, constructor names and reasons. Unsupported devices are not skipped when isolated from a guessed bias path. `DC_INCONSISTENT` identifies incompatible ideal voltage constraints, including a shorted nonzero source. `DC_NUMERICAL_FAILURE` reports nonfinite equations/results or failed residual checks. There are no public tolerance/override options yet; arguments to `solveDC()` are rejected.

Row/column equilibration is numerical scaling, not a physical approximation. Rank uses a dimension-scaled machine-epsilon threshold. Acceptance checks each KCL equation against `1e-12 A + 1e-9 * sum(abs(terms))`, and other equations against `1e-9 + 1e-9 * (abs(rhs) + sum(abs(terms)))` in their declared units. Dense elimination targets small and moderate networks; poorly conditioned systems outside its supported numerical range fail explicitly.

The resistorDC acceptance example is in the [constructor catalog](../components/constructorCatalog.md#dc-operating-point). Its external RF nodes 6 and 7 remain floating at DC, the internal resistor current is `1 / 175 A = 5.714285714 mA`, and the source delivers that current. No 50-ohm RF port termination enters the DC graph. `test/dc-solver.test.js` covers this circuit and RF equivalence after removing the supply branch, all 16 composite RLC reductions, zero/signed sources, conflicting constraints, floating loops, nonunique ideal currents, nested/reused blocks, physical resistance, explicit linear constraints and every electrical export. The restricted-worker test transfers a solved resistorDC result while DOM/network globals are blocked.

## Estimate and refine

Solve an initial linear estimate with fixed forward junction voltage and constant beta, respecting NPN/PNP polarity. Report the assumed values. A provisional seed may use 0.7 V and the selected card's temperature-adjusted forward beta. This stage must handle arbitrary networks and multiple devices rather than apply a divider-specific formula.

A forward-active estimate can imply cutoff or saturation. Use alternate piecewise estimates or a bounded initial state when needed. Failure or singularity of the approximation does not establish that the nonlinear circuit has no solution. Report any fallback; never label an approximate state as a converged final operating point.

Refine with existing nonlinear currents and analytic first derivatives. Reuse `gummelPoon.js`, terminal RB/RC/RE and the selected package. Reuse each diode's own DC equation: the legacy and new diode models have different leakage placement, series resistance and breakdown treatment. Junction capacitance/transit-time charge contributes no static DC current; opening external capacitors does not remove device junction conduction.

Evaluate currents/Jacobians at arbitrary candidate junction voltages. Do not impose each transistor constructor's fixed-IB/VCE Q-point equations as nested constraints during a network iteration. Introduce internal evaluation/state adapters while retaining standalone fixed-Q behavior.

Solve `J(x) Δx = -F(x)` with damping, junction step limits and finite-value checks. Require scaled current **and** voltage residuals; small corrections alone do not establish convergence. Diagnose singular constraints, conflicting voltage-source loops and bias-relevant floating nodes. Optional source/conductance stepping must be reported and removed before accepting final residuals for the original circuit. Numerical conductances must not silently become physical circuit elements.

Device-local temperatures remain fixed. Self-heating, transient switching, harmonic balance and currently absent device families are separate model extensions.

## Implemented nonlinear bias and automatic ordering

`dcNonlinear.js` implements the shared Newton solve for NPN/PNP, NJF/PJF and diode adapters. Package inductors short and package capacitors open at DC. Resolved RB/RC/RE connect each external terminal to a separate intrinsic node. The shared temperature-adjusted Gummel-Poon engine evaluates signed terminal currents and analytic first derivatives at candidate intrinsic VBE/VBC; its fixed-Q current/voltage solver is not called inside the network iteration. All devices in the complete graph solve together.

The first estimate uses 0.7 V forward VBE and the card's temperature-adjusted BF. Up to eight piecewise attempts can select cutoff or saturation (0.55 V BC, 0.15 V CE). A consistent approximation seeds Newton; inconsistent/cycling estimates fall back to an open-device linear state. All-zero sources use the exact zero-current initial state. `initialEstimate` reports the method, selected regions, assumptions and any fallback. These estimates are never labeled final bias.

Damped Newton solves the current Jacobian against the original linear constraints. Junction changes are limited to 0.12 V per accepted trial, with backtracking to reduce the scaled physical residual. Each stage allows 120 iterations. Acceptance requires both KCL and voltage-constraint residuals: `1e-12 A + 1e-9 * sum(abs(terms))` for current equations, and `1e-9 V + 1e-9 * sum(abs(terms))` for voltage equations. Acceptance also requires a predicted intrinsic-junction correction of at most 1e-8 V, so tiny absolute leakage residuals alone cannot stop refinement at a spurious cutoff voltage. The accepted state is checked independently of the linearized solve. Topologically valid common-mode voltage gauges are canonicalized in the null space to remove elimination roundoff in current entries; nonunique ideal circulating-current modes remain nonunique.

If direct refinement fails, reported source stepping starts with zero sources, initially advances by 0.1, increases successful increments by 1.5 up to 0.25, and halves failed increments down to 1e-5. Final acceptance always uses full-strength original sources. No hidden conductance is added. `convergence.history` includes failed and converged attempts, source scale, iteration count and residual/reason; `sourceStepping` reports whether continuation was used. Exhaustion produces `DC_NONCONVERGENCE`; undefined intrinsic bias/current produces `DC_FLOATING_BIAS`. Neither returns an accepted RF operating point.

Nonlinear results include `components[].qPoint` with signed IB/IC, outward IE, terminal voltages/differences, intrinsic voltages, temperature and configuration. `operatingPoints` contains immutable placement records for the RF handoff. `residuals.maxNormalizedResidual` must be at most 1; `maxKclAmps`, `maxVoltageResidual` and `maxScaledResidual` retain physical/backward-error checks. Floating observation nodes retain `null` absolute voltages and do not become DC loads or grounds.

`dcBias.js` selects automatic bias only when a complete network contains both an explicit voltage-source descriptor and nonlinear devices. It runs before RF combination in `nodal()` and `cas()`/`cascade()`. It rebuilds each affected placement through the handoff and stores the solved plain-data result in `network.operatingPoint`. A larger enclosing network recomputes bias from its complete graph; it does not freeze a nested subcircuit at its earlier operating point. Caller-owned templates, `.dc` curves and global settings remain intact. Captured RF excitations propagate through the rebuilt response.

Purely linear supply networks retain explicit `.solveDC()` analysis, including the resistorDC harness. Fixed-Q RF networks without a DC supply retain their original behavior. Calling `.solveDC()` explicitly on an unpowered transistor solves its zero-source DC network rather than treating the constructor Q point as a hidden source. Unspecified physical DC laws and unsupported device families are reported before automatic RF analysis; they are never omitted or silently treated as their fixed-Q RF model.

### Diode equations and reconstruction

D() stamps its selected temperature-adjusted junction law and series RS, with the source card's leakage resistor outside that series branch. The shared assembly has a direct linear-conductance primitive for parallel leakage; series/contact resistors retain explicit branch-current variables. This avoids a poorly scaled gigaohm voltage equation while retaining accurate terminal-current reporting and tiny intrinsic conductances. No numerical shunt or arbitrary conductance is added.

Legacy diode1N4148() instead evaluates its own Shockley, junction-side leakage and exponential breakdown continuation through legacyDiode.js. Its parameters and noise approximation remain distinct from D(). Capacitance contributes no static current. The piecewise initializer uses forward, off and (where finite) breakdown regions, then the same damped Newton and source-stepping rules refine the actual laws. Mixed diode/BJT networks solve together.

Diode components report qPoint fields vd, id, junctionVoltage, junctionCurrent, va, vk and temperature; id is positive anode to cathode, and absolute va/vk can be null. Each immutable operatingPoints record carries its placement path, terminal difference, intrinsic junction voltage and references. D() and legacy RF builders share their standalone RF/noise/nonlinearity paths, preserving their original curve settings and construction descriptors. Existing legacy forward-capacitance clamping and exponential limiting remain model limitations; those legacy limitations do not describe the separate catalog device models.


## Solved state and RF reconstruction

Standalone constructors keep explicit/default `qPoint`. The intended network-bias path solves the external bias network before RF combination; existing Q points may seed that solve but are not invisible sources. This path is automatic when the complete composition contains both a `V()` supply and a nonlinear device. Networks without DC supplies retain their fixed-Q RF behavior. Report their use and preserve original objects.

Return a new result with the captured circuit/reference identity, node voltages, placement-scoped entering terminal currents, uniquely determined branch/source currents, intrinsic device states, model/temperature records, convergence/residual information, estimate assumptions and any continuation. Include DC approximations and supplied equivalents. Preserve unreferenced observations without assigning invented voltages.

Provide a reconstruction path for a new RF network using solved states and the captured frequency context. Rebuild device S rows, active noise, nonlinear source data and enclosing networks; updating `.bias` alone leaves stale analysis data. Preserve compatible signals, terminal order and schematic identity. Keep caller-owned `.spars`, `.noise`, `.qPoint`, `.dc`, curve settings and shared templates unchanged. Reconstruct every placement independently.

Some circuit solutions can fall outside standalone Q-point option ranges. The internal state-to-RF path must accept validated supported intrinsic states or report a precise model-domain limitation. Do not clip a solved negative base current to satisfy an existing public option validator or silently select another point.

## Internal operating-point handoff

The handoff is implemented for NPN/PNP, NJF/PJF, D() and diode1N4148() without adding a public constructor, second netlist or required user step. An internal `nPort._withOperatingPoints(records)` entry calls `operatingPointHandoff.js`. It is an implementation seam used by `dcBias.js`, not a user-facing analysis API. `nodal()` and `cas()` capture DC topology, solve supply-driven nonlinear networks, rebuild affected component instances and only then combine RF matrices. Private RF-only recipe functions avoid recursively solving subcircuits after the complete outer network has already supplied their states.

Each record identifies one placement and supplies signed physical intrinsic junction voltages:

```js
// Internal solver-to-RF record shape; not a public user workflow.
{
    path: 'p2/p1',
    intrinsicVbe: 0.7, // intrinsic base minus intrinsic emitter, V
    intrinsicVbc: -4.3, // intrinsic base minus intrinsic collector, V
    ve: 1.2 // absolute external emitter voltage, V; null if undetermined
}
```

Use `path: ''` for a standalone transistor. Omitted `ve` selects the standalone emitter-zero reference. PNP records use actual signed voltages, so their forward VBE is negative. The mapped component's immutable descriptor supplies its own card, package, temperature, configuration, curve settings and frequency context; states never override those settings. Every nonlinear placement needs exactly one record, including repeated uses of one JavaScript object. Unknown, duplicate or missing paths and unsupported device adapters are errors. Diode records instead contain `vd`, `junctionVoltage`, `va` and `vk` (volts); floating terminal references are null. Their adapters validate the terminal difference and the model-specific series-resistance law before rebuilding RF.

`junctionOperatingPoint()` in `gummelPoon.js` evaluates a supplied intrinsic state directly. The standalone fixed-IB/VCE (or IE/VCB) solver uses the same evaluator after convergence. `bjtConstructor.js` shares one instance builder between fixed-Q and supplied-state construction, preserving one Gummel-Poon model for currents, charge, derivatives, noise and nonlinear sources. The adapter accepts supported cutoff/reverse states without applying the standalone forward-current option limits. It rejects nonfinite data or nonpositive base charge rather than clipping a solved state or silently falling back to the construction Q point.

`_rfModel` runtime recipes retain component objects and rebuild functions. `nodal()` retains normalized component rows, output order and groups; `cas()` retains both operands. The handoff checks that RF recipes still match the DC construction snapshots, visits placement paths, builds a fresh device instance for each state, and rebuilds affected ancestors from those instances. `cascade()` preserves the recipe on its one-operand signal-copy path. Passive subtrees can be reused unchanged. Fresh device instances have fresh frequency caches, S/noise rows, `.bias`, `.qPoint`, `.smallSignal` and nonlinear coefficients. Original `.dc` curve settings and constructor seed descriptors remain intact. The returned root retains the supplied records as immutable `_operatingPoints` data.

External RF excitations are captured separately in `_rfInputSignals` when attached. Rebuilding propagates component sources through the new RF network and replays each external excitation once through the updated S matrix. Reusing old output waves would retain the old bias response. Captured input frequencies, spectrum and metadata are copied, so later changes to the original transmitter do not change replayed inputs. Manually assigned leaf source waves are retained when there is no recorded external input. Rebuilding rejects changes to frequency/port boundaries and nonfinite S/noise results. Signal data and all runtime hooks stay outside `_dcModel`.

`test/operating-point-handoff.test.js` compares rebuilt 2N3904, BFR93A and 2N3906 devices with independent fixed-Q constructions in all three configurations; it also covers cutoff/reverse states, floating/shifted emitter references, repeated and nested placements, grouped/output-order preservation, two-tone noise/IM, curve/source ownership and signal replay. The restricted plugin worker checks a rebuilt amplifier with DOM/network APIs blocked. `test/dc-bjt-bias.test.js` additionally verifies the complete nonlinear-to-RF path against circuit KCL, archived ngspice operating points, independent fixed-Q RF reconstruction, a coupled current mirror, repeated/nested placements and reported source stepping. `test/dc-diode-bias.test.js` verifies both diode laws, independent ngspice resistor-bias references, reverse breakdown, temperature, mixed diode/BJT networks, nested/reused placements, floating references, RF/noise/IM rebuilding and curve ownership.

## Implementation stages and acceptance

| Stage | Deliverable | Acceptance evidence |
| --- | --- | --- |
| 1: contract/audit | This design and a complete constructor inventory. | Every export, alias/composition path and source gap accounted for; no runtime feature claimed. |
| 2: descriptors/topology | Validated model definitions or precise `requiresModel` reasons; original connections retained separately from RF results. | Terminal maps, snapshot ownership, repeated placements, nested references and all composition paths; existing RF compatibility. |
| 3: linear DC/sources | Sources, graph reductions, real MNA solve and explicit fixture overrides. | Hand-calculated dividers, source supernodes, open/short limits, all 16 composite RLC reductions, via/film resistance and dependent-source signs. |
| 4: nonlinear bias | Approximate estimate followed by device-consistent refinement. | NPN/PNP divider bias, diode bias, multiple devices, finite-beta loading, saturation/cutoff and temperature; independent SPICE references using the same cards. |
| 5: RF reconstruction | Devices and combined network rebuilt at solved operating points. | Agreement with independently constructed fixed-Q circuits for RF/noise/IM; unchanged curves, placement independence and frequency/signal alignment. |

Also verify missing-model diagnostics for every affected constructor, measurement-only nodes isolated by coupling capacitors, incompatible ideal source loops and absence of accidental `Ro` loads. Disconnected nodes unable to affect bias may remain unreferenced observations; they must not prevent a valid bias solve. Internal primitives must work without DOM/network/drawing APIs, including in the restricted plugin bundle.

Finalize public source/analysis option names, result accessors and serialization exposure during implementation. Constructor-wide participation requires tested behavior or an actionable missing-model path for every electrical row. It does not establish physical DC laws for RF hardware whose construction is unspecified.

Stages 1 and 2 and the linear solve for current supported constructors in stage 3 are implemented. Numerical dependent-source constructors and public DC-equivalent overrides remain future work. NPN/PNP and both diode adapters implement nonlinear solving and automatic state-to-RF handoff in stages 4 and 5. `test/dc-models.test.js` checks all n-port exports against the audit, validates every electrical descriptor and checks representative terminal/parameter snapshots. Future constructors must pass the same coverage test; add fixtures for required arguments and update the audit instead of excluding electrical APIs. `test/dc-topology.test.js` exercises internal snapshot ownership, grouped nodal connections, nested/repeated placements, missing-model paths, composition, signal-copy preservation and malformed/cyclic definitions. It also guards against exposing a separate public network constructor. The root `AGENTS.md` requires these contracts for future electrical constructors and composition paths.

## JFET network bias

NJF/PJF use the level-1 current law in G/D/S order with explicit RD/RS and gate leakage. An initial zero-gate channel conductance is refined by the same damped Newton/source-stepping solver; mixed JFET/BJT/diode graphs share one assembly. JFET result currents ig/id/is all enter the device. Q-point fields include external vgs/vds, intrinsicVgs/intrinsicVgd, absolute vg/vd/vs (null if floating), region and temperature. Immutable handoff records contain `{path, intrinsicVgs, intrinsicVgd, vs}`; the captured builder regenerates RF/noise/nonlinear data. See [JFET models](../semiconductors/jfetModels.md).

Floating voltage translations are proven from topology and inserted as exact null-space modes. Solving combinations with zero group-reference voltage retains independent nongauge modes without enlarging a cleanup threshold. This protects weak gate junctions from apparent nonunique currents caused by gauge roundoff.

## MOSFET network bias

NMOS/PMOS descriptors use modelId mosfet and three G/D/S ports by default; body: external exposes G/D/S/B. The adapter stamps RD/RS and a separate body connection to external S or terminal 4. The cutoff/open-junction initial estimate is refined by the actual level-1 current law and analytic Jacobian in the shared assembly. An insulated floating gate is an explicit DC_FLOATING_BIAS error; qPoint is not a supply. A floating body can acquire a definite voltage from its junction-current balance.

Handoff records contain {path, intrinsicVgs, intrinsicVds, intrinsicVbs, vs}, preserving the captured model/body/temperature/context and curve settings. Result qPoint includes signed terminal currents and bodyCurrent; three-port IS includes the body return, and four-port IB is an independent entering current. See [MOSFET models](../semiconductors/mosfetModels.md).

## MESFET network bias

`MESFET()` adds an N-channel Statz/MES1 adapter with G/D/S order, contact RD/RS
and Schottky gate leakage. Its only profile, SPICE3_REFERENCE, is explicitly a
published numerical reference rather than a commercial part fit. A zero-gate
channel-conductance estimate is refined in the shared nonlinear assembly.
Handoff uses `{path, intrinsicVgs, intrinsicVgd, vs}` and preserves captured
context and independent curve settings. Electrical parameters stay at the
MES1 reference temperature of 300.15 K; selected temperature changes thermal
noise. See [the full model contract](../semiconductors/mesfetModels.md).

## HEMT network bias

HEMT({model: 'ATF35143_DIE'}) shares network assembly with the other devices.
Its Statz current law and gate junctions supply exact Jacobians; RG, RD and RS
remain in DC. Die inductors short; CDS and the series RC/CRF correction open.
The conductance estimate is refined by the common damped Newton/source-stepping
solver. Intrinsic vgs/vgd plus the source reference identify each placement.
Rebuilding preserves static charge partition, die parasitics, correlated noise
and captured frequencies/temperature while leaving templates and curve settings
unchanged. RF requires forward conducting bias; zero-bias DC snapshots remain
valid. See [the HEMT model contract](../semiconductors/hemtModels.md).

ATF35143 additionally stamps its full package terminal graph: both external
source pins share port 3, with three source bond paths and the source-pad
bridge retained. RF and DC use the same validated immutable topology. The
fixed-Q adapter derives effective contacts through exact resistor-network
reduction; network DC preserves every branch and current split.


### Charge-storage PIN bias handoff

PIN's default charge-storage model stamps its complete steady-state terminal
law, including the storage ladder's DC reduction, two PN junctions and controlled
bulk resistance. It automatically handles forward, zero and reverse bias.
The internal sensed junction-pair voltage and pair driving current differ from
terminal VD/ID. The solver retains those distinctions and rebuilds each device
placement's dynamic RF, source noise and cubic weak-IM model. Zero-ohm terminal
connections retain branch-current identity without introducing a second netlist.
The older named SMP1307-011LF selected-region equivalent remains separate.
See [PIN model equations and limitations](../semiconductors/pinModels.md).

## RF-induced DC output

`solveDC()` remains an RF-off static analysis. Current standalone networks also
provide `rectify({frequencyHz,inputPowerDbm,outputNodes:[positive,negative]})`
for weak single-CW detection with D() devices. It independently establishes
RF-off bias, including passive zero-bias networks, and solves a second-order
DC increment with the actual loads and shared bias network.
See [weak-signal power detection](../analysis/rectification.md) for its matched-port convention,
result fields, validation and limits. It does not add a nonlinear transient or
harmonic-balance solver.
