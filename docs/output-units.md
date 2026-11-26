<!-- Modified: 2026-11-26 -->
# Output units

Request display units in the final `.out()` options object:

```js
var response = network.out('s21dB', {units: {frequency: 'GHz'}});
nP.lineChart({inputTable: [response], metricPrefix: 'none'});
```

The returned table uses GHz, with a heading such as `Freq (GHz)`. Component
settings and analysis data retain their original units. Existing calls without
`units` keep their current defaults and headers.

The same option works for DC, device curves, rectification, FFT and supported
waveform/analog measurement tables:

```js
var bias = dc.out('ic', {component: q1, units: {current: 'mA'}});
var curves = q1.ivTable();
var current = curves.out('ic', {units: {current: 'mA'}});
var trace = source.out('waveform', {units: {time: 'us', voltage: 'mV'}});
var amplitude = spectrum.out('dBV', {units: {frequency: 'MHz', voltage: 'mV'}});
```

| Quantity | Supported units |
| --- | --- |
| `frequency` | Hz, kHz, MHz, GHz, THz |
| `time` | s, ms, us, ns, ps |
| `voltage` | V, mV, uV, nV, dBV |
| `current` | A, mA, uA, nA, pA |
| `capacitance` | F, mF, uF, nF, pF, fF |
| `resistance` | ohm, kohm, Mohm |
| `temperature` | K |
| `angle` | deg, rad |
| `power` | W, mW, uW, nW, pW, dBm, dBW |
| `powerDensity` | W/Hz, mW/Hz, uW/Hz, nW/Hz, pW/Hz, dBm/Hz, dBW/Hz |
| `sensitivity` | V/W, mV/W, uV/W |

Unit names are case-sensitive; `u` displays as `µ`. A requested quantity must
exist in the selected table. Unknown or incompatible choices report errors.
Unspecified quantities retain their existing units. Existing suffix selectors
still work; a `units` entry overrides the suffix for that quantity.

Use the same horizontal-axis units for tables combined in one line plot.
Original unit-selected tables are displayed without another metric conversion;
omitting `metricPrefix` also works. Passing `none` is portable when tables are
copied or sent through a worker. JSON, structured clones and array copies lose
the private unit metadata but keep the headings and converted values. Other
explicit metric prefixes reject on an original unit-selected table.

Unit conversion preserves signs and amplitude conventions. RF signal volts are
peak; calibrated FFT `dBV` is RMS and keeps its existing floor. Raw FFT magnitude
does not become volts merely by requesting voltage units. Gain/NF ratios retain
their selector-defined dB or linear form. Decoded bits, normalized VNA responses,
raw vectors, scalars and settings are not voltage measurement tables; unsupported
conversions report an error. Older installed bundles may lack this option.
