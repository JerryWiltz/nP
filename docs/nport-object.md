<!-- Modified: 2026-10-19 -->
# nPort object

An **nPort object** represents an electrical component or an assembled circuit at a set of analysis frequencies. Constructors such as `nP.R()` and `nP.Tee()` return nPorts. So do `nP.nodal()`, `nP.cascade()`, and an nPort's `.cas()` method. The base `nPort` constructor is internal; use these public functions to create one.

## What an nPort contains

| Property | Meaning |
| --- | --- |
| `.spars` | Frequency rows containing the circuit's complex S-parameters. |
| `.global` | A copy of the analysis settings captured when the nPort was created. |
| `.noise` | Frequency-aligned intrinsic noise covariance rows. Passive components derive thermal noise when this property is first read; active models can supply their own. |
| `.signal` | An attached analog or digital signal, when present; otherwise `undefined`. |

Each `.spars` row starts with frequency in hertz. The remaining entries form an S-parameter matrix in row-major order. A two-port row is `[frequency, s11, s12, s21, s22]`; each `s` value is an `nP.complex()` object. An *n*-port row has `1 + n²` entries. Port numbers start at 1, so `s21` is the response at output port 2 from input port 1.

```js
nP.global.fList = [1e9, 2e9];

var r1 = nP.R(50);
var firstRow = r1.spars[0];

// firstRow[0] is 1e9 Hz; firstRow[3] is the complex s21 value.
```

The `.noise` rows have the form `{frequency, C}`, where `C` is a full complex covariance matrix with one row and column per port. See [Noise](./noise.md) for what those values mean and how to measure noise figure or output noise. See the [Tutorial](./tutorial.md) for signal examples.

Changing `nP.global` after construction does not recalculate an existing nPort. Likewise, changing an nPort's saved `.global` settings does not regenerate its S-parameters. Construct a new component when its physical inputs or analysis frequencies change.

## Read results with `.out()`

Call `.out(...selectors)` to turn the nPort's complex data into a numeric table. The first row contains column names; each later row starts with frequency in hertz.

```js
nP.global.fList = nP.global.fGen(100e6, 2e9, 51);

var r1 = nP.R(50);
var response = r1.out('s11dB', 's21dB');

nP.lineTable({inputTable: [response]});
```

Here, `response[0]` is `['Freq', 's11dB', 's21dB']`, followed by 51 numeric rows. You can pass the same table to `nP.lineChart()`.

For S-parameters, use the output-port number, input-port number, and one of these suffixes:

| Selector | Result |
| --- | --- |
| `s21dB` | Magnitude in dB. |
| `s21mag` | Linear magnitude. |
| `s21ang` | Phase in degrees. |
| `s21Re` | Real part. |
| `s21Im` | Imaginary part. |

Replace `21` with another valid output/input port pair. `.out()` also accepts [noise](./noise.md) and [intermodulation](./intermodulation.md) selectors. For those measurements, an optional final options object supplies conditions such as source and termination settings or a two-tone override. With two-tone analysis, `.out()` shows the selected sweep frequencies even when the nPort stores additional internal product-frequency rows.

## Cascade two-ports with `.cas()`

`first.cas(second)` connects two two-port nPorts in order and returns a **new** two-port. It combines their S-parameters and carries forward their noise, attached signals, and known intermodulation sources. Both inputs must have matching frequency rows.

```js
nP.global.fList = [1e9, 2e9];

var r1 = nP.R(25);
var r2 = nP.R(50);
var chain = r1.cas(r2);

var response = chain.out('s21dB');
```

`nP.cascade(r1, r2)` is the public helper for a chain of two-ports. Use `nP.nodal()` for arbitrary connections or multiport circuits.

## Data access methods

These methods mainly serve constructor authors and code that inspects nPort internals:

| Method | Behavior |
| --- | --- |
| `.getspars()` | Returns the `.spars` array itself, not a copy. |
| `.getglobal()` | Returns the `.global` settings object itself, not a copy. |
| `.setspars(rows)` | Stores replacement S-parameter rows. Checks their alignment with existing `.noise` and `.signal` data, if present. |
| `.setglobal(settings)` | Copies the supplied analysis settings into `.global`; also captures temperature for passive noise and the selected display frequencies for two-tone analysis. |

The setters store data; they do **not** recalculate a component. Avoid changing returned arrays or objects unless you are deliberately maintaining the frequency, port, noise, and signal data together.

## Older output methods

`.outTable(...selectors)` extracts S-parameter columns, and `.noiseOut(...selectors)` extracts covariance columns. Both return a table with a `Freq` heading and walk every stored frequency row, including internal two-tone rows. They remain available for older code; use `.out()` for new work because it supports S-parameters and other result families through one method.
