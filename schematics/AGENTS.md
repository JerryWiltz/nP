<!-- Modified: 2026-10-25 -->

# Schematic authoring rules

Follow the repository root `AGENTS.md`. These rules apply throughout `schematics/`.
Read and follow `schematics/svg-style-guide.md` for exact SVG dimensions, snapping, geometry, labels, background, colors, and visual review. It applies to both canonical symbols here and finished schematics under `docs/public/schematics/`.

## Sources of truth

- Current nP source defines constructor names, parameters, and public port order. The schematic description defines a circuit's components, values, nodes, and connections. The canonical SVG library defines symbol geometry. Resolve any disagreement before publishing a drawing.
- When given a hand-drawn symbol, use the image to determine its shape and connections. Check the constructor's public port order in source and resolve ambiguities before drawing. Redraw it with the canonical SVG rules; do not trace the image's pixels.
- Keep every drawable public RF or digital API in `symbol-catalog.json`. Two APIs may map to one symbol when their visible topology is identical. Keep distinct topologies as distinct symbols. `mbend()` has left and right visual variants.
- RF component ports, including those on `trf()` and `trf4Port()`, are nPort ports. Connectors on digital blocks and `FFT()`/`invFFT()` are **diagram connectors**, not S-parameter ports or `nP.nodal()` arguments. State each connector's signal meaning in the symbol description or accompanying note. Some blocks, especially `mod()`, have mode-dependent inputs.

## SVG and layout

- Author symbols as readable SVG text. Do not use raster tracing, SVG drawing applications, external image references, scripts, animation, or remote resources. A complete schematic must embed its canonical symbol geometry so the result is self-contained.
- Use the same 20-unit grid for every symbol terminal, component anchor, circuit connection, junction, external port, and interconnect wire point. Use a 10-unit grid for complete-diagram labels. Draw interconnect wires horizontally or vertically, and rotate symbols only in 90-degree increments.
- Give canonical symbol terminals visibly 20-unit pins from their terminal dots to the first body edge or marked junction, except the standalone `C()`/`seC()` symbol: its 10-unit plate gap requires two 25-unit leads between grid-aligned terminal dots. `Attn()` is a stylized icon with a continuous through line, so it has no separate pin-to-body segment. Keep terminals on the electrical grid.
- Give every standalone symbol and complete circuit the same white `#ffffff` background and dark `#202020` ordinary stroke. Canonical symbols use only these two ink colors, with no colored or gray fills. Microstrip symbols have unshaded white interiors, dark conductor outlines, and dark terminal dots.
- Preserve the nP public port order, including `Tee()` port 1 as the common branch and coupled-line ports clockwise from upper left: 1, 2, 3, 4. Give each symbol a title, description, visible numbered ports, and terminal dots.
- Mark electrical nodes with filled dots and nearby circled numbers. Give node circles at least 8 units of clearance outside their 12-unit radius from wires. Keep text clear of wires and symbol bodies. Leave at least 40 units of drawing margin.
- Center the circuit's electrical reference on the SVG vertical axis and record it in the required circuit-description `layout` field. For digital flow diagrams, use a named functional center instead. Set `domain` to `rf` for electrical nodes or `signal` for named signal connections.

## Workflow

1. For nP circuit code, follow `schematics/code-to-schematic.md`: identify the measured result, expand `cas()`/`cascade()`/`nodal()` into public-port connections, and record source provenance. For a sketch or note, establish the same topology and port order. Record components, values, connections, external ports, and a grid layout in `circuits/*.json`.
2. Run `npm run symbols:gallery` after editing a canonical SVG. Run `npm run symbols:check` before composition; it parses SVG XML, checks public API coverage, and confirms each canonical symbol appears once in the generated gallery.
3. Run `node schematics/tools/compose-schematic.js schematics/circuits/NAME.json docs/public/schematics/NAME.svg`.
4. Run `node schematics/tools/validate-schematic.js docs/public/schematics/NAME.svg`.
5. Compare the finished drawing with the circuit description and nP code, then inspect the rendered SVG for collisions, clipping, and legibility. Structural validation alone cannot establish electrical agreement or visual quality.

For the REPL collection, use `npm run schematics:build` and `npm run schematics:check`. Update `docs/.vitepress/theme/schematicMap.js` when an example gains or changes a circuit; reuse an SVG only for matching topology and values. Keep the generated `example-inventory.md` aligned with the map.

Do not copy old vault paths or API examples without checking the current nP source. In particular, `mtee()` uses an options object in this repository.
