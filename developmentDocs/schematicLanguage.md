<!-- Modified: 2026-11-16 -->
# Schematic authoring language

This note describes the drawing-input language for `nP.schematic()`. Its audience is an engineer creating an SVG for a note, article, book, or presentation. The engineer describes components, connections, directions, and annotations; the renderer supplies the symbol placements, interconnect boxes, and finished SVG.

**Status:** the first drawing-input implementation accepts the paths, values, terminal lists, directions, mirrors, alignments and annotations described below. It returns `svgText` and provides Save SVG alongside the existing controls. The existing nPort and signal-path routes remain available. Numerical source-behavior constructors and a multi-network collection signature remain future work. The authoring harness and its tested scope are described below; the earlier audit of 42 nPort examples is not a claim that all 42 have already been translated and visually verified as authoring inputs.

For the existing renderer and its data structures, see [Schematic system](schematicSystem.md). For reusable engineering layout intent applied to nPort networks, see [Schematic shape vocabulary](schematicShapeVocabulary.md). An authoring object describes a particular drawing; a runtime shape board describes a reusable layout pattern. Those are separate concepts.

## Start with a complete example

The first example is a figure for an S-parameter introduction. An ideal 1 V RMS voltage source drives a 50-ohm source impedance, a 75-ohm series-resistor DUT, and a 50-ohm load. The dotted DUT boundary surrounds R5 and extends down around part of the return conductor.

```text
                 2        3
        ┌──[R1]──●──[R5]──●──┐
      1 ●                    │
        +                    │
       (Vin)               [R6]
        −                    │
        │                    ● 4
        └────────────────────┘
```

The following copy-and-edit authoring template runs with the rebuilt browser bundle. The same example is in [schematicAuthoring.html](../dev/schematicAuthoring.html).

```js
var mySchematic = {
  paths: [
    '4 left up Vin=V(1 Vrms)[1,2] 1 4',
    '1 right R1=R(50 ohm) 2',
    '2 right R5=R(75 ohm) 3',
    '3 down R6=R(50 ohm) 4',

    'alignY Vin.1 R6.1'
  ],

  annotations: [
    {
      type: 'rectangle',
      around: 'R5',
      extendTo: {node: 4, segment: 'bottom'},
      style: 'dotted',
      padding: 20
    },

    {type: 'label', node: 2, label: 'V1', position: 'above'},
    {type: 'label', node: 3, label: 'V2', position: 'above'},

    {type: 'arrow', node: 2, toward: 'R5', label: 'I1', position: 'below'},
    {type: 'arrow', node: 3, toward: 'R5', label: 'I2', position: 'below'},

    {type: 'port', number: 1, node: 2, reference: 4, side: 'left'},
    {type: 'port', number: 2, node: 3, reference: 4, side: 'right'}
  ]
};

var mySchematicSVG = nP.schematic(mySchematic);
```

Vin's terminal 1 is positive and connects to node 1. Its terminal 2 connects to node 4. V1 and V2 are voltage labels at nodes 2 and 3 relative to node 4; they are not additional source components. Vin denotes the ideal source voltage before R1, rather than the voltage at the DUT input.

For the DUT, port 1 is node 2 relative to node 4, and port 2 is node 3 relative to node 4. Both current-reference arrows point into R5. For this series DUT, `I2 = -I1` under those reference directions. The description draws these labels and arrows; it calculates no voltage, current, or S-parameter.

Suggested caption: **Figure 1. A 75-ohm series resistor measured between a 50-ohm source and a 50-ohm load. Vin is the ideal source voltage.**

## Input contract and the two schematic routes

| Property | Required? | Contents |
| --- | --- | --- |
| `paths` | Yes | An array of component/path strings and optional alignment instructions |
| `annotations` | No | An array of labels, arrows, enclosing rectangles, and port descriptions |

Use a named description object, followed by a separate call and assignment, as in the worked example. `mySchematicSVG` names the returned schematic API object; that variable name does not make the result a raw SVG string.

The two input routes are:

