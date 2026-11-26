<!-- Modified: 2026-11-26 -->
# External diode bias before RF

Open `diodeBias.html` after rebuilding nP. Its two-port network has a 1 V supply,
1 kΩ bias resistor, 100 Ω return resistor, 10 nF coupling capacitors and a
1N4148 `D()` at 300.15 K. The capacitors isolate the external RF ports at DC.

`nodal()` solves DC before combining RF. The diode's voltage and current are
extracted with `network.operatingPoint.out('vd', 'idmA', {component: d1})`; the original `d1` retains its
construction Q point. The displayed current must satisfy
`id = (1 - vd) / 1100`. The RF plot then uses the solved bias, with both capacitors
retaining their actual impedance. No second `.solveDC()` call is needed to set bias.

Both `D()` and the separate legacy `diode1N4148()` model support external bias.
Their different leakage, temperature and breakdown laws remain distinct.

DC measurements are displayed through the operating-point result’s `.out()`
method and `nP.lineTable()`; placement selection, unit conversion and table
assembly belong to the library.
