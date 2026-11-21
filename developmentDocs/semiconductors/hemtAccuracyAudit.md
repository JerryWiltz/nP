<!-- Modified: 2026-11-20 -->
# ATF-35143 accuracy audit

## Finding

The published package topology and implemented modern Statz charge expressions
show no verified transcription error in this audit. The present adaptation
does **not** reproduce the manufacturer's measured small-signal response closely.
Its numerical agreement with the SPICE fixtures establishes implementation
consistency, not faithful reproduction of the original MDS simulator or measured
hardware. Do not adjust parameters or add compensating package elements solely
to hide that distinction.

The strongest discrepancy is a larger apparent forward conductance and gate
capacitance in the measured data. Source vias and the unresolved legacy charge
parameter mapping cannot simply be declared the cause. The exact physical cause
remains unestablished; a reference simulation of the original manufacturer model
or a validated replacement parameter set is needed before changing the physics.

## Sources and inspection

- [Manufacturer datasheet](https://sites.units.it/carrato/didatt/corsi_old/E2_web/modulo_carrato/doc/datasheet_discreti/HEMT_ATF35143.pdf):
  p.16 package circuit and W=400 µm die card; p.8 scattering data at 2 V/15 mA.
- [Keysight Nonlinear Devices](https://edadownload.software.keysight.com/eedl/ads/2019update1/pdf/Nonlinear_Devices.pdf):
  Statz_Model, pp.484–495, especially partitioned charge on pp.489–491.

The package transcription retains the gate/drain lead inductances, five lossy
bond branches, source-pad bridge, both pad capacitors, die contacts and three
source bond paths. Crossings without junction dots are separate nets. Both
external source pins are common at the public three-port boundary. No wiring
correction was identified.

The static Qgs/Qgd expressions match the cited modern partition: both control
voltages contribute their derivatives, and terminal charges sum to zero. At the
comparison bias, the smoothed charge voltage is approximately −0.547 V, well
below the 0.35 V forward continuation boundary. FC/VMAX continuation therefore
cannot explain the discrepancy at this operating point. RC/CRF is correctly a
series output-conductance correction, open at DC and approaching 1/RC at RF.

The old card specifies one DELTA=0.2, whereas the modern manual specifies
Delta1 and Delta2. Assigning it to Delta2 and choosing Delta1=1/ALPHA=0.25 V
is an **adaptation assumption**, not a verified MDS-to-ADS translation. The modern
manual also lists a Delta1 default of 0.3 V. Its fallback equation alone does not
establish how the legacy card was resolved. Leave that uncertainty explicit.

## Numerical diagnosis

Run from the repository root:

```sh
node --no-warnings --loader ./scripts/extensionless-loader.mjs scripts/audit-hemt-accuracy.mjs
```

The script selects the existing model's 15 mA operating point at VDS=2 V; it
does not fit any device parameter. It converts the two-port S table to Y,
eliminates the known passive embedding and solves for the intrinsic G/D voltages
relative to the moving intrinsic S. The embedding includes die contacts,
inductances, CDS and RC/CRF as well as the external package. Applying the same
operation to the model recovers its analytic intrinsic Y matrix within 1e-10 S
at all seven frequencies, checking the extraction calculation.

The measured extraction assumes zero additional board parasitics. These are
**apparent residual device quantities**, not independently measured intrinsic
parameters. Datasheet rounding, omitted fixture effects and imperfect embedding
remain in them. Forward conductance is Re(Y21); gate capacitance is Im(Y11)/ω.

| GHz | Model forward mS | Apparent measured mS | Model gate pF | Apparent measured pF |
| --- | --- | --- | --- | --- |
| 0.5 | 71.65 | 93.77 | 0.362 | 0.620 |
| 1 | 71.65 | 93.41 | 0.362 | 0.648 |
| 2 | 71.65 | 89.86 | 0.362 | 0.596 |
| 6 | 71.65 | 76.22 | 0.362 | 0.510 |

At 0.5 GHz the apparent forward conductance is about 31% above the model and
the gate capacitance about 71% above it. This supports investigating current
and charge characterization together. It does not justify replacing the model's
gm or capacitance with those extracted numbers: that would disconnect RF from
the shared nonlinear equations, DC behavior and bias dependence.

### Charge smoothing

Holding Delta2=0.2 V and testing Delta1=0.2/0.3 V instead of 0.25 V changes
S21 by at most 0.018 dB and 0.087° over 0.5–6 GHz. This sensitivity is far
smaller than the observed 2.1 dB/28° discrepancy. Resolving this particular
parameter ambiguity matters for provenance but cannot alone close the gap.
Other charge models or fitted parameters were not substituted.

### Measurement fixture

The measured gate/drain reference planes are already at the package lead ends.
The data additionally include four source vias in a 0.025-inch alumina carrier;
the p.16 package schematic excludes them. No arbitrary input/output delay is
warranted by those stated planes.

Diagnostic trials add separate 50, 100, 200 or 400 pH inductances outside each
source lead, preserving the internal package paths. These are sensitivity
trials, **not** manufacturer via values or a complete fixture model. Across
these trials, 0.5 GHz S21 falls from 14.937 dB to 14.932…14.895 dB, while the
measurement is 17.025 dB. At 6 GHz, phase changes from 57.20° to 56.88…55.28°,
while the measurement is 29.27°. This simple missing-inductance explanation
does not reconcile the data. A full fixture investigation would require its
geometry, coupling and reference-plane treatment.

## Disposition

Keep the nominal constructor parameters and topology unchanged. Preserve the
measured discrepancies as characterization results, distinct from numerical
SPICE tolerances. The SPICE deck uses its native channel law but independently
written sources for the interpreted static charge, so it cannot settle the
legacy charge mapping. Electrical parameters remain at 27°C; the measured table
is at 25°C, and this implementation has no electrical temperature scaling.

Before improving the fit, obtain an original MDS/ADS reference result for the
manufacturer card and package with documented defaults, ideally both with and
without the measured fixture. That distinguishes simulator/model translation
from the manufacturer's nominal fit and fixture effects. Any subsequent change
must preserve one coherent DC/current/charge/RF/noise/nonlinearity model and
be checked at multiple biases. Measured noise and intermodulation accuracy
remain unvalidated by this S-parameter audit.

## Manufacturer simulator reference: availability

On 2026-11-20, no ADS/MDS executable or original ATF-35143 model archive was
found in the checked local installation directories, development workspace or
Downloads. The user also confirmed having no access to either simulator or
the original archive. Consequently **no manufacturer simulator reference run
has been performed**.

[Agilent Application Note 1271, p.6](https://hpwiki.mcguirescientificservices.com/_media/application_notes:an-1271.pdf)
confirms that an ATF-35143 nonlinear model was distributed through the Agilent
Wireless Design Center and imported with ADS's project-unarchive function.
The public search found the datasheet and application note, but did not locate
a retrievable original model archive or its resolved simulator output. The
application note's amplifier plots use an external circuit and are not a
drop-in reference for this common-source transistor comparison. This search
does not establish that the archive is unavailable everywhere.

When a reference becomes accessible, retain the original archive and its hash,
simulator version, resolved model parameters/defaults and run logs. First run
the nominal 27°C model with the published package and both source leads common,
50-ohm RF ports, VDS=2 V and gate bias selected for IDS=15 mA. Export the DC
point and all four complex common-source S entries at 0.5, 1, 2, 3, 4, 5 and
6 GHz. Explicitly document the legacy DELTA conversion and junction selectors;
do not silently replace them with nP's assumptions. Keep the package-only run
separate from any fixture-inclusive run, and repeat at additional supported
bias points before generalizing a correction. Until then, the requested
manufacturer reference comparison remains pending and constructor parameters
remain unchanged.
