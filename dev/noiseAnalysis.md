<!-- Modified: 2026-10-15 -->
# Gupta connection-scattering noise analysis

The shared section 3 and sections 4–6 work through a matched 3 dB attenuator at 290 K and a semi-ideal amplifier with 0.01 input reflection, output reflection, and reverse transmission. Section 6 reverses their order. The implemented `nP.Amp(20, 4)` is fully matched and unilateral, with $S_{11}=S_{12}=S_{22}=0$; the semi-ideal amplifier is retained in the worked matrices to show the small reflection correction in equation (6.17). Here 3 dB means exactly 3.00 dB, so the voltage-wave transmission is $10^{-3/20}\approx0.708$ and the power transmission is $10^{-3/10}\approx0.501$.

The [`noiseAnalysis.html`](noiseAnalysis.html) harness instead compares three `Amp()` constructor forms, each followed by an attenuator, through `nodal()` and `cascade()`. Its circuit settings are separate from the hand calculations below.

## 1–3. Shared connection-scattering derivation

The [Gupta connection-scattering derivation](../developmentDocs/guptaConnectionScattering.md) contains equations (1.1)–(3.8), the eight-variable source example, and the six-position attenuator–amplifier example. Its section 3 defines the port order, connection matrix $\boldsymbol\Gamma$ (3.3), inverse $\mathbf W^{-1}$ (3.5), and transfer matrix $\mathbf T$ (3.6) used below.

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

Position 4 is the amplifier's output port, as the port-order table in section 3 shows. This worked example represents all amplifier-added noise as one equivalent wave leaving that port. This is an output-referred model; it does not say the amplifier physically generates noise only there.

With a matched source and load, source noise $k_B T_0$ at the amplifier input produces $|S^{\mathrm{amp}}_{21}|^2 k_B T_0$ at its output. A 4 dB noise figure means the amplifier adds $(F_{\mathrm{amp}}-1)$ times that output noise. The amplifier's output-wave variance is therefore

$$
F_{\mathrm{amp}}=10^{4/10},\qquad
N_{\mathrm{amp}}=(F_{\mathrm{amp}}-1)|S^{\mathrm{amp}}_{21}|^2 k_B T_0. \tag{4.8}
$$

This output-referred model puts $N_{\mathrm{amp}}$ in the amplifier's output-port covariance entry `C[1][1]`. It sets the amplifier's position-3 noise and its position-3/position-4 correlation to zero. The complete source covariance is

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

### First recall the attenuator noise covariance

Section 4 found the noise generated by the matched 3.00 dB attenuator at 290 K. Its power transmission is $|t|^2\approx0.5011872336$, so each port emits the fraction $1-|t|^2$ of the 290 K reference noise power:

$$
\begin{aligned}
n_A&=(1-|t|^2)k_B T_0\\
&=(1-0.5011872336)(4.0038821\times10^{-21})\\
&\approx1.997187507\times10^{-21}\,\mathrm{W/Hz}.
\end{aligned} \tag{5.1}
$$

Call the attenuator's outgoing noise waves $u$ at port 1 and $v$ at port 2. Each has power $n_A$. For this matched attenuator they are uncorrelated, so the off-diagonal entries of their covariance matrix are zero:

$$
\begin{aligned}
\mathbf C_A
&=\mathbb E\!\left\{\begin{bmatrix}u\\v\end{bmatrix}
\begin{bmatrix}u^*&v^*\end{bmatrix}\right\}
=\begin{bmatrix}n_A&0\\0&n_A\end{bmatrix}\\
&\approx10^{-21}\,\mathrm{W/Hz}
\begin{bmatrix}1.997187507&0\\0&1.997187507\end{bmatrix}.
\end{aligned} \tag{5.2}
$$

Rows and columns 1 and 2 of $\mathbf C_A$ correspond to attenuator ports 1 and 2. When we build the six-position source covariance below, these two diagonal values go into positions $(1,1)$ and $(2,2)$.

### Second calculate the amplifier noise $N_{\mathrm{amp}}$

Use the **amplifier by itself**, with a matched 290 K source and matched load. Its forward wave gain is $S^{\mathrm{amp}}_{21}=10$, which is a power gain of 100 (20 dB). Its stated noise figure is 4 dB. Convert these two numbers to ordinary ratios:

$$
G_{\mathrm{amp}}=|S^{\mathrm{amp}}_{21}|^2=10^2=100,\qquad
F_{\mathrm{amp}}=10^{4/10}\approx2.5118864315. \tag{5.3}
$$

At 290 K, a matched source supplies $k_B T_0=4.0038821\times10^{-21}$ W/Hz of noise. The amplifier sends 100 times that source noise to its output:

$$
N_{\mathrm{source,out}}
=G_{\mathrm{amp}}k_B T_0
=100(1.380649\times10^{-23})(290)
=4.0038821\times10^{-19}\,\mathrm{W/Hz}. \tag{5.4}
$$

The 4 dB noise figure says **total** output noise is about 2.5118864315 times this source-only output noise. The part **added by the amplifier** is total minus source-only:

$$
\begin{aligned}
N_{\mathrm{amp}}
&=(F_{\mathrm{amp}}-1)N_{\mathrm{source,out}}\\
&\approx(2.5118864315-1)(4.0038821\times10^{-19})\\
&\approx6.053415\times10^{-19}\,\mathrm{W/Hz}.
\end{aligned} \tag{5.5}
$$

This number is placed at position 4 of equation (4.9). The preceding matched attenuator presents a matched source to this amplifier when the external source is matched.

Section 4 assigned the attenuator two uncorrelated noise waves $u$ and $v$. Let $q$ be the amplifier's independent output-referred noise wave. The internal-noise source column is

$$
\mathbf c_{\mathrm{noise}}=
\begin{bmatrix}
u\\v\\0\\q\\0\\0
\end{bmatrix}. \tag{5.6}
$$

$$
\mathbb E\{|u|^2\}=\mathbb E\{|v|^2\}=n_A=1.997188\times10^{-21}\,\mathrm{W/Hz},\qquad
\mathbb E\{uv^*\}=0. \tag{5.7}
$$

$$
\mathbb E\{|q|^2\}=N_{\mathrm{amp}}=6.053415\times10^{-19}\,\mathrm{W/Hz}. \tag{5.8}
$$

The external source and load positions are zero because this calculation counts only noise generated inside the attenuator and amplifier. The amplifier noise $q$ is independent of both attenuator waves.

This worked example uses the full six-variable transfer matrix from section 3. These entries come from the unrounded component values (more digits are displayed here so the multiplication can be checked):

$$
\mathbf T\approx
\begin{bmatrix}
1&0.007079458&0.707945784&0&0.005011872&0.007079458\\
0&1&0&0&0.707945784&0\\
0&0.010000000&1&0&0.007079458&0.010000000\\
0&10&0&1&7.079457844&0.010000000\\
0&0&0&0&1&0\\
0&0&0&0&0&1
\end{bmatrix}. \tag{5.9}
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
\end{bmatrix}. \tag{5.10}
$$

The attenuator fills entries $(1,1)$ and $(2,2)$. The amplifier's $N_{\mathrm{amp}}$ from equation (5.5) fills entry $(4,4)$: $605.341502035\times10^{-21}=6.05341502035\times10^{-19}$ W/Hz.

Equation (5.10) is the **source covariance** $\mathbf C_c$: its row $i$, column $j$ entry describes the relationship between noise waves $c_i$ and $c_j$ where they enter the circuit. It does not yet tell us the noise at the circuit outputs. For example, $(C_c)_{44}$ contains only noise added by the amplifier; it does not include attenuator noise that travels through the amplifier to output $b_4$.

To find the noise that actually leaves each position, we need the **outgoing-wave covariance** $\mathbf C_b$. Section 3 gave $\mathbf b=\mathbf T\mathbf c$: each outgoing wave is a weighted sum of the source waves. This also holds for every random set of noise waves in equation (5.6).

To find their powers and correlations, multiply the outgoing column by its conjugated row and average. Substituting $\mathbf T\mathbf c$ for $\mathbf b$ gives $\mathbb E\{\mathbf b\mathbf b^{\mathrm H}\}=\mathbb E\{(\mathbf T\mathbf c)(\mathbf T\mathbf c)^{\mathrm H}\}$. Taking the conjugate transpose reverses the order, so $(\mathbf T\mathbf c)^{\mathrm H}=\mathbf c^{\mathrm H}\mathbf T^{\mathrm H}$. The circuit matrix $\mathbf T$ is fixed and can come outside the average; the remaining average $\mathbb E\{\mathbf c\mathbf c^{\mathrm H}\}$ is $\mathbf C_c$. Thus:

$$
\mathbf C_b=\mathbf T\mathbf C_c\mathbf T^{\mathrm H}. \tag{5.11}
$$

Both the rows and columns of $\mathbf C_b$ use the six positions listed in section 3: 1 and 2 are attenuator ports, 3 and 4 are amplifier ports, and 5 and 6 are the external source and load positions. The first index is the **row** and the second is the **column**: $(C_b)_{ij}=\mathbb E\{b_i b_j^*\}$. A diagonal entry such as $(C_b)_{44}$ is the noise power leaving amplifier port 4; an off-diagonal entry such as $(C_b)_{14}$ tells how noise waves $b_1$ and $b_4$ are correlated. We need $\mathbf C_b$ to read the final output noise and to see correlations created when the same source noise reaches more than one position.

