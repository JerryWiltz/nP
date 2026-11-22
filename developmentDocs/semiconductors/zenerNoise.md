<!-- Modified: 2026-11-22 -->
# Zener breakdown noise and RF noise sources

Research completed November 22. A separate [NoiseDiode research reference](noiseDiodeModels.md)
now implements the avalanche/drift circuit and plot-derived spectral multiplier.
**Calibrated excess noise for the ordinary Zener remains unimplemented.**
The existing [Zener record](zenerModels.md) retains classical shot, resistor
thermal and optional flicker noise.

## Finding

BV/IBV/NBV cannot determine a diode's RF excess noise. The recommended next
increment is characterized spectral noise in named or user-supplied records,
with explicit bias, temperature, validity range and reference plane. Do not
invent a multiplier to make BZX384-B4V7 resemble a calibrated noise source.

## Primary evidence

| Source | Finding and implication |
| --- | --- |
| [Nexperia AN90031, §§1/4][nexperia] | Distinguishes low-voltage tunnelling from avalanche breakdown and describes bias-circuit-dependent low-current overshoot. A 4.7 V Zener is not a generic avalanche-noise reference; overshoot amplitude is not a calibrated broadband PSD. |
| [Analog Devices white-noise generator][adi] | Reports material-dependent noise magnitude and measured dependence on diode voltage and frequency. Its assembled circuit spectrum is not an intrinsic BZX384 noise card. |
| [Maya, Lázaro and Pradell, 2003, DOI 10.1002/mop.10979][maya] | Extracts an avalanche-zone source from measured impedance and noise, fitting a frequency-dependent multiplier in a separate avalanche/drift circuit. Its fit cannot be transplanted into D's different topology. |
| [Brinson, 2023, DOI 10.1002/jnm.3090][brinson] | Three-branch model with shot, flicker and resistor noise, demonstrated around a 3.9 V Zener. These terms do not themselves supply a calibrated RF avalanche-excess-noise fit. |
| [Hamamatsu detector guide, Eq. 4][hamamatsu] | APD noise uses primary photocurrent, multiplication gain and excess-noise factor. Do not apply that equation to an arbitrary Zener's already multiplied terminal current. |
| [Keysight noise-figure documentation][keysight] | Defines hot/cold ENR and distinguishes available noise from delivered noise. Preserve mismatch and reference-plane information. |

The Maya PDF's Figure 3 and equations were visually checked. Its Noisecom
NC-406 example has a source inconsistency: Figure 4 gives −16.4 V while Table 1
gives −10.4 V at 16.7 mA. Spectra are plots rather than a complete numerical
card. The separate NoiseDiode work now preserves these ambiguities, digitizes
16.7 mA plot samples and fits the omitted transit time. Its reproducible
research record is not calibrated data and supplies no invented DC law.

No BZX384-B4V7 RF excess-noise spectrum or ENR-versus-bias calibration was
located in the examined sources. Missing characterization is not zero noise.

## Numerical check of the present model

At VD=−4.7 V, T=300.15 K, using the current source implementation:

| Calculated quantity, not measured | Value |
| --- | --- |
| Current | −4.66304128 mA |
| Shot current PSD, `2q*abs(Ij)` | 1.49420316e-21 A²/Hz |
| Shot amplitude density | 38.6549 pA/√Hz |
| Low-frequency differential resistance | 5.93379323 Ω |
| Open-circuit voltage amplitude density including RS thermal noise | 0.228882 nV/√Hz |
| Available noise temperature | 159.863 K |

Reproduce with `D({model:'BZX384-B4V7',qPoint:{vd:-4.7},temperature:300.15,
fList:[1e3]})`. For intrinsic conductance g and series resistance RS:

```text
Rterminal = 1/g + RS
Sv_open = (2q*abs(Ij))/g^2 + 4kT*RS       [V²/Hz]
Tavailable = Sv_open/(4k*Rterminal)      [K]
```

