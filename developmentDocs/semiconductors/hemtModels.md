<!-- Modified: 2026-11-21 -->
# HEMT/pHEMT die model contract

`HEMT()` implements **ATF35143_DIE**, a nominal-temperature adaptation of the
manufacturer's ATF-35143 Statz pHEMT die record. It is an empirical model of a
specific commercial pHEMT, not a universal HEMT material model or a packaged
ATF-35143 replacement. The additional ATF35143 record includes the p.16 SC-70
network with both external source pins common. The DC descriptor is approximate.

## API and terminal order

```js
nP.global.fList = [100e6, 1e9, 3e9];
var q1 = nP.HEMT({
    model: 'ATF35143_DIE',
    qPoint: {vgs: -0.6, vds: 2},
    temperature: 300.15
});
var curves = q1.ivTable();
var response = q1.out('s11dB', 's21dB');
```

The shown model and Q-point values are defaults. Temperature defaults to
`global.Temp`; fList to `global.fList`. Frequencies are Hz, voltages V,
currents A and temperature K. Public ports are **1 gate, 2 drain, 3 source**;
all `ig/id/is` currents enter the component. Model selection is case-insensitive.
Unknown properties, unsupported names, nonfinite voltages and invalid grids
are rejected. `ATF35143` selects the packaged network; ATF35143_DIE remains the default.

RF/noise requires positive frequencies, positive intrinsic VDS and gm>0.
Cutoff and reverse RF bias fail explicitly: the induced-gate noise law needs
positive gm, and the published static charge partition is intended for forward
drain operation. DC curves may include cutoff and zero drain voltage.

`bias` and `ivTable()` accept partial `vgs/vds: {start,stop,points}` intervals.
Defaults are gate 0…−0.95 V in 5 curves and drain 0…3 V in 101 points. The
returned table has a header followed by numeric V/A rows. Curves do not alter
the RF Q point or `.dc` settings. `.qPoint`/`.bias` report external and intrinsic
voltages, entering currents and source reference; `.smallSignal` reports
intrinsic gm/gds, ggs/ggd, gate partial capacitances and rg/rd/rs. These are not
a complete terminal Y matrix. Floating absolute voltage references can be null.

## Provenance and supported reduction

