<!-- Modified: 2026-09-08 -->
# Thermal noise in nP S-parameter networks

This note explains the first nP thermal-noise model using a 75 Ω resistor in a 50 Ω system. It gives the component S-parameter and noise matrices, then shows how `nodal()` and two-port cascade analysis determine the final matrices.

## 1. Port-wave model

At one frequency, a noisy n-port is represented by

$$
\mathbf b = \mathbf S\mathbf a + \mathbf c
$$

where `a` is the incident wave vector, `b` is the outgoing wave vector, and `c` is the internally generated noise-wave vector. The covariance matrix of the noise waves is

$$
\mathbf C = E[\mathbf c\mathbf c^\dagger].
$$

`S` is dimensionless. `C` has units of W/Hz when the waves use power normalization. The dagger denotes conjugate transpose.

## What covariance means

Noise is not a single deterministic number. At each frequency it is a random fluctuation. If a noise-wave entry is written as `c₁`, its average value is normally zero, but its instantaneous value varies from one observation to the next. The quantity that describes the strength of that fluctuation is its **variance**:

$$
\operatorname{var}(c_1)=E[|c_1|^2].
$$

For a real random quantity, variance is the familiar mean-square deviation from the average. For a complex noise wave, `|c₁|² = c₁c₁*`, so the variance is still a real, nonnegative power spectral density.

**Covariance** describes how two fluctuations vary together. For two complex noise waves `c₁` and `c₂`, their covariance is

$$
\operatorname{cov}(c_1,c_2)=E[c_1c_2^*].
$$

The conjugate is important. It makes the covariance matrix Hermitian and makes each diagonal entry a real nonnegative noise power. The magnitude of an off-diagonal covariance indicates how strongly the two port-noise waves are related; its phase describes their relative phase. A zero off-diagonal entry means the two noise waves are uncorrelated, not necessarily that they are numerically zero.

For an n-port, collect all noise waves into a column vector:

$$
\mathbf c=
\begin{pmatrix}c_1\\c_2\\\vdots\\c_n\end{pmatrix}.
$$

The **covariance matrix** is the expected outer product:

$$
\mathbf C=E[\mathbf c\mathbf c^\dagger].
$$

For a two-port this is:

$$
\mathbf C=
\begin{pmatrix}
E[|c_1|^2] & E[c_1c_2^*]\\
E[c_2c_1^*] & E[|c_2|^2]
\end{pmatrix}.
$$

Read the entries as follows:

| Entry | Meaning | Units |
| --- | --- | --- |
| `C11` | Noise power spectral density at port 1 | W/Hz |
| `C22` | Noise power spectral density at port 2 | W/Hz |
| `C12` | Correlation of port-1 noise with port-2 noise | W/Hz |
| `C21` | Conjugate of `C12` for a valid covariance matrix | W/Hz |

The matrix must be **Hermitian** (`C = C†`) and **positive semidefinite**. Positive semidefinite means that any physically formed combination of the noise waves has nonnegative power. For any complex weighting vector `w`:

$$
E[|\mathbf w^\dagger\mathbf c|^2]=\mathbf w^\dagger\mathbf C\mathbf w\ge 0.
$$

This is why nP preserves off-diagonal entries instead of keeping only `C11`, `C22`, and so on. A network can mix noise waves from several ports; discarding their covariance can give the wrong output noise.

For the 75 Ω series resistor, nP obtains:

$$
\mathbf C_R=\frac{24}{49}k_BT
\begin{pmatrix}1&-1\\-1&1\end{pmatrix}.
$$

The two diagonal entries are the individual port-noise powers. The negative off-diagonal entries mean the two outgoing noise waves are perfectly anticorrelated in this representation. If the entries had been positive instead, the waves would be perfectly correlated with the same phase. A complex off-diagonal entry would represent correlation with a phase shift.

Covariance is a **spectral density**, not automatically a finite-band noise power. If the covariance is approximately constant over bandwidth `B`, multiply by `B` to obtain the integrated mean-square noise-wave power:

$$
\mathbf C_{\text{band}}\approx B\mathbf C.
$$

No random samples need to be generated for this analysis. nP propagates the covariance algebraically through the network.

For a passive component at uniform temperature `T`, nP uses Bosma's relation:

$$
\boxed{\mathbf C = k_BT(\mathbf I - \mathbf S\mathbf S^\dagger)}
$$

where `kB = 1.380649 × 10⁻²³ J/K`. Lossless components have `C = 0`. Off-diagonal entries retain noise correlation between ports.

## 2. A 75 Ω series resistor

Let the resistor be `R = 75 Ω` and both port reference impedances be `Z0 = 50 Ω`. Its S-matrix is

$$
\mathbf S_R = \frac{1}{R+2Z_0}
\begin{pmatrix}
R & 2Z_0\\
2Z_0 & R
\end{pmatrix}
=
\begin{pmatrix}
3/7 & 4/7\\
4/7 & 3/7
\end{pmatrix}.
$$

Numerically:

$$
\mathbf S_R \approx
\begin{pmatrix}
0.428571 & 0.571429\\
0.571429 & 0.428571
\end{pmatrix}.
$$

Using Bosma's relation:

$$
\mathbf C_R = \frac{24}{49}k_BT
\begin{pmatrix}
1 & -1\\
-1 & 1
\end{pmatrix}.
$$

At `T = 293 K`, each diagonal entry is approximately `1.981e-21 W/Hz`. The negative off-diagonal entries indicate perfectly anticorrelated outgoing noise waves for this series-resistor representation.

The constructor retains the existing S-parameter data and adds frequency-aligned covariance data:

```js
var resistor = nP.R(75);

resistor.spars; // existing [frequency, s11, s12, s21, s22] rows
resistor.noise; // [{frequency, C: [[c11, c12], [c21, c22]]}, ...]
```

`R(75)` and `seR(75)` preserve their legacy positional calls. An options form can specify temperature explicitly:

```js
var hotResistor = nP.R({
    resistance: 75,
    temperature: 350
});
```

## 3. Two 75 Ω resistors in series with `nodal()`

The series connection is written with one shared internal node:

```js
var r1 = nP.R(75);
var r2 = nP.R(75);

var series = nP.nodal(
    [r1, 1, 2],
    [r2, 2, 3],
    ['out', 1, 3]
);
```

There are six wave variables in the assembled system:

```text
2 ports from r1 + 2 ports from r2 + 2 output bookkeeping ports = 6
```

Therefore `nodal()` assembles and solves a 6×6 complex matrix. The resulting external two-port is equivalent to a 150 Ω series resistor:

$$
\mathbf S_{\mathrm{series}} =
\begin{pmatrix}
0.6 & 0.4\\
0.4 & 0.6
\end{pmatrix}.
$$

The two component covariance matrices are not simply added. Internal reflections load each resistor's noise. The transfer matrices are

$$
\mathbf F_A=
\begin{pmatrix}1&0.3\\0&0.7\end{pmatrix},
\qquad
\mathbf F_B=
\begin{pmatrix}0.7&0\\0.3&1\end{pmatrix}.
$$

The final covariance is

$$
\mathbf C_{\mathrm{series}}
= \mathbf F_A\mathbf C_{r1}\mathbf F_A^\dagger
 + \mathbf F_B\mathbf C_{r2}\mathbf F_B^\dagger
= 0.48k_BT
\begin{pmatrix}
1 & -1\\
-1 & 1
\end{pmatrix}.
$$

This is exactly the passive covariance of a single 150 Ω series resistor. In code:

```js
var noiseTable = series.noiseOut('c11', 'c22', 'c12Re');
```

The internal transfer matrix and component-source bookkeeping remain hidden inside `nodal()`.

## 4. The same result through two-port cascade

For two 2-port components, `cascade()` uses the same S-parameter cascade equations and propagates each component's covariance. For components `A` and `B`, with

$$
D = 1-A_{22}B_{11},
$$

the noise transfer matrices are

$$
\mathbf F_A=
\begin{pmatrix}
1 & A_{12}B_{11}/D\\
0 & B_{21}/D
\end{pmatrix},
\qquad
\mathbf F_B=
\begin{pmatrix}
A_{12}/D & 0\\
B_{21}A_{22}/D & 1
\end{pmatrix}.
$$

The cascade covariance is

$$
\boxed{\mathbf C_C = \mathbf F_A\mathbf C_A\mathbf F_A^\dagger + \mathbf F_B\mathbf C_B\mathbf F_B^\dagger.}
$$

For example:

```js
var cascaded = nP.cascade(
    nP.R(75),
    nP.R(75)
);

var sTable = cascaded.out('s11dB', 's21dB');
var cTable = cascaded.noiseOut('c11', 'c22');
```

For compatible two-port networks, `cascade()` and an equivalent `nodal()` connection produce the same S and C matrices. `cascade()` is a specialized, efficient path; `nodal()` handles arbitrary interconnections and multiports.

## 5. Parallel 75 Ω resistor

The parallel resistor is represented by `paR(75)`, or by a Tee, series resistor, and short:

```js
var shunt = nP.nodal(
    [nP.Tee(), 3, 1, 2],
    [nP.R(75), 3, 4],
    [nP.Short(), 4],
    ['out', 1, 2]
);
```

Its longhand S-matrix is

$$
\mathbf S_{pR} =
\begin{pmatrix}
-0.25 & 0.75\\
0.75 & -0.25
\end{pmatrix},
$$

and its covariance is

$$
\mathbf C_{pR}=0.375k_BT
\begin{pmatrix}
1 & 1\\
1 & 1
\end{pmatrix}.
$$

The Tee constructor contains a small `1e-7` regularization, so the nodal result differs from the exact longhand values by approximately `1e-7` while remaining within the model's intended numerical tolerance.

## 6. What the user needs to know

Users continue to build circuits with `R()`, `Tee()`, `Short()`, `nodal()`, and `cascade()` exactly as before. Noise is an additional result; S-parameter row shapes and `.out()` behavior are unchanged.

Use:

```js
network.noiseOut('c11', 'c22');
```

to obtain output-port noise power spectral densities. Use `c12Re`, `c12Im`, or `c12mag` when port-to-port noise correlation is needed. The raw covariance matrices are available as `network.noise.covariance` for advanced work.

For active components, S-parameters and temperature alone do not determine noise. An active constructor must provide an explicit noise covariance model; `nodal()` can then propagate it using the same equations.