As a separate propagation check, tie the diode's anode to Short and expose
only the cathode with nodal(). At 1 kHz the resulting one-port has reflection
magnitude 0.78782797 and emitted noise 8.37229782e-22 W/Hz into 50 Ω.
`C11/(k*(1-abs(S11)^2))` reproduces 159.863 K. This establishes consistency
between circuit and noise-wave calculations; it does not validate real
avalanche noise. The present model does not generate a strong hot source.

`out('noiseFloor')` includes the selected input reference noise and specified
terminations. It is not standalone-source ENR; neither is `NF21dB`.

## ENR and data interpretation

At a common calibration plane:

```text
ENR_dB = 10*log10((Thot-Tcold)/T0), T0 = 290 K
Thot = Tcold + T0*10^(ENR_dB/10)
available hot noise PSD = k*Thot                    [W/Hz]
```

Derived from available power and nP's wave convention, a stable passive-output
one-port emits `k*Thot*(1-abs(Gamma_hot)^2)` into a matched real-impedance
receiver. Hot/cold match can differ. Lossless or active-output cases require
their appropriate representation, not division by a vanishing/negative factor.

An illustrative 15 dB ENR at Tcold=290 K gives Thot=9460.605 K and available
hot noise −158.840 dBm/Hz. This is arithmetic, not a device specification.
An assembly's calibrated ENR includes its bias feed, matching and attenuation
at that plane; do not apply those losses a second time.

## Recommended implementation and validation

1. Add characterized noise through the shared named/supplied-record path.
   Require spectral units, bias, temperature, reference plane, frequency/bias
   coverage and provenance. Do not extrapolate beyond characterized domains.
2. Distinguish **additional intrinsic current PSD** from **total terminal
   noise**. The former can augment the junction source through existing
   RS/CP/LS transfer. The latter requires a terminal-plane representation;
   adding total measured noise to shot/resistor noise counts it twice.
   ENR or nV/√Hz cannot become A²/Hz without impedance/loading information.
3. Evaluate at the solved Q point, handling construction defaults and
   DC-before-RF rebuilding consistently. A single measured bias does not
   establish arbitrary bias or temperature dependence.
4. Keep a physical avalanche device distinct from an assembled calibrated
   one-port. The device may also require avalanche/drift RF impedance; the
   assembly needs hot/cold match and temperature data. Neither establishes
   physical DC behavior without supporting parameters.
5. Verify named/supplied equivalence and separate placement handoff; preserve
   DC, S-parameters and deterministic IM when only noise data change. Check
   positive semidefinite covariance, units and frequency alignment. Independent
   PSDs add; RMS amplitudes do not add directly.
6. Check Norton-source load noise and package transfer independently. Reproduce
   ENR with mismatch and, through a matched attenuator of power gain G,
   `Tout=G*Tin+(1-G)*Tphysical`. Recover a known amplifier NF with a synthetic
   Y-factor experiment, then validate the physical source against measurements.

D's M is depletion grading, not avalanche gain; NBV sets breakdown slope,
not noise multiplication. Preserve a paper's multiplier/current/circuit
definitions. Ordinary ngspice diode-noise agreement remains a classical
regression; it cannot validate physics absent from both implementations.

[nexperia]: https://assets.nexperia.com/documents/application-note/AN90031.pdf
[adi]: https://www.analog.com/en/resources/design-notes/building-a-lowcost-whitenoise-generator.html
[maya]: https://upcommons.upc.edu/bitstream/handle/2117/1120/extraction%20avalanche%20diode104535657.pdf
[brinson]: https://onlinelibrary.wiley.com/doi/full/10.1002/jnm.3090
[hamamatsu]: https://hub.hamamatsu.com/us/en/technical-notes/detector-selection/guide-to-detector-selection.html
[keysight]: https://helpfiles.keysight.com/csg/e5080b/Applications/Noise_Figure.htm
