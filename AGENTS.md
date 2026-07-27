sudo npm install -g @openai/codex
Read all applicable AGENTS.md files before working. Inspect the current Git status and latest commits, then continue from the repository’s current state.

# AGENTS.md
<!-- Modified: 2026-07-26 -->

Repository guide for agents working in the `nP` repo.

## Scope

These instructions apply to the entire repository rooted at
`/home/jerrywiltz/cad-development/nP`.

## Write-Target Validation

Before creating, editing, moving, or deleting a file:

1. Resolve the current repository root with Git.
2. Verify that the intended target is inside that current root unless the user
   explicitly authorizes another exact path.
3. Check `/home/jerrywiltz/workspace-admin/logs/maintenance-log.md` when a
   former repository path is known. Treat former paths as historical and
   non-writable.
4. For every absolute write target, report and validate the resolved path before
   using it.
5. Stop if an operation would recreate a former repository directory.
6. Never create missing parent directories for an absolute target unless the
   user explicitly approves that exact directory creation.
7. Prefer paths relative to the verified current repository root for repository
   files.

## Local Environment

- The user is working from an Acer Chromebook Plus 515.
- The Linux home directory may not contain a normal `~/Downloads` folder.
- The ChromeOS Downloads folder is visible from the Linux container at `/mnt/chromeos/MyFiles/Downloads`.
- When the user refers to downloaded files, check `/mnt/chromeos/MyFiles/Downloads` first before assuming the files are unavailable.

## Project Summary

`nP` is a browser-oriented JavaScript library for microwave/RF circuit analysis and visualization. The public API is exported from `src/index.js`, bundled by Rollup into `dist/nP.js`, and exposed as the global `nP` in browser usage.

Primary domains:

- RF n-port analysis, S-parameters, cascading, nodal interconnection, RLC components, ideal components, microstrip helpers, and fixtures in `src/np-nport`.
- Complex arithmetic and matrix solving in `src/np-math`.
- Global analysis settings such as frequency list, reference impedance, and temperature in `src/np-global`.
- Chebyshev low-pass prototype helpers in `src/np-lowpass-prototype`.
- D3-based chart, Smith chart, and table rendering in `src/np-chart`.
- Browser helper utilities in `src/np-misc`.
- Diode and nonlinear-device model development in `src/np-diodes`.
- User documentation in `README.md` and `docs/index.md`.

## nP Workflow Model

The normal browser/example workflow is hierarchical:

1. Set the analysis frequencies first, usually with `nP.global.fList = nP.global.fGen(start, stop, points)`.
2. Create electrical components and fixtures as n-port objects, such as `nP.R()`, `nP.L()`, `nP.C()`, `nP.Tee()`, `nP.Short()`, `nP.Open()`, `nP.Load()`, `nP.Tlin()`, or `nP.mlin()`.
3. Combine smaller n-port objects into larger n-port objects with helpers such as `nP.nodal()` or `nP.cascade()`.
4. Reuse those combined n-port objects as building blocks in larger circuits when useful.
5. Call `.out(...)` on any n-port object to extract selected values such as `s11dB`, `s21dB`, `s11Re`, or `s11Im`.
6. Pass the resulting output table to display helpers such as `nP.lineChart()`, `nP.lineTable()`, or `nP.smithChart()`.

Preserve this mental model when writing examples, docs, tests, or dev pages. Prefer examples that make the flow visible: frequencies, components, combinations, outputs, then plots/tables.

## Ideal Component Naming

Ideal component constructors use an uppercase first letter in the public API, even when the underlying concept is a transmission line or coupled line.

- Use `nP.Tlin()` for the ideal lossless two-port transmission line.
- Use `nP.Tclin()` for the ideal lossless four-port coupled transmission line.
- Keep physical microstrip models lowercase, such as `nP.mlin()` and `nP.mclin()`.
- Put ideal component source files in `src/np-nport/src/idealComponents/` and name the files to match the public constructor casing.
- Use `nP.Tee()` for ideal junctions. Do not reintroduce a separate series-tee helper; connect series two-port components directly in `nP.nodal(...)`.

## Core Object Model

The main internal objects are `complex`, `matrix`, and `nPort`. Keep their existing shapes intact unless the user explicitly requests a breaking API cleanup.

### `complex()` Objects

