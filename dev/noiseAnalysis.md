<!-- Modified: 2026-09-28 -->
# Gupta connection-scattering noise analysis

This note is the mathematical companion to `dev/noiseAnalysis.html`. The HTML page is a six-variable example containing a matched 3 dB attenuator at 290 K followed by a semi-ideal amplifier. It follows Gupta's connection-scattering method and then adds noise covariance propagation. Here 3 dB means exactly 3.00 dB, so the voltage-wave transmission is $10^{-3/20}\approx0.708$ and the power transmission is $10^{-3/10}\approx0.501$.

The symbols below keep Gupta's names:

```text
a       incoming-wave column
b       outgoing-wave column
c       impressed-source column
S       block-diagonal component S-matrix
Gamma   interconnection matrix
W       connection-scattering matrix, Gamma - S
```

All columns are columns. A product such as `S*a` is therefore a matrix times a column, not a row-vector product.

## 1. Gupta's equations 11.9–11.17: the connection-scattering method

Gupta begins with a network of multiport components and independent generators. For component i, with incoming-wave column aᵢ and outgoing-wave column bᵢ, his component relation is

$$
\mathbf b_i = \mathbf S_i\mathbf a_i. \tag{11.9}
$$

An independent generator is represented by

$$
\mathbf b_g = \mathbf S_g\mathbf a_g + \mathbf c_g. \tag{11.10}
$$

where the final term is the wave impressed by that generator. For an isolated or matched generator, Gupta notes that its S matrix is zero.

Putting all component relations together gives

$$
\mathbf b = \mathbf S\mathbf a + \mathbf c. \tag{11.11}
$$

The columns and block-diagonal component matrix are

$$
\mathbf a=\begin{bmatrix}a_1\\a_2\\\vdots\\a_m\end{bmatrix},\qquad
\mathbf b=\begin{bmatrix}b_1\\b_2\\\vdots\\b_m\end{bmatrix},\qquad
\mathbf c=\begin{bmatrix}c_1\\c_2\\\vdots\\c_m\end{bmatrix},
$$

$$
\mathbf S=
\begin{bmatrix}
\mathbf S_1&\mathbf 0&\cdots&\mathbf 0\\
\mathbf 0&\mathbf S_2&\cdots&\mathbf 0\\
\vdots&\vdots&\ddots&\vdots\\
\mathbf 0&\mathbf 0&\cdots&\mathbf S_m
\end{bmatrix}. \tag{11.12}
$$

The zero entries are null submatrices. Equation (11.11) describes the individual components, but does not yet enforce their interconnections.

For two equally normalized ports j and k, the outgoing wave at one port is the incoming wave at the other:

$$
a_j=b_k,\qquad a_k=b_j,
$$

or

$$
\begin{bmatrix}a_j\\a_k\end{bmatrix}
=\begin{bmatrix}0&1\\1&0\end{bmatrix}
\begin{bmatrix}b_j\\b_k\end{bmatrix}. \tag{11.13}
$$

For unequal normalizations, the entries of this two-port connection matrix are obtained from the inverse S-matrix of the junction. Writing all connection relations together gives Gupta's connection matrix

$$
\mathbf b=\boldsymbol\Gamma\mathbf a. \tag{11.14}
$$

Each row of Gamma contains zeros except for the entry that identifies the port to which that row's port is connected. With equal reference impedances, those connection entries are 1.

Substitution of (11.14) into (11.11) gives

$$
\boldsymbol\Gamma\mathbf a=\mathbf S\mathbf a+\mathbf c,
$$

$$
(\boldsymbol\Gamma-\mathbf S)\mathbf a=\mathbf c. \tag{11.15}
$$

Gupta sets

$$
\mathbf W=\boldsymbol\Gamma-\mathbf S, \tag{11.16}
$$

so that

$$
\mathbf a=\mathbf W^{-1}\mathbf c. \tag{11.17}
$$

Here c is the column of impressed waves, and Gupta calls W the **connection scattering matrix**. Its diagonal entries are the negative component reflection coefficients, its same-component off-diagonal entries are negative component transmission coefficients, and its connection entries come from Gamma.

The complete sequence is therefore

$$
\mathbf b=\mathbf S\mathbf a+\mathbf c,\qquad
\mathbf b=\boldsymbol\Gamma\mathbf a,\qquad
\mathbf W=\boldsymbol\Gamma-\mathbf S,\qquad
\mathbf a=\mathbf W^{-1}\mathbf c.
$$

