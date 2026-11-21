<!-- Modified: 2026-11-21 -->
# Device models and circuit shapes: to-do

Planning note for the remaining SPICE-style device families, canonical symbols and reusable circuit layouts. Proposed constructor and shape names are not available APIs until implemented.

## Current foundation

- NPN and PNP share a modified Gummel–Poon engine. Supported records are 2N3904, BFR93A and 2N3906.
- `D()` supports the SPICE-style 1N4148 model. Its external-network DC adapter and the separate legacy diode adapter are implemented.
- Networks retain their connections for DC analysis; supported supply-driven BJT, JFET, MOSFET, MESFET, HEMT and diode networks solve bias before RF.
- Named circuit shapes are `series`, `ladder`, `bridgedT`, `branchline`, `edgeCoupledFilter`, `powerDivider`, `powerCombiner`, `commonEmitter` and `commonSource`. The first transistor board covers a divider-biased NPN/PNP stage with separate or combined emitter bypass and optional supply bypass; other bias topologies remain to be added.
- Voltage, current and four controlled-source symbols already exist. Only `V()` currently has a numerical source constructor.

## Recommended order

- [x] Start with a divider-biased NPN amplifier shape using the existing numerical model: `commonEmitter`, including PNP symbol roles, independent detection, explicit guidance and composition. See [coverage](../schematics/schematicShapeVocabulary.md#common-emitter-amplifier) and [browser harness](../../dev/shapes/commonEmitter.html).
- [x] Replace amplifier/transformer coordinate compensation with shared relational placement; infer related branch baselines, measure attachment/caption/terminal clearance, and calculate section exits from their envelopes. Keep engineering organization explicit in board data.
- [x] Finish diode network DC support for D() and diode1N4148(), including mixed BJT networks, immutable placement handoff and independent ngspice references.
- [x] Add NJF/PJF models, symbols, shared DC/RF/noise/intermodulation and a self-biased commonSource board.
- [x] Add NMOS/PMOS level-1 models with sourced records, default source tie, optional external body and shared DC/RF/noise/intermodulation.
- [ ] Add the multi-device circuit shapes below.
- [ ] Extend commercial MESFET records, HEMTs, HBTs and specialized diodes as validated models become available.

## Device models

- [x] **JFET:** NJF/PJF use SPICE level-1 Shichman–Hodges and onsemi MMBF5457LT1/MMBFJ175LT1 records; see [models and limits](../semiconductors/jfetModels.md).
- [x] **MOSFET:** NMOS/PMOS use Diodes DMN55D0UT and one DMP58D0SV channel. G/D/S order; body: external adds B as port 4, default body: source ties to external S. Level-1 charge/noise limits are explicit; MOS3/BSIM/EKV remain later work. See [models](../semiconductors/mosfetModels.md).
- [x] **MESFET primitive:** `MESFET()` implements N-channel Statz/MES1 with the explicitly labeled SPICE3_REFERENCE profile, G/D/S order, shared DC/RF, differential gate capacitances, approximate noise and weak nonlinear analysis. See [contract](../semiconductors/mesfetModels.md).
- [x] **First commercial MESFET record:** NE760 selects the Intusoft-published NEC family Statz card; independent ngspice DC/all-S/classical-noise checks and a self-bias amplifier example are supplied. It has no specified package suffix and is not manufacturer-certified.
- [ ] **Additional MESFET characterization:** source manufacturer fits, package/bond-wire parasitics and measured microwave noise. The published NE760 card supplies none of these; SPICE3_REFERENCE remains a numerical reference.
- [x] **First HEMT/pHEMT constructor:** HEMT selects ATF35143_DIE, the manufacturer's nominal Statz die adaptation with static Qgs/Qgd, die parasitics, correlated P/R/C noise, shared DC handoff and commonSource example.
- [x] **ATF-35143 package:** p.16 SC-70 network implemented with common external source, independent SPICE validation and published-data comparison; measured-table discrepancies remain documented.
- [x] **HEMT accuracy audit:** package wiring and modern charge expressions checked; residual conductance/capacitance and sensitivity results recorded in [audit](../semiconductors/hemtAccuracyAudit.md). No verified correction identified; legacy MDS mapping and measured characterization remain unresolved.
- [ ] **Further HEMT work:** improve measured-data agreement, support separate external source pins and electrical temperature behavior, additional GaAs/GaN records and suitable TOM/Angelov/ASM engines; assess trapping, self-heating and dispersion explicitly.
- [ ] **HBT and advanced bipolar:** add validated HBT records where the existing engine is adequate; assess VBIC/HICUM when additional physics is needed. A material label alone must not select the equations.
- [ ] **Specialized diodes:** add Schottky, Zener and varactor records/equations where validated; implement suitable charge-storage behavior for PIN diodes.
- [x] **Diode DC adapter:** both constructors reuse their own current laws, resistances, temperature and breakdown behavior in external-network bias solving.

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

- [x] N-channel and P-channel JFET: `NJF`/`PJF` drawing names, gate/drain/source terminal order, runtime geometry and Symbol library entries. Numerical NJF/PJF constructors are implemented.
- [x] N-channel and P-channel MOSFET: enhancement/depletion artwork, three-terminal body-to-source versions and four-terminal independent-body versions. Drawing order is gate/drain/source/body. Enhancement numerical constructors and body handling are implemented; depletion numerical records remain future work.
- [x] MESFET/HEMT drawing names share the existing N-channel FET geometry and gate/drain/source terminal order. MESFET has Statz/MES1 records; HEMT has ATF35143_DIE and common-source ATF35143 SC-70 records.
- [x] Schottky, Zener and varactor diode artwork, with anode/cathode terminal order, runtime metadata and Symbol library entries. Specialized numerical models remain to be implemented.
- [x] Reuse NPN/PNP artwork for HBT drawings and ordinary diode artwork for PIN drawings, identifying the family through an instance caption. Captions select no numerical model; HBT records/advanced bipolar engines and PIN charge-storage behavior remain future work.
- [x] Register the new drawing-only artwork under `deviceSymbols`, supply runtime terminal/layout metadata and regenerate the symbol gallery and bundles. Move individual mappings to `constructors` when numerical implementations arrive.

## Reusable circuit shapes

These are circuit arrangements containing symbols. Implement them as declarative boards interpreted by the existing shared interpreter, with shared variants where topology permits.

- [ ] **Shared description self-connections:** support routing a net back to another terminal on the same component. Currently, repeated terminal-node assignments such as four-terminal MOSFET body/source ties are rejected by layout. Keep the existing three-terminal body-to-source artwork as an intentional symbol topology, not a workaround for other requested ties.

- [ ] **Single-stage amplifier (commonEmitter divider bias and commonSource self/divider bias implemented):** device centered, input left, output right, supply above, emitter/source network below. Cover common-emitter/source, common-base/gate and emitter/source-follower variants with the appropriate terminal roles.
- [ ] **Bias network (BJT/FET divider and FET self-bias implemented):** compose divider, fixed-bias and self-bias arrangements with the amplifier. Support collector/drain feeds, emitter/source resistance, optional bypass and input/output coupling capacitors.
- [ ] **Independent-body amplifier boards:** extend named FET layouts to explicit body bias branches; retain the current standalone four-terminal drawings.
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
