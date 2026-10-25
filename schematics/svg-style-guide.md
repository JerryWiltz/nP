<!-- Modified: 2026-10-25 -->

# SVG schematic style guide

This is the drawing specification for `schematics/symbols/` and finished nP schematics in `docs/public/schematics/`. It adapts the nPort RF Analysis test vault's schematic rules to this repository. Follow `schematics/AGENTS.md` for the authoring workflow and current nP source for constructor behavior.

## Source and canonical geometry

- Treat an original sketch, scan, published schematic, or existing nP example as evidence of circuit **topology**, values, annotations, and node assignments. Do not trace its pixels. Rebuild the drawing with editable SVG primitives, canonical symbols, and deliberate grid placement.
- `schematics/symbols/` defines canonical geometry for each visually distinct constructor family. `schematics/symbol-catalog.json` maps public APIs to those drawings. Copy a canonical symbol's geometry into each complete schematic; do not redraw it from memory, borrow it from an older composite SVG, or link to an external symbol file.
- The source circuit, JSON description, finished SVG, and matching nP code must agree on components, values, public port order, connections, nodes, and external ports. Electrical equivalence does not justify changing a specified topology or node assignment. Resolve disagreements before publishing.
- Keep one finished SVG for a shared circuit under `docs/public/schematics/` and link to it from pages that use it. Keep editable circuit descriptions under `schematics/circuits/`. Use a source scan as a reference, not as canonical symbol geometry.
- When an API is added or renamed, update the catalog and its canonical symbol in the same work. `seR()`, `seL()`, and `seC()` share the identical `R()`, `L()`, and `C()` symbols; constructors with different shunt, series, or parallel topology need distinct reference drawings. A synthesized network such as `lpfGen()` may use a labeled block.

## Coordinates, snapping, and margins

### Dimension quick reference

All dimensions are SVG `viewBox` units. The detailed family rules below describe shape and port order.

| Symbol or feature | Standard dimensions | Exception or placement rule |
| --- | --- | --- |
| Electrical grid and ordinary pins | 20-unit grid; 20-unit visible pin | Terminals and wire points stay on the grid. |
| `R()` / `seR()` | 100 between terminals; 60 × 20 zigzag body | 20-unit pin at each end. |
| `L()` / `seL()` | 100 between terminals; 60-wide, four-loop body | 20-unit pin at each end. |
| `C()` / `seC()` | 60 between terminals; 10-unit plate gap | Two 25-unit leads preserve grid-aligned terminals. |
| `Tee()` and `Short()` | 40 × 40 body | External pins are 20 units. |
| `Thru()`, `Shift90()`, `Tlin()`, `mlin()`, `mtfr()` | 80 × 30 body | External pins are 20 units; `mtfr()` reads `mTFR`. |
| `Tclin()`, `mclin()`, `Coupler180()` | Two 80 × 30 bodies, 10 apart | Four 20-unit pins; `180` is in the lower coupler body. |
| `Attn()` | 60-unit through line | Stylized vertical resistor has no top or bottom pins. |
| Complete circuits | 40-unit minimum content margin | Labels may use the 10-unit half-grid. |

