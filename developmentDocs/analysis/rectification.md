<!-- Modified: 2026-11-26 -->
# Weak-signal RF-to-DC rectification

Measurement tables support the common [output-unit map](outputUnits.md):
`result.out('deltaVoltage',{units:{voltage:'uV',power:'W'}})` displays DC change
in µV versus available input power in W. Sensitivity independently uses the
`sensitivity` key (V/W, mV/W or uV/W). Scalar results, power settings and the
electrical calculation remain unchanged.

`network.rectify(options)` calculates the second-order steady DC response to
one CW input, using the retained `nodal()`/`cascade()` network. This is a shared
network analysis, not a different Schottky constructor or a second netlist.
The initial nonlinear adapter supports `D()` junction, Schottky, Zener and
varactor records, named or supplied. Other nonlinear families reject explicitly.
Physical DC descriptors are required for every component in the circuit.

## API and result

```js
var detected = network.rectify({
    frequencyHz: 1e9,
    inputPowerDbm: -70,
    inputPort: 1,
    outputNodes: ['detector', 'reference'],
    outputPath: ''
});
var dcVolts = detected.voltage;
var rfInducedVolts = detected.deltaVoltage;
var sensitivity = detected.sensitivityVoltsPerWatt;
```

- `frequencyHz`: required positive frequency already in the component grid.
- `inputPowerDbm`: required available source power in dBm, a nonempty power
  array, or `{start, stop, points}` for an endpoint-inclusive linear dBm sweep.
  Ranges need distinct finite endpoints and an integer count of at least two;
  descending ranges are allowed. Lists preserve their order, including repeated
  powers. `-Infinity` means RF off in a scalar or list. Finite powers that
  overflow or underflow the numeric range reject.
- `inputPort`: one-based driven external port, default 1. The source and every
  other external RF port are matched to the network's captured `Ro`.
- `outputNodes`: required positive/negative node labels in the selected
  namespace. Numbers and strings remain distinct. Output is DC volts from the
  first node to the second; these need not be external RF ports.
- `outputPath`: namespace path, default root `''`. Nested connection paths use
  the same `p1/p2` placement IDs as `solveDC()`. For a standalone electrical
  component, node labels are its one-based terminals.

The immutable result contains `baselineVoltage` (RF off), `deltaVoltage`
(second-order correction), `voltage` (their sum), and
`sensitivityVoltsPerWatt` (`deltaVoltage/inputPowerWatts`, signed; null at RF
off). It retains the requested settings, `referenceImpedanceOhms`, the RF-off
`operatingPoint`, per-placement `sources`, `dcResponse` and declared `limits`.
`sources` reports junction RMS voltage, average generated `currentAmps`, junction
DC bias shift and the weak-signal screen ratio. The generated current is an
internal equivalent source, not the total terminal current.

`dcResponse.nodes[].deltaVoltage` and all voltages/currents in
`dcResponse.components` are **increments**. Add them to matching RF-off
operating-point values for estimated totals. Some absolute voltages or ideal
wire currents may be null when nonunique; an undetermined differential output
rejects rather than acquiring an arbitrary reference. `dcResponse.residuals`
checks the linear perturbation equations, not a nonlinear large-signal solution.

The method never mutates templates, S rows, curve settings, `.signal`, or a
previous operating point. It independently solves RF-off DC even in a passive
network without `V()`, then rebuilds each diode at its own solved bias. The
constructor's default 0.6 V is therefore not imposed on a passive detector.
Ordinary construction and `solveDC()` retain their existing behavior.

## Power sweeps and chart-ready output

```js
var inputPowers = {start: -90, stop: -60, points: 7};
var sweep = network.rectify({frequencyHz: 1e9, inputPowerDbm: inputPowers,
    outputNodes: ['detector', 'reference']});
var detectedOutput = sweep.out('deltaVoltageuV', {label: 'Differential'});
nP.lineChart({inputTable: [detectedOutput], metricPrefix: 'none',
    xAxisTitle: 'Available RF input (dBm)', yAxisTitle: 'DC change (µV)'});
```

The library owns sweeping, table assembly and unit conversion. A sweep returns
an immutable `kind: 'weak-signal-rectification-sweep'` object with common settings,
the resolved `inputPowerDbm` array and `results`, one complete scalar result per
power in the same order. It solves RF-off bias once and shares that immutable
operating point across all results. Each power undergoes the existing RF and DC
weak-signal checks; a failing point rejects the call without a partial result.
Scalar input retains all previous fields and behavior.

Both scalar and sweep results provide `.out(...selectors, {label})`. At least
one measurement selector is required, such as `deltaVoltageuV`; there is no
implicit default. Empty calls and label-only calls report an actionable error,
matching RF and DC output. The optional nonempty `label` names a single trace
or prefixes multiple trace names. Selectors are `baselineVoltage`, `deltaVoltage`
and `voltage` in volts, their `mV` or `uV` suffixes for millivolts or microvolts
(for example `deltaVoltageuV`), and `sensitivityVoltsPerWatt` in V/W. Returned
tables begin `['Input (dBm)', ...columnLabels]`, followed by numeric data rows.
They are fresh mutable copies suitable for `lineChart()` or `lineTable()`;
changing a table does not change the analysis. Use `metricPrefix: 'none'`
because the x values are already dBm. Unknown or duplicate selectors reject.

