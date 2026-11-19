<!-- Modified: 2026-11-18 -->
# Device models and circuit shapes: to-do

Planning note for the remaining SPICE-style device families, canonical symbols and reusable circuit layouts. Proposed constructor and shape names are not available APIs until implemented.

## Current foundation

- NPN and PNP share a modified Gummel–Poon engine. Supported records are 2N3904, BFR93A and 2N3906.
- `D()` supports the SPICE-style 1N4148 model. Its external-network DC adapter remains unfinished.
- Networks retain their connections for DC analysis; supported supply-driven BJT networks solve bias before RF.
- Named circuit shapes are `series`, `ladder`, `bridgedT`, `branchline`, `edgeCoupledFilter`, `powerDivider` and `powerCombiner`. There are no named transistor circuit shapes yet.
- Voltage, current and four controlled-source symbols already exist. Only `V()` currently has a numerical source constructor.

## Recommended order

- [ ] Start with a divider-biased NPN amplifier shape using the existing numerical model.
- [ ] Finish diode network DC support.
- [ ] Add JFET models and symbols, then exercise the shared amplifier layouts with them.
- [ ] Add MOSFET models and symbols, including the body-terminal decision.
- [ ] Add the multi-device circuit shapes below.
- [ ] Extend to MESFETs, HEMTs, HBTs and specialized diodes as validated models become available.

## Device models

- [ ] **JFET:** implement `NJF()` and `PJF()` with an identified equation family and sourced part records.
- [ ] **MOSFET:** implement `NMOS()` and `PMOS()`. Define gate/drain/source/body order and explicit versus internally tied body handling. Begin with a documented basic model; treat BSIM/EKV support as separate later work.
- [ ] **MESFET:** select an appropriate equation family, such as a Statz-type model, and validated microwave part records. Decide public names and terminal order before implementation.
- [ ] **HEMT/pHEMT:** select suitable models and parameter records for the target GaAs/GaN devices. Document treatment or omission of trapping, self-heating and dispersion.
- [ ] **HBT and advanced bipolar:** add validated HBT records where the existing engine is adequate; assess VBIC/HICUM when additional physics is needed. A material label alone must not select the equations.
- [ ] **Specialized diodes:** add Schottky, Zener and varactor records/equations where validated; implement suitable charge-storage behavior for PIN diodes.
- [ ] **Diode DC adapter:** use the existing diode current law, resistances, temperature and breakdown behavior in external-network bias solving.

For every device family:

- [ ] Provide consistent DC curves, solved operating points, current/charge derivatives and RF behavior from the same model.
- [ ] Supply active noise covariance and weak nonlinear data with explicit assumptions and limits.
- [ ] Attach a validated immutable DC model; connect solved placement states to RF rebuilding without modifying reused templates.
- [ ] Separate intrinsic equations, sourced parameter records and package parasitics. Record provenance and omissions.

## Numerical sources

- [ ] Implement `I()`.
- [ ] Implement `VCVS()`, `VCCS()`, `CCVS()` and `CCCS()`.
- [ ] Define output/control terminals, DC equations, incremental RF behavior and noise assumptions for each. Reuse their existing canonical artwork.

## Canonical symbols

- [ ] N-channel and P-channel JFET.
- [ ] N-channel and P-channel MOSFET, with enhancement/depletion variants and explicit body-terminal artwork where required.
- [ ] Suitable MESFET/HEMT artwork; share geometry where visible topology matches.
- [ ] Schottky, Zener and varactor diode.
- [ ] Reuse NPN/PNP artwork for HBTs and advanced bipolar engines; reuse ordinary diode artwork for PIN diodes with an appropriate label.
- [ ] Register artwork without executable constructors under `deviceSymbols`; move mappings to `constructors` as implementations arrive. Add runtime terminal/layout metadata and regenerate the symbol gallery and bundle.

## Reusable circuit shapes

These are circuit arrangements containing symbols. Implement them as declarative boards interpreted by the existing shared interpreter, with shared variants where topology permits.

- [ ] **Single-stage amplifier:** device centered, input left, output right, supply above, emitter/source network below. Cover common-emitter/source, common-base/gate and emitter/source-follower variants with the appropriate terminal roles.
- [ ] **Bias network:** compose divider, fixed-bias and self-bias arrangements with the amplifier. Support collector/drain feeds, emitter/source resistance, optional bypass and input/output coupling capacitors.
- [ ] **Cascode:** stacked devices, lower input and upper output, with explicit bias branches.
- [ ] **Differential pair:** two devices with separate inputs, shared emitter/source connection, tail source and collector/drain loads.
- [ ] **Current mirror:** reference and output devices, shared base/gate wiring and the actual reference feedback connection.
- [ ] **Push-pull stage:** complementary devices around a shared output, supply rails and bias connections.
- [ ] **Diode circuits:** reuse series/ladder arrangements for ordinary branches; add bridge-rectifier and balanced diode-ring layouts where the existing shapes do not fit.

For every circuit shape:

- [ ] Arrange the supplied electrical connections without inserting parts, inventing grounds or changing topology. Optional parts must actually exist in the network.
- [ ] Keep drawing placement separate from DC/RF behavior: external capacitors open at DC and retain their RF impedance; bypass capacitors are not unconditional RF shorts.
- [ ] Support relevant BJT/FET variants, polarity, repeated device placements and composition with other shapes.
- [ ] Verify explicit shape selection and independent topology detection. Report unsupported arrangements rather than silently drawing a different circuit.
- [ ] Inspect rendered examples for readable labels, crossings, junctions and terminal numbering.

## Completion checks for each increment

- [ ] Compare device DC, RF and noise results against independent SPICE references using the same parameters; check derivatives, charge/current conservation and weak nonlinear scaling.
- [ ] Check external bias networks, multiple devices, floating references and reused component placements. Update DC constructor audit and export coverage.
- [ ] Add minimal runnable examples with frequencies, named components, explicit connections, results and schematic. Preserve existing example IDs and URLs.
- [ ] Update constructor catalog, engineering notes, relevant public Guide/Tech Notes pages and the Symbol library as needed.
- [ ] Update all applicable HTML, Node.js, website and Obsidian agent instructions; verify examples against each supplied or pinned bundle. Leave the online REPL agent empty.
- [ ] Refresh managed distribution copies without overwriting user edits. Sync/check/build the Obsidian agent when affected; do not imply that its pinned nP bundle has new APIs before it is updated.
- [ ] Run relevant tests, symbol checks, library builds and documentation builds. Keep the browser and REPL bundles aligned when behavior changes.

Commits, publication and deployment require separate authorization.
