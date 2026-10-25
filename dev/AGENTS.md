# AGENTS.md
<!-- Modified: 2026-10-23 -->

Instructions for `dev/`. Follow the repository root `AGENTS.md` as well. These are tracked manual browser harnesses, not the source of library behavior. See `dev/README.md` for their purposes and `dev/raw/AGENTS.md` for raw research files.

## Harnesses

- Name top-level hand-maintained HTML harnesses and Markdown notes with lower-camel-case basenames; keep conventional `README.md` and `AGENTS.md`. Give a harness and companion note the same basename.
- Load `../dist/nP.js`. Put reusable behavior in `src/` and rebuild the browser bundle when source changes must appear in a harness.
- Use `npm run dev:new -- pageName [divId ...]` for a new harness. Keep pages small enough to inspect, use clear mount IDs, and put each `nP.nodal(...)` connection on its own line.
- Keep the RF workflow visible: set frequencies, create named parts, combine them, extract `.out(...)` tables, then display them. For digital examples, set the required grid before `mod()`, create dependent components afterward, and attach the transmitter to the circuit. See `developmentDocs/modDemod.md` for signal details.
- Keep harness examples linear: assign intermediate results to named variables before `nP` calls or `nP.log()`. Avoid nested helper functions and inline callbacks in instructional code when direct values or tables suffice.
- For two-tone examples, set `nP.global.twoTone` before building components. Reuse a single `.out(...)` table for a chart and matching table when appropriate.
- Use canonical SI physical-model options and shared physical constants. Keep `mtee()` defaults aligned with `mlin()` unless intentionally changing the model.
- Match chart labels and `metricPrefix` to the data. Use `backgroundColor: 'white'` when copied PNGs need an opaque background.

## Verification

- Run the narrowest relevant harness or `npm run dev:smoke` for broader checks. For visual changes, use a browser check when practical, respecting the root instruction not to open Chromium unless asked.
- Keep companion notes aligned with any changed harness. Preserve the file date convention from the root instructions.