For a concrete check, row 4 of $\mathbf T$ and the noise column in (5.6) give $b_4=10v+q$. The attenuator noise $v$ and amplifier noise $q$ are independent, so their powers add: $(C_b)_{44}=100n_A+N_{\mathrm{amp}}$. This is the output-noise calculation shown numerically in (5.16).

First transpose $\mathbf T$ from equation (5.9): rows become columns. All entries are real, so this is also the conjugate transpose $\mathbf T^{\mathrm H}$:

$$
\mathbf T^{\mathrm T}\approx
\begin{bmatrix}
1&0&0&0&0&0\\
0.007079458&1&0.010000000&10&0&0\\
0.707945784&0&1&0&0&0\\
0&0&0&1&0&0\\
0.005011872&0.707945784&0.007079458&7.079457844&1&0\\
0.007079458&0&0.010000000&0.010000000&0&1
\end{bmatrix}. \tag{5.12}
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
\end{bmatrix}. \tag{5.13}
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
\end{bmatrix}. \tag{5.14}
$$

For output $b_1$, multiply row 1 of $\mathbf M$ by column 1 of $\mathbf T^{\mathrm T}$. Only two products are nonzero:

$$
\begin{aligned}
(C_b)_{11}
&=\left[1.997187507(1)+0.014139005(0.007079458)\right]10^{-21}\\
&\approx1.997287603\times10^{-21}\,\mathrm{W/Hz}.
\end{aligned} \tag{5.15}
$$

For output $b_4$, multiply row 4 of $\mathbf M$ by column 4 of $\mathbf T^{\mathrm T}$. One term is attenuator noise amplified by 100; the other is amplifier-added noise:

$$
\begin{aligned}
(C_b)_{44}
&=\left[19.971875065(10)+605.341502035(1)\right]10^{-21}\\
&\approx805.060252689\times10^{-21}
=8.05060252689\times10^{-19}\,\mathrm{W/Hz}.
\end{aligned} \tag{5.16}
$$

In a zero-based JavaScript matrix, these entries are `[0][0]` and `[3][3]`. The deterministic calculation in section 3 gave $S_{21}\approx7.079457844$, so its power gain is $|S_{21}|^2\approx50.118723363$. Use the standard 290 K source-noise reference to get the conventional noise factor:

$$
\begin{aligned}
F&=1+\frac{(C_b)_{44}}{|S_{21}|^2k_B T_0}\\
&=1+\frac{8.05060252689\times10^{-19}}{50.118723363(4.0038821\times10^{-21})}\\
&\approx5.011872336,\qquad NF_{\mathrm{dB}}=10\log_{10}F=7.00\,\mathrm{dB}.
\end{aligned} \tag{5.17}
$$

### Compare directly with Friis's cascade equation

The attenuator's power gain is $G_A=|t|^2$. To use Friis's equation, first find its own noise factor from the noise $n_A$ in (5.1). A matched 290 K source contributes $G_Ak_B T_0$ at the attenuator output, and the attenuator adds $n_A=(1-G_A)k_B T_0$:

$$
\begin{aligned}
G_A&=|t|^2=10^{-3/10}\approx0.5011872336,\\
F_A&=1+\frac{n_A}{G_Ak_B T_0}\\
&=1+\frac{1-G_A}{G_A}\\
&=\frac{1}{G_A}\approx1.995262315.
\end{aligned} \tag{5.18}
$$

Friis's equation for this two-stage chain is the attenuator's noise factor plus the amplifier's excess noise factor divided by the attenuator gain:

$$
\begin{aligned}
F_{\mathrm{Friis}}
&=F_A+\frac{F_{\mathrm{amp}}-1}{G_A}\\
&=1.995262315+\frac{2.511886432-1}{0.5011872336}\\
&\approx5.011872336.
\end{aligned} \tag{5.19}
$$

Now reduce the covariance result in (5.17) to the same expression. Equation (5.16) has $(C_b)_{44}=G_{\mathrm{amp}}n_A+N_{\mathrm{amp}}$: the attenuator's output noise is amplified, then the amplifier's own noise is added. The chain's signal power gain is $|S_{21}|^2=G_A G_{\mathrm{amp}}$. Substitute $n_A$ from (5.1) and $N_{\mathrm{amp}}$ from (5.5):

