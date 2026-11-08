<!-- Modified: 2026-11-08 -->
# Schematics

`nP.schematic(network)` draws an RF network using its component symbols and electrical connections. You can draw a component, a network returned by `nP.nodal()` or `nP.cascade()`, or a transmitter–circuit–receiver path. Each call adds a drawing to the page; in the REPL, it appears in Output.

## How nP turns a network into an SVG

A schematic communicates both **electrical connectivity** and **engineering organization**. nP already has the connections from your circuit construction. Producing the picture requires a separate layout calculation to decide where everything belongs.

The process has four stages:

1. **Read the network and its symbols.** Constructors record component information, and `nodal()` records which node connects to each numbered component port. Cascades record the order of their connected stages. This construction information is retained in the network's `_schematic` metadata. The bundled symbol library supplies the canonical artwork and terminal positions for each component. The S-parameter matrix describes the network's external electrical behavior; the construction metadata supplies the connections needed to draw its internal circuit.
2. **Examine the connections and choose an arrangement.** The layout code treats components and electrical nodes as a connection graph: a record of what joins what. It can trace a signal path, find branches, and detect loops. Shape detection compares those connections with supported arrangements. Engineer-supplied shape groups or explicit shape options guide the choice; otherwise nP tries whole-network detection and then a generic layout.
3. **Calculate the drawing geometry.** For supported shapes, a shared board interpreter organizes component and wire boxes according to the shape definition. Layout code measures the actual symbols, places and rotates them on a common grid, connects their numbered terminals, and positions labels. Composed sections must leave room for their internal branches while meeting neighboring sections at the correct nodes. The resulting drawing model contains symbol positions, wire paths, dots, text positions, and the rectangle enclosing the drawing.
4. **Render the geometry as SVG.** SVG means *Scalable Vector Graphics*: the browser draws paths, lines, and text from coordinates. nP's SVG renderer reads the completed drawing model, inserts the canonical symbol artwork with its calculated transformations, and draws the wires and annotations. The browser displays that SVG, which remains sharp when enlarged. The schematic toolbar provides the fit and PNG-copy controls described below.

**Layout decides where things go; rendering draws them there.** By the time the SVG renderer runs, the component arrangement and wire routes have already been chosen. The returned `drawing.graph` exposes that geometry, while `drawing.topology` summarizes the electrical connections for inspection.

```text
Network connections + component symbols + available shape guidance
                              ↓
                    Match and calculate layout
                              ↓
                 Drawing model with SVG coordinates
                              ↓
                         SVG renderer
                              ↓
                     Schematic on the page
```

## Why a readable schematic is a hard problem

A netlist gives connections without a unique picture. Two resistors in series are straightforward: a short path from input to output usually communicates everything needed. Add several shunt branches, parallel signal paths, or coupled sections, and many electrically equivalent arrangements become possible. Detecting a loop establishes that a path closes; it leaves open whether the engineer expects a rectangular coupler, an upper bridging branch, or another familiar arrangement.

Each placement also affects its neighbors. Rotating a Tee changes where its common branch emerges. Giving a long shunt arm enough room can change the spacing of an entire ladder. Placing two divider arms symmetrically requires space for both arms and their isolation resistor. Wires, terminal positions, node numbers, and component labels must remain legible together. Improving one part of the drawing can create a collision or an unnecessarily long wire elsewhere.

Engineering convention adds knowledge beyond connectivity. A familiar branch-line coupler should read as a compact rectangular structure. A filter should reveal its main path and shunt arms. A divider should make its balanced branches apparent. A generic connected drawing can preserve the circuit while obscuring these relationships. The layout therefore has to balance electrical correctness, geometric constraints, and the arrangement an RF engineer recognizes.

The schematic's spacing serves readability. Component values and transmission-line lengths still determine the electrical calculation; the drawn wire lengths and symbol spacing express the schematic arrangement rather than a physical board layout.

## Why the engineer supplies layout information

You know which parts form an input matching section, a divider, a filter, or a combining section. An ungrouped connection list can leave those boundaries ambiguous. For example, a resistor immediately before a ladder could belong to an upstream series section or to the ladder's first series arm. Both interpretations preserve its electrical connections, but they organize the drawing differently.

Shape guidance passes that knowledge to nP. Supply a supported arrangement name and identify the connection rows belonging to it. For a larger circuit, separate groups describe the successive or parallel sections you expect to recognize in the finished schematic. Direction can matter too: the same passive divider network can be used as a combiner, so the intended view may need guidance.

The renderer then handles coordinates, rotations, spacing, wires, and labels within its supported layouts. Automatic detection can save this work for recognized whole networks. Group information is needed when the renderer cannot infer your intended sections reliably. It improves the drawing without changing component values, port numbers, node connections, or S-parameters. The next section introduces nP's term **shape** and shows how to supply that information beside the electrical connections.

## Put shape groups beside the connections

