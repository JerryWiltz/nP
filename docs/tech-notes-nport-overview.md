<!-- Modified: 2026-10-21 -->
# nPort overview

An **n-port** describes a circuit by what happens at its external ports. The circuit inside may be a single inductor, a filter, or an assembled RF system. If two circuits produce the same outgoing waves for the same incoming waves at every port, their external S-parameter descriptions are the same at that frequency. This lets us treat a completed circuit as one building block in a larger design.

The preceding note, [S-parameters for the novice](./tech-notes-s-parameters-for-the-novice.md), derives the four S-parameters of one two-port inductor. Here we extend that idea to any number of ports and show how nP stores and connects the resulting models.

## From a two-port to an n-port

At one frequency, an n-port has one incoming wave and one outgoing wave at each port. Collect them into vectors. The S-parameter matrix relates the outgoing waves to the incoming waves:

$$
\mathbf b = \mathbf S\mathbf a
$$

The matrix has $n$ rows and $n$ columns. Its entry $S_{ij}$ describes the outgoing wave at port $i$ due to an incoming wave at port $j$, with all other ports terminated in their reference impedances. The **first** index is the output port; the **second** is the input port. For a three-port, $S_{31}$ means transmission from port 1 to port 3. Each entry is complex because phase matters as well as magnitude.

An S-parameter matrix describes the network at **one frequency** and for a stated reference impedance. A frequency sweep produces a matrix at every frequency. It does not directly describe the voltage at every point inside the circuit or a time-domain waveform.

## How nP stores the model

In nP, a constructor such as `nP.L()`, `nP.R()`, or `nP.Tee()` returns an `nPort` object. The main data is its `.spars` array. Each row starts with frequency in hertz and then holds the complex S-parameter entries in matrix row order:

```text
two-port row:   [frequency, s11, s12, s21, s22]
three-port row: [frequency, s11, s12, s13, s21, s22, s23, s31, s32, s33]
```

For an $n$-port, each row has $1+n^2$ values. In an ordinary frequency analysis, the 5 nH inductor from the previous note has one two-port row when `nP.global.fList` contains only `2e9`, and one row per frequency when it contains a sweep. Its S-parameters are `nP.complex()` objects, so `.spars` retains their real and imaginary parts.

The nPort also saves the analysis settings in `.global` when it is constructed. Those settings include the selected frequency list and reference impedance. Changing `nP.global.fList` later does **not** recalculate an existing nPort; construct it again to analyze new frequencies. An nPort can also carry noise covariance in `.noise` and an attached signal in `.signal` when applicable.

## Components and circuits use the same object

First choose the analysis frequencies, then build the components. nP combines their S-parameter models at corresponding frequencies and returns another nPort:

| Operation | Connection |
| --- | --- |
| `first.cas(second)` | Cascades exactly two two-port nPorts. |
| `nP.cascade(first, second, ...)` | Cascades a chain of two-port nPorts. |
| `nP.nodal(...connections)` | Wires ports into a circuit with chosen external ports; supports multiport results. |

The input nPorts must have **matching frequency rows in the same order**. The combined object's external ports are the only ports visible to its next user; any connections between its components are internal. Its S-parameters account for the interaction between those components, including reflections at internal connections.

Here is a complete two-port workflow with a series inductor followed by a series resistor:

```js
var g = nP.global;
g.Ro = 50;
g.twoTone = undefined;
g.fList = [1e9, 2e9];

var l1 = nP.L(5e-9);
var r1 = nP.R(25);
var circuit = nP.cascade(l1, r1);

var response = circuit.out('s11dB', 's21dB');
nP.lineTable({inputTable: [response]});
```

`l1`, `r1`, and `circuit` are all nPorts. The circuit has two S-parameter rows, one for each frequency. `.out(...)` converts the selected complex values into a numeric table headed by `Freq`, which `nP.lineTable()` can display. The `s21dB` column is $20\log_{10}|S_{21}|$ for transmission from port 1 to port 2 with the other port matched to the reference impedance.

For port wiring and multiport examples, see [Connecting nPorts](./connecting-nports.md). For `.spars`, `.global`, `.noise`, `.signal`, and output selectors in detail, see the [nPort object guide](./nport-object.md).
