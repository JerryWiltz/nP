<!-- Modified: 2026-09-25 -->
# Gupta matrices and intermodulation analysis

This note accompanies `dev/intermodAnalysis.html`. It describes three levels
of analysis for the six-variable resistor-amplifier network:

```text
1. Gupta's linear matrix solution
2. the one-pass weakly nonlinear example in the HTML page
3. a full Newton harmonic-balance solver
```

The first two levels are implemented as development examples. The Newton
solver is the design theory for a future nonlinear extension.

## Gupta's equations 11.9–11.17: the connection-scattering method

Gupta begins with a network of multiport components and independent
generators. For component \(i\), with incoming-wave column \(\mathbf a_i\)
and outgoing-wave column \(\mathbf b_i\), his component relation is

$$
\mathbf b_i = \mathbf S_i\mathbf a_i. \tag{11.9}
$$

An independent generator is represented by

$$
\mathbf b_g = \mathbf S_g\mathbf a_g + \mathbf c_g. \tag{11.10}
$$

where \(\mathbf c_g\) is the wave impressed by that generator. For an isolated
or matched generator, Gupta notes that \(\mathbf S_g=\mathbf 0\).

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

The zero entries are null submatrices. Equation (11.11) describes the
individual components, but does not yet enforce their interconnections.

For two equally normalized ports \(j\) and \(k\), the outgoing wave at one
port is the incoming wave at the other:

$$
a_j=b_k,\qquad a_k=b_j,
$$

or

$$
\begin{bmatrix}a_j\\a_k\end{bmatrix}
=\begin{bmatrix}0&1\\1&0\end{bmatrix}
\begin{bmatrix}b_j\\b_k\end{bmatrix}. \tag{11.13}
$$

For unequal normalizations, the entries of this two-port connection matrix
are obtained from the inverse S-matrix of the junction. Writing all connection
relations together gives Gupta's connection matrix

$$
\mathbf b=\boldsymbol\Gamma\mathbf a. \tag{11.14}
$$

Each row of \(\boldsymbol\Gamma\) contains zeros except for the entry that
identifies the port to which that row's port is connected. With equal reference
impedances, those connection entries are \(1\).

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

Here \(\mathbf c\) is the column of impressed waves, and Gupta calls
\(\mathbf W\) the **connection scattering matrix**. Its diagonal entries are
the negative component reflection coefficients, its same-component off-diagonal
entries are negative component transmission coefficients, and its connection
entries come from \(\boldsymbol\Gamma\).

The complete sequence is therefore

$$
\mathbf b=\mathbf S\mathbf a+\mathbf c,qquad
\mathbf b=\boldsymbol\Gamma\mathbf a,qquad
\mathbf W=\boldsymbol\Gamma-\mathbf S,qquad
\mathbf a=\mathbf W^{-1}\mathbf c.
$$

After solving for \(\mathbf a\), Gupta obtains the outgoing waves from
\(\mathbf b=\boldsymbol\Gamma\mathbf a\). Solving
\(\mathbf W\mathbf a_j=\mathbf e_j\) gives column \(j\) of
\(\mathbf W^{-1}\); this is inversion by its defining column equations.

## Gupta's multiport connection equations 11.18–11.23

For the network without independent generators, Gupta writes

$$
\mathbf b=\mathbf S\mathbf a. \tag{11.18}
$$

He reorders the variables into (p) external ports and (c) internally
connected ports:

$$
\begin{bmatrix}\mathbf b_p\\\mathbf b_c\end{bmatrix}
=
\begin{bmatrix}
\mathbf S_{pp}&\mathbf S_{pc}\\
\mathbf S_{cp}&\mathbf S_{cc}
\end{bmatrix}
\begin{bmatrix}\mathbf a_p\\\mathbf a_c\end{bmatrix}. \tag{11.19}
$$

The internal connection constraint is

$$
\mathbf b_c=\boldsymbol\Gamma\mathbf a_c. \tag{11.20}
$$

Therefore

$$
\mathbf a_c=(\boldsymbol\Gamma-\mathbf S_{cc})^{-1}
\mathbf S_{cp}\mathbf a_p. \tag{11.21}
$$

Substitution into the external relation gives

$$
\mathbf b_p=\left[\mathbf S_{pp}+
\mathbf S_{pc}(\boldsymbol\Gamma-\mathbf S_{cc})^{-1}
\mathbf S_{cp}\right]\mathbf a_p. \tag{11.22}
$$

Thus the external network S-matrix is

$$
\mathbf S_p=\mathbf S_{pp}+
\mathbf S_{pc}(\boldsymbol\Gamma-\mathbf S_{cc})^{-1}\mathbf S_{cp}. \tag{11.23}
$$

