<!-- Modified: 2026-11-26 -->
# DC operating-point output

Both `network.solveDC()` and an automatically solved `network.operatingPoint`
provide `.out(...selectors, options)`. The method reads the existing solved state;
it does not solve again, change RF bias or modify templates. DC uses table rows
for components/nodes, rather than an artificial frequency/time coordinate.

```js
var dc = network.operatingPoint;
var bias = dc.out('vgs', 'vds', 'idmA', {component: q1, label: 'Q1'});
nP.lineTable({inputTable: [bias], metricPrefix: 'none'});
```

## Measurements and units

Selectors are required. A final options object accepts `component`, `node`,
`nodes`, `path`, `label` and `units`, with incompatible combinations rejected.
The common map, for example `{units:{current:'mA',voltage:'mV'}}`, selects units
for all matching measurements and overrides their suffixes. Underlying results
and `undetermined` observations stay unchanged. See [output units](outputUnits.md).

| Selection | Meaning |
| --- | --- |
| `v1`, `v2`, ... `v9`, or `v(12)` | Absolute voltage at that numbered component terminal. |
| `v12`, `v21`, or `v(12,3)` | First terminal voltage minus second terminal voltage. Parentheses disambiguate multi-digit terminal numbers. |
| `i1`, `i2`, ... | Current entering that numbered terminal. |
| `vbe`, `vce`, `vcb`, `ib`, `ic`, `ie`, etc. | The selected device's existing solved qPoint fields. |
| `voltage` | Node voltage, or a node-pair difference, selected through options. |
| `bulkResistance` | Solved charge-storage PIN bulk resistance, in Ω. |
| `temperature` | Solved device temperature, in K. |

Device field names follow the existing result records, including external and
intrinsic voltage names and `junctionVoltage`/`junctionCurrent`. A selector must
exist on every selected device; mixed families may require separate calls. BJT
`ie` retains its documented **outward** convention; `i3` is the entering terminal
current, so their signs are opposite. Other device named-current conventions
remain those of their qPoint records. Charge-storage PIN results additionally
report `qPoint.bulkResistance`, from the DC storage calculation already performed.

Base units are V/A/Ω/K. Voltage selectors accept `V`, `mV`, `uV` suffixes;
current selectors accept `A`, `mA`, `uA`; resistance accepts `ohm`, `kohm`;
temperature accepts `K`. For example, `v12mV`, `idmA`, `ibuA` and
`bulkResistancekohm`. Suffixes are case-sensitive; ASCII `u` displays as `µ`.
Incompatible dimensions and duplicate resulting column names reject.

## Component identity and placement

`component: q1` selects the captured immutable model belonging to the original
component variable, independent of component-row order. A different object
constructed with identical parameter values is not that placement. Existing
templates remain at their constructor Q point; output uses the solved placement.

If the same template occurs more than once, selection rejects with its paths;
use `component: 'p6'` or a nested path such as `'p1/p3'` to distinguish instances.
The empty path `''` selects a standalone component. Nested connection blocks can
also be selected. Paths follow netlist placement order; named variables are the
preferred choice for unique placements.

Without `component`, device-field selectors select all devices with qPoint data.
Generic terminal selectors select all component records, including nested blocks.
The default first column identifies constructor and placement. A nonempty `label`
names a selected row; for a group it prefixes each placement identity.

## Node observations and undetermined values

```js
var dc = network.solveDC();
var nodeVoltage = dc.out('voltage', {node: 'rail'});
var drop = dc.out('voltagemV', {nodes: ['detector', 'reference'], label: 'DC difference'});
var nested = dc.out('voltage', {node: 3, path: 'p1'});
```

`node` selects one user node. `nodes: [positive, negative]` selects a differential
measurement. `path` is its node namespace, root `''` by default. Numeric and
string labels stay distinct; output displays JSON-style labels to distinguish
`1` from `'1'`. Without `node`/`nodes`, `voltage` lists all user nodes in that
namespace. Internal device nodes are not exposed through these node options.
`'g'` is an ordinary user label here, not an implicit reference selection.

Voltage differences use the retained linear observation/null-space calculation,
so a determined differential remains valid when both absolute voltages are null.
An undetermined voltage or ideal current appears as the text `undetermined` in
the table. Raw result fields remain null; nothing is silently set to zero.
Unknown nodes, paths, components, terminals and unavailable fields reject.

## Returned table and ownership

Tables begin `['Component', ...measurementLabels]` or `['Node', ...labels]`.
Subsequent rows contain a text identity and measured numbers or `undetermined`.
Use `lineTable()` with `metricPrefix: 'none'`; these are static DC observations,
not numeric-x sweep data for `lineChart()`. Each call returns fresh mutable rows.
Display changes do not alter the deeply frozen result.

The reader is an immutable, non-enumerable `.out` method. JSON and structured
clones preserve the previous plain data shape without the method. Private
observation context remains associated only with the original result; no solver
internals or functions are added to serialized data. Shared immutable analysis
snapshots retain the original reader, including rectification's RF-off operating
point. `test/dc-output.test.js` covers identity, nested/reused placements, signs,
units, floating observations, PIN state, validation, ownership and serialization.