- All dimensions below are **SVG `viewBox` units**, not fixed screen pixels. The browser scales them to the rendered size. A `viewBox` width and height must each be a positive multiple of 20.
- Use one 20-unit electrical grid for every canonical symbol and complete circuit. Every symbol terminal, component anchor, interconnect wire point, junction, external port, and electrical node must have coordinates divisible by 20. This includes compact and multiport symbols after placement and rotation.
- Canonical symbol pins are visibly 20 units long, measured from each terminal-dot center to the first body edge or marked junction. The standalone `C()`/`seC()` symbol uses 25-unit leads to fit a 10-unit plate gap between grid-aligned terminal dots. `Attn()` is a stylized icon with a continuous through line and no separate pin-to-body segment. A continuous unbounded rail does not make its first 20 units visually identifiable as a pin. Circuit interconnects begin at terminal dots and are separate from symbol pins.
- Use a 10-unit half-grid for **complete-diagram labels** and ordinary internal symbol details. Canonical reference symbols may keep their established label coordinates. Use a 5-unit quarter-grid only for internal shape details such as capacitor plates or inductor loops; these are not terminals or interconnect wires.
- Rotate complete symbols only in 90-degree increments around a grid-aligned anchor. A horizontal resistor may thus be placed vertically without changing its body, leads, or port order. Do not scale a symbol to make its terminals meet the grid.
- A placed `Tee()` may use `mirrorY: true` when its common port must face upward. Mirror its geometry and public port coordinates together; the port numbers remain attached to their original branches. Use the placement only where it gives a clearer routed circuit, such as the lower junction in a Wilkinson divider.
- Leave at least 40 `viewBox` units between visible content of a **complete diagram** and each canvas edge. Canonical reference symbols use their own compact canvases. Keep labels and captions inside the canvas with clear visual margins. Prefer left-to-right signal flow and vertical shunt branches. Use horizontal and vertical wires; diagonals belong only inside a canonical component symbol.
- Center a complete circuit's **electrical reference** on the SVG vertical axis at `viewBox min-x + width / 2`. For a symmetric circuit, choose the central component or junction; for a series path, choose the midpoint unless another component clearly dominates. For an asymmetric circuit, choose and name the meaningful reference. Do not center from whitespace or the ink bounding box. Record the choice in `layout.centerAxisX` and `layout.centerReference`.
- When comparing drawings in one note, use the same kind of electrical center and compatible canvas heights. For a digital flow diagram, identify a functional center instead of inventing an RF electrical center.

## Default visual style

- Use a 2-unit dark stroke (`#202020`) with round line caps and joins for ordinary electrical wires and symbols. Every standalone symbol and complete circuit has a white `#ffffff` background. All canonical symbol fills and strokes use only `#202020`, `#ffffff`, or `none`; do not add colored or gray fills. Draw microstrip conductors and the thin-film resistor as unshaded white interiors with dark outlines and filled dark terminal dots.
- Draw network blocks as plain square-cornered rectangles. Do not stretch a component's leads or body to fill a canvas or equalize widths across families.
- Keep wires and symbols as SVG shapes and paths, and labels as SVG `<text>`. Use explicit, readable coordinates rather than minified or traced path data. Group related geometry and identify components or node groups with concise comments.
- Give every standalone SVG a descriptive `<title>` and `<desc>`. Use `Arial, Helvetica, sans-serif` at 13 viewBox units and normal weight for all visible text in canonical reference symbols, including titles, port labels, and internal annotations. Give compact symbols enough canvas and label clearance for this size. The composer uses 16-unit complete-diagram labels. Do not rely on CSS inherited from a page.
- Center names and markings drawn inside a component body on that body's horizontal and vertical center using `text-anchor="middle"` and `dominant-baseline="middle"`. For an asymmetric body such as an amplifier triangle, use its visual centroid. Keep external titles, descriptions, and port captions outside the body.
- Name finished SVGs with descriptive lowercase kebab-case names. Do not add an XML declaration unless a consumer requires it.

## Standard RF geometry