```js
// Drawing-input route
var mySchematicSVG = nP.schematic(mySchematic);

// Existing nPort-input route
var networkDrawing = nP.schematic(network, options);
```

Drawing input requires no `global.fList`, `tList`, source waveform, nPort construction, or electrical simulation. A token such as `R1=R` looks up canonical artwork; it does not execute `nP.R()`. Parenthesized content supplies display text rather than constructor arguments.

The nPort route continues to read the network's actual connection metadata. An upstream cascade or nodal network used as a part retains its network boundary and appears as a block in the enclosing network's drawing. Multiple supplied networks should retain their individual boundaries; the exact collection signature has not been settled.

Both routes should feed the shared drawing graph and SVG rendering facilities, preserving the existing nPort API. The authoring parser and layout operations should work from data without DOM, clipboard, canvas, or electrical-analysis dependencies; browser mounting and toolbar actions remain a separate stage.

## Ordinary component lines

The preferred authoring form puts one component on each line:

```text
startingNode direction instanceName=symbolName endingNode
```

For example:

```js
[
  '1 right R1=R 2',
  '2 right R5=R 3',
  '3 down R6=R 4'
]
```

The two-terminal shorthand assigns terminal 1 to the starting node and terminal 2 to the ending node. Component instance names are independent of their symbols: `Rin=R` selects the same resistor artwork as `R1=R`.

A compound symbol remains one component instance:

```js
'1 right RL1=seSeRL 2'
```

The existing `seSeRL` artwork contains a resistor followed by an inductor. Its internal R-L connection is part of that symbol, not another numbered external node.

Longer two-terminal paths are also intended to be allowed. Directions persist within one path string until changed:

```js
'1 right R1=R 2 R5=R 3 down R6=R 4'
```

Each separate component line supplies its own approach directions. One component per line makes review, terminal assignment, and component-specific options easier.

## Values and control expressions

An optional parenthesized caption follows the symbol name:

```js
'2 right R5=R(75 ohm) 3'
'10 up G1=VCCS(gm * Vcontrol) 11'
```

The general ordering is:

```text
name=symbol(optional display text)[optional terminal list]
```

Everything inside parentheses is display content. It is not evaluated as JavaScript, converted into S-parameters, or used to solve the circuit. The parser must preserve spaces within it. Instance names and captions produce labels such as `R5 = 75 Ω`. ASCII input such as `ohm`, `Vrms`, and `*` can be typeset using engineering notation; the exact typography substitutions still need definition.

The value is optional. A source control expression identifies what the drawing illustrates; numerical source behavior will be defined separately.

## Explicit terminal-to-node assignments

For a multiport symbol, list the component terminal numbers in brackets and then list their corresponding circuit nodes:

```js
'1 right T1=Tee[1,2,3] 10 1 2'
```

| Tee terminal | Circuit node |
| --- | ---: |
| 1 | 10 |
| 2 | 1 |
| 3 | 2 |

The leading node 1 identifies the approached terminal: Tee terminal 2. `right` guides the approach from the left. Every terminal is assigned once. There is no additional `; 1=10` suffix because the full lists already supply that assignment.

These are independent examples, not rows of one circuit:

| Symbol | Component line |
| --- | --- |
| Tee | `'1 right T1=Tee[1,2,3] 10 1 2'` |
| Microstrip tee | `'1 right T1=mtee[1,2,3] 10 1 2'` |
| Four-terminal tee | `'1 right T1=Tee4[1,2,3,4] 10 1 11 2'` |
| Coupled transmission line | `'1 right CL1=Tclin[1,2,3,4] 1 10 2 11'` |
| Microstrip coupled line | `'1 right CL1=mclin[1,2,3,4] 1 10 2 11'` |
| Autotransformer | `'1 right AT1=trfAuto[1,2,3] 1 2 3'` |

The same full form handles polarity and terminal order on a two-terminal source:

```js
'4 left up Vin=V(1 Vrms)[1,2] 1 4'
```

The leading node 4 approaches terminal 2; terminal 1 is node 1. Passing through Vin reaches node 1, so the path closes there. Ending at node 4 instead would assign both source terminals to the same node. Direction alone must never silently reverse an explicit terminal assignment or voltage polarity.