- `nP.complex(real, imaginary)` returns a `Complex` object with public numeric fields `.x` and `.y`.
- `.x` and `.y` are read directly in some browser/logging code. Do not rename them to `.real`/`.imag` without updating every consumer.
- Public accessors and mutators are `getR()`, `getI()`, `setR()`, and `setI()`. `setR()` and `setI()` mutate the object and return `this`; keep that chainable behavior.
- Arithmetic methods such as `add()`, `sub()`, `mul()`, `div()`, `inv()`, `neg()`, `copy()`, `sinhCplx()`, and `coshCplx()` return new `complex()` objects rather than mutating the receiver.
- Magnitude and angle helpers include `mag()`, `ang()`, `mag10dB()`, and `mag20dB()`.
- `nP.log()` and some docs/examples identify complex values by `constructor.name === 'Complex'`, so avoid changing the constructor name casually.

### `matrix()` Objects

- `nP.matrix(array2d)` returns a `Matrix` object with public field `.m`, a two-dimensional JavaScript array.
- Real matrix methods include `add()`, `sub()`, `mul()`, `invert()`, and `solveGaussFB()`.
- Complex matrix methods include `addCplx()`, `subCplx()`, `mulCplx()`, `invertCplx()`, and `solveGaussFBCplx()`.
- `dim(rows, cols, initial)` and `dup(array2d)` are exported helpers and are used by nodal analysis. Preserve their behavior.
- `invert()`, `invertCplx()`, `solveGaussFB()`, and `solveGaussFBCplx()` operate on duplicated array data and return new matrix objects. Preserve that non-mutating behavior for caller-owned matrices.
- Matrix entries may be numbers or `complex()` objects. Use the real methods only for numeric entries and the `Cplx` methods for complex entries.
- Matrix shape/indexing changes can break RF behavior because `nP.nodal()` depends on complex matrix inversion.

### `nPort` Objects

- n-port constructors return objects with `.spars` and `.global` managed through `setspars()`, `getspars()`, `setglobal()`, and `getglobal()`.
- `.spars` is an array of rows. Each row is `[frequency, s11, s12, s21, s22, ...]`; every S-parameter entry is a `complex()` object.
- The number of ports is inferred as `Math.sqrt(row.length - 1)`. Keep S-parameter row shapes square.
- `nPort.out('s21dB', 's11Re', ...)` extracts numeric tables with a header row. Valid suffixes are `mag`, `dB`, `ang`, `Re`, and `Im`.
- `cas()` and `nP.cascade()` are for 2-port cascades. Use `nP.nodal()` for arbitrary interconnections and multiport circuits.
- Any nPort can be reused as a component in a larger `nP.nodal(...)` call.

## Ladder Network Pattern

For ladder-style circuits, prefer explicit components plus `nP.nodal()` over combined RLC constructors when the example should show the circuit topology.

- Give actual electrical components reference-designator-style variable names such as `r1`, `l1`, `c1`, `series1`, or `shunt1`.
- `nP.Tee()` and `nP.Short()` are ideal connection/fixture objects. They may be constructed once and reused in multiple places when the same ideal object is sufficient.
- In `nP.Tee()`, internal port 1 is the common/shunt branch. In `nP.nodal(...)`, put the shunt node first for that Tee connection.
- A shunt branch normally connects from the Tee common branch through the shunt component to `nP.Short()`, not to a literal ground object.

Example pattern:

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

`nP.Tee()` is also the natural ideal junction for RF power divider examples. In divider topology, use Tee internal port 1 as the common input or combining branch, with the other two Tee ports feeding the output branches.

Example simple 3-port divider shape:

```js
var Tee = nP.Tee();

var divider = nP.nodal(
    [Tee, 1, 2, 3],
    [branch1, 2, 4],
    [branch2, 3, 5],
    ['out', 1, 4, 5]
);
```

Here node `1` is the common input, and nodes `4` and `5` are output ports. For Wilkinson-style examples, the branches are typically transmission-line sections and an isolation resistor may connect between the two output branch nodes. Inspect `s21dB` and `s31dB` for split, `s11dB` for input match, and `s23dB`/`s32dB` for output isolation.

`nP.mtee()` follows the same public port convention as `nP.Tee()` for power-divider use:

```text
          port 2
            |
port 1 -----+
            |
          port 3
```

Use `commonWidth` for port 1, `branch1Width` for port 2, and `branch2Width` for port 3. Internally, published microstrip Tee equations may use inline-Tee naming such as main arms `a` and `b` plus side arm `2`; remap those internal equations so the external nP order remains `[common, branch1, branch2]`.

## Coupled Transmission Line Port Order

Coupled transmission line components are numbered clockwise starting at the upper-left port. Preserve this convention for existing and future coupled-line constructors such as `nP.Tclin()` and `nP.mclin()`.

```text
port 1  ---- coupled line ----  port 2
port 4  ---- coupled line ----  port 3
```

