<!-- Modified: 2026-10-03 -->
# Gupta matrices and intermodulation analysis

This note uses a six-variable attenuator-amplifier network to develop nP's
**one-pass, weak-nonlinearity** intermodulation analysis. Sections
1–4 establish the linear connection solve. Section 5 derives amplifier
coefficients from supplied OIP2 and OIP3; section 6 applies two tones; section
7 describes the initial Amp, Attn, nodal, and cascade implementation.

The polynomial expansion in section 5 identifies the generated frequencies
and amplitudes. Gupta's S-matrix solve then propagates those products through
the network. A linear S-matrix alone cannot create them. Full harmonic
balance and time-domain/FFT analysis are other approaches, retained in
Appendices A and B rather than in the one-pass development.

## 1. Gupta's equations 11.9–11.17: the connection-scattering method

Gupta begins with a network of multiport components and independent generators. For component i, with incoming-wave column aᵢ and outgoing-wave column bᵢ, his component relation is

$$
\mathbf b_i = \mathbf S_i\mathbf a_i. \tag{1.1}
$$
<div align="right">Gupta (11.9)</div>

An independent generator is represented by

$$
\mathbf b_g = \mathbf S_g\mathbf a_g + \mathbf c_g. \tag{1.2}
$$
<div align="right">Gupta (11.10)</div>

The final term is the wave impressed by that generator. For an isolated or matched generator, Gupta notes that its S matrix is zero.

Putting all component relations together gives

$$
\mathbf b = \mathbf S\mathbf a + \mathbf c. \tag{1.3}
$$
<div align="right">Gupta (11.11)</div>

The columns and block-diagonal component matrix are

$$
\mathbf a=\begin{bmatrix}a_1\\a_2\\\vdots\\a_m\end{bmatrix},\qquad
\mathbf b=\begin{bmatrix}b_1\\b_2\\\vdots\\b_m\end{bmatrix},\qquad
\mathbf c=\begin{bmatrix}c_1\\c_2\\\vdots\\c_m\end{bmatrix}. \tag{1.4}
$$

$$
\mathbf S=
\begin{bmatrix}
\mathbf S_1&\mathbf 0&\cdots&\mathbf 0\\
\mathbf 0&\mathbf S_2&\cdots&\mathbf 0\\
\vdots&\vdots&\ddots&\vdots\\
\mathbf 0&\mathbf 0&\cdots&\mathbf S_m
\end{bmatrix}. \tag{1.5}
$$
<div align="right">Gupta (11.12)</div>

The zero entries are null submatrices. Equation (1.3) describes the individual components, but does not yet enforce their interconnections.

For two equally normalized ports j and k, the outgoing wave at one port is the incoming wave at the other:

$$
a_j=b_k,\qquad a_k=b_j. \tag{1.6}
$$

or

$$
\begin{bmatrix}a_j\\a_k\end{bmatrix}
=\begin{bmatrix}0&1\\1&0\end{bmatrix}
\begin{bmatrix}b_j\\b_k\end{bmatrix}. \tag{1.7}
$$
<div align="right">Gupta (11.13)</div>

For unequal normalizations, the entries of this two-port connection matrix are obtained from the inverse S-matrix of the junction. Writing all connection relations together gives Gupta's connection matrix

$$
\mathbf b=\boldsymbol\Gamma\mathbf a. \tag{1.8}
$$
<div align="right">Gupta (11.14)</div>

Each row of Gamma contains zeros except for the entry that identifies the port to which that row's port is connected. With equal reference impedances, those connection entries are 1.

Substitution of (1.8) into (1.3) gives

$$
\boldsymbol\Gamma\mathbf a=\mathbf S\mathbf a+\mathbf c. \tag{1.9}
$$

$$
(\boldsymbol\Gamma-\mathbf S)\mathbf a=\mathbf c. \tag{1.10}
$$
<div align="right">Gupta (11.15)</div>

Gupta sets

$$
\mathbf W=\boldsymbol\Gamma-\mathbf S. \tag{1.11}
$$
<div align="right">Gupta (11.16)</div>

so that

$$
\mathbf a=\mathbf W^{-1}\mathbf c. \tag{1.12}
$$
<div align="right">Gupta (11.17)</div>

Here c is the column of impressed waves, and Gupta calls W the **connection scattering matrix**. Its diagonal entries are the negative component reflection coefficients, its same-component off-diagonal entries are negative component transmission coefficients, and its connection entries come from Gamma.

The complete sequence is therefore

$$
\mathbf b=\mathbf S\mathbf a+\mathbf c,\qquad
\mathbf b=\boldsymbol\Gamma\mathbf a,\qquad
\mathbf W=\boldsymbol\Gamma-\mathbf S,\qquad
\mathbf a=\mathbf W^{-1}\mathbf c. \tag{1.13}
$$