## Directions, automatic rotation, and mirror

The direction words are `right`, `left`, `up`, and `down`.

Consecutive direction words create interconnect turns. In `4 left up Vin=V[1,2] 1 4`, the return route travels left and then turns upward to approach Vin. The last direction before a component is its approach direction.

The interpreter rotates the complete canonical symbol in 90-degree steps so that the assigned approach terminal accepts that path direction. Numbered terminals and polarity marks stay attached to their original geometry. For a coupled line, its canonical terminal offsets can make the following connection step upward or downward; the symbol is not stretched or renumbered to erase that offset.

The optional `mirror` keyword reflects a component across its approach axis:

```js
'1 right CL1=Tclin[1,2,3,4] 1 10 2 11 mirror'
```

| Approach | Effect of `mirror` |
| --- | --- |
| `right` or `left` | Exchanges above and below |
| `up` or `down` | Exchanges left and right |

For the initial form, place this component-specific option at the end of its component line. An independent `rotate90` command and separate horizontal/vertical flip commands are not part of this agreed first version. Rotation is inferred from the selected terminal and approach; `mirror` selects the other reflected arrangement while preserving that approach.

## Joins, branches, and open ends

Electrical connections use numeric node identities. Repeating a node number joins the corresponding terminals, even when their physical coordinates differ. A source or final return to the starting node is not required.

For example, this tee introduces a terminated downward branch:

```js
[
  '1 right T1=Tee[1,2,3] 10 1 2',
  '10 down C1=C 11',
  '11 down S1=Short'
]
```

`Short`, `Open`, `Load`, and `mvgnd` are one-terminal endings when selected from the canonical catalog. A path to one of them has no second terminal/node assignment.

A drawing may have open external connections, explicit termination symbols, branches, parallel paths, or loops. Completeness means accounting for its declared connections and terminals. It does not mean inventing a source, load, termination, or closing wire.

Each instance is declared once. `R1=R` and `R2=R` draw two separate components using the same symbol. Repeating a declaration of R1 produces an error. Reusing the same nPort object in several circuit occurrences remains a separate feature of the existing nPort input route.

Component-terminal references such as `T1.1` are available for alignment and annotation targeting. Ordinary electrical path connections continue to use node numbers, as in `10 down C1=C 11`.

The parser first collects declarations and then resolves connections and constraints. Moving Vin's declaration to the first line must retain the described circuit. Line order does not change electrical node identities or override the specified directions and alignments.

## The box model behind the drawing

The board is the layout template. Each component and each interconnect piece occupies a box. The engineer describes electrical connections and directions; the interpreter supplies these boxes.

- A component's canonical body and pins belong to its component box.
- Straight interconnect boxes run horizontally or vertically.
- Corner boxes make 90-degree wire turns.
- A straight wire separates connected component boxes and separates an external port from a component.
- A corner joins straight wire boxes and never connects directly to a component.
- Terminals, component anchors, wire points, and node markers use the shared 10-unit placement grid.
- Symbols rotate by quarter turns and keep their canonical dimensions.
- The drawing and viewBox expand or translate to accommodate upward/downward paths; they must not clip a path because it extends beyond the starting origin.

For the upper-left connection in Figure 1, the internal sequence is:

```text
Vin's box → wire box (●1) → corner box → unmarked wire box → R1's box
```

All three interconnect boxes belong to electrical node 1. A node identity can occupy several geometry boxes; it is not a single grid coordinate.

### Numbered markers

Each electrical node receives one numbered marker. On a cornered connection, prefer the straight wire immediately before its first corner in the route direction. Place the dot near that wire's midpoint, snapped to the grid, and move it along the wire to clear terminals and crossings. If the entire incoming lead is unusable, use another clear straight segment of the same node. Branch selection uses a stable route order. Straight connections retain their midpoint markers.

The corner and remaining straight segments have no additional numbered markers. Actual junction dots, external-port dots, and optional component-terminal dots are separate visual markers and introduce no new electrical nodes.

