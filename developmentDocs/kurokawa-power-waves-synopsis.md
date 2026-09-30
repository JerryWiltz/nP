<!-- Modified: 2026-09-14 -->
# Kurokawa's power waves and scattering matrix: a synopsis

**Source.** K. Kurokawa, “Power Waves and the Scattering Matrix,” *IEEE Transactions on Microwave Theory and Techniques*, vol. 13, no. 2, pp. 194–202, 1965. The source PDF is preserved at [`dev/raw/kurokawa_power_waves_scattering_matrix_1965.pdf`](../dev/raw/kurokawa_power_waves_scattering_matrix_1965.pdf).

This is a teaching synopsis, not a transcription. The paper replaces voltage/current intuition with variables whose squared magnitudes have a direct power meaning, then develops the corresponding reflection coefficient and multiport scattering matrix. It is especially useful for mismatched networks, complex reference impedances, negative-resistance devices, and amplifier matching.

## 1. Why introduce new waves?

Traveling waves are natural on a uniform transmission line, but a terminated circuit can have two counter-propagating waves even when the circuit has no independent source. For power and noise calculations, Kurokawa wants variables tied to the power exchanged with each attached circuit. He therefore uses the terminal voltage and current at each port and the impedance looking outward from that port.

Notation used below:

- `V_i` is the RMS phasor voltage at port `i`.
- `I_i` flows **into** the network at port `i`.
- `Z_i = R_i + jX_i` is the attached circuit's reference impedance; `j² = -1`.
- `Z_L = R_L + jX_L` is a one-port load.
- `Re{Z}` means the real part of a complex impedance.
- A dagger, `†`, means conjugate transpose; for a scalar it is ordinary complex conjugation.

## 2. Exchangeable power of a generator

Start with a Thevenin generator: open-circuit voltage (E_0), internal impedance (Z_i), and load (Z_L). The load current is

$$
I=\frac{E_0}{Z_i+Z_L} . \tag{1}
$$

The average real power delivered to the load is

$$
P_L=\Re\{Z_L\}|I|^2
 =\frac{|E_0|^2R_L}{|Z_i+Z_L|^2}. \tag{2}
$$

Writing the impedances in rectangular form gives

$$
P_L=\frac{|E_0|^2R_L}{(R_L+R_i)^2+(X_L+X_i)^2}. \tag{3}
$$

For `R_i > 0`, the denominator is smallest and the delivered power is largest when

$$
R_L=R_i,\qquad X_L=-X_i . \tag{4}
$$

The resulting available power is

$$
P_{\rm av}=\frac{|E_0|^2}{4R_i}. \tag{5}
$$

If `R_i < 0`, the load power can become unbounded near the negative-conjugate impedance, so (5) is not a maximum. Kurokawa still calls the finite value in (5) the **exchangeable power**: the stationary power scale associated with the generator, positive for a source and negative for a device that absorbs exchangeable power. Define

$$
p_i=\begin{cases}+1,&R_i>0,\\-1,&R_i<0.\end{cases} \tag{6}
$$

## 3. Definition and inversion of power waves

Kurokawa's incident and reflected power waves are

$$
a_i=\frac{V_i+Z_iI_i}{2\sqrt{|R_i|}},\qquad
b_i=\frac{V_i-Z_i^{*}I_i}{2\sqrt{|R_i|}} . \tag{7}
$$

The absolute value in the denominator is the later convention that keeps the square root real even when `R_i < 0`. (The original paper used `Re Z_i` and then introduced the sign `p_i`.)

Solving (7) back for terminal variables first gives the current

$$
I_i=\sqrt{|R_i|}\,\frac{a_i-b_i}{R_i}. \tag{8}
$$

The voltage follows from (a_i+b_i=(V_i+jX_iI_i)/\sqrt{|R_i|}):

$$
V_i=\sqrt{|R_i|}\,(a_i+b_i)-jX_iI_i . \tag{9}
$$

For a positive-real reference ((R_i>0)), this reduces to the familiar pair (V=\sqrt{R_i}(a+b)), (I=(a-b)/\sqrt{R_i}).

The key power identity is

$$
\Re\{V_iI_i^{*}\}=p_i\bigl(|a_i|^2-|b_i|^2\bigr). \tag{10}
$$

Thus (a_i) represents an exchangeable power magnitude and (b_i) represents the portion returned toward the attached circuit. For a positive-real reference, the net power entering the network is simply (|a_i|^2-|b_i|^2), in watts when the waves use RMS normalization.

## 4. One-port reflection coefficient

For a one-port load, define the power-wave reflection coefficient by

$$
s=\frac{b}{a}. \tag{11}
$$

Substitute (V=Z_LI) into (7):

$$
s=\frac{Z_L-Z_i^{*}}{Z_L+Z_i}. \tag{12}
$$

The conjugate on (Z_i^{*}) is intentional. It makes (s=0) when the load is the conjugate match (Z_L=Z_i^{*}), which is exactly the condition in (4). With (Z_i=R_i+jX_i),

$$
s=\frac{(R_L-R_i)+j(X_L+X_i)}{(R_L+R_i)+j(X_L+X_i)}. \tag{13}
$$

Consequently, (|s|<1) when (R_L) and (R_i) have the same sign, and (|s|>1) when their signs differ. The power reflection coefficient is (|s|^2); the associated power transmission coefficient is (1-|s|^2).

When the reference is real and positive, (12) becomes the usual voltage-wave result (s=(Z_L-Z_0)/(Z_L+Z_0)).

## 5. Extension to an n-port

Collect port quantities into columns (mathbf a,mathbf b,mathbf v,mathbf i). Define diagonal matrices

