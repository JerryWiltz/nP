<!-- Modified: 2026-10-21 -->
# S-parameters for the novice

S-parameters describe how a circuit responds to waves arriving at its ports. At RF frequencies, they answer two useful questions: **how much of an incident wave returns to its source, and how much emerges from another port?** Each S-parameter is a complex ratio, so it carries both magnitude and phase. It has no units and generally changes with frequency.

## What the four numbers mean

For a two-port circuit, let $a_1$ and $a_2$ be waves traveling **into** ports 1 and 2, and $b_1$ and $b_2$ be waves traveling **out**. Their relationship at one frequency is:

$$
\begin{aligned}
b_1 &= S_{11}a_1 + S_{12}a_2 \\[0.6em]
b_2 &= S_{21}a_1 + S_{22}a_2
\end{aligned}
$$

| Parameter | Meaning | Measurement condition |
| --- | --- | --- |
| $S_{11}$ | Reflection seen at port 1 | $b_1/a_1$ with $a_2=0$ |
| $S_{21}$ | Transmission from port 1 to port 2 | $b_2/a_1$ with $a_2=0$ |
| $S_{12}$ | Transmission from port 2 to port 1 | $b_1/a_2$ with $a_1=0$ |
| $S_{22}$ | Reflection seen at port 2 | $b_2/a_2$ with $a_1=0$ |

