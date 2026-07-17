<!-- Modified: 2026-07-15 -->
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
- [`thePathOflineChart.md`](thePathOflineChart.md): the path from the nP chart source through the nPort RF Analysis Obsidian plugin.
- [`np-math/`](np-math/): complex-number, matrix, and numerical-method documentation.
- [`np-nport/`](np-nport/): n-port constructors, composition, fixtures, and port-convention documentation.
- [`microstrip/`](microstrip/): physical microstrip models, constants, equations, and references.
- [`diodes/`](diodes/): nonlinear and small-signal diode model documentation.

Add detailed explanations here and keep `AGENTS.md` focused on rules that must be applied repeatedly.
