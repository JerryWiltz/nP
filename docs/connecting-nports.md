<!-- Modified: 2026-10-22 -->
# Connecting nPorts

Constructors such as `nP.R()`, `nP.L()`, and `nP.Tee()` return [nPort objects](./nport-object.md). Connect those objects to make a larger circuit, then call `.out()` on the result. Set the [analysis frequencies](./global-settings.md#frequency-list) before creating the components.

## Choose a connection method

| Method | Use it for |
| --- | --- |
| `nP.nodal(...connections)` | Circuit wiring, shunt branches, junctions, and multiport networks. |
| `nP.cascade(first, second, ...)` | A chain of two-port stages in signal-flow order. |
| `first.cas(second)` | Cascading exactly two two-port nPorts; returns a new nPort and can be chained. |

Each method returns an nPort with the combined S-parameters. The result also carries the combined noise and any compatible attached signal or known intermodulation sources. See [Noise](./noise.md) and [Intermodulation](./intermodulation.md) for those measurements.

## Wire components with `nodal()`

Give each component one connection label for **each of its ports**, in that component's port order. The final `['out', ...]` entry lists the labels to expose as ports on the resulting circuit.

```js
nP.global.fList = nP.global.fGen(100e6, 2e9, 51);

var r1 = nP.R(25);
var l1 = nP.L(2e-9);

var circuit = nP.nodal(
    [r1, 1, 2],
    [l1, 2, 3],
    ['out', 1, 3]
);

var response = circuit.out('s11dB', 's21dB');
nP.lineChart({inputTable: [response], title: 'Series R-L response'});
```

Here, label `2` joins port 2 of `r1` to port 1 of `l1`. Labels `1` and `3` become the circuit's external ports 1 and 2. The labels are identifiers, not voltages; their numeric size has no electrical meaning.

**Use each label exactly twice** across the component entries and the `out` entry. An internal label joins two component ports. An external label joins one component port to one `out` port. To join three or more branches, add an explicit junction such as `nP.Tee()` rather than putting the same label on three component ports.

## Add a shunt branch

`nP.Tee()` is an ideal three-port junction. Its port 1 is the common or shunt branch; put that label first in the Tee entry. A shunt component normally leads to `nP.Short()`.

```js
nP.global.fList = nP.global.fGen(100e6, 2e9, 51);

var tee = nP.Tee();
var short = nP.Short();
var r1 = nP.R(25);
var c1 = nP.C(3.17e-12);

var lowPass = nP.nodal(
    [r1, 1, 2],
    [tee, 4, 2, 3],
    [c1, 4, 5],
    [short, 5],
    ['out', 1, 3]
);

var response = lowPass.out('s11dB', 's21dB');
nP.lineChart({inputTable: [response], title: 'RC low-pass'});
```

The Tee's port 1 connects to `c1` at label `4`. The capacitor's other port connects to the short at label `5`. Labels `1` and `3` are the external input and output.

## Set the resulting port order

The order of labels after `'out'` becomes the port order of the returned nPort. For example:

```js
nP.global.fList = nP.global.fGen(1e9, 3e9, 21);

var tee = nP.Tee();
var branch1 = nP.Tlin(50, 0.0254);
var branch2 = nP.Tlin(50, 0.0254);

var divider = nP.nodal(
    [tee, 1, 2, 3],
    [branch1, 2, 4],
    [branch2, 3, 5],
    ['out', 1, 4, 5]
);
```

The result is a three-port: label `1` is port 1, label `4` is port 2, and label `5` is port 3. `divider.out('s21dB', 's31dB')` reports transmission from input port 1 to each output branch. For coupled lines such as `Tclin()` and `mclin()`, supply connection labels in their published port order: 1 at upper left, then 2, 3, and 4 clockwise.

## Cascade two-port stages

`nP.cascade()` connects two-port nPorts from left to right. The output of one stage feeds the input of the next.

```js
nP.global.fList = nP.global.fGen(1e9, 5e9, 21);

var line1 = nP.Tlin(50, 0.0127);
var line2 = nP.Tlin(60, 0.0254);

var chain = nP.cascade(line1, line2);
var response = chain.out('s11dB', 's21dB');
```

For two stages, `line1.cas(line2)` produces the same connection. `cas()` returns a new nPort, so `line1.cas(line2).cas(line3)` is also possible. Use `nodal()` when the circuit has a shunt branch or more than two external ports.

## Reuse a completed circuit

A network returned by `nodal()` or `cascade()` is itself an nPort. You can connect it as a building block in another network. Give it one label per exposed port, in the order chosen by its original `out` entry.

```js
nP.global.fList = nP.global.fGen(100e6, 2e9, 51);

var r1 = nP.R(25);
var l1 = nP.L(2e-9);
var stage = nP.nodal(
    [r1, 1, 2],
    [l1, 2, 3],
    ['out', 1, 3]
);

var attenuator = nP.Attn(3);
var complete = nP.cascade(stage, attenuator);
```

## Keep analysis settings aligned

Components in the same connection must have the **same frequency rows in the same order**. `nodal()` and `cascade()` reject mismatched rows; they do not interpolate. Build connected components with matching `fList` values and the same reference impedance `Ro`. Set two-tone analysis before constructing all stages if the network needs intermodulation products.

For a sampled digital source or `VNA-time`, select a valid `nP.global.tList` before `nP.mod()`; sampled modes need one time per generated waveform sample. The analog modes also currently require a valid time list, although they construct sparse tone frequencies. `VNA-frequency` uses `fList` and requires no `tList`. Create the source before its frequency-dependent components, then attach `{signal: tx}` as the final argument to `nodal()` or `cascade()`. The [Tutorial](./tutorial.md#send-a-digital-signal-through-a-circuit) shows the sampled-signal sequence.
