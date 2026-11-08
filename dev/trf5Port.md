<!-- Modified: 2026-11-06 -->
# Transformer hybrid power divider

`trf5Port.html` builds the DigiKey hybrid divider with nP components. T1 is
`trf(Math.sqrt(2))`, matching the 25 Ω seen at T2's center tap to the 50 Ω
input. T2 is `trfAuto()`, an ideal center-tapped autotransformer. Two `Tee()`
components connect the 100 Ω isolation resistor across the output ports. Each
tee's common port (port 1) connects to the resistor; branch ports 2 and 3
connect the transformer winding and an output port.

At 2 GHz with 50 Ω port references, the ideal network produces −3.01 dB at
each output, with near-zero input/output reflections and output-to-output
coupling. `trfAuto()` has a canonical bundled schematic symbol. The harness
also calls `nP.schematic()` with the `powerDivider` shape to draw the RF layout:
input on the left, outputs on the right, and the isolation resistor bridging
the output branches. This shape selector is intended to cover transformer,
resistive, and Wilkinson divider patterns as they are added.

The transformer shape now uses ORI, alongside series, ladder and branchline. Its definition in `schematicShapeBoards.js` contains named slots, port alternatives, relative terminal positions and wire routes. The shared interpreter matches and lays out those slots; there is no transformer-divider-specific JavaScript builder. Corner wire boxes carry no node dot. Straight wire boxes separate the resistor from both tee common terminals.

The placement grid is 10 units; ordinary symbol pins remain 20 units. The board's centerline relation aligns the input transformer axis and autotransformer tap with the midpoint between the isolation resistor's terminals. ORI applies the relation before routing, without changing canonical symbol dimensions.

## Splitter followed by a combiner

The second case builds one two-port `nodal()` network containing ten individual
components: both transformer arrangements and both isolation resistors. It reuses
the first example's individual component objects, without inserting its completed
`hybridDivider` as a block. Nodes 40 and 41 connect the splitter's two paths to
the combiner. The combiner's center tap feeds `t3`, whose port 1 is the final
external output at node 2. This uses the reciprocal transformer arrangement in
the combining direction.

For an ideal matched pair with direct, equal-phase connections, the result has
unit transmission magnitude (0 dB) and zero reflection magnitude. The table shows
the four two-port S-parameters; ideal zero magnitudes appear as negative infinity
in dB.

The second `nP.schematic()` call deliberately supplies no shape hint. It exercises
the current generic ORI board, leaving all ten components visible. Its layout is
an unguided baseline, not a claim that the renderer already composes a guided
splitter with a mirrored combiner. That two-shape capability is still pending;
the renderer and board definitions are unchanged for this test.
