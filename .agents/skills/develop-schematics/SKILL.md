---
name: develop-schematics
description: Create or change nP canonical symbols, reusable circuit shapes, static documentation schematics or shared layout/rendering behavior. Use for schematic-system development, not merely writing a user circuit that existing drawing APIs already support.
---
<!-- Modified: 2026-11-24 -->

# Develop nP schematic support

Follow the [root instructions](../../../AGENTS.md). Determine whether the request
is artwork, topology, layout or rendering before choosing a file to edit. An
audit remains read-only until changes are authorized; `--stop` applies. Do not
turn a request for a simple user drawing into an unsolicited engine extension.

## Choose the appropriate path

Read the [symbol instructions](../../../schematics/AGENTS.md) and
[SVG style guide](../../../schematics/svg-style-guide.md) for canonical artwork
or static circuits. Read the [chart/layout instructions](../../../src/np-chart/AGENTS.md)
for runtime work. The [system overview](../../../developmentDocs/schematics/schematicSystem.md)
explains the data flow; current source resolves implementation details.

- **A canonical symbol:** establish public terminal roles and numbering from the
  constructor or agreed device contract. Edit readable SVG in `schematics/symbols/`
  using the existing geometry conventions. Register it in
  [symbol-catalog.json](../../../schematics/symbol-catalog.json), selecting
  `constructors`, `deviceSymbols` or `sourceSymbols` according to whether its
  numerical constructor exists. Add required runtime geometry in
  [runtime-symbol-layout.json](../../../schematics/runtime-symbol-layout.json).
  Respect a requested distinct symbol identity even when its artwork matches
  another device. Do not claim new electrical behavior from new artwork.
- **A reusable circuit shape:** express connectivity, numbered interfaces,
  terminal roles and engineering organization in
  [schematicShapeBoards.js](../../../src/np-chart/src/schematicShapeBoards.js).
  Use the existing detector/interpreter/composition path; do not introduce a
  second shape-definition system. Keep occurrence identity when the same
  electrical object appears more than once.
- **A runtime layout failure:** trace the description or retained network through
  parsing, structural binding, measured placement, constraints, composition,
  routing and SVG rendering. Identify the first missing or incorrect shared
  relationship. Inspect returned `graph`, `topology`, `detected` and errors as
  appropriate; a drawing failure need not be an RF analysis failure.
- **A static documentation circuit:** retain an editable topology description
  and use the existing composer. Follow
  [code-to-schematic](../../../schematics/code-to-schematic.md) to translate
  `nodal()`/`cascade()` connections. Respect intentionally authored geometry;
  generated public SVG is an output, not the editable source.

## Solve the structural cause

First compare intended topology with actual numbered terminal connections. A
scan supplies electrical intent, not pixel coordinates for library placement.
Resolve ambiguous connections or values before changing analysis code.

For placement, derive alignment, branch balance, clearance and section exits
from connectivity, reference roles, terminal axes and measured geometry. Keep
symbol ink bounds separate from electrical anchors. Reserve labels and node
markers as occupied space. Preserve the electrical net when routing around
objects or composing sections.

A new shape may reveal a missing general constraint or routing operation.
Implement that shared capability when it is necessary to the authorized task.
Do not compensate with example/node/component-name checks, shape corrections,
stretched leads, tuned offsets or metadata that disguises a corrective exception.
Keep documented engineering conventions distinct from corrective workarounds.
A successful screenshot does not establish that a repair generalizes.

## Verify topology and appearance separately

Select checks for the path changed:

- After canonical artwork changes, run `npm run symbols:gallery`,
  `npm run symbols:bundle` and `npm run symbols:check`. Verify own identity,
  public port mapping, runtime geometry and the generated gallery/modules.
- Exercise affected shapes and shared arrangements with relevant Node tests,
  including different component sizes, branch lengths, reordered rows, renamed
  nodes and section composition. Assert connectivity, clearance and alignment
  relationships rather than coordinates tuned to one example. Existing
  [shared-layout tests](../../../test/schematic-shared-layout.test.js) and
  [run-alignment tests](../../../test/schematic-run-alignment.test.js) are useful
  starting points, not the full required test set for every edit.
- For static circuits, use the compose/validate commands in the symbol
  instructions and relevant `schematics:build`/`schematics:check` steps. Inspect
  commands before using them during an audit because generators write outputs.
- Inspect representative rendered SVGs for collisions, clipped ink, legibility,
  node markers and overall engineering organization in an allowed browser.
  Do not run `npm run dev:smoke` without Chromium authorization: its current
  implementation launches Chromium. Use another suitable browser or state the
  remaining visual verification limit.

Rebuild the browser bundle before verifying changed runtime behavior in a
harness. Keep shape harnesses/notes under `dev/shapes/` and preserve existing
REPL IDs. Run lint and other required source/documentation checks as applicable.
For public API or grammar changes, update the affected shipped guides and public
examples through the root workflow. Report the shared rule changed and disclose
remaining manual compensation or unsupported arrangements.
