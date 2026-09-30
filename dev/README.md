<!-- Modified: 2026-09-30 -->
# Development pages

The HTML files in this directory are the executable browser harnesses. They
load `../dist/nP.js` and are the source of truth for runnable examples. The
Markdown files are companion notes for explanation and short `npjs` excerpts;
when a circuit definition changes, update the HTML harness first and then keep
the note aligned.

| Harness | Focus | Companion notes |
| --- | --- | --- |
| `diodeDevelopment.html` | 1N4148 RF S-parameters and DC I-V | `diodeDevelopment.md` |
| `matrixDevelopment.html` | Real and complex matrix operations | `matrixDevelopment.md` |
| `nodalDevelopment.html` | Series and parallel nodal connections | `nodalDevelopment.md` |
| `noiseAnalysis.html` | Gupta connection-scattering and noise covariance work | `noiseAnalysis.md` |
| `intermodAnalysis.html` | Gupta six-variable weakly nonlinear two-tone example | `intermodAnalysis.md` |
| `seriesTeeDevelopment.html` | Series tee regression harness | — |
| `microstripDevelopment.html` | Microstrip line, coupled line, tee, divider, and thin-film resistor | `mlinDevelopment.md`, `mclinDevelopment.md`, `mteeDevelopment.md`, `mteePowerDividerDevelopment.md`, `mtfrDevelopment.md` |
| `visualizationDevelopment.html` | Line chart, line table, and Smith chart smoke harness | `lineChartDevelopment.md`, `lineTableDevelopment.md`, `smithChartDevelopment.md` |

Run the browser smoke check with:

```text
npm run dev:smoke
```

The check opens every `dev/*.html` page, reports page errors and console
errors, and verifies that chart pages render at least one SVG.

Raw papers, downloaded references, and equation notes belong under `dev/raw/`.
Repository-wide release and packaging plans belong under `developmentDocs/`.
