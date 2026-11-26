<!-- Modified: 2026-11-26 -->
# Device-curve output

The common [output-unit map](outputUnits.md) is also supported, for example
`curves.out('ic',{units:{current:'mA'}})` or
`capacitance.out('cj','ct',{units:{capacitance:'pF'}})`. It overrides existing
suffix choices for the same quantity without changing the captured SI samples.

All implemented `ivTable()` and `cvTable()` methods still return their existing
mutable header-and-rows arrays in SI units. They additionally expose an
immutable, non-enumerable `.out(...selectors, {label})` reader. Old plotting,
indexing, JSON and structured-clone consumers remain compatible. The reader
uses captured SI samples, not parsed headers or a new electrical calculation.

## Named steps

```js
var q1 = nP.NPN();
var curves = q1.ivTable();
var current = curves.out('icmA');
nP.lineChart({inputTable: [current], metricPrefix: 'none'});
```

The measured selector chooses all existing stepped curves for that quantity.
`icmA` means collector current in mA, preserving the base-current labels.
Common-collector BJT curves report outward `ie`; common-base curves report `ic`
against `vcb` at stepped outward `ie`. PNP and P-channel curves retain their
signed values and existing descending sweep order. No absolute-value conversion
or rebiasing occurs.

For FETs use `id`, for diodes use `id`, and for C–V use `cj` and/or `ct`.
Both charge-storage and selected-region PIN curves support this reader.
Legacy `diode1N4148()` keeps its raw `vD`/`iD` headers and positional arguments;
its reader uses canonical lowercase `vd`/`id` selectors.

## Selection, axis and units

At least one dependent measurement is required. Optional first selector names
the existing swept voltage and its units; omission retains its original V axis:

```js
var current = curves.out('vcemV', 'icuA', {label: 'Q1'});
var capacitance = d1.cvTable({vr: {start: 0, stop: 15, points: 31}});
var display = capacitance.out('cjpF', 'ctpF');
var totalOnly = capacitance.out('vrmV', 'ctpF', {label: 'Total capacitance'});
```

Supported selectors are case-sensitive:

| Quantity | Base fields | Unit suffixes |
| --- | --- | --- |
| Swept voltage | `vd`, `vr`, `vce`, `vcb`, `vds`, as supplied by that table | `V`, `mV`, `uV` |
| Current | `id`, `ic`, `ie`, as supplied by that table | `A`, `mA`, `uA`, `nA`, `pA` |
| Capacitance | `cj`, `ct` | `F`, `mF`, `uF`, `nF`, `pF`, `fF` |

Without a suffix, use V/A/F. ASCII `u` displays as `µ`. Each selected dependent
quantity expands to its existing columns in bias-step order. Different
quantities follow selector order. The independent voltage stays first; it may
only be specified as the first selector. A bias-step value is a curve condition,
not an extra measured quantity. Individual bias-step filtering is not provided.

Unknown/unavailable fields, incompatible units, repeated measurement/unit
columns, empty output requests, axis-only requests and unknown options reject.
Selected samples and scaled values must be finite. Raw legacy table behavior
is retained even if its older producer permits nonfinite values.

## Labels and ownership

A nonempty string `label` names a single measurement, with its units appended,
such as `Total capacitance (pF)`. For multiple columns it prefixes each full
quantity/bias heading, such as `Q1: ic (mA), ib=10 µA`. Unlabeled default-unit
headers retain the existing canonical pattern. Close bias steps use additional
digits when needed to distinguish their labels. Stepped-current labels retain
the existing µA/mA presentation; voltage steps use V.

Each `.out()` call returns fresh mutable rows. Editing its result or the original
legacy array does not change the reader's captured data, component state, RF,
noise, model record, curve settings or Q point. JSON/structured clones and
ordinary array copies omit the reader; the plain data remain usable as before.
Use the original curve result to request another measurement or display unit.
In a browser, pass the result to `lineChart()`/`lineTable()` with
`metricPrefix:'none'`; in Node, use `console.table()`. No DOM is needed to extract
the table. Older or pinned bundles may still return plain arrays without `.out`.

`src/np-nport/src/curveOutput.js` owns the reader and unit conversion. Producers
supply explicit axis, measurement and bias-step metadata; no component names,
part-number exceptions or header parsing select the behavior. Existing model
equations, DC models, RF/noise and nonlinear construction paths are unchanged.
`test/curve-output.test.js` covers families, polarity, units, labels, ownership,
serialization and errors; existing semiconductor tests check electrical results.
