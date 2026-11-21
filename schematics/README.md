<!-- Modified: 2026-11-21 -->

# Schematics

This directory holds editable, text-based SVG symbols and circuit descriptions for nP. The initial RF library and composer came from the nPort RF Analysis test vault's *Schematic Authoring* kit. The rules here are adapted to nP's current exports and repository layout. No SVG drawing application or plugin is needed.

Read [the SVG style guide](svg-style-guide.md) for the complete coordinate, grid, spacing, symbol geometry, color, background, labeling, and review rules. Dimensions are SVG `viewBox` units, not fixed screen pixels.
Every symbol terminal and interconnect wire point uses the shared 10-unit grid. Symbols rotate only in 90-degree increments, and every standalone symbol and circuit has the same white background.

## Contents

- `symbol-catalog.json` maps every drawable public RF and digital API to a canonical SVG. It records alternate symbols where a component has more than one visual orientation. Its separate `sourceSymbols` mapping reserves the six source drawing names without declaring executable constructors. The `deviceSymbols` mapping similarly registers device artwork before its numerical constructor is implemented.
- `symbol-gallery.template.html` fixes the vertical gallery order and placement. `tools/generate-symbol-gallery.js` inserts current canonical geometry into it and writes `dev/canonicalSymbols.html`.
- `runtime-symbol-layout.json` supplies body bounds, lead segments, and flow directions for the runtime subset. `tools/generate-runtime-symbols.js` reads each corresponding canonical SVG and generates `src/np-chart/src/schematicSymbols.js` with its exact geometry and port coordinates.
- `symbols/` contains every canonical SVG at one level. The catalog identifies which constructors use each symbol and lists signal-flow symbols in `signalSymbols`. A digital block's numbered connectors describe diagram flow, not electrical nPort ports.
- `shapes/previews/` contains printable visual references. Runtime shape boards such as `series`, `ladder`, and `branchline` live in `src/np-chart/src/schematicShapeBoards.js` and are read by `schematicBoardInterpreter.js` in that same directory.
- `circuits/` contains editable JSON descriptions with component placement, connections, labels, and wires: 13 published documentation drawings and three authoring fixtures.
- `code-to-schematic.md` explains how to read an nP circuit file, trace its components and connections, and turn that description into a drawing.
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

Run `npm run shapes:preview` to regenerate the printable shape previews from their nP examples. These previews are references; runtime layout uses the shape boards and reusable interpreter.

The example corresponds to `nP.R(75)` connected between circuit nodes 1 and 2. Its description demonstrates the format. For another circuit, copy the JSON structure, choose symbols from the catalog, and place each public constructor port at its exact canonical coordinate. The composer embeds symbol geometry and a copy of the description in the output SVG; the validator checks that geometry and its source hashes.

The second example shows `nP.waveform()` feeding `nP.FFT()`. Its `domain: "signal"` connections name data signals; they are not RF circuit nodes. RF descriptions use `domain: "rf"` and integer node numbers. Both domains require a named layout center. The current composer draws one domain at a time.

The [two-series-resistors example](circuits/two-series-resistors.mjs) pairs executable nP code with a [JSON description](circuits/two-series-resistors.json) and [generated schematic](../docs/public/schematics/two-series-resistors.svg). Each RF wire and external terminal names its electrical node. The same node may connect ports at different drawing coordinates; the validator checks that its wires actually join them. See [From nP code to a schematic](code-to-schematic.md) for the full procedure.

## Source symbols

The source artwork is bundled independently of the numerical implementation. `V()` is now a two-port nPort constructor under `src/np-nport/src/sources/V.js`; its catalog mapping is under `constructors`. The other five names remain drawing-only `sourceSymbols`:

| Drawing name | Canonical SVG | Marking |
| --- | --- | --- |
| `V` | `symbols/voltage-source.svg` | Circle with `+` and `−` |
| `I` | `symbols/current-source.svg` | Circle with a current arrow |
| `VCVS` | `symbols/voltage-controlled-voltage-source.svg` | Diamond with `+`/`−`; `V = Av × Vc` |
| `VCCS` | `symbols/voltage-controlled-current-source.svg` | Diamond with an arrow; `I = gm × Vc` |
| `CCVS` | `symbols/current-controlled-voltage-source.svg` | Diamond with `+`/`−`; `V = rm × Ic` |
| `CCCS` | `symbols/current-controlled-current-source.svg` | Diamond with an arrow; `I = Ai × Ic` |

Each has two electrical terminals: terminal 1 above terminal 2. Voltage polarity is positive at terminal 1; current arrows point from terminal 2 toward terminal 1. The controlled-source captions identify their control relationship; the model will separately identify the sensed voltage or current. Reference captions are stripped when canonical body geometry is embedded in a circuit; instance labels and annotations will supply actual values and control names.

Open `dev/canonicalSymbols.html#sources` to inspect the family. `V()` carries a DC voltage-source descriptor and the declared incremental S/noise model; it does not yet solve network DC bias. `I` and the controlled sources have no numerical behavior yet. Drawing syntax such as `Vin=V` continues to select geometry directly without executing a constructor; see [Schematic authoring language](../developmentDocs/schematics/schematicLanguage.md) and `dev/schematicAuthoring.html`. Future numerical sources must provide DC models and preserve canonical terminal orientation without embedding SVG geometry in their implementation.

## Device artwork

`constructors.NPN` maps both `nP.NPN()` and the drawing name `NPN` to [symbols/npn.svg](symbols/npn.svg). It is a three-terminal bipolar symbol: 1 base, 2 collector, 3 emitter, with an outward emitter arrow. Its ports and visible pins use the same grid and dimensions as the rest of the library.

Open [the device-artwork gallery section](../dev/canonicalSymbols.html#devices) to inspect it. Drawing input can select the artwork without constructing a transistor:

```js
var transistorSchematic = {
    paths: ['1 right Q1=NPN[1,2,3] 1 2 3']
};
var transistorDrawing = nP.schematic(transistorSchematic);
```

`nP.NPN()` implements the 2N3904 and BFR93A models. Drawing-only paths select artwork without constructing a device or calculating DC/RF data. See [the transistor model note](../developmentDocs/semiconductors/transistorModels.md).

## Rebuild static documentation drawings

Run `npm run schematics:build` from the repository root after changing the documentation drawing specifications in `tools/generate-linear-schematics.js`, `tools/generate-nodal-schematics.js`, or `tools/generate-vna-receivers.js`. It writes the 13 published drawings' JSON descriptions and self-contained SVGs. The three authoring fixtures (`series-resistor`, `two-series-resistors`, and `waveform-fft`) remain editable directly and use the individual compose command above.

Run `npm run schematics:check` to recompose all 16 drawings from their JSON and current canonical symbols, validate the SVGs, and verify that live documentation image references resolve. The Guide's Wilkinson, Pi attenuator, C-L-C, and edge-coupled drawings are linked from `docs/circuit-examples.md`. REPL examples generate drawings at runtime with `nP.schematic()`; they do not use a static SVG map or inventory.

The validator cannot infer whether the chosen topology matches an engineering sketch or nP code. Compare all three, then inspect the rendered SVG for text and stroke collisions before using it in a note. The tools do not open a browser.

`chebyLPgk()`, `chebyLPLCs()`, and `chebyLPNsec()` calculate filter data; `nodal()` and `cascade()` assemble networks. They do not have independent component symbols. `FFT()` and `invFFT()` are math exports but have digital block symbols for signal-flow diagrams.

`constructors.PNP` maps `nP.PNP()` and drawing name `PNP` to [symbols/pnp.svg](symbols/pnp.svg). It has the same B/C/E terminal positions and pin lengths as NPN, with the emitter arrow pointing inward. Both symbols use the shared automatic orientation and local-termination rules. `PNP()` currently supports 2N3906; drawing paths select artwork without calculating DC/RF data.

`D()` and `diode1N4148()` share the existing canonical `symbols/diode-1n4148.svg` (port 1 anode, port 2 cathode); their distinct numerical models do not require distinct artwork.
