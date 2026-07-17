<!-- Modified: 2026-07-15 -->
# n-Port Data Model

This document describes the object and table shapes that allow components, circuit combinations, output extractors, charts, and the Obsidian plugin to interoperate.

## Global analysis settings

The shared object exported from `src/np-global/src/global.js` contains:

```js
{
    fList: [2e9],
    Ro: 50,
    Temp: 293,
    fGen(start, stop, points)
}
```

- `fList` is the list of analysis frequencies in hertz.
- `Ro` is the real reference impedance in ohms.
- `Temp` is the shared temperature setting. Models must document the temperature scale they use.
- `fGen()` creates a linearly spaced list including both endpoints when `points > 1`.

Set these values before constructing components. Constructors calculate their S-parameter rows immediately; changing `global.fList` later does not recalculate an existing component.

An n-port's `.global` property currently holds a reference to the shared global object, not an immutable snapshot. Its `.spars` rows are the actual calculated result.

## The base object

`src/np-nport/src/nPort.js` defines the base `nPort` object. Constructors normally follow this pattern:

```js
var component = new nPort();
component.setspars(sparsArray);
component.setglobal(global);
return component;
```

The common public surface is:

| Member | Purpose |
| --- | --- |
| `.spars` | Frequency rows containing the S matrices. |
| `.global` | Reference to the analysis settings object used by the constructor. |
| `.setspars(rows)` / `.getspars()` | Store and retrieve S-parameter rows. |
| `.setglobal(settings)` / `.getglobal()` | Store and retrieve global settings. |
| `.cas(other)` | Cascade this two-port with another two-port. |
| `.out(...selectors)` | Produce a numeric chart/table input table. |
| `.outTable(...selectors)` | Existing equivalent table-producing method. |

Specialized constructors may add metadata such as `.microstrip`, `.diode`, `.filmResistor`, or `.ivTable()`.

## S-parameter row shape

Every row starts with frequency and then stores a square S matrix in row-major order:

```text
[frequency, s11, s12, ..., s1n, s21, s22, ..., snn]
```

For a one-port:

```text
[frequency, s11]
```

For a two-port:

```text
[frequency, s11, s12, s21, s22]
```

For a three-port:

```text
[frequency, s11, s12, s13, s21, s22, s23, s31, s32, s33]
```

The number of ports is inferred as:

```js
Math.sqrt(row.length - 1)
```

Therefore, `row.length - 1` must be a perfect square. Each S-parameter entry must be a `complex()` object with public `.x` and `.y` fields and the complex methods used throughout nP.

The zero-based array index for public one-based `s[row][column]` is:

```text
1 + (row - 1) × numberOfPorts + (column - 1)
```

The existing `.out()` implementation expresses the same relationship as `(row - 1) * n + column`, because index zero is occupied by frequency.

## Frequency invariants

Components combined in one circuit are expected to have:

- The same number of frequency rows.
- The same frequency at each row index.
- Compatible reference impedance.
- A valid square S matrix at every frequency.

The current cascade and nodal routines assume these conditions; they do not comprehensively validate them. A component constructor or caller must not mix independently generated frequency grids in one combined network.

## Extracting display data

`.out(...)` converts selected complex S-parameters into a numeric table. A call such as:

```js
var table = network.out('s11dB', 's21Re', 's21Im');
```

returns:

```text
[
    ['Freq', 's11dB', 's21Re', 's21Im'],
    [frequency1, number, number, number],
    [frequency2, number, number, number]
]
```

Supported suffixes are:

| Suffix | Conversion |
| --- | --- |
| `mag` | Linear magnitude. |
| `dB` | `20 log10(magnitude)`. |
| `ang` | Phase in degrees. |
| `Re` | Real part. |
| `Im` | Imaginary part. |

`lineChart()` and `lineTable()` consume this table directly. `smithChart()` expects paired real and imaginary columns such as `s11Re` and `s11Im`.

Selectors currently support single decimal digits for row and column because `.out()` extracts the first two digits from the selector. Networks with ten or more ports would require an intentional selector-parser change.

## Ownership and mutation

Complex arithmetic methods return new complex objects. `setR()` and `setI()` are the exceptions: they mutate their receiver.

Matrix inversion and Gaussian solving duplicate the row arrays before operating. The copy is shallow with respect to complex objects, but the arithmetic used by those algorithms creates replacement complex values rather than mutating existing entries.

`nPort.cas()` creates a new n-port and does not rewrite the two input `.spars` arrays. `cascade()` reduces a local array of arguments by replacing entries in that local array.

Treat `.spars` as an established public structure, but avoid editing it after construction. Reconstruct the component when analysis settings or physical parameters change.

## Constructor contract

A new n-port constructor should:

1. Read the configured frequency list and reference impedance.
2. Create exactly one row per frequency.
3. Put frequency in column zero.
4. Put a complete row-major square S matrix after it.
5. Use `complex()` for every S entry.
6. Set `.spars` and `.global` on a new `nPort`.
7. Add model-specific metadata without changing the common row shape.
8. Return the n-port object.

At minimum, test the row count, row length, frequencies, finite complex values, expected symmetry or reciprocity, and one physically meaningful result.

## Related documents

- [`nodal-analysis.md`](nodal-analysis.md) explains arbitrary interconnection.
- [`np-math/README.md`](np-math/README.md) explains the complex and matrix objects used in S matrices.
- [`np-nport/README.md`](np-nport/README.md) describes constructor and composition families.
- [`rf-math-coding.md`](rf-math-coding.md) describes the equation-to-code workflow.