The six-variable nP page uses Gupta's first method because it retains the
generator positions in the complete \(\mathbf a\), \(\mathbf b\), and \(\mathbf c\)
columns.

## Gupta's eight-variable example: equations 11.28–11.31

Gupta's page-347 example has component (A) (two ports), component (B)
(three ports), component (C) (one port), and two matched one-port external
generators. The generators are

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

Subtracting the component matrix in (11.29) from the connection matrix in
(11.30), and using (11.17), gives Gupta's equation (11.31):

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

The right-hand column is \([0,0,0,0,0,0,c_1,c_2]^T\). Thus
\(c_1=1, c_2=0\) means \(\mathbf c=\mathbf e_7\), so \(\mathbf a\) is the
seventh column of \(\mathbf W^{-1}\). Gupta then uses (11.30) and (11.31) to
obtain \(\mathbf b\). For that excitation he identifies the external-port
values as

$$
S_{11}=b_1,\qquad S_{21}=b_4.
$$

The (c_1) in this eight-variable example is source position 7; it is not
the first entry of the source column.

## The six-variable page used by nP

The HTML example has a different ordering:

$$
\begin{array}{c|l}
\text{index}&\text{component port or bookkeeping position}\\\hline
1&\text{resistor port 1}\\
2&\text{resistor port 2}\\
3&\text{amplifier port 1}\\
4&\text{amplifier port 2}\\
5&\text{external source position}\\
6&\text{external load position}
\end{array}
$$

Its connection equations are

$$
\begin{aligned}
a_1&=b_5,&a_2&=b_3,&a_3&=b_2,\\
a_4&=b_6,&a_5&=b_1,&a_6&=b_4.
\end{aligned}
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
\end{bmatrix}.
$$

For the forward test, this six-variable page uses \(\mathbf c=\mathbf e_5\),
not \(\mathbf e_7\):

$$
\mathbf W=\boldsymbol\Gamma-\mathbf S,qquad
\mathbf a=\mathbf W^{-1}\mathbf e_5,qquad
\mathbf b=\boldsymbol\Gamma\mathbf a,qquad
S_{11}=b_1,\quad S_{21}=b_4.
$$

The \(\mathbf b\) vector is the same outgoing-wave vector in both relations.
Equation (11.29) supplies the component relation; equation (11.30) supplies
the connection relation; equation (11.31) solves for \(\mathbf a\), after which
(11.30) supplies \(\mathbf b\).

## 5. Reusing the inverse

For a frequency-independent demonstration:

```text
W^-1 is calculated once
T = Gamma*W^-1 is calculated once
```

That inverse can be reused for every right-hand side:

```text
linear signal:       a = W^-1*cₛᵢgₙₐₗ
noise source:        a = W^-1*cₙₒᵢₛₑ
nonlinear source:    a = W^-1*(cₑₓₜₑᵣₙₐₗ + cₙₗ)
```

For a physical frequency-dependent network, calculate one inverse per
retained frequency:

```text
W(f₁)⁻¹
W(f₂)⁻¹
W(f₁+f₂)⁻¹
W(f₂−f₁)⁻¹
```

Each frequency-specific inverse can then be reused during fixed-point
nonlinear iterations because only the right-hand side changes.

## 6. The weakly nonlinear amplifier

The development page models the amplifier's forward output wave as:

```text
b₄ = 10*xAmp + 0.001*xAmp^2
```

In this six-variable topology:

```text
xAmp = a₃ = b₂
```

If a stage-local derivation calls the amplifier input `b₁`, then that stage
variable is the page's `xAmp`; it is not the network's external `b₁`.

Keep the linear term `ts21 = 10` in `S`. Represent the quadratic correction as
an equivalent impressed source at the amplifier output position:

```text
cNL,4 = alpha₂*xAmp^2
alpha₂ = 0.001
```

The nonlinear component equation is then represented by:

```text
b = S*a + cₑₓₜₑᵣₙₐₗ + cNL(a)
```

This is the key connection to Gupta's equations: the linear matrix remains
`W = Gamma - S`, while the nonlinear device contributes a source column that
depends on the current wave solution.

## 7. The middle-ground HTML calculation

`intermodAnalysis.html` is a weakly nonlinear, second-order calculation. It
is between a purely linear S-parameter solve and a full harmonic-balance
solver.

It applies two equal input tones at:

```text
f1 = 1.000 GHz
f2 = 1.001 GHz
```

First solve the linear Gupta system at each fundamental:

```text
a(f1) = W^-1*c(f1)
a(f2) = W^-1*c(f2)
```

Read the amplifier input waves:

```text
x1 = a₃(f1)
x2 = a₃(f2)
```

The quadratic term produces second-order sum and difference products. For
equal real phasor amplitudes, the ordered products give:

