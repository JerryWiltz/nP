<!-- Modified: 2026-11-19 -->

# Schematic authoring rules

Follow the repository root `AGENTS.md`. These rules apply throughout `schematics/`.
Read and follow `schematics/svg-style-guide.md` for exact SVG dimensions, snapping, geometry, labels, background, colors, and visual review. It applies to both canonical symbols here and finished schematics under `docs/public/schematics/`.

## Sources of truth

- Current nP source defines constructor names, parameters, and public port order. The schematic description defines a circuit's components, values, nodes, and connections. The canonical SVG library defines symbol geometry. Resolve any disagreement before publishing a drawing.
- `shapes/previews/*.svg` are visual references only. Reusable shape descriptions live in `src/np-chart/src/schematicShapeBoards.js` and are read by `schematicBoardInterpreter.js`; do not add a parallel JSON shape-definition system.
- When given a hand-drawn symbol, use the image to determine its shape and connections. Check the constructor's public port order in source and resolve ambiguities before drawing. Redraw it with the canonical SVG rules; do not trace the image's pixels.
- Keep every drawable public RF or digital API in `symbol-catalog.json`. Two APIs may map to one symbol when their visible topology is identical. Keep distinct topologies as distinct symbols. `mbend()` has left and right visual variants.
- Register source artwork without executable source constructors under the catalog's `sourceSymbols` mapping. These names select canonical drawings; they do not claim public nPort APIs or S-parameter models. Source captions use `Terminal 1`/`Terminal 2` for electrical terminals rather than RF port labels.
- Register device artwork whose numerical constructors are not yet implemented under `deviceSymbols`. These are drawing names, not public constructor exports. Move the mapping into `constructors` when the corresponding public constructor is implemented.
- The RF constructor-to-symbol map is generated from `symbol-catalog.json`. Constructors call `schematicPart(publicName, parameters)` and never repeat the SVG filename. Give option-dependent variants explicit keys in `symbolVariants`; `mbend()` uses `left` and `right`. The symbol check verifies runtime geometry and nPort port counts.
- For a new three-port line junction that can introduce a ladder shunt, record `flow.throughPorts` and `flow.shuntPort` in `runtime-symbol-layout.json`. Keep those public port numbers distinct. The renderer chooses 90-degree rotations and reflections from the canonical port geometry; do not encode a constructor-specific drawing angle.
- For a junction usable as a divider/combiner, also record `junction.commonPort` and `junction.branchPorts` in `runtime-symbol-layout.json`. They must cover all numbered terminals exactly once, with at least two branches. Future transmission-line families use this same metadata; ORI does not identify their constructors by name.
- Symbols with a conventional automatic orientation may declare `automatic` placement preferences in `runtime-symbol-layout.json`. Its quarter-turn `rotations`, mirror permissions and external-port flow apply to the generic board. They do not change the numbered terminals or limit explicit drawing-language rotations. NPN/PNP retain base-left, collector-above, emitter-below orientation for familiar bias-network reading. Direct one-port attachments use shared terminal geometry for every multiport component, without a symbol opt-in. Record and disclose the engineering reason for preferences; metadata must not hide a corrective exception.
- RF component ports, including those on `trf()` and `trf4Port()`, are nPort ports. Connectors on digital blocks and `FFT()`/`invFFT()` are **diagram connectors**, not S-parameter ports or `nP.nodal()` arguments. State each connector's signal meaning in the symbol description or accompanying note. Some blocks, especially `mod()`, have mode-dependent inputs.

## General layout tools; no corrective patches

- Follow the root prohibition on special-case workarounds. For runtime layout changes, also read `src/np-chart/AGENTS.md`.
- Shape definitions describe electrical roles and intended organization. They must not encode a manually positioned example or accumulate offsets, stretched leads or per-branch corrections to compensate for missing shared behavior.
- Related branch alignment, measured spacing and clear section exits belong in shared layout capabilities. Verify them on different circuit arrangements before treating a rendering defect as resolved.
- User-authored drawing descriptions and static circuit specifications may deliberately supply geometry. Preserve that authoring intent; do not transfer an example's coordinates into library layout code as a repair.
- Disclose any remaining manual compensation and its reason. A correction is still a workaround when stored in a board definition, canonical-symbol metadata or a generated bundle.