$$
\begin{aligned}
F_{\mathrm{cov}}
&=1+\frac{G_{\mathrm{amp}}n_A+N_{\mathrm{amp}}}
{G_A G_{\mathrm{amp}}k_B T_0}\\
&=1+\frac{G_{\mathrm{amp}}(1-G_A)k_B T_0
 +(F_{\mathrm{amp}}-1)G_{\mathrm{amp}}k_B T_0}
{G_A G_{\mathrm{amp}}k_B T_0}\\
&=1+\frac{(1-G_A)+(F_{\mathrm{amp}}-1)}{G_A}\\
&=\frac{1}{G_A}+\frac{F_{\mathrm{amp}}-1}{G_A}\\
&=F_{\mathrm{Friis}}\approx5.011872336.
\end{aligned} \tag{5.20}
$$

Both calculations give $NF_{\mathrm{dB}}=10\log_{10}(5.011872336)=7.00$ dB. All cross-covariances in the final $\mathbf C_b$ arise from circuit transfer; the attenuator's original waves $u$ and $v$ are uncorrelated. For complex-valued circuits, use $\mathbf T^{\mathrm H}$ in the second multiplication.

## 6. Worked noise propagation for the amplifier–attenuator

Now connect the **same** 20 dB, 4 dB-noise-figure amplifier first and the **same** matched 3.00 dB attenuator second. Both remain at the values used in section 5. The amplifier still has $S_{11}=S_{12}=S_{22}=0.01$ and $S_{21}=10$. The attenuator still has $S_{11}=S_{22}=0$ and $S_{12}=S_{21}=t=10^{-3/20}$. The source and load are matched, and this covariance calculation again counts only noise made inside the two components.

The six positions now mean: 1 = amplifier input, 2 = amplifier output, 3 = attenuator input, 4 = attenuator output, 5 = external source, and 6 = external load. The connection pairs $(1,5)$, $(2,3)$, and $(4,6)$ are unchanged from section 3. Thus the **row-column order** of every matrix below is $1,2,3,4,5,6$, although the components have traded places.

### First recall the amplifier and attenuator noise

The amplifier's output-referred noise power from (5.5) is $N_{\mathrm{amp}}=6.05341502035\times10^{-19}$ W/Hz. Its equivalent noise wave $q$ now leaves at position 2. The model assigns no independent noise at amplifier input position 1, so its two-port covariance is

$$
\mathbf C_{\mathrm{amp}}
=\begin{bmatrix}0&0\\0&N_{\mathrm{amp}}\end{bmatrix}
\approx10^{-21}\,\mathrm{W/Hz}
\begin{bmatrix}0&0\\0&605.341502035\end{bmatrix}. \tag{6.1}
$$

The attenuator's two uncorrelated noise waves $u$ and $v$ now leave at positions 3 and 4. From (5.1), each has power $n_A=1.99718750653\times10^{-21}$ W/Hz. Its two-port covariance is

$$
\mathbf C_A
=\begin{bmatrix}n_A&0\\0&n_A\end{bmatrix}
\approx10^{-21}\,\mathrm{W/Hz}
\begin{bmatrix}1.997187507&0\\0&1.997187507\end{bmatrix}. \tag{6.2}
$$

### Build the reversed six-position network

Put the amplifier block first and the attenuator block second. The final two rows represent the matched external source and load:

$$
\mathbf S\approx
\begin{bmatrix}
0.010000000&0.010000000&0&0&0&0\\
10&0.010000000&0&0&0&0\\
0&0&0&0.707945784&0&0\\
0&0&0.707945784&0&0&0\\
0&0&0&0&0&0\\
0&0&0&0&0&0
\end{bmatrix}. \tag{6.3}
$$

Use the same connection matrix $\boldsymbol\Gamma$ as in (3.3). Subtract (6.3) from it, entry by entry:

$$
\mathbf W=\boldsymbol\Gamma-\mathbf S\approx
\begin{bmatrix}
-0.010000000&-0.010000000&0&0&1&0\\
-10&-0.010000000&1&0&0&0\\
0&1&0&-0.707945784&0&0\\
0&0&-0.707945784&0&0&1\\
1&0&0&0&0&0\\
0&0&0&1&0&0
\end{bmatrix}. \tag{6.4}
$$

As in section 5, the transfer matrix sends a source wave at column $j$ to the outgoing waves in its six rows. Invert $\mathbf W$ and multiply by $\boldsymbol\Gamma$:

$$
\mathbf T=\boldsymbol\Gamma\mathbf W^{-1}\approx
\begin{bmatrix}
1&0&0.010000000&0&0.010000000&0.007079458\\
0&1&0.010000000&0&10&0.007079458\\
0&0&1&0&0&0.707945784\\
0&0.707945784&0.007079458&1&7.079457844&0.005011872\\
0&0&0&0&1&0\\
0&0&0&0&0&1
\end{bmatrix}. \tag{6.5}
$$