After solving for the incoming waves, Gupta obtains the outgoing waves from
equation (1.8). Solving for each basis-source column gives the corresponding
column of the inverse in equation (1.12).

## 2. Gupta's eight-variable example: equations 11.28–11.31

Gupta's page-347 example has component (A) (two ports), component (B) (three ports), component (C) (one port), and two matched one-port external generators. The generators are

$$
b_7=c_1,\qquad b_8=c_2. \tag{2.1}
$$
<div align="right">Gupta (11.28a,b)</div>

The complete component relation is

$$
\begin{bmatrix}
 b_1\\b_2\\b_3\\b_4\\b_5\\b_6\\b_7\\b_8
\end{bmatrix}
=
\begin{bmatrix}
 S^A_{11}&S^A_{12}&0&0&0&0&0&0\\
 S^A_{21}&S^A_{22}&0&0&0&0&0&0\\
 0&0&S^B_{11}&S^B_{12}&S^B_{13}&0&0&0\\
 0&0&S^B_{21}&S^B_{22}&S^B_{23}&0&0&0\\
 0&0&S^B_{31}&S^B_{32}&S^B_{33}&0&0&0\\
 0&0&0&0&0&S^C&0&0\\
 0&0&0&0&0&0&0&0\\
 0&0&0&0&0&0&0&0
\end{bmatrix}
\begin{bmatrix}
 a_1\\a_2\\a_3\\a_4\\a_5\\a_6\\a_7\\a_8
\end{bmatrix}
+
\begin{bmatrix}0\\0\\0\\0\\0\\0\\c_1\\c_2\end{bmatrix}. \tag{2.2}
$$
<div align="right">Gupta (11.29)</div>

For this example the interconnection matrix is

$$
\begin{bmatrix}
 b_1\\b_2\\b_3\\b_4\\b_5\\b_6\\b_7\\b_8
\end{bmatrix}
=
\begin{bmatrix}
0&0&0&0&0&0&1&0\\
0&0&1&0&0&0&0&0\\
0&1&0&0&0&0&0&0\\
0&0&0&0&0&0&0&1\\
0&0&0&0&0&1&0&0\\
0&0&0&0&1&0&0&0\\
1&0&0&0&0&0&0&0\\
0&0&0&1&0&0&0&0
\end{bmatrix}
\begin{bmatrix}
 a_1\\a_2\\a_3\\a_4\\a_5\\a_6\\a_7\\a_8
\end{bmatrix}. \tag{2.3}
$$
<div align="right">Gupta (11.30)</div>

Subtracting the component matrix in (2.2) from the connection matrix in (2.3), and using (1.12), gives the next equation:

$$
\begin{bmatrix}
 a_1\\a_2\\a_3\\a_4\\a_5\\a_6\\a_7\\a_8
\end{bmatrix}
=
\begin{bmatrix}
 -S^A_{11}&-S^A_{12}&0&0&0&0&1&0\\
 -S^A_{21}&-S^A_{22}&1&0&0&0&0&0\\
 0&1&-S^B_{11}&-S^B_{12}&-S^B_{13}&0&0&0\\
 0&0&-S^B_{21}&-S^B_{22}&-S^B_{23}&0&0&1\\
 0&0&-S^B_{31}&-S^B_{32}&-S^B_{33}&1&0&0\\
 0&0&0&0&1&-S^C&0&0\\
 1&0&0&0&0&0&0&0\\
 0&0&0&1&0&0&0&0
\end{bmatrix}^{-1}
\begin{bmatrix}0\\0\\0\\0\\0\\0\\c_1\\c_2\end{bmatrix}. \tag{2.4}
$$
<div align="right">Gupta (11.31)</div>

The source column in (2.4) has six zeros followed by the two impressed
generator waves. The generator relations are in (2.1). The last two rows of
the connection matrix (2.3) show that those waves enter the two external
component ports.

The corresponding outgoing waves are b₁ and b₄. By the definition of the overall two-port S-matrix,

$$
\begin{bmatrix}b_1\\b_4\end{bmatrix}
=
\begin{bmatrix}S_{11}&S_{12}\\S_{21}&S_{22}\end{bmatrix}
\begin{bmatrix}a_1\\a_4\end{bmatrix}. \tag{2.5}
$$

For the forward test, Gupta excites the first source with a unit wave and
leaves the second source unexcited. This puts a 1 at position 7 of the
eight-entry source column and zeros everywhere else. The inverse remains
8 × 8; multiplying it by the 8 × 1 source column gives the incoming-wave
column. Equation (2.3) then gives the outgoing-wave column. Selecting its
two external entries gives the first column of the overall S-matrix:

