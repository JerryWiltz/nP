<!-- Modified: 2026-11-25 -->
# Diode detector shapes

`diodeDetector` and `differentialDetector` are reusable boards in
`src/np-chart/src/schematicShapeBoards.js`. Existing blind detection, slot
binding, relation constraints, measured separation, branch balancing and routing
produce their geometry. No constructor, node number, part value or example name
selects a corrective layout rule.

## Electrical contracts

Both boards have one external RF input. Their output is an internal DC
measurement, not an external RF termination. The diode slots accept canonical
junction, Schottky, Zener and varactor symbols with port 1 anode and port 2
cathode. Artwork recognition does not establish numerical detector capability
for an unsupported electrical constructor.

| Shape | Required topology | Structural variants |
| --- | --- | --- |
| `diodeDetector` | Input Tee, grounded input-return component, diode, output Tee, separate grounded load R and bypass C | Input series C optional; return may be L or R |
| `differentialDetector` | Coupled RF input/Tee, two diodes and grounded R/C output networks, one bias choke per diode, common bias Tee/R, V/Short supply | Supply Tee/C/Short bypass optional |

Input Tee port 1 is the return/bias branch; ports 2/3 are the RF input and diode
path. Output Tee port 1 meets the diode cathode; ports 2/3 feed the separate
load and bypass branches. The common bias Tee uses port 1 for the bias resistor
and ports 2/3 for the chokes. A supply bypass Tee uses port 1 for the voltage
source and ports 2/3 for the bias resistor and capacitor. Slot binding preserves
these numbered terminal roles, allowing the symmetric through-port assignments.

Do not change wiring to satisfy a board. Combined RC loads, extra branches,
reversed terminal roles, other bias networks and a second external RF port are
outside these first contracts. Explicit guidance rejects a mismatch; automatic
detection can fall back to another board.

## Engineering organization and shared layout

The board states RF-left-to-right flow, bias above the diode branches, downward
load/bypass branches, common termination baselines and aligned detector/reference
diode axes. The source sits to the right of its optional bypass, with the
supply-return region above the bias-distribution rail so the reference feed
does not have to detour around a supply termination. Canonical Tee and Short squares are retained. `order` describes
which functional regions precede others; `centerlines` expresses the intended
electrical alignment. Neither provides example coordinates, wire lengths or
post-layout displacement. The relation engine resolves these constraints from
symbol geometry and measured captions, balances each parallel R/C termination
family, and routes the actual nodes around occupied geometry.

The single input capacitor is placed first in semantic component order, so
its generated caption is C1. IDs within each drawing follow the renderer's
normal numbering; source variable names cannot be inferred from anonymous
JavaScript component objects. Node labels and component occurrence identities
are retained from the actual network.

Whole-network use is automatic or explicit:

```js
nP.schematic(detector, {shapes: ['diodeDetector']});
nP.schematic(pair, {shapes: ['differentialDetector']});
```

Both declare `{from:[1],to:[]}` and can terminate a composed path. For example,
an upstream series section can end at a detector's RF input with an explicit
section `{name:'diodeDetector',from:'rf',to:[]}`. Shape-boundary validation now
accepts the same strings/finite-number identities used by nodal connections;
the board interface still validates the boundary count. Empty boundaries do not
turn a two-port board into a one-port board. Terminal group candidates receive
neutral depth cost rather than dividing by an empty output list.

## Shared labeling improvements

Simple numeric R/L/C captions use engineering prefixes before measurement, with
unchanged significant-digit settings. For example, 10000 Ω becomes 10 kΩ,
1e-6 H becomes 1 µH and 1e-10 F becomes 100 pF. Prefix rounding carries at
1000; component parameters and analysis results are never rounded or mutated.
Authored display-value strings remain author supplied.

`schematicNodeLabels.js` shares metrics between board/cascade annotation tasks,
drawing-input annotation tasks and SVG rendering. Short numeric node IDs retain
their circle. Longer identifiers reserve measured rounded enclosures, with
normal-size named text and a standard horizontal padding. Layout/export bounds
include their full extents. Lateral annotation candidates also include the
measured half-width, preserving the ordinary circle-to-wire clearance for
wider enclosures. This replaces overflowing names and tiny text in a
fixed circle without renaming nodes, suppressing labels or adding per-node
positions. Static circuit-description node validation is unchanged.

## Verification and remaining limits

`test/schematic-detectors.test.js` checks blind detection without placement,
explicit/automatic agreement, actual port/node connectivity, orthogonal grid
routes, absence of crossings/body intersections, unchanged analysis data,
aligned baselines/diodes, structural variants, reused templates, asymmetric
model captions, row reordering, renamed nodes and terminal composition. It also
checks engineering units, rounding and wide labels in drawing-language input.
The browser example is [Schottky detectors](../../dev/schottkyDetector.html).

The shapes do not add an amplifier symbol, thermal package model, rectification
equations or a high-power detector solver. Those are separate electrical or
presentation capabilities. Very long labels can enlarge a view or require
annotation displacement; the renderer does not promise a compact layout for
every circuit. Use Fit drawing/actual-size scrolling for viewing, not as a
replacement for the board's engineering organization.
