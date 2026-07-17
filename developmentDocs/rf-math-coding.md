<!-- Modified: 2026-07-15 -->
# RF Math Coding

This document defines the working method for turning RF equations into maintainable nP code. The purpose is not to make Codex invent RF models. The purpose is to preserve the engineering decisions so Codex can perform the repetitive translation, testing, documentation, and consistency work without losing the intent of the model.

## The normal nP analysis flow

Write implementations and examples in the same order that an RF engineer thinks about the analysis:

1. Define the frequency list, reference impedance, and temperature.
2. Create components or fixtures as n-port objects.
3. Combine components with `nP.nodal()` or, for two-port chains, `nP.cascade()`.
4. Extract selected S-parameter forms with `.out(...)`.
5. Send the numeric table to a chart or table renderer.

```js
var g = nP.global;
g.fList = g.fGen(1e9, 3e9, 101);
g.Ro = 50;

var l1 = nP.L(5e-9);
var network = nP.nodal(
    [l1, 1, 2],
    ['out', 1, 2]
);

var output = network.out('s11dB', 's21dB');
nP.lineChart({ inputTable: [output] });
```

This hierarchy should remain visible even when the underlying equations are complicated.

## The equation-to-code record

Before implementing a model, record enough information to reproduce the engineering decision later:

| Item | What to record |
| --- | --- |
| Physical structure | What the model represents and where its reference planes are located. |
| Source | Author, document, edition or revision, section, page, and equation numbers. |
| Model family | For example, Hammerstad/Jensen, Kirschning/Jansen, or an equivalent-circuit approximation. |
| Symbols | A mapping from every published symbol to its nP variable name. |
| Units | Required input units and units produced by intermediate and final equations. |
| Normalization | Definitions such as `u = Width / Height`, `g = Space / Height`, or normalized impedance. |
| Assumptions | TEM or quasi-TEM behavior, reciprocity, symmetry, losslessness, small-signal operation, and similar assumptions. |
| Validity | Published geometry, material, frequency, or impedance-ratio limits. |
| Port order | The physical meaning and direction of every public port. |
| Limiting cases | Results expected at zero length, zero loss, large spacing, equal widths, DC, or another useful limit. |
| Verification anchors | Published examples, calculator results, hand calculations, symmetry checks, or measured data. |

Put raw papers, excerpts, and early derivations in `dev/raw/`. Put the settled explanation and symbol mapping in `developmentDocs/`. Put only the recurring mandatory rule in `AGENTS.md`.

## Units and names

nP normally uses SI units internally:

- Frequency: hertz.
- Length: meters.
- Resistance and impedance: ohms.
- Inductance: henries.
- Capacitance: farads.
- Conductance and admittance: siemens.
- Phase returned by `.ang()`: degrees.
- Propagation phase used in complex exponent or hyperbolic functions: radians.
- S-parameters: dimensionless complex voltage-wave ratios.

Use explicit conversion constants instead of unexplained decimal factors. Shared microstrip constants live in `src/np-nport/src/mlin/constants.js`.

```js
var width = 23 * MIL_TO_METER;
var omega = 2 * Math.PI * frequency;
```

Variable names should identify both the physical quantity and, when ambiguity matters, the unit. Existing public constructors use names such as `Width`, `Height`, `Length`, `Thickness`, `er`, `rho`, and `tand`; preserve those public names unless making an intentional compatibility change.

Temperature requires special care. `global.Temp` defaults to `293` and the diode model interprets it as kelvin. `mtfr()` currently compares it directly with a default `temperatureReference` of `25`, which appears to use a Celsius-style reference. Do not copy that ambiguity into a new model: state the temperature scale explicitly and add a test.

## Translating equations

Keep the code structure close enough to the source equations that another engineer can audit it:

1. Compute normalized geometry.
2. Compute quasi-static or DC quantities.
3. Apply thickness, dispersion, loss, bias, or temperature corrections.
4. Build impedance, admittance, ABCD, or S-parameter quantities.
5. Convert the result to the nP row format.
6. Attach useful engineering metadata to the returned n-port.

Prefer small named helpers for equation families over one long expression. A helper such as `hammerstadEr(u, er)` gives an equation group a stable name and makes intermediate-value testing possible.

Keep the published symbol mapping near the helper or in the matching development document. If the paper uses a symbol that conflicts with nP terminology, preserve the nP name in code and document the mapping.

## Complex values and matrices

Use `nP.complex(real, imaginary)` for quantities such as impedance, admittance, propagation constant, and S-parameters. Do not mix plain numbers with complex matrix methods.

```js
var impedance = nP.complex(resistance, reactance);
var admittance = impedance.inv();
```

Use the real matrix methods only when every entry is numeric. Use the `Cplx` methods when entries are complex:

```js
var s = nP.matrix(complexRows);
var inverse = s.invertCplx();
```

The current matrix implementation performs partial pivoting but does not provide explicit dimension, singularity, or conditioning errors. New code should validate its physical inputs, avoid known singular constructions, and test values near important limits.

## Per-frequency construction

Most RF constructors capture `global.fList` and `global.Ro`, then generate one complete S matrix per frequency. Every row must have the same square S-matrix shape:

```text
[frequency, s11, s12, ..., s1n, s21, ..., snn]
```

S-parameters are stored in row-major order. Every S-parameter entry must be a `complex()` object, even when its imaginary part is zero.

Do not silently change the global settings while constructing a model. Tests and isolated runtimes that temporarily change `global` must restore the previous values in a `finally` block.

## Model metadata

The S-parameter rows are the common interface, but engineering models often need audit data. Attach a clearly named metadata object to the returned n-port, as the microstrip and diode models already do:

```js
component.microstrip = {
    source,
    validity,
    analysis
};
```

Useful metadata includes normalized dimensions, quasi-static values, dispersive values, loss contributions, equivalent-circuit values, bias-point values, source references, and validity warnings. Metadata is diagnostic; the `.spars` shape remains the interoperable RF result.

## Verification ladder

Use several kinds of checks because a finite answer is not necessarily a correct answer.

1. **Arithmetic identity:** complex and matrix operations reproduce simple known results.
2. **Shape:** an n-port row has `1 + n²` entries at every requested frequency.
3. **Finite values:** all real and imaginary parts are finite over the supported range.
4. **Symmetry and reciprocity:** check equal terms required by the physical model.
5. **Passivity or loss behavior:** where applicable, loss should not create gain.
6. **Limiting cases:** zero loss, zero length, matched load, open, short, or widely separated coupled lines behave correctly.
7. **Published anchor:** pin at least one result from a trusted equation example, calculator, or measurement.
8. **Composition:** place the component in `nP.nodal()` or `nP.cascade()` and verify the combined result.
9. **Browser output:** for display-facing work, render the resulting table in a development page.

Tests should state why the expected result is important. Avoid tests that merely copy the implementation formula without an independent physical or published anchor.

## Working with Codex

A productive request gives Codex the physical objective and the evidence, then lets it handle the repetitive mechanics. For example:

```text
Implement the microstrip discontinuity described in this source.
Use nP public port order [common, branch1, branch2].
Inputs are SI units.
Preserve the published validity range in metadata.
Add limiting-case and pinned-reference tests.
Add a dev page using the normal frequencies → component → output → chart flow.
```

Codex should then trace the affected exports and consumers, translate the equations, add tests, rebuild the distributable when appropriate, and report uncertainties. The engineering document remains the durable explanation; the conversation is not the source of truth.
