<!-- Modified: 2026-07-14 -->
# Nodal Connection Development

This analysis compares series and parallel nodal connections of the same two-port component. It is converted from `dev/nodeDevelopment.html`.

```npjs
var g = nP.global;
g.fList = g.fGen(1000e6, 3000e6, 51);

var r = nP.L();

var rSeries = nP.nodal(
    [r, 1, 2],
    ['out', 1, 2]
);

var seriesOut = rSeries.out('s11mag', 's21mag');

const series = nP.lineChart({
    inputTable: [seriesOut],
    title: 'My Chart',
    mount: '#seriesR',
    yAxisTitle: 'Mag',
    pngBackground: 'white'
});

var Short = nP.Short();
var Tee = nP.Tee();

var rParallel = nP.nodal(
    [r, 3, 0],
    [Tee, 3, 1, 2],
    [Short, 0],
    ['out', 1, 2]
);

var parallelOut = rParallel.out('s11mag', 's21mag');

const parallel = nP.lineChart({
    inputTable: [parallelOut],
    title: 'My Chart',
    mount: '#parallelR',
    yAxisTitle: 'Mag',
    pngBackground: 'white'

})
```
