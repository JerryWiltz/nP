<!-- Modified: 2026-10-19 -->
# Microstrip

Physical microstrip constructors use substrate, conductor, and geometry inputs to produce frequency-dependent n-ports. Use lowercase names such as `nP.mlin()` for these models. For a lossless line with no physical substrate, use [`nP.Tlin()`](./ideal-components.md#a-lossless-line).

## Units and common defaults

Call each constructor with no arguments for its default geometry, or pass **one options object**. All lengths, widths, gaps, and thicknesses are in **meters**. A mil is `25.4e-6` m; an inch is `0.0254` m. Positional values are not supported.

The line, coupled line, tee, step, bend, and cross default to **25 mil substrate height**, **0.0000125 in metal thickness**, **relative permittivity 10**, **copper resistivity `1.72e-8` Ω·m**, **loss tangent 0.001**, and **zero RMS surface roughness**. Use `resistivity` for an absolute material value in Ω·m. These models use the selected circuit frequency list; the line, coupled line, tee, and film resistor also use the selected circuit temperature.

```js
nP.global.fList = nP.global.fGen(1e9, 3e9, 21);

var line = nP.mlin({
    width: 30 * 25.4e-6, // 30 mil
    length: 0.0254,      // 1 in
    height: 25 * 25.4e-6,
    relativePermittivity: 10
});

nP.lineChart({
    inputTable: [line.out('s11dB', 's21dB')],
    title: 'Physical microstrip line',
    metricPrefix: 'giga'
});
```

## Lines and junctions

| Constructor | Ports | Default geometry | Main options |
| --- | ---: | --- | --- |
| `nP.mlin()` | 2 | 23 mil width, 0.5 in length | `width`, `length` |
| `nP.mclin()` | 4 | 19.1155 mil width, 5.82185 mil gap, 719.794 mil length | `width`, `spacing`, `length` |
| `nP.mtee()` | 3 | Three 23 mil arms | `commonWidth`, `branch1Width`, `branch2Width` |
| `nP.mstep()` | 2 | 46 mil input, 23 mil output | `inputWidth`, `outputWidth` |
| `nP.mbend()` | 2 | 23 mil width, no miter | `width`, `miterLength` |
| `nP.mcross()` | 4 | Four 23 mil arms | `leftWidth`, `topWidth`, `rightWidth`, `bottomWidth` |

All six accept the common substrate and material options above. `mclin()` uses the clockwise coupled-line order: port 1 upper left, port 2 upper right, port 3 lower right, port 4 lower left. `mtee()` uses port 1 as the common arm and ports 2 and 3 as branches, matching ideal `Tee()`.

```js
var split = nP.mtee({
    commonWidth: 30 * 25.4e-6,
    branch1Width: 23 * 25.4e-6,
    branch2Width: 23 * 25.4e-6
});

var coupled = nP.mclin({spacing: 10 * 25.4e-6});
```

## Film resistor and vias

| Constructor | Ports | Default geometry | Main options |
| --- | ---: | --- | --- |
| `nP.mtfr()` | 2 | 50 Ω/square, 10 × 10 mil film | `ohmsPerSquare`, `width`, `length`, `temperatureCoefficient` |
| `nP.mvgnd()` | 1 | 100 µm diameter, 25 mil height | `diameter`, `height`, `resistivity` |
| `nP.mvia()` | 2 | 100 µm diameter, 25 mil connection height, no pads or stubs | `diameter`, `connectionHeight`, `padDiameter`, `antipadDiameter` |

`mtfr()` also uses a 25 mil substrate, relative permittivity 10, and loss tangent 0.001 by default. Its temperature coefficient defaults to zero. The vias default to copper resistivity; `mvia()` also defaults to relative permittivity 10.

```js
var film = nP.mtfr({ohmsPerSquare: 100});
var groundedVia = nP.mvgnd({diameter: 200e-6});
var transition = nP.mvia({diameter: 200e-6});
```

## Inspect a physical model

These constructors return ordinary n-ports with `.out(...)`. They also expose `.physicalModel` metadata describing the model family, geometry, material, and analysis settings:

```js
var line = nP.mlin();
nP.log(line.physicalModel.geometry);
nP.log(line.physicalModel.material);
```

Use named properties and the same dimensions for components you intend to connect. An optional `fList` property overrides the selected frequency list for one component, but all n-ports in the same analysis must have matching frequency rows. For the full option lists and model assumptions, see [RF Constructors](./rf-constructors.md#physical-microstrip).