$$
\mathbf F=\operatorname{diag}\!\left(\frac{1}{2\sqrt{|R_1|}},\ldots,\frac{1}{2\sqrt{|R_n|}}\right),
\qquad
\mathbf G=\operatorname{diag}(Z_1,\ldots,Z_n). \tag{14}
$$

Then (7) becomes

$$
\mathbf a=\mathbf F(\mathbf v+\mathbf G\mathbf i),\qquad
\mathbf b=\mathbf F(\mathbf v-\mathbf G^{\dagger}\mathbf i). \tag{15}
$$

If the network has impedance matrix (mathbf Z), then

$$
\mathbf v=\mathbf Z\mathbf i . \tag{16}
$$

Eliminating (mathbf v) and (mathbf i) produces the power-wave scattering relation

$$
\mathbf b=\mathbf S\mathbf a, \tag{17}
$$

with

$$
\mathbf S=\mathbf F(\mathbf Z-\mathbf G^{\dagger})
(\mathbf Z+\mathbf G)^{-1}\mathbf F^{-1}. \tag{18}
$$

The inverse conversion is

$$
\mathbf Z=\mathbf F^{-1}(\mathbf I-\mathbf S)^{-1}
(\mathbf S\mathbf G+\mathbf G^{\dagger})\mathbf F . \tag{19}
$$

Here (S_{ij}) is the outgoing power wave at port (i) caused by an incident wave at port (j), with all other incident waves set to zero.

## 6. Reciprocity and losslessness

An ordinary reciprocal impedance network satisfies

$$
\mathbf Z=\mathbf Z^{t}. \tag{20}
$$

For power waves, reciprocity is weighted by the signs of the reference real parts. Let (mathbf P=\operatorname{diag}(p_1,\ldots,p_n)). Kurokawa's condition is

$$
\mathbf S^{t}=\mathbf P\mathbf S\mathbf P . \tag{21}
$$

Therefore (S_{ij}=S_{ji}) when ports (i,j) have reference impedances with real parts of the same sign; their off-diagonal terms differ by a minus sign when the signs differ. Their magnitudes are always equal.

For a lossless network, total real input power is zero. Using (10) and (17) gives

$$
\mathbf S^{\dagger}\mathbf P\mathbf S=\mathbf P . \tag{22}
$$

For a passive (possibly lossy) network, the left-over power is nonnegative, so the corresponding matrix is positive semidefinite:

$$
\mathbf P-\mathbf S^{\dagger}\mathbf P\mathbf S\succeq0 . \tag{23}
$$

For a two-port with positive-real references, (22) reduces to the familiar unitary condition (mathbf S^{\dagger}\mathbf S=\mathbf I). It implies equal input/output reflection magnitudes for a lossless two-port, even if the two-port is nonreciprocal.

## 7. Frequency and reference-plane results

Kurokawa differentiates the scattering relation with respect to angular frequency and relates (d\mathbf S/d\omega) to stored electric and magnetic energy. The practical message is that the slope and phase delay of a lossless reciprocal network are constrained by stored energy; negative-resistance ports contribute with a negative sign. This is a network-theory result, not a new nP API requirement.

If the attached reference impedances change from (Z_i) to (Z_i'), the waves must be renormalized and the scattering matrix changes. The paper gives a diagonal-matrix transformation in terms of each old-reference reflection coefficient. In implementation terms, one must transform the complete wave vectors, not merely rescale individual S entries.

The paper applies this transformation to a two-port amplifier: choosing source and load impedances so that the transformed (S'_{11}) and (S'_{22}) vanish gives simultaneous input/output matching. The remaining inequalities on the reference impedances are the stability conditions; solving the matching equations alone is not sufficient.

## 8. How this maps to nP

nP currently uses a real global reference impedance (`nP.global.Ro`, normally 50 Ω). Therefore its public power-wave formulas are the positive-real special case:

$$
a_i=\frac{V_i+R_0I_i}{2\sqrt{R_0}},\qquad
b_i=\frac{V_i-R_0I_i}{2\sqrt{R_0}},\qquad
\Re\{V_iI_i^{*}\}=|a_i|^2-|b_i|^2 . \tag{24}
$$

This is why a matched 50 Ω load has (s=0), a resistor (R) has (s=(R-R_0)/(R+R_0)), and an nP S-parameter row contains ordinary complex numbers rather than separate forward/backward voltage records. The generalized complex-reference and negative-resistance machinery in Kurokawa's paper is the theoretical extension; it should not be implied to be supported by nP unless an API explicitly adds it.

For nP's nodal and cascade analyses, the paper's central conceptual separation remains useful: wiring determines how port waves are connected, while each component supplies its own S-parameters (and, when applicable, noise covariance). The Γ/interconnect matrix is therefore a connection operator, not a replacement for the component S matrix.

## 9. Main takeaways

1. Power waves are a linear change of variables from ((V,I)), chosen so their squared magnitudes represent exchangeable power.
2. The conjugate in (Z_i^{*}) makes the zero-reflection condition the conjugate match, including reactive reference impedances.
3. The scattering matrix is a coordinate representation of the same linear n-port as its impedance matrix.
4. Reciprocity and losslessness are weighted by the signs of (Re Z_i); ordinary (S=S^t) and (S^{\dagger}S=I) are special positive-real cases.
5. Changing reference impedances changes the whole S matrix through a wave-renormalization transform.
6. For present-day nP work, the real-(R_0) equations are the operative subset; Kurokawa's general equations explain where those formulas come from and what would need to change for active or complex-reference devices.