An RF engineer usually has a picture in mind before drawing a circuit. A low-pass filter has a main signal path with shunt elements descending toward ground. A Wilkinson divider has two arms arranged symmetrically around an isolation resistor. A branch-line coupler has transmission-line arms forming a rectangular loop. Those familiar arrangements make the drawing easy to recognize and read.

**A shape is nP's name for that expected engineering arrangement.** It gives the schematic renderer advance information about how you want a circuit, or a section of a circuit, organized on the page. Names such as `series`, `ladder`, and `powerDivider` express drawing intent in terms of arrangements you already know.

The electrical connections alone leave many drawing choices open. The node list in `nodal()` tells nP which numbered component ports connect. It supports the same electrical calculation whether the resulting picture places a shunt resistor below the main path, above it, or far off to one side. To produce the drawing you expect, the renderer also needs to choose signal-flow direction, component orientation, branch spacing, and the arrangement of loops. A shape supplies a familiar arrangement within which it can make those choices.

Three kinds of information work together:

- **Component symbols** provide the artwork and numbered terminals for each part.
- **Network connections** specify which terminals are electrically joined. These remain authoritative throughout the drawing process.
- **Shapes** guide the placement of those parts and their connecting wires into a recognizable schematic.

For example, `series` asks for a succession of two-port components along a signal path. It can contain two resistors, thirteen transmission-line sections, or other two-port nPorts. `ladder` asks for a main path with tee-led shunt branches drawn downward to their terminations. Its series and shunt arms can each contain several components. The renderer takes the actual parts, values, and connections from your network and fits them into the supported arrangement. You supply the intended arrangement; it calculates the drawing coordinates.

You can begin with **`nP.schematic(network)`**. The renderer recognizes supported whole-network shapes automatically and uses a generic drawing when it cannot find a complete match. For a larger network containing several recognizable sections, your knowledge of where those sections begin and end becomes valuable. The current detector cannot automatically divide every flat netlist into the sections an engineer has in mind. Supplying shape groups gives it that information and makes a familiar layout more dependable. The groups affect the drawing while preserving the electrical analysis.

In the following example, the intended picture is a series section, then a ladder section, then another series section. Put each shape name around the connection rows belonging to that section in `nP.nodal()`, then draw the completed network with **`nP.schematic(network)`**. Each group tells the renderer both the arrangement to use and which component occurrences belong to it. You do not need to supply shape names or boundary nodes again in the schematic call.

```js
// Series–ladder–series: one network, repeated shape names, reused components
var g = nP.global;
g.fList = [2e9];

var r1 = nP.R(75);
var r2 = nP.R(50);
var c1 = nP.C(1e-12);
var tee1 = nP.Tee();
var short1 = nP.Short();
var network = nP.nodal(
  {series: [
    [r1, 1, 2],
    [r2, 2, 3]
  ]},
  {ladder: [
    [tee1, 4, 3, 5],
    [c1, 4, 6],
    [short1, 6],
    [r2, 5, 7]
  ]},
  {series: [
    [r1, 7, 8]
  ]},
  ['out', 1, 8]
);

var drawing = nP.schematic(network);
var detected = drawing.detected;
nP.log(detected);
```

The shape name describes how the engineer expects that section to look. Ordinary node numbers specify every electrical connection. The renderer finds where each group connects to its neighbors and derives the section boundaries automatically. Use separate objects when a shape repeats; do not repeat a property inside one JavaScript object, because the later property would replace the earlier one.

Each group belongs to one final nodal network. It adds no intermediate nPort, extra electrical node or network block. The same component object can appear in several groups, as `r1` and `r2` do above; each connection row remains a separate occurrence. Grouped and ordinary flat syntax use the same electrical calculations. Keep `['out', ...]` outside the groups as the final connection row; optional signal settings still follow it.

| Shape name | Engineering arrangement |
| --- | --- |
| `series` | A continuous path of two-port components, with bends when present |
| `ladder` | A main path with tee-led, downward terminated shunts |
| `bridgedT` | A main path with upper bridges and downward terminated shunts |
| `branchline` | Rectangular transmission-line cells with four external ports |
| `edgeCoupledFilter` | A staircase of coupled sections with explicit terminations |
| `powerDivider` | The supported transformer or single-stage Wilkinson divider |
| `powerCombiner` | The corresponding reflected combining arrangement |

A group must fit the actual connections supported by its board. Put all two-port rows in groups when composing sections. Direct junctions such as `Tee()` and `Tee4()`, and one-port terminations, may remain ordinary rows outside groups. Group values contain component rows; nested group objects are not part of this syntax. Section-level crossover routing remains deferred.

## Existing flat syntax and blind detection

The ordinary `nP.nodal([part, ...nodes], ..., ['out', ...nodes])` syntax remains supported. Without groups or a schematic shape option, detection tries the registered whole-network boards, then uses the generic layout if no complete match is found. Automatic decomposition of an entirely ungrouped network is not implemented.

`drawing.detected` reports an independent shape-options object. With grouped input, detection examines the component membership of each group without reading its declared shape name, and returns recognized sections with inferred boundaries. A single group covering the complete network can return a single shape name. A declared group shape controls rendering unless an explicit `schematic()` shape option overrides it. A mismatch is reported rather than quietly changing the requested engineering arrangement.

