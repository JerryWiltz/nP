<!-- Modified: 2026-11-07 -->
# Development pages

The HTML files in this directory are executable browser harnesses. Top-level
pages load `../dist/nP.js`; individual shape pages under `shapes/` load
`../../dist/nP.js`. Library behavior is defined under `src/`; the Markdown
files explain the analysis and record worked examples. Rebuild the bundle
after source changes, then keep a changed harness and its companion note
aligned.

| Harness | Focus | Companion note |
| --- | --- | --- |
| `canonicalSymbols.html` | All 60 canonical SVG symbols in Guide API order | — |
| `chartDefaults.html` | Built-in line chart, line table, and Smith chart defaults | — |
| `diode.html` | 1N4148 RF S-parameters and DC I-V | `diode.md` |
| `edgeCoupledFilter.html` | Coupled-line filter with amplifier cascade | — |
| `intermodAnalysis.html` | Two-tone amplifier then attenuator sweep: IP3 from nodal and cascade | `intermodAnalysis.md` |
| `manchester.html` | Manchester PSK transmit, cascade, and demodulation example | — |
| `matrix.html` | Real and complex matrix operations | `matrix.md` |
| `microstrip.html` | Microstrip line, coupled line, tee, divider, and thin-film resistor | `microstrip.md` |
| `nodal.html` | Series and parallel nodal connections | `nodal.md` |
| `noiseAnalysis.html` | Three amplifier constructor forms compared through nodal and cascade NF and output noise floor | `noiseAnalysis.md` |
| `schematic.html` | Guided and network-only schematics for 32 direct and stress circuits | `schematic.md` |
| `seriesTee.html` | Series tee regression harness | — |
| `timeDomain.html` | ASCII BER comparison and clocked PN7 through an attenuator and `demod()` | `timeDomain.md` |
| `trf5Port.html` | nP hybrid power divider built from `trf()`, `trfAuto()`, Tees, and a 100 Ω isolation resistor | `trf5Port.md` |
| `visualization.html` | Line chart, line table, and Smith chart smoke harness | `visualization.md` |
| `watkinsJohnsonAmplifierExamples.html` | Cascaded amplifier gain and noise examples from application data | — |

Individual schematic-shape harnesses live in `shapes/`:

| Harness | Focus | Companion note |
| --- | --- | --- |
| `shapes/branchline.html` | One-cell, multi-cell, and microstrip `branchline` layouts | `shapes/branchline.md` |
| `shapes/bridgedT.html` | Upper bridges, downward shunts, variable component counts, Tee4 junctions and microstrip parts | `shapes/bridgedT.md` |
| `shapes/edgeCoupledFilter.html` | Ideal/microstrip staircases, vertical flip, variable section counts and actual terminations | `shapes/edgeCoupledFilter.md` |
| `shapes/series.html` | `series` guidance for two-port chains, bends, and nested networks | `shapes/series.md` |
| `shapes/ladder.html` | `ladder` guidance for ideal and microstrip line networks | `shapes/ladder.md` |
| `shapes/powerDivider.html` | Wilkinson variants and a divider/combiner/ladder in one nodal network with three guided shapes | `shapes/powerDivider.md` |
| `shapes/powerCombiner.html` | Reflected transformer and Wilkinson boards, microstrip symbols and variable arm lengths | `shapes/powerCombiner.md` |
| `shapes/splitRejoin.html` | Network-only parallel paths with tee junctions | `shapes/splitRejoin.md` |

The diode, matrix, nodal, and visualization notes mirror their harness scripts. The time-domain note contains the PN7 signal setup; its harness adds logging and plots. The microstrip note keeps equivalent standalone examples with different chart mount IDs. The noise and intermodulation notes are worked derivations with different example settings from their harnesses; they share the [Gupta connection-scattering derivation](../developmentDocs/guptaConnectionScattering.md).

Run the browser smoke check with:

```text
npm run dev:smoke
```

The check opens every top-level `dev/*.html` page and every `dev/shapes/*.html`
page, reports page and console errors, and checks SVG output on its configured
chart pages. `intermodAnalysis.html` uses
`nP.global.twoTone` before component construction and passes `.out()` tables
directly to charts and tables. `noiseAnalysis.html` displays `noiseFloor` in dBm/Hz.

Raw papers, downloaded references, and equation notes belong under `dev/raw/`.
Repository-wide release and packaging plans belong under `developmentDocs/`.

Name harnesses and notes with lower camelCase basenames. Companion `.html`
and `.md` files share a basename. Individual shape pages belong under
`dev/shapes/`; the combined showcase stays at `dev/schematic.html`. The
conventional `README.md` and `AGENTS.md` names and the separate `dev/raw/`
rules are exceptions. `npm run dev:new -- pageName [divId ...]` uses the page
name exactly as given.
