<!-- Modified: 2026-10-15 -->
# Understanding the Interconnection Matrix

This note explains the matrix called `Gamma` in the direct
multiport method used by `nP.nodal()`.

For the public connection rules, implementation sequence, and examples, see [Nodal Analysis](nodalAnalysis.md). This note focuses on the six-position matrix and the wave equations it represents.

## The two relationships

Every component is described by an S-matrix:

```text
b = S a + c
```

where `a` is the vector of waves incident on component ports, `b` is the
vector of waves leaving them, and `c` contains independent generator or noise
waves.

The circuit wiring is described separately by the interconnection matrix:

```text
b = Gamma a
```

For a direct connection, a wave leaving one port becomes the incident wave at
the port on the other side. Thus a `1` in row `i`, column `j` means:

```text
b[i] = a[j]
```

The entries of `Gamma` describe topology only; they do not describe a
resistor, capacitor, transmission line, or any other component.

## A six-by-six two-port example

Consider two two-port components connected in series. The first component is
`A`, the second is `B`, and the two exposed ends are the external ports:

```text
A port 1  <-->  external port 1
A port 2  <-->  B port 1
B port 2  <-->  external port 2
```

There are six wave-variable positions: two ports for `A`, two ports for `B`,
and two external bookkeeping/generator positions. The nP call is equivalent
to:

```js
nP.nodal(
    [A, 1, 2],
    [B, 2, 3],
    ['out', 1, 3]
);
```

The vectors are ordered as:

```text
[b1, b2, b3, b4, b5, b6] = Gamma [a1, a2, a3, a4, a5, a6]
```

and the connection matrix is

```text
Gamma = [ 0  0  0  0  1  0 ]
        [ 0  0  1  0  0  0 ]
        [ 0  1  0  0  0  0 ]
        [ 0  0  0  0  0  1 ]
        [ 1  0  0  0  0  0 ]
        [ 0  0  0  1  0  0 ]
```

Consequently,

```text
b1 = a5       b2 = a3       b3 = a2
b4 = a6       b5 = a1       b6 = a4
```

Rows 1–4 connect waves into components `A` and `B`. Rows 5–6 represent the
external generator positions; through `Gamma`, their waves are connected to
the physical external ports.

## Combining wiring and component behavior

The component S-matrix occupies the component block of a larger global matrix:

```text
S_global = [ SA11 SA12   0    0    0  0 ]
           [ SA21 SA22   0    0    0  0 ]
           [  0    0   SB11 SB12   0  0 ]
           [  0    0   SB21 SB22   0  0 ]
           [  0    0    0    0    0  0 ]
           [  0    0    0    0    0  0 ]
```

The lower-right zero block is intentional. The external bookkeeping positions
are not components, so they do not have their own S-parameters. They inject
the independent excitations `c1` and `c2`:

```text
b5 = c1
b6 = c2
```

The zero block is not later replaced by the answer. The answer emerges after
the complete coupled system is solved. For this example, the interconnection
equations also give:

```text
a1 = b5 = c1       a4 = b6 = c2
a2 = b3            a3 = b2
a5 = b1            a6 = b4
```

Thus `c1` and `c2` are the two imposed external excitations, while `a5` and
`a6` are the resulting external response waves. The final two-port relation
is:

```text
[a5]   [S11 S12] [c1]
[a6] = [S21 S22] [c2]
```

Substituting the two equations gives

```text
(Gamma - S_global) a = c
```

so the incoming waves are found by solving

```text
a = inverse(Gamma - S_global) c
```

The outgoing waves follow from either

```text
b = Gamma a
```

or

```text
b = S_global a + c
```

To obtain a two-port S-matrix, use one external excitation at a time. With
the first source set to one and the second to zero, the two external outputs
are `S11` and `S21`. With the second source set to one, they are `S12` and
`S22`.

In matrix terms, the inverse of `Gamma - S_global` contains transfer
relationships between every excitation and every wave variable. The lower-
right 2×2 block selected by `nodal()` is the transfer from `[c1, c2]` to
`[a5, a6]`; that solved transfer block is the combined S-matrix.

## How `nP.nodal()` builds `Gamma`

`nodal()` flattens component and external ports in call order, then uses each matched pair of connection labels to place two reciprocal `1` entries in `Gamma`. The label values are identifiers, not node voltages. The six-position example above shows the resulting entries explicitly. The [nodal guide](nodalAnalysis.md#what-the-implementation-builds) gives the complete assembly and inversion sequence; its [pairwise connection rule](nodalAnalysis.md#pairwise-connection-rule) explains why a three-way junction needs an explicit Tee or other junction component.

## Why this is useful for noise

Noise does not require a new topology matrix. A component noise wave is an
additional source in the same equation:

```text
b = S a + c_signal + c_noise
```

The same solution operator `inverse(Gamma - S)` transfers each component noise
source to the external ports. The output noise covariance is formed by
combining those transferred source covariances. Thus `Gamma` remains a pure
wiring description while the component S-matrices and noise covariances carry
the device physics.

## Main idea

`Gamma` answers one question: **where does each outgoing wave go?**

The component S-matrices answer a different question: **what outgoing waves
does each component produce for its incident waves?**

`nP.nodal()` solves both questions simultaneously by combining the wiring map
and the component equations into one complex linear system.
