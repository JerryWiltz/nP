<!-- Modified: 2026-11-18 -->
# NPN constructor

`nP.NPN()` turns a nonlinear bipolar transistor model into an nPort at a selected DC operating point. It returns the three-port S-parameters, the transistor's noise covariance and the model needed for weak nonlinear analysis. The DC state connects these calculations: changing the bias changes the RF model.

The preceding [nPort overview](./tech-notes-nport-overview.md) explains the returned object. This note follows the steps inside `NPN.js` and shows how to use that object in a circuit.

## Three terminals, three RF ports

The terminal order is always:

| nP port | Terminal |
| --- | --- |
| 1 | Base |
| 2 | Collector |
| 3 | Emitter |

All three remain external. `configuration: 'commonEmitter'` selects DC curve and operating-point constraints; external RF connections establish the common-emitter circuit. To obtain a two-port with base input and collector output, connect the emitter to `Short()` or the intended emitter network.

A bare `q1.out('s21dB')` describes collector response to base excitation with the other ports matched, including the emitter port. Its loading differs from an emitter connected to an ideal RF ground. Measure the completed two-port for the amplifier's response, noise figure and stability.

## Select the model and operating point

`NPN.js` is a small entry point. It passes the options, NPN polarity and model resolver into the shared `bjtConstructor()` engine. That engine selects a parameter record, applies temperature corrections, solves the device's bias and builds its frequency-dependent response.

| Option | Meaning and default |
| --- | --- |
| `model` | `'2N3904'` by default; `'BFR93A'` is also supported. |
| `configuration` | `'commonEmitter'`, `'commonBase'` or `'commonCollector'`; default common emitter. |
| `qPoint` | For CE/CC, `{ib: 20e-6, vce: 5}`. For CB, `{ie: 2e-3, vcb: 5}`. Currents are amperes and voltages are volts. |
| `bias` | DC curve-family settings, independent of the selected RF point. |
| `temperature` | Junction/model temperature in kelvin; defaults to `global.Temp`, initially 293 K. |
| `fList` | Optional frequency override; otherwise captures the current `global.fList`. |

The records use a SPICE modified Gummel–Poon model. The 2N3904 record includes terminal resistances but no explicit lead-inductance/package-capacitance network. BFR93A includes its published SOT23 L/C network around the die model. The returned `.model` records provenance and package coverage. These are supported parameter sets; the constructor does not accept an arbitrary `beta` option or a SPICE model string.

For an NPN, reported IB and IC enter the device and reported IE leaves it:

$$
I_E = I_B + I_C
$$

The actual current gain $I_C/I_B$ changes with bias and temperature. The model's nominal forward-beta parameter is one input to the nonlinear equations.

## The Gummel–Poon model

Gummel–Poon is a **charge-control model**: junction voltages determine transport currents and stored charge, which together determine the transistor's DC and RF behavior. nP uses the SPICE modified Gummel–Poon equations in `gummelPoon.js`. The supported parameter records feed that engine; choosing another part changes the parameters and package network.

