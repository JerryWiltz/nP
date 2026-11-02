<!-- Modified: 2026-11-01 -->

# Schematic development harness

Open `dev/schematic.html` with a local server. It draws 32 single-network circuits with the public synchronous `nP.schematic(network, options)` API. Three series, eight ladder, and five branchline cases pass one shape name; one more case passes node-bounded series and ladder sections. The other cases use network-only layout. The cases in `schematicCases.js` cover direct component arrangements, cascades, split/rejoin networks, filters, attenuators, splitters, a Wilkinson divider, a coupled line, and coupler fixtures. The nine circuits in `schematicStressCases.js` include one-cell and two-cell branchlines, a microstrip branchline, a rat-race, a bridge, a ladder, and reordered nodal rows.

The page labels each result with its shape hint or network-only mode, followed by connected-wire path, closed loop, parallel branches, parallel paths, or general node routing. Nodal drawings also show the number of loops reported by `drawing.topology.loopAnalysis`. Single cycles place their components around a closed path; simple parallel two-port branches share left and right junction wires. Networks with two multiport junctions and several one-component paths use stacked lanes. The general fallback places components by graph distance from the input and routes each electrical node between its actual terminals. It has no vertical rail columns. Crossings between different nodes have a visible gap and no junction dot. Each result has its own error display, so a layout failure does not hide later drawings. The circuit case builders still need to construct successfully before the page can start rendering.

The two-shape case is the fifth section, after “Two resistors in series.” A link at the top of the page jumps to it. Its heading shows the shared node boundary: `series` from 1 to 4, then `ladder` from 4 to 11.

The page is a manual review harness. The node mapping and fallback behavior are checked in `test/schematic-nodal-layout.test.js`; the current network-only renderer and its limits are described in `developmentDocs/schematicSystem.md`.