After solving for a, Gupta obtains the outgoing waves from b = Gamma a. Solving W aⱼ = eⱼ gives column j of W⁻¹; this is inversion by its defining column equations.

## 2. Gupta's eight-variable example: equations 11.28–11.31

Gupta's page-347 example has component (A) (two ports), component (B) (three ports), component (C) (one port), and two matched one-port external generators. The generators are

$$
b_7=c_1,\qquad b_8=c_2. \tag{11.28a,b}
$$

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
\begin{bmatrix}0\\0\\0\\0\\0\\0\\c_1\\c_2\end{bmatrix}. \tag{11.29}
$$

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
\end{bmatrix}. \tag{11.30}
$$

Subtracting the component matrix in (11.29) from the connection matrix in (11.30), and using (11.17), gives Gupta's equation (11.31):

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
\begin{bmatrix}0\\0\\0\\0\\0\\0\\c_1\\c_2\end{bmatrix}. \tag{11.31}
$$

The source column in (11.31) has six zeros followed by c₁ and c₂. These are the impressed waves of the two matched generators, whose positions are 7 and 8 in the full wave columns. The generator relations (11.28) give b₇ = c₁ and b₈ = c₂. The last two rows of the connection matrix (11.30) also give b₇ = a₁ and b₈ = a₄. Therefore the incident waves at the two external component ports are a₁ = c₁ and a₄ = c₂.

The corresponding outgoing waves are b₁ and b₄. By the definition of the overall two-port S-matrix,

$$
\begin{bmatrix}b_1\\b_4\end{bmatrix}
=
\begin{bmatrix}S_{11}&S_{12}\\S_{21}&S_{22}\end{bmatrix}
\begin{bmatrix}a_1\\a_4\end{bmatrix}.
$$

For the forward test, Gupta sets c₁ = 1 and c₂ = 0. This puts a 1 at position 7 of the eight-entry source column and zeros everywhere else. W stays 8 × 8: multiplying W⁻¹ by that 8 × 1 source column gives an 8 × 1 incoming-wave column. Equation (11.30) then gives the 8 × 1 outgoing-wave column. Selecting its two external entries, b₁ and b₄, gives the 2 × 1 first column of the overall S-matrix:

$$
\begin{bmatrix}b_1\\b_4\end{bmatrix}
=\begin{bmatrix}S_{11}\\S_{21}\end{bmatrix}.
$$

Here b₁ is the input reflection S₁₁, and b₄ is the forward transmission S₂₁.

## 3. The six-variable page used by nP

The nP page adapts Gupta's eight-variable example to a matched, reciprocal 3 dB attenuator feeding a semi-ideal amplifier with 20 dB forward gain and an illustrative 4 dB noise figure. The attenuator and amplifier are two-port components; matched external source and load positions bring the wave-column length to six. As in Gupta's example, the page assembles the component S-matrix, connects the ports with Gamma, solves W = Gamma - S for the incoming waves, and then obtains the outgoing waves used for the overall S-parameters.

The HTML example has a different ordering:

$$
\begin{array}{c|l}
\text{index}&\text{component port or bookkeeping position}\\\hline
1&\text{attenuator port 1}\\
2&\text{attenuator port 2}\\
3&\text{amplifier port 1}\\
4&\text{amplifier port 2}\\
5&\text{external source position}\\
6&\text{external load position}
\end{array}
$$

The displayed noninteger values below are rounded to three decimal places; the HTML calculations use unrounded values. The attenuator has zero reflection and approximately 0.708 transmission at each port. The amplifier uses input and output reflections of 0.010, reverse transmission of 0.010, and forward transmission of 10. In the port order above, the block-diagonal component matrix is

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

The HTML page inverts W. For these component values, its inverse rounds to

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

The HTML page also forms a source-to-output transfer matrix T = Gamma W⁻¹. This is a convenient derived matrix; Gupta's earlier equations use Gamma and W directly. Here it is

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

For the forward test, the HTML page puts a unit impressed wave at source position 5 and zero at every other position. The source column and resulting incoming- and outgoing-wave columns are

$$
\mathbf c=\begin{bmatrix}0\\0\\0\\0\\1\\0\end{bmatrix},\qquad
\mathbf a=\mathbf W^{-1}\mathbf c\approx
\begin{bmatrix}1\\0.007\\0.708\\0\\0.005\\7.079\end{bmatrix},\qquad
\mathbf b=\boldsymbol\Gamma\mathbf a=\mathbf T\mathbf c\approx
\begin{bmatrix}0.005\\0.708\\0.007\\7.079\\1\\0\end{bmatrix}. \tag{3.7}
$$

