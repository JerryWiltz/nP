<!-- Modified: 2026-10-19 -->
# Introduction

## What is nP?

nP is a JavaScript library for constructing, analyzing, and visualizing RF and microwave circuits in the browser. Its central object is an **n-port**: a component or connected network represented by frequency-dependent S-parameters. The same n-port can be measured, connected to other n-ports, and used as a building block in a larger circuit.

## What can you build?

You can combine resistors, capacitors, inductors, ideal connections, transmission lines, microstrip models, amplifiers, and other components. nP can report S-parameters, noise, and intermodulation results, and it can propagate digital or analog waveforms through a circuit. Charts, tables, and Smith charts display the results.

## How nP works

The common RF analysis path is:

1. Choose the analysis frequencies.
2. Create n-port components.
3. Connect them with `nP.nodal()` or `nP.cascade()`.
4. Select results with `.out(...)`.
5. Display the output with a chart or table.

Components capture their frequency settings when they are created, so components in one network need matching frequency rows.

## Two starting paths

For an **RF frequency sweep**, set `nP.global.fList` before creating components. Then connect the components and inspect results such as `s11dB` or `s21dB`.

For a **signal through a circuit**, create a transmitter with `nP.mod()` first. It establishes the signal's frequency grid. Create the components afterward, attach the signal to the connected circuit, and recover it with `nP.demod()`. `nP.PN()` can supply a clocked bit sequence, and `nP.bitErrorRate()` compares transmitted and recovered bits over repeated receptions.

## A small example

This series resistor and inductor form a two-port circuit. Its output table has a frequency column followed by the selected S-parameters.

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

## Where to go next

- Follow the [Tutorial](./tutorial.md) for an RF circuit and a digital signal path.
- Browse [RF Constructors](./rf-constructors.md) to choose components.
- Browse the [API topics](./global-settings.md), starting with global settings and the nPort object.
- Study [Circuit examples](./circuit-examples.md) for dividers, filters, and attenuators.
