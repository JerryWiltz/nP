# AGENTS.md
<!-- Modified: 2026-06-24 -->

Instructions for files in `docs/` and its subdirectories.

These files are user-facing documentation, examples, images, and documentation-site configuration. Keep documentation examples aligned with the current source in `src/` and the browser global `nP`.

- Treat `src/` as the source of truth for library behavior.
- Update documentation examples when public APIs or recommended circuit-building patterns change.
- Prefer clear, modern examples over preserving legacy example style.
- Use `npm run docs:build` from the repo root after substantive docs changes when practical.
- Do not edit generated VitePress output unless the user explicitly asks.
- When updating archived material under `docs/_archive/`, preserve historical intent, but modernize examples when the user asks for docs-wide cleanup.
- In browser examples, prefer `nP.log(...)` over `console.log(...)` when the output is meant to appear on the page. Make sure the page loads the built bundle before using `nP.log(...)`.
- The version value is `nP.version`, not `nP.version()`.
- When intentionally editing a hand-maintained documentation file, add or update a simple `Modified: YYYY-MM-DD` comment near the top of the file. Do not update dates in generated VitePress output.

## Documentation Example Flow

Write RF examples in this order so the circuit logic is easy to follow:

1. Set frequencies with `nP.global.fList`.
2. Create electrical components as n-port objects, such as `nP.R()`, `nP.L()`, `nP.C()`, `nP.Tee()`, or `nP.Short()`.
3. Combine those n-port objects into larger n-port objects with `nP.nodal()`.
4. Reuse combined n-port objects as blocks in larger circuits when useful.
5. Extract data with `.out(...)`.
6. Send the output table to `nP.lineChart()`, `nP.lineTable()`, or `nP.smithChart()`.

Prefer this flow over examples that hide topology inside legacy combined RLC constructors or long cascades.

## Modernizing Legacy RF Examples

When refreshing docs examples, remove legacy compound-component style where practical:

- Prefer explicit `nP.R()`, `nP.L()`, and `nP.C()` components with reference-designator-style names such as `r1`, `l1`, and `c1`.
- Prefer `nP.nodal(...)` for circuit topology, especially ladders, filters, power dividers, and multiport examples.
- Replace old combined RLC constructors such as `nP.seSeRL()`, `nP.paSeRC()`, `nP.sePaRLC()`, and similar helpers with explicit individual components and `nP.nodal(...)`.
- Replace `.cas(...)` or `nP.cascade(...)` in documentation examples when the actual circuit topology is clearer as explicit nodes.
- Keep `nP.cascade()` only when the example is specifically teaching or testing two-port cascade behavior.
- Format `nP.nodal(...)` calls with one connection argument per line.

## Ladder Network Pattern

For ladder-style circuits, write explicit parts plus `nP.nodal()` so the schematic topology remains visible.

- Use reference-designator-style names for electrical parts.
- Construct ideal `Tee` and `Short` objects once when convenient, then reuse them.
- In `nP.Tee()`, internal port 1 is the common/shunt branch. In a `nP.nodal(...)` call, place the shunt node first for that Tee.
- Connect each shunt branch from the Tee common branch through the shunt component to `nP.Short()`.

Example:

```js
var Tee = nP.Tee();
var Short = nP.Short();

var ladder = nP.nodal(
    [series1, 1, 2],
    [Tee, 4, 2, 3],
    [shunt1, 4, 5],
    [Short, 5],

    [series2, 3, 6],
    [Tee, 8, 6, 7],
    [shunt2, 8, 9],
    [Short, 9],

    [series3, 7, 10],
    ['out', 1, 10]
);
```

## RF Power Divider Pattern

Use `nP.Tee()` as the ideal split/combining junction for RF power divider examples. Tee internal port 1 is the common input or combining branch, and the other two Tee ports feed the output branches.

```js
var Tee = nP.Tee();

var divider = nP.nodal(
    [Tee, 1, 2, 3],
    [branch1, 2, 4],
    [branch2, 3, 5],
    ['out', 1, 4, 5]
);
```

For Wilkinson-style examples, use transmission-line branches and, when needed, an isolation resistor between output branch nodes. Useful outputs include `s21dB`, `s31dB`, `s11dB`, and `s23dB`.

## Coupled Transmission Line Port Order

Coupled transmission line components are numbered clockwise starting at the upper-left port. Use this convention for `nP.tclin()`, `nP.mclin()`, and future coupled-line constructors.

```text
port 1  ---- coupled line ----  port 2
port 4  ---- coupled line ----  port 3
```

With input at port 1, port 2 is through, port 4 is coupled, and port 3 is isolated. In `nP.nodal(...)`, preserve the constructor order, for example `[coupledLine, 1, 2, 3, 4]`.

## Chart And Table Examples

- `nP.lineChart()` consumes numeric x/y tables. It supports linear/log x and y scales, origin or edge axis placement, hover values, chart labels, plot border styling, and PNG copy.
- `nP.smithChart()` consumes paired real/imaginary columns such as `s11Re`, `s11Im`, `s22Re`, and `s22Im`. Keep its rendered area square.
- `nP.lineTable()` consumes the same table shape returned by `nPort.out(...)` and provides PNG and TSV copy buttons.
- Prefer `pngBackground: 'white'` in documentation examples when copied PNG behavior matters.
- Prefer `metricPrefix` values that match the displayed frequency header.

## Complex And Matrix Documentation

Update docs as needed when examples use `nP.complex()` or `nP.matrix()`.

- `nP.complex(real, imaginary)` returns a complex object with public `.x` and `.y` fields.
- Complex helpers include `getR()`, `getI()`, `setR()`, `setI()`, `add()`, `sub()`, `mul()`, `div()`, `inv()`, `mag()`, `ang()`, `mag10dB()`, and `mag20dB()`.
- `setR()` and `setI()` mutate the complex object and return `this`.
- `nP.matrix(array2d)` returns a matrix object with public field `.m`.
- Read matrix entries through `.m[row][column]`; matrix objects do not have an `.out()` method.
- Use real matrix methods for numeric matrices: `add()`, `sub()`, `mul()`, `invert()`, and `solveGaussFB()`.
- Use complex matrix methods for complex entries: `addCplx()`, `subCplx()`, `mulCplx()`, `invertCplx()`, and `solveGaussFBCplx()`.
- n-port objects carry S-parameter rows in `.spars`; each row is `[frequency, s11, s12, s21, s22, ...]` and S-parameter values are complex objects.

## Keep-Alive Legacy RLC Functions

These functions still exist and may be documented when the topic is legacy compatibility, but they should not be the preferred pattern for new or refreshed examples.

RLC constructors:

- `nP.seR()`
- `nP.seL()`
- `nP.seC()`
- `nP.paR()`
- `nP.paL()`
- `nP.paC()`

Combined RLC n-port constructors:

- `nP.seSeRL()`
- `nP.paSeRL()`
- `nP.seSeRC()`
- `nP.paSeRC()`
- `nP.seSeLC()`
- `nP.paSeLC()`
- `nP.seSeRLC()`
- `nP.paSeRLC()`
- `nP.paPaRL()`
- `nP.sePaRL()`
- `nP.paPaRC()`
- `nP.sePaRC()`
- `nP.paPaLC()`
- `nP.sePaLC()`
- `nP.paPaRLC()`
- `nP.sePaRLC()`