The [manufacturer datasheet, p.16](https://sites.units.it/carrato/didatt/corsi_old/E2_web/modulo_carrato/doc/datasheet_discreti/HEMT_ATF35143.pdf)
supplies the die parameters and W=400 µm scaling. The separate external package
schematic belongs to the ATF35143 record; the die record is preserved. [Keysight's Nonlinear Devices
manual](https://edadownload.software.keysight.com/eedl/ads/2019update1/pdf/Nonlinear_Devices.pdf),
Statz_Model, pp.484–495, supplies current, partitioned charge and noise equations.
The model record retains these sources, manufacturer, part, structure, nominal
temperature, die coverage and omissions.

| Parameter | Resolved die value |
| --- | --- |
| VTO, BETA | −0.95 V, 0.12 A/V² |
| ALPHA, B, LAMBDA | 4 /V, 0.8 /V, 0.09 /V |
| RG, RD, RS | 1, 0.5, 0.25 ohms |
| LG, LD, LS | 15, 15, 5 pH |
| CGS, CGD, CDS | 0.4, 0.08, 0.02 pF |
| VBI, IS | 0.7 V, 1 nA |
| RC, CRF | 250 ohms, 0.1 F |
| P, R, C, FNC | 0.65, 0.17, 0.2, 1 MHz |

The adaptation assigns printed legacy DELTA=0.2 to threshold smoothing (Delta2)
and uses the modern Statz fallback 1/ALPHA=0.25 V for drain smoothing (Delta1).
This is not a verified MDS-to-ADS parameter translation: the modern manual also
lists Delta1=0.3 V as a default. See the [accuracy audit](hemtAccuracyAudit.md)
for the remaining uncertainty and sensitivity checks. The charge continuation is min(FC×VBI, VMAX): 0.35 V using
the documented FC=0.5 and VMAX=0.5 defaults. Gate emission coefficient N=1,
KF=0, AF=1 and FFE=1 are defaults. These resolved choices are explicit rather
than silently treating the old MDS card as a complete modern ADS card.

This reduction uses Shockley gate currents without avalanche or simulator
explosion-current handling. It fixes electrical parameters at **300.15 K**;
the chosen temperature scales noise only. It does not implement ADS electrical
temperature scaling, transit delay, trapping, self-heating or arbitrary model
import. The source package model's stated microwave range does not certify
the bandwidth of this die-only adaptation.

## Current, charge and die network

The forward Statz channel current uses `u = VGS−VTO`:

```text
I = BETA*u²/(1+B*u) * (1+LAMBDA*VDS) * F(VDS)
F = 1-(1-ALPHA*VDS/3)³   below 3/ALPHA
F = 1                     otherwise
```

The channel cuts off for u≤0; DC inverse operation swaps gate controls and
current direction. This current law is shared with the MES1 implementation
because the manufacturer specifies Statz, not because the drawing is shared.

Gate charges use the documented smoothed effective voltages and **separate
static Qgs/Qgd**. Terminal charges are `(Qgs+Qgd, −Qgd, −Qgs)`. All cross
derivatives contribute to RF and direct Taylor products. They are not MES1's
differential branch partition; no C(V)×dV/dt branch is added a second time.

LG/LD/LS and RG/RD/RS form terminal series contacts. CDS is a drain-source
capacitance. The RC/CRF output correction has admittance
`Y = jωCRF/(1+jωRC*CRF)`. The shared RF engine evaluates this branch directly,
avoiding a poorly conditioned huge-capacitance node at GHz frequencies. It is
open at DC and approaches 1/RC at RF. RC is an empirical output correction,
not one of the physical contact thermal-noise sources in this noise model.

## Noise and weak nonlinearity

The shared floating RF solver propagates contact thermal noise and correlated
gate/drain current noise. With `A=4kT`, positive intrinsic gm, gate partial Cgs
and ω=2πf, the source spectra are:

```text
Sd  = A*gm*P*(1+FNC/f) + KF*|Id|^AF/f^FFE
Sg  = A*Cgs²*ω²*R/gm
Sgd = j*A*Cgs*ω*sqrt(P*R)*C       (gate times conjugate drain)
```

Hermitian cross terms are retained, including their imaginary sign. Correlation
is not replaced by independent gate/drain sources or passive fallback noise.
Gate shot noise is omitted. The empirical noise parameters are from the
manufacturer record; calculated die NF is not a measured packaged NF guarantee.
Direct weak IM2/IM3 includes derivatives of the same channel, gate currents
and static charges, omitting quadratic remixing, compression and large-signal
or harmonic-balance analysis.

## Network bias and verification

Supply-driven nodal/cas/cascade networks solve the existing netlist first.
Capacitors open and inductors short; all three contact resistances remain.
The shared conductance estimate, damped Newton solve and source stepping
refine the bias. Each placement hands off `{path,intrinsicVgs,intrinsicVgd,vs}`.
External VGS includes the RG×IG drop; reused templates retain separate states
without mutation. Without a supply, RF retains fixed Q and solveDC() is an
explicit snapshot. A zero-bias DC snapshot does not request cutoff RF/noise.

Independent `test/fixtures/hemt-atf35143*.cir` decks use ngspice 39.3 native
Statz channel equations, scalar gate currents and buffered static-charge
sources. The RC branch has an equivalent isolated first-order state for
conditioning. Both implementations therefore avoid GHz cancellation without
altering that branch's transfer function. All nine S entries are compared at
100 MHz, 1 GHz and 6 GHz, with couplers deembedded; maximum discrepancy is
below 1e-8. Independent unit-current responses, native gm and scalar charge
finite differences verify the full correlated-noise covariance. Tests also
check charge/current derivatives, KCL, noise positivity, IM slopes, changed
bias, independent nested placements and unchanged templates.

The [die common-source harness](../../dev/shapes/hemtDieCommonSource.html) uses a 5 V
supply, 150 ohm drain load, 47 ohm source resistor and 10 nF capacitors. It
solves ID≈13.029818 mA, VS≈0.612401 V and VD≈3.045527 V before RF. Its
schematic uses the existing commonSource board and NJF geometry; no layout
coordinates or compensating overrides were added.

## SC-70 package: ATF35143

Select `HEMT({model: 'ATF35143'})`. Public ports remain G/D/S (1/2/3), with
both external source pins joined at S. They cannot be biased or terminated
independently through this three-port boundary. The p.16 circuit retains:

- Gate/drain outer inductors Lc=0.8 nH and Ld=0.6 nH.
- Source outer inductors La=0.1 nH and La/2=0.05 nH.
- Five bond branches, each Lb=0.1 nH in series with Rb=0.1 ohm: gate, drain,
  left source and two parallel right-source bonds.
- A 0.1 ohm bridge between source pads, Ca=Cb=0.15 pF, and the complete die.

There are no tuned corrections. The same immutable terminal graph drives RF
and DC; package resistors supply thermal noise. For network DC, all inductors
short and capacitors open, preserving current division through the three
source bonds and source-pad bridge. The shared contact-network reducer derives
three independent DC contact resistances for fixed-Q control: RG=1.1 ohms,
RD=0.6 ohm and RS=0.283333333333 ohm, including die contacts. The reducer checks
connectivity and rejects cross-terminal DC coupling that needs a fuller bias
adapter. smallSignal rg/rd/rs report these effective DC contacts; model.parameters
retain the original die parameters, while packageParameters and terminalNetwork
expose the added circuit. Renumbering nodes and reordering branches preserve
the reduction. Network bias uses the full graph rather than the reduction.

The [packaged amplifier](../../dev/shapes/hemtCommonSource.html) solves
ID≈13.022707 mA, VS≈0.612067 V and VD≈3.046594 V from 5 V, 150 ohms drain,
47 ohms source and a 1 megohm gate return. The separate
[die amplifier](../../dev/shapes/hemtDieCommonSource.html) remains available.

Independent hemt-atf35143-package*.cir fixtures verify DC, all nine S entries
and the full correlated-noise covariance, including all six package resistor
noise sources. Maximum S-component discrepancy is below 2e-8 over 0.5–6 GHz.
Weak-product slopes, immutable snapshots, bias handoff and reused placements
are also checked.

### Comparison with measured manufacturer data

The p.8 table specifies VDS=2 V and IDS=15 mA. A fixed-Q comparison uses
VGS≈−0.574946601 V to select that current in this model. The measured reference
planes are the gate/drain lead ends and include four source vias in a 0.025-inch
alumina test carrier. Those vias are outside the package network and are not
assigned guessed values. The nominal electrical model is at 27°C; measured
data are at 25°C. No parameters are fitted to force agreement.

| GHz | Model S21 dB | Measured S21 dB | Model phase ° | Measured phase ° |
| --- | --- | --- | --- | --- |
| 0.5 | 14.94 | 17.02 | 169.93 | 164.04 |
| 1 | 14.91 | 16.69 | 159.81 | 147.18 |
| 2 | 14.76 | 15.59 | 139.16 | 118.41 |
| 3 | 14.40 | 14.34 | 117.96 | 93.08 |
| 4 | 13.74 | 13.09 | 96.65 | 70.17 |
| 5 | 12.74 | 11.90 | 76.12 | 49.03 |
| 6 | 11.48 | 10.81 | 57.20 | 29.27 |

The maximum S21 magnitude discrepancy is about 2.1 dB and phase discrepancy
about 28°. S11 magnitude differs by up to about 0.23 (3.0 dB), with up to
22.4° phase error. S12 magnitude/phase errors reach about 1.9 dB/10.7°, and
S22 about 2.1 dB/14.4°. All four S entries are compared. This is a documented
nominal model comparison, not close measured-data validation or a hardware
performance guarantee. Fixture parasitics, model interpretation and measured
part variation remain relevant; no single cause for the discrepancies is
established. The [accuracy audit](hemtAccuracyAudit.md) checks package wiring,
charge equations, deembedded residual conductance/capacitance and source-lead
inductance sensitivity. It identifies substantially larger apparent forward
conductance and gate capacitance in the measured data. The tested smoothing
choices and extra source inductance do not reconcile them. Improved
characterization remains pending; no parameter changes are justified by this
audit alone.