$$
\begin{bmatrix}b_1\\b_4\end{bmatrix}
=\begin{bmatrix}S_{11}\\S_{21}\end{bmatrix}. \tag{2.6}
$$

Here b₁ is the input reflection S₁₁, and b₄ is the forward transmission S₂₁.

## 3. The six-variable attenuator–amplifier example

This six-variable worked example adapts Gupta's eight-variable example to a matched, reciprocal 3 dB attenuator feeding a semi-ideal amplifier with 20 dB forward gain and an illustrative 4 dB noise figure. The attenuator and amplifier are two-port components; matched external source and load positions bring the wave-column length to six. As in Gupta's example, assemble the component S-matrix, connect the ports with Gamma, solve the connection-scattering system for the incoming waves, and then obtain the outgoing waves used for the overall S-parameters.

This example has a different ordering from Gupta's example:

| Index | Component port or bookkeeping position |
| ---: | --- |
| 1 | Attenuator port 1 |
| 2 | Attenuator port 2 |
| 3 | Amplifier port 1 |
| 4 | Amplifier port 2 |
| 5 | External source position |
| 6 | External load position |

The displayed noninteger values below are rounded to three decimal places; the calculations use unrounded values. The attenuator has zero reflection and approximately 0.708 transmission at each port. The amplifier uses input and output reflections of 0.010, reverse transmission of 0.010, and forward transmission of 10. In the port order above, the block-diagonal component matrix is

$$
\mathbf S\approx
\begin{bmatrix}
0&0.708&0&0&0&0\\
0.708&0&0&0&0&0\\
0&0&0.010&0.010&0&0\\
0&0&10&0.010&0&0\\
0&0&0&0&0&0\\
0&0&0&0&0&0
\end{bmatrix}. \tag{3.1}
$$

Its connection equations are

$$
\begin{aligned}
a_1&=b_5,&a_2&=b_3,&a_3&=b_2,\\
a_4&=b_6,&a_5&=b_1,&a_6&=b_4.
\end{aligned} \tag{3.2}
$$

and its connection matrix is

$$
\boldsymbol\Gamma=
\begin{bmatrix}
0&0&0&0&1&0\\
0&0&1&0&0&0\\
0&1&0&0&0&0\\
0&0&0&0&0&1\\
1&0&0&0&0&0\\
0&0&0&1&0&0
\end{bmatrix}. \tag{3.3}
$$

Subtracting the populated S matrix from Gamma gives Gupta's connection-scattering matrix:

$$
\mathbf W=\boldsymbol\Gamma-\mathbf S\approx
\begin{bmatrix}
0&-0.708&0&0&1&0\\
-0.708&0&1&0&0&0\\
0&1&-0.010&-0.010&0&0\\
0&0&-10&-0.010&0&1\\
1&0&0&0&0&0\\
0&0&0&1&0&0
\end{bmatrix}. \tag{3.4}
$$

Invert W. For these component values, its inverse rounds to

$$
\mathbf W^{-1}\approx
\begin{bmatrix}
0&0&0&0&1&0\\
0&0.010&1&0&0.007&0.010\\
0&1&0&0&0.708&0\\
0&0&0&0&0&1\\
1&0.007&0.708&0&0.005&0.007\\
0&10&0&1&7.079&0.010
\end{bmatrix}. \tag{3.5}
$$

The source-to-output transfer matrix is a convenient derived matrix;
Gupta's earlier equations use Gamma and W directly. Here it is

$$
\mathbf T=\boldsymbol\Gamma\mathbf W^{-1}\approx
\begin{bmatrix}
1&0.007&0.708&0&0.005&0.007\\
0&1&0&0&0.708&0\\
0&0.010&1&0&0.007&0.010\\
0&10&0&1&7.079&0.010\\
0&0&0&0&1&0\\
0&0&0&0&0&1
\end{bmatrix}. \tag{3.6}
$$

For the forward test, put a unit impressed wave at source position 5 and zero at every other position. The source column and resulting incoming- and outgoing-wave columns are

$$
\mathbf c=\begin{bmatrix}0\\0\\0\\0\\1\\0\end{bmatrix},\qquad
\mathbf a=\mathbf W^{-1}\mathbf c\approx
\begin{bmatrix}1\\0.007\\0.708\\0\\0.005\\7.079\end{bmatrix},\qquad
\mathbf b=\boldsymbol\Gamma\mathbf a=\mathbf T\mathbf c\approx
\begin{bmatrix}0.005\\0.708\\0.007\\7.079\\1\\0\end{bmatrix}. \tag{3.7}
$$

