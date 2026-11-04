<!-- Modified: 2026-11-02 -->
# Branchline schematic guidance

`branchline.html` shows the `branchline` layout hint on three connected networks: an ideal one-cell ring with series components in two arms, a two-cell ideal network, and a one-cell microstrip network. Each uses `nP.nodal()` and calls `nP.schematic(network, {shapes: ['branchline']})`.

The pattern is inferred from the network. Four external ports anchor the corners in top-left, top-right, bottom-right, bottom-left order. Junctions form the corners and shared cell boundaries; each arm may contain one or more two-port components. The renderer places and orients the symbols to preserve their actual port connections while drawing the rectangular cells.

Set `g.fList` before creating the RF components. The examples use 2 GHz; the layout itself does not depend on a frequency sweep.