The external outgoing waves are b₁ and b₄, so this excitation gives S₁₁ ≈ 0.005 and S₂₁ ≈ 7.079. The b column is the same outgoing-wave column in both the component and connection relations; the inverse solves for a, and Gamma supplies b.

The fifth and sixth columns of T correspond to excitation at the two external source positions. Selecting its first and fourth rows gives the complete external two-port matrix:

$$
\mathbf S_{\mathrm{overall}}\approx
\begin{bmatrix}
0.005&0.007\\
7.079&0.010
\end{bmatrix}. \tag{3.8}
$$

The HTML page exercises the first column with its position-5 source.

## 4. Noise sources and covariance

### Worked example: one attenuator, two power meters

Take a matched, reciprocal 3.00 dB attenuator at room temperature, here 290 K. Connect an ideal 50 Ω power meter to each port. The meters are matched and noiseless. With no applied signal or incoming noise, each meter reads only noise generated inside the attenuator.

```text
50 Ω meter at port 1 ── 3 dB attenuator ── 50 Ω meter at port 2
```

A 3.00 dB loss passes $10^{-3/10}\approx0.501187$ of incident **power**. Its wave transmission is the square root of that number:

$$
t=|S_{21}|=|S_{12}|=10^{-3/20}\approx0.707946,\qquad
|t|^2\approx0.501187. \tag{4.1}
$$

The attenuator is matched, so $S_{11}=S_{22}=0$. At 290 K, a matched source provides $k_B T_0=4.0038821\times10^{-21}$ W/Hz. For each port, the attenuator emits the fraction that it absorbs, $1-|t|^2$:

$$
\begin{aligned}
n_A&=(1-|t|^2)k_B T_0\\
&=(1-0.5011872336)(1.380649\times10^{-23})(290)\\
&\approx1.997188\times10^{-21}\,\mathrm{W/Hz}.
\end{aligned} \tag{4.2}
$$

Thus each meter reads $1.997188\times10^{-21}$ W in a 1 Hz bandwidth. The two readings are equal, but power readings alone say nothing about whether the two noise *waves* are correlated. We need a covariance table to keep both the powers and their relationship.

### Two attenuator noise waves

Call the outgoing internal noise waves at ports 1 and 2 $u$ and $v$:

$$
\mathbf c_A=\begin{bmatrix}u\\v\end{bmatrix},\qquad
\mathbb E\{|u|^2\}=\mathbb E\{|v|^2\}=n_A. \tag{4.3}
$$

For this ideal matched attenuator, the waves are **uncorrelated**: $\mathbb E\{uv^*\}=0$. Equal meter powers do not make them the same random wave. The covariance matrix puts each meter power on the diagonal and the cross-correlation off the diagonal:

$$
\mathbf C_A=
\begin{bmatrix}
\mathbb E\{|u|^2\}&\mathbb E\{uv^*\}\\
\mathbb E\{vu^*\}&\mathbb E\{|v|^2\}
\end{bmatrix}
=n_A\begin{bmatrix}1&0\\0&1\end{bmatrix}. \tag{4.4}
$$

Here $\mathbb E\{\}$ means average over many noise outcomes and $*$ means complex conjugate. In general, for a noise-wave column $\mathbf c$, we write

$$
\mathbf C_c=\mathbb E\{\mathbf c\mathbf c^{\mathrm H}\},\qquad
(C_c)_{ij}=\mathbb E\{c_i c_j^*\}. \tag{4.5}
$$

The superscript H means transpose the column into a row and conjugate each entry. We still need two noise variables because the attenuator has two output ports. The zero off-diagonal entries tell us that these particular two variables are uncorrelated.

### Check against the attenuator S-parameters

With zero transmission phase, the component S-matrix is

$$
\mathbf S_A=\begin{bmatrix}0&t\\t&0\end{bmatrix},\qquad t=10^{-3/20}. \tag{4.6}
$$

The standard noise rule for a passive component at temperature $T_0$ gives the same result:

$$
\mathbf C_A=k_B T_0\left(\mathbf I_2-\mathbf S_A\mathbf S_A^{\mathrm H}\right)
=(1-t^2)k_B T_0\begin{bmatrix}1&0\\0&1\end{bmatrix}. \tag{4.7}
$$