The external outgoing waves are at positions 1 and 4, giving an input
reflection of about 0.005 and forward transmission of about 7.079. The
outgoing-wave column is the same in both the component and connection
relations; the inverse solves for incoming waves, and Gamma supplies outgoing
waves.

The fifth and sixth columns of T correspond to excitation at the two external source positions. Selecting its first and fourth rows gives the complete external two-port matrix:

$$
\mathbf S_{\mathrm{overall}}\approx
\begin{bmatrix}
0.005&0.007\\
7.079&0.010
\end{bmatrix}. \tag{3.8}
$$

The position-5 source exercises the first column.

## 4. Reusing the inverse

For a frequency-independent demonstration, calculate $\mathbf W^{-1}$ once.
The derived transfer matrix is

$$
\mathbf T=\boldsymbol\Gamma\mathbf W^{-1}. \tag{4.1}
$$

That inverse can be reused for every right-hand side:

$$
\begin{aligned}
\mathbf a_{\mathrm{signal}}&=\mathbf W^{-1}\mathbf c_{\mathrm{signal}},\\
\mathbf a_{\mathrm{noise}}&=\mathbf W^{-1}\mathbf c_{\mathrm{noise}},\\
\mathbf a_{\mathrm{nonlinear}}&=\mathbf W^{-1}
(\mathbf c_{\mathrm{external}}+\mathbf c_{\mathrm{NL}}).
\end{aligned} \tag{4.2}
$$

For a physical frequency-dependent network, calculate one inverse per
retained frequency:

$$
\mathbf W(f_1)^{-1},\quad
\mathbf W(f_2)^{-1},\quad
\mathbf W(f_1+f_2)^{-1},\quad
\mathbf W(f_2-f_1)^{-1}. \tag{4.3}
$$

Each frequency-specific inverse can then be reused during fixed-point
nonlinear iterations because only the right-hand side changes.

## 5. From amplifier OIP2 and OIP3 to nonlinear coefficients

The user supplies the amplifier's gain, noise data, and, when known, its
**output** IP2 and IP3 in dBm. The user does not supply polynomial
coefficients. The noise data are separate from this conversion. An omitted
IP2 or IP3 means that order generates no product. Input tone powers and
phases are chosen for the analysis later; they are not needed to determine
the amplifier coefficients.

For a clear calibration, use the ideal matched, unilateral 20 dB Amp of
section 7. It keeps the six-variable port numbering from section 3, although
section 3's illustrative amplifier has small nonzero reflections and reverse
transmission. The amplifier's linear voltage-wave gain is

$$
g=10^{G_{\mathrm{dB}}/20}=10\qquad
\text{when }G_{\mathrm{dB}}=20\ \mathrm{dB}. \tag{5.1}
$$

First convert the supplied output intercept points to watts:

$$
P_2=10^{(\mathrm{OIP2}_{\mathrm{dBm}}-30)/10}\ \mathrm W,\qquad
P_3=10^{(\mathrm{OIP3}_{\mathrm{dBm}}-30)/10}\ \mathrm W. \tag{5.2}
$$

In the six-variable topology, the wave driving the amplifier is

$$
x_{\mathrm{amp}}=a_3=b_2. \tag{5.3}
$$

Use a simple instantaneous output-wave model. Its linear term belongs in the
amplifier S-matrix; the two nonlinear terms will become generated output
waves:

$$
b_4(t)=g x_{\mathrm{amp}}(t)
+k_2x_{\mathrm{amp}}(t)^2+k_3x_{\mathrm{amp}}(t)^3. \tag{5.4}
$$

Here the waves are normalized so their squared RMS magnitude is power in
watts. Let $X_1$ and $X_2$ be the complex RMS input-wave amplitudes. The
matching linear output amplitudes are $B_1$ and $B_2$:

$$
\begin{aligned}
x_{\mathrm{amp}}(t)&=\sqrt{2}\,\operatorname{Re}\!\left[
X_1e^{j2\pi f_1t}+X_2e^{j2\pi f_2t}\right],\\
B_1&=gX_1,\qquad B_2=gX_2.
\end{aligned} \tag{5.5}
$$

Squaring this two-tone wave creates the sum and difference products. Cubing
it creates the two near-carrier IM3 products. Their complex RMS output waves
are

$$
\begin{aligned}
C_{2,\mathrm{sum}}&=\sqrt{2}\,k_2X_1X_2,&
C_{2,\mathrm{diff}}&=\sqrt{2}\,k_2X_2X_1^*,\\
C_{3,\mathrm{lower}}&=\tfrac32 k_3X_1^2X_2^*,&
C_{3,\mathrm{upper}}&=\tfrac32 k_3X_2^2X_1^*.
\end{aligned} \tag{5.6}
$$

