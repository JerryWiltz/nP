<!-- Modified: 2026-11-06 -->
# Branchline schematic guidance

`branchline.html` shows the `branchline` layout hint on four connected networks: an ideal one-cell ring with series components in two arms, a two-cell ideal network, a one-cell microstrip network, and a microstrip network with four series resistors added to one arm. Each uses `nP.nodal()` and calls `nP.schematic(network, {shapes: ['branchline']})`.

The pattern is inferred from the network. Four external ports anchor the corners in top-left, top-right, bottom-right, bottom-left order. Junctions form the corners and shared cell boundaries; each arm may contain one or more two-port components. The four-resistor example checks that a longer mixed-symbol arm determines the cell size while the renderer preserves component order and actual port connections.

Set `g.fList` before creating the RF components. The examples use 2 GHz; the layout itself does not depend on a frequency sweep.

All four examples now use ORI, the same interpreter as series and ladder. The branchline description supplies the anchor predicate, two rows, repeating horizontal and vertical lanes, external port sides, and the longest-arm spacing rule as data. ORI matches that board against the connections, rotates the actual symbols, and fits each lane using the shared wire/component tile operation. The earlier branchline matcher and drawing builder have been removed. No coordinates or component names from these examples are encoded in the interpreter.
