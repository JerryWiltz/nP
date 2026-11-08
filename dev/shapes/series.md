<!-- Modified: 2026-11-08 -->
# Series schematic guidance

This harness exercises blind `series` detection. The reference is the user's
`seriesOf2Ports.jpg` sketch: a straight path with two resistor symbols and no branches.
The earlier JSON definition has been retired. The sketch and printable SVG remain visual references.

Every schematic call omits the `shapes` option and logs its returned
`drawing.detected` object. Each result is `{shapes: ['series']}`. The `mount`
option only chooses where to display the result. The first drawing uses two
`R()` constructors in `nodal()`; the second repeats the same network to show
that independent detection and placement remain consistent.

The third drawing includes an
`mbend()` and shows that the unbranched route may turn. The fourth builds five
resistors through nested nodal results. The immediate upstream result appears as a nodal block. The browser bundle must be rebuilt after changes to `schematic.js`.