To calibrate the coefficients, consider the standard matched test with equal
**linear output** power $p$ in each fundamental. Squaring the magnitudes of
equation (5.6) gives the product powers:

$$
P_{\mathrm{IM2}}=\frac{2k_2^2}{g^4}p^2,\qquad
P_{\mathrm{IM3}}=\frac{9k_3^2}{4g^6}p^3. \tag{5.7}
$$

The supplied OIP values define where extrapolated product power would meet
extrapolated fundamental power. Therefore they require

$$
P_{\mathrm{IM2}}=\frac{p^2}{P_2},\qquad
P_{\mathrm{IM3}}=\frac{p^3}{P_3}. \tag{5.8}
$$

Equating (5.7) and (5.8) determines the coefficient magnitudes. The initial
Amp model takes $k_2$ positive and $k_3$ negative; that cubic sign represents
the onset of gain compression for positive gain:

$$
\boxed{k_2=\frac{g^2}{\sqrt{2P_2}},\qquad
k_3=-\frac{2g^3}{3P_3}.} \tag{5.9}
$$

For example, a 20 dB Amp specified with OIP2 of 42 dBm and OIP3 of 30 dBm
has

$$
\begin{aligned}
P_2&\approx15.849\ \mathrm W,&P_3&=1\ \mathrm W,\\
k_2&\approx17.762\ \mathrm W^{-1/2},&
k_3&\approx-666.667\ \mathrm W^{-1}.
\end{aligned} \tag{5.10}
$$

The signs are a stated model convention, not information contained in the
IP magnitudes. Once the tone waves are known, equation (5.6) supplies the
nonlinear source at amplifier output position 4. Gupta's linear matrix stays
the same:

$$
\mathbf b=\mathbf S\mathbf a+\mathbf c_{\mathrm{external}}
+\mathbf c_{\mathrm{NL}}(\mathbf a),\qquad
\mathbf W=\boldsymbol\Gamma-\mathbf S. \tag{5.11}
$$

## 6. One-pass second-order calculation

This is a weakly nonlinear, second-order calculation between a purely linear
S-parameter solve and a full harmonic-balance solver.

It applies two equal input tones at:

$$
f_1=1.000\ \mathrm{GHz},\qquad f_2=1.001\ \mathrm{GHz}. \tag{6.1}
$$

First solve the linear Gupta system at each fundamental:

$$
\mathbf a(f_1)=\mathbf W(f_1)^{-1}\mathbf c(f_1),\qquad
\mathbf a(f_2)=\mathbf W(f_2)^{-1}\mathbf c(f_2). \tag{6.2}
$$

Read the amplifier input waves:

$$
x_1=a_3(f_1),\qquad x_2=a_3(f_2). \tag{6.3}
$$

The quadratic term produces second-order sum and difference products. The
RMS wave convention in equation (5.5) gives

$$
\begin{aligned}
c_{\mathrm{NL},4}(f_1+f_2)&=\sqrt{2}\,k_2x_1x_2,\\
c_{\mathrm{NL},4}(f_2-f_1)&=\sqrt{2}\,k_2x_2x_1^*.
\end{aligned} \tag{6.4}
$$

The conjugate in the difference product preserves the relative tone phase.
The value of $k_2$ comes from the supplied OIP2 through equation (5.9).

Next solve the linear Gupta system once for each generated source:

$$
\begin{aligned}
\mathbf a(f_1+f_2)&=\mathbf W(f_1+f_2)^{-1}
\mathbf c_{\mathrm{NL}}(f_1+f_2),\\
\mathbf a(f_2-f_1)&=\mathbf W(f_2-f_1)^{-1}
\mathbf c_{\mathrm{NL}}(f_2-f_1).
\end{aligned} \tag{6.5}
$$

and read the generated output at $b_4$:

$$
\mathrm{IM2}_{\mathrm{sum}}=b_4(f_1+f_2),\qquad
\mathrm{IM2}_{\mathrm{diff}}=b_4(f_2-f_1). \tag{6.6}
$$

This calculation is not iterative. It calculates the fundamental waves once,
creates the quadratic products once, and propagates those products once. It
is a useful first-order perturbation or Volterra-style demonstration.

The quadratic model produces IM2 products. A third-order term is needed for
the usual two-tone IM3 products:

$$
b_4=\cdots+k_3x_{\mathrm{amp}}^3. \tag{6.7}
$$

The near-carrier IM3 frequencies are

$$
f_{\mathrm{IM3,lower}}=2f_1-f_2,\qquad
f_{\mathrm{IM3,upper}}=2f_2-f_1. \tag{6.8}
$$

## 7. nP one-pass intermodulation analysis

