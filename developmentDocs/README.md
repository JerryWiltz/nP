<!-- Modified: 2026-09-24 -->
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
