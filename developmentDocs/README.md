<!-- Modified: 2026-11-21 -->
# nP Development Documentation

This directory contains internal engineering knowledge for developing nP. It records RF mathematics, equation-to-code translations, implementation decisions, data contracts, assumptions, units, references, and worked examples.

Hand-maintained topic notes in this directory and its subdirectories use lower camelCase filenames, such as `chartFunctions.md` and `components/constructorCatalog.md`. Keep conventional `README.md` entry points.

These documents are separate from:

- `docs/`, which contains the public VitePress documentation.
- `dev/`, which contains executable browser development and verification pages.
- `dev/raw/`, which contains unprocessed technical source material and early derivations.
- `AGENTS.md`, which contains concise, mandatory working rules for Codex and other agents.

The intended information flow is:

```text
raw research → development documentation → AGENTS rules → source code and tests
```

## Topics

| Directory | Contents |
| --- | --- |
| [Analysis](analysis/README.md) | DC/RF solvers, power waves, interconnections, noise theory and mathematical methods. |
| [Components](components/README.md) | nPort contracts, constructor catalog, DC coverage and passive physical models. |
| [Semiconductors](semiconductors/README.md) | Device equations, parameter sources, noise, nonlinear approximations and accuracy audits. |
| [Schematics](schematics/README.md) | Drawing language, circuit shapes, layout architecture and rendering. |
| [Signals](signals/README.md) | Modulation, demodulation, waveform grids and time-domain analysis. |
| [Charts](charts/README.md) | Plotting, tables and display options. |
| [Distribution](distribution/README.md) | npm packaging, restricted plugin bundles and Obsidian integration. |
| [Planning](planning/README.md) | Proposed capabilities, implementation plans and remaining work. |

## Starting points

- [Constructor catalog](components/constructorCatalog.md): public API signatures and defaults.
- [Semiconductor sources of truth](semiconductors/semiconductorSources.md): equation, parameter and validation provenance.
- [DC analysis](analysis/dcAnalysis.md): shared network bias solving and RF handoff.
- [Device and circuit-shape to-do list](planning/deviceModelsAndCircuitShapesTodo.md): implementation status and next work.

Keep detailed notes in the matching topic folder and link them from its README. Keep the root as the navigation entry point.
