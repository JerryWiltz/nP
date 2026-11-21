<!-- Modified: 2026-11-21 -->
# Schematic authoring harness

Open `schematicAuthoring.html` for six drawing-input examples: the source/DUT/load figure with annotations, an open series network, a terminated tee branch, a coupled section, its mirrored view, and a rectangular resistor network. The page loads `dist/nP.js`; none of the examples constructs an electrical nPort or sets a frequency grid.

Source code is deliberately linear: define a `paths`/`annotations` object, then pass it to `nP.schematic()`. Each drawing returns its SVG element, `svgText`, graph, topology, and error state. Copy PNG, Fit drawing, and Save SVG use the shared toolbar. See [Schematic authoring language](../developmentDocs/schematics/schematicLanguage.md) for the input rules and current implementation scope.
