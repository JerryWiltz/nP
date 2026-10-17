<!-- Modified: 2026-10-16 -->
# Gupta Connection-Scattering Derivation

This shared linear-wave derivation supports the worked [noise](../dev/noiseAnalysis.md) and [intermodulation](../dev/intermodAnalysis.md) analyses. The numbered equations and six-position port order here are used by both notes.

The [Gupta source scan](../dev/raw/gupta_connection_scattering_p345_347.pdf) contains the worked multiport example on pp. 345–347. The excerpt does not establish the book title or edition.

The symbols keep Gupta's names:

```text
a       incoming-wave column
b       outgoing-wave column
c       impressed-source column
S       block-diagonal component S-matrix
Gamma   interconnection matrix
W       connection-scattering matrix, Gamma - S
```

All columns are column vectors. A product such as `S*a` is a matrix times a column.

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

After solving for a, Gupta obtains the outgoing waves from b = Gamma a. Solving W aⱼ = eⱼ gives column j of W⁻¹; this is inversion by its defining column equations.

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

The source column in (2.4) has six zeros followed by c₁ and c₂. These are the impressed waves of the two matched generators, whose positions are 7 and 8 in the full wave columns. The generator relations (2.1) give b₇ = c₁ and b₈ = c₂. The last two rows of the connection matrix (2.3) also give b₇ = a₁ and b₈ = a₄. Therefore the incident waves at the two external component ports are a₁ = c₁ and a₄ = c₂.

The corresponding outgoing waves are b₁ and b₄. By the definition of the overall two-port S-matrix,

$$
\begin{bmatrix}b_1\\b_4\end{bmatrix}
=
\begin{bmatrix}S_{11}&S_{12}\\S_{21}&S_{22}\end{bmatrix}
\begin{bmatrix}a_1\\a_4\end{bmatrix}. \tag{2.5}
$$

For the forward test, Gupta sets c₁ = 1 and c₂ = 0. This puts a 1 at position 7 of the eight-entry source column and zeros everywhere else. W stays 8 × 8: multiplying W⁻¹ by that 8 × 1 source column gives an 8 × 1 incoming-wave column. Equation (2.3) then gives the 8 × 1 outgoing-wave column. Selecting its two external entries, b₁ and b₄, gives the 2 × 1 first column of the overall S-matrix:

$$
\begin{bmatrix}b_1\\b_4\end{bmatrix}
=\begin{bmatrix}S_{11}\\S_{21}\end{bmatrix}. \tag{2.6}
$$

Here b₁ is the input reflection S₁₁, and b₄ is the forward transmission S₂₁.

## 3. The six-variable page used by nP

This six-variable worked example adapts Gupta's eight-variable example to a matched, reciprocal 3 dB attenuator feeding a semi-ideal amplifier with 20 dB forward gain and an illustrative 4 dB noise figure. The attenuator and amplifier are two-port components; matched external source and load positions bring the wave-column length to six. As in Gupta's example, assemble the component S-matrix, connect the ports with Gamma, solve W = Gamma - S for the incoming waves, and then obtain the outgoing waves used for the overall S-parameters.

This example has a different ordering from Gupta's example:

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

The source-to-output transfer matrix T = Gamma W⁻¹ is a convenient derived matrix; Gupta's earlier equations use Gamma and W directly. Here it is

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

The external outgoing waves are b₁ and b₄, so this excitation gives S₁₁ ≈ 0.005 and S₂₁ ≈ 7.079. The b column is the same outgoing-wave column in both the component and connection relations; the inverse solves for a, and Gamma supplies b.

The fifth and sixth columns of T correspond to excitation at the two external source positions. Selecting its first and fourth rows gives the complete external two-port matrix:

$$
\mathbf S_{\mathrm{overall}}\approx
\begin{bmatrix}
0.005&0.007\\
7.079&0.010
\end{bmatrix}. \tag{3.8}
$$

The position-5 source exercises the first column.