Setting $a_2=0$ means port 2 is terminated in its **reference impedance**, so no wave arrives from that port. It does not mean that the voltage at port 2 is zero. Here the reference impedance is $50\,\Omega$ at **both** ports. For background on incident and reflected waves, see the [Rohde & Schwarz S-parameter primer](https://scdn.rohde-schwarz.com/ur/pws/dl_downloads/dl_application/application_notes/1gp70/1GP70_0E.pdf).

## Hand calculation: a 5 nH inductor at 2 GHz

`nP.L()` models an **ideal series inductor** between two ports:

```text
50 Ω reference          L = 5 nH          50 Ω reference
    port 1 ─────────────[ inductor ]───────────── port 2
```

First calculate its impedance at $f=2\times10^9\,\mathrm{Hz}$:

$$
\begin{aligned}
\omega &= 2\pi f \\[0.6em]
       &= 12.566370614\times10^9\,\mathrm{rad/s} \\[0.6em]
Z &= \mathrm{j}\omega L \\[0.6em]
  &= \mathrm{j}(2\pi)(2\times10^9)(5\times10^{-9}) \\[0.6em]
  &= \mathrm{j}62.831853072\,\Omega \\[0.6em]
Z_0 &= 50\,\Omega \\[0.6em]
2Z_0 &= 100\,\Omega
\end{aligned}
$$

To see where the S-parameter formulas come from, send a voltage wave $V_+$ into port 1 while port 2 is matched. Call the reflected wave $V_-$ and the transmitted wave $V_{\mathrm{t}}$. The same current flows through the series inductor and the port 2 termination:

$$
\begin{aligned}
I &= \frac{V_+-V_-}{Z_0} \\[0.6em]
I &= \frac{V_{\mathrm{t}}}{Z_0} \\[0.6em]
V_{\mathrm{t}} &= V_+-V_- \\[0.6em]
ZI &= (V_++V_-)-V_{\mathrm{t}} \\[0.6em]
2V_- &= \frac{Z}{Z_0}(V_+-V_-)
\end{aligned}
$$

Solving for the two wave ratios gives the same formulas used by `L.js`:

$$
\begin{aligned}
S_{11} &= \frac{V_-}{V_+} \\[0.6em]
       &= \frac{Z}{Z+2Z_0} \\[0.6em]
S_{21} &= \frac{V_{\mathrm{t}}}{V_+} \\[0.6em]
       &= \frac{2Z_0}{Z+2Z_0}
\end{aligned}
$$

The circuit is symmetric and reciprocal, so $S_{22}=S_{11}$ and $S_{12}=S_{21}$. Now substitute the impedance and multiply each fraction by the complex conjugate of its denominator:

$$
\begin{aligned}
D &= 100+\mathrm{j}62.831853072 \\[0.6em]
|D|^2 &= 100^2+62.831853072^2 \\[0.6em]
      &= 13947.841760436
\end{aligned}
$$

$$
\begin{aligned}
S_{11} &= \frac{\mathrm{j}62.831853072}{D} \\[0.6em]
       &= \frac{62.831853072^2+\mathrm{j}(100)(62.831853072)}{|D|^2} \\[0.6em]
       &= 0.283043200+\mathrm{j}0.450477243
\end{aligned}
$$

$$
\begin{aligned}
S_{21} &= \frac{100}{D} \\[0.6em]
       &= \frac{100^2-\mathrm{j}(100)(62.831853072)}{|D|^2} \\[0.6em]
       &= 0.716956800-\mathrm{j}0.450477243
\end{aligned}
$$

Thus, at 2 GHz:

| Parameter | Complex value | Magnitude | Magnitude in dB |
| --- | ---: | ---: | ---: |
| $S_{11}=S_{22}$ | $0.283043+\mathrm{j}0.450477$ | $0.532018$ | $-5.481\,\mathrm{dB}$ |
| $S_{21}=S_{12}$ | $0.716957-\mathrm{j}0.450477$ | $0.846733$ | $-1.445\,\mathrm{dB}$ |

The dB values are $20\log_{10}|S|$. With matched reference impedances, the reflected and transmitted **power fractions** are $|S_{11}|^2=0.283043$ and $|S_{21}|^2=0.716957$. They sum to 1 because this model has no resistance. The negative $S_{21}$ dB value comes from reflection, not dissipative loss.

## How `nP.L()` builds the nPort

The public `nP.L()` constructor uses `src/np-nport/src/rlc/L.js`. It reads the selected analysis frequencies and reference impedance, creates a two-port `nPort`, and repeats the calculation for every frequency. The essential steps are:

```js
var lPort = new nPort;
var settings = componentSettings(global, options);
var frequencyList = analysisFrequencies(settings);
var Zo = complex(global.Ro, 0);
var two = complex(2, 0);
var sparsArray = [];

for (var i = 0; i < frequencyList.length; i++) {
  var Z = complex(0, 2 * Math.PI * L * frequencyList[i]);
  var s11 = Z.div(Z.add(Zo.add(Zo)));
  var s21 = two.mul(Zo).div(Z.add(Zo.add(Zo)));
  var s12 = s21;
  var s22 = s11;
  sparsArray[i] = [frequencyList[i], s11, s12, s21, s22];
}

lPort.setspars(sparsArray);
lPort.setglobal(settings);
return lPort;
```

`complex(0, ...)` represents the inductor's $\mathrm{j}\omega L$. The complex arithmetic methods perform the same divisions as the hand calculation. Each `.spars` row contains the frequency followed by four **complex** S-parameters in the order `[frequency, s11, s12, s21, s22]`. `setglobal(settings)` records the analysis settings on the returned nPort. With one frequency in `fList`, the nPort has one row; with a sweep, it has one row per frequency.

Try the 2 GHz case in nPort:

```js
var g = nP.global;
g.Ro = 50;
g.fList = [2e9];

var l1 = nP.L(5e-9);
var sParameters = l1.out('s11Re', 's11Im', 's21Re', 's21Im', 's11dB', 's21dB');
nP.log(sParameters);
```

`sParameters` is a numeric table headed by `Freq` and the requested selectors. Its single data row agrees with the values above. The `nPort` itself retains the complex values in `l1.spars[0]`; `.out(...)` extracts numbers suitable for a chart or table. See the [nPort object guide](./nport-object.md) for more output selectors.

Continue with [nPort overview](./tech-notes-nport-overview.md) to see how component nPorts become a circuit model.