Turns inside a tee or physical bend symbol are component geometry. A physical bend retains its two distinct terminal connections. The current branchline examples use tee symbols at their square corners, with straight arm connections; the corner-wire marker rule therefore leaves those examples unchanged.

### The earlier two-loop example

```text
                 2        3
        ┌──[R1]──●──[R5]──●──┐
      1 ●        │           │
       (V1)     [R2]        [R6]
      6 ●        │           │
        └──[R3]──●──[R7]──●──┘
                 5        4
```

This has six nodes. The earlier label A denotes node 2, joining R1/R2/R5; B denotes node 5, joining R2/R3/R7. Each three-way junction has one node identity and its own junction marker. Each outer cornered connection has one numbered marker shared by its wire segments.

To obtain Figure 1, remove R2's branch and replace R3/R7 with a continuous lower return wire. Former nodes 4, 5, and 6 then merge into one electrical node, labeled 4. The return wire includes both lower corners and rises to Vin. Deleting that return wire would produce a different, open circuit.

## Spacing, alignment, and crossings

Automatic spacing measures canonical symbol dimensions, wires, and required clearance. It should accommodate unequal arm lengths and multiple component counts without asking the engineer to enter pixel coordinates. Explicit alignment instructions can express required relationships:

```js
'alignX T1.1 T2.1'
'alignY Vin.1 R6.1'
```

`alignX` assigns the same horizontal coordinate; `alignY` assigns the same height. These references address component terminals, not the location of a node dot. Node numbers cannot serve as unique alignment coordinates because a node can span an extended route.

Different electrical node identities remain separate at a wire crossing. Render a visible gap rather than a junction dot. Shared node identities represent one electrical connection. Drawing a crossing or corner must never create a new electrical node number.

These are shared language/interpreter operations. Adding an RF drawing should not require a dedicated JavaScript matcher or placement callback for that circuit.

## Annotations

Annotations add explanatory artwork after the circuit geometry has been established. They do not create sources, components, or electrical connections. Placement should avoid symbol bodies, wires, and other labels.

### Labels

```js
{type: 'label', node: 2, label: 'V1', position: 'above'}
```

The text is a voltage label at node 2 in the worked example. It does not declare another component merely because its text starts with V. The voltage's common reference is node 4 in that figure; the label itself performs no measurement or calculation.

### Arrows

```js
{type: 'arrow', node: 2, toward: 'R5', label: 'I1', position: 'below'}
```

The arrow follows the wire approaching R5. Use the general name `arrow`; the label supplies its physical meaning. For the series DUT, arrows at nodes 2 and 3 both point toward R5, establishing the S-parameter current-reference convention.

### Enclosing rectangles

```js
{
  type: 'rectangle',
  around: 'R5',
  extendTo: {node: 4, segment: 'bottom'},
  style: 'dotted',
  padding: 20
}
```

The left, right, and top boundaries follow the bounds of R5 and its component caption, plus padding. The lower boundary extends below node 4's bottom horizontal wire. This encloses the portion of that wire beneath R5, rather than expanding the rectangle to surround the whole return net. Cornered routes retain one node identity throughout; `segment: 'bottom'` selects geometry, not a new node.

### External ports and reference conductors

```js
{type: 'port', number: 1, node: 45, side: 'left'}
{type: 'port', number: 2, node: 1, side: 'right'}
```

These examples display Port 1 at node 45 and Port 2 at node 1. The two numbering systems are independent. If the reference conductor is explicitly drawn, include it:

```js
{type: 'port', number: 1, node: 2, reference: 4, side: 'left'}
```

This identifies port 1 as node 2 relative to node 4. A port annotation adds no extra electrical node or terminating component. In the nPort-input route, the network's actual external-port ordering remains authoritative.

### Placement defaults

