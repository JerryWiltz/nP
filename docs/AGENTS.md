# AGENTS.md
<!-- Modified: 2026-10-27 -->

Instructions for `docs/`. Follow the repository root `AGENTS.md` as well. These files are the user-facing VitePress site; `src/` is the authority for API behavior.

## Pages and assets

- Name hand-maintained public Markdown pages with lowercase kebab-case basenames; keep `index.md` and `AGENTS.md`. Name hand-maintained images in `_images/` descriptively with lowercase kebab-case basenames. Archived files, `public/` assets, and VitePress configuration are exempt.
- Before renaming a page or image, update navigation, internal links, and other active references. A page rename changes its public URL; preserve old links when needed.
- Keep `docs/_archive/` historical unless the user requests a docs-wide refresh. Do not edit generated `docs/.vitepress/dist/` output.
- For SVG circuit schematics in `docs/public/schematics/`, follow `schematics/AGENTS.md` and `schematics/svg-style-guide.md`. Keep the editable description and canonical symbols under `schematics/` and regenerate the published SVG with the composer.
- After substantive changes, run `npm run docs:build`. For browser-facing examples, verify changed runnable code and visible output when practical. Respect the root instruction not to open Chromium unless asked; code held only in a textarea does not execute on page load.

## Examples

- Prefer clear current examples over legacy combined RLC constructors. Show frequencies, named parts, explicit connections, `.out(...)`, then charts or tables. Use `nP.nodal()` when topology matters; keep `nP.cascade()` for examples teaching two-port cascades. Put each `nodal()` connection on its own line.
- Keep instructional code linear: assign intermediate results to named variables, then pass those variables to `nP` calls and `nP.log()`. Do not define helper functions inside example functions or pass inline function expressions or arrow callbacks to `nP` calls when a direct value or table will do.
- Show ideal parts as `nP.Tlin()`, `nP.Tclin()`, `nP.Tee()`, and `nP.seriesTee()`; physical microstrip parts use lowercase constructor names. Follow the port and data conventions in the root instructions.
- In browser examples, use `nP.log(...)` for page output and load the built browser bundle first. The version is `nP.version`, not a function call. Match chart axis labels and `metricPrefix` to actual table units; use `metricPrefix: 'none'` when x values already have their displayed unit.
- Legacy RLC constructors remain available for compatibility and may appear in a page about legacy behavior; do not make them the preferred pattern in new examples.

## REPL

- Runnable examples live in `.vitepress/theme/replExamples.js`; sidebar groups and ordering live in `.vitepress/config.js`.
- RF circuit examples render in the output frame with `nP.schematic(circuit)`. A simple transmitter and receiver example passes `{transmitter, circuit, receiver}` so MOD and DEMOD appear with the RF path. The separate SVG map is retained for the editable schematic inventory and other documentation pages.
- Give each example a unique stable `id`, `title`, `category`, and runnable `code`. Preserve IDs because links and the REPL session buffer use them. Move array entries to reorder examples.
- Make each example self-contained. Set analysis grids before creating dependent objects, use named parts and visible wiring, separate stages with blank lines, and display a useful result. Use the chart and table helpers' default output mount; do not add manual DOM setup just to show them.
- Verify each changed snippet in the REPL. An example calling a chart or table helper should produce visible output. Do not require SVG output from code that remains unexecuted in an editor.