This section describes the first implementation. It uses weak
nonlinearity and the existing frequency-by-frequency nodal connection solve.
It does not model gain compression beyond the small-signal range or perform
the harmonic-balance iteration in Appendix A.

### 7.1 Frequencies and input tones

The user sets `global.fList` to the desired $f_1$ points and sets
`global.twoTone.spacingHz` to obtain $f_2$ at each point. The same settings
hold separate `p1dBm` and `p2dBm` available input powers and optional
`phase1Deg` and `phase2Deg`; both phases default to zero. Frequencies must be
known before Amp and Attn populate their S-parameter rows. Input powers and
phases can be changed when the analysis runs.

For a single test, let

$$
f_1=1.0\ \mathrm{GHz},\qquad f_2=1.1\ \mathrm{GHz}. \tag{7.1}
$$

The initial IP2/IP3 analysis needs ordinary S-matrices at these six positive
frequencies:

| Frequency | Role |
| ---: | --- |
| 0.1 GHz | $f_2-f_1$: IM2 difference |
| 0.9 GHz | $2f_1-f_2$: lower IM3 |
| 1.0 GHz | $f_1$: first input tone |
| 1.1 GHz | $f_2$: second input tone |
| 1.2 GHz | $2f_2-f_1$: upper IM3 |
| 2.1 GHz | $f_1+f_2$: IM2 sum |

Every constructor in the chain must provide its S-matrix at each needed
frequency, including components that generate no IM. The initial automatic
frequency expansion is in Amp and Attn. nP deduplicates coincident
frequencies. If a requested product is DC, it needs a separate DC model rather
than an RF S-matrix row. For a sweep, the user selects the displayed sweep
points; nP expands the internal frequency list with the corresponding second
tones and product frequencies. Displayed results retain one row per sweep
point, rather than one row per internal frequency.

### 7.2 Amplifier input data and product waves

`Amp` keeps its present gain and noise inputs and accepts optional output-referred
`oip2dBm` and `oip3dBm` values to its object form. A missing IP value means
infinite intercept for that order: its nonlinear coefficient is zero and it
generates no product of that order. These are extrapolated, matched, equal-tone
intercept powers, not operating power limits. The two-tone source levels need
not be equal during analysis.

For the first implementation, use the ideal matched, unilateral amplifier:

$$
S_{11}=S_{12}=S_{22}=0. \tag{7.2}
$$

Its output product source is at port 2. Let $B_1$
and $B_2$ be the amplifier's **linear** output power-wave phasors at $f_1$
and $f_2$; $|B_j|^2$ is in watts. Convert each supplied OIP from dBm to watts:

$$
P_2=10^{(\mathrm{OIP2}_{\mathrm{dBm}}-30)/10}\ \mathrm W,\qquad
P_3=10^{(\mathrm{OIP3}_{\mathrm{dBm}}-30)/10}\ \mathrm W. \tag{7.3}
$$

The proposed complex product waves leaving amplifier port 2 are

$$
\begin{aligned}
c_{2,\mathrm{sum}}&=\frac{B_1B_2}{\sqrt{P_2}}, &
c_{2,\mathrm{diff}}&=\frac{B_2B_1^*}{\sqrt{P_2}},\\
c_{2,\mathrm{lower}}&=-\frac{B_1^2B_2^*}{P_3}, &
c_{2,\mathrm{upper}}&=-\frac{B_2^2B_1^*}{P_3}.
\end{aligned} \tag{7.4}
$$

These are equations (5.6) with the calibrated coefficients from (5.9) and
the linear output waves from (5.5) substituted in.

The plus signs for IM2 and minus signs for IM3 are explicit phase conventions
of this initial Amp model; IP magnitudes alone do not measure those phases.
Optional `im2PhaseDeg` and `im3PhaseDeg` rotate the corresponding product
waves relative to these defaults.
The negative cubic sign is consistent with the onset of gain compression for
an amplifier with positive forward gain. These equations specify generated
products only: the initial one-pass calculation keeps the fundamentals at
their linear values. With equal matched output tone powers $p$, they give

$$
P_{\mathrm{IM2}}=\frac{p^2}{P_2},\qquad
P_{\mathrm{IM3}}=\frac{p^3}{P_3}. \tag{7.5}
$$

Thus extrapolating either product to the fundamental meets at the supplied OIP. Arbitrary
reflective or reverse-gain amplifier S-matrices need a separately defined
nonlinear port-source and calibration rule; the initial equations do not
silently claim to model that case.

### 7.3 Nodal solution and coherent coincidences

At each input tone, nodal builds the connection-scattering matrix from the
component S-matrices:

