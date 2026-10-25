<!-- Modified: 2026-10-24 -->
# Development pages

The HTML files in this directory are executable browser harnesses that load
`../dist/nP.js`. Library behavior is defined under `src/`; the Markdown files
explain the analysis and record worked examples. Rebuild the bundle after
source changes, then keep a changed harness and its companion note aligned.

| Harness | Focus | Companion note |
| --- | --- | --- |
| `canonicalSymbolsDevelopment.html` | All 57 canonical SVG symbols in Guide API order | — |
| `chartDefaultsDevelopment.html` | Built-in line chart, line table, and Smith chart defaults | — |
| `diodeDevelopment.html` | 1N4148 RF S-parameters and DC I-V | `diodeDevelopment.md` |
| `edgeCoupledFilter.html` | Coupled-line filter with amplifier cascade | — |
| `intermodAnalysis.html` | Two-tone amplifier then attenuator sweep: IP3 from nodal and cascade | `intermodAnalysis.md` |
| `manchesterDevelopment.html` | Manchester PSK transmit, cascade, and demodulation example | — |
| `matrixDevelopment.html` | Real and complex matrix operations | `matrixDevelopment.md` |
| `microstripDevelopment.html` | Microstrip line, coupled line, tee, divider, and thin-film resistor | `microstripDevelopment.md` |
| `nodalDevelopment.html` | Series and parallel nodal connections | `nodalDevelopment.md` |
| `noiseAnalysis.html` | Three amplifier constructor forms compared through nodal and cascade NF and output noise floor | `noiseAnalysis.md` |
| `seriesTeeDevelopment.html` | Series tee regression harness | — |
| `timeDomainDevelopment.html` | ASCII BER comparison and clocked PN7 through an attenuator and `demod()` | `timeDomainDevelopment.md` |
| `visualizationDevelopment.html` | Line chart, line table, and Smith chart smoke harness | `visualizationDevelopment.md` |
| `watkinsJohnsonAmplifierExamplesDevelopment.html` | Cascaded amplifier gain and noise examples from application data | — |

The diode, matrix, nodal, and visualization notes mirror their harness scripts. The time-domain note contains the PN7 signal setup; its harness adds logging and plots. The microstrip note keeps equivalent standalone examples with different chart mount IDs. The noise and intermodulation notes are worked derivations with different example settings from their harnesses; they share the [Gupta connection-scattering derivation](../developmentDocs/guptaConnectionScattering.md).

Run the browser smoke check with:

```text
npm run dev:smoke
```

The check opens every `dev/*.html` page, reports page and console errors, and
checks SVG output on its configured chart pages. `intermodAnalysis.html` uses
`nP.global.twoTone` before component construction and passes `.out()` tables
directly to charts and tables. `noiseAnalysis.html` displays `noiseFloor` in dBm/Hz.

Raw papers, downloaded references, and equation notes belong under `dev/raw/`.
Repository-wide release and packaging plans belong under `developmentDocs/`.

Name top-level harnesses and notes with lower camelCase basenames. Companion
`.html` and `.md` files share a basename; `Development` is optional. The
conventional `README.md` and `AGENTS.md` names and the separate `dev/raw/`
rules are exceptions. `npm run dev:new -- pageName [divId ...]` uses the page
name exactly as given.