Check the signal before doing noise. A unit wave at external source position 5 selects column 5 of $\mathbf T$:

$$
\mathbf c_{\mathrm{signal}}=\begin{bmatrix}0\\0\\0\\0\\1\\0\end{bmatrix},\qquad
\mathbf b_{\mathrm{signal}}=\mathbf T\mathbf c_{\mathrm{signal}}\approx
\begin{bmatrix}0.010000000\\10\\0\\7.079457844\\1\\0\end{bmatrix}. \tag{6.6}
$$

Thus $S_{11}=0.01$ and $S_{21}=7.079457844$ for the reversed chain. Its signal power gain is $|S_{21}|^2=G_{\mathrm{amp}}G_A=100(0.5011872336)=50.118723363$.

### Propagate the noise step by step

For the internal-noise calculation, put the amplifier wave $q$ at position 2 and the attenuator waves $u,v$ at positions 3,4. External positions 5,6 have zero noise sources:

$$
\mathbf c_{\mathrm{noise}}=
\begin{bmatrix}0\\q\\u\\v\\0\\0\end{bmatrix}. \tag{6.7}
$$

The three waves are independent. Place the powers from (6.1) and (6.2) on the corresponding diagonal positions. Factoring out $10^{-21}$ W/Hz gives

$$
\mathbf C_c\approx10^{-21}\,\mathrm{W/Hz}
\begin{bmatrix}
0&0&0&0&0&0\\
0&605.341502035&0&0&0&0\\
0&0&1.997187507&0&0&0\\
0&0&0&1.997187507&0&0\\
0&0&0&0&0&0\\
0&0&0&0&0&0
\end{bmatrix}. \tag{6.8}
$$

Use the same propagation rule as (5.11). Here $\mathbf C_c$ describes where noise enters; $\mathbf C_b$ describes the outgoing noise after the connections and component gains act on it:

$$
\mathbf C_b=\mathbf T\mathbf C_c\mathbf T^{\mathrm H}. \tag{6.9}
$$

All entries are real in this example, so $\mathbf T^{\mathrm H}=\mathbf T^{\mathrm T}$. Transpose (6.5) by turning its rows into columns:

$$
\mathbf T^{\mathrm T}\approx
\begin{bmatrix}
1&0&0&0&0&0\\
0&1&0&0.707945784&0&0\\
0.010000000&0.010000000&1&0.007079458&0&0\\
0&0&0&1&0&0\\
0.010000000&10&0&7.079457844&1&0\\
0.007079458&0.007079458&0.707945784&0.005011872&0&1
\end{bmatrix}. \tag{6.10}
$$

Do the first multiplication $\mathbf M=\mathbf T\mathbf C_c$. Only columns 2, 3, and 4 can be nonzero. For example, $M_{42}=0.707945784(605.341502035)\approx428.548964479$ in the factored units:

$$
\mathbf M=\mathbf T\mathbf C_c\approx10^{-21}\,\mathrm{W/Hz}
\begin{bmatrix}
0&0&0.019971875&0&0&0\\
0&605.341502035&0.019971875&0&0&0\\
0&0&1.997187507&0&0&0\\
0&428.548964479&0.014139005&1.997187507&0&0\\
0&0&0&0&0&0\\
0&0&0&0&0&0
\end{bmatrix}. \tag{6.11}
$$

Do the second multiplication $\mathbf C_b=\mathbf M\mathbf T^{\mathrm T}$. The diagonal entries are outgoing noise powers; off-diagonal entries show correlations between different outgoing waves:

$$
\mathbf C_b\approx10^{-21}\,\mathrm{W/Hz}
\begin{bmatrix}
0.000199719&0.000199719&0.019971875&0.000141390&0&0\\
0.000199719&605.341701754&0.019971875&428.549105869&0&0\\
0.019971875&0.019971875&1.997187507&0.014139005&0&0\\
0.000141390&428.549105869&0.014139005&305.386720408&0&0\\
0&0&0&0&0&0\\
0&0&0&0&0&0
\end{bmatrix}. \tag{6.12}
$$

To check the input reflection noise, row 1 of $\mathbf M$ times column 1 of $\mathbf T^{\mathrm T}$ gives

$$
(C_b)_{11}=[0.019971875(0.010000000)]10^{-21}
\approx1.997187507\times10^{-25}\,\mathrm{W/Hz}. \tag{6.13}
$$

