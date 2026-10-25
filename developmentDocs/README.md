<!-- Modified: 2026-10-23 -->
# nP Development Documentation

This directory contains internal engineering knowledge for developing nP. It records RF mathematics, equation-to-code translations, implementation decisions, data contracts, assumptions, units, references, and worked examples.

Hand-maintained topic notes in this directory and its subdirectories use lower camelCase filenames, such as `chartFunctions.md` and `np-nport/constructorCatalog.md`. Keep conventional `README.md` entry points.

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

`src/index.js` exports the public nP API. Each package has an `index.js` entry point and implementation files under `src/`:

| Directory | Responsibility |
| --- | --- |
| `src/np-chart/` | Charts, tables, logging, and display helpers. |
| `src/np-digital/` | Sampled waveforms, modulation, demodulation, and receiver analysis. |
| `src/np-global/` | Analysis settings and time-grid validation. |
| `src/np-math/` | Complex numbers, matrices, FFT, and inverse FFT. |
| `src/np-misc/` | Browser utilities. |
| `src/np-nport/` | RF components, physical models, filters, noise, intermodulation, and network composition. |

`src/plugin.js` is the separate host-safe entry point. Use `rg --files src` for the current source-file list; the topic indexes below explain the implementation in more detail.

### `nPort` object

[`src/np-nport/src/nPort.js`](../src/np-nport/src/nPort.js) defines the `nPort()` constructor. Its instances carry frequency-aligned S-parameters and noise covariance. A digital transmitter adds frequency-aligned complex signal waves. Combined nPorts retain those waves and known internal amplifier intermodulation sources for reuse in later connections. `demod()` draws a fresh random waveform from the output noise density when reconstructing received samples. `bitErrorRate()` compares repeated receiver bit decisions with known transmitter bits.

| Member | Purpose |
| --- | --- |
| `setglobal(global)`, `getglobal()` | Capture and retrieve component analysis settings. |
| `setspars(rows)`, `getspars()` | Store and retrieve S-parameter rows. |
| `noise` getter and setter | Read or assign the frequency-aligned noise covariance. |
| `signal` getter and setter | Read or assign deterministic complex signal waves aligned with the S rows. |
| `cas(other)` | Cascade two 2-ports and return a new nPort with S-parameters, noise covariance, signal waves, and known intermodulation sources. |
| `out(...selectors)` | Return a frequency table of S-parameters, covariance, NF, output noise floor, or intermodulation results. |
| `noiseOut(...selectors)` | Return a frequency table of selected covariance entries. |
| `outTable(...selectors)` | Return a frequency table of selected S-parameters. |

## Index

- [`rfMathCoding.md`](rfMathCoding.md): shared practices for translating RF mathematics into maintainable JavaScript.
- [`nPortDataModel.md`](nPortDataModel.md): the shapes and invariants of n-port objects and S-parameter data.
- [`modDemod.md`](modDemod.md): implemented and proposed modulation modes, transmitter frequency lists, signal attachment, and demodulation.
- [`nodalAnalysis.md`](nodalAnalysis.md): the mathematical and coding model behind arbitrary n-port interconnection.
- [`interconnectionMatrix.md`](interconnectionMatrix.md): an educational explanation of the \(\Gamma\) wiring matrix used by nodal analysis.
- [`guptaConnectionScattering.md`](guptaConnectionScattering.md): shared linear-wave derivation used by the noise and intermodulation worked notes.
- [`dependentSourcesAndMesfet.md`](dependentSourcesAndMesfet.md): controlled-source vocabulary and the proposed MESFET implementation boundary.
- [`mesfetVoltageCurrentNoise.md`](mesfetVoltageCurrentNoise.md): detailed floating three-terminal MESFET equations, parasitics, and semiconductor-noise covariance.
- [`seriesParallelResistorSourceModel.md`](seriesParallelResistorSourceModel.md): one physical resistor-noise source represented as two-port waves for series and parallel topologies.
- [`kurokawaPowerWavesSynopsis.md`](kurokawaPowerWavesSynopsis.md): synopsis and equation-by-equation explanation of Kurokawa's power-wave and scattering-matrix paper.
- [`npmMaintenance.md`](npmMaintenance.md): maintenance and release checks for the published npm package and its Obsidian-plugin bundle.
- [`physicalModelApi.md`](physicalModelApi.md): canonical options, units, compatibility, validation, and metadata for physical transmission-media models.
- [`chartFunctions.md`](chartFunctions.md): inputs, options, defaults, and return values for `lineChart()`, `lineTable()`, and `smithChart()`.
- [`lineChartPath.md`](lineChartPath.md): the path from the nP chart source through the nPort RF Analysis Obsidian plugin.
- [`np-math/`](np-math/): complex-number, matrix, and numerical-method documentation.
- [`np-nport/`](np-nport/): n-port constructors, composition, fixtures, and port-convention documentation.
- [`microstrip/`](microstrip/): physical microstrip models, constants, equations, and references.
- [`diodes/`](diodes/): nonlinear and small-signal diode model documentation.

Add detailed explanations here and keep `AGENTS.md` focused on rules that must be applied repeatedly.