- A horizontal ANSI resistor has terminals 100 units apart, 20-unit leads at both ends, and a 60-unit-wide by 20-unit-high zigzag body. In local coordinates its terminals are `(0, 0)` and `(100, 0)`; the zigzag runs from `x = 20` to `80` between `y = -10` and `10`. Use this zigzag consistently rather than a rectangular resistor. Rotate the whole symbol for vertical placement.
- A horizontal series inductor has terminals 100 units apart and 20-unit leads at both ends. Its 60-unit-wide body has four equal 15-unit loops rising 20 units above the lead axis. Rotate the whole symbol for vertical placement.
- A horizontal series capacitor has terminals 60 units apart, 25-unit leads, a 10-unit plate gap, and 20-unit plate lengths. In local coordinates its terminals are `(0, 0)` and `(60, 0)`; plates lie at `x = 25` and `35` from `y = -10` to `10`. Never run a wire across the gap. Rotate the whole symbol for vertical placement.
- Put a filled node directly where series-component leads meet. Do not insert an arbitrary spacer wire merely to increase component separation.
- Draw an ideal `Tee()` as a 40-by-40-unit square. Keep its interior empty except for a port-1 marker near the common branch. The interior marker is 75% of the terminal-dot diameter and is visibly separate from the external dot. Put the standard lead between a numbered node and the square edge.
- Draw `Short()` as an empty 40-by-40-unit one-port square with `Short` outside it. In a composed circuit, supply that text in `labels` with `componentId` set to the Short component's ID; reference-symbol captions are not copied into complete diagrams. Do not substitute a ground symbol or interior ground lines. Reusing a JavaScript `Short` or `Tee` object does not make separate drawn occurrences one electrical node.
- For shunt constructors beginning with lowercase `pa`, use a marked T junction at the top of the shunt branch, with horizontal 20-unit pins from the two terminal dots to the junction. Show the internal shunt impedance beneath it. Rotate the canonical R/L/C primitives by 90 degrees without changing proportions. Stack internally series elements vertically and put internally parallel elements on separate vertical branches. Make the canvas taller when necessary.
- For series-path constructors beginning with `sePa`, place the two external ports at the midpoint of the left and right vertical rails. Put the upper and lower parallel branches equally far above and below the port axis; a third branch, when present, lies on the port axis. Place port labels beside the external terminal dots, clear of the branches.
- For `seriesTee()`, ports 1 and 2 form the horizontal through path and port 3 is the series branch. Keep its port-1 marker by the left through port so it cannot be confused with `Tee()`.

## Microstrip and multiport geometry

- Use `Thru()`'s 80-by-30 outlined body and 20-unit pins for `Shift90()`, `Tlin()`, and `mlin()`. Match `mlin()` to `Tlin()` in its 280-by-180 canvas, terminal coordinates, and label positions. Use two 80-by-30 bodies with a 10-unit vertical gap for each four-port coupled symbol: `Tclin()`, `mclin()`, and `Coupler180()`. Match `mclin()` to `Tclin()` in its 320-by-220 canvas, 20-unit pins, clockwise port order, and label positions. Put `180` inside `Coupler180()`'s lower body between ports 4 and 3. Use the constructor title and an appropriate parameter caption to distinguish the physical model.
- Draw `mtfr()` with the same 80-by-30 body and 20-unit pins as `Thru()`, with `mTFR` centered inside its unshaded body.
- Draw `Attn()` as a vertical resistor zigzag with no top or bottom leads. Run a 60-unit horizontal port-1-to-port-2 line through the zigzag's center, with both terminal dots on the 20-unit grid. This is an attenuation icon, not a literal resistor connection.
- Keep right-turn and left-turn `mbend()` symbols separate. With port 1 entering from the left, the right-turn variant exits downward at port 2 and the left-turn variant exits upward. Center each port on its 14-unit-wide conductor arm. Use a 14-by-14 inner corner, a 13-unit extension toward each port, and a 7-by-7 chamfer at the outside corner. Mirror the conductor vertically to obtain the opposite turn. Enlarge this compact copper silhouette twofold in the reference SVG so its body remains legible beside 20-unit pins. Rotate an entire symbol to place it. Both variants model the same reciprocal constructor.
- Build `mcross()` from a 14-by-14 center square and one 6-by-14 extension on each side. Its unscaled copper footprint is 26 by 26 units; enlarge the silhouette twofold in the reference SVG. Public ports are left 1, top 2, right 3, bottom 4. Put a small port-1 marker inside the center near the left edge, distinct from its terminal dot.
- Build `mtee()` from a 14-by-14 center square and 6-by-14 extensions on the left, top, and bottom. Its unscaled copper footprint is 20 by 26 units; enlarge the silhouette twofold in the reference SVG. Public ports are common left 1, upper branch 2, lower branch 3. Mark port 1 inside the center near the left edge. Rotate its complete geometry and labels together; do not mirror it or relabel branches as input and output.
- Enlarge `mstep()` and both `mbend()` reference silhouettes twofold as well, preserving their shape. Place each 20-unit pin between the enlarged body's port face and a grid-aligned terminal dot. For `mcross()` and `mtee()`, make the interior port-1 dot 75% of the terminal-dot diameter.
- Number coupled-line ports clockwise from upper left: 1 upper left, 2 upper right, 3 lower right, 4 lower left. With excitation at port 1, port 2 is through, port 4 coupled, and port 3 isolated. Preserve public order when rotating any multiport symbol.
- `Tee4()` and `Tee5()` use a local 40-by-40 square with side 1 at the bottom (common), side 2 left, side 3 top, and side 4 right, numbered clockwise. Draw external leads 20 units outward. Measure lead locations from the first corner encountered moving clockwise along each side. Rotate the square, port order, and common marker together.
  - `Tee4()`: port 1 is centered on bottom side 1, with the common marker at local `(20, 30)`; port 2 is centered on left side 2, port 3 on top side 3, and port 4 on right side 4.
  - `Tee5()`: ports 1 and 2 have the same positions; top side 3 has branches leaving the square at local positions 10 and 30, then jogging outward to grid-aligned terminals. Port 5 is centered on right side 4. Keep other interior space empty.

