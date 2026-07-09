# AGENTS.md
<!-- Modified: 2026-07-09 -->

Instructions for diode and nonlinear-device models in `src/np-diodes/`.

## Scope

These instructions apply to `src/np-diodes/` and its subdirectories.

## Model Shape

Diode components should be practical RF circuit models, not only isolated ideal equations.

- Use lumped parasitic elements where appropriate, such as series resistance, package inductance, junction capacitance, and shunt leakage.
- Use diode equations for DC and nonlinear behavior.
- Emit RF S-parameters as nPort-compatible objects when used in frequency-domain analysis.
- Expose DC I-V curve data as table data that can be displayed with `nP.lineChart()` or `nP.lineTable()`.

## Examples And Tests

When adding a diode constructor, prefer examples and tests that show both sides of the model:

- RF behavior through `.out(...)` values such as `s11dB` or `s21dB`.
- DC behavior through an I-V table with voltage and current columns.

Keep examples consistent with the normal nP workflow: define inputs, create the component, extract outputs, then display them.
