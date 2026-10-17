<!-- Modified: 2026-10-15 -->
# Visualization Development

This companion to `visualizationDevelopment.html` uses one diplexer to exercise a line chart, an SVG table, and a Smith chart. It also checks linear Cartesian axes and log-log axes. Run the single `npjs` block in Obsidian or use the HTML harness in a browser.

```npjs
// Compact Manual example #1, page 27.
nP.global.fList = nP.global.fGen(100e6, 1000e6, 51);

var tee = nP.Tee();
var short = nP.Short();
var highPass = nP.nodal(
    [nP.C(3.05e-12), 1, 2],
    [tee, 5, 2, 3],
    [nP.C(23.55e-12), 3, 4],
    [nP.R(0.6), 5, 6],
    [nP.L(56.4e-9), 6, 7],
    [short, 7],
    ['out', 1, 4]
);
var lowPass = nP.nodal(
    [nP.R(0.3), 1, 2],
    [nP.L(32.4e-9), 2, 3],
    [tee, 7, 3, 4],
    [nP.R(0.1), 4, 5],
    [nP.L(33.5e-9), 5, 6],
    [nP.C(7.15e-12), 7, 8],
    [short, 8],
    ['out', 1, 6]
);
var diplexer = nP.nodal(
    [tee, 1, 2, 3],
    [highPass, 2, 4],
    [lowPass, 3, 5],
    ['out', 1, 4, 5]
);
var diplexerDb = diplexer.out('s11dB', 's21dB', 's31dB');
var diplexerReflection = diplexer.out('s11Re', 's11Im', 's22Re', 's22Im', 's33Re', 's33Im');

nP.lineChart({
    inputTable: [diplexerDb],
    title: 'Diplexer Response',
    mount: '#diplexerChart',
    backgroundColor: 'white'
});

var linearTable = [
    ['x', 'y = x + 1', 'y = -x + 1'],
    [-2, -1, 3],
    [-1, 0, 2],
    [0, 1, 1],
    [1, 2, 0],
    [2, 3, -1]
];
nP.lineChart({
    inputTable: [linearTable],
    title: 'Linear XY Axes',
    mount: '#linearChart',
    xAxisTitle: 'x',
    yAxisTitle: 'y',
    metricPrefix: 'none',
    xScale: 'linear',
    yScale: 'linear',
    xAxisPosition: 'origin',
    yAxisPosition: 'origin',
    xRange: [-2, 2],
    yRange: [-4, 4],
    backgroundColor: 'white'
});

var logTable = [
    ['x', 'y = x'],
    [10, 10],
    [100, 100],
    [1000, 1000],
    [10000, 10000]
];
nP.lineChart({
    inputTable: [logTable],
    title: 'Log-Log Axes',
    mount: '#logChart',
    xAxisTitle: 'x',
    yAxisTitle: 'y',
    metricPrefix: 'none',
    xScale: 'log',
    yScale: 'log',
    xAxisPosition: 'bottom',
    yAxisPosition: 'left',
    xRange: [10, 10000],
    yRange: [10, 10000],
    backgroundColor: 'white'
});

var table = nP.lineTable({
    inputTable: [diplexerDb],
    title: 'Diplexer Response',
    mount: '#diplexerTable',
    backgroundColor: 'white',
    fontFamily: 'sans-serif',
    fontSize: 14
});
table.setTxtTableTitleStyle({fill: 'red', fontStyle: 'italic'});

nP.smithChart({
    inputTable: [diplexerReflection],
    title: 'Diplexer Reflections',
    mount: '#diplexerSmith',
    backgroundColor: 'white',
    fontFamily: 'sans-serif',
    fontSize: 14
});
```
