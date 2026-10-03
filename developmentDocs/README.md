<!-- Modified: 2026-10-03 -->
# nP Development Documentation

This directory contains internal engineering knowledge for developing nP. It records RF mathematics, equation-to-code translations, implementation decisions, data contracts, assumptions, units, references, and worked examples.

These documents are separate from:

- `docs/`, which contains the public VitePress documentation.
- `dev/`, which contains executable browser development and verification pages.
- `dev/raw/`, which contains unprocessed technical source material and early derivations.
- `AGENTS.md`, which contains concise, mandatory working rules for Codex and other agents.

The intended information flow is:

```text
raw research → development documentation → AGENTS rules → source code and tests
```

## Source layout

This tree lists every JavaScript file under `src/`, including all constructor files:

```text
src/
├── np-chart/
│   ├── src/
│   │   ├── lineChart.js
│   │   ├── lineTable.js
│   │   ├── log.js
│   │   ├── smithChart.js
│   │   └── version.js
│   └── index.js
├── np-diodes/
│   ├── src/
│   │   └── diode1N4148.js
│   └── index.js
├── np-global/
│   ├── src/
│   │   └── global.js
│   └── index.js
├── np-lowpass-prototype/
│   ├── src/
│   │   ├── archive/
│   │   │   └── chebyshev.js
│   │   ├── chebyLPgk.js
│   │   ├── chebyLPLCs.js
│   │   └── chebyLPNsec.js
│   └── index.js
├── np-math/
│   ├── src/
│   │   ├── complex.js
│   │   └── matrix.js
│   └── index.js
├── np-misc/
│   ├── src/
│   │   ├── getCircuitTitle.js
│   │   └── htmlSupport.js
│   └── index.js
├── np-nport/
│   ├── src/
│   │   ├── combining/
│   │   │   ├── cascade.js
│   │   │   └── nodal.js
│   │   ├── idealComponents/
│   │   │   ├── Amp.js
│   │   │   ├── Attn.js
│   │   │   ├── Load.js
│   │   │   ├── Open.js
│   │   │   ├── seriesTee.js
│   │   │   ├── Shift90.js
│   │   │   ├── Short.js
│   │   │   ├── Tclin.js
│   │   │   ├── Tee.js
│   │   │   ├── Tee4.js
│   │   │   ├── Tee5.js
│   │   │   └── Tlin.js
│   │   ├── mlin/
│   │   │   ├── constants.js
│   │   │   ├── mbend.js
│   │   │   ├── mclin.js
│   │   │   ├── mcross.js
│   │   │   ├── mlin.js
│   │   │   ├── mstep.js
│   │   │   ├── mtee.js
│   │   │   ├── mtfr.js
│   │   │   ├── mvgnd.js
│   │   │   ├── mvia.js
│   │   │   └── noise.js
│   │   ├── physicalModels/
│   │   │   └── options.js
│   │   ├── rlc/
│   │   │   ├── C.js
│   │   │   ├── L.js
│   │   │   ├── lpfGen.js
│   │   │   ├── paC.js
│   │   │   ├── paL.js
│   │   │   ├── paPaLC.js
│   │   │   ├── paPaRC.js
│   │   │   ├── paPaRL.js
│   │   │   ├── paPaRLC.js
│   │   │   ├── paR.js
│   │   │   ├── paSeLC.js
│   │   │   ├── paSeRC.js
│   │   │   ├── paSeRL.js
│   │   │   ├── paSeRLC.js
│   │   │   ├── R.js
│   │   │   ├── seC.js
│   │   │   ├── seL.js
│   │   │   ├── sePaLC.js
│   │   │   ├── sePaRC.js
│   │   │   ├── sePaRL.js
│   │   │   ├── sePaRLC.js
│   │   │   ├── seR.js
│   │   │   ├── seSeLC.js
│   │   │   ├── seSeRC.js
│   │   │   ├── seSeRL.js
│   │   │   ├── seSeRLC.js
│   │   │   ├── trf.js
│   │   │   └── trf4Port.js
│   │   ├── index.js
│   │   ├── intermod.js
│   │   ├── noiseFigure.js
│   │   └── nPort.js
│   └── index.js
├── index.js
└── plugin.js
```

`src/index.js` exports the public nP API. Each `np-*` package also has an `index.js` entry point. The package directories in the index below explain the implementation in more detail.

### `nPort` object

[`src/np-nport/src/nPort.js`](../src/np-nport/src/nPort.js) defines the `nPort()` constructor. Its instances carry frequency-aligned S-parameters and noise covariance. Combined nPorts also retain known internal amplifier intermodulation sources for reuse in later connections.

| Member | Purpose |
| --- | --- |
| `setglobal(global)`, `getglobal()` | Store and retrieve analysis settings. |
| `setspars(rows)`, `getspars()` | Store and retrieve S-parameter rows. |
| `noise` getter and setter | Read or assign the frequency-aligned noise covariance. |
| `cas(other)` | Cascade two 2-ports and return a new nPort with S-parameters, noise covariance, and known intermodulation sources. |
| `out(...selectors)` | Return a frequency table of S-parameters, covariance, NF, output noise floor, or intermodulation results. |
| `noiseOut(...selectors)` | Return a frequency table of selected covariance entries. |
| `outTable(...selectors)` | Return a frequency table of selected S-parameters. |

## Index

- [`rf-math-coding.md`](rf-math-coding.md): shared practices for translating RF mathematics into maintainable JavaScript.
- [`nport-data-model.md`](nport-data-model.md): the shapes and invariants of n-port objects and S-parameter data.
- [`nodal-analysis.md`](nodal-analysis.md): the mathematical and coding model behind arbitrary n-port interconnection.
- [`interconnection-matrix.md`](interconnection-matrix.md): an educational explanation of the \(\Gamma\) wiring matrix used by nodal analysis.
- [`mesfet-voltage-current-noise.md`](mesfet-voltage-current-noise.md): a floating MESFET voltage/current model with dependent sources, parasitics, and semiconductor-noise covariance.
- [`series-parallel-resistor-source-model.md`](series-parallel-resistor-source-model.md): one physical resistor-noise source represented as two-port waves for series and parallel topologies.
- [`kurokawa-power-waves-synopsis.md`](kurokawa-power-waves-synopsis.md): synopsis and equation-by-equation explanation of Kurokawa's power-wave and scattering-matrix paper.
- [`npm-maintenance.md`](npm-maintenance.md): maintenance and release checks for the published npm package and its Obsidian-plugin bundle.
- [`physical-model-api.md`](physical-model-api.md): canonical options, units, compatibility, validation, and metadata for physical transmission-media models.
- [`thePathOflineChart.md`](thePathOflineChart.md): the path from the nP chart source through the nPort RF Analysis Obsidian plugin.
- [`np-math/`](np-math/): complex-number, matrix, and numerical-method documentation.
- [`np-nport/`](np-nport/): n-port constructors, composition, fixtures, and port-convention documentation.
- [`microstrip/`](microstrip/): physical microstrip models, constants, equations, and references.
- [`diodes/`](diodes/): nonlinear and small-signal diode model documentation.

Add detailed explanations here and keep `AGENTS.md` focused on rules that must be applied repeatedly.