## SVG and layout

- Author symbols as readable SVG text. Do not use raster tracing, SVG drawing applications, external image references, scripts, animation, or remote resources. A complete schematic must embed its canonical symbol geometry so the result is self-contained.
- Use the same 10-unit grid for every symbol terminal, component anchor, circuit connection, junction, external port, and interconnect wire point. Use a 10-unit grid for complete-diagram labels. Draw interconnect wires horizontally or vertically, and rotate symbols only in 90-degree increments.
- A board may declare an intended electrical axis or symmetry relation, such as a terminal axis through the midpoint of two reference terminals. Use shared constraint operations to resolve it from measured geometry; do not substitute an asymmetric artwork bounding-box center. Do not add an isolated centerline override to repair one example when the engine needs a general branch-alignment rule. Reject incompatible relations and translations off the placement grid.
- Give canonical symbol terminals visibly 20-unit pins from their terminal dots to the first body edge or marked junction, except the standalone `C()`/`seC()` symbol: its 10-unit plate gap requires two 25-unit leads between grid-aligned terminal dots. `Attn()` is a stylized icon with a continuous through line, so it has no separate pin-to-body segment. Keep terminals on the electrical grid.
- Give every standalone symbol and complete circuit the same white `#ffffff` background and dark `#202020` ordinary stroke. Canonical symbols use only these two ink colors, with no colored or gray fills. Microstrip symbols have unshaded white interiors, dark conductor outlines, and dark terminal dots.
- Preserve the nP public port order, including `Tee()` port 1 as the common branch and coupled-line ports clockwise from upper left: 1, 2, 3, 4. Give each symbol a title, description, visible numbered ports, and terminal dots.
- Mark electrical nodes with filled dots and nearby circled numbers. Give node circles at least 8 units of clearance outside their 12-unit radius from wires. Keep text clear of wires and symbol bodies. Leave at least 40 units of drawing margin.
- Number electrical nodes, not wire boxes. All straight and corner wire boxes along one continuous connection retain its node identity and share one numbered marker. In runtime drawings, `graph.nodes` owns numbered marker positions; wire boxes carry `node` but no independent `nodeDot`. True branch junctions, external-port dots, and optional component-terminal dots are separate markers and do not create new node numbers.
- For a connection with corner wires, prefer the midpoint of the straight wire immediately before its first corner, following the board's route direction. Snap to the 10-unit grid and slide along that wire to avoid other nets and terminals. Branching paths use stable board-tile order. If that lead cannot accommodate a clear marker, use another clear straight segment of the same node. Straight connections retain their midpoint markers. A turn inside a tee or bend symbol is component geometry, not a corner wire.
- Center the circuit's electrical reference on the SVG vertical axis and record it in the required circuit-description `layout` field. For digital flow diagrams, use a named functional center instead. Set `domain` to `rf` for electrical nodes or `signal` for named signal connections.

## Workflow

1. For nP circuit code, follow `schematics/code-to-schematic.md`: identify the measured result, expand `cas()`/`cascade()`/`nodal()` into public-port connections, and record source provenance. For a sketch or note, establish the same topology and port order. Record components, values, connections, external ports, and a grid layout in `circuits/*.json`.
2. Run `npm run symbols:gallery` and `npm run symbols:bundle` after editing a canonical SVG. Run `npm run symbols:check` before composition; it parses SVG XML, checks public API coverage, and confirms the gallery and runtime symbol module match the canonical sources.
3. Run `node schematics/tools/compose-schematic.js schematics/circuits/NAME.json docs/public/schematics/NAME.svg`.
4. Run `node schematics/tools/validate-schematic.js docs/public/schematics/NAME.svg`.
5. Compare the finished drawing with the circuit description and nP code, then inspect the rendered SVG for collisions, clipping, and legibility. Structural validation alone cannot establish electrical agreement or visual quality.

For static documentation drawings, use `npm run schematics:build` and `npm run schematics:check`. The build regenerates the published drawings from the specifications in `tools/`; the check recomposes every circuit description and verifies live documentation image references. Keep the three authoring fixtures as well. REPL examples render their circuits with `nP.schematic()` and do not need a static SVG map or inventory.

Do not copy old vault paths or API examples without checking the current nP source. In particular, `mtee()` uses an options object in this repository.
