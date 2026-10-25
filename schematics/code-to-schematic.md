<!-- Modified: 2026-10-25 -->

# From nP code to a schematic

An nP JavaScript circuit is the authority for components and connections. The composer reads a **circuit description JSON**, not arbitrary JavaScript. Read the code, write the description, then use the composer to draw it. The [two-series-resistors source](circuits/two-series-resistors.mjs), [description](circuits/two-series-resistors.json), and [SVG](../docs/public/schematics/two-series-resistors.svg) are a complete example.

## Read the circuit

1. Find the result variable that is actually used for `.out(...)`, `demod()`, or another final measurement. Ignore unused trial circuits and plotting code.
2. List each named constructor instance, its value, and its public port order. Use current nP source and `symbol-catalog.json` to choose the matching SVG. Repeated appearances of the same JavaScript object are separate drawn occurrences only when the code places that object more than once.
3. Expand the final connection expression into a port-level connection list. For `first.cas(second)` or `nP.cascade(first, second, ...)`, connect port 2 of each two-port stage to port 1 of the next stage, in argument order. The first stage's port 1 and last stage's port 2 are the external ports. For `nP.nodal(...)`, read each `[part, label1, label2, ...]` entry in that part's public port order. The final `['out', ...]` entry determines the external port order. Preserve those labels exactly. Check the current `nodal()` rules for permitted label use; use explicit Tee or other junction components for branches.
4. If a named intermediate `nodal()` or cascade result is used as a component of a later network, decide whether the drawing should show its internal parts or a labeled block. Record that decision and show detailed subcircuits before the final combined circuit when both are useful. Do not infer hidden parts of a constructor such as `lpfGen()` from a result alone.
5. Keep RF nPort connections separate from digital signal connectors. A mixed RF and signal flow system needs separate `rf` and `signal` descriptions with named interfaces; the present composer draws one domain per SVG.

## Describe the drawing

- Create `schematics/circuits/NAME.json` with a title, description, domain, `viewBox`, a named center reference, component placements, wires, external terminals, and labels. Follow the [SVG style guide](svg-style-guide.md) for grid, margins, text, and port order.
- Place a component with 90-degree `rotation` steps. A `Tee()` may also use `mirrorY: true` to face its common branch upward; the composer mirrors both the body and port coordinates.
- Give each RF component connection its constructor `port`, electrical `node`, transformed grid coordinate `at`, and a shared `labelAt` coordinate for that node's circled number. Ports belonging to one electrical node may occupy different coordinates. Tag every RF wire and external terminal with that same `node`. Route wires through grid points to connect all of the node's ports and external terminals; wire ends may not dangle. A wire crossing another node's terminal is invalid.
- For `signal` diagrams, use a named `signal` on connectors, wires, and terminals instead of an RF node. The composer checks that each signal route is connected.
- Add `source.file`, `source.result`, and `source.combination` to identify the original code and final expression. Add `source.variable` and `source.constructor` to each component when the source names it. The validator checks that the file exists and that the constructor maps to the chosen symbol. **Review the recorded expression and connections against the actual code**; this metadata is a trace, not a JavaScript parser.
- Keep component labels tied to their `componentId`, preserve supplied designators and values, and label external ports in the result's public port order.

## Generate and review

From the repository root:

```bash
npm run symbols:check
node schematics/tools/compose-schematic.js schematics/circuits/NAME.json docs/public/schematics/NAME.svg
node schematics/tools/validate-schematic.js docs/public/schematics/NAME.svg
```

The RF validator checks each routed node's component ports, external terminals, wire connectivity, and dangling ends. The SVG validator checks that the file matches its JSON and current canonical symbols, plus selected clearances. Neither tool proves that the JSON matches executable JavaScript or that the drawing looks good. Compare the port-level connection list with the source code, parse the SVG as XML, and inspect its rendered appearance before publication. A general automatic JavaScript extractor would need an explicit supported syntax and handling for dynamic expressions; it is not part of this workflow yet.

For the repository examples, `npm run schematics:build` rebuilds descriptions and SVGs from the hand-reviewed layout specifications in `schematics/tools/`, then updates `example-inventory.md`. It does not execute or parse the example JavaScript; changes to an example's components or connections require updating the corresponding specification and reviewing the rendered result.
