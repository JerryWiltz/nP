<!-- Modified: 2026-11-21 -->
# MOSFET models

`NMOS(options)` and `PMOS(options)` implement sourced SPICE level-1
Shichman–Hodges discrete-device records. They share analytic DC currents,
current/charge Taylor coefficients, fixed-Q solving, network DC and floating RF.
These are enhancement MOSFETs; depletion artwork does not select a numerical
model. MOS2/MOS3, BSIM, EKV and general model-text import remain unsupported.

## User-supplied records

`NMOS({model: myRecord})` and `PMOS({model: myRecord})` also accept supplied
level-1 records, with [documented generic defaults](customModels.md#nmos--pmos).
The body option still selects terminal connectivity. A reused device.model body
field must agree with that option. No TOX, BSIM or arbitrary package import is
implied; unknown parameters and conflicting polarity are rejected.

## Records, geometry and provenance

| Constructor | Default built-in record | Default terminal Q point |
| --- | --- | --- |
| NMOS | Diodes DMN55D0UT | VGS=1.5 V, VDS=5 V, VBS=0 V |
| PMOS | Diodes DMP58D0SV, **one channel** of the dual part | VGS=−2.6 V, VDS=−5 V, VBS=0 V |

Manufacturer sources: [DMN55D0UT](https://www.diodes.com/spice/download/1842/DMN55D0UT.spice.txt)
and [DMP58D0SV](https://www.diodes.com/spice/download/2329/DMP58D0SV.spice.txt).
`fet/mosfetModels.js` stores parameter facts and provenance. No vendor text is
executed. Each fit specifies L=W=100 µm, which is part of its numerical fit,
not a physical geometry claim. No length/width scaling option is exposed.
RD/RS, IS, body effect, depletion charge and overlap capacitances are retained.
Package inductance, gate resistance, ESD clamps, avalanche and inter-channel
coupling are absent from these records and are not invented.

Neither manufacturer record specifies TOX. As in MOS1, inversion/Meyer oxide
capacitance is therefore absent; RF charge comprises the provided overlap and
body-junction terms. These models are not complete power-switching, distributed
microwave or measured noise models. The separate-body option exposes the
primitive equations; it does not claim an accessible body pin on these packages.

## API and terminal contract

Only `model`, `body`, `qPoint`, `bias`, `temperature` (K) and `fList` (Hz) are
accepted. Unknown properties/model families and invalid finite values are errors.
Defaults capture `global.Temp` and `global.fList`; set the grid first.

- `body: 'source'` (default): **3 ports, gate/drain/source**. Body is tied to
  the **external source**, preserving RD/RS and the body's intrinsic voltage.
- `body: 'external'`: **4 ports, gate/drain/source/body**. Supply every terminal
  in `nodal()`. SPICE M instances use **drain/gate/source/body**; translate.

`qPoint` takes external signed `vgs`, `vds`, `vbs`; omitted VGS defaults to
polarity*(abs(VTO)+0.5), VDS to ±5 V and VBS to zero. A source-tied body rejects
nonzero VBS. Body bias is not an extra RF voltage source or termination.

`bias.vgs` and `bias.vds` each take `{start, stop, points}`. Defaults: VGS from
0 to +2 V (NMOS) or −3.1 V (PMOS), five curves; VDS from 0 to ±5 V, 101 points.
`bias.vbs` is a constant body bias in volts, default zero. `.ivTable({vgs, vds,
vbs})` returns a header and signed terminal VDS (V) versus ID (A) columns. Curve
overrides never change the RF Q point or original settings.

`.bias`/`.qPoint` include external `vgs/vds/vbs`, signed `ig/id/is`, `ib` only
for an external body, `bodyCurrent`, `terminalCurrents`, `intrinsicVgs/Vds/Vbs`,
absolute `vg/vd/vs/vb`, `threshold`, `region`, `body`, `temperature`. Currents
enter their terminals; the public terminal-current array sums to zero. In the
three-port form IS includes the body return, while `bodyCurrent` separately
reports the internal body current and is not another external terminal current.
Absolute voltages may be null for an island with undetermined common mode.
Gate DC current is exactly zero. `.smallSignal` reports intrinsic gm/gds/gmb,
overlap cgs/cgd/cgb, local junction cbs/cbd and contact rd/rs, in SI units.

## Current and charge equations

Normalize terminal voltages with polarity s=+1 (N) or −1 (P). Forward threshold
is VBI+GAMMA*sqrt(PHI−VBS). Positive normalized body voltage uses the classical
linear continuation of the square root, bounded below by zero. Reverse mode
swaps drain/source control voltages and reverses channel current. With
u=VGS−threshold>0, d=VDS>=0 and beta=KP*W/L:

- Saturation d>=u: Ich=beta*(1+LAMBDA*d)*u²/2.
- Linear d<u: Ich=beta*(1+LAMBDA*d)*d*(u−d/2).
- Cutoff u<=0: channel current is zero; body junction currents remain.

Both body PN junctions use IS*(exp(V/VT)−1), with MOS1's constant −IS reverse
continuation below −3VT. No simulator gmin is added. Integrated depletion charge
uses PB, MJ and FC, with continuous quadratic forward continuation. Overlap
charges use CGSO*W, CGDO*W and CGBO*L. Terminal current and charge sums vanish
identically. Analytic derivatives follow the implemented current law, including
forward-body continuation. Classical SPICE's approximate forward-body gmb can
differ there; RF reference comparisons use reverse/zero external body bias.
Do not interpret strongly forward-biased body operation as a validated device fit.

Temperature follows MOS1 KP∝(T/TNOM)^−1.5, band-gap/IS and threshold/body-potential
adjustments, plus the shared junction potential/capacitance law. No self-heating
or electrothermal iteration is present. Reference temperature is 300.15 K.

## Shared RF and weak nonlinearity

`deviceTaylor.js` supplies 20 factorial-normalized coefficients in three
independent intrinsic voltages (VGS,VDS,VBS), through degree three.
`deviceRf.js` separates public ports, intrinsic terminals and control pairs.
That shared solver also serves existing BJTs/JFETs through the compatibility
entry `threeTerminalRf.js`; BJT package topology and equations are preserved.
A body tie changes connectivity, rather than deleting body derivatives or RS.
External joining of a four-port's source/body reproduces its three-port response,
noise and direct Taylor products.

Noise uses classical MOS1 4*k*T*(2/3)*abs(gm) channel density and RD/RS thermal
noise. Vendor KF defaults to zero: **no fitted 1/f noise is claimed**. The
MOS1 flicker expression is retained for a future validated record, with its
classical oxide-capacitance fallback. Body-junction shot and induced gate noise
are absent. The channel formula is a saturation-oriented approximation with an
ohmic-region limitation. NF uses the final terminated network and selected
reference temperature (290 K by default).

IM2/IM3 and intercepts propagate direct Taylor current and dQ/dt sources through
the connected linear network. Quadratic remixing, full Volterra feedback,
harmonic balance, large-signal compression and switching are not implemented.
Results assume sufficiently small signals within a smooth local model region;
cutoff/region boundaries and strongly forward-biased junctions need care.

## Network DC and handoff

Immutable descriptors retain the record, body connection, temperature, curves,
seed and captured context. The DC adapter stamps contacts and a separate body
connection to the external source or terminal 4. A cutoff/open-junction initial
estimate is refined by shared damped Newton/source stepping. BJTs, JFETs,
diodes and MOSFETs solve together; external capacitors open and inductors short.

An insulated **floating gate** leaves DC bias undetermined and gives
`DC_FLOATING_BIAS`; a constructor Q point is not a hidden DC supply. Floating
body voltage may instead be determined by the two physical junction currents.
No artificial gate leakage/ground is introduced to make a solve succeed.

Networks containing V() solve DC first. Per-placement handoff records contain
`{path, intrinsicVgs, intrinsicVds, intrinsicVbs, vs}` and reconstruct S/noise/
nonlinear data from the same builder. Templates, curves and original grids stay
intact. Without an explicit supply, RF retains the chosen fixed Q point.

## Layout and verification

`commonSource` supports both polarities of three-terminal MOSFET stages. The
shared divider-amplifier board uses terminal-role data for BJT/FET variants,
without layout offsets, compensating leads or symbol-specific corrections.
Source return can be R, separate R/C, or sePaRC; supply bypass is optional and
both rail orders are covered. Self-biased arrangements also draw correctly,
although an enhancement MOSFET with gate returned to ground can remain off.
Standalone four-terminal drawings work; independent-body amplifier boards and
arbitrary drawing-description self-connections remain separate layout work.

`test/mosfet.test.js` compares all nine/sixteen complex S entries at 10/100/1000
MHz, nominal/hot DC and noise against independent ngspice 39.3 decks. Coupling
capacitors are deembedded using Vdev=Vac−Zc*I, A=Vdev+Ro*I, B=Vdev−Ro*I,
S=B*inv(A), avoiding an ill-conditioned huge coupling capacitor. Other tests
check external-divider bias against SPICE, true body-connection differences,
charge/current conservation and all control derivatives through degree three,
active covariance, IM slopes, nesting/context, mixed devices, failure ordering
and schematic topology/clearance. See [browser harness](../../dev/shapes/mosfetCommonSource.html).