With input at port 1, port 2 is the through port, port 4 is the coupled port, and port 3 is the isolated port. In `nP.nodal(...)`, connect these components in that same order, for example `[coupledLine, 1, 2, 3, 4]`.

## Microstrip Physical Constants

Shared microstrip constants live in `src/np-nport/src/mlin/constants.js`. Use those names consistently in `mlin()`, `mclin()`, `mtee()`, `mtfr()`, tests, dev notes, and future microstrip constructors.

- `INCH_TO_METER`
- `MIL_TO_METER`
- `C0`
- `EPSILON0`
- `MU0`
- `VACUUM_IMPEDANCE`
- `COPPER_RESISTIVITY`

Do not create alternate spellings for the same physical constant in nearby constructors. If a paper uses a different symbol, map it to the shared nP name in comments or raw notes, for example `eta_0 = VACUUM_IMPEDANCE`.

## Diode Model Pattern

Diode-related constructors live in `src/np-diodes`. These models are expected to support both RF and DC behavior:

- Emit S-parameters as nPort-compatible objects when the model is used in RF analysis.
- Expose DC I-V curve data in an `inputTable`-style shape that can be passed to `nP.lineChart()` or `nP.lineTable()`.
- Build practical diode components from lumped parasitic elements plus diode equations, rather than treating every diode as only an ideal nonlinear equation.
- Keep the RF and DC parts of a diode model visibly connected in examples: define physical/electrical parameters once, then derive S-parameters and I-V outputs from that model.
- Preserve the normal nP workflow where possible: set frequencies, create components, combine nPort objects, call `.out(...)`, then display with chart/table helpers.

## Spelling And Naming Consistency

- Correct spelling in filenames, headings, prose, comments, examples, and user-visible text whenever those files are otherwise being edited.
- Use one canonical spelling for each project term and keep capitalization consistent across source, documentation, development pages, and Obsidian notes.
- Preserve standard author, paper, equation-family, and model-family spellings. In particular, use `Hammerstad/Jensen`, not misspellings such as `Hammestad` or `Jensn`, and use `Chebyshev`, not variants such as `Chebychev`.
- Verify unfamiliar technical names before introducing or renaming them.
- Do not silently rename an established public API identifier merely to correct its spelling. Preserve compatibility or make an intentional, documented migration with an alias and updated consumers.
- When correcting a filename, update every active reference to that path in the same change and verify that the old spelling is no longer referenced.

## Repository Layout

- `src/index.js`: root public module entry point. Re-exports the subpackages.
- `src/np-*/index.js`: subpackage entry points.
- `src/np-*/src/*.js`: implementation files.
- `src/np-nport/src/idealComponents/`: ideal n-port components and fixtures such as `Open`, `Short`, `Load`, `Shift90`, `Tee`, `Tee4`, `Tee5`, `Tlin`, and `Tclin`.
- `src/np-diodes/`: diode and nonlinear-device models that may produce both RF S-parameters and DC I-V curve tables.
- `dist/nP.js`: generated UMD browser bundle. It is versioned in this repo, so update it only when intentionally rebuilding for release or distribution.
- `rollup.config.js`: root bundle config. Input is `src/index.js`; output is `dist/nP.js`; bundle name is `nP`.
- `package.json`: root scripts and dev dependencies.
- `docs/`: VitePress documentation.
- `developmentDocs/`: internal RF mathematics, equation-to-code reasoning, model provenance, data contracts, implementation decisions, and verification guidance. Keep detailed engineering explanations here; keep `AGENTS.md` focused on concise mandatory rules.
- `scripts/deploy.sh`: builds docs and force-pushes `docs/.vitepress/dist` to `gh-pages`.
- `scripts/extensionless-loader.mjs`: test-only Node loader for the repo's extensionless relative imports.
- `test/`: Node tests for math, global settings, and nPort behavior.
- `dev/`: local browser development and verification pages. These files are manual harnesses, not source of truth.
  - `dev/lineChartDevelopment.html`, `dev/lineTableDevelopment.html`, and `dev/smithChartDevelopment.html` load `../dist/nP.js` and exercise the built chart/table APIs.
  - `dev/mlinDevelopment.html`, `dev/mclinDevelopment.html`, `dev/mteeDevelopment.html`, `dev/mteePowerDividerDevelopment.html`, `dev/mtfrDevelopment.html`, `dev/matrixDevelopment.html`, and `dev/nodeDevelopment.html` are manual development pages for focused RF/math workflows.
  - `dev/raw/` holds raw technical source material, equation notes, and early derivations for work such as `mtee()`.

