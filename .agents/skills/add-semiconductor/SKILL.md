---
name: add-semiconductor
description: Add or extend nP semiconductor constructors, equation families, or built-in device model records. Use for library semiconductor implementation work, not for writing circuits with existing components or performing a standalone code audit.
---
<!-- Modified: 2026-11-24 -->

# Add a semiconductor to nP

Develop the requested semiconductor support in this nP checkout. Follow the
[root instructions](../../../AGENTS.md) and the instructions governing each
changed directory. Keep work within the requested scope: invoking this skill
respects `--stop` and does not authorize a commit, publication or deployment.
Paths below are relative to this skill's installed repository location.

## Choose the amount of work

Inspect the relevant constructor, resolver, equations and tests before choosing
an implementation path. Use the [constructor catalog](../../../developmentDocs/components/constructorCatalog.md)
and [semiconductor sources index](../../../developmentDocs/semiconductors/semiconductorSources.md)
to locate them; current source and tests resolve discrepancies.

- **Another part using supported equations:** add its record to the appropriate
  `*Models.js`, or accept supplied data if compilation is not requested. Reuse
  the existing constructor and equation path. Do not add a constructor per part
  number or reimplement the physics. Check that every supplied parameter and
  package element is actually supported.
- **A new equation family or missing effect:** establish its terminal and model
  contract, then extend a compatible engine or introduce the required engine.
  Reuse RF, DC and nonlinear helpers where their assumptions match; do not force
  charge storage, avalanche noise or a different charge partition into an
  incompatible ordinary-junction model.

For transistors read the [transistor instructions](../../../src/np-nport/src/transistors/AGENTS.md);
for diodes read the [diode instructions](../../../src/np-nport/src/diodes/AGENTS.md).
Read only the model notes and implementation paths relevant to the chosen work.

## Establish the physical and public contract

Record the equation family/version, parameter provenance, temperature reference,
SI units, supported bias/frequency domain and package topology. Separate a
published equation, a manufacturer's parameter fit, an archived attributed card,
a numerical reference and measured device evidence. Retrieve primary sources
when needed to establish missing equations or parameters; provenance URLs are
metadata, not runtime dependencies for supplied records.

Define public terminal order and current signs explicitly, translating SPICE
instance order where it differs. Identify defaults, required parameters,
unsupported fields, bias settings and curve outputs using the
[custom-model contract](../../../developmentDocs/semiconductors/customModels.md).
Preserve existing named calls. Named and supplied records must pass through the
same defaults, validation and electrical construction without registration or a
rebuild. Missing values may use documented family defaults, never an unrelated
part's fitted values.

## Implement the electrical path

Use the nearest compatible device as an integration example, not as a source
of borrowed fit data. Keep related current, charge and noise equations coherent
across the supported analyses.

- Resolve and snapshot model data using the existing
  [model helpers](../../../src/np-nport/src/semiconductorModel.js). Preserve
  caller-owned records; accept plain objects from browser/Node contexts and
  reject unsupported data or conflicting options explicitly.
- Implement DC current and Jacobian, supported charge/storage behavior, RF
  linearization, physical noise sources and weak nonlinear terms as applicable.
  Derive derivatives from the same constitutive laws; distinguish static charge
  from differential-capacitance branches. Keep package placement consistent
  across DC, RF, noise and generated mixing products.
- Attach a validated immutable `_dcModel` through the shared DC helpers. Follow
  [DC analysis and handoff](../../../developmentDocs/analysis/dcAnalysis.md):
  retain the existing `nodal()`/`cascade()` connections, solve external bias
  before RF rebuilding, and preserve an independent Q point for each placement.
  Use an actionable `requiresModel` reason when required physics is absent.
- Build frequency-aligned S/noise rows using
  `analysisFrequencies(componentSettings(global, options))`. Preserve captured
  context, public `.dc` curve settings, nPort data shapes and sweep immutability.
  A biased active device must not silently acquire passive fallback noise or
  infinite intercepts because its noise/nonlinear model is missing. Reject
  unsupported analysis with the missing information identified.

New constructors need public exports and `schematicPart()` metadata. For their
canonical symbol and catalog/runtime registration, follow the
[symbol instructions](../../../schematics/AGENTS.md). Add a new circuit shape
only when requested or necessary; shared layout defects require shared fixes.

## Verify the change with independent evidence

Choose checks that distinguish an implementation mistake from a model limitation.
For a record-only addition, concentrate on parameter/package translation and
regressions; for changed equations or shared machinery, broaden the coverage.

- Compare a built-in record with the identical supplied record for DC curves,
  fixed-Q RF/noise/weak IM and external-bias handoff, wherever supported. Verify
  both produce the same explicit rejection for an unsupported analysis.
  [Record tests](../../../test/semiconductor-model-record.test.js) and
  [handoff tests](../../../test/operating-point-handoff.test.js) show the patterns.
- Exercise distinct devices and reuse one template in different placements.
  Check independent biases, unchanged templates/inputs, terminal-current
  conservation and the supported DC-to-small-signal derivative relationship.
  Cover relevant polarity, region boundaries, temperature and package paths.
- Compare against independently evaluated equations or a documented simulator
  deck under matching conditions. Use complex S values, source noise/reference
  planes, and two-tone product amplitudes/phases where those are supported.
  Keep the deck, simulator version, regeneration method and justified tolerances
  with the reference. Do not generate expected values from nP's own equations
  and label them independent. Simulation agreement does not establish a measured
  device fit; disclose missing evidence rather than tune parameters to hide it.
- When changing audited equations, update expressions, SI annotations and sampled
  domains in the [equation audit](../../../developmentDocs/analysis/equationAudit.md).
  `npm run check:equations` checks selected algebra/derivatives/dimensions; it is
  not a measured-device check or CI gate. Report existing failures separately
  from new ones and preserve their evidence.

Run the relevant Node tests with the repository's extensionless loader, e.g.
`node --loader ./scripts/extensionless-loader.mjs --test test/pin-charge.test.js`
for PIN charge-storage work. Select the actual changed family's tests rather
than always running this example. Run required lint/build checks from the root
instructions and broader tests when shared behavior changes. Verify drawings in
an allowed browser when visual behavior changes; do not open Chromium unasked.

## Complete integration

Update the affected model note and sources index, constructor catalog,
[DC constructor audit](../../../developmentDocs/components/dcConstructorAudit.md)
and export-coverage tests when applicable. Supply a minimal named-step `dev/`
example with a companion note for a new constructor or requested demonstration.
Update public documentation and all applicable shipped guides for changed
public behavior; follow their [maintenance workflow](../../../nP-agents/AGENTS.md),
including managed copies and Obsidian checks without silently upgrading its pin.

Rebuild exported distributions and align the REPL browser bundle when source
changes require it. Report the implemented capability, actual checks and any
remaining physics, calibration or solver limits. Do not describe a planned or
unsupported analysis as implemented.