$\mathbf I_2$ is the 2 × 2 identity matrix. Because the S-parameters are real here, $\mathbf S_A^{\mathrm H}$ is just its transpose. Multiplying the two small matrices gives $\mathbf S_A\mathbf S_A^{\mathrm H}=t^2\mathbf I_2$, leaving zero cross-correlation.

### Put the attenuator and amplifier into the six-variable example

Positions 1 and 2 hold the attenuator waves $u$ and $v$. Positions 3 and 4 belong to the amplifier. Positions 5 and 6 represent the external source and load, which this calculation treats as noiseless.

Position 4 is the amplifier's output port, as the port-order table in section 3 shows. The HTML page **chooses** to represent all amplifier-added noise as one equivalent wave leaving that port. This is an output-referred model; it does not say the amplifier physically generates noise only there.

With a matched source and load, source noise $k_B T_0$ at the amplifier input produces $|S^{\mathrm{amp}}_{21}|^2 k_B T_0$ at its output. A 4 dB noise figure means the amplifier adds $(F_{\mathrm{amp}}-1)$ times that output noise. The page therefore sets the output-wave variance to

$$
F_{\mathrm{amp}}=10^{4/10},\qquad
N_{\mathrm{amp}}=(F_{\mathrm{amp}}-1)|S^{\mathrm{amp}}_{21}|^2 k_B T_0. \tag{4.8}
$$

The HTML variable `ampC22` holds $N_{\mathrm{amp}}$. It sets the amplifier's position-3 noise and its position-3/position-4 correlation to zero. The complete source covariance is

$$
\mathbf C_c=
\begin{bmatrix}
n_A&0&0&0&0&0\\
0&n_A&0&0&0&0\\
0&0&0&0&0&0\\
0&0&0&N_{\mathrm{amp}}&0&0\\
0&0&0&0&0&0\\
0&0&0&0&0&0
\end{bmatrix}. \tag{4.9}
$$

The attenuator fills the first two diagonal positions and the amplifier fills the fourth. A single noise-figure value fixes the added output noise for a matched-source test; it does not determine a complete amplifier noise-wave model for arbitrary source mismatch. In this example the matched external source remains matched at the amplifier input through the matched attenuator. Section 5 shows the full calculation for these assigned noise waves.

## 5. Worked noise propagation for the attenuator–amplifier

### First calculate the amplifier noise $N_{\mathrm{amp}}$

Use the **amplifier by itself**, with a matched 290 K source and matched load. Its forward wave gain is $S^{\mathrm{amp}}_{21}=10$, which is a power gain of 100 (20 dB). Its stated noise figure is 4 dB. Convert these two numbers to ordinary ratios:

$$
G_{\mathrm{amp}}=|S^{\mathrm{amp}}_{21}|^2=10^2=100,\qquad
F_{\mathrm{amp}}=10^{4/10}\approx2.5118864315. \tag{5.1}
$$

At 290 K, a matched source supplies $k_B T_0=4.0038821\times10^{-21}$ W/Hz of noise. The amplifier sends 100 times that source noise to its output:

$$
N_{\mathrm{source,out}}
=G_{\mathrm{amp}}k_B T_0
=100(1.380649\times10^{-23})(290)
=4.0038821\times10^{-19}\,\mathrm{W/Hz}. \tag{5.2}
$$

The 4 dB noise figure says **total** output noise is about 2.5118864315 times this source-only output noise. The part **added by the amplifier** is total minus source-only:

$$
\begin{aligned}
N_{\mathrm{amp}}
&=(F_{\mathrm{amp}}-1)N_{\mathrm{source,out}}\\
&\approx(2.5118864315-1)(4.0038821\times10^{-19})\\
&\approx6.053415\times10^{-19}\,\mathrm{W/Hz}.
\end{aligned} \tag{5.3}
$$

This is the number stored as `ampC22` in the HTML and placed at position 4 of equation (4.9). The preceding matched attenuator presents a matched source to this amplifier when the external source is matched.

Section 4 assigned the attenuator two uncorrelated noise waves $u$ and $v$. Let $q$ be the amplifier's independent output-referred noise wave. The internal-noise source column is

$$
\mathbf c_{\mathrm{noise}}=
\begin{bmatrix}
u\\v\\0\\q\\0\\0
\end{bmatrix}. \tag{5.4}
$$

$$
\mathbb E\{|u|^2\}=\mathbb E\{|v|^2\}=n_A=1.997188\times10^{-21}\,\mathrm{W/Hz},\qquad
\mathbb E\{uv^*\}=0. \tag{5.5}
$$

