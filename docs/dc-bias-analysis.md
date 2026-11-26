<!-- Modified: 2026-11-26 -->
# DC bias analysis

DC analysis determines voltages and currents from the circuit's sources, components and connections. nP retains that information when you use `nodal()`, `.cas()` or `cascade()`, so DC and RF share one network description.

The current standalone bundle supports linear DC networks and bias solving for the implemented BJT, JFET, MOSFET, MESFET, HEMT and diode families. An installed npm or Obsidian build can have different capabilities; use the APIs supported by the supplied bundle.

## What changes at DC

| Element or connection | DC interpretation |
| --- | --- |
| Ideal resistor | Retains its resistance. |
| External ideal capacitor | Open circuit. |
| External ideal inductor | Short circuit. |
| `V(voltage)` | Constrains terminal 1 minus terminal 2 to the supplied voltage. |
| `Short()` | Provides a ground reference. |
| `Load()` | Supplies its captured reference resistance to ground. |
| External measurement ports and `Ro` | Add no DC sources or load resistors. |

These DC rules do not replace the components' frequency-dependent RF behavior. A bypass capacitor is open for bias calculations and retains its impedance for RF. Numeric node 0 is an ordinary connection label; use an explicit ground reference.

## Solve a resistor circuit

Here a 1 V supply drives a 100 Ω resistor to ground. A Tee exposes a measurement port while retaining the source and resistor branches. The expected DC current is **10 mA**.

```js
var g = nP.global();
g.Ro = 50;
g.fList = [1e6];

var v1 = nP.V(1);
var r1 = nP.R(100);
var t1 = nP.Tee();
var short1 = nP.Short();

var network = nP.nodal(
    [t1, 1, 2, 3],
    [v1, 1, 4],
    [short1, 4],
    [r1, 3, 5],
    [short1, 5],
    ['out', 2]
);

var dc = network.solveDC();
var results = dc.out('v12', 'i1mA', {component: r1, label: 'R1'});

nP.schematic(network);
nP.lineTable({inputTable: [results], metricPrefix: 'none'});
```

The positive current enters the resistor's first terminal. The measurement port introduces no extra 50 Ω DC load. `.solveDC()` returns the result without rebuilding the existing RF data. It currently takes no arguments.

## Read the operating point

The returned record includes `converged`, `method`, `nodes`, `ports`, `components` and diagnostics. Each component record identifies its placement path and provides terminal voltages and currents in the constructor's public terminal order. Voltages are volts; currents are amperes and enter the component.

The example selects the original `r1` component, so reordering its netlist row does not change which resistor is measured. Placement paths distinguish repeated uses of the same component object and nested networks. For a reused template, select its path through `{component: 'p4'}`. Floating absolute voltages or undetermined currents remain `null` in raw data and display as `undetermined` in output tables.

Both explicit results and `network.operatingPoint` provide `.out(...selectors, options)`.
Device selectors read solved fields, for example
`dc.out('vgs', 'vds', 'idmA', {component: q1, label: 'Q1'})`.
Terminal `v1` is absolute voltage; `v12` means terminal 1 minus terminal 2;
`i1` enters terminal 1. BJT named `ie` retains its outward convention.
Voltage/current suffixes V/mV/uV and A/mA/uA select units inside the library.
Charge-storage PIN also provides `bulkResistance` in ohms.

Use `dc.out('voltage', {node: 'rail'})` for an absolute node observation or
`dc.out('voltagemV', {nodes: ['detector', 'reference']})` for a difference.
An optional node `path` selects a nested namespace. Differences can be determined
even when both absolute voltages float. Numeric and string node IDs remain distinct.
Selectors are required; missing measurements and ambiguous component reuse report errors.

Each call returns a fresh table with a text Component/Node column, suitable for
`lineTable()` using `metricPrefix:'none'`. Reading or changing that table does
not alter the solved result. JSON/structured clones preserve data without `.out()`.

## Set transistor bias before RF analysis

A supported network containing an explicit `V()` supply and nonlinear devices automatically solves DC before combining RF. For NPN/PNP, the solver estimates the bias, refines it with the nonlinear model, then rebuilds each placed transistor's RF, noise and weak nonlinear data at the solved point.

Read `network.operatingPoint` for that result. A separate `.solveDC()` call is unnecessary to establish the RF bias. The original transistor object retains its construction state; the solved operating point belongs to its placement in the network. Networks using a prescribed transistor Q point without an explicit DC supply retain that fixed-Q RF workflow.

The [NPN constructor Tech Note](./tech-notes-npn-constructor.md#let-an-external-network-determine-the-bias) contains a complete divider-biased amplifier example. It shows the coupling capacitors, emitter bypass, voltage source and retained resistor paths in one `nodal()` description.

## Supply behavior and supported models

`V()` is a floating two-terminal nPort, with positive terminal 1 relative to terminal 2. Its positive-frequency RF branch is open. Its 0 Hz incremental S-parameters describe a through connection; they do not encode the DC voltage constraint. Ground and bypass connections remain explicit.

Constructors retain DC model information, but some physical or fitted RF models require additional DC information before solving. Unsupported models and inconsistent constraints report an error; do not silently replace them with an open, short or assumed transistor bias. Supported diode network adapters use their existing current laws; I–V curve methods remain separate analyses. The dedicated NoiseDiode fit has no DC I–V law and still requires a physical bias model.

See [Connecting nPorts](./connecting-nports.md) for wiring rules, [Transistors and Diodes](./diodes-and-active-components.md) for device options, and the [DC model and solver details](https://github.com/JerryWiltz/nP/blob/master/developmentDocs/analysis/dcAnalysis.md) for model coverage and convergence diagnostics.