```text
cNL,4(f1+f2) = 2*alpha₂*x1*x2
cNL,4(f2-f1) = 2*alpha₂*x1*x2
```

The page then solves the linear Gupta system once for each generated source:

```text
a(f1+f2) = W^-1*cNL(f1+f2)
a(f2-f1) = W^-1*cNL(f2-f1)
```

and reads the generated output at `b₄`:

```text
IM2_sum  = b₄(f1+f2)
IM2_diff = b₄(f2-f1)
```

This page is not iterative. It calculates the fundamental waves once,
creates the quadratic products once, and propagates those products once. It
is a useful first-order perturbation or Volterra-style demonstration.

The quadratic model produces IM2 products. A third-order term is needed for
the usual two-tone IM3 products:

```text
b₄ = ... + alpha₃*xAmp^3

IM3 frequencies:
    2*f1 - f2
    2*f2 - f1
```

## 8. Full harmonic balance

A full harmonic-balance analysis retains a frequency set containing every
fundamental, harmonic, and intermodulation frequency of interest. Let the set
be:

```text
K = { f1, f2, f1+f2, f2-f1, 2*f1-f2, 2*f2-f1, ... }
```

There is a six-entry wave column for every retained frequency:

```text
a(fk) = [ a₁(fk) ]
        [ a₂(fk) ]
        [    ...  ]
        [ a₆(fk) ]
```

Stacking them produces one large unknown vector:

```text
A = [ a(f1) ]
    [ a(f2) ]
    [   ...  ]
```

The linear Gupta part is block diagonal:

```text
Wtotal = blockdiag(W(f1), W(f2), ...)
```

If the network is linear, each frequency is independent. The nonlinear
amplifier couples the frequencies through products of its input waves.

For a memoryless polynomial model:

```text
cNL,4(t) = alpha₂*xAmp(t)^2 + alpha₃*xAmp(t)^3 + ...
```

Transforming that nonlinear source to the retained frequencies gives:

```text
cNL(fk) = nonlinear Fourier coefficient at fk
```

The complete harmonic-balance residual is:

```text
R(A) = Wtotal*A - Cexternal - CNL(A)
```

The solution satisfies:

```text
R(A) = 0
```

Unlike the middle-ground example, `CNL(A)` is recalculated from the current
wave estimate at every iteration. Products generated at one frequency can
mix with products at another frequency and feed back into the fundamentals.

## 9. Newton harmonic-balance iteration

Start with an initial estimate, usually the linear solution:

```text
A0 = Wtotal^-1*Cexternal
```

At iteration `m`:

```text
1. calculate the nonlinear source CNL(Am)
2. calculate the residual R(Am)
3. calculate the Jacobian J(Am) = dR/dA
4. solve J(Am)*DeltaA = -R(Am)
5. update Am+1 = Am + DeltaA
6. test convergence
```

The Jacobian is:

```text
J(A) = Wtotal - dCNL(A)/dA
```

For a scalar quadratic relation:

```text
cNL = alpha₂*x^2
dcNL/dx = 2*alpha₂*x
```

For a cubic relation:

```text
cNL = alpha₃*x^3
dcNL/dx = 3*alpha₃*x^2
```

In a multiport, multitone problem, the Jacobian is a block matrix. Its
off-diagonal blocks are the frequency couplings caused by the nonlinear
terms. The linear `W(fk)` blocks remain on the diagonal, while the nonlinear
derivatives connect different frequencies.

A practical convergence test is:

```text
max_k |DeltaA[k]| < absolute_tolerance
and
max_k |DeltaA[k]| / max(1, |A[k]|) < relative_tolerance
```

The solver should also stop after a maximum iteration count and report a
non-convergence error rather than returning an unverified spectrum. Damping
the update,

```text
A_next = A + lambda*DeltaA,    0 < lambda <= 1
```

can improve convergence for stronger nonlinearities.

## 10. What the solver reports

After convergence, read the external output wave at every retained frequency:

```text
b(fk) = Gamma(fk)*a(fk)
```

For the six-variable circuit, the output of interest is `b₄`:

```text
fundamental output: b₄(f1), b₄(f2)
IM2 output:         b₄(f1+f2), b₄(f2-f1)
IM3 output:         b₄(2*f1-f2), b₄(2*f2-f1)
```

Convert the magnitudes to power using the wave normalization, then compare
the fundamental and distortion powers. IP2 and IP3 are obtained by the usual
extrapolation of the fundamental and distortion slopes, or by solving for
their intersection.

The linear Gupta inverse does not create nonlinear products. It supplies the
network transfer for products created by the active-device model. A complete
Newton harmonic-balance implementation therefore needs both:

```text
Gupta W/Gamma/S matrices for the linear network
nonlinear device equations and their derivatives
```