For output $b_4$, multiply row 4 of $\mathbf M$ by column 4 of $\mathbf T^{\mathrm T}$:

$$
\begin{aligned}
(C_b)_{44}
&=[428.548964479(0.707945784)
+0.014139005(0.007079458)+1.997187507(1)]10^{-21}\\
&\approx305.386720408\times10^{-21}
=3.05386720408\times10^{-19}\,\mathrm{W/Hz}.
\end{aligned} \tag{6.14}
$$

Row 4 of (6.5) gives a simpler way to see the three contributions: $b_4=tq+(0.01t)u+v$. Thus $(C_b)_{44}=t^2N_{\mathrm{amp}}+(0.01t)^2n_A+n_A$. The amplifier noise is attenuated on its way to the output. The wave $u$ leaves the attenuator toward the amplifier, reflects from the amplifier's $S_{22}=0.01$, and then passes through the attenuator to the output. The wave $v$ leaves directly at the output.

Use the same 290 K input reference as in section 5. The covariance method gives

$$
\begin{aligned}
F_{\mathrm{cov}}
&=1+\frac{(C_b)_{44}}{|S_{21}|^2k_B T_0}\\
&=1+\frac{3.05386720408\times10^{-19}}
{50.118723363(4.0038821\times10^{-21})}\\
&\approx2.521839553,
\qquad NF_{\mathrm{cov}}=10\log_{10}F_{\mathrm{cov}}\approx4.017174521\,\mathrm{dB}.
\end{aligned} \tag{6.15}
$$

### Compare with Friis for the reversed order

The first stage is now the amplifier, with $G_{\mathrm{amp}}=100$ and $F_{\mathrm{amp}}=2.511886432$. The second stage is the attenuator, with $F_A=1/G_A=1.995262315$ from (5.18). The usual matched-stage Friis equation predicts

$$
\begin{aligned}
F_{\mathrm{Friis}}
&=F_{\mathrm{amp}}+\frac{F_A-1}{G_{\mathrm{amp}}}\\
&=2.511886432+\frac{1.995262315-1}{100}\\
&\approx2.521839055,
\qquad NF_{\mathrm{Friis}}\approx4.017173662\,\mathrm{dB}.
\end{aligned} \tag{6.16}
$$

Both methods round to **4.017 dB**, well below the 7.00 dB of the attenuator-first chain. At full precision they differ slightly because Friis's simple form assumes matched stages, while this example keeps the amplifier's small output reflection $S_{22}=0.01$. The extra term is exactly the reflected $u$ noise in (6.14):

$$
\begin{aligned}
F_{\mathrm{cov}}-F_{\mathrm{Friis}}
&=\frac{|S^{\mathrm{amp}}_{22}|^2G_A n_A}
{G_A G_{\mathrm{amp}}k_B T_0}\\
&=\frac{|S^{\mathrm{amp}}_{22}|^2(1-G_A)}{G_{\mathrm{amp}}}\\
&=\frac{(0.01)^2(1-0.5011872336)}{100}
\approx4.98813\times10^{-7}.
\end{aligned} \tag{6.17}
$$

Adding that small reflection term makes the comparison exact:

$$
F_{\mathrm{Friis}}+\Delta F
=2.521839054659+0.000000498813
=2.521839553472=F_{\mathrm{cov}}. \tag{6.18}
$$

Here $\Delta F$ is the correction in (6.17). If the amplifier output is ideally matched, $S^{\mathrm{amp}}_{22}=0$, then $\Delta F=0$ and the usual Friis equation equals the covariance result exactly. The example above keeps the amplifier parameters unchanged so the comparison also shows where the usual Friis assumption matters.

## 7. From output noise to noise figure

Sections 5 and 6 calculate noise generated inside the two-stage network. Noise figure also needs a source reference. At $T_0=290\,\mathrm K$, a source supplies $k_BT_0$ W/Hz of available thermal noise. Noise factor compares the signal-to-noise ratios before and after the network:

$$
F=\frac{\mathrm{SNR}_{\mathrm{in}}}{\mathrm{SNR}_{\mathrm{out}}},\qquad NF_{\mathrm{dB}}=10\log_{10}F. \tag{7.1}
$$

For fixed source and termination conditions, calculate the output noise from the source alone and then the total output noise. The signal follows the same path in both calculations, so

$$
F=\frac{P_{N,\mathrm{total}}}{P_{N,\mathrm{source\ only}}}. \tag{7.2}
$$

The leading `1` in equations (5.17) and (6.15) accounts for the source-only noise. For a matched two-port with a cold output termination, equation (7.2) becomes

$$
F=1+\frac{C_{22}}{|S_{21}|^2k_BT_0}. \tag{7.3}
$$

