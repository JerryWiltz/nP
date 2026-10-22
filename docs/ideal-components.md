<!-- Modified: 2026-10-21 -->
# Ideal components

Ideal components provide connections, terminations, lossless lines, and simple gain or loss blocks. Set the frequency list before constructing them. Each returns an [nPort object](./nport-object.md) that can be connected with [`nodal()` or `cascade()`](./connecting-nports.md).

## Connections and terminations

These calls need no electrical values. They use the current `nP.global.fList` unless you supply an optional `{fList}` object.

| Constructor | Ports | Use |
| --- | ---: | --- |
| `nP.Open()` | 1 | Open circuit. |
| `nP.Short()` | 1 | Short circuit. |
| `nP.Load()` | 1 | Matched load at the reference impedance. |
| `nP.Thru()` | 2 | Matched, lossless through connection. |
| `nP.Shift90()` | 2 | Fixed 90° phase shift. |
| `nP.Tee()` | 3 | Junction for a shunt branch or divider. |
| `nP.Tee4()` | 4 | Four-port junction. |
| `nP.Tee5()` | 5 | Five-port junction. |
| `nP.seriesTee()` | 3 | Junction for a floating series branch. |

`Tee()` has its common or shunt connection at internal port 1. In `seriesTee()`, ports 1 and 2 form the through path and port 3 connects the one-port series branch. The [shunt-branch example](./connecting-nports.md#add-a-shunt-branch) shows `Tee()` and `Short()` together.

## A lossless line

`nP.Tlin()` is a two-port lossless transmission line. Its defaults are **60 Ω** characteristic impedance and **0.0127 m** length (0.5 in). The first argument changes impedance; the second changes length. The propagation model uses the speed of light in vacuum. Use [physical microstrip](./microstrip.md) when substrate and conductor properties matter.

```js
nP.global.fList = nP.global.fGen(1e9, 3e9, 21);

var line = nP.Tlin(50, 0.0254); // 50 Ω, 1 in
var response = line.out('s11dB', 's21dB');

nP.lineChart({
    inputTable: [response],
    title: 'Ideal 50 Ω line',
    metricPrefix: 'giga'
});
```

`nP.Tclin()` is a lossless **four-port coupled line**. Its defaults are **100 Ω even-mode impedance**, **30 Ω odd-mode impedance**, and **0.037338 m** length (1.47 in). Call `nP.Tclin(90, 35, 0.0254)` for a 90 Ω / 35 Ω pair that is 1 in long.

The coupled-line ports run clockwise from the upper left:

```text
port 1  ---- coupled line ----  port 2
port 4  ---- coupled line ----  port 3
```

From input port 1, port 2 is through, port 4 is coupled, and port 3 is isolated. The same numbering applies to `nP.mclin()`.

## An ideal directional coupler

`nP.Coupler180()` is a matched, reciprocal, lossless four-port with the same real S-matrix at every frequency, including DC. It defaults to an exact equal-power split (about 3.0103 dB coupling); use `nP.Coupler180({couplingDb: 10})` for a 10 dB coupled path. It uses the port order shown above: input 1 goes through to 2 and forward coupled to 4, while 3 is isolated. A reflection entering port 2 couples to port 3. Its 180° phase convention makes it suitable for real-valued time-domain reconstruction. It is an ideal model rather than a physical coupled line; see the [VNA reflection example](./digital-signals.md#vna-time-domain-reflection).

## Attenuator and amplifier

`nP.Attn()` is a matched two-port with **3 dB attenuation** by default. `nP.Attn(6)` gives 6 dB. Its physical temperature defaults to the selected `nP.global.Temp`; pass `nP.Attn(6, 290)` for a 290 K attenuator. The chosen temperature affects its noise.

`nP.Amp()` is a matched, unilateral two-port with **20 dB gain** and **4 dB noise figure** by default. `nP.Amp(15, 3)` gives 15 dB gain and 3 dB NF. Its default noise reference temperature is **290 K**. The object form accepts measured S-parameters and noise properties; it can also carry optional intercept specifications for two-tone analysis.

```js
nP.global.fList = [1e9, 2e9];

var amplifier = nP.Amp(15, 3);
var attenuator = nP.Attn(6);
var chain = nP.cascade(amplifier, attenuator);

nP.lineTable({
    inputTable: [chain.out('s21dB', 'NF21dB')],
    title: 'Gain and noise figure'
});
```

See [Noise](./noise.md) for noise results, [Intermodulation](./intermodulation.md) for OIP options, and [RF Constructors](./rf-constructors.md#attenuator-and-amplifier) for the full amplifier object form.