The [ngspice manual, “Gummel-Poon Models”](https://ngspice.sourceforge.io/docs/ngspice-manual.pdf), describes the wider SPICE model family. The equations below describe the implementation used by nP.

### Junction voltages and transport currents

Use the **intrinsic** junction voltages $v_{be}=v_b-v_e$ and $v_{bc}=v_b-v_c$, inside the terminal resistances. For a forward-active NPN, $v_{be}$ is positive and $v_{bc}$ is negative. These differ from external terminal voltages when the terminal resistances carry current.

At temperature $T$ in kelvin, the thermal voltage is $V_T=k_BT/q$, where $k_B$ is Boltzmann's constant and $q$ is the elementary charge. The forward and reverse transport currents are:

$$
\begin{aligned}
I_F &= I_S\left[\exp\!\left(\frac{v_{be}}{N_F V_T}\right)-1\right] \\
I_R &= I_S\left[\exp\!\left(\frac{v_{bc}}{N_R V_T}\right)-1\right]
\end{aligned}
$$

`IS` sets the transport-current scale; `NF` and `NR` are the forward and reverse emission coefficients. The engine adjusts temperature-dependent parameters before evaluating the equations.

### Base charge, Early effect and gain rolloff

A dimensionless normalized base-charge factor $q_b$ modifies the transport current. nP calculates:

$$
\begin{aligned}
q_1 &= \left(1-\frac{v_{bc}}{V_{AF}}-\frac{v_{be}}{V_{AR}}\right)^{-1} \\
q_2 &= \frac{I_F}{I_{KF}}+\frac{I_R}{I_{KR}} \\
q_b &= \frac{q_1}{2}\left(1+\sqrt{1+4q_2}\right)
\end{aligned}
$$

`VAF` and `VAR` describe the forward and reverse Early effects: changes in junction bias change the effective base width and transport current. `IKF` and `IKR` set high-current rolloff scales. An infinite parameter removes its corresponding reciprocal term. The dimensionless $q_b$ is a correction factor; the stored charges introduced below have units of coulombs.

Base current also includes forward/reverse gain terms and junction leakage/recombination terms:

$$
\begin{aligned}
I_{BE} &= \frac{I_F}{B_F}+I_{SE}\left[\exp\!\left(\frac{v_{be}}{N_E V_T}\right)-1\right] \\
I_{BC} &= \frac{I_R}{B_R}+I_{SC}\left[\exp\!\left(\frac{v_{bc}}{N_C V_T}\right)-1\right]
\end{aligned}
$$

`BF` and `BR` are nominal gain parameters. `ISE`, `NE`, `ISC` and `NC` control the additional base-current terms. The resulting terminal currents are:

$$
\begin{aligned}
I_B &= I_{BE}+I_{BC} \\
I_C &= \frac{I_F-I_R}{q_b}-I_{BC} \\
I_{E,\mathrm{out}} &= I_B+I_C
\end{aligned}
$$

The engine internally uses currents entering all three terminals, so its emitter current is $-I_{E,\mathrm{out}}$. The public Q-point record reports outward `ie`.

For the 2N3904 example below at 293 K, the solved intrinsic voltages are approximately $v_{be}=0.705566$ V and $v_{bc}=-4.291384$ V. The engine gives $I_F\approx3.00752$ mA and $q_b\approx0.986015$; the reverse and base-collector currents are negligible at this point. Substitution gives:

$$
I_C\approx\frac{3.00752\ \mathrm{mA}}{0.986015}
\approx3.05018\ \mathrm{mA}
$$

With IB = 20 µA, the resulting current gain is about **152.5**. The nominal gain parameter, base-current terms, charge correction and temperature all contribute to that result.

### Stored charge and capacitance

The model also calculates junction depletion charge and carrier-storage charge. Below the forward-bias continuation boundary, each depletion junction uses:

$$
Q_{\mathrm{dep}}(v)=
\frac{C_{j0}V_j}{1-m}
\left[1-\left(1-\frac{v}{V_j}\right)^{1-m}\right],
\qquad v<F_CV_j
$$

The BE parameters are `CJE`, `VJE` and `MJE`; the BC parameters are `CJC`, `VJC` and `MJC`. Above the boundary set by `FC`, nP uses a quadratic charge continuation that preserves charge and capacitance continuity.

For positive $v_{be}$ with nonzero `TF`, the intrinsic charge expressions include:

$$
\begin{aligned}
Q_{BE} &= Q_{\mathrm{dep,BE}}+T_F\frac{I_F}{q_b}(1+A_T) \\
Q_{BC} &= Q_{\mathrm{dep,BC}}+T_R I_R
\end{aligned}
$$

Here $A_T$ is the forward transit-time correction controlled by `XTF`, `VTF` and `ITF`. Otherwise the forward storage term is zero; the junction depletion terms remain. `TR` controls reverse storage. The [model details](https://github.com/JerryWiltz/nP/blob/master/developmentDocs/transistorModels.md#stored-charge-equations) give the full correction and continuation equations.

The intrinsic terminal charges are $Q_B=Q_{BE}+Q_{BC}$, $Q_C=-Q_{BC}$ and $Q_E=-Q_{BE}$, so their sum is zero. Differentiating them with respect to the junction voltages gives the capacitance terms used in RF analysis. Because forward stored charge depends on both junction voltages, its cross derivative also matters.

### One model supplies DC, RF and weak nonlinearity

The DC solver uses these terminal-current equations and their first derivatives. RF analysis adds the first derivatives of stored charge. The weak nonlinear engine uses second- and third-order current/charge coefficients from the same equations. This keeps the bias, gain, capacitance and distortion calculations tied to one model.

The next examples select or solve the operating point at which those derivatives are evaluated.

## Curves and RF bias are separate

The default common-emitter curves sweep VCE from 0 to 10 V in 201 points, with six IB values from 0 to 50 µA. `q1.ivTable()` returns a header and numeric rows: voltage in the first column, followed by one current column per curve. Common collector reports outward IE versus VCE; common base reports IC versus VCB at stepped outward IE.

The constructor's `bias` option and optional `ivTable(...)` arguments control curve generation without moving the selected RF Q point. The returned `.bias` property describes the selected operating point. Partial options retain omitted defaults. This self-contained browser example prescribes the bias, grounds the emitter for RF and measures the resulting two-port:

```js
var g = nP.global();
g.Ro = 50;
g.Temp = 293;
var frequencies = g.fGen(10e6, 100e6, 10);
g.fList = frequencies;

var q1 = nP.NPN({
    model: '2N3904',
    configuration: 'commonEmitter',
    qPoint: {ib: 20e-6, vce: 5}
});
var short1 = nP.Short();

var amplifier = nP.nodal(
    [q1, 1, 2, 3],
    [short1, 3],
    ['out', 1, 2]
);

var curves = q1.ivTable();
var selectedPoint = q1.qPoint;
var response = amplifier.out('s11dB', 's21dB');

nP.log(selectedPoint);
nP.lineChart({
    inputTable: [curves],
    title: '2N3904 collector curves',
    metricPrefix: 'none',
    xAxisTitle: 'VCE (V)',
    yAxisTitle: 'IC (A)'
});
nP.schematic(amplifier);
nP.lineChart({inputTable: [response], title: 'Common-emitter RF', metricPrefix: 'mega'});
```

For this model at 293 K, IB = 20 µA and VCE = 5 V give approximately **IC = 3.05018 mA**, **IE = 3.07018 mA** and **VBE = 0.705766 V**. At 100 MHz, the completed 50 Ω two-port has **S21 ≈ 13.8510 dB**. These values describe the selected model and connections, rather than a guaranteed measurement of a physical transistor.

## From DC currents and charges to S-parameters

The equation engine calculates terminal currents and stored charges as functions of the intrinsic base-emitter and base-collector voltages. At the operating point it evaluates their derivatives. Small changes then follow a linear model:

$$
\delta\mathbf i = \mathbf G\,\delta\mathbf v,
\qquad
\delta\mathbf q = \mathbf C\,\delta\mathbf v
$$

At angular frequency $\omega=2\pi f$, the incremental terminal response contains both conduction and charge current:

$$
\delta\mathbf i_{\mathrm{total}}
= \left(\mathbf G+j\omega\mathbf C\right)\delta\mathbf v
$$

`bjtRf.js` stamps these terms, terminal resistances and any package L/C elements into a complex nodal system. It solves for the external-port response with the selected reference impedance, producing all nine entries of the three-port S-matrix. Each `.spars` row therefore has ten entries: the frequency followed by the nine complex S-parameters in matrix row order. `nodal()` then applies the external connections to produce the circuit's S-parameters.

`.smallSignal` exposes `gm`, `gpi`, `gmu` and `go` in siemens; `cpi`, `cmu` and the cross-charge derivative `cbeCross` in farads; and terminal resistances `rb`, `rc`, `re` in ohms. For the selected point above, `gm` is about **115.965 mS**. The familiar forward-active estimate $g_m\approx I_C/V_T$, with $V_T=k_BT/q$, is a useful approximation; the implementation uses derivatives of the full model.

## Let an external network determine the bias

An explicit `V()` supply and a supported transistor network select automatic DC-before-RF analysis. The solver first estimates the bias using a simple fixed-VBE/constant-beta model, then refines it with damped Newton iteration using the nonlinear transistor equations. The simplified estimate is the starting point for the refined solution.

This example uses a 12 V supply, a 100 kΩ/22 kΩ divider, a 2.2 kΩ collector resistor and a 1 kΩ emitter resistor bypassed by 10 nF. The two coupling capacitors are also 10 nF. No final `qPoint` is supplied:

```js
var g = nP.global();
g.Ro = 50;
g.Temp = 293;
var frequencies = g.fGen(1e6, 100e6, 51);
g.fList = frequencies;

var q1 = nP.NPN({model: '2N3904'});
var v1 = nP.V(12);
var r1 = nP.R(100e3);
var r2 = nP.R(22e3);
var r3 = nP.R(2.2e3);
var rc1 = nP.sePaRC(1e3, 10e-9);
var c1 = nP.C(10e-9);
var c2 = nP.C(10e-9);
var t1 = nP.Tee4();
var t2 = nP.Tee();
var t3 = nP.Tee();
var short1 = nP.Short();

var amplifier = nP.nodal(
    [c1, 6, 10],
    [t1, 11, 10, 12, 13],
    [r1, 14, 11],
    [r2, 12, 15],
    [short1, 15],
    [q1, 13, 20, 30],
    [t2, 21, 20, 22],
    [r3, 23, 21],
    [c2, 22, 7],
    [rc1, 30, 31],
    [short1, 31],
    [t3, 24, 14, 23],
    [v1, 24, 25],
    [short1, 25],
    ['out', 6, 7]
);

var operatingPoint = amplifier.operatingPoint;
var transistorPoint = operatingPoint.components[5].qPoint; // q1 is placement p6
var response = amplifier.out('s11dB', 's21dB');

nP.log(transistorPoint);
nP.schematic(amplifier);
nP.lineChart({inputTable: [response], title: 'Externally biased amplifier', metricPrefix: 'mega'});
```

At DC, coupling and bypass capacitors open; the emitter resistor remains. At RF, the capacitors retain their frequency-dependent impedance. `sePaRC()` places the resistor and bypass capacitor in parallel between its two terminals. `V()` establishes the DC voltage while its positive-frequency RF branch is open. Measurement ports and `Ro` add no DC source or load.

The solved states belong to component **placements** in the network. `nodal()` rebuilds each placed transistor's S-parameters, noise and nonlinear data at its solved point before combining RF. The original `q1` object retains its construction state. The example reads placement `p6`, the sixth component row; use placement paths to distinguish multiple transistors or reused templates. No separate `.solveDC()` call is needed to establish this amplifier's RF bias.

## Noise, distortion and model limits

The same bias-dependent model supplies base/collector shot noise and terminal-resistor thermal noise. These internal sources are transferred to the three external ports, producing a frequency-aligned noise covariance. Measure the completed two-port with `.out('NF21dB', 'noiseFloor')`; noise figure also depends on its source and termination conditions.

With two-tone analysis settings established before component construction, current and charge terms through third order supply weak nonlinear estimates of intermodulation and harmonics. These are direct Taylor-source calculations. The model omits quadratic remixing, large-signal compression and harmonic-balance/transient solving. The supplied cards have no fitted excess low-frequency noise or high-frequency induced-noise correlation model.

For model provenance, equation details and independent SPICE checks, see [Bipolar transistor models](https://github.com/JerryWiltz/nP/blob/master/developmentDocs/transistorModels.md). For supported external DC models and convergence reporting, see [DC analysis](https://github.com/JerryWiltz/nP/blob/master/developmentDocs/dcAnalysis.md). The existing [NPN curve tracer and RF example](./repl.md#example-npn-curve-tracer) remains available in the REPL.