## Symbol reference drawings and digital blocks

- A canonical symbol shows the component body and **public port order**; it is not a full circuit. Label RF ports `Port 1`, `Port 2`, and so on, in constructor order, and place a filled terminal dot at each. Do not put circuit node numbers, instance designators, or values in a reference symbol. Show the constructor name in its title area. Use consistent one-, two-, and multiport layouts across ideal and physical versions of a topology.
- Preserve nP public port order even if a paper or internal equation uses another convention. Keep distinct symbols for distinct visible topologies; do not duplicate the R/L/C alias symbols solely to change their names.
- Digital blocks and `FFT()`/`invFFT()` use signal-flow connectors, not nPort electrical ports. RF transformers `trf()` and `trf4Port()` retain electrical ports. Signal-block descriptions or accompanying notes must identify input/output direction, data type, and any mode-dependent behavior. Do not interpret a signal connector's number as an S-parameter index or `nodal()` port. Use square-cornered blocks and the same readable stroke, spacing, and background conventions.

## Circuit description domains

- Every complete diagram declares `domain` as `rf` or `signal` and supplies `layout.centerAxisX` and `layout.centerReference`. The center axis must equal the `viewBox` vertical midpoint. RF diagrams use symbols from `symbols/rf/`; signal diagrams use symbols from `symbols/digital/`. Draw a mixed system as separate electrical and signal-flow diagrams until a mixed-domain format is defined.
- In an RF diagram, each component connection has a positive integer `node` and a 10-grid `labelAt` position. Connections on the same node may be at different coordinates, joined by wires tagged with that `node`. External terminals carry the same node number. Keep one shared `labelAt` for the node's circled number. RF wires and terminals do not carry a signal name. Show component connection dots and one circled number per node.
- In a signal diagram, each connector has a nonempty string `signal` instead of `node` or `labelAt`. Each wire and external terminal names its signal. Wires for each signal must form one connected route whose endpoints reach its declared connectors and terminals. Signal diagrams do not draw circled RF node numbers. Use labels to show data types such as samples or spectrum.
- Place every component anchor, transformed canonical terminal, and interconnect wire point on the 20-unit grid. Diagram labels use the 10-unit grid. The composer checks described points and label anchors against the 40-unit margin; the validator also estimates label extents. Inspect symbol bodies and text visually because their full rendered bounds are not inferred by the tools.

