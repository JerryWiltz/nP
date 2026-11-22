<!-- Modified: 2026-11-22 -->
# SPICE-style diode models

`nP.D()` returns a two-port diode with DC curves and RF data at a separate fixed operating point. Supported records include **BZX384-B4V7**, an archived NXP/Philips-attributed Zener card ([sources and limits](zenerModels.md)), **SMV1231-079LF**, a packaged varactor, **1N4148**, a silicon signal diode, and **SMS7621/SMS7630**, Skyworks per-junction Schottky cards. See [Schottky sources, parameters and verification](schottkyModels.md). Port 1 is the anode and port 2 the cathode. Voltage VD is anode minus cathode; positive ID flows from anode to cathode. These are electrical/SPICE terminal assignments, not a claim about the package's physical pin numbering.

## User-supplied records

`D({model: myRecord})` accepts supplied junction/Schottky/Zener/varactor records with
[generic diode defaults](customModels.md#d-junction-and-schottky-diodes), optional
record-level leakageResistance and schematicVariant. It uses the same current,
charge, DC/RF/noise/Taylor equations as a named record. No catalog registration
or source-link download is needed. The legacy flat-parameter diode is unchanged.

## Varactor and C–V support

`D({model:'SMV1231-079LF',qPoint:{vd:-3}})` adds the Skyworks SC-79
varactor, its canonical symbol, M=4.999 charge law and explicit LS/CP package.
Any finite nonnegative M is supported, including the logarithmic M=1 limit.
Optional record.packageParameters uses seriesInductance in H and
parallelCapacitance in F; both default to zero. LS precedes CP in parallel
with RS-plus-junction; DC shorts LS and opens CP. RF/noise/direct IM share the
same package transfer. Arbitrary package arrays remain unsupported.

`d1.cvTable({vr:{start:0,stop:15,points:31}})` returns header plus
`[vr (V), cj (F), ct (F)]` rows without moving Q or altering I–V defaults.
VR defaults to 0–10 V/201 points and is nonnegative/increasing; CJ is depletion
capacitance and CT is the low-frequency terminal-admittance slope. The existing
smallSignal.totalCapacitance remains intrinsic. Added metadata reports
packageCapacitance, terminalCapacitance and seriesInductance. See the
[varactor model and independent verification](varactorModels.md).

## Use and defaults

```js
// 1N4148: curves and RF at a selected operating point
var g = nP.global;
g.fList = g.fGen(10e6, 1e9, 51);

var d1 = nP.D({
    model: '1N4148',
    bias: {
        vd: {start: 0, stop: 0.8, points: 201}
    },
    qPoint: {vd: 0.6},
    temperature: g.Temp
});
var curves = d1.ivTable();
var response = d1.out('s11dB', 's21dB');
var noise = d1.out('NF21dB');
```

These are the constructor defaults except for the frequency sweep: `D()` uses the current `global.fList`, initially `[2e9]`. Temperature is in kelvin and defaults to `global.Temp`, initially 293 K. An options-level `fList` overrides the grid. Required two-tone product frequencies are added through the shared analysis context. Model names are case insensitive; unknown names and options are rejected.

`bias.vd` controls only the displayed voltage sweep. `qPoint.vd` fixes the RF linearization point. Partial nested settings retain defaults. `ivTable()` returns a fresh header-and-numeric table in volts/amperes; `ivTable({vd: {start, stop, points}})` overrides the sweep without changing the Q point, S data, noise or nonlinear coefficients. At 293 K and 0.6 V the model gives approximately **0.6232 mA**, with **45.79 pF** total small-signal junction capacitance, mostly diffusion capacitance.

| Returned field | Meaning |
| --- | --- |
| `.spars`, `.global` | Normal nPort S rows and analysis snapshot |
| `.bias`, `.qPoint` | VD, ID, internal junction voltage/current, temperature |
| `.dc.bias` | Requested DC curve settings |
| `.ivTable()` | Directly plottable `['vd (V)', 'id (A)']` table |
| `.smallSignal` | Junction conductance, terminal dynamic resistance, RS, leakage resistance and junction/diffusion/total capacitance |
| `.model` | Named card, manufacturer provenance, nominal SPICE parameters and limits |
| `.noise` | Frequency-aligned outgoing noise covariance |
| `._intermod` | Internal current/charge derivatives for weak nonlinear products |
| `._schematic` | Catalog-backed diode symbol selection |

The terminal dynamic resistance includes RS and external leakage. `.smallSignal.conductance` and capacitances describe the internal junction, so its conductance is not simply the inverse of that terminal resistance. With an explicit `V()` supply, `nodal()` and `cascade()` solve DC and rebuild each diode placement before RF/noise/nonlinear analysis. Standalone and RF-only networks retain their selected construction Q point.

## Parameter provenance and compatibility

The record is the [archived NXP PSPICE 1N4148 subcircuit](https://raw.githubusercontent.com/PySpice-org/PySpice/master/examples/libraries/diode/switching/1N4148.lib), preserved by PySpice. The file identifies NXP and the former manufacturer model URL. That original URL is recorded in `.model.originalSource`; the archive is the inspected source. This is a model card, not a characterization of every 1N4148 sold by every vendor.

| Parameter | Value | Meaning |
| --- | ---: | --- |
| IS | 4.352 nA | Nominal saturation current |
| N | 1.906 | Emission coefficient |
| RS | 0.6458 Ω | Series resistance |
| CJO | 0.7048 pF | Zero-bias depletion capacitance |
| VJ | 0.869 V | Junction potential |
| M | 0.03 | Grading coefficient |
| FC | 0.5 | Forward depletion-charge continuation threshold |
| TT | 3.48 ns | Transit-time charge coefficient |
| BV / IBV | 110 V / 100 µA | Reverse-breakdown model parameters |
| EG / XTI | 1.11 eV / 3 | Saturation-current temperature parameters |
| TNOM | 300.15 K | Nominal card temperature, 27 °C |
| External R | 5.827 GΩ | Leakage-model branch across the two terminals |

The source explicitly calls the external leakage resistor a reverse-characteristic modeling aid, rather than a physical resistor. It is placed **outside** the RS-plus-junction branch. Its Johnson noise is retained to match the reference SPICE subcircuit. BV is a model parameter, not a recommended operating voltage or a device rating.

`diode1N4148()` remains available, including its original 0 V Q point, datasheet-fit parameters, positional `ivTable(start, stop, points)`, `.diode` metadata and equilibrium-noise treatment. It does not silently select the new card. Numerical differences between the two constructors are expected. The signal and legacy records retain ordinary diode artwork. Schottky records select the existing canonical Schottky variant; BZX384-B4V7 selects the Zener variant. The latter shares the existing BV/IBV/NBV breakdown law, classical noise and direct weak IM; it does not add avalanche excess noise or a fitted breakdown temperature coefficient.

## DC and charge equations

The engine solves the internal junction voltage vj rather than applying terminal VD directly to the exponential. In forward bias, at the selected temperature:

```text
VT = kT/q
Ij = IS × [exp(vj/(N×VT)) − 1]
VD = vj + RS×Ij
ID = Ij + VD/Rleak
```

IS and the junction potential/capacitance are temperature adjusted using SPICE-style laws. Temperature adjustment of depletion junctions is shared with the BJT engine. A bracketed Newton solve determines vj for each requested terminal voltage. The reverse-current continuation and exponential breakdown branch follow the classical diode formulation; BV/IBV calibrate the internal breakdown knee before solving the terminal voltage drop.

Below FC×VJ, depletion capacitance is:

```text
Cdep = CJO × (1 − vj/VJ)^(−M)
```

The code integrates this relation to obtain charge. Above FC×VJ, a quadratic charge continuation gives a finite, linear capacitance. Charge, capacitance and its first derivative agree across the boundary. This avoids clamping the singular depletion-capacitance formula at forward bias. Transit-time charge is added as:

```text
Qdiff = TT × Ij
Cdiff = TT × dIj/dvj
Ctotal = Cdep + Cdiff
```

Current derivatives through third order and charge derivatives through third order are calculated analytically. The depletion continuation is not required to have a continuous second derivative of capacitance at FC×VJ. This is a local small-signal/weak nonlinear model, not a transient switching solver.

## RF, noise and intercepts

At each frequency the engine forms the junction admittance from its bias conductance and total capacitance, adds RS in series and the external leakage branch in parallel. That floating two-terminal impedance becomes a series two-port using the normal reference resistance. The shared impedance-to-S conversion is also used by the legacy constructor. The floating reciprocal branch has K = 1; it is not an active amplifier stability example.

Noise uses resistor thermal noise and the classical SPICE junction shot-noise density `2q|Ij|`, plus the card's flicker term when supplied. The 1N4148 record has KF = 0. Noise sources are transformed through the same junction/RS/leakage circuit into a full two-port covariance, with opposite outgoing-wave correlations. At exact zero junction current the classical shot term is zero. This approximation does not enforce a junction equilibrium fluctuation-dissipation model at zero bias; it should not be substituted for calibrated low-bias, excess or avalanche noise. The legacy constructor retains its different equilibrium treatment.

For two-tone work, set `global.twoTone` before constructing the diode. Current and charge derivatives supply direct second-/third-order sources to the existing intermodulation engine. It accounts for RS, the external leakage branch, and the RF network. Output product slopes are 20/30 dB for a 10 dB change of equal input tones. Intercepts are extrapolated estimates, not compression or switching predictions. Quadratic remixing into third order, full Volterra analysis, harmonic balance and large-signal bias movement are not included.

The 1N4148 and Schottky records have no explicit package L/C; SMV1231-079LF uses the shared fixed LS/CP network described above. There is no electrothermal/self-heating solver or manufacturer-validated wideband noise/IP fit. Future PIN and other cards require their own supported behavior and verification; they cannot be inferred from their family names alone.

## Implementation and independent checks

| File | Responsibility |
| --- | --- |
| `src/np-nport/src/diodes/D.js` | Options/defaults, fixed Q point, curve table and nPort assembly |
| `diodes/diodeModels.js` | Named parameter record and provenance |
| `diodes/junctionDiode.js` | Temperature, DC solve, current/charge derivatives |
| `src/np-nport/src/junctionTemperature.js` | Shared diode/BJT depletion-junction temperature correction |
| `diodes/diodeRf.js` | Series-impedance S conversion, RF and correlated noise |
| `src/np-nport/src/intermod.js` | Existing two-tone network analysis with the external leakage transfer included |
| `dev/diode.html`, `dev/diode.md` | Runnable linear example; no table-mapping helpers |
| `test/d-model.test.js` | Model, sweep, derivative, RF/noise, embedding and intermodulation checks |
| `test/fixtures/diode-1n4148*.cir` | Independent ngspice DC/AC/noise decks |
| `test/fixtures/diode-spice-reference.js` | Recorded ngspice 39.3 results |

The independent decks use the same archived card with a separate external leakage resistor. AC excitations at the two 50 Ω ports produce all four complex S entries at 10 MHz, 100 MHz and 1 GHz. At 300.15 K and VD = 0.6 V, ngspice gives ID ≈ 0.831088 mA. The complex S entries agree within 2×10⁻⁶ absolute; noise figures agree within 2×10⁻⁵ dB. Additional DC references cover 0.8 V and −110 V. Small differences include the simulators' physical-constant precision. Run these decks in a temporary working directory because `wrdata` creates output files.

Finite differences check the analytic derivatives and terminal slope; tests also cover charge continuity, temperature behavior, frequency ownership, nodal/cascade equivalence, nonlinear slopes and following attenuation. Restricted-bundle tests exercise curves, RF/noise and SVG generation with DOM/network APIs blocked.

The governing model and noise definitions are described in the [ngspice diode documentation](https://nmg.gitlab.io/ngspice-manual/diodes/diodemodel_d.html) and [ngspice manual](https://ngspice.sourceforge.io/docs/ngspice-46-manual.pdf). The archived manufacturer's parameter record and an independently executed simulator serve different roles: the first defines the selected device, while the second checks the implemented equations and terminal stamping.
