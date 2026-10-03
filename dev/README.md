<!-- Modified: 2026-10-03 -->
# Development pages

The HTML files in this directory are executable browser harnesses that load
`../dist/nP.js`. Library behavior is defined under `src/`; the Markdown files
explain the analysis and record worked examples. Rebuild the bundle after
source changes, then keep a changed harness and its companion note aligned.

| Harness | Focus | Companion notes |
| --- | --- | --- |
| `diodeDevelopment.html` | 1N4148 RF S-parameters and DC I-V | `diodeDevelopment.md` |
| `matrixDevelopment.html` | Real and complex matrix operations | `matrixDevelopment.md` |
| `nodalDevelopment.html` | Series and parallel nodal connections | `nodalDevelopment.md` |
| [noiseAnalysis.html](noiseAnalysis.html) | Three amplifier constructor forms compared through nodal and cascade NF | [noiseAnalysis.md](noiseAnalysis.md) |
| [intermodAnalysis.html](intermodAnalysis.html) | Two-tone amplifier then attenuator sweep: IP3, NF, and output noise floor from nodal and cascade | [intermodAnalysis.md](intermodAnalysis.md) |
| `seriesTeeDevelopment.html` | Series tee regression harness | — |
| `microstripDevelopment.html` | Microstrip line, coupled line, tee, divider, and thin-film resistor | `mlinDevelopment.md`, `mclinDevelopment.md`, `mteeDevelopment.md`, `mteePowerDividerDevelopment.md`, `mtfrDevelopment.md` |
| `visualizationDevelopment.html` | Line chart, line table, and Smith chart smoke harness | `lineChartDevelopment.md`, `lineTableDevelopment.md`, `smithChartDevelopment.md` |

Run the browser smoke check with:

```text
npm run dev:smoke
```

The check opens every `dev/*.html` page, reports page and console errors, and
checks SVG output on its configured chart pages. `intermodAnalysis.html` uses
`nP.global.twoTone` before component construction and passes `.out()` tables
directly to charts and tables; its `noiseFloor` output is in dBm/Hz.

Raw papers, downloaded references, and equation notes belong under `dev/raw/`.
Repository-wide release and packaging plans belong under `developmentDocs/`.