For a multiport or a mismatched source, reflections and noise entering other ports also matter. The selected $S_{21}$ and $C_{22}$ alone are then insufficient.

## 8. Noise data carried by an `nPort`

An `nPort` carries S-parameter rows and noise covariance rows at the same frequencies and in the same port order:

```js
network.spars[i] = [frequency, s11, s12, s21, s22];
network.noise[i] = {
    frequency: frequency,
    C: [[c11, c12], [c21, c22]]
};
```

The entries are complex. For an $n$-port, both the S-matrix and the noise covariance are $n\times n$. A diagonal covariance entry is outgoing noise power at one port, in W/Hz. An off-diagonal entry records correlation between two outgoing noise waves. In symbols,

$$
\mathbf C=\mathbb E\{\mathbf c\mathbf c^{\mathrm H}\}. \tag{8.1}
$$

`nP.Attn()` constructs covariance from attenuation and temperature. `nP.Amp()` converts its two-port noise parameters into covariance when constructed. A passive nPort without explicitly supplied covariance can derive it from S-parameters and its stored temperature:

$$
\mathbf C=k_BT(\mathbf I-\mathbf S\mathbf S^{\mathrm H}). \tag{8.2}
$$

$F_{\min}$, $\Gamma_{\mathrm{opt}}$, and $R_n$ describe a two-port amplifier but are not themselves a covariance matrix. Propagation uses the covariance. An nPort returned by `nodal()`, `cas()`, or `cascade()` has the same S and noise row shapes, so it can be reused in a larger network.

## 9. How `nodal()` propagates noise

At each frequency, `nodal()` puts every component S-matrix into its block of the full $\mathbf S$ matrix. It puts that component's covariance into the matching block of $\mathbf C_c$. The blocks between independent components start at zero. The connection labels build $\boldsymbol\Gamma$, as in sections 3–6, and the scattering solve uses

$$
\mathbf W=\boldsymbol\Gamma-\mathbf S,\qquad \mathbf a=\mathbf W^{-1}\mathbf c. \tag{9.1}
$$

The external-port rows of $\mathbf W^{-1}$ show how each component noise wave reaches each output. Let $\mathbf L$ contain those rows and the columns for component noise waves. Then `nodal()` calculates

$$
\mathbf C_{\mathrm{out}}=\mathbf L\mathbf C_c\mathbf L^{\mathrm H}. \tag{9.2}
$$

This is the same propagation worked through for six positions in sections 5 and 6. The resulting covariance and S-parameters are stored at the external ports. Source and termination noise are measurement conditions, added later when noise figure is requested. That lets one combined network be measured under several source reflections or termination temperatures without rebuilding it.

## 10. How `cas()` combines two two-ports

`first.cas(second)` connects port 2 of the first two-port to port 1 of the second. For their S-parameters, the internal-reflection denominator is

$$
D=1-S^A_{22}S^B_{11}. \tag{10.1}
$$

`cas()` also transfers each component's *full* covariance to the two remaining external ports. Its transfer matrices are

$$
\begin{aligned}
\mathbf F_A&=\begin{bmatrix}1&S^A_{12}S^B_{11}/D\\0&S^B_{21}/D\end{bmatrix},\\[6pt]
\mathbf F_B&=\begin{bmatrix}S^A_{12}/D&0\\S^B_{21}S^A_{22}/D&1\end{bmatrix}.
\end{aligned} \tag{10.2}
$$

Each column shows where one component noise wave appears at the two external ports. Independent component noises add after being transferred:

$$
\mathbf C_{AB}=\mathbf F_A\mathbf C_A\mathbf F_A^{\mathrm H}
+\mathbf F_B\mathbf C_B\mathbf F_B^{\mathrm H}. \tag{10.3}
$$

The off-diagonal correlations *within* each component are preserved. Directly adding $\mathbf C_A+\mathbf C_B$ would miss gain and reflections. `cas()` returns a new two-port with combined S-parameters and covariance at each frequency.

## 11. How `cascade()` uses `cas()`

`nP.cascade(a, b, c)` starts with `a`, calls `a.cas(b)`, and then calls the resulting nPort's `.cas(c)`. It has no separate noise formula: every intermediate result already contains the noise of its preceding stages. For two two-ports, these three operations should give the same S-parameters and covariance:

```js
var viaMethod = attenuator.cas(amplifier);
var viaCascade = nP.cascade(attenuator, amplifier);
var viaNodal = nP.nodal(
    [attenuator, 1, 2],
    [amplifier, 2, 3],
    ['out', 1, 3]
);
```