$$
\mathbb E\{|q|^2\}=N_{\mathrm{amp}}=6.053415\times10^{-19}\,\mathrm{W/Hz}. \tag{5.6}
$$

The external source and load positions are zero because this calculation counts only noise generated inside the attenuator and amplifier. The amplifier noise $q$ is independent of both attenuator waves.

The HTML uses the full six-variable transfer matrix from section 3. These entries come from the unrounded component values (more digits are displayed here so the multiplication can be checked):

$$
\mathbf T\approx
\begin{bmatrix}
1&0.007079458&0.707945784&0&0.005011872&0.007079458\\
0&1&0&0&0.707945784&0\\
0&0.010000000&1&0&0.007079458&0.010000000\\
0&10&0&1&7.079457844&0.010000000\\
0&0&0&0&1&0\\
0&0&0&0&0&1
\end{bmatrix}. \tag{5.7}
$$

Next put the attenuator and amplifier noise powers into the full six-position covariance from equation (4.9). Factoring out $10^{-21}$ W/Hz keeps the entries readable:

$$
\mathbf C_c\approx10^{-21}\,\mathrm{W/Hz}
\begin{bmatrix}
1.997187507&0&0&0&0&0\\
0&1.997187507&0&0&0&0\\
0&0&0&0&0&0\\
0&0&0&605.341502035&0&0\\
0&0&0&0&0&0\\
0&0&0&0&0&0
\end{bmatrix}. \tag{5.8}
$$

The attenuator fills entries $(1,1)$ and $(2,2)$. The amplifier's $N_{\mathrm{amp}}$ from equation (5.3) fills entry $(4,4)$: $605.341502035\times10^{-21}=6.05341502035\times10^{-19}$ W/Hz.

The goal is the full outgoing-wave covariance. We multiply the two populated matrices above, then multiply by the conjugate transpose of $\mathbf T$:

$$
\mathbf C_b=\mathbf T\mathbf C_c\mathbf T^{\mathrm H}. \tag{5.9}
$$

First transpose $\mathbf T$ from equation (5.7): rows become columns. All entries are real, so this is also the conjugate transpose $\mathbf T^{\mathrm H}$:

$$
\mathbf T^{\mathrm T}\approx
\begin{bmatrix}
1&0&0&0&0&0\\
0.007079458&1&0.010000000&10&0&0\\
0.707945784&0&1&0&0&0\\
0&0&0&1&0&0\\
0.005011872&0.707945784&0.007079458&7.079457844&1&0\\
0.007079458&0&0.010000000&0.010000000&0&1
\end{bmatrix}. \tag{5.10}
$$

Do the **first multiplication**, $\mathbf T\mathbf C_c$. Call its result $\mathbf M$. For example, its $(1,2)$ entry is $0.007079458(1.997187507)\approx0.014139005$ in units of $10^{-21}$ W/Hz. Since only columns 1, 2, and 4 of $\mathbf C_c$ are nonzero, the other columns of $\mathbf M$ are zero:

$$
\mathbf M=\mathbf T\mathbf C_c\approx10^{-21}\,\mathrm{W/Hz}
\begin{bmatrix}
1.997187507&0.014139005&0&0&0&0\\
0&1.997187507&0&0&0&0\\
0&0.019971875&0&0&0&0\\
0&19.971875065&0&605.341502035&0&0\\
0&0&0&0&0&0\\
0&0&0&0&0&0
\end{bmatrix}. \tag{5.11}
$$

Do the **second multiplication**, $\mathbf M\mathbf T^{\mathrm T}$. This gives every output power and every pairwise correlation:

$$
\mathbf C_b=\mathbf M\mathbf T^{\mathrm H}
=\mathbf M\mathbf T^{\mathrm T}
\approx10^{-21}\,\mathrm{W/Hz}
\begin{bmatrix}
1.997287603&0.014139005&0.000141390&0.141390048&0&0\\
0.014139005&1.997187507&0.019971875&19.971875065&0&0\\
0.000141390&0.019971875&0.000199719&0.199718751&0&0\\
0.141390048&19.971875065&0.199718751&805.060252689&0&0\\
0&0&0&0&0&0\\
0&0&0&0&0&0
\end{bmatrix}. \tag{5.12}
$$

For output $b_1$, multiply row 1 of $\mathbf M$ by column 1 of $\mathbf T^{\mathrm T}$. Only two products are nonzero:

