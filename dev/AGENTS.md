# AGENTS.md

Instructions for files in `dev/`.

These files are manual browser development and verification harnesses. They are not the source of truth for library behavior.

- Load the built browser bundle with `../dist/nP.js`.
- Put reusable library code under `src/`, then run `npm run build` when the browser bundle should be updated.
- Use `npm run dev:new -- pageName [divId ...]` to create a new dev HTML page without rewriting boilerplate by hand.
- Example: `npm run dev:new -- tempWorkflowTest chartDiv`.
- Format `nP.nodal(...)` calls with one connection argument per line.
- Prefer clear mount div names such as `chartDiv`, `tableDiv`, `smithDiv`, `seriesR`, or `parallelR`.
- Keep examples small enough to inspect visually in a browser.
- When testing downloaded screenshots, check `/mnt/chromeos/MyFiles/Downloads`.

## Dev Page Example Flow

Write dev examples in this order so the circuit logic is easy to follow:

1. Set frequencies with `nP.global.fList`.
2. Create electrical components as n-port objects, such as `nP.R()`, `nP.L()`, `nP.C()`, `nP.Tee()`, or `nP.Short()`.
3. Combine those n-port objects into larger n-port objects with `nP.nodal()` or `nP.cascade()`.
4. Reuse combined n-port objects as blocks in a larger circuit when useful.
5. Extract data with `.out(...)`.
6. Send the output table to `nP.lineChart()`, `nP.lineTable()`, or `nP.smithChart()`.

This pattern is preferred over putting unrelated chart/table data directly into a dev page unless the page is specifically testing chart or table behavior.

## Chart And Table Dev Pages

- `nP.lineChart()` consumes numeric x/y tables. It supports linear/log x and y scales, origin or edge axis placement, hover values, chart labels, plot border styling, and PNG copy.
- `nP.smithChart()` consumes paired real/imaginary columns such as `s11Re`, `s11Im`, `s22Re`, and `s22Im`. Keep its rendered area square. It draws SVG Smith-grid circles, trace labels, hover values for frequency/Re/Im/magnitude/angle, and PNG copy.
- `nP.lineTable()` consumes the same table shape returned by `nPort.out(...)`, renders SVG tables, and provides PNG and TSV copy buttons.
- Use `pngBackground: 'white'` in dev pages when a copied PNG should have an opaque white background.
- Prefer `metricPrefix` values that match the displayed frequency header. For example, `metricPrefix: 'giga'` displays frequencies scaled to GHz.

## Math And nPort Objects In Dev Pages

- `nP.complex(real, imaginary)` returns a complex object with `.x` and `.y` fields plus methods such as `getR()`, `getI()`, `add()`, `sub()`, `mul()`, `div()`, `inv()`, `mag()`, `ang()`, `mag10dB()`, and `mag20dB()`.
- `setR()` and `setI()` mutate a complex object and return `this`, so chained examples such as `c.setR(1).setI(2)` are valid.
- `nP.matrix(array2d)` returns a matrix object with public field `.m`.
- Use real matrix methods for numeric matrices: `add()`, `sub()`, `mul()`, `invert()`, and `solveGaussFB()`.
- Use complex matrix methods for complex entries: `addCplx()`, `subCplx()`, `mulCplx()`, `invertCplx()`, and `solveGaussFBCplx()`.
- n-port objects carry S-parameter rows in `.spars`; each row is `[frequency, s11, s12, s21, s22, ...]` and S-parameter values are complex objects.
- Use `.out(...)` on any n-port object to produce chart/table-ready numeric data.

## Ladder Network Pattern

When a dev page shows a ladder network, write it as explicit parts plus `nP.nodal()` so the circuit is readable.

- Use reference-designator-style names for electrical parts, such as `r1`, `l1`, `c1`, `series1`, or `shunt1`.
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

For RF power divider dev pages, use `nP.Tee()` as the ideal split/combining junction. Tee internal port 1 is the common input or combining branch, and the other two Tee ports feed the output branches.

Example:

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

For coupled transmission line dev pages, number ports clockwise starting at the upper-left port. Use this same convention for `nP.tclin()`, `nP.mclin()`, and future coupled-line constructors.

```text
port 1  ---- coupled line ----  port 2
port 4  ---- coupled line ----  port 3
```

With input at port 1, port 2 is through, port 4 is coupled, and port 3 is isolated. In `nP.nodal(...)`, preserve the constructor order, for example `[coupledLine, 1, 2, 3, 4]`.

## `nP.js` Functions Available In Dev Pages

Dev pages load `../dist/nP.js`, so use these functions through the browser global `nP`.

Chart and browser helpers:

- `nP.lineChart()`
- `nP.lineTable()`
- `nP.smithChart()`
- `nP.log()`
- `nP.version`
- `nP.getCircuitTitle()`
- `nP.callCodemirror()`
- `nP.run()`
- `nP.runButton()`
- `nP.bodyWidth()`

Global settings:

- `nP.global`

Math helpers:

- `nP.complex()`
- `nP.matrix()`
- `nP.dim()`
- `nP.dup()`

Low-pass prototype helpers:

- `nP.chebyLPgk()`
- `nP.chebyLPLCs()`
- `nP.chebyLPNsec()`

Common RLC n-port constructors used by generated dev pages:

- `nP.R()`
- `nP.L()`
- `nP.C()`

Connection and combining helpers:

- `nP.Tee()`
- `nP.Tee4()`
- `nP.Tee5()`
- `nP.seriesTee()`
- `nP.nodal()`
- `nP.cascade()`

Ideal fixtures:

- `nP.Open()`
- `nP.Short()`
- `nP.Load()`

Transmission-line and microstrip constructors:

- `nP.tlin()`
- `nP.tclin()`
- `nP.mlin()`
- `nP.mclin()`
- `nP.mtee()`
- `nP.trf()`
- `nP.trf4Port()`

## Keep-Alive RLC Functions

These functions should remain available and may be used in auto-generated HTML examples when needed.

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