For `nP.Attn(3, 290)` and the fully matched `nP.Amp(20, 4)`, attenuator first gives 17 dB gain and 7 dB NF. Reversing the stages gives 17 dB gain and about 4.017 dB NF. The small correction in equation (6.17) comes from the semi-ideal amplifier used in the earlier hand calculation; it vanishes for the fully matched amplifier. Use `cas()` and `cascade()` for series chains of two-ports; `nodal()` handles tees, branches, feedback, and arbitrary multiports.

## 12. How `noiseFigure.js` calculates NF and output noise floor

`noiseFigure.js` contains the internal `noiseAnalysis()` helper called by `nPort.out()`. It does not construct an nPort. It receives one frequency's S-matrix and covariance, the selected input and output ports, and the measurement conditions. It returns both the noise factor and the total output noise density. For `NF31dB` or `noiseFloor31dBmHz`, port 1 is the input and port 3 is the output.

The conditions are source reflection, each other port's termination reflection and temperature, and the NF reference temperature $T_0$. Defaults are a matched source, matched terminations, $T_0=290\,\mathrm K$, 290 K at unused ports, and a cold termination at the selected output. Reflections may be complex; their phase matters when noise waves are correlated.

An outgoing wave can reflect and reenter the network. With the reflection coefficients on the diagonal of $\boldsymbol\Gamma$, the helper solves

$$
\mathbf b=\mathbf S\mathbf a+\mathbf c,\qquad
\mathbf a=\boldsymbol\Gamma\mathbf b+\mathbf u,\qquad
\mathbf H=(\mathbf I-\mathbf S\boldsymbol\Gamma)^{-1}. \tag{12.1}
$$

$\mathbf u$ is a test signal or noise supplied from outside; $\mathbf c$ is noise generated inside. Thus $\mathbf H\mathbf S$ transfers external waves and $\mathbf H$ transfers component noise. For input $i$ and output $o$, let $A=(\mathbf H\mathbf S)_{oi}$. With one unit of available input signal power in a 1 Hz bandwidth, the output signal and source-only noise are

$$
P_{S,\mathrm{out}}=|A|^2(1-|\Gamma_i|^2),\qquad
P_{N,\mathrm{source\ only}}=|A|^2(1-|\Gamma_i|^2)k_BT_0. \tag{12.2}
$$

The helper adds component noise at the selected output and noise from every other terminated port $j$:

$$
P_{N,\mathrm{component}}=(\mathbf H\mathbf C\mathbf H^{\mathrm H})_{oo}, \tag{12.3}
$$

$$
P_{N,j}=|(\mathbf H\mathbf S)_{oj}|^2 k_BT_j(1-|\Gamma_j|^2). \tag{12.4}
$$

It sums these powers and applies equation (7.2):

$$
F=\frac{P_{N,\mathrm{source\ only}}+P_{N,\mathrm{component}}+
\sum_{j\ne i}P_{N,j}}{P_{N,\mathrm{source\ only}}}. \tag{12.5}
$$

The same summed output noise gives the output noise floor in a 1 Hz bandwidth:

$$
N_{\mathrm{out,dBm/Hz}}=10\log_{10}\!\left(\frac{P_{N,\mathrm{total}}}{10^{-3}\,\mathrm W}\right). \tag{12.6}
$$

For a matched two-port with a cold output measurement load, this reduces to

$$
N_{\mathrm{out,dBm/Hz}}=10\log_{10}\!\left(\frac{k_BT_0}{10^{-3}\,\mathrm W}\right)
+G_{21,\mathrm{dB}}+\mathrm{NF}_{21,\mathrm{dB}}. \tag{12.7}
$$

A chosen input signal level is unnecessary because it cancels in the SNR ratio. `nPort.out()` converts $F$ to decibels for a selector ending in `dB` and returns a frequency table:

```js
var matched = network.out('s21dB', 'NF21dB');
var floor = network.out('noiseFloor');
var multiport = network.out('NF31dB', {
    source: {reflection: nP.complex(0.2, 0.1)},
    terminations: {
        2: {reflection: 0.3, temperature: 310},
        3: {temperature: 0}
    },
    referenceTemperature: 290
});
var multiportFloor = network.out('noiseFloor31dBmHz');
```

`NF31` returns a linear noise factor. `noiseFloor` is the port-2-from-port-1 shorthand and returns dBm/Hz. The parenthesized forms, such as `NF(11,2)dB` and `noiseFloor(11,2)dBmHz`, support larger port numbers. These selectors work on nPorts returned by `nodal()`, `cas()`, or `cascade()`. A three-port test checks source mismatch, reflecting terminations at different temperatures, and component noise against a direct solution of the port equations.