$$
\begin{aligned}
(C_b)_{11}
&=\left[1.997187507(1)+0.014139005(0.007079458)\right]10^{-21}\\
&\approx1.997287603\times10^{-21}\,\mathrm{W/Hz}.
\end{aligned} \tag{5.13}
$$

For output $b_4$, multiply row 4 of $\mathbf M$ by column 4 of $\mathbf T^{\mathrm T}$. One term is attenuator noise amplified by 100; the other is amplifier-added noise:

$$
\begin{aligned}
(C_b)_{44}
&=\left[19.971875065(10)+605.341502035(1)\right]10^{-21}\\
&\approx805.060252689\times10^{-21}
=8.05060252689\times10^{-19}\,\mathrm{W/Hz}.
\end{aligned} \tag{5.14}
$$

The HTML reads these as `Cb.m[0][0]` and `Cb.m[3][3]`. The deterministic calculation in section 3 gave $S_{21}\approx7.079457844$, so its power gain is $|S_{21}|^2\approx50.118723363$. Use the standard 290 K source-noise reference to get the conventional noise factor:

$$
\begin{aligned}
F&=1+\frac{(C_b)_{44}}{|S_{21}|^2k_B T_0}\\
&=1+\frac{8.05060252689\times10^{-19}}{50.118723363(4.0038821\times10^{-21})}\\
&\approx5.011872336,\qquad NF_{\mathrm{dB}}=10\log_{10}F=7.00\,\mathrm{dB}.
\end{aligned} \tag{5.15}
$$

This agrees with the familiar cascade check: a matched attenuator at 290 K adds its 3 dB loss to the amplifier's 4 dB noise figure. All cross-covariances in the final $\mathbf C_b$ arise from circuit transfer; the attenuator's original waves $u$ and $v$ are uncorrelated. For complex-valued circuits, use $\mathbf T^{\mathrm H}$ in the second multiplication.

## 6. What is still needed for noise figure

`Cb` gives output noise-wave power. A noise figure additionally requires a defined available input signal/noise reference. In a complete calculation, include the source and load conventions explicitly:

$$
F=\frac{\text{available input SNR}}{\text{available output SNR}}. \tag{6.1}
$$

In the matrix method this means:

1. use a deterministic source column to calculate the desired signal output;
2. use `Cc` to calculate the output noise covariance;
3. include source noise in `Cc` when the source is noisy;
4. form the output signal-to-noise ratio using the same wave normalization;
5. divide by the available input signal-to-noise ratio.

The current HTML page calculates the unit-signal gain, internal output noise, and a 290 K referenced noise figure for this matched-source example. Its output-only amplifier covariance has no input-wave or cross-correlation terms, so the page does not claim a general measured-amplifier noise figure for arbitrary source mismatch.

## 7. Internal-noise-only case

The current HTML calculation uses a noiseless external source and load:

$$
(C_c)_{55}=0,\qquad(C_c)_{66}=0. \tag{7.1}
$$

The upper-left 2 × 2 block of $\mathbf C_c$ contains the attenuator noise, and $(C_c)_{44}$ contains the amplifier noise.

The deterministic unit input signal is still applied at `c5`:

$$
\mathbf c_{\mathrm{signal}}=\mathbf e_5,\qquad
\mathbf b_{\mathrm{signal}}=\mathbf T\mathbf c_{\mathrm{signal}}. \tag{7.2}
$$

The resulting output noise from equation (5.12) is therefore added receiver noise. At output $b_4$:

$$
N_{\mathrm{added}}=(C_b)_{44},\qquad
G_{\mathrm{signal}}=|(b_{\mathrm{signal}})_4|^2. \tag{7.3}
$$

The conventional noise factor uses the standard 290 K source reference even though that source noise is not placed in `Cc`:

$$
F=1+\frac{N_{\mathrm{added}}}{G_{\mathrm{signal}}k_B T_0},\qquad
NF_{\mathrm{dB}}=10\log_{10}F. \tag{7.4}
$$

The leading `1` represents the source-only noise that Friis assumes implicitly. This is equivalent to adding `kB*T0` at the input and then dividing total output noise by the source-only output noise, but it keeps the matrix `Cc` focused on noise generated inside the receiver.

This internal-noise-only case can also report an output SNR for a noiseless input:

$$
\mathrm{SNR}_{\mathrm{out}}=\frac{G_{\mathrm{signal}}}{N_{\mathrm{added}}}. \tag{7.5}
$$