Component names and values belong above horizontal symbols or beside vertical ones. Voltage labels and arrows belong beside their target wires. Rectangles derive their bounds from their target geometry and padding. Optional label/arrow `position` values are `above`, `below`, `left`, and `right`; placement remains grid aligned and avoids collisions. External-port `side` guides port-label placement. Related annotations on the same wire row or column are placed as groups: voltage labels, current arrows, port labels, and circled node numbers keep common baselines. Collision avoidance moves the whole group when a symbol, caption, wire, or enclosure border blocks one member. Grouping uses annotation roles and geometry, not names such as V1 or I2. Ordinary annotations require no coordinates.

## Canonical sources and separate source behavior

The six source drawings are implemented under [schematics/symbols](../schematics/symbols/). `V` now has a numerical constructor and is registered under `constructors`; the other five names remain in `sourceSymbols`:

| Symbol name | Body | Marking and meaning |
| --- | --- | --- |
| `V` | Circle | `+`/`−`; terminal 1 is positive relative to terminal 2 |
| `I` | Circle | Arrow from terminal 2 toward terminal 1 |
| `VCVS` | Diamond | Voltage-controlled voltage source; `V = Av × Vc` |
| `VCCS` | Diamond | Voltage-controlled current source; `I = gm × Vc` |
| `CCVS` | Diamond | Current-controlled voltage source; `V = rm × Ic` |
| `CCCS` | Diamond | Current-controlled current source; `I = Ai × Ic` |

Their canonical orientation has electrical terminal 1 above terminal 2, with 20-unit pins and the same grid, fonts, colors, and rotation rules as the rest of the library. Dependent sources have two drawn output terminals; the model separately identifies the controlling voltage or current. In a concrete drawing, the caption can name that control expression. Reference captions are not numerical model definitions.

Drawing syntax still selects geometry without calling numerical constructors. The separate `nP.V()` implementation in `src/np-nport/src/sources/V.js` returns a two-port nPort with a DC voltage-source descriptor and explicit incremental S/noise rows; its terminal order matches this artwork. `I()`, `VCVS()`, `VCCS()`, `CCVS()` and `CCCS()` remain unimplemented numerical APIs. Future source implementations must describe their DC equations and public terminal/control references explicitly. See [DC analysis](dcAnalysis.md) and [Dependent sources and a MESFET model](dependentSourcesAndMesfet.md).

## Validation and errors

Validation should check known symbol names, unique instance declarations, matching terminal/node lists, valid canonical terminal numbers, the assigned approach terminal, resolvable annotation/alignment targets, unique external port numbers, and compatible geometric constraints. The validator must distinguish an intentional open ending from an unresolved or missing terminal assignment.

Errors should identify the path line and problem, for example:

```text
Path line 3: Tee4 requires four terminal assignments; received three.
```

Do not guess a replacement symbol, change a terminal number, or silently invent a connection to make an invalid description appear to work. The public `schematic()` should follow its current error-boundary behavior: display a useful error, return it through `.error`, and allow downstream JavaScript to continue. It must not present a successful-looking partial drawing after a connection failure.

## SVG and the returned API

The drawing mode returns the same kind of schematic API object as the nPort route. `drawing.svg` is the mounted SVG DOM element; `drawing.svgText` is the self-contained SVG string. Save SVG downloads that string as `schematic.svg`. The string represents the original rendered geometry independently of the current Fit drawing scale. Failures return `svg: null`, `svgText: null` and an `.error`; successful drawings also return `.graph`, `.topology` and `.detected` (null for drawing input).

SVG output should preserve vector symbols, wires, dots, text, arrows, and enclosing rectangles. Related elements should be grouped by component/annotation so Inkscape can select and edit them. Embed canonical geometry rather than linking remote artwork or rasterizing the schematic. PNG copying remains a separate output operation.

## Audit against the current shape examples

The design was checked against 42 normally rendered drawings in nine [shape harnesses](../dev/shapes/). The optional deliberate crossover-error demonstration in `parallelComposition.html` is separate from those 42 drawings.

