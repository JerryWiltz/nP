---
name: validate-device-model
description: Investigate nP semiconductor equations, parameter interpretation, derivatives, units and numerical or measured-device agreement. Use for a model validation or physics accuracy audit, not an ordinary JavaScript review or a request to write a circuit.
---
<!-- Modified: 2026-11-24 -->

# Validate an nP device model

Follow the [root instructions](../../../AGENTS.md) and applicable device-directory
instructions. Establish whether the request is investigation only or includes
corrections. An audit does not authorize changing equations, fitted parameters,
reference fixtures or tolerances. During `--stop`, use inspection and checks
whose lack of file-writing side effects has been established.

## Define the comparison

Start with the [sources index](../../../developmentDocs/semiconductors/semiconductorSources.md),
the affected model note and actual source/tests. Identify the disputed quantity
and trace it through the parameter resolver, temperature adapter, intrinsic law,
package, DC bias handoff and measurement network as needed. Read only the paths
needed to explain that quantity.

Separate these questions:

- Does JavaScript implement the documented equations and parameter meanings?
- Does an independent simulator evaluate the same model under the same conditions?
- Does that model reproduce measured device behavior?

Agreement on one question does not answer the others. Record the model/card
revision, provenance, temperature, external and intrinsic bias, terminal order,
package/reference planes, reference impedance and supported operating domain.
Do not assume a vendor datasheet's associated gain is the device's unmatched S21,
or that a nominally similar model name identifies the same simulator dialect.

## Select independent checks

Use the smallest checks capable of locating the discrepancy:

- **Equations and derivatives:** trace current and charge laws to primary sources.
  Compare independent analytic/symbolic derivatives or suitably conditioned
  numerical probes with the implementation's factorial-normalized Taylor
  coefficients. Check mixed derivatives, polarity and piecewise boundaries.
  Distinguish integrated static charge from a differential `C(V) dV/dt` branch.
- **Dimensions and conversions:** use explicit SI annotations for parameters and
  derivatives, including current-controlled coordinates. Check Hz versus angular
  frequency, degrees versus radians, density versus integrated noise, and the
  applicable RMS/peak and power-wave conventions. Unit checking cannot establish
  a physical law's correctness.
- **DC and linearization:** compare I-V points, terminal-current conservation,
  Jacobians and supported low-frequency conductance limits. For network bias,
  distinguish external contact/package drops from intrinsic junction voltages;
  verify each placement is rebuilt at its own solved operating point.
- **RF/noise/IM:** compare complex S entries and reference planes, not only gain
  magnitudes. Propagate the same source noise and loading. For weak IM compare
  product amplitudes/phases and power slopes at small excitation, accounting for
  the engine's supported local or cross-device feedback. Do not infer a large-
  signal or transient capability from Taylor agreement.

The [equation audit](../../../developmentDocs/analysis/equationAudit.md) documents
`npm run check:equations`, its selected coverage and known legacy failures. Read
that interpretation before running it. Report new failures separately; do not
suppress an existing failure or freeze historical pass counts into a new test.
Read [DC handoff](../../../developmentDocs/analysis/dcAnalysis.md) when bias is
part of the comparison.

## Reproduce simulator or measured references

Inspect relevant [reference decks](../../../test/fixtures) and tests before
rerunning them: some decks write fixed temporary paths. Use available simulator
versions and isolate outputs within authorized locations; report unavailable
checks rather than claiming they ran. Preserve the deck, simulator options,
version, output extraction/regeneration method and original reference data.
Expected values generated from nP itself are not independent evidence.

Match the simulator's equation conventions, constants and package topology.
Investigate discrepancies before choosing tolerances. Distinguish numerical
conditioning, noise-source subtraction and derivative cancellation from a
physics difference. Do not widen tolerances or refit a device just to make a
comparison pass.

For measured data, retain source attribution, bias, frequency, fixture and
calibration plane. Identify unresolved embedding or matching networks. If
curves must be digitized or fitted, distinguish plotted estimates from raw
measurements; retain the extraction and fit method. Do not silently substitute
an unrelated part's fit or label a numerical reference manufacturer-calibrated.
The [HEMT accuracy investigation](../../../developmentDocs/semiconductors/hemtAccuracyAudit.md)
illustrates reporting residual discrepancies without hiding them.

## Report and, when requested, correct

Report the conditions, expected and actual quantities, discrepancy, evidence
level and remaining uncertainty. Distinguish an implementation bug, unsupported
physics, parameter/provenance ambiguity and a measured-fit limitation. State
which checks were executed and which were only inspected.

When a correction is authorized, fix the shared equation/adapter cause, update
paired audit expressions and independent regression evidence, and follow the
root integration requirements for documentation, bundles and shipped guides.
An investigation alone should not manufacture a source change or saved report.