That SNR describes the receiver's internally generated noise. It is not by itself a conventional noise figure, because a truly noiseless input has infinite input SNR. The noise figure is obtained only after applying the `kB*T0` reference normalization above.

## 8. Direct correspondence with the HTML

```js
var W = gamma.sub(S);          // W = Gamma - S
var Winvert = W.invert();      // W^-1
var T = gamma.mul(Winvert);    // T = Gamma * W^-1
var b = T.mul(c);              // b = T * c
var Cb = T.mul(Cc).mul(TH);    // Cb = T * Cc * T^H
```

The last line is the mathematical operation required for the noise result. The current page builds and logs `Cc`, calculates `Cb`, reads the `b₁` and `b₄` noise powers, and applies the internal-noise-only noise-factor formula.

## 9. Required noise inputs for `nodal()`

To fold this method into `nodal()`, every component must provide noise data that is aligned with its S-parameter data. At each frequency, `nodal()` needs:

```text
1. the component S-matrix S(f)
2. the component port order
3. the component noise covariance Cc(f), or enough data to derive it
4. the reference impedance used by the wave normalization
5. the component temperature when thermal noise is derived
```

The covariance is the universal simulation input. It must be an `n x n` Hermitian matrix for an `n`-port component:

$$
\mathbf C_{\mathrm{component}}(f)
=\mathbb E\{\mathbf c_{\mathrm{component}}(f)
\mathbf c_{\mathrm{component}}(f)^{\mathrm H}\}. \tag{9.1}
$$

There are three practical ways to supply it. For a passive component, derive covariance from its S-matrix and temperature:

$$
\mathbf C=k_B T\left(\mathbf I-\mathbf S\mathbf S^{\mathrm H}\right). \tag{9.2}
$$

For a measured or modeled active component, supply the covariance directly, including complex cross-correlations. For a two-port amplifier specified by noise parameters, supply `Fmin`, `Gamma_opt`, `Rn`, `Z0`, and temperature, then convert those parameters to covariance before propagation.

`Fmin`, `Gamma_opt`, and `Rn` are not themselves a covariance matrix. They are a compact two-port amplifier description that must be converted into the four entries of:

$$
\mathbf C_A=\begin{bmatrix}
C^A_{11}&C^A_{12}\\
C^A_{21}&C^A_{22}
\end{bmatrix}. \tag{9.3}
$$

The conversion must preserve:

$$
C^A_{12}=(C^A_{21})^*. \tag{9.4}
$$

and the resulting covariance must use the same reference impedance and wave normalization as the S-matrix.

For each frequency, `nodal()` then performs the following work:

1. Assemble the block-diagonal component S-matrix.
2. Assemble the block-diagonal component covariance $\mathbf C_c$.
3. Build $\boldsymbol\Gamma$ from the connection labels.
4. Form $\mathbf W=\boldsymbol\Gamma-\mathbf S$.
5. Solve or invert $\mathbf W$.
6. Transfer source waves to external outputs.
7. Calculate the output covariance with the transfer rule in equation (5.9).

The block placement in step 2 must follow the same local port order used in step 1. A covariance matrix from one component cannot be placed in another component's block merely because both components have the same number of ports.

`Ctotal` may contain more than component-generated noise. If an external source or load is noisy, its covariance is added at the corresponding external source positions. For the internal-noise-only case, those external blocks are zero and `Ctotal` contains only component noise. A deterministic signal is handled separately with its own source column; it is not placed in the noise covariance.

## 10. Noise data carried by an `nPort`

An `nPort` must carry its noise data alongside its frequency-aligned S rows. The existing nP implementation already has a `.noise` property and stores frequency-indexed covariance records of this form:

```js
nPort.noise = [
    {
        frequency: frequency,
        C: [
            [nP.complex(...), nP.complex(...)],
            [nP.complex(...), nP.complex(...)]
        ]
    }
];
```

For a general `n`-port, `C` is `n x n`. The frequency at each covariance row must match the frequency at the corresponding `.spars` row. A network returned by `nodal()` or `cascade()` carries its propagated output covariance in the same frequency order.

For long-term API clarity, the noise payload should distinguish the universal covariance used by simulation from optional source metadata:

```js
nPort.noise = {
    covariance: [
        { frequency: f, C: covarianceMatrix }
    ],
    parameters: [
        {
            frequency: f,
            fmin: Fmin,
            gammaOpt: GammaOpt,
            rn: Rn,
            referenceImpedance: Z0,
            temperature: T0
        }
    ]
};
```

