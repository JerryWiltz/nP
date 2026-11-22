<!-- Modified: 2026-11-21 -->
# JFET models

`NJF(options)` and `PJF(options)` return floating three-terminal nPorts in **gate,
drain, source** order. SPICE J instances use drain/gate/source; translate explicitly.
They share a SPICE level-1 Shichman–Hodges engine with B=1. These are silicon
junction FETs; shared artwork does not turn them into MESFETs or HEMTs.

## User-supplied records

`NJF({model: myRecord})` and `PJF({model: myRecord})` also accept supplied
parameter records. Generic defaults, polarity validation and package restrictions
are listed in [custom models](customModels.md#njf--pjf). New names need no
registration; named and supplied records share the same DC/RF/noise/Taylor path.

## API and records

Options are `model`, `qPoint`, `bias`, `temperature` (kelvin) and `fList` (hertz).
Unknown properties, a model from the other polarity, invalid grids and invalid
sweep directions are errors. The default frequency list is the captured global
list; set it before construction. Default temperature is `global.Temp`.

| Constructor | Default built-in record | Default terminal Q point |
| --- | --- | --- |
| `NJF` | onsemi MMBF5457LT1, record 2002-12-06 | `{vgs: -1, vds: 10}` V |
| `PJF` | onsemi MMBFJ175LT1, record 1998-04-14 | `{vgs: 1, vds: -10}` V |

The resolved parameter facts and provenance live in `fet/jfetModels.js`.
Manufacturer sources are [MMBF5457LT1](https://www.onsemi.com/download/models/lib/mmbf5457lt1.lib)
and [MMBFJ175LT1](https://www.onsemi.com/download/models/lib/mmbfj175lt1.lib).
These records include RD/RS contact resistance and gate junction capacitance;
they have **no explicit SOT23 lead inductance or package capacitance network**.
No downloaded model text is executed. This is not a general SPICE importer.

`bias.vgs` defaults to `{start: 0, stop: -3.86852, points: 5}` for NJF and
`{start: 0, stop: 4.25882, points: 5}` for PJF. `bias.vds` defaults to
`{start: 0, stop: 10, points: 101}` or `{start: 0, stop: -10, points: 101}`.
Each interval accepts `start`, `stop`, `points`. `.ivTable({vgs, vds})` returns a
header row followed by terminal VDS in volts and signed drain current columns in
amperes, one column per stepped VGS. Curve overrides never move the RF Q point.

`.bias` and `.qPoint` contain `vgs`, `vds`, `ig`, `id`, `is`, `intrinsicVgs`,
`intrinsicVgd`, `vg`, `vd`, `vs`, `region`, `temperature`. All three terminal
currents **enter** the device, so their sum is zero. Source current is negative
for a normally biased NJF; this differs from the BJT's outward IE convention.
Absolute references may be null in floating networks. `.smallSignal` reports
intrinsic `gm`, `gds`, `ggs`, `ggd`, `cgs`, `cgd` and contact `rd`, `rs` in SI units.
`.model`, `.dc`, `.noise`, `.spars` and `.out()` follow the nPort contracts.

## One current and charge law

Normalize voltages with s=+1 for NJF and −1 for PJF. In forward mode let
u=s*VGS−VTO and d=s*VDS. With u>0:

- Linear region, d<u: Ich = BETA*(1+LAMBDA*d)*d*(2*u−d).
- Saturation, d>=u: Ich = BETA*(1+LAMBDA*d)*u².
- Cutoff, u<=0: channel current is zero.

Reverse mode swaps the gate-source and gate-drain coordinates and reverses
channel current. Gate-source and gate-drain PN currents use IS*(exp(V/VT)−1),
with the classical cubic reverse continuation below −3VT. Integrated square-root
depletion charge uses grading coefficient 0.5 and a continuous forward
continuation at FC*PB. Gate charge is Qgs+Qgd, drain charge −Qgd and source charge
−Qgs. Signed current and charge sums vanish identically.

`jfetEquations.js` evaluates factorial-normalized current/charge Taylor
coefficients through degree three in (VGS,VGD). The same analytic derivatives
serve fixed-Q solving, network DC, RF and direct weak nonlinear products. RD/RS
connect external terminals to intrinsic nodes; Q-point voltages are external.
Temperature adjustment follows the level-1 IS, VTO, BETA and junction-capacitance
laws; both supplied records have TCV=BEX=0, not a measured temperature fit.

## DC ordering and floating references

An immutable `_dcModel` records G/D/S order, record, polarity, temperature,
curve settings, seed and construction context. `dcSolver.js` stamps RD/RS and the
signed intrinsic current Jacobian. A zero-gate ohmic channel conductance gives
an initial estimate; the shared damped Newton/source-stepping solver then checks
the actual nonlinear laws. Gate leakage remains part of the refined solution.

Networks containing `V()` solve DC before RF composition. Each placement hands
`{path, intrinsicVgs, intrinsicVgd, vs}` to its captured builder. The builder
recalculates RF, active covariance and nonlinear data without modifying templates
or curves. Mixed JFET/BJT/diode circuits solve together. An explicit `.solveDC()`
on an unpowered device solves its unpowered state; the constructor Q point is
not a hidden supply. Without an explicit supply, RF retains the chosen fixed Q.

Topology-defined floating voltage translations are represented exactly in the
solver null space. Independent nongauge modes remain; weak gate leakage must
not convert numerical gauge roundoff into apparent nonunique device currents.

## RF, noise and intermodulation limits

`threeTerminalRf.js` is the compatibility entry to the shared `deviceRf.js` engine used by BJTs, JFETs and MOSFETs. It solves all three floating terminals,
contact resistance, intrinsic conductance and j*omega*charge Jacobians before
converting to S parameters. No source terminal is silently grounded.

Noise follows classical ngspice **NLEV=1**: drain-source channel density
4*k*T*(2/3)*abs(gm), plus KF*abs(Id)^AF/f at positive frequency, and RD/RS thermal
noise. Flicker is omitted at exactly zero frequency. Gate shot noise and induced
gate noise are absent. NLEV=1 is a saturation-oriented approximation with a
known ohmic-region limitation; these records are **not measured noise fits**.
Noise figures use the final terminated network and the selected reference
noise temperature (290 K by default).

IM2/IM3 and intercepts use direct Taylor current and charge sources propagated
through the connected linear network. This is not harmonic balance or a full
Volterra solution: quadratic remixing, large-signal compression, switching and
transient charge storage are not included. Cutoff/region boundaries have
piecewise derivatives; weak nonlinear results require a sufficiently small
excitation within the local model region. Gate avalanche, drain breakdown,
self-heating, trapping and distributed package effects are unsupported.

## Verification and layout

`test/jfet.test.js` compares all nine complex S parameters at 10/100/1000 MHz,
nominal/hot DC and noise to archived ngspice 39.3 results. Companion decks in
`test/fixtures/jfet-*.cir` contain explicit manufacturer parameter facts and
reference circuit conditions. `dc-jfet-bias.test.js` checks independently solved
self-bias, mixed devices, nesting, repeated templates, captured context and RF
handoff. Separate tests verify current/charge conservation, analytic derivatives,
Hermitian positive covariance and second/third-order power slopes.

The `commonSource` board supports self-bias with a gate return resistor,
drain load, AC-coupled ports, source resistance with optional split or combined
bypass, and optional supply bypass. Both polarities share terminal roles.
Divider-biased three-terminal FET stages also share the general divider-amplifier board. Common gate/drain, independent-body amplifier boards and multiple-device boards remain future work.
See [commonSource.html](../../dev/shapes/commonSource.html). The shape declares
organization; the shared relational engine chooses U-turn side from constraints
and measured geometry, with no corrective offsets or stretched leads.