The old subpackage-level build artifacts under `src/np-*` have been removed. Treat the root package and root Rollup config as the only current build path.

## Commands

Use these commands from the repo root:

- `npm run build`: bundle `src/index.js` to `dist/nP.js`.
- `npm run docs:dev`: run the VitePress docs dev server.
- `npm run docs:build`: build the docs.
- `npm run docs:serve` or `npm run docs:preview`: serve built docs.
- `npm test`: run Node's built-in test runner against tests under `test/`.
- `npm run clean`: run `scripts/cleanup-gitignore.sh`.
- `npm run deploy`: build and deploy docs to `gh-pages`. This rewrites Git state inside the docs build output and force-pushes; do not run without explicit user approval.
- `npx playwright install chromium`: install Playwright's browser binary into the local Linux cache when it is missing.

The test command uses `scripts/extensionless-loader.mjs` so Node can run source files with the repo's existing extensionless import style.

## Playwright Browser Checks

- Playwright is a dev dependency for real browser smoke tests of docs and dev HTML pages.
- Browser binaries are installed outside the repo under `/home/jerrywiltz/.cache/ms-playwright/`; do not commit browser binaries or `node_modules/`.
- On this Chromebook Linux container, Playwright Chromium may fail inside the Codex sandbox with a Linux sandbox permission error. If browser launch fails with sandbox/permission errors, rerun the same Playwright command with escalated permissions.
- Use Playwright for browser-facing changes to `src/np-chart`, `src/np-misc`, `dev/*.html`, or docs HTML examples when visual/DOM behavior matters.
- For generated docs output, do not keep changes under `docs/.vitepress/dist/` unless the user explicitly asks. If `npm run docs:build` changes generated output during verification, restore that generated output after the check.
- A useful docs smoke pattern is to open each changed HTML file with `file://`, listen for `pageerror` and `console.error`, and check that pages which execute `nP.lineChart()` or `nP.lineTable()` produce an SVG.
- Some docs pages store runnable example code inside `<textarea>` for CodeMirror. Do not require chart/table SVG output from code that is only inside a textarea and not executed on page load.

## Coding Style

- The codebase uses ES modules.
- Existing implementation style is mostly function constructors, prototype methods, `var`, and semicolon-heavy JavaScript. Prefer matching nearby style when editing existing modules.
- Keep imports extensionless, matching existing files.
- Preserve the public API exported from `src/index.js` and subpackage indexes unless the user explicitly requests a breaking change.
- Many functions depend on the shared mutable `global` object from `src/np-global/src/global.js`. Be careful with changes that affect `global.fList`, `global.Ro`, or object-level `setglobal/getglobal` behavior.
- S-parameter rows are represented as `[frequency, s11, s12, s21, s22, ...]`, where complex entries are `complex()` objects.
- `nPort.out()` returns a table with a header row followed by numeric data rows. `lineChart()` and `lineTable()` consume this table shape.
- Preserve the public `.x`/`.y` fields on complex objects, `.m` on matrix objects, and `.spars`/`.global` on nPort objects.
- In `dev/` HTML files, format `nP.nodal(...)` calls with one connection argument per line so circuit connections are easy to read.
- `lineChart()`, `smithChart()`, and `lineTable()` share common option names where possible: `inputTable`, `mount`, `title`, `containerId`, `svgId`, `metricPrefix`, `fontFamily`, `fontSize`, `containerFontSizePx`, and `backgroundColor`. Keep older aliases such as `pngBackground`, `chartTitle`, `tableTitle`, and `headColor` working unless the user explicitly requests a breaking cleanup.
- `lineChart()` consumes numeric x/y tables, supports linear/log x and y scales, origin or edge axis placement, hover values, chart labels, plot border styling, and PNG copy.
- `smithChart()` consumes paired real/imaginary columns such as `s11Re`, `s11Im`, `s22Re`, and `s22Im`. It draws a square Smith chart with SVG resistance/reactance circles, trace labels, hover values for frequency/Re/Im/magnitude/angle, and PNG copy.
- `lineTable()` consumes the same table shape returned by `nPort.out(...)`, renders SVG tables, and includes clipboard-based PNG and TSV copy behavior.
- Browser rendering code in `src/np-chart` and `src/np-misc` assumes `document`, `window`, and sometimes clipboard APIs. Do not make those modules server-only without preserving browser behavior.
- Do not add large dependencies unless they are clearly justified. Current root dev dependencies are Rollup, D3, VitePress, and the Rollup node resolver plugin.

## Generated And Dirty Files