$$
\mathbf W(f)=\boldsymbol\Gamma-\mathbf S(f). \tag{7.6}
$$

It solves for the complex waves at every amplifier input and uses those local
waves in equation (7.4). At each product frequency it places the generated
port waves in a source column and solves using **that frequency's**
$\mathbf W(f)^{-1}$. The linear S-matrices carry products through filters, attenuators,
other amplifiers, and reflections; they do not create the products.

If several amplifiers generate a product at the same frequency, sum their
complex source waves before taking output power. If a product coincides with
an input tone, include the input source at that frequency in the same solve.
The selected input phases give a coherent snapshot. Phase averaging for
independent generators is outside this first implementation.

For three two-port stages and two external ports, $W(f)$ is $8\times8$ at
each frequency. This is an internal solve matrix. The resulting network is
still a two-port nPort with a $2\times2$ external S-matrix per frequency.

### 7.4 Reusing combined nPorts

An nPort created by `nodal()` or `cascade()` retains its known nonlinear
component models and connections when placed in another combination. At the
fundamentals, the outer network's boundary waves determine the drive within
each child. At a product frequency, the child's internal sources reduce to
equivalent waves at its external ports. The outer network then propagates
those waves using the child's external S-matrix. Conceptually, a child at a
product frequency satisfies

$$
\mathbf b(f)=\mathbf S(f)\mathbf a(f)+\mathbf d(f). \tag{7.7}
$$

The term $\mathbf d(f)$ depends on the actual fundamental drive. The child need not
store its earlier IM levels or a large internal inverse for every frequency.

A packaged amplifier with measured aggregate OIP2/OIP3 may instead be a
black-box Amp model. Its unknown internal sources are not required. An
effective IP reported for a network built from known components is a result
under specified test conditions; replacing those known components with only
that scalar IP is an optional approximation, not the default for nested
networks.

### 7.5 First checks

Use one 20 dB amplifier with finite OIP2/OIP3 and one matched 3 dB
attenuator. With equal source conditions, Amp then Atten and Atten then Amp
both have 17 dB small-signal gain. Relative to Amp then Atten, Atten then Amp
has 3 dB less IM2 output and 6 dB less IM3 output: the attenuator reduces
both tones before they drive the nonlinear amplifier. The two arrangements
also retain their different noise figures.

The tests build the same chain directly, as nested nodal networks, and as
nested two-port cascades. Their external S-parameters, noise, and complex IM
outputs agree within numerical tolerance. This checks that neither combining
path loses nonlinear behavior when its returned nPort is reused.

## Appendix A. Full harmonic-balance analysis

### A.1 Frequency model

A full harmonic-balance analysis retains a frequency set containing every
fundamental, harmonic, and intermodulation frequency of interest. Let the set
be:

$$
\mathcal K=\{f_1,f_2,f_1+f_2,f_2-f_1,
2f_1-f_2,2f_2-f_1,\ldots\}. \tag{A.1}
$$

There is a six-entry wave column for every retained frequency:

$$
\mathbf a(f_k)=
\begin{bmatrix}
a_1(f_k)\\a_2(f_k)\\\vdots\\a_6(f_k)
\end{bmatrix}. \tag{A.2}
$$

Stacking them produces one large unknown vector:

$$
\mathbf A=
\begin{bmatrix}
\mathbf a(f_1)\\\mathbf a(f_2)\\\vdots
\end{bmatrix}. \tag{A.3}
$$

The linear Gupta part is block diagonal:

$$
\mathbf W_{\mathrm{total}}=
\operatorname{blockdiag}\!\bigl(
\mathbf W(f_1),\mathbf W(f_2),\ldots\bigr). \tag{A.4}
$$

If the network is linear, each frequency is independent. The nonlinear
amplifier couples the frequencies through products of its input waves.

For a memoryless polynomial model:

$$
c_{\mathrm{NL},4}(t)=k_2x_{\mathrm{amp}}(t)^2
+k_3x_{\mathrm{amp}}(t)^3+\cdots. \tag{A.5}
$$

Transforming that nonlinear source to the retained frequencies gives:

$$
\mathbf c_{\mathrm{NL}}(f_k)=
\mathcal F\{\mathbf c_{\mathrm{NL}}(t)\}(f_k). \tag{A.6}
$$

The complete harmonic-balance residual is:

$$
\mathbf R(\mathbf A)=\mathbf W_{\mathrm{total}}\mathbf A
-\mathbf C_{\mathrm{external}}-\mathbf C_{\mathrm{NL}}(\mathbf A). \tag{A.7}
$$

The solution satisfies:

$$
\mathbf R(\mathbf A)=\mathbf 0. \tag{A.8}
$$

