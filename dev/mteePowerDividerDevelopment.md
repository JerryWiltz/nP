<!-- Modified: 2026-07-14 -->
# Microstrip Tee Power Divider Development

This analysis compares an ideal Wilkinson-style divider with a physical implementation using microstrip tees, lines, and a thin-film resistor. It is converted from `dev/mteePowerDividerDevelopment.html`.

```npjs
var g = nP.global;
g.fList = g.fGen(1000e6, 12000e6, 51);

// define the components of the ideal Tee power divider
var tee = nP.Tee();
var t70 = nP.Tlin(70, 2.997925e8 / (4 * 6e9));
var r100 = nP.R(100);

// hook up the components with nodal, it creates an output 3-port named "wilkinson"
var wilkinson = nP.nodal(
    [tee, 1, 2, 3],
    [t70, 3, 5],
    [t70, 2, 4],
    [tee, 9, 5, 7],
    [tee, 8, 6, 4],
    [r100, 8, 9],
    ['out', 1, 7, 6]
);

// create a matching comparison divider using mtee() and mlin() for all junctions
var mteeIn = nP.mtee({ // widths are 23, 10, 10
    commonWidth: 0.023 * 0.0254,
    branch1Width: 0.010 * 0.0254,
    branch2Width: 0.010 * 0.0254,
    Height: 0.025 * 0.0254,
    Thickness: 0.0000125 * 0.0254,
    er: 10,
    rho: 0,
    tand: 0
});

var mlin10 = nP.mlin(
    10e-3 * 0.0254,
    0.025 * 0.0254,
    190e-3 * 0.0254, // tuned from ideal 197 mil to recenter mtee divider near 6 GHz
    0.0000125 * 0.0254,
    10,
    0,
    0
);

var mteeRes = nP.mtee({ // widths are 23, 23, 10
    commonWidth: 0.023 * 0.0254,
    branch1Width: 0.023 * 0.0254,
    branch2Width: 0.010 * 0.0254,
    Height: 0.025 * 0.0254,
    Thickness: 0.0000125 * 0.0254,
    er: 10,
    rho: 0,
    tand: 0
});

var rFilm100 = nP.mtfr({
    ohmsPerSquare: 50,
    Width: 23e-3 * 0.0254,
    Length: 46e-3 * 0.0254
});

var wilkinsonMtee = nP.nodal(
    [mteeIn, 1, 2, 3],
    [mlin10, 3, 5],
    [mlin10, 2, 4],
    [mteeRes, 9, 5, 7],
    [mteeRes, 8, 6, 4],
    [rFilm100, 8, 9],
    ['out', 1, 7, 6]
);

var wilkinsonOut = wilkinson.out('s11dB', 's21dB');
wilkinsonOut[0][1] = 'ideal Tee s11dB';
wilkinsonOut[0][2] = 'ideal Tee s21dB';

var wilkinsonMteeOut = wilkinsonMtee.out('s11dB', 's21dB');
wilkinsonMteeOut[0][1] = 'mtee s11dB';
wilkinsonMteeOut[0][2] = 'mtee s21dB';

var chart = nP.lineChart({
    inputTable: [wilkinsonOut, wilkinsonMteeOut],
    title: 'Wilkinson Power Divider Comparison',
    mount: '#chartDiv',
    metricPrefix: 'mega',
    xAxisTitle: 'Frequency, MHz',
    yAxisTitle: 'dB',
    backgroundColor: 'white',
    fontFamily: 'sans-serif',
    fontSize: 14
});
```
