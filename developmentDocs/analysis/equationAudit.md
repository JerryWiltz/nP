<!-- Modified: 2026-11-22 -->
# Symbolic equation and dimension audit

Run `npm run check:equations` from the repository root. The command reports
mathematical mismatches and exits with status 1 when any check fails. It is a
separate, opt-in audit; it is not currently a CI gate or part of `npm test`.
math.js is an exact-version development dependency and is absent from nP's
runtime bundles.

## What is checked

The [case descriptions](../../scripts/equation-cases.mjs) express selected
implemented current and charge laws as mathematical strings, with explicit SI
annotations. The [runner](../../scripts/check-equations.mjs) uses math.js to
differentiate them independently of nP's Taylor engines and compares the
factorial-normalized coefficients through total degree three. It includes mixed
partials and MES1 differential-capacitance coefficients through degree two.

| Area | Sampled coverage |
| --- | --- |
| Shared derivative engines | Two- and three-control integer powers, including zero arguments; positive-domain reciprocal/square-root composition, exponentials and mixed terms. |
| BJT | 2N3904, BFR93A and 2N3906 currents, depletion charge and diffusion storage at 300.15/338.15 K; reverse, forward-active and saturated intrinsic states. |
| JFET | Both polarities, channel/gate current and gate charge; forward, inverse, cutoff, ohmic and forward-gate states. |
| MOS1 | Both polarities, channel/body current, body charge and overlap gate charge; saturation, ohmic, cutoff, inverse and forward-body states. |
| Statz | MES1 reference and NE760; HEMT die current and partitioned charge; normal/inverse, ohmic, cutoff and forward-gate states. MES1 keeps differential capacitances distinct from HEMT static charge partition. |
| Diodes | 1N4148 plus SMS7621/SMS7630 current/depletion charge; BZX384-B4V7 blocking/breakdown/forward current and charge; SMV1231-079LF reverse charge, M=1 logarithmic and nearby/hyperabrupt grading, package low-frequency capacitance with contact/lead terms; legacy diode leakage, avalanche and exponential-clamp branches. |
| PIN | Selected-region PN derivatives plus charge-storage conductivity, lifetime-knee and both high-injection current laws through cubic order. Current-coordinate derivative units and high-precision evaluation cover smooth-branch cancellation. Independent SPICE RF/noise and transient-IM comparisons are separate checks. |
| Avalanche noise | Common-pole RF/source-transfer cancellation identities and explicit multiplier current-PSD, voltage-PSD, available temperature and power dimensions. The regression itself is checked separately against digitized plots, not symbolically established as device physics. |
| Dimensions | Sampled expressions and derivatives have A, C, A/Vⁿ and C/Vⁿ dimensions; additional thermal voltage, R/L/C, transit charge, thermal/shot/induced-gate noise density and SI-prefix checks. |

The same mathematical expressions are evaluated with numbers and with math.js
Unit objects. SI dimensions are **explicit annotations**, not automatically
inferred from arbitrary JavaScript. Piecewise branches are selected at the
listed sample points, away from transition boundaries. Singular reciprocal and
square-root points are excluded; nonsingular polynomial values at zero are
included deliberately.

## Interpretation and numerical limits

Current coefficients use an absolute tolerance of 1e-18 A/Vⁿ, charge
coefficients 1e-26 C/Vⁿ and dimensionless examples 1e-12, with an additional
relative tolerance of 3e-8. These floors allow floating-point cancellation of
negligible coefficients. Nonfinite values always fail. Zero derivatives that
simplify to literal zero have no remaining unit factors.

Polynomial identities are expanded to rational normal form before
`symbolicEqual`; real-variable contexts are used. A symbolic equivalence
failure means the tool has not established equivalence, not necessarily that
the expressions differ. Derivative construction folds constant exponents and
eliminates zero factors to avoid spurious `0 × Infinity` evaluations in the
reference calculation. Negative probes verify that incompatible dimensions,
dimensioned exponential arguments and an incorrect algebraic identity are
rejected.

The avalanche rational identities instead reduce the residual to a zero
numerator on the original nonsingular domain. Numerical continuity tests
separately check the cancelled avalanche pole. With the Zener, avalanche and PIN
additions, the November 22 audit passes 6 algebra checks, 3,777 coefficient
comparisons, 3,472 dimension/conversion checks and 120 capacitance comparisons;
the same three legacy derivative failures remain.

The charge-storage PIN audit uses each differentiation variable’s own SI unit,
including current coordinates. Smooth positive-part expressions use math.js
BigNumber evaluation to avoid cancellation at very small smoothing scales.
The implementation uses equivalent analytic derivatives; this changes numerical
evaluation, not the physical equations.

The reference expressions describe current nP assumptions. This checks algebra,
derivatives, SI annotations and transcription consistency; it does not establish
that an underlying physical law or manufacturer parameter interpretation is
correct. Temperature adapters provide the tested parameter values; their
temperature laws are not independently rederived. Package networks, all
microstrip equations, complete noise fits and measured device agreement are
outside this audit. See [semiconductor sources](../semiconductors/semiconductorSources.md).

## Findings on 2026-11-21

After the Taylor correction, the run passes 4 algebra identities, 3,537 Taylor coefficient comparisons,
3,226 dimensional/conversion checks and 120 MES1 capacitance comparisons.
Three coefficient comparisons still fail, all from the legacy diode issue
below. The initial audit also failed 30 coefficients from polynomial powers
at zero; those now pass.

1. **Fixed: two-control Taylor power at zero.** In
   [taylor.js](../../src/np-nport/src/transistors/bjt/taylor.js), powers 0, 1
   and 2 now use exact constant, identity and polynomial multiplication rules,
   matching the three-control engine. This avoids the generic derivative
   formula's zero coefficient times a negative power of zero. The
   [regression tests](../../test/taylor-polynomial.test.js) check mixed
   coefficients through degree three at zero and nonzero values for both
   engines, frozen inputs and independent returned arrays. Reciprocal and
   fractional powers retain their existing domain requirements.
2. **Legacy diode derivatives above the exponential cap.** In
   [legacyDiode.js](../../src/np-nport/src/diodes/legacyDiode.js), the current
   uses `exp(min(v/vt, 80))`, but the reported first three derivatives retain
   uncapped exponential slopes. Above the cap, the forward exponential term is
   constant, so those slopes should be zero; the leakage-resistor slope remains.
   At the default 293 K and emission coefficient 2, the audit samples intrinsic
   voltage about 4.09 V. This is an extreme internal-junction condition, not an
   ordinary terminal bias or a claim of physically useful high-current behavior.

The legacy diode equations remain unchanged. `diode1N4148()` is scheduled for
[removal in 0.50.0](../planning/deviceModelsAndCircuitShapesTodo.md#version-0500-remove-the-legacy-diode);
`D()` remains the supported SPICE diode constructor. The audit continues to
report the three legacy derivative failures rather than accepting them as
expected results.

## Tool references

- [math.js derivatives](https://mathjs.org/docs/reference/functions/derivative.html)
- [math.js units](https://mathjs.org/docs/datatypes/units.html)
- [math.js symbolic equivalence and its limitations](https://mathjs.org/docs/reference/functions/symbolicEqual.html)
