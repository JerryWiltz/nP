# Chart and schematic development
<!-- Modified: 2026-11-19 -->

Follow the repository root `AGENTS.md`. These instructions apply throughout
`src/np-chart/`. For canonical symbols and schematic assets, also follow
`schematics/AGENTS.md`.

## General layout capabilities

- Solve the structural cause of a layout failure in shared tools. Never add
  example-specific coordinates, component-name/node-number checks, shape-specific
  corrective code, compensating wire lengths or isolated alignment overrides.
- Shapes describe connectivity, terminal roles and engineering organization:
  input left, supply right, a branch below, or a symmetric arrangement. The engine
  calculates geometry from those relationships, canonical terminals, actual
  symbol bounds and clearance. Do not reproduce a reference picture as a fixed
  coordinate template.
- Derive related branch groups from connectivity and reference roles. Apply
  common alignment and termination-baseline policies consistently. Measure
  unequal symbols and branch lengths before routing; preserve canonical artwork
  and numbered terminals.
- Calculate section entrances, exits and escape routes from measured envelopes.
  Do not stretch one shape's output lead to conceal a composition failure.
- Reserve label space near its owning component or node. Address insufficient
  space through shared spacing/layout decisions rather than adding a one-off
  label offset or displacement.
- Reuse and extend the existing measurement, constraint, board and routing
  operations. Adding a generic-sounding helper or moving a correction into board
  data, metadata or an option does not make a workaround acceptable.
- Keep documented style defaults and engineering conventions explicit. Symbol
  preferences must have an engineering reason; generally applicable behavior
  must not be available only through selected-symbol opt-ins.

## Verification and reporting

- Before editing, identify the missing shared relationship or operation and
  explain how the proposed solution generalizes.
- Exercise different arrangements sharing that relationship, unequal component
  sizes, branch lengths, node renumbering, row order and section composition.
  Add regression checks for structural properties, not coordinates chosen to
  make a single fixture pass.
- Check connectivity, immutable analysis data, clearances and visual organization.
  Inspect rendered output with the browser policy in the root instructions.
- Disclose remaining manual compensation, corrective exceptions and unsupported
  cases. State what was checked; passing one example or using a shared interpreter
  does not establish that all shapes render without tuning.
- Preserve unrelated chart behavior, existing examples and pending user changes.
  A general solution does not authorize an unrelated rewrite or deployment.
