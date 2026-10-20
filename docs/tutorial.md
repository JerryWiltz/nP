<!-- Modified: 2026-10-19 -->
# Tutorial

These examples assume that the `nP` browser bundle has been loaded or the package has been imported as `nP`. The [Introduction](./introduction.md) explains the two analysis paths.

## Sweep an RF circuit

Set the frequencies before constructing the components. Connect a resistor and inductor in series, then request the input reflection and forward transmission in dB.

```js
nP.global.fList = nP.global.fGen(0.1e9, 6e9, 101);

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

`response` is a table whose first row names the columns. You can also pass it to `nP.lineTable()`.

## Send a digital signal through a circuit

Create a separate analysis context, then call `mod()` before constructing the attenuator. `mod()` fills the selected context's frequency list with the signal's FFT frequencies. The `{signal: tx}` argument attaches that signal to the connected n-port.

```js
var context = nP.global();
context.fList = [];

var tx = nP.mod({mode: 'ASCII', message: 'hello'});
var attenuator = nP.Attn(3);
var chain = nP.cascade(attenuator, {signal: tx});
var rx = nP.demod(chain, {noise: false});

nP.log(rx.out('ASCII text'));
nP.lineChart({inputTable: rx.out('waveform'), title: 'Received waveform'});
```

The clean reception above makes the signal path easy to inspect. By default, `demod()` includes a new random thermal-noise waveform on each call. For a repeated bit-error measurement, use `nP.bitErrorRate(tx, chain, {receptions: 100})`.

## Continue exploring

- [RF Constructors](./rf-constructors.md) introduces the component families.
- [Noise](./noise.md) covers noise figure and output noise density.
- [Intermodulation](./intermodulation.md) covers two-tone products and intercepts.
- [Circuit examples](./circuit-examples.md) shows larger RF networks.
- The [API topics](./global-settings.md) describe the current functions and their defaults.
