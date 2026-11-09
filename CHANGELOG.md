<!-- Modified: 2026-11-09 -->
# Changelog

## 0.49.0 — 2026-11-09

Release notes for `v0.49.0`. These changes are relative to the published npm package `@jerrywiltz/np@0.0.48`, whose recorded Git commit is `d0776c74063f2168d84763006200e844f2f9e6b2` (September 6, 2026).

### Highlights

- **Draw the circuit you analyze.** `nP.schematic(network)` renders SVG schematics from components, cascades, and nodal networks. Supported engineering shapes, automatic whole-network detection, and groups beside the nodal connections help produce familiar layouts. Drawings include node labels, configurable dots, **Copy as png**, and **Fit drawing** controls.
- **Analyze signals in time and frequency.** `global.tList` and `tGen()` establish sample times in seconds. `waveform()`, `FFT()`, and `invFFT()` provide a waveform → spectrum → reconstruction workflow, with chart-ready `.out(...)` tables and RMS dBV spectra for real voltage samples.
- **Send signals through RF networks.** `mod()`, `demod()`, `PN()`, and `bitErrorRate()` support sampled digital experiments. Modulation modes include OOK, ASK, FSK, PSK/DPSK, QPSK, QAM, MSK/GMSK, and OFDM, alongside analog AM, FM, PM, SSB, and DSB-SC analysis.
- **Explore VNA measurements.** Separate `VNA-frequency` and `VNA-time` modes support three-receiver S-parameter measurements and synthesized impulse responses. Examples measure a 5 nH inductor and locate open/short faults on a 1 km cable, including a speed-of-light transit-time check.
- **Follow noise and distortion through a circuit.** Networks retain noise covariance and known weak nonlinear sources. Output selectors expose noise figure, output noise density, two-tone products, and intercept estimates.

See the [illustrated What's new page](https://github.com/JerryWiltz/nP/blob/master/docs/whats-new-0-49-0.md) for schematics, plots, and runnable REPL links. The [GitHub Pages site](https://jerrywiltz.github.io/nP/) hosts the Guide, engineering Tech Notes, and REPL; its deployment is separate from npm publication.

### RF, math, and presentation

- Added `Amp()`, `Attn()`, `Thru()`, `Coupler180()`, and the ideal three-port autotransformer `trfAuto()`.
- Extended diode modeling with DC inspection and bias-dependent RF, noise, and weak-signal distortion behavior.
- Added independent analysis contexts through `nP.global()`, while preserving property access such as `nP.global.fList`.
- Added bar plots and automatic padding for linear chart y axes. Narrow REPL output retains readable chart dimensions with horizontal scrolling.
- Improved matrix solving and inversion so those operations return new matrices without changing caller-owned data.
- Expanded the Guide, engineering Tech Notes, and REPL. The circuit examples now show runtime-generated SVG schematics and responses; four separate low-pass examples teach `.cas()`, `cascade()`, `nodal()`, and `lpfGen()`.

### Compatibility and migration

- The version changes from **`0.0.48` to `0.49.0`**. This is the intended version number, rather than `0.0.49`.
- The current build adds 13 public export names and retains every export name from the published `0.0.48` bundle. Review the behavior and setup requirements below when adopting the new APIs.
- Existing flat `nodal()` connection rows and two-port cascade calls remain supported. Shape groups are optional drawing guidance. Automatic detection does not yet decompose every ungrouped network into multiple shapes; complex layouts may need explicit groups. Generic fallback drawings can be less familiar, and composition-level crossover routing remains limited.
- Set analysis grids before constructing dependent objects. Public `FFT()` needs a uniformly spaced `tList` matching its sample count and replaces the selected `fList` with signed FFT bin frequencies. Sampled `mod()` modes also need a matching `tList`. Build dependent RF components after the transmitter establishes its analysis frequencies.
- `VNA-frequency` uses an `fList`; `VNA-time` uses a power-of-two `tList` starting at zero. Use those explicit mode names.
- Custom waveform points require `shape: 'custom'`; omitting `shape` otherwise selects a triangle. Use FFT `.out('dBV')` for real voltage samples; its default display floor is −80 dBV. Pass the complete complex FFT result to `invFFT()`, rather than a magnitude or dBV table.
- `nP.global` is now callable. Ordinary property access remains supported; code that tests its JavaScript type should account for the function interface. Saved contexts can be reselected with `nP.global(context)`.
- The low-pass prototype helpers and diode constructor remain available through the main nP exports after source-directory consolidation. The older combined RLC constructors remain available as well.
- The Obsidian plugin is released from its own repository. This nP release does not automatically update an installed plugin; its pinned nP bundle must be updated and tested there separately.

For usage details, see [Schematics](https://jerrywiltz.github.io/nP/schematics.html), [Global settings](https://jerrywiltz.github.io/nP/global-settings.html), [Digital signals](https://jerrywiltz.github.io/nP/digital-signals.html), [Noise](https://jerrywiltz.github.io/nP/noise.html), and [Intermodulation](https://jerrywiltz.github.io/nP/intermodulation.html).

## 0.0.48

Published npm baseline for the changes above. Earlier release history is recorded in the repository's Git history and tags.
