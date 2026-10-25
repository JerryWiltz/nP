# AGENTS.md
<!-- Modified: 2026-10-25 -->

Instructions for `/home/jerrywiltz/cad-development/nP`. Read this file and any `AGENTS.md` in the directory being changed. Use current source and tests for API behavior; keep detailed engineering explanations in `developmentDocs/`.

## Repo shorthands

Treat these as user-message shorthands when they reach the agent as text; they are not built-in Codex CLI commands. The `--` prefix avoids the CLI's `/` command menu.

- `--man`: List the repo shorthands in this section.
- `--stop`: Do not change any files until the user sends `--start`. Read-only inspection and discussion may continue.
- `--start`: Resume work on changes the user has requested. This does not authorize a commit, push, or deployment.
- `--screen`: Find and open the latest screenshot in `/mnt/chromeos/MyFiles/Downloads`, then report what it shows.
- `--svg <name>`: Find the intended canonical SVG under `schematics/symbols/`, allowing for misspellings and capitalization differences. Report the resolved path and show its full SVG source. If multiple symbols remain plausible, list the candidates and ask which one the user means.

## Before working

- Confirm the repository root with `git rev-parse --show-toplevel`, inspect `git status --short` and recent commits, and preserve existing changes.
- Before writing, verify each target is inside the current root. Prefer relative paths. Report and validate any absolute write target. Do not create missing parent directories for an absolute target without approval.
- `/home/jerrywiltz/nP` is a former, non-writable repo path. Check `/home/jerrywiltz/workspace-admin/logs/maintenance-log.md` when a former path is involved; never recreate it.
- ChromeOS downloads are under `/mnt/chromeos/MyFiles/Downloads` and may not appear under `~/Downloads`.
- Do not open Chromium unless the user asks. For browser checks, use another browser when suitable or report what remains visually unverified.

## Project map and workflow

- `src/index.js` exports nP. Subpackage entry points are `src/np-*/index.js`; Rollup produces the tracked bundles in `dist/`.
- `src/np-nport/` owns RF components and networks; `src/np-math/` owns complex, matrix, and FFT math; `src/np-digital/` owns waveform, mod, and demod; `src/np-global/` owns analysis settings; `src/np-chart/` owns charts and tables; `src/np-misc/` owns browser helpers.
- RF examples should show this order: set frequencies, create components, combine them, call `.out(...)`, then plot or tabulate. Use `nP.nodal()` for arbitrary multiport wiring and `cas()` or `nP.cascade()` for two-port cascades.
- Set `global.fList` before ordinary RF components. Components may accept an options-level `fList`; all components in one network need matching frequency rows. Digital examples set the required time or frequency grid before `mod()` and create dependent components afterward.
- Preserve public exports and aliases unless the user requests a breaking change. Update consumers, examples, tests, and `developmentDocs/np-nport/constructorCatalog.md` when changing an n-port constructor, method, public math helper, or low-pass prototype generator.

## Data contracts

- `complex()` objects expose numeric `.x` and `.y`. `setR()` and `setI()` mutate and return `this`; arithmetic returns new objects. Some logging code checks `constructor.name === 'Complex'`.
- `matrix()` objects expose `.m`. Use numeric methods for numeric entries and `Cplx` methods for complex entries. Inversion and Gaussian solving return new objects without mutating caller-owned data; nodal analysis depends on complex matrix inversion.
- An `nPort` has `.spars` rows shaped `[frequency, s11, s12, s21, s22, ...]`, with complex S entries and a square port count. Preserve `.global` and frequency-aligned `.noise` covariance. Active models supply their own noise; passive fallback uses component temperature.
- `nPort.out(...)` returns a header row followed by numeric rows suitable for `lineChart()` and `lineTable()`. `noiseFloor` means output port 2 from input port 1 in dBm/Hz. Combined n-ports retain compatible noise, signal, and known intermodulation data.
- Chart helpers must not mutate caller-owned tables. Preserve common options and compatibility aliases unless the user requests an API migration.

## RF conventions

- Ideal constructors use uppercase-first names such as `Tlin()`, `Tclin()`, `Tee()`, `Short()`, and `Open()`. Physical microstrip constructors use lowercase names such as `mlin()` and `mclin()`. Ideal source filenames match public constructor names.
- `Tee()` port 1 is the common/shunt branch. A shunt branch runs from that port through its component to `Short()`. `seriesTee()` inserts a one-port as a floating series branch. Name electrical parts `r1`, `l1`, `c1`, etc., and put each `nodal()` connection on its own line.
- Coupled-line ports are clockwise from upper left: 1 upper left, 2 upper right, 3 lower right, 4 lower left. From port 1, port 2 is through, port 4 coupled, and port 3 isolated.
- Reuse constants from `src/np-nport/src/physicalConstants.js`. Physical-model options use canonical lower-camel-case SI names; `resistivity` is absolute ohm-meters. Preserve documented aliases, reject conflicting or unknown properties, and keep `.physicalModel` metadata. See `developmentDocs/physicalModelApi.md`.
- Preserve diode RF and DC behavior together. Biased diode models need their own noise covariance and weak nonlinear source model; see the diode-directory instructions.

## Naming and editing

- Match nearby ES-module style, including extensionless relative imports. Public constructor filenames match exported function names. Use lowercase kebab-case `.test.js` names under `test/`, lowercase kebab-case script names under `scripts/`, and lower-camel-case topic names under `developmentDocs/`.
- In library code, prefer a named module-level helper over defining a function inside another function when the helper can stand on its own. Keep a local function only when it materially improves clarity or needs the enclosing state.
- Correct spelling in files otherwise being edited; preserve established API names and names such as Hammerstad/Jensen and Chebyshev. Update all active references when renaming a file.
- Add or update `Modified: YYYY-MM-DD` near the top of each intentionally edited hand-maintained file, using its native comment syntax. Do not add dates to generated output or edit files solely to update a date.
- Make minimal local edits. Do not overwrite unrelated user work or perform broad formatting changes.

## Parallel agent work

- For substantial work that the user asks to parallelize, use one lead agent for API decisions, integration, shared exports, generated bundles, and final verification.
- Divide independent work by area: RF circuits in `src/np-nport/`; signals and math in `src/np-digital/` and `src/np-math/`; presentation in `src/np-chart/`, REPL examples, and docs.
- Agree on public names and data shapes before parallel edits. Avoid simultaneous edits to the same file. Keep small or tightly coupled tasks with one agent.

## Build, verification, and deployment

- `npm test` runs Node tests. `npm run build` updates tracked browser, ESM, and CommonJS bundles after exported source changes. `npm run build:plugin` updates the separately maintained plugin bundle only when needed.
- `npm run docs:build` verifies documentation. `docs/.vitepress/dist/` is generated and ignored; do not add it to the source branch. `npm run docs:dev` is the user's local viewer.
- Use the narrowest meaningful test. For chart or DOM changes, check a browser harness under `dev/` when visual behavior matters, respecting the Chromium preference above. For RF/math changes, compare known values. For docs examples, verify changed runnable snippets.
- The browser bundle is tracked in `dist/` and copied to `docs/public/nP.js` for the REPL. Keep them aligned when browser behavior changes. Do not rebuild generated files when the user requests source-only changes.
- `npm run deploy` builds and force-pushes `gh-pages`; run it only with user authorization. Keep `package.json` and `src/np-chart/src/version.js` synchronized for version bumps.
- Do not commit `node_modules/`, browser binaries, logs, temporary verification pages, or generated docs output. `dev/` harnesses are tracked manual test pages, not library source.
