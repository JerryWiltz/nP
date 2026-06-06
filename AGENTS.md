# AGENTS.md

Repository guide for agents working in the `nP` repo.

## Scope

These instructions apply to the entire repository rooted at `/home/jerrywiltz/nP`.

## Local Environment

- The user is working from an Acer Chromebook Plus 515.
- The Linux home directory may not contain a normal `~/Downloads` folder.
- The ChromeOS Downloads folder is visible from the Linux container at `/mnt/chromeos/MyFiles/Downloads`.
- When the user refers to downloaded files, check `/mnt/chromeos/MyFiles/Downloads` first before assuming the files are unavailable.

## Project Summary

`nP` is a browser-oriented JavaScript library for microwave/RF circuit analysis and visualization. The public API is exported from `src/index.js`, bundled by Rollup into `dist/nP.js`, and exposed as the global `nP` in browser usage.

Primary domains:

- RF n-port analysis, S-parameters, cascading, nodal interconnection, RLC components, transmission lines, microstrip helpers, and ideal fixtures in `src/np-nport`.
- Complex arithmetic and matrix solving in `src/np-math`.
- Global analysis settings such as frequency list, reference impedance, and temperature in `src/np-global`.
- Chebyshev low-pass prototype helpers in `src/np-lowpass-prototype`.
- D3-based chart and table rendering in `src/np-chart`; `smithChart()` currently exists as a placeholder copy of `lineChart()` for future Smith chart development.
- Browser helper utilities in `src/np-misc`.
- User documentation in `README.md` and `docs/index.md`.

## Repository Layout

- `src/index.js`: root public module entry point. Re-exports the subpackages.
- `src/np-*/index.js`: subpackage entry points.
- `src/np-*/src/*.js`: implementation files.
- `dist/nP.js`: generated UMD browser bundle. It is versioned in this repo, so update it only when intentionally rebuilding for release or distribution.
- `rollup.config.js`: root bundle config. Input is `src/index.js`; output is `dist/nP.js`; bundle name is `nP`.
- `package.json`: root scripts and dev dependencies.
- `docs/`: VitePress documentation.
- `scripts/deploy.sh`: builds docs and force-pushes `docs/.vitepress/dist` to `gh-pages`.
- `scripts/extensionless-loader.mjs`: test-only Node loader for the repo's extensionless relative imports.
- `test/`: Node tests for math, global settings, and nPort behavior.
- `dev/`: local browser development and verification pages. These files are manual harnesses, not source of truth.
  - `dev/lineChartDevelopment.html`, `dev/lineTableDevelopment.html`, and `dev/smithChartDevelopment.html` load `../dist/nP.js` and exercise the built chart/table APIs.
  - `dev/nPortBuildVerify.html` verifies the local built bundle.
  - `dev/nPortVersionVerify.html` currently uses CDN scripts.

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

The test command uses `scripts/extensionless-loader.mjs` so Node can run source files with the repo's existing extensionless import style.

## Coding Style

- The codebase uses ES modules.
- Existing implementation style is mostly function constructors, prototype methods, `var`, and semicolon-heavy JavaScript. Prefer matching nearby style when editing existing modules.
- Keep imports extensionless, matching existing files.
- Preserve the public API exported from `src/index.js` and subpackage indexes unless the user explicitly requests a breaking change.
- Many functions depend on the shared mutable `global` object from `src/np-global/src/global.js`. Be careful with changes that affect `global.fList`, `global.Ro`, or object-level `setglobal/getglobal` behavior.
- S-parameter rows are represented as `[frequency, s11, s12, s21, s22, ...]`, where complex entries are `complex()` objects.
- `nPort.out()` returns a table with a header row followed by numeric data rows. `lineChart()` and `lineTable()` consume this table shape.
- `lineChart()`, `smithChart()`, and `lineTable()` share common option names where possible: `inputTable`, `mount`, `title`, `containerId`, `svgId`, `metricPrefix`, `fontFamily`, `fontSize`, `containerFontSizePx`, and `pngBackground`. Keep older aliases such as `chartTitle`, `tableTitle`, and `headColor` working unless the user explicitly requests a breaking cleanup.
- Browser rendering code in `src/np-chart` and `src/np-misc` assumes `document`, `window`, and sometimes clipboard APIs. Do not make those modules server-only without preserving browser behavior.
- Do not add large dependencies unless they are clearly justified. Current root dev dependencies are Rollup, D3, VitePress, and the Rollup node resolver plugin.

## Generated And Dirty Files

- Check `git status --short` before editing. This repo may contain user changes.
- Do not revert, reformat, or overwrite user changes unless explicitly requested.
- `dist/nP.js` is generated but tracked. Only modify it when a source change should be reflected in the distributable bundle.
- Avoid running `npm run build` when the user asked for source-only edits or asked not to change generated files.
- `node_modules/`, logs, docs build output, `.aider*`, and temporary `*Verify.html` files are ignored.
- `dev/` is not currently ignored. Tracked dev harnesses under `dev/` are intentionally kept; treat them as local manual test harnesses unless the user decides to publish examples from them.

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
5. If build or docs commands cannot run because dependencies are missing, report that clearly and do not silently skip verification.

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
- `lineTable()` includes clipboard-based PNG and CSV copy behavior; browser support and secure-context requirements can affect it.
- `nP.log()` writes HTML directly into the document. Be cautious about passing unsanitized user content.
- Matrix and nodal algorithms use custom complex arithmetic and mutable arrays. Small shape or indexing changes can affect RF results broadly.
- `cascade()` mutates its local `nPortsTable` reference while reducing. Be careful if changing it to avoid altering observable behavior unexpectedly.
