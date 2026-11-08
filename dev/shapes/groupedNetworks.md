<!-- Modified: 2026-11-08 -->
# Shape groups in nodal networks

`groupedNetworks.html` demonstrates the grouped-row workflow. Put a shape name around its component connection rows in `nodal()`, then pass the completed network to `schematic()`. The calls on this page supply display settings only; they do not supply shape names or boundary nodes.

The examples show series–ladder–series, two repeated series groups using one resistor object four times, and parallel series/ladder paths between Wilkinson power-divider and power-combiner groups. Every example runs one nodal analysis. A group is layout metadata on component occurrences and does not create an intermediate nPort or a network block.

`nodalConnections.js` flattens the rows once before Gamma and W are constructed. The grouped and ordinary flat forms have the same matrices, S-parameters, noise and signal behavior. Each `_schematic.groups` record stores its declared shape name and zero-based component occurrence indices. Reusing a component object does not merge its occurrences or group memberships.

`schematicGroups.js` finds boundary nodes where connections leave each group or reach an external port. It matches the declared shapes, infers their numbered interfaces using external port 1 as the default flow source, and passes the resulting sections to the existing ORI composer. No example requires boundary declarations. The composer trims redundant display leads so inline group boundaries use ordinary wire spacing rather than adding an input lead, an output lead and a fixed gap.

The third example has four groups: `powerDivider`, `series`, `ladder` and `powerCombiner`. Each Wilkinson group contains its three tees, two 70.71 Ω quarter-wave line occurrences at 2 GHz, and 100 Ω isolation resistor. The same line and resistor objects are reused in both groups. Nodes 10/20 connect the divider to the paths; nodes 30/40 connect the paths to the combiner. All seventeen component occurrences belong to one final `nodal()` call. The combining role can be independently recognized from its position in that composition. The shared interface alignment operation keeps nodes 10/20 and 30/40 horizontal through the two paths when the divider and combiner pitches agree.

Independent detection uses the memberships without consulting the declared group names. Its result is logged below each drawing in the same format as the existing `shapes` option. Declared group names control layout unless an explicit `schematic()` shape option overrides them. An incorrect group name or shape fit becomes an inline drawing error; the electrical network can still be analyzed.

The grouped syntax supports repeated names by using separate objects. Group values contain component rows, with one final ordinary `['out', ...]` row. Signal options remain an optional final argument after that row. Direct junctions and one-port terminations may be ordinary rows outside groups; all two-port occurrences must be covered by the groups for composed rendering. Section-level crossovers and automatic grouping of an entirely unannotated network remain future work.

## Dot comparison

The third drawing uses the defaults: `dots: {ports: true, nodes: true, terminals: false}`. The fourth reuses that same network with `dots: {terminals: true}`. It does not repeat the electrical analysis. External-port dots and dots on wires identifying numbered nodes remain visible in both drawings; the latter drawing adds dots at component lead-to-wire connections. Circled node-number labels remain visible independently of these options. Actual wire-junction dots and dots inside canonical artwork remain visible. All geometry and topology are identical between the views.
