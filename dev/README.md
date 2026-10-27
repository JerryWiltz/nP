<!-- Modified: 2026-10-27 -->
# Development pages

The HTML files in this directory are executable browser harnesses that load
`../dist/nP.js`. Library behavior is defined under `src/`; the Markdown files
explain the analysis and record worked examples. Rebuild the bundle after
source changes, then keep a changed harness and its companion note aligned.

| Harness | Focus | Companion note |
| --- | --- | --- |
| `canonicalSymbols.html` | All 58 canonical SVG symbols in Guide API order | — |
| `chartDefaults.html` | Built-in line chart, line table, and Smith chart defaults | — |
| `diode.html` | 1N4148 RF S-parameters and DC I-V | `diode.md` |
| `edgeCoupledFilter.html` | Coupled-line filter with amplifier cascade | — |
| `intermodAnalysis.html` | Two-tone amplifier then attenuator sweep: IP3 from nodal and cascade | `intermodAnalysis.md` |
| `manchester.html` | Manchester PSK transmit, cascade, and demodulation example | — |
| `matrix.html` | Real and complex matrix operations | `matrix.md` |
| `microstrip.html` | Microstrip line, coupled line, tee, divider, and thin-film resistor | `microstrip.md` |
| `nodal.html` | Series and parallel nodal connections | `nodal.md` |
| `noiseAnalysis.html` | Three amplifier constructor forms compared through nodal and cascade NF and output noise floor | `noiseAnalysis.md` |
| `schematic.html` | Runtime Wilkinson power divider schematic and S-parameter response | — |
| `seriesTee.html` | Series tee regression harness | — |
| `timeDomain.html` | ASCII BER comparison and clocked PN7 through an attenuator and `demod()` | `timeDomain.md` |
| `visualization.html` | Line chart, line table, and Smith chart smoke harness | `visualization.md` |
| `watkinsJohnsonAmplifierExamples.html` | Cascaded amplifier gain and noise examples from application data | — |

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
`.html` and `.md` files share a basename. The
conventional `README.md` and `AGENTS.md` names and the separate `dev/raw/`
rules are exceptions. `npm run dev:new -- pageName [divId ...]` uses the page
name exactly as given.
