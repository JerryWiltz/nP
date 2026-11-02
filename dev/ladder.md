<!-- Modified: 2026-11-01 -->

# Ladder schematic guidance

Open `ladder.html` to inspect the three-shunt circuit from the hand-drawn `ladder.jpg` reference. The main path contains two series resistors. The tee branches contain a resistor and short, a parallel R-L and short, and a transmission line and open. The floating parallel R-L branch uses `sePaRL()`; `paPaRL()` includes a shunt connection inside its symbol. `nP.schematic(circuit, {shapes: ['ladder']})` checks the network and places the main path and downward shunts. The network-only call remains available for comparison.

The second drawing uses `mtee()` and `mlin()` for the junction, main path, and shunt. The renderer rotates the junction so ports 2 and 3 run horizontally and port 1 points down, then rotates the shunt line by 90 degrees. `mvgnd()` provides a physical microstrip via-to-ground termination. One-port terminations are oriented from their port and body positions so the body extends down from the shunt. Physical microstrip open and load terminations remain separate design work; the `Open()` in the first drawing terminates an ideal `Tlin()`.