| Harness | Drawings | Required language coverage |
| --- | ---: | --- |
| `series.html` | 4 | Two-terminal chains, physical bends, upstream network blocks |
| `ladder.html` | 2 | Tee terminals, downward branches, one-terminal endings |
| `bridgedT.html` | 5 | Three-/four-terminal junctions, bridges, rejoining paths |
| `branchline.html` | 4 | Rectangular loops, shared arms, four external ports |
| `edgeCoupledFilter.html` | 5 | Four-terminal sections, staircases, terminations, reflection |
| `powerDivider.html` | 7 | Multiple branches, unequal arms, composed sections |
| `powerCombiner.html` | 7 | Reflected layouts, transformer terminals, multiple inputs |
| `groupedNetworks.html` | 4 | Connected sections, separate occurrences, dot-display options |
| `parallelComposition.html` | 4 | Parallel/nested tracks and separate outputs |

The object can contain the information these cases need. This is a coverage/design assessment, not evidence that an authoring parser already renders them. Multiport terminal assignments, mirrored geometry, alignment, distinct external-port/node numbering, and true junction versus crossing handling are necessary shared operations.

## Implementation and current limits

`schematicInputParser.js` parses data without executing constructor functions or caption text. Instance names start with a letter or underscore and may contain letters, numbers, underscores and hyphens. Symbol names are case-sensitive catalog names, resolved through generated `schematicDrawingSymbols.js`. Spaces within grouped values and terminal lists are retained. Numeric nodes must be safe integers; node 0 has no implicit ground meaning. An approach node must identify exactly one terminal on its component. Duplicate declarations, incomplete terminal maps and unknown references are rejected. Captions are XML-escaped when rendered; `ohm`/`ohms`, `Vrms` and space-delimited `*` have display-only substitutions. There is no expression evaluator or arbitrary SVG input.

The authoring registry includes symbols with bundled runtime geometry. The canonical-only `lpfGen`, `PN`, `waveform`, `bitErrorRate`, `FFT` and `invFFT` drawings still need runtime bounds/lead descriptors before they can be selected by this input mode. Their existing numerical APIs are unchanged. Adding those descriptors is a symbol-data extension, not a new drawing-language matcher.

`schematicInputLayout.js` determines quarter-turn poses from canonical lead directions, builds per-axis equalities and minimum-separation constraints, and invokes `schematicInputConstraints.js` to solve them. Clearance between component boxes is resolved with the same constraints. Stable instance-name order makes the result independent of declaration order. Each electrical connection is routed according to its approach directions; the existing general grid router can add obstacle-avoidance turns when a preferred route crosses component artwork. Existing wire/corner box generation and final node-marker selection are reused. Raw multi-terminal wire nodes use a common junction point. Impossible constraints produce errors; this is not a proof that every physically drawable arrangement can already be laid out.

`schematic.js` shares graph finalization, topology, SVG and browser controls between the input routes. `schematicInputAnnotations.js` adds labels, arrows and rectangles and clears text away from enclosing boundaries. Arrow targets may name a component or a terminal, for example `toward: 'T1.1'`. Rectangle `segment: 'bottom'` uses the lowest horizontal height on its target node. Node numbers, port labels, voltage labels and arrows are jointly placed in aligned groups around the fixed component captions and rectangle borders; annotations do not alter electrical connections. Port annotations on an existing wire share the finalized marker position; ports at open ends retain their endpoint position. Drawing input uses its own directions/mirror/alignment and rejects nPort-only shape/block-view/whole-drawing-flip options.

The browser harness has six cases: Figure 1 with all annotations, an open-ended series network, a tee with a terminated branch, a coupled section, its mirror and a resistor ring. Automated checks additionally exercise a rectangular tee/line loop, raw three-way wire junctions, declaration-order invariance, safe captions, terminal-targeted arrows and invalid inputs. More crowded compositions, ambiguous annotation targets and longer repeated networks need broader authoring fixtures. Those should exercise the general solver and routing operations, not introduce circuit-specific helpers. The separate nPort regression suite remains applicable to the unchanged input route.

The multi-network collection signature remains a separate API decision. The pure `schematicSvg()`, `schematicGraph()` and `schematicTopology()` helpers accept drawing input as well as nPort input, including in the restricted plugin bundle. The mounted `schematic()` call and Save SVG control still require a browser; DOM-free generation belongs in those pure helpers.