## Labels, circuit nodes, and external ports

- Preserve user-supplied reference designators and node numbers. Otherwise number parts along the main path from input to output, then shunt branches in the same direction (`R1`, `C1`, `L1`, `TL1`, etc.). Suggest simple node numbers from input to output, followed by shunt nodes.
- Place a horizontal component's designator and value together on one clear line, such as `R1 = 75 Ω`, using ordinary engineering units (`5 nH`, `1 pF`, `50 Ω`). Keep labels on the 10-unit annotation grid and fully clear of wires, copper, bodies, dots, and node markers. Move the text or change its anchor when necessary; never draw a wire behind it.
- Mark every labeled nP node with a filled connection dot, including two-terminal joins and external ports. Put the node number alone in a nearby outlined circle of radius 12; do not use `node 1` or a leader that could look like a wire. Keep at least 8 units of clearance **outside** the circle from every wire, lead, or component stroke. A circle or numeral may never cover electrical geometry.
- Label external circuit ports separately as `Port 1`, `Port 2`, etc. Preserve user-provided numbers; otherwise make them agree with the matching `['out', ...]` order. Keep external port labels visually distinct from internal node numbers.
- Draw crossing wires without a junction dot as unconnected. Avoid crossings when a clearer layout is possible. Wires must end exactly at ports and node dots, without gaps, overshoot, or concealed joins.
- Label every node referenced by a matching `nP.nodal()` call. The SVG topology, terminal order, node numbers, and `nodal()` arrays must agree exactly. Do not silently renumber an established diagram; update its code and note when a node change is intentional.

## Standalone SVG structure and safety

Use this structure for a complete schematic; the composer emits the equivalent elements and embeds description metadata:

```svg
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 600 300"
     role="img" aria-labelledby="title description">
  <title id="title">Circuit name</title>
  <desc id="description">Circuit topology and purpose.</desc>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <g fill="none" stroke="#202020" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">
    <!-- Wires and canonical component geometry -->
  </g>
  <g fill="#202020" font-family="Arial, Helvetica, sans-serif" font-size="16">
    <!-- Labels and node numbers -->
  </g>
</svg>
```

- Keep the SVG self-contained. Do not include JavaScript, event attributes, animation, embedded HTML, `<foreignObject>`, external images, remote fonts or stylesheets, network requests, or executable links. Static display must not require an SVG editor or the nPort RF Analysis plugin.
- Store geometry as inspectable SVG primitives and text. Use a white background and dark strokes for legibility when embedded in documentation, printed, or exported to PDF.

## Authoring and visual review

1. Read the relevant note or example, identify its exact topology, values, designators, external ports, and nodes, and sketch a grid layout before placing symbols. Ask for clarification only when a choice materially changes the circuit.
2. Read the actual canonical SVG and its port coordinates. Run `node schematics/tools/validate-symbol-library.js`. Compose from `schematics/circuits/*.json` with `node schematics/tools/compose-schematic.js` and validate with `node schematics/tools/validate-schematic.js`.
3. Compare the JSON description and SVG to the source drawing and nP code. Parse the SVG as XML and inspect its rendered appearance at the size used in the docs. Check print/PDF legibility when relevant.
4. Before publishing, confirm that node circles and all text clear electrical strokes; electrical centering is correct; blocks have square corners; embedded symbols match the library; wires meet ports precisely; nothing is clipped; and 40-unit margins remain. When showing subcircuits and their combined network, show the detailed parts first and the combined schematic immediately before its code or results unless the note calls for another order.

The validator recomposes an SVG from its embedded description and current canonical symbols and requires an exact match. It also checks described routing, label margins, and some clearances. It cannot prove agreement with an external sketch or replace rendered visual inspection. Move questionable annotations rather than accepting near contact.
