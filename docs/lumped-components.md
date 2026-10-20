<!-- Modified: 2026-10-19 -->
# Lumped components

Lumped resistors, inductors, capacitors, and transformers are n-port building blocks. Set `nP.global.fList` first, then construct and connect the parts. The values below use ohms, henries, and farads.

## Series R, L, and C

`R()`, `L()`, and `C()` are series two-ports. Each call has a usable default, so you can inspect a response before choosing a value.

```js
var r1 = nP.R();        // 75 Ω
var r2 = nP.R(430);     // 430 Ω

var l1 = nP.L();        // 5 nH
var l2 = nP.L(12e-9);   // 12 nH

var c1 = nP.C();        // 1 pF
var c2 = nP.C(2.2e-12); // 2.2 pF
```

`R()` uses the selected circuit temperature for thermal noise. `nP.R(430, 290)` sets a 430 Ω resistor at 290 K. Ideal `L()` and `C()` use frequency-dependent reactance without conductor or dielectric loss.

## Parallel branches

The `pa` constructors are parallel two-port branches. The `se` constructors are the equivalent named series forms:

```js
var shuntR = nP.paR(); // 75 Ω
var shuntL = nP.paL(); // 5 nH
var shuntC = nP.paC(); // 1 pF

var seriesR = nP.seR(50);
var seriesL = nP.seL(9e-9);
var seriesC = nP.seC(3e-12);
```

The corresponding value defaults are the same as `R()`, `L()`, and `C()`. A parallel constructor is already a two-port network element; for a schematic with a discrete component connected from a Tee to ground, use the separate part and `nP.nodal()` instead.

## Build a ladder from parts

Name the physical parts before connecting them. `Tee()` and `Short()` make the shunt node visible:

```js
nP.global.fList = nP.global.fGen(10e6, 2e9, 51);

var l1 = nP.L(9.57e-9);
var c1 = nP.C(3.17e-12);
var l2 = nP.L(9.57e-9);
var junction = nP.Tee();
var ground = nP.Short();

var ladder = nP.nodal(
    [l1, 1, 2],
    [junction, 4, 2, 3],
    [c1, 4, 5],
    [ground, 5],
    [l2, 3, 6],
    ['out', 1, 6]
);

nP.lineChart({
    inputTable: [ladder.out('s11dB', 's21dB')],
    title: 'L-C-L ladder',
    metricPrefix: 'giga'
});
```

## Transformers

`nP.trf()` is an ideal two-port transformer; `nP.trf4Port()` is its four-port form. Both default to a **0.5** turns ratio. The first argument changes that dimensionless ratio:

```js
var twoPort = nP.trf();        // 0.5 turns ratio
var twoPort2 = nP.trf(2);     // 2 turns ratio
var fourPort = nP.trf4Port(); // 0.5 turns ratio
```

## Combined RLC constructors

Older compound constructors remain available, such as `seSeRL()`, `paSeRC()`, and `sePaRLC()`. In their names, `se` means series and `pa` means parallel. They default to **75 Ω**, **5 nH**, and **1 pF** for whichever parts they contain. For new circuit examples, separate components connected with `nodal()` keep the topology visible. The [RF Constructors](./rf-constructors.md#older-combined-rlc-components) page lists the complete family.
