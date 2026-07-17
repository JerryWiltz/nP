<!-- Modified: 2026-07-15 -->
# Nodal Analysis

`nP.nodal()` combines arbitrary one-port and multiport S-parameter objects into a new n-port. It is the general composition tool for circuit topologies that are not a simple two-port cascade.

The implementation is in `src/np-nport/src/combining/nodal.js` and depends on complex matrix inversion from `src/np-math/src/matrix.js`.

## Calling form

Each argument is an array containing an n-port followed by one connection label per port. The final argument begins with `'out'` and lists the connection labels that become the public ports of the result.

```js
var result = nP.nodal(
    [component1, nodeForPort1, nodeForPort2],
    [component2, nodeForPort1, nodeForPort2, nodeForPort3],
    ['out', outputNode1, outputNode2]
);
```

The number of labels after a component must equal that component's number of ports. The order of those labels is the component's public port order.

Connection labels are identifiers, not electrical voltages. Equal labels tell the algorithm which wave ports are directly connected. Labels may be any integers used consistently; their numeric magnitude and ordering have no electrical meaning.

## Pairwise connection rule

The current connection matrix represents pairwise port connections. In a well-formed call, each connection label appears exactly twice across the component and `'out'` entries.

- An internal connection appears on two component ports.
- An external connection appears once on a component port and once in the final `'out'` array.

To join three or more branches, use an explicit `nP.Tee()`, `nP.Tee4()`, `nP.Tee5()`, or a physical junction model. Do not place the same connection label on three arbitrary component ports.

```js
var Tee = nP.Tee();

var divider = nP.nodal(
    [Tee, 1, 2, 3],
    [branch1, 2, 4],
    [branch2, 3, 5],
    ['out', 1, 4, 5]
);
```

The current implementation does not issue a clear validation error for every malformed label pattern. Callers and future validation work must preserve this pairwise invariant.

## Wave interpretation

Each physical component provides an S matrix relating incident waves `a` to outgoing waves `b`:

```text
b = S a
```

A direct connection exchanges outgoing and incident waves between the two connected ports. The implementation represents all of those pairings in a connection matrix. It then inserts the negative component S matrices into the combined system, inverts that system for each frequency, and extracts the block associated with the requested output ports.

The important implementation consequence is that arbitrary component types can participate as long as they obey the common n-port row shape. A previously combined n-port can therefore be reused as a component in a larger `nP.nodal()` call.

## What the implementation builds

For one frequency, the algorithm proceeds as follows:

1. Count every component port plus every requested output port. This becomes the square matrix dimension.
2. Expand the component port lists and output list into a flat table of wave-port positions and connection labels.
3. Build a connection matrix with a complex `1 + j0` at the paired position for each label.
4. Place each component's negative S matrix into its diagonal block. The final `'out'` block has no component S matrix.
5. Invert the complete complex matrix.
6. Copy the bottom-right block corresponding to the `'out'` entries into the result S matrix.
7. Repeat for every frequency row.

Component blocks appear in the same order as the arguments. Within each block, S entries are copied in row-major order from the component's `.spars` row.

## Frequency and reference assumptions

`nodal()` uses the first component for:

- The frequency list stored in the output.
- The number of frequency iterations.
- The `.global` reference attached to the result.

All participating components are therefore expected to have aligned frequency rows and the same reference impedance. The routine indexes every component by the same frequency-row number and does not interpolate or renormalize.

Construct all components after setting one shared `nP.global` configuration.

## External ports

The order of labels in the final `'out'` argument defines the public port order of the returned n-port:

```js
['out', inputNode, highPassOutputNode, lowPassOutputNode]
```

produces a three-port whose public ports 1, 2, and 3 correspond to those labels in that order. Changing only the order of the output labels changes the interpretation and row-major placement of the resulting S-parameters.

## Series and shunt examples

A two-port component used directly in series needs no Tee:

```js
var series = nP.nodal(
    [component, 1, 2],
    ['out', 1, 2]
);
```

A shunt branch uses a Tee and normally terminates through `nP.Short()`:

```js
var Tee = nP.Tee();
var Short = nP.Short();

var shunt = nP.nodal(
    [Tee, 3, 1, 2],
    [component, 3, 0],
    [Short, 0],
    ['out', 1, 2]
);
```

For `nP.Tee()`, public port 1 is the common or shunt branch. Put that branch first in the Tee's connection list.

## Reuse and hierarchy

Nodal composition is intentionally hierarchical:

```js
var highPass = nP.nodal(/* components */, ['out', 1, 2]);
var lowPass = nP.nodal(/* components */, ['out', 1, 2]);

var diplexer = nP.nodal(
    [nP.Tee(), 1, 2, 3],
    [highPass, 2, 4],
    [lowPass, 3, 5],
    ['out', 1, 4, 5]
);
```

This keeps complicated circuits readable and lets each subnetwork be tested independently.

## Numerical and diagnostic cautions

- Matrix size equals the total number of component ports plus output ports; inversion cost grows rapidly with circuit size.
- Singular or nearly singular connection systems are not currently reported with a specialized error.
- Ideal junctions use very small numerical offsets in their S entries to avoid exact singular behavior in some combinations.
- Reusing one n-port object is safe when its S rows and global settings are appropriate for every occurrence.
- A finite answer should still be checked for reciprocity, symmetry, expected match, transmission, isolation, and passivity.

## Verification checklist

For changes to `nodal()` or a component intended for nodal use, verify:

1. A direct two-port wrapper agrees with the original component.
2. A known series chain agrees with `nP.cascade()` where both methods apply.
3. Reordering `'out'` ports reorders the S matrix as expected.
4. A Tee divider has the expected split, match, and isolation behavior for its model.
5. A combined n-port can be reused in a larger nodal network.
6. Inputs remain unchanged after the calculation.
7. Results remain finite across the intended frequency range.
