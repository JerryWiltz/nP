<!-- Modified: 2026-11-26 -->
# Common output-unit contract

Measurement-table `.out()` readers accept a final `units` map. Unit selection
changes only fresh display tables, never component parameters, operating points,
waveform samples, FFT coefficients, signal/noise data or sweep settings. Existing
calls retain their headers, numeric values and legacy defaults. Native logarithmic
fields such as dBm retain their existing meaning and reference.

```js
var response = network.out('s21dB', {units: {frequency: 'GHz'}});
var trace = source.out('waveform', {units: {time: 'us', voltage: 'mV'}});
var current = curves.out('ic', {units: {current: 'mA'}});
```

## Audit of existing formats

| Output family | Legacy table units | Common-option coverage |
| --- | --- | --- |
| RF `.out()` | Frequency Hz; selector-defined S/NF/phase, V, dBm, noise density | Frequency, signal voltage/phase/power, S phase, IM/OIP power, covariance and output noise density |
| DC `.out()` | V/A/ohm/K, or existing selector suffixes | All typed selected quantities; undetermined observations stay text |
| `ivTable().out()`, `cvTable().out()` | V/A/F, or selector suffixes | Swept voltage, currents and capacitances, retaining stepped bias labels |
| Rectification `.out()` | Input dBm; V or V/W with existing suffixes | Input power, output voltage and sensitivity |
| `waveform().out('waveform')` | Seconds/volts | Time and voltage |
| PN and sampled mod/demod waveform tables | Nanoseconds/volts | Time and actual voltage; decoded bits and normalized responses are dimensionless |
| Analog mod/demod tables | Hz/V/deg tones; s/V envelopes; s/deg phase; s/Hz deviation | Declared frequency, time, voltage, phase and tone power |
| VNA-frequency receiver tables | Hz plus selector-dependent response | Frequency and response phase; ambiguous/unreferenced response magnitudes are not assigned a physical voltage unit |
| FFT / inverse FFT | Hz or s plus raw coefficients; calibrated `dBV` is RMS voltage | Frequency/time axes; voltage conversion only from real-input `dBV` output |

Raw bits, counts, settings, scalar measurements, raw sample vectors, complex
spectra and old `outTable()`/`noiseOut()` keep their existing contracts. They do
not accept the new conversion map. Ask for a supported measurement table first.
`units` is optional; waveform/FFT default selectors remain unchanged. RF, DC,
curve and rectification selectors remain explicit as previously documented.

## Units and precedence

| Quantity key | Accepted units |
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

Keys and units are case-sensitive. ASCII `u` and Unicode micro signs are accepted;
headings display `µ`. Resistance also accepts Ω/kΩ/MΩ. A requested quantity must
exist in the selected table; unknown, incompatible or unused requests reject.
An empty `units:{}` retains declared units while making them explicit in headers.
Unspecified quantities retain their selected units, including legacy ns time
tables. A unit map overrides existing suffix units for that quantity; prefer
unsuffixed selectors with the map. Requests collapsing distinct columns to the
same heading reject. Individual legacy suffix selection remains compatible.

S-parameter ratios and NF retain their selector-defined dB/linear forms; they
are not absolute power. Use their existing selectors to choose those forms.
Covariance linear entries are W/Hz; their existing `dB` form is dBW/Hz. Signed
cross-covariance stays signed in linear units and cannot become a logarithm.
Power dBm references 1 mW; dBW references 1 W; dBV references 1 V. Zero becomes
−Infinity when selecting a logarithmic unit; no new display floor is applied.
Negative logarithmic arguments, overflow and underflow of finite conversions
reject. Existing infinities and undetermined DC observations retain their meaning.

Units do not change amplitude convention: RF signal voltage remains peak;
calibrated FFT `dBV` remains RMS with its existing one-sided normalization and
display floor. Choosing V/mV on that output converts the calibrated/floored
amplitude. Raw DFT real/imaginary/magnitude values are not silently calibrated.
Advanced decoded-symbol waveform tables contain bits, not physical volts;
unit-selected output labels them `Decoded bit`. Use a carrier waveform for volts.

## Charts and copies

Original unit-selected results carry private non-enumerable symbol metadata.
`lineChart`, `lineTable` and `smithChart` honor those units without applying their
legacy default `giga` division. `metricPrefix:'none'`/`'one'` is also allowed;
another explicit prefix rejects to prevent double scaling. Old calls/tables
without explicit unit selection retain existing metricPrefix behavior.

Line plots require matching declared first-column units across their input
tables; request the same output units for every trace. Tables may stack results
with separate units. Explicit unit-selected line plots derive default axis
titles from the output declarations; explicit caller titles still take priority.
Raw numeric xRange/bar-baseline values use the selected output units.

JSON/structured clones and ordinary array copying omit the private metadata.
Headers and converted numbers survive; pass `metricPrefix:'none'` when displaying
these copies. This also supports worker/chart transport without guessing units
from arbitrary header text. Always using `none` with new output-unit options is
a portable convention. Old or pinned runtimes may lack the new readers/options;
guide maintenance does not upgrade their library pin.

## Implementation and verification

`src/np-global/src/outputUnits.js` owns conversion, validation and table metadata.
Producers declare dimensions and source units explicitly; headers do not choose
the physics. `src/np-digital/src/outputUnitProfiles.js` describes each supported
table family. Default data and behavior are preserved, rather than normalizing
old ns tables destructively. No electrical or semiconductor equations change.

`test/output-units.test.js` covers every family, references, amplitude conventions,
signed/undetermined values, ownership, copies, mixed units and invalid requests.
The complete Node suite checks legacy compatibility. [outputUnits.html](../../dev/outputUnits.html)
provides the browser harness for unit-aware charts/tables and ordinary defaults.
