<!-- Modified: 2026-09-10 -->
# One physical resistor-noise source and its two-port wave column

This note separates three ideas:

```text
n = one physical equivalent resistor-noise voltage source
c = the two-port wave effect of that one source
C = covariance of the entries in c
```

The examples use `R = 75 Ω` and `Z0 = 50 Ω`.

## 1. One physical source is not two physical sources

Model a resistor's thermal noise with one equivalent series voltage source `n`.
`n` is an instantaneous random voltage. It is not automatically a covariance
and it is not two separate port sources. The two-port representation converts
that one voltage into two outgoing wave entries:

```text
c = [c1, c2]ᵀ
```

The covariance is calculated after forming the wave products:

$$
\mathbf C=E\{\mathbf c\mathbf c^\dagger\},\qquad
C_{ik}=E\{c_i c_k^*\}.
\tag{1}
$$

Thus `c1` and `c2` are two representations of the same physical source `n`,
not two independent resistors.

### Why the column produces a square matrix

The column does not become square by itself. The square matrix comes from
multiplying the column by its conjugate-transposed row:

$$
\mathbf c\mathbf c^\dagger
=\begin{bmatrix}c_1\\c_2\end{bmatrix}
\begin{bmatrix}c_1^*&c_2^*\end{bmatrix}
=\begin{bmatrix}
c_1c_1^*&c_1c_2^*\\
c_2c_1^*&c_2c_2^*
\end{bmatrix}.
\tag{2}
$$

The dimensions are:

```text
(2 rows × 1 column) × (1 row × 2 columns)
= 2 rows × 2 columns
```

The four positions record every pairwise relationship:

```text
C11 = c1 with c1  → noise power at port 1
C22 = c2 with c2  → noise power at port 2
C12 = c1 with c2  → correlation between ports
C21 = c2 with c1  → reverse correlation
```

After averaging over noise outcomes:

$$\mathbf C=E\{\mathbf c\mathbf c^\dagger\}.\tag{3}$$

The column `c` contains the noise-wave values. The square matrix `C` contains
the powers and correlations among those values.

## 2. Series resistor plus internal source

The two-port is a 75 Ω series resistor with an ideal internal voltage source
`n` in series with it. With the internal source active and both external
sources shorted, the source sees:

```text
50 Ω + 75 Ω + 50 Ω = 175 Ω
```

The source current is:

$$I_n=\frac{n}{R+2Z_0}.\tag{4}$$

For power waves, with no external incident waves (`a = 0`), the source
contribution is:

$$
\mathbf c_{\mathrm{series}}
=\frac{\sqrt{Z_0}\,n}{R+2Z_0}
\begin{bmatrix}1\\-1\end{bmatrix}.
\tag{5}
$$

For 75 Ω and 50 Ω:

$$\mathbf c_{\mathrm{series}}=0.0404061\,n\begin{bmatrix}1\\-1\end{bmatrix}.\tag{6}$$

The opposite signs come from the source polarity: the same series source
drives the two ports in opposite directions.

The deterministic S-matrix is:

$$
\mathbf S_{\mathrm{series}}
=\frac{1}{R+2Z_0}\begin{bmatrix}R&2Z_0\\2Z_0&R\end{bmatrix}
=\begin{bmatrix}3/7&4/7\\4/7&3/7\end{bmatrix}.
\tag{7}
$$

If the physical source has voltage-noise PSD `S_n` in V²/Hz:

$$
\mathbf C_{\mathrm{series}}
=\frac{Z_0S_n}{(R+2Z_0)^2}\begin{bmatrix}1&-1\\-1&1\end{bmatrix}.
\tag{8}
$$

For thermal noise, `S_n = 4 kB T R`, giving:

$$
\mathbf C_{\mathrm{series}}=\frac{4k_BT RZ_0}{(R+2Z_0)^2}
\begin{bmatrix}1&-1\\-1&1\end{bmatrix}
=\frac{24}{49}k_BT\begin{bmatrix}1&-1\\-1&1\end{bmatrix}.
\tag{9}
$$

## 3. Parallel resistor plus source in its branch

Now place one series noise source and the resistor in a shunt branch:

```text
common port node ── n ── R ── ground
```

With external sources shorted, the two 50 Ω terminations appear in parallel:

```text
Zload = 50 || 50 = 25 Ω
```

The common node voltage is:

$$V_{\mathrm{node}}=n\frac{Z_0/2}{R+Z_0/2}=n\frac{Z_0}{2R+Z_0}.\tag{10}$$

Both ports see the same node voltage, so their wave contributions have the
same sign:

$$\mathbf c_{\mathrm{parallel}}=\frac{n\sqrt{Z_0}}{2R+Z_0}\begin{bmatrix}1\\1\end{bmatrix}.\tag{11}$$

For 75 Ω and 50 Ω:

$$\mathbf c_{\mathrm{parallel}}=0.0353553\,n\begin{bmatrix}1\\1\end{bmatrix}.\tag{12}$$

The parallel S-matrix is:

$$\mathbf S_{\mathrm{parallel}}=\begin{bmatrix}-\dfrac{Z_0}{2R+Z_0}&\dfrac{2R}{2R+Z_0}\\\dfrac{2R}{2R+Z_0}&-\dfrac{Z_0}{2R+Z_0}\end{bmatrix}=\begin{bmatrix}-0.25&0.75\\0.75&-0.25\end{bmatrix}.\tag{13}$$

For voltage-noise PSD `S_n`:

$$\mathbf C_{\mathrm{parallel}}=\frac{Z_0S_n}{(2R+Z_0)^2}\begin{bmatrix}1&1\\1&1\end{bmatrix}.\tag{14}$$

For thermal noise from the 75 Ω resistor:

$$\mathbf C_{\mathrm{parallel}}=0.375k_BT\begin{bmatrix}1&1\\1&1\end{bmatrix}.\tag{15}$$

The positive off-diagonal entries occur because both ports see the same common
node voltage.

## 4. Superposition and the source column

An ideal internal voltage source makes the two-port affine:

$$\mathbf b=\mathbf S\mathbf a+\mathbf d.\tag{16}$$

Use the standard hand calculation:

```text
To find S: short the internal source, excite one external port, and terminate
the other port in Z0. Repeat with the opposite port.

To find d: short the external sources, leave the internal source active, and
calculate the outgoing waves caused by that source.
```

For a random resistor source, the same source-to-wave column is called `c`
instead of `d`:

```text
d = deterministic internal-source contribution
c = random internal-source contribution
```

The source is still one physical `n`; the two entries of `c` are its effects
at the two ports. nP's `R.js` stores the resulting covariance directly rather
than generating individual random values of `n`.
