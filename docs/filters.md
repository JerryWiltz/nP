<!-- Modified: 2026-10-19 -->
# Filters

The low-pass helpers calculate a Chebyshev prototype, scale it to component values, and build a two-port filter. Set the analysis frequencies before creating the final n-port.

## A ready-to-run low-pass filter

`nP.lpfGen()` defaults to a **50 Ω C-L-C low-pass filter**: 16.418 pF shunt, 45.654 nH series, 16.418 pF shunt. It returns an [nPort object](./nport-object.md), so you can call `.out(...)` or connect it to other two-ports.

```js
nP.global.fList = nP.global.fGen(10e6, 1e9, 51);

var filter = nP.lpfGen();
var response = filter.out('s11dB', 's21dB');

nP.lineChart({
    inputTable: [response],
    title: 'Default low-pass filter',
    metricPrefix: 'giga'
});
```

## Choose the Chebyshev order

`nP.chebyLPNsec(passFreq, rejectionFreq, rippleDb, rejectionDb)` calculates the integer section count. Its defaults are `0.2`, `1.5`, **0.1 dB** ripple, and **30 dB** rejection. The first two values must use the same frequency units, and the rejection frequency must be above the passband frequency.

```js
var sections = nP.chebyLPNsec(0.2e9, 1.5e9, 0.1, 30);
nP.log(sections);
```

## Calculate prototype and components

`nP.chebyLPgk(sections, rippleDb)` returns the normalized `g` values, including source and load. Its defaults are **3 sections** and **0.1 dB** ripple. `nP.chebyLPLCs(gValues, cutoffHz, impedanceOhms)` then returns `[source Ω, shunt C F, series L H, …, load Ω]`. Its default cutoff is **200 MHz** and its default impedance is **50 Ω**.

```js
var gValues = nP.chebyLPgk(3, 0.1);
var values = nP.chebyLPLCs(gValues, 200e6, 50);

nP.log(gValues);
nP.log(values);
```

The first and last values are source and load resistances. They are design endpoints; `lpfGen()` uses the internal C/L values to make the filter n-port.

## Build a filter from your values

Pass the scaled array to `lpfGen()` **as a copy**. The function removes the two endpoint resistances from its input array.

```js
nP.global.fList = nP.global.fGen(10e6, 1e9, 51);

var gValues = nP.chebyLPgk(3, 0.1);
var values = nP.chebyLPLCs(gValues, 200e6, 50);
var filter = nP.lpfGen(values.slice());

nP.lineChart({
    inputTable: [filter.out('s21dB')],
    title: 'Designed Chebyshev low-pass',
    metricPrefix: 'giga'
});
```

`lpfGen()` alternates shunt capacitors and series inductors, starting with a shunt capacitor. For an arbitrary topology, construct individual [lumped components](./lumped-components.md) and connect them with `nP.nodal()`.