Unlike the one-pass example, $\mathbf C_{\mathrm{NL}}(\mathbf A)$ is recalculated from the current
wave estimate at every iteration. Products generated at one frequency can
mix with products at another frequency and feed back into the fundamentals.

### A.2 Newton iteration

Start with an initial estimate, usually the linear solution:

$$
\mathbf A^{(0)}=\mathbf W_{\mathrm{total}}^{-1}
\mathbf C_{\mathrm{external}}. \tag{A.9}
$$

At iteration `m`:

1. Calculate the nonlinear source $\mathbf C_{\mathrm{NL}}(\mathbf A^{(m)})$.
2. Calculate the residual $\mathbf R(\mathbf A^{(m)})$.
3. Calculate the Jacobian $\mathbf J(\mathbf A^{(m)})$.
4. Solve for the update $\Delta\mathbf A^{(m)}$.
5. Update $\mathbf A^{(m+1)}$ and test convergence.

The solve and update in steps 4 and 5 are

$$
\begin{aligned}
\mathbf J(\mathbf A^{(m)})\Delta\mathbf A^{(m)}
&=-\mathbf R(\mathbf A^{(m)}),\\
\mathbf A^{(m+1)}&=\mathbf A^{(m)}+\Delta\mathbf A^{(m)}.
\end{aligned} \tag{A.10}
$$

The Jacobian is:

$$
\mathbf J(\mathbf A)=\mathbf W_{\mathrm{total}}
-\frac{\partial\mathbf C_{\mathrm{NL}}(\mathbf A)}
{\partial\mathbf A}. \tag{A.11}
$$

For a scalar quadratic relation:

$$
c_{\mathrm{NL}}=k_2x^2,\qquad
\frac{dc_{\mathrm{NL}}}{dx}=2k_2x. \tag{A.12}
$$

For a cubic relation:

$$
c_{\mathrm{NL}}=k_3x^3,\qquad
\frac{dc_{\mathrm{NL}}}{dx}=3k_3x^2. \tag{A.13}
$$

In a multiport, multitone problem, the Jacobian is a block matrix. Its
off-diagonal blocks are the frequency couplings caused by the nonlinear
terms. The linear `W(fk)` blocks remain on the diagonal, while the nonlinear
derivatives connect different frequencies.

A practical convergence test is:

$$
\begin{aligned}
\max_k|\Delta A_k|&<\varepsilon_{\mathrm{abs}},\\
\max_k\frac{|\Delta A_k|}{\max(1,|A_k|)}
&<\varepsilon_{\mathrm{rel}}.
\end{aligned} \tag{A.14}
$$

The solver should also stop after a maximum iteration count and report a
non-convergence error rather than returning an unverified spectrum. Damping
the update,

$$
\mathbf A_{\mathrm{next}}=\mathbf A+\lambda\Delta\mathbf A,
\qquad 0<\lambda\leq1. \tag{A.15}
$$

can improve convergence for stronger nonlinearities.

### A.3 Solver output

After convergence, read the external output wave at every retained frequency:

$$
\mathbf b(f_k)=\boldsymbol\Gamma(f_k)\mathbf a(f_k). \tag{A.16}
$$

For the six-variable circuit, the output of interest is `b₄`:

$$
\begin{aligned}
\text{fundamentals:}&\quad b_4(f_1),\ b_4(f_2),\\
\text{IM2:}&\quad b_4(f_1+f_2),\ b_4(f_2-f_1),\\
\text{IM3:}&\quad b_4(2f_1-f_2),\ b_4(2f_2-f_1).
\end{aligned} \tag{A.17}
$$

Convert the magnitudes to power using the wave normalization, then compare
the fundamental and distortion powers. IP2 and IP3 are obtained by the usual
extrapolation of the fundamental and distortion slopes, or by solving for
their intersection.

The linear Gupta inverse does not create nonlinear products. It supplies the
network transfer for products created by the active-device model. A complete
Newton harmonic-balance implementation therefore needs both:

Gupta's $\mathbf W$, $\boldsymbol\Gamma$, and $\mathbf S$ matrices describe
the linear network; the nonlinear device equations and their derivatives
describe its generated products.

## Appendix B. Time-domain and FFT analysis

A time-domain analysis would apply both input tones as waveforms, solve the
component voltages and currents at each time step, and use a Fourier
transform to read the fundamental and IM product levels. The time step must
resolve the highest product of interest, and the record must be long enough
to resolve the tone spacing. Phase is retained in the waveform, so coincident
products can add or cancel coherently.

This approach needs time-domain behavior for every component, including
stored energy in capacitors and inductors. The existing frequency-domain
S-parameter rows alone do not provide those component states. Time-domain
analysis is outside the first one-pass implementation.
