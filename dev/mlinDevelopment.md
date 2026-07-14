<!-- Modified: 2026-07-14 -->
# Microstrip Line Development

This analysis evaluates a physical microstrip line and displays its output as a table, line chart, and Smith chart. It is converted from `dev/mlinDevelopment.html`.

```npjs
var fGlobal = nP.global;
fGlobal.fList = [10e9];

var mil = 0.001 * 0.0254;
var lineWidth = 0.023 * 0.0254;
var substrateHeight = 25 * mil;
var lineLength = 0.5 * 0.0254;
var conductorThickness = 1 * mil;
var er = 10;
var rho = 1;
var tand = 0.001;

const mlin1 = nP.mlin(
    lineWidth,
    substrateHeight,
    lineLength,
    conductorThickness,
    er,
    rho,
    tand
);
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
