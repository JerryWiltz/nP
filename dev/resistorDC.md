<!-- Modified: 2026-11-26 -->
# resistorDC

Open `resistorDC.html` to compare two circuits using the local `../dist/nP.js` bundle.
Both have RF port 1 at node 6 and port 2 at node 7. The sweep is 1–1000 MHz,
with 50-ohm reference impedance and two 1 nF coupling capacitors.

1. With the first tee/V(1)/Short branch: solve DC and plot S11, S21, S12 and S22.
   The three resistors (50, 75 and 50 ohms) carry 5.714286 mA.
2. Without that tee/source/ground branch: reconnect C1 directly to R1 and plot
   the same four S-parameters. No DC analysis is performed for this case.

The two S-parameter plots agree because V() is open at positive RF frequencies,
so the first tee's remaining two ports behave as a through connection.
The final `.out()` label option names their RF columns `With supply: s21dB`,
`Without supply: s21dB`, etc.; only headings differ, not their numeric data.

DC measurements are displayed through the operating-point result’s `.out()`
method and `nP.lineTable()`; placement selection, unit conversion and table
assembly belong to the library.
