<!-- Modified: 2026-09-09 -->
# Thermal noise in nP: resistor, `nodal()`, and `cascade()`

## Purpose

This note defines each mathematical term before using it, then works one
75 Ω resistor numerically and connects two such resistors. It explains how
`R.js` creates S-parameters and covariance, and how `nodal()` and `cascade()`
propagate the result. `Gamma` is wiring only; covariance never enters it.

## 1. Terms

An RF complex quantity has two real components:

$$z=x+j y.\tag{1}$$

`x` is in-phase, `y` is quadrature, and `j²=-1`. The imaginary part records
phase; it is not imaginary physical power.

A two-port noise column is:

$$\mathbf c=\begin{bmatrix}c_1\\c_2\end{bmatrix}.\tag{2}$$

The conjugate changes `j` to `-j`. The conjugate transpose (`†`) also changes
a column into a row:

$$\mathbf c^\dagger=\begin{bmatrix}c_1^*&c_2^*\end{bmatrix}.\tag{3}$$

An **outer product** is column times row. It creates a matrix:

$$
\mathbf c\mathbf c^\dagger=
\begin{bmatrix}c_1c_1^*&c_1c_2^*\\c_2c_1^*&c_2c_2^*\end{bmatrix}.
\tag{4}
$$

`E{}` means expected value: average over possible noise outcomes. For two
equally likely outcomes:

$$E\{X\}=\tfrac12X^{(A)}+\tfrac12X^{(B)}.\tag{5}$$

The covariance matrix is the expected outer product:

$$\mathbf C=E\{\mathbf c\mathbf c^\dagger\}.\tag{6}$$

Thus:

$$\mathbf C=\begin{bmatrix}C_{11}&C_{12}\\C_{21}&C_{22}\end{bmatrix},
\qquad C_{ik}=E\{c_i c_k^*\}.\tag{7}$$

`C11` and `C22` are noise power spectral densities. `C12` and `C21` describe
correlation. In nP's power-wave convention, they have units of W/Hz.

## 2. One resistor: what `R.js` creates

Set the analysis conditions and construct the resistor:

```js
nP.global.Ro = 50;
nP.global.Temp = 293;
nP.global.fList = [1e9];
var r = nP.R(75);
```

`R.js` calculates:

$$
S_{11}=S_{22}=\frac{R}{R+2R_o},\qquad
S_{12}=S_{21}=\frac{2R_o}{R+2R_o}.
\tag{8}
$$

For 75 Ω and 50 Ω:

$$
\mathbf S_R=\frac1{175}\begin{bmatrix}75&100\\100&75\end{bmatrix}
=\frac17\begin{bmatrix}3&4\\4&3\end{bmatrix}.
\tag{9}
$$

The resistor noise scalar is:

$$n_R=\frac{4k_BT R R_o}{(R+2R_o)^2}=1.9813722\times10^{-21}\ \mathrm{W/Hz}.
\tag{10}$$

`R.js` stores:

$$\mathbf C_R=n_R\begin{bmatrix}1&-1\\-1&1\end{bmatrix}.\tag{11}$$

Therefore `C11 = +nR`, `C12 = -nR`, `C21 = -nR`, and `C22 = +nR`.

### Literal calculation of `E{}`

Let `rN = sqrt(nR)`. Use two equally likely illustrative outcomes:

$$\mathbf c^{(A)}=\begin{bmatrix}+r_N\\-r_N\end{bmatrix},\qquad
\mathbf c^{(B)}=\begin{bmatrix}-r_N\\+r_N\end{bmatrix}.\tag{12}$$

For outcome A:

$$
\mathbf c^{(A)}\mathbf c^{(A)\dagger}
=\begin{bmatrix}r_N^2&-r_N^2\\-r_N^2&r_N^2\end{bmatrix}
=n_R\begin{bmatrix}1&-1\\-1&1\end{bmatrix}.
\tag{13}
$$

Outcome B gives the same matrix. Now apply the definition of expectation:

$$
\begin{aligned}
\mathbf C_R
&=E\{\mathbf c\mathbf c^\dagger\}\\
&=\tfrac12\left(n_R\begin{bmatrix}1&-1\\-1&1\end{bmatrix}\right)
 +\tfrac12\left(n_R\begin{bmatrix}1&-1\\-1&1\end{bmatrix}\right)\\
&=n_R\begin{bmatrix}1&-1\\-1&1\end{bmatrix}.
\end{aligned}
\tag{14}
$$

This is exactly what `E{}` means: calculate `c c†` for each outcome, weight
by its probability, and add. `R.js` stores the result directly instead of
generating random samples.