Table output requires finite powers and finite selected results: RF-off rows
reject rather than inserting nonnumeric chart data. Inspect those scalar
results directly instead. `out` is non-enumerable; JSON/structured clones retain
the data without copying the method. No new electrical approximation is added.

## Electrical calculation and provenance

1. Assemble and solve the physical DC network with existing current laws.
2. Rebuild RF/current/charge derivatives at the solved placement biases.
3. Drive one external port with incident power-wave amplitude `sqrt(Pwatts)`.
   Reuse the connection-wave solve used by intermodulation to recover each
   junction's loaded RMS voltage, including contacts, matching, capacitances,
   and supported package L/C.
4. Expand the existing current law about RF-off bias. With RMS voltage `Vrms`,
   the average quadratic source is `Irect = 0.5 * Isecond * Vrms^2`.
   `Isecond` has units A/V², so `Irect` is amperes. Periodic charge contributes
   zero average `dQ/dt`, while its differential capacitance loads the RF solve.
5. Apply these sources at intrinsic junction nodes and solve the DC Jacobian
   for all voltage/current increments. Independent DC supply increments are
   zero. Contact resistance, load resistance and shared bias remain in the
   network. No iterative RF/bias update or higher-order terms are claimed.

This is an nP-derived second-order perturbation using the current derivatives
in [junctionDiode.js](../../src/np-nport/src/diodes/junctionDiode.js), not an
empirical sensitivity fit. The Schottky parameters and temperature assumptions
remain those in [the model note](../semiconductors/schottkyModels.md).
The square-law dependence and role of circuit impedances are also described in
[Skyworks Mixer and Detector Diodes, pp.11–13](https://www.skyworksinc.com/-/media/SkyWorks/Documents/Products/1-100/200826A.pdf).

## Loads, differential detectors and scope

External RF ports add **no DC source or load**. Include real DC return paths,
bias components and loads explicitly. For example, an AC-coupled diode with
no DC return at its input cannot sustain load current merely because its RF
source is matched. At steady DC external capacitors open and inductors short;
at RF both keep their actual impedances. A bypass capacitor does not disappear
from the RF solve.

For a matched detector/reference pair, use two `D()` placements at the same
specified temperature, their common bias resistor and actual isolation/filter
components. Apply RF to the intended input and measure the two DC output
nodes. The reference receives whatever RF leakage the circuit allows; it is
not forced to zero. Rectification can shift the common bias and reference
voltage. Equal models/temperatures do not implement package thermal coupling,
mismatch, self-heating, or guarantee constant sensitivity with temperature.

Runtime screens require both junction peak voltage divided by
`min(N, NBV)*kT/q` and peak charge-curvature ratio `abs(Cprime)*Vpeak/C`
to be at most 0.1. Junction DC bias shift divided by the same voltage scale
must also be at most 0.1. Exceeding these limits rejects. These conservative
screens are not an error bound or measured-device validation, especially near
model region boundaries. Attached `mod()`/signal data reject; the explicit CW
input is the excitation for this analysis.

No compression, high-power peak detection, harmonic balance, charging waveform,
envelope transient, self-heating, detector-noise/TSS prediction or differential
amplifier model is introduced. A differential gain may be applied separately.

## Independent validation

`test/rectification.test.js` includes an independently derived ideal-diode loaded
RF/DC result, square-law power scaling, passive bias, output polarity, supplied
records, temperature, shared bias/reference response, nested paths, template
reuse, row reordering and explicit unsupported-domain errors.

The SPICE decks `test/fixtures/schottky-detector.cir` and
`schottky-differential-detector.cir` independently simulate the full diode in
time and average settled outputs with ngspice 39.3. Their source is a 50 Ω
Thevenin generator: peak volts `2*sqrt(2*50*Pwatts)`. The input coupling capacitor
blocks its DC return; the explicit choke/bias network supplies the physical
DC paths. There is one external RF input, with the output measured internally.
The differential circuit includes a 10 nF supply bypass: nP's V() is RF open,
whereas a SPICE ideal supply is an RF short. The bypass's carrier impedance
relative to the 10 kΩ bias resistor bounds that embedding difference below
2 ppm. An independent SPICE AC check also agrees with the loaded junction RMS
voltage within 0.1 ppm at 27 °C. Transient comparison uses tight voltage
tolerance and a 5 ps maximum trapezoidal step; a coarser Gear run differed by
about 0.05%, so its values were not retained as final differential references.
Compare consecutive 6–7/7–8 µs averaging windows to check settling. The single
detector uses its stated Gear settings, whose two averaging windows also agree.
Run in a temporary directory with `ngspice -b /absolute/path/to/deck.cir`.
For parameter sweeps change `.temp` (Celsius), source peak/frequency and Rload;
retain the deck options, averaging windows and simulator version. The source
card's TNOM is 27 °C. See `schottky-detector-reference.js` for executed cases
and tolerances; these references are simulator outputs, not values from nP.

The browser harness [schottkyDetector](../../dev/schottkyDetector.html) plots
single-diode and differential DC changes over available power. It makes no
claim about a packaged detector's measured sensitivity.
