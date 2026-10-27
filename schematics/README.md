<!-- Modified: 2026-10-27 -->

# Schematics

This directory holds editable, text-based SVG symbols and circuit descriptions for nP. The initial RF library and composer came from the nPort RF Analysis test vault's *Schematic Authoring* kit. The rules here are adapted to nP's current exports and repository layout. No SVG drawing application or plugin is needed.

Read [the SVG style guide](svg-style-guide.md) for the complete coordinate, grid, spacing, symbol geometry, color, background, labeling, and review rules. Dimensions are SVG `viewBox` units, not fixed screen pixels.
Every symbol terminal and interconnect wire point uses the shared 20-unit grid. Symbols rotate only in 90-degree increments, and every standalone symbol and circuit has the same white background.

## Contents

- `symbol-catalog.json` maps every drawable public RF and digital API to a canonical SVG. It records alternate symbols where a component has more than one visual orientation.
- `symbol-gallery.template.html` fixes the vertical gallery order and placement. `tools/generate-symbol-gallery.js` inserts current canonical geometry into it and writes `dev/canonicalSymbols.html`.
- `runtime-symbol-layout.json` supplies body bounds, lead segments, and flow directions for the runtime subset. `tools/generate-runtime-symbols.js` reads each corresponding canonical SVG and generates `src/np-chart/src/schematicSymbols.js` with its exact geometry and port coordinates.
- `symbols/` contains every canonical SVG at one level. The catalog identifies which constructors use each symbol and lists signal-flow symbols in `signalSymbols`. A digital block's numbered connectors describe diagram flow, not electrical nPort ports.
- `circuits/` contains editable JSON descriptions with component placement, connections, labels, and wires.
- `code-to-schematic.md` explains how to read an nP circuit file, trace its components and connections, and turn that description into a drawing.
- `example-inventory.md` maps all 37 REPL examples to shared drawings or records that the example has no circuit. The REPL uses the matching `docs/.vitepress/theme/schematicMap.js` to display its images.
- `tools/` contains the symbol reader, composer, and validators. `schematics/package.json` sets CommonJS mode for the vault-derived Node scripts inside nP's ES-module package.
- `docs/public/schematics/` contains finished, self-contained SVGs used by the documentation site. Those SVGs can be regenerated from the JSON descriptions and canonical symbols.

## Create a drawing

From the repository root:

```bash
npm run symbols:gallery
npm run symbols:bundle
npm run symbols:check
node schematics/tools/compose-schematic.js schematics/circuits/series-resistor.json docs/public/schematics/series-resistor.svg
node schematics/tools/validate-schematic.js docs/public/schematics/series-resistor.svg

node schematics/tools/compose-schematic.js schematics/circuits/waveform-fft.json docs/public/schematics/waveform-fft.svg
node schematics/tools/validate-schematic.js docs/public/schematics/waveform-fft.svg
```

Run `symbols:gallery` and `symbols:bundle` after changing a canonical SVG. `symbols:check` parses all symbol XML, compares drawable public exports with the catalog, verifies every canonical SVG has a mapping, and checks both generated outputs for freshness. `npm run build` also regenerates the runtime symbol module before Rollup bundles it into nP. These tools use Node.js and do not require an SVG editor.

The example corresponds to `nP.R(75)` connected between circuit nodes 1 and 2. Its description demonstrates the format. For another circuit, copy the JSON structure, choose symbols from the catalog, and place each public constructor port at its exact canonical coordinate. The composer embeds symbol geometry and a copy of the description in the output SVG; the validator checks that geometry and its source hashes.

The second example shows `nP.waveform()` feeding `nP.FFT()`. Its `domain: "signal"` connections name data signals; they are not RF circuit nodes. RF descriptions use `domain: "rf"` and integer node numbers. Both domains require a named layout center. The current composer draws one domain at a time.

The [two-series-resistors example](circuits/two-series-resistors.mjs) pairs executable nP code with a [JSON description](circuits/two-series-resistors.json) and [generated schematic](../docs/public/schematics/two-series-resistors.svg). Each RF wire and external terminal names its electrical node. The same node may connect ports at different drawing coordinates; the validator checks that its wires actually join them. See [From nP code to a schematic](code-to-schematic.md) for the full procedure.

## Rebuild the example collection

Run `npm run schematics:build` from the repository root after changing the example drawing specifications or the REPL schematic map. It writes editable JSON descriptions, self-contained SVGs, and the REPL inventory. Run `npm run schematics:check` to verify the map and recompose every linked drawing from its JSON and current canonical symbols. The Guide's Wilkinson, Pi attenuator, C-L-C, and edge-coupled examples also have dedicated SVGs, which are linked from `docs/circuit-examples.md`.

The validator cannot infer whether the chosen topology matches an engineering sketch or nP code. Compare all three, then inspect the rendered SVG for text and stroke collisions before using it in a note. The tools do not open a browser.

`chebyLPgk()`, `chebyLPLCs()`, and `chebyLPNsec()` calculate filter data; `nodal()` and `cascade()` assemble networks. They do not have independent component symbols. `FFT()` and `invFFT()` are math exports but have digital block symbols for signal-flow diagrams.
