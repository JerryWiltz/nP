<!-- Modified: 2026-10-07 -->
# Microstrip Line Development

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