`covariance` is the required propagation form for a noise-capable component. `parameters` is optional metadata or an input representation for a two-port amplifier. If both are present, the covariance is the form used by `nodal()` and the parameters document how it was obtained. Passive components can carry covariance without carrying amplifier noise parameters. Ideal noiseless components can carry a zero covariance.

This keeps the public nPort relationship explicit:

```text
nPort.spars  -> deterministic scattering data versus frequency
nPort.noise  -> stochastic noise data versus the same frequency list
```

The two arrays must never silently use different frequency grids, reference impedances, port orders, or temperatures.

## 11. The same calculation for `cascade()`

The matched attenuator followed by the amplifier is a simple two-port chain, so it can be simulated with `nP.cascade()` as well as with `nP.nodal()`. The specialized cascade path eliminates the one internal connection analytically instead of constructing the full `Gamma` and `W` matrices for the arbitrary topology.

For two two-port components `A` and `B`, let $S^A_{ij}$ and $S^B_{ij}$ denote their individual S-parameters. Each component obeys

$$
\mathbf b_A=\mathbf S_A\mathbf a_A+\mathbf c_A,\qquad
\mathbf b_B=\mathbf S_B\mathbf a_B+\mathbf c_B. \tag{11.1}
$$

The internal connection is:

$$
a^A_2=b^B_1,\qquad a^B_1=b^A_2. \tag{11.2}
$$

Let:

$$
D=1-S^A_{22}S^B_{11}. \tag{11.3}
$$

The resulting S-parameters are:

$$
\begin{aligned}
S_{11}&=S^A_{11}+\frac{S^A_{12}S^B_{11}S^A_{21}}{D},\\
S_{12}&=\frac{S^A_{12}S^B_{12}}{D},\\
S_{21}&=\frac{S^A_{21}S^B_{21}}{D},\\
S_{22}&=S^B_{22}+\frac{S^B_{21}S^A_{22}S^B_{12}}{D}.
\end{aligned} \tag{11.4}
$$

Noise from the two components is transferred by two 2 × 2 matrices:

$$
\begin{aligned}
\mathbf F_A&=\begin{bmatrix}
1&S^A_{12}S^B_{11}/D\\
0&S^B_{21}/D
\end{bmatrix},\\[6pt]
\mathbf F_B&=\begin{bmatrix}
S^A_{12}/D&0\\
S^B_{21}S^A_{22}/D&1
\end{bmatrix}.
\end{aligned} \tag{11.5}
$$

If the component noises are independent, the output covariance is:

$$
\mathbf C_C
=\mathbf F_A\mathbf C_A\mathbf F_A^{\mathrm H}
+\mathbf F_B\mathbf C_B\mathbf F_B^{\mathrm H}. \tag{11.6}
$$

The transfer matrices include the loading and reflection caused by the internal connection. Therefore the component covariances cannot simply be added as $\mathbf C_A+\mathbf C_B$.

For the internal-noise-only case, the external source and load noise remain zero. Apply a unit available signal at the input, read the cascaded forward wave, and use the output noise covariance:

$$
\begin{aligned}
b_{\mathrm{signal,out}}&=S_{21},\\
N_{\mathrm{added}}&=(C_C)_{22},\\
F&=1+\frac{N_{\mathrm{added}}}{|S_{21}|^2 k_B T_0},\\
NF_{\mathrm{dB}}&=10\log_{10}F.
\end{aligned} \tag{11.7}
$$

The one-based $(C_C)_{22}$ entry is the output-port noise power; a JavaScript matrix object uses `.m[1][1]`. The leading `1` again supplies the implicit 290 K source-noise reference used by the conventional noise figure definition.

The public nP operation is:

```js
var chain = nP.cascade(attenuator, amplifier);
```

Each input must be a two-port with frequency-aligned S-parameters and noise covariance. The returned two-port carries both the cascaded S rows and the propagated covariance rows, so `noiseOut()` can inspect the resulting `C11`, `C12`, `C21`, or `C22` values. A two-port amplifier may carry its covariance directly or carry `Fmin`, `Gamma_opt`, and `Rn` as metadata from which its covariance was derived.

`cascade()` and `nodal()` should agree for this attenuator–amplifier topology. `nodal()` is still required when the circuit contains tees, branches, multiports, feedback connections, or other connections that are not a simple series chain.
