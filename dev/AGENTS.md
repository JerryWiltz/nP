# AGENTS.md

Instructions for files in `dev/`.

These files are manual browser development and verification harnesses. They are not the source of truth for library behavior.

- Load the built browser bundle with `../dist/nP.js`.
- Put reusable library code under `src/`, then run `npm run build` when the browser bundle should be updated.
- Use `npm run dev:new -- pageName [divId ...]` to create a new dev HTML page without rewriting boilerplate by hand.
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

## `nP.js` Functions Available In Dev Pages

Dev pages load `../dist/nP.js`, so use these functions through the browser global `nP`.

Chart and browser helpers:

- `nP.lineChart()`
- `nP.lineTable()`
- `nP.smithChart()`
- `nP.log()`
- `nP.version()`
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
