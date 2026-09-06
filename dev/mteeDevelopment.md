<!-- Modified: 2026-09-06 -->
# Microstrip Tee Development

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