## 3. Two resistors with `nodal()`

```js
var series = nP.nodal(
    [nP.R(75), 1, 2],
    [nP.R(75), 2, 3],
    ['out', 1, 3]
);
```

There are four component wave positions and two external bookkeeping
positions:

$$\mathbf a=\begin{bmatrix}a_1\\a_2\\a_3\\a_4\\a_5\\a_6\end{bmatrix},\quad
\mathbf b=\begin{bmatrix}b_1\\b_2\\b_3\\b_4\\b_5\\b_6\end{bmatrix},\quad
\mathbf c=\begin{bmatrix}c_1\\c_2\\c_3\\c_4\\0\\0\end{bmatrix}.\tag{15}$$

The expanded component covariance is:

$$\mathbf C_{\mathrm{components}}=n_R\begin{bmatrix}
1&-1&0&0\\-1&1&0&0\\0&0&1&-1\\0&0&-1&1
\end{bmatrix}.\tag{16}$$

`Gamma` contains only wiring:

$$\boldsymbol\Gamma=\begin{bmatrix}
0&0&0&0&1&0\\0&0&1&0&0&0\\0&1&0&0&0&0\\
0&0&0&0&0&1\\1&0&0&0&0&0\\0&0&0&1&0&0
\end{bmatrix}.\tag{17}$$

The deterministic matrix is:

$$\mathbf A=\boldsymbol\Gamma-\mathbf S_{\mathrm{global}}.\tag{18}$$

`nodal()` computes `A⁻¹` once per frequency. It does not invert
`C_components`. For S-parameters, both external excitations can be handled
as right-hand-side columns:

$$\mathbf Q=\begin{bmatrix}1&0\\0&1\end{bmatrix},\qquad
\text{solutions}=\mathbf A^{-1}\mathbf Q.\tag{19}$$

For noise, let `T` be the selected output rows of `A⁻¹`:

$$\mathbf C_{\mathrm{out}}=\mathbf T\mathbf C_{\mathrm{components}}\mathbf T^\dagger.\tag{20}$$

The same inverse is reused. `A⁻¹` transfers sources; `C_components` gives
source strength and correlation; `C_out` is the result. No second inversion
is required for another port or another source column.

For two 75 Ω resistors, the result is an equivalent 150 Ω resistor:

$$\mathbf S_{\mathrm{out}}=\begin{bmatrix}0.6&0.4\\0.4&0.6\end{bmatrix},\qquad
\mathbf C_{\mathrm{out}}=0.48k_BT\begin{bmatrix}1&-1\\-1&1\end{bmatrix}.\tag{21}$$

## 4. Two resistors with `cascade()`

`cascade()` is the specialized two-port path. For components `A` and `B`:

$$\mathbf b_A=\mathbf S_A\mathbf a_A+\mathbf c_A,\qquad
\mathbf b_B=\mathbf S_B\mathbf a_B+\mathbf c_B.\tag{22}$$

The internal waves satisfy:

$$a_{A2}=b_{B1},\qquad a_{B1}=b_{A2}.\tag{23}$$

The feedback denominator is:

$$D=1-A_{22}B_{11}.\tag{24}$$

The cascaded S-parameters are:

$$\begin{aligned}
S_{11}&=A_{11}+\frac{A_{12}B_{11}A_{21}}D,&S_{12}&=\frac{A_{12}B_{12}}D,\\
S_{21}&=\frac{A_{21}B_{21}}D,&S_{22}&=B_{22}+\frac{B_{21}A_{22}B_{12}}D.
\end{aligned}\tag{25}$$

Noise from each component is transferred by:

$$\mathbf F_A=\begin{bmatrix}1&A_{12}B_{11}/D\\0&B_{21}/D\end{bmatrix},\qquad
\mathbf F_B=\begin{bmatrix}A_{12}/D&0\\B_{21}A_{22}/D&1\end{bmatrix}.\tag{26}$$

For independent component noises:

$$\mathbf C_C=\mathbf F_A\mathbf C_A\mathbf F_A^\dagger+
\mathbf F_B\mathbf C_B\mathbf F_B^\dagger.\tag{27}$$

The transfer matrices account for loading and reflection. Therefore one must
not simply add `C_A + C_B`.

```js
var cascaded = nP.cascade(nP.R(75), nP.R(75));
var cTable = cascaded.noiseOut('c11', 'c22');
```

`cascade()` and the equivalent `nodal()` connection produce the same S and C
matrices for compatible two-port networks.
