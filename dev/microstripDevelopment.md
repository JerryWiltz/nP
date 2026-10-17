<!-- Modified: 2026-10-15 -->
# Microstrip Development Examples

This companion to `microstripDevelopment.html` keeps five independently runnable `npjs` examples. Each section sets its analysis frequencies before constructing components. The model equations, assumptions, and source references live in `developmentDocs/microstrip/README.md`.

## Microstrip Line Development

This analysis evaluates a physical microstrip line and displays its output as a table, line chart, and Smith chart. Its executable harness is the `mlin` section of `dev/microstripDevelopment.html`.

```npjs
var fGlobal = nP.global;
fGlobal.fList = [10e9];

var mil = 0.001 * 0.0254;
var lineWidth = 0.023 * 0.0254;
var substrateHeight = 25 * mil;
var lineLength = 0.5 * 0.0254;
var conductorThickness = 1 * mil;
var er = 10;
var resistivity = 1.72e-8;
var tand = 0.001;

const mlin1 = nP.mlin({
    width: lineWidth,
    height: substrateHeight,
    length: lineLength,
    thickness: conductorThickness,
    relativePermittivity: er,
    resistivity: resistivity,
    lossTangent: tand
});
var test = nP.nodal(
    [mlin1, 1, 2],
    ['out', 1, 2]
);
var mlinOut = test.out('s21dB');
var smithOut = test.out('s11Re', 's11Im');

var table = {
    inputTable: [mlinOut],
    title: 'Microstrip Line',
    mount: '#tableDiv',
    metricPrefix: 'giga',
    fontFamily: 'sans-serif',
    fontSize: 14
};

nP.lineTable(table);

var chart = {
    inputTable: [mlinOut],
    title: 'Microstrip Line',
    mount: '#chartDiv',
    metricPrefix: 'giga',
    xAxisTitle: 'Frequency, GHz',
    yAxisTitle: 's21, dB',
    fontFamily: 'sans-serif',
    fontSize: 14
};

nP.lineChart(chart);

var smithChart = {
    inputTable: [smithOut],
    title: 'Microstrip Line Smith Chart',
    mount: '#smithDiv',
    metricPrefix: 'giga',
    fontFamily: 'sans-serif',
    fontSize: 14
};

nP.smithChart(smithChart);
```

## Coupled Microstrip Line Development

This analysis evaluates a four-port coupled microstrip line, including through, coupled, matched, and isolated responses. Its executable harness is the `mclin` section of `dev/microstripDevelopment.html`.

```npjs
var g = nP.global;
g.fList = [1.8e9];

var mil = 0.001 * 0.0254;
var width = 19.1155 * mil;
var space = 5.82185 * mil;
var height = 25 * mil;
var thickness = 0.0000125 * 0.0254;
var length = 719.794 * mil;
var er = 10;
var resistivity = 1.72e-8;
var tand = 0.001;

var coupledLine = nP.mclin({
    width: width,
    spacing: space,
    height: height,
    length: length,
    thickness: thickness,
    relativePermittivity: er,
    resistivity: resistivity,
    lossTangent: tand
});

var coupler = nP.nodal(
    [coupledLine, 1, 2, 3, 4],
    ['out', 1, 2, 3, 4]
);

var tableOut = coupler.out('s21dB', 's41dB', 's11dB', 's31dB');
var smithOut = coupler.out('s11Re', 's11Im');

nP.lineTable({
    inputTable: [tableOut],
    title: 'Coupled Microstrip Line',
    mount: '#tableDiv',
    metricPrefix: 'giga',
    fontFamily: 'sans-serif',
    fontSize: 14
});

nP.lineChart({
    inputTable: [tableOut],
    title: 'Coupled Microstrip Line',
    mount: '#chartDiv',
    metricPrefix: 'giga',
    fontFamily: 'sans-serif',
    fontSize: 14
});

nP.smithChart({
    inputTable: [smithOut],
    title: 'Coupled Microstrip Line S11',
    mount: '#smithDiv',
    fontFamily: 'sans-serif',
    fontSize: 14
});
```

## Microstrip Tee Development

This analysis evaluates the three-port physical microstrip tee and displays its S-parameters in three forms. Its executable harness is the `mtee` section of `dev/microstripDevelopment.html`.

```npjs
var g = nP.global;
g.fList = g.fGen(1e9, 10e9, 101);

var tee = nP.mtee();

var test = nP.nodal(
    [tee, 1, 2, 3],
    ['out', 1, 2, 3]
);

var tableOut = test.out('s11dB', 's21dB', 's31dB');
var smithOut = test.out('s11Re', 's11Im', 's22Re', 's22Im', 's33Re', 's33Im');

const table = nP.lineTable({
    inputTable: [tableOut],
    title: 'Microstrip Tee',
    mount: '#tableDiv',
    metricPrefix: 'giga',
    backgroundColor: 'white',
    fontFamily: 'sans-serif',
    fontSize: 14
});

const chart = nP.lineChart({
    inputTable: [tableOut],
    title: 'Microstrip Tee',
    mount: '#chartDiv',
    metricPrefix: 'giga',
    backgroundColor: 'white',
    fontFamily: 'sans-serif',
    fontSize: 14
});

const smithChart = nP.smithChart({
    inputTable: [smithOut],
    title: 'Microstrip Tee Smith Chart',
    mount: '#smithDiv',
    metricPrefix: 'giga',
    backgroundColor: 'white',
    fontFamily: 'sans-serif',
    fontSize: 14
});
```

## Microstrip Tee Power Divider Development

This analysis compares an ideal Wilkinson-style divider with a physical implementation using microstrip tees, lines, and a thin-film resistor. Its executable harness is the `power-divider` section of `dev/microstripDevelopment.html`.

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
var mteeIn = nP.mtee({
    commonWidth: 0.023 * 0.0254,
    branch1Width: 0.010 * 0.0254,
    branch2Width: 0.010 * 0.0254,
    height: 0.025 * 0.0254,
    thickness: 0.0000125 * 0.0254,
    relativePermittivity: 10,
    resistivity: 0,
    lossTangent: 0,
    roughnessRms: 0
});

var mlin10 = nP.mlin({
    width: 10e-3 * 0.0254,
    height: 0.025 * 0.0254,
    length: 190e-3 * 0.0254, // tuned from ideal 197 mil to recenter mtee divider near 6 GHz
    thickness: 0.0000125 * 0.0254,
    relativePermittivity: 10,
    resistivity: 0,
    lossTangent: 0
});

var mteeRes = nP.mtee({
    commonWidth: 0.023 * 0.0254,
    branch1Width: 0.023 * 0.0254,
    branch2Width: 0.010 * 0.0254,
    height: 0.025 * 0.0254,
    thickness: 0.0000125 * 0.0254,
    relativePermittivity: 10,
    resistivity: 0,
    lossTangent: 0,
    roughnessRms: 0
});

var rFilm100 = nP.mtfr({
    ohmsPerSquare: 50,
    width: 23e-3 * 0.0254,
    length: 46e-3 * 0.0254
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

## Microstrip Thin-Film Resistor Development

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