- Check `git status --short` before editing. This repo may contain user changes.
- Do not revert, reformat, or overwrite user changes unless explicitly requested.
- `dist/nP.js` is generated but tracked. Only modify it when a source change should be reflected in the distributable bundle.
- Avoid running `npm run build` when the user asked for source-only edits or asked not to change generated files.
- `node_modules/`, logs, docs build output, `.aider*`, and temporary `*Verify.html` files are ignored.
- `dev/` is not currently ignored. Tracked dev harnesses under `dev/` are intentionally kept; treat them as local manual test harnesses unless the user decides to publish examples from them.

## Modification Dates

- When intentionally editing a hand-maintained file, add or update a simple `Modified: YYYY-MM-DD` comment near the top of the file.
- Use the comment syntax native to the file type: `// Modified: YYYY-MM-DD` for JavaScript, `<!-- Modified: YYYY-MM-DD -->` for HTML and Markdown, and `/* Modified: YYYY-MM-DD */` for CSS.
- Do not add manual modification-date comments to generated output such as `dist/nP.js` or `docs/.vitepress/dist/` files unless the user explicitly asks.
- Do not touch files solely to update the date; update it only when the file is otherwise being edited.

## Verification Plan

When changing source code, use the narrowest verification that fits the change:

1. Run `npm run build` for changes to exported source under `src/`.
2. For chart or DOM helper changes, also smoke test with a page under `dev/` that calls `nP.lineChart()`, `nP.lineTable()`, or the affected helper.
3. For RF/math changes, create or use a small HTML verification page under `dev/` or a Node import script that compares known values. Good checks include:
   - `nP.seR(50)` should be matched at the configured `Ro`.
   - Cascading two equivalent 2-ports through `.cas()` and `nP.cascade()` should agree.
   - `nP.global.fGen(start, stop, points)` should include the expected first and last frequency.
   - Complex arithmetic should preserve basic identities such as `a.mul(b).div(b)` approximately equaling `a` when `b` is nonzero.
4. For docs changes, run `npm run docs:build`.
5. For browser-facing docs/dev changes, run a Playwright Chromium smoke check when practical.
6. If build, docs, or browser commands cannot run because dependencies are missing or browser launch is blocked, report that clearly and do not silently skip verification.

## Detailed Execution Plan For Future Agents

Follow this plan for substantive work in this repo:

1. Establish context.
   - Confirm the current directory is the repo root with `pwd` and `git rev-parse --show-toplevel`.
   - Inspect `git status --short` and note existing user changes.
   - Read the relevant entry point first: `src/index.js`, then the matching `src/np-*/index.js`, then implementation files.

2. Identify the affected public surface.
   - Determine whether the change affects the root `nP` global bundle, a subpackage export, docs examples, `dev/` HTML pages, or generated `dist/nP.js`.
   - If an API name or table shape changes, update every affected example and consumer.

3. Make minimal, local edits.
   - Keep edits close to the module that owns the behavior.
   - Preserve existing data structures for complex numbers, matrices, nPort spars arrays, and chart input tables.
   - Do not perform broad style rewrites while fixing behavior.

4. Update distribution artifacts only when appropriate.
   - If the user expects a browser bundle or release-ready result, run `npm run build` and include `dist/nP.js`.
   - If the user asks for source-only work, leave `dist/nP.js` untouched and state that the bundle was not regenerated.

5. Verify.
   - Run `npm run build` for source changes unless doing so would violate the user's instructions about generated files.
   - Run `npm run docs:build` for documentation changes.
   - For browser-facing behavior, use a local HTML smoke test or existing page under `dev/`.
   - Capture exact command results in the final response.

6. Report clearly.
   - Summarize changed files.
   - State verification performed and any commands not run.
   - Call out remaining risks, especially lack of automated tests.

## Release And Deployment Notes

- Version is currently declared in both `package.json` and `src/np-chart/src/version.js`; keep them synchronized when performing a version bump.
- `README.md` is the main public API reference and contains many browser examples. Update it when public behavior changes.
- `npm run deploy` force-pushes the docs site to `gh-pages`; require explicit user approval before running it.

## Known Cautions

- `lineChart()` derives formatted chart data from `inputTable` without mutating caller-owned input; preserve that behavior.
- `lineTable()` includes clipboard-based PNG and TSV copy behavior; browser support and secure-context requirements can affect it.
- `nP.log()` writes HTML directly into the document. Be cautious about passing unsanitized user content.
- Matrix and nodal algorithms use custom complex arithmetic and mutable arrays. Small shape or indexing changes can affect RF results broadly.
- `cascade()` mutates its local `nPortsTable` reference while reducing. Be careful if changing it to avoid altering observable behavior unexpectedly.
