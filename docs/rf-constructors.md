<!-- Modified: 2026-10-21 -->
# RF Constructors

Set the frequencies first. Then make each part of the circuit. These calls return [nPort objects](./nport-object.md) that you can [connect](./connecting-nports.md).

```js
nP.global.fList = nP.global.fGen(1e9, 3e9, 21); // 1–3 GHz, 21 points
```

Every constructor below uses this frequency list unless you supply another one. The default reference impedance is 50 Ω. Components with thermal noise use the selected circuit temperature, 293 K by default. See [Global settings](./global-settings.md) to change either setting.

## Resistors, inductors, and capacitors

`R()`, `L()`, and `C()` are series two-port components. The value you enter is in ohms, henries, or farads.

```js
var r1 = nP.R();        // default: 75 Ω
var r2 = nP.R(430);     // 430 Ω

var l1 = nP.L();        // default: 5 nH
var l2 = nP.L(12e-9);   // 12 nH

var c1 = nP.C();        // default: 1 pF
var c2 = nP.C(2.2e-12); // 2.2 pF
```

A resistor uses the selected circuit temperature for noise. To give one resistor a different temperature, use `nP.R(430, 290)` for 430 Ω at 290 K.

The `se` names are equivalent series forms. The `pa` names make parallel branches:

```js
var seriesR = nP.seR();       // default: 75 Ω
var parallelR = nP.paR();     // default: 75 Ω
var parallelR2 = nP.paR(430); // 430 Ω

var seriesL = nP.seL();       // default: 5 nH
var parallelL = nP.paL();     // default: 5 nH
var parallelL2 = nP.paL(12e-9); // 12 nH

var seriesC = nP.seC();       // default: 1 pF
var parallelC = nP.paC();     // default: 1 pF
var parallelC2 = nP.paC(2.2e-12); // 2.2 pF
```

Use separate parts with `nP.nodal()` when you want the circuit topology to be clear.

## Ideal connections

These have no electrical value to enter. Each call creates the named connection or termination.

```js
var open = nP.Open();          // open one-port
var short = nP.Short();        // shorted one-port
var load = nP.Load();          // matched one-port load
var thru = nP.Thru();          // lossless two-port through connection
var phase90 = nP.Shift90();    // +90° through phase at every frequency
var tee = nP.Tee();            // three-port shunt junction
var tee4 = nP.Tee4();          // four-port junction
var tee5 = nP.Tee5();          // five-port junction
var seriesTee = nP.seriesTee(); // three-port series junction
```

