# AGENTS.md
<!-- Modified: 2026-11-15 -->

Instructions for `src/np-nport/src/transistors/` and its subdirectories. Follow the repository root `AGENTS.md` as well.

## Scope and naming

- `bjt/NPN.js` and `bjt/PNP.js` implement the supported bipolar parameter sets. FET constructors remain future work; distinguish implemented behavior from proposals in the README files.
- Use SPICE device-type names for public constructors: `NPN`, `PNP`, `NJF`, `PJF`, `NMOS`, and `PMOS`. Select a supported part parameter set through `model`; do not add a public constructor for each part number. Public filenames must match the exported constructor names.
- Keep BJT implementations in `bjt/` and FET implementations in `fet/`. Share equation engines across compatible part parameter sets. Keep independent sources and a general DC network solver outside these device directories.
- Record each parameter set's part/model name, manufacturer, semiconductor material, device structure, mathematical model and version, temperature reference, source provenance, and package coverage. Distinguish intrinsic die parameters from package parasitics; do not claim package coverage without checking it.

## Electrical contract

- Preserve one consistent nonlinear device model across DC curves, operating-point calculations, small-signal RF, noise, and weak nonlinear analysis. Document approximations and unsupported effects.
- For the proposed BJT API, preserve nP port order: 1 base, 2 collector, 3 emitter. SPICE Q-instance node order is collector, base, emitter; translate it explicitly when importing model or netlist information. Specify FET terminal/body handling before implementing a FET constructor.
- Support the same three-terminal BJT in common-emitter, common-base, and common-collector circuits through external connections. DC curve families must identify the swept voltage, stepped current, polarity and measured current.
- Return DC sweep tables directly usable by `lineChart()` and `lineTable()`. A sweep must not mutate the selected operating point or caller-owned data. Retain all terminal voltages and currents needed to reproduce a selected point.
- A fixed Q point is the DC operating point used during the RF sweep. Curve-tracer source settings must not silently become RF terminations.
- Build frequency-aligned S and noise rows using `analysisFrequencies(componentSettings(global, options))`. Preserve the existing nPort, noise-covariance, signal, schematic, and intermodulation contracts.
- Supply active-device noise covariance and the appropriate nonlinear source model. Calculate noise and intercept behavior for the selected bias and connected circuit; do not substitute passive noise, fixed part-wide NF/IP values, or silent infinite intercepts for unsupported calculations.
- Reuse shared physical constants and module-level helpers. Add symbols/catalog metadata, constructor documentation, and meaningful DC/RF/noise/nonlinearity checks when implementing a drawable public constructor.
