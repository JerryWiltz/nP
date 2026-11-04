<!-- Modified: 2026-11-02 -->
# Series schematic guidance

This harness exercises the `series` shape guidance. The reference is the user's
`seriesOf2Ports.jpg` sketch: a straight path with two resistor symbols and no branches.
The earlier JSON definition has been retired. The sketch and printable SVG remain visual references.

The first drawing uses two `R()` constructors in `nodal()`. The second includes an
`mbend()` and shows that the unbranched route may turn. The third builds five
resistors through nested nodal results. The immediate upstream result appears as a nodal block. The browser bundle must be rebuilt after changes to `schematic.js`.
