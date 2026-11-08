<!-- Modified: 2026-11-08 -->
# Power-divider schematic guidance

Open `powerDivider.html` to compare three single-stage, two-way Wilkinson arrangements:

- An ideal divider with 70.71 Ω quarter-wave lines and a 100 Ω isolation resistor at 2 GHz.
- The same connections using `mtee()` and `mlin()` symbols. Its illustrative dimensions are not a tuned physical design.
- Two arms containing different numbers and types of two-port components. This tests layout coverage and spacing rather than matching or isolation performance.

The first three examples now use blind detection. Their equivalent explicit request is:

```js
nP.schematic(network, {
  shapes: ['powerDivider'],
  mount: '#drawing'
});
```

The existing transformer divider remains in `../trf5Port.html` and uses the same shape name. The `powerDivider` definition has two data alternatives: transformer and Wilkinson. ORI tries only those alternatives when the caller explicitly requests this family. Calls without shape guidance continue to use the generic board.

For Wilkinson, the input tee's common port faces left and its through ports split upward and downward. The output tees have horizontal through paths; their common ports face inward and connect to the vertical isolation resistor. Port 2 is the upper output and port 3 is the lower output. The input lies halfway between them. Electrical node numbers remain those in `nodal()`.

## How the board supplies the layout

The definition in `src/np-chart/src/schematicShapeBoards.js` supplies three named junction cells, two turning arm lanes, a vertical resistor lane, and the external port sides. The arm lanes accept one or more two-port components; the isolation lane accepts resistor components. All component occurrences must be accounted for.

ORI uses its shared connection contraction and slot assignment to bind actual junctions and paths to these cells. Its shared `byAxis` spacing measures symbol terminal spans and required wire boxes, then grows horizontal and vertical pitches independently. The longer arm determines the horizontal pitch; the resistor lane determines output separation. The symmetric cell positions preserve the input centerline even when arm contents differ. Shorter arms receive real end wires rather than invented components or nodes.

A turning lane walks the repeated component/wire tiles on its final straight segment and connects its entry with the shared corner-wire operation. The corner has no dot and is separated from symbols by straight wire boxes. Rotation, reflection, annotations, SVG output, and PNG copying use the existing common code. There is no Wilkinson-specific JavaScript matcher or placement callback.

This first variant covers a single two-way divider with three junctions. Multistage Wilkinson networks and resistive dividers require further board descriptions; this definition does not silently flatten them into the single-stage drawing.

## Divider followed by a combiner and ladder

The fourth example contains all seventeen component occurrences in one `nodal()` call. It reuses the first example's individual parts for the divider, adds six combiner parts, and joins their upper and lower tracks at nodes 40 and 41. Node 50 connects the combiner to a five-component LC ladder: two series 5 nH inductors with a tee-led, downward 1 pF capacitor terminated in `Short()`. The values illustrate layout rather than a tuned filter design. All components appear directly in the same nodal network.

```js
nP.schematic(dividerCombinerLadder, {
  shapes: [
    {name: 'powerDivider', from: 1, to: [40, 41]},
    {name: 'powerCombiner', from: [40, 41], to: 50},
    {name: 'ladder', from: 50, to: 2}
  ],
  mount: '#divider-combiner'
});
```

The shared ORI composition operation treats these node numbers as section boundaries. It binds each of the three regions to its existing board, measures and positions complete sections, connects their interface endpoints, and combines the geometry before common annotation and SVG rendering. Internal interface ports do not become external ports in the final drawing. All components retain their original numbered electrical terminals, and every component must belong to exactly one section. The divider–combiner pair alone has essentially 0 dB transmission at 2 GHz; adding the ladder changes the final network's response.

The composition operation now supports unequal interface spacing, parallel paths and nested splits. It measures and translates complete boards, then routes the connecting wires without stretching symbols or adding circuit-specific coordinates. Crossed track order and connections that cannot be routed without a crossover report an error. The dedicated examples are in `parallelComposition.html`. The broader unguided splitter/combiner baseline in `../trf5Port.html` remains unchanged.


## Blind detection

The whole-network examples now omit shape hints and log `drawing.detected`. ORI uses the independently detected board; the equivalent explicit call remains valid. Any example composing several bounded sections keeps its explicit section list, because automatic composition detection is not enabled.
