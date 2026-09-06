<!-- Modified: 2026-09-06 -->
# Microstrip Thin-Film Resistor Development

This analysis compares ideal resistance, thin-film resistance, and microstrip transmission behavior. Its executable harness is the `mtfr` section of `dev/microstripDevelopment.html`.

```npjs
var g = nP.global;
g.fList = g.fGen(100e6, 20e9, 100);

var width = 23e-3 * 0.0254;
var length = 34.5e-3 * 0.0254;

var r75 = nP.R(75);
var film75 = nP.mtfr({
    ohmsPerSquare: 50,
    width,
    length
});
var line = nP.mlin({
    width,
    height: 0.025 * 0.0254,
    length,
    thickness: 0.0000125 * 0.0254,
    relativePermittivity: 10,
    resistivity: 0,
    lossTangent: 0
});
var film0 = nP.mtfr({
    ohmsPerSquare: 0,
    width,
    length
});

var r75Out = r75.out('s21mag');
r75Out[0][1] = 'R 75 ohm s21mag';

var film75Out = film75.out('s21mag');
film75Out[0][1] = 'mtfr 75 ohm s21mag';

var lineOut = line.out('s21mag');
lineOut[0][1] = 'mlin s21mag';

var film0Out = film0.out('s21mag');
film0Out[0][1] = 'mtfr 0 ohm/sq s21mag';

var lineAngleOut = line.out('s21ang');
lineAngleOut[0][1] = 'mlin s21ang';

var film0AngleOut = film0.out('s21ang');
film0AngleOut[0][1] = 'mtfr 0 ohm/sq s21ang';

var comparisonOut = [
    [
        'Frequency',
        'R 75 ohm s21mag',
        'mtfr 75 ohm s21mag',
        'mlin s21mag',
        'mtfr 0 ohm/sq s21mag',
        'mlin s21ang',
        'mtfr 0 ohm/sq s21ang'
    ]
];
for (var i = 1; i < r75Out.length; i++) {
    comparisonOut[i] = [
        r75Out[i][0],
        r75Out[i][1],
        film75Out[i][1],
        lineOut[i][1],
        film0Out[i][1],
        lineAngleOut[i][1],
        film0AngleOut[i][1]
    ];
}

var table = nP.lineTable({
    inputTable: [comparisonOut],
    title: 'R vs mtfr',
    mount: '#tableDiv',
    metricPrefix: 'giga',
    backgroundColor: 'white',
    fontFamily: 'sans-serif',
    fontSize: 14
});
```
