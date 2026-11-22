# AGENTS.md
<!-- Modified: 2026-11-22 -->

Instructions for diode and nonlinear-device models in `src/np-nport/src/diodes/`.

## Scope

These instructions apply to `src/np-nport/src/diodes/` and its subdirectories.

## Model Shape

Diode components should be practical RF circuit models, not only isolated ideal equations.

- Use lumped parasitic elements where appropriate, such as series resistance, package inductance, junction capacitance, and shunt leakage.
- Use diode equations for DC and nonlinear behavior.
- D accepts named or supplied model records through the same resolver/equations. Preserve generic defaults, immutable DC snapshots, optional leakageResistance and the Schottky/Zener/varactor schematicVariant. Reject unsupported parameters/package arrays explicitly; never borrow a named part's fit for a custom record. See developmentDocs/semiconductors/customModels.md. Legacy diode1N4148 retains its existing flat options until its separately planned removal.
- Varactors use D with schematicVariant: varactor, finite nonnegative M including the logarithmic M=1 integral, and optional packageParameters.seriesInductance/parallelCapacitance (H/F, default 0). Preserve LS in series with [CP parallel to (RS + junction)], common RF/noise/IM transfer factors and its exact DC reduction. cvTable uses positive reverse VR and returns CJ/CT without changing Q. See developmentDocs/semiconductors/varactorModels.md; do not clamp manufacturer parameters to a simulator's primitive limits or describe generic noise/temperature laws as measured fits.
- Zener records reuse the existing BV/IBV/NBV single-junction breakdown law and support supplied records with schematicVariant: zener. Reverse VD/ID are negative; keep the forward-biased D defaults unchanged. Distinguish archived attributed cards from authenticated manufacturer downloads. Classical shot noise is not avalanche excess-noise characterization; do not invent breakdown temperature fits or flatten multi-device subcircuits into a single card. See developmentDocs/semiconductors/zenerModels.md.
- NoiseDiode is separate avalanche/drift physics, not D with an excess-noise factor. Named/supplied records require explicit core RF parameters and spectral noiseFit; no borrowing of NC406 data. Preserve fixed-bias/temperature/band limits, diode-plane covariance and assumed-cold-reference ENR. Its requiresModel DC descriptor and deterministic-IM rejection are intentional: do not invent absent DC I-V, cold state or nonlinear charge/current. Figure 6 includes a transition and must not be forced onto the intrinsic Figure 5 multiplier. See developmentDocs/semiconductors/noiseDiodeModels.md.
- PIN defaults to the generic CHARGE_STORAGE_REFERENCE five-section model. Preserve its automatic bias, shared PN/charge/storage equations, independent physical noise sources, local-feedback cubic Volterra path and per-placement DC handoff. It is not a manufacturer fit or a network transient/HB solver; disclose cross-device quadratic-remixing limits. Charge-storage supplied records use modelType, required W/TAU/REPI/RLIM and strict units/defaults. The older named PIN selected-region SMP1307 equivalent remains available: PN DC plus VI (forward) or RR (reverse), while RF uses the frozen VI/ID resistance and the separate RRF/Cg/L/Cp package. Preserve named/supplied equivalence, explicit region/domain checks, per-placement handoff and its own pin-diode.svg symbol. Thermal noise is an approximation; absent carrier-storage dynamics must reject IM rather than imply infinite intercept. Never replace the model with ordinary D or silently switch regions. See developmentDocs/semiconductors/pinModels.md.
- Emit RF S-parameters as nPort-compatible objects when used in frequency-domain analysis.
- Expose DC I-V curve data as table data that can be displayed with `nP.lineChart()` or `nP.lineTable()`.
- Build S and noise rows at `analysisFrequencies(componentSettings(global, options))` so the diode can use an explicit `fList` and join two-tone networks.
- Supply bias-dependent noise covariance and a weak nonlinear source model when the RF S-parameters represent a biased junction. Do not rely on passive equilibrium noise or infinite IP for a biased diode.

## Examples And Tests

When adding a diode constructor, prefer examples and tests that show both sides of the model:

- RF behavior through `.out(...)` values such as `s11dB` or `s21dB`.
- DC behavior through an I-V table with voltage and current columns.

Keep examples consistent with the normal nP workflow: define inputs, create the component, extract outputs, then display them.
