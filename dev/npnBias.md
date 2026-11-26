<!-- Modified: 2026-11-26 -->
# Automatic NPN bias and RF

Open `npnBias.html` using the local `../dist/nP.js` bundle. It builds a 2N3904
with an external 12 V supply, 100 kohm / 22 kohm base divider, 2.2 kohm collector
resistor and a 2 kohm emitter resistor bypassed by 10 nF. The emitter branch
uses `nP.sePaRC(2e3, 0.01e-6)`, a parallel RC between emitter and ground.
Input/output coupling capacitors are also 0.01e-6 F (10 nF).
The two RF ports are nodes 6 and 7; the sweep is 1–100 MHz at 50 ohms and 293 K.

The constructor supplies no final Q point. `nodal()` automatically solves the
DC network, refines the initial estimate with the nonlinear transistor model,
then rebuilds the device and combines its RF response. The page reads
`amplifier.operatingPoint`; it does not call `solveDC()` separately.

The table displays the solved transistor at placement p6, including finite
base-current loading. Expected results at the stated settings are:

| Quantity | Result |
| --- | --- |
| IB | 5.195547 µA |
| IC | 0.696817 mA |
| IE, outward | 0.702013 mA |
| VB | 2.070244 V |
| VC | 10.467002 V |
| VE | 1.404026 V |
| VBE | 0.666218 V |
| VCE | 9.062976 V |

The chart displays S11, S21, S12 and S22 in dB at that operating point. The
status reports automatic DC convergence or an error. The coupling capacitors
open at DC, so the RF port nodes have no assigned absolute DC voltage.
The original `q1` remains a reusable constructor template; the displayed bias
comes from the solved network, rather than `q1.qPoint`.


## Schematic and emitter bypass

The page renders the actual analyzed network with `nP.schematic(amplifier)`.
The drawing initially fits the page; use **Actual size** to inspect labels.
The emitter capacitor opens at DC, leaving the 2 kohm resistor to set bias.
At RF the parallel capacitor reduces emitter degeneration. With the 50-ohm
measurement reference, S21 is +7.81195 dB at 1 MHz and +6.83980 dB at 100 MHz.
The schematic displays the parallel RC branch and both 10 nF coupling capacitors.

DC measurements are displayed through the operating-point result’s `.out()`
method and `nP.lineTable()`; placement selection, unit conversion and table
assembly belong to the library.