Passive standalone dividers and combiners have the same topology, so blind detection defaults to `powerDivider`. A `{powerCombiner: [...]}` group requests the reflected view while keeping the simple drawing call. In a composition, neighboring groups can also establish which interface faces the input side.

## Explicit shape options

For a flat network, request one whole-network shape with `shapes: ['series']` or another supported name. For example, this two-resistor network can be drawn automatically or with explicit series guidance:

```js
// Explicit series guidance and independent detection
nP.global.fList = [2e9];
var r1 = nP.R(25);
var r2 = nP.R(50);
var seriesNetwork = nP.nodal(
  [r1, 1, 2],
  [r2, 2, 3],
  ['out', 1, 3]
);
var seriesDrawing = nP.schematic(seriesNetwork, {
  shapes: ['series']
});
var detectedOptions = seriesDrawing.detected;
nP.log(detectedOptions);
nP.schematic(seriesNetwork, detectedOptions);
```

The detector does not read the supplied shape hint. Here it independently returns `{shapes: ['series']}`, which the second call reuses.

To describe multiple sections explicitly, use `{name, from, to}` entries. This call draws the grouped `network` from the first example with the same section boundaries:

```js
nP.schematic(network, {
  shapes: [
    {name: 'series', from: 1, to: 3},
    {name: 'ladder', from: 3, to: 7},
    {name: 'series', from: 7, to: 8}
  ]
});
```

`from` and `to` are the actual node labels from `nodal()`, not component indices or drawing coordinates. Adjacent sections share their boundary node. A divider or combiner interface can use an ordered array, such as `{name: 'powerDivider', from: 1, to: [40, 41]}` followed by `{name: 'powerCombiner', from: [40, 41], to: 50}`. The boundary list order pairs the section ports. The connections must match every requested section; an explicit request overrides stored groups and does not silently fall back on a mismatch.

For runnable examples, choose [Schematic shape detection](./repl.md#example-schematic-shape-detection) or [Schematic groups and dots](./repl.md#example-schematic-groups-and-dots) in the REPL.

## Returned API, labels and controls

The return object contains `{svg, graph, topology, detected, error}`. `svg` is the displayed SVG element; `graph` contains drawing geometry and `topology` summarizes electrical connections. The detected object has the same form as the existing shape options and can be reused. On failure, the function displays an inline error and returns null drawing properties with an `Error` in `error`; its independent detected result is retained and later JavaScript continues. A drawing error does not change the already-computed network's electrical results.

## Dot options

The default drawing shows external-port dots and numbered-node dots, with component-terminal dots hidden:

```js
// These are the defaults; schematic(network) uses them automatically
nP.schematic(network, {
  dots: {
    ports: true,
    nodes: true,
    terminals: false
  }
});
```

| Option | Default | Controls |
| --- | --- | --- |
| `dots.ports` | `true` | Solid dots at external ports such as Port 1 and Port 2 |
| `dots.nodes` | `true` | Solid dots on wires identifying numbered electrical nodes |
| `dots.terminals` | `false` | Solid dots where wires meet component leads |

Omitted fields keep their defaults. Use `dots: {terminals: true}` to show the component connections as well. Each field accepts a boolean. These switches apply to nodal, grouped, cascade, and MOD/DEMOD drawings. They change the rendered dots without changing the layout, topology or circuit calculation. Circled node-number labels are separate and remain visible. Actual wire-junction dots and dots inside canonical symbol artwork remain visible so connection meaning and symbol artwork are preserved.

## Labels and drawing controls

Labels show three significant digits by default. Set `significantDigits` from 1 to 15 when a drawing needs more or less detail:

```js
// Label precision changes the drawing text
nP.global.fList = [2e9];
var l1 = nP.L(45.65360855435164e-9);
nP.schematic(l1, {significantDigits: 4});
```

The precision option changes only printed labels. The circuit calculation and numeric values in `graph` and `topology` keep their original precision. The drawing opens at its natural scale and grows to its full height; wide drawings scroll horizontally. **Fit drawing** scales to the available width, and **Actual size** restores the natural scale. **Copy as png** copies the whole drawing.

## Transmitter, RF circuit and receiver

For a transmitter, RF circuit, and receiver, pass the three objects together so the drawing includes the signal blocks:

```js
var g = nP.global;
g.tList = g.tGen(0, 1e-3, 2);
g.fList = [];

var tx = nP.mod({mode: 'AM', carrierHz: 200e6, toneHz: 300});
var attenuator = nP.Attn(3);
var circuit = nP.cascade(attenuator, {signal: tx});
var rx = nP.demod(circuit, {noise: false});

nP.schematic({transmitter: tx, circuit: circuit, receiver: rx});
```

The MOD and DEMOD connectors describe signal flow; they are not RF S-parameter ports. Omit `receiver` when the displayed path ends at the circuit.