Use `Tee()` where a branch joins the main path. In `seriesTee()`, ports 1 and 2 form the through path; port 3 connects a floating series branch. The [Connecting nPorts](./connecting-nports.md#add-a-shunt-branch) page shows how to wire a Tee and shunt component.

## Ideal transmission lines

Lengths are entered in **meters**. The inch equivalents below make the defaults easier to recognize.

### Two-port line: `Tlin()`

```js
var line1 = nP.Tlin();           // default: 60 Ω, 0.0127 m (0.5 in)
var line2 = nP.Tlin(50, 0.0254); // 50 Ω, 0.0254 m (1 in)
```

The first argument is characteristic impedance in ohms; the second is length in meters.

### Four-port coupled line: `Tclin()`

```js
var coupled1 = nP.Tclin(); // default: 100 Ω even mode, 30 Ω odd mode,
                           // 0.037338 m (1.47 in) long
var coupled2 = nP.Tclin(90, 35, 0.0254);
// 90 Ω even mode, 35 Ω odd mode, 0.0254 m (1 in) long
```

The arguments are even-mode impedance, odd-mode impedance, and length. `Tclin()` ports are numbered clockwise from the upper left: 1, 2, 3, 4.

### Ideal four-port coupler: `Coupler180()`

```js
var coupler1 = nP.Coupler180();                 // equal-power split
var coupler2 = nP.Coupler180({couplingDb: 10}); // 10 dB coupled path
```

`Coupler180()` has a frequency-independent, lossless 180° hybrid S-matrix, including at DC. Port 1 drives port 2 through and port 4 coupled; port 3 is isolated from port 1 and receives a return entering port 2. Unlike `Tclin()`, it does not take even-mode impedance, odd-mode impedance, or length. See [Ideal components](./ideal-components.md#an-ideal-directional-coupler) for the time-domain use.

## Attenuator and amplifier

```js
var attenuator1 = nP.Attn();  // default: 3 dB loss
var attenuator2 = nP.Attn(6); // 6 dB loss

var amplifier1 = nP.Amp();       // default: 20 dB gain, 4 dB NF
var amplifier2 = nP.Amp(15, 3);  // 15 dB gain, 3 dB NF
```

The attenuator uses the selected circuit temperature by default; `nP.Attn(6, 290)` makes a 6 dB attenuator at 290 K. The amplifier's default noise reference temperature is 290 K. Its default S-parameters describe a matched, unilateral stage with 20 dB gain.

For two-tone work, specify an output intercept when constructing the amplifier:

```js
var amplifier3 = nP.Amp({
    gainDb: 20,  // 20 dB gain
    oip3dBm: 30  // 30 dBm output IP3
});
```

If no OIP value is supplied, the corresponding intermodulation source is absent. See [Noise](./noise.md) and [Intermodulation](./intermodulation.md) for measurements and additional amplifier settings.

## Physical microstrip

Physical microstrip constructors accept an options object. Calling one with no arguments uses its built-in geometry. Put only the dimensions you want to change in the object. **All lengths you enter are in meters**; 1 mil is 25.4 µm and 1 inch is 0.0254 m.

The line, coupled line, tee, step, bend, and cross use a 25 mil substrate height, 0.0000125 inch metal thickness, relative permittivity 10, copper resistivity 1.72e-8 Ω·m, loss tangent 0.001, and zero surface roughness by default. The line, coupled line, and tee use the selected circuit temperature.

```js
var line3 = nP.mlin(); // default: 23 mil width, 0.5 in length
var line4 = nP.mlin({
    width: 0.000762, // 30 mil
    length: 0.0254   // 1 in
});

var coupled3 = nP.mclin(); // default: 19.1155 mil width,
                           // 5.82185 mil gap, 719.794 mil length
var coupled4 = nP.mclin({
    spacing: 0.000254 // 10 mil gap
});

var tee3 = nP.mtee(); // default: 23 mil width at each of 3 ports
var tee3wide = nP.mtee({
    commonWidth: 0.000762 // port 1 is 30 mil wide
});
```

The rest of the microstrip family uses the same units:

```js
var step1 = nP.mstep(); // default: 46 mil input, 23 mil output
var step2 = nP.mstep({
    inputWidth: 0.000762 // 30 mil input
});

var bend1 = nP.mbend(); // default: 23 mil width, no miter
var bend2 = nP.mbend({
    width: 0.000762 // 30 mil width
});

var cross1 = nP.mcross(); // default: four 23 mil arms
var cross2 = nP.mcross({
    leftWidth: 0.000762 // left arm is 30 mil wide
});

var film1 = nP.mtfr(); // default: 50 Ω/square, 10 × 10 mil film
var film2 = nP.mtfr({
    ohmsPerSquare: 100 // 100 Ω/square
});

var groundVia1 = nP.mvgnd(); // default: 100 µm diameter,
                             // 25 mil height, copper
var groundVia2 = nP.mvgnd({
    diameter: 0.0002 // 200 µm
});

var via1 = nP.mvia(); // default: 100 µm diameter,
                      // 25 mil connection height, no pads or stubs
var via2 = nP.mvia({
    diameter: 0.0002 // 200 µm
});
```

The film resistor also defaults to 25 mil substrate height, relative permittivity 10, loss tangent 0.001, and the selected circuit temperature. Its temperature coefficient is zero. Via models default to copper resistivity; `mvia()` has relative permittivity 10. Use `resistivity` in Ω·m when changing conductor material.

## Transformers and low-pass filter

```js
var transformer1 = nP.trf();       // default turns ratio: 0.5
var transformer2 = nP.trf(2);      // turns ratio: 2

var transformer4a = nP.trf4Port();  // default turns ratio: 0.5
var transformer4b = nP.trf4Port(2); // turns ratio: 2

var filter1 = nP.lpfGen(); // default 50 Ω C-L-C low-pass:
                           // 16.418 pF, 45.654 nH, 16.418 pF
var filter2 = nP.lpfGen([
    50,      // source resistance, Ω
    12e-12,  // shunt capacitor, 12 pF
    30e-9,   // series inductor, 30 nH
    12e-12,  // shunt capacitor, 12 pF
    50       // load resistance, Ω
]);
```

`lpfGen()` removes the first and last entries from a supplied filter array. If you need that array afterward, pass a copy with `values.slice()`.

## Older combined RLC components

These convenience constructors still work. The first two letters describe how the component group connects to the circuit: `se` for series, `pa` for parallel. The next two letters describe how the parts connect to each other. Defaults are always **R = 75 Ω**, **L = 5 nH**, and **C = 1 pF** for whichever parts appear.

```js
var rl1 = nP.seSeRL(); // series R-L, defaults: 75 Ω, 5 nH
var rl2 = nP.sePaRL(); // parallel R-L in a series branch
var rl3 = nP.paSeRL(); // series R-L in a parallel branch
var rl4 = nP.paPaRL(); // parallel R-L in a parallel branch
var rl5 = nP.seSeRL(430, 12e-9); // 430 Ω, 12 nH

var rc1 = nP.seSeRC(); // defaults: 75 Ω, 1 pF
var rc2 = nP.sePaRC();
var rc3 = nP.paSeRC();
var rc4 = nP.paPaRC();
var rc5 = nP.seSeRC(430, 2.2e-12); // 430 Ω, 2.2 pF

var lc1 = nP.seSeLC(); // defaults: 5 nH, 1 pF
var lc2 = nP.sePaLC();
var lc3 = nP.paSeLC();
var lc4 = nP.paPaLC();
var lc5 = nP.seSeLC(12e-9, 2.2e-12); // 12 nH, 2.2 pF

var rlc1 = nP.seSeRLC(); // defaults: 75 Ω, 5 nH, 1 pF
var rlc2 = nP.sePaRLC();
var rlc3 = nP.paSeRLC();
var rlc4 = nP.paPaRLC();
var rlc5 = nP.seSeRLC(430, 12e-9, 2.2e-12);
```

For new circuits, separate parts plus `nP.nodal()` make the electrical connections easier to see.

## Diode

```js
var diode1 = nP.diode1N4148(); // default: zero DC bias
var diode2 = nP.diode1N4148({
    biasVoltage: 0.5 // 0.5 V applied DC bias
});
```

The default 1N4148 model includes a 0.568 Ω series resistance, 4 pF zero-bias junction capacitance, 4 ns transit time, and a 100 V breakdown setting. It uses the selected circuit temperature and provides both RF S-parameters and a DC I–V curve. The [constructor catalog](https://github.com/JerryWiltz/nP/blob/master/developmentDocs/np-nport/constructorCatalog.md) records the full model parameters.

## More detail

See [Circuit examples](./circuit-examples.md) for complete networks and the [constructor catalog](https://github.com/JerryWiltz/nP/blob/master/developmentDocs/np-nport/constructorCatalog.md) for every argument, option, and model default.
