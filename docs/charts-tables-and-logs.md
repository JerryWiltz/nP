<!-- Modified: 2026-10-27 -->
# Charts, tables, and logs

Use `nP.lineChart()`, `nP.smithChart()`, and `nP.lineTable()` for visual results in a browser, or `nP.log()` for quick values. The charts and table accept the numeric tables returned by an [nPort's `.out()` method](./nport-object.md#read-results-with-out). Each call adds a display to the page.

## Line charts

To see a sample line plot before making a circuit, call `nP.lineChart()` with no arguments. The expanded call shows every option and its default value, with four rows from the built-in sample table. Use either call to draw one plot:

```js
nP.lineChart(); // default plot

nP.lineChart({
    inputTable: [[
        ['Freq', 's21dB', 's23dB'],
        [0, -3.52, -3.52],
        [3000000000, -3.27, -11.01],
        [6000000000, -3.01, -53.9],
        [12000000000, -3.52, -3.52]
    ]],
    mount: 'body',
    containerId: undefined,
    svgId: undefined,
    title: undefined,
    metricPrefix: 'giga',
    fontFamily: 'sans-serif',
    fontSize: 14,
    containerFontSizePx: undefined,
    backgroundColor: undefined,
    pngBackground: 'transparent', // legacy alias
    chartTitle: undefined, // legacy alias
    xAxisTitle: 'Frequency',
    yAxisTitle: 'dB',
    xScale: 'linear',
    yScale: 'linear',
    xAxisPosition: 'bottom',
    yAxisPosition: 'left',
    plotType: 'line', // 'line' or 'bar'
    barWidth: 4, // requested maximum SVG width per bar
    barBaseline: 0, // bar starting value in y-axis units
    showPoints: true,
    showLabels: true,
    showGrid: true,
    gridColor: '#e0e0e0',
    traceColor: true,
    traceWidth: 2,
    pointRadius: 3,
    labelFontSize: undefined,
    labelColor: undefined,
    width: 700,
    height: 450,
    margin: { top: 35, right: 80, bottom: 55, left: 75 },
    plotBorderColor: 'black',
    plotBorderWidth: 1,
    xRange: undefined,
    yRange: undefined
});
```

The sample table is independent of `nP.global.fList`. Properties shown as `undefined` are optional and normally omitted; they use the fallback described by the function. Pass your own `inputTable` when you have circuit results.

When `yRange` is omitted, a linear line chart adds 5% of the data span above and below its values before rounding the axis ticks. This keeps traces at the data limits away from the plot border. An explicit `yRange`, bar chart, or logarithmic y-axis does not use this padding.

`lineChart()` draws one trace for each column after the first. For an RF response, request the wanted selectors with `.out()`:

```js
nP.global.fList = nP.global.fGen(1e9, 3e9, 21);

var l1 = nP.L(5e-9);
var response = l1.out('s11dB', 's21dB');

nP.lineChart({
    inputTable: [response],
    title: 'Inductor response',
    metricPrefix: 'giga',
    yAxisTitle: 'dB',
    showPoints: false
});
```

Here, `metricPrefix: 'giga'` displays frequency values in GHz while `response` keeps its original hertz values. The default is `'giga'`. Use `'mega'` for MHz or `'none'` if your x values are already in the displayed unit. The chart also supports axis titles, linear or logarithmic scales, trace labels, grid lines, and explicit x/y ranges.

For discrete spectra, use `plotType: 'bar'`. Each data point becomes a narrow bar centered at its x value; bars do not connect. `barWidth` requests the maximum width in SVG pixels, and the chart narrows bars when x values are close enough to overlap. Bar mode includes `barBaseline` (default 0) in its automatic y range and hides endpoint trace labels by default. Set `barBaseline` explicitly when plotting already-converted dBm values from a chosen display floor; dBm values themselves belong on a linear y-axis. A logarithmic y-axis requires a positive baseline and positive data values.

```js
nP.lineChart({
    inputTable: [[
        ['Frequency', 'Peak amplitude'],
        [1000, 1],
        [2000, 0],
        [3000, 0.33]
    ]],
    title: 'Harmonic spectrum',
    plotType: 'bar',
    barWidth: 4,
    metricPrefix: 'kilo',
    yAxisTitle: 'Peak amplitude'
});
```

### Returned API

`nP.lineChart()` returns an object for working with the chart it just added to the page. It contains DOM elements and methods for changing their styles. It does not return the input data or an image.

```js
var chart = nP.lineChart({ title: 'Example' });
chart.setTitleStyle({ fill: 'navy', fontStyle: 'italic' });
chart.setPlotBorderStyle('stroke:#666;stroke-width:2');

// Remove this chart from the page when it is no longer needed.
// chart.container.remove();
```

The returned element properties are:

| Property | Element |
| --- | --- |
| `container` | Outer HTML `div` containing the chart and its copy button. |
| `svg` | Chart SVG element. |
| `background`, `chartBackground` | The same SVG background rectangle. |
| `title`, `txtChartTitle` | The same chart-title text element. |
| `plotBorder` | Border around the plot area. |
| `txtXAxisTitle`, `txtYAxisTitle` | Axis-title text elements. |
| `txtChartLabels` | Array of trace-label text elements; empty when labels are hidden. |
| `xAxisGroup`, `yAxisGroup` | SVG axis groups. |
| `xGridGroup`, `yGridGroup` | SVG grid groups. |

The style methods accept a CSS declaration string, such as `'fill:red;font-style:italic'`, or an object, such as `{ fill: 'red', fontStyle: 'italic' }`:

| Method | What it styles |
| --- | --- |
| `setBackgroundStyle()`, `setChartBackgroundStyle()` | Chart background; these are aliases. |
| `setTitleStyle()`, `setTxtChartTitleStyle()` | Chart title; these are aliases. |
| `setPlotBorderStyle()` | Plot border. |
| `setTxtXAxisTitleStyle()`, `setTxtYAxisTitleStyle()` | Axis titles. |
| `setTxtXAxisNumbersStyle()`, `setTxtYAxisNumbersStyle()` | Axis tick labels. |
| `setXAxisLineStyle()`, `setYAxisLineStyle()` | Axis lines and ticks. |
| `setXGridLineStyle()`, `setYGridLineStyle()` | Grid lines. |
| `setTxtChartLabelsStyle()` | Trace labels. |

These methods change the existing display. Their return value is `undefined`; keep the `chart` object if you want to make more changes later.

## Input table shape

A table has a header row followed by data rows. The first column is the x value, usually frequency in hertz. Each remaining column has a name in the header row.

```js
var response = [
    ['Freq', 's11dB', 's21dB'],
    [1e9, -12.4, -1.2],
    [2e9, -9.7, -1.8]
];
```

Pass one table directly as `inputTable: response`, or pass an array of tables as `inputTable: [response]`. The array form is useful when comparing separate results. Chart data rows must contain finite numbers; table data rows may also contain text. All rows must have the same number of columns as their header.

## Smith charts

To see a sample Smith chart before making a circuit, call `nP.smithChart()` with no arguments. The expanded call shows every option and its default value, with four rows from the built-in sample table. Use either call to draw one chart:

```js
nP.smithChart(); // default chart

nP.smithChart({
    inputTable: [[
        ['Freq', 's11Re', 's11Im'],
        [100000000, -0.5, 0.2],
        [300000000, -0.1, 0.45],
        [400000000, 0.15, 0.35],
        [600000000, 0.45, -0.15]
    ]],
    mount: 'body',
    containerId: undefined,
    svgId: undefined,
    title: undefined,
    metricPrefix: 'giga',
    fontFamily: 'sans-serif',
    fontSize: 14,
    containerFontSizePx: undefined,
    backgroundColor: undefined,
    pngBackground: 'transparent', // legacy alias
    chartTitle: undefined, // legacy alias
    showPoints: true,
    showLabels: true,
    showGrid: true,
    gridColor: '#e0e0e0',
    traceColor: true,
    traceWidth: 2,
    pointRadius: 3,
    labelFontSize: undefined,
    labelColor: undefined,
    width: 600,
    height: 600,
    margin: { top: 40, right: 40, bottom: 40, left: 40 },
    unitCircleColor: 'black',
    unitCircleWidth: 1.5
});
```

The sample table is independent of `nP.global.fList`. Properties shown as `undefined` are optional and normally omitted. Pass your own `inputTable` when you have circuit results.

`smithChart()` plots complex reflection coefficients. Give each trace adjacent real and imaginary columns with matching names ending in `Re` and `Im`, such as `s11Re` followed by `s11Im`. The first column is frequency.

```js
nP.global.fList = nP.global.fGen(1e9, 3e9, 21);

var l1 = nP.L(5e-9);
var reflection = l1.out('s11Re', 's11Im');

nP.smithChart({
    inputTable: [reflection],
    title: 'Inductor input reflection',
    metricPrefix: 'giga'
});
```

For multiple traces, add more adjacent pairs, for example `out('s11Re', 's11Im', 's22Re', 's22Im')`. The chart uses the column names to identify traces.

### Returned API

`nP.smithChart()` returns an object containing DOM elements and methods for styling the chart it just added to the page.

```js
var smith = nP.smithChart({ title: 'Input reflection' });
smith.setUnitCircleStyle({ stroke: 'navy', strokeWidth: 2 });
smith.setSmithGridStyle('stroke:#bbb');

// smith.container.remove(); // remove the chart when finished
```

| Property | Element |
| --- | --- |
| `container` | Outer HTML `div` containing the chart and its copy button. |
| `svg` | Smith-chart SVG element. |
| `background`, `chartBackground` | The same SVG background rectangle. |
| `title`, `txtChartTitle` | The same chart-title text element. |
| `unitCircle` | Unit-circle outline. |
| `smithGridGroup` | SVG group containing resistance and reactance grid lines. |
| `traceGroup` | SVG group containing plotted traces. |
| `labelGroup` | SVG group containing trace labels. |
| `txtChartLabels` | Array of trace-label text elements; empty when labels are hidden. |

| Method | What it styles |
| --- | --- |
| `setBackgroundStyle()`, `setChartBackgroundStyle()` | Chart background; these are aliases. |
| `setTitleStyle()`, `setTxtChartTitleStyle()` | Chart title; these are aliases. |
| `setUnitCircleStyle()` | Unit-circle outline. |
| `setSmithGridStyle()` | Resistance and reactance grid lines. |
| `setTxtChartLabelsStyle()` | Trace labels. |

Each style method accepts a CSS declaration string or an object of CSS properties, as in the examples above. It changes the existing chart and returns `undefined`.

## Line tables

To see a sample data table before making a circuit, call `nP.lineTable()` with no arguments. The expanded call shows every option and its default value, with four rows from the built-in sample table. Use either call to draw one table:

```js
nP.lineTable(); // default table

nP.lineTable({
    inputTable: [[
        ['Freq', 's21dB', 's23dB'],
        [0, -3.52182, -3.52182],
        [3000000000, -3.27504, -11.01964],
        [6000000000, -3.01031, -53.90094],
        [12000000000, -3.52176, -3.52571]
    ]],
    mount: 'body',
    containerId: undefined,
    svgId: undefined,
    title: undefined,
    metricPrefix: 'giga',
    fontFamily: 'sans-serif',
    fontSize: 14,
    containerFontSizePx: undefined,
    backgroundColor: undefined,
    pngBackground: 'transparent', // legacy alias
    tableTitle: undefined, // legacy alias
    headColor: 'color',
    headerColor: undefined,
    headerFill: undefined,
    cellFill: 'transparent',
    cellBorderColor: 'black',
    cellBorderWidth: 1,
    tableBorderColor: 'none',
    tableBorderWidth: 1,
    showWHAlert: false,
    columnWidth: 100,
    rowHeight: 20,
    margin: { top: 72, right: 20, bottom: 20, left: 20 }
});
```

The sample table is independent of `nP.global.fList`. Properties shown as `undefined` are optional and normally omitted. Pass your own `inputTable` when you have circuit results.

`lineTable()` displays the same table shape as text and numbers. It can show S-parameters, [noise](./noise.md), [intermodulation](./intermodulation.md), or any other values placed in a table.

```js
nP.global.fList = nP.global.fGen(1e9, 3e9, 5);

var r1 = nP.R(25);
var response = r1.out('s11dB', 's21dB');

nP.lineTable({
    inputTable: [response],
    title: 'Resistor response',
    metricPrefix: 'giga'
});
```

The table scales its first numeric column for display without changing the supplied `response` array. Its options include `columnWidth`, `rowHeight`, header color, cell fill, and border styling.

### Returned API

`nP.lineTable()` returns an object containing DOM elements and methods for styling the table it just added to the page.

```js
var table = nP.lineTable({ title: 'Sample data' });
table.setTxtTableHeadersStyle({ fill: 'navy', fontWeight: 'bold' });
table.setTableBorderStyle('stroke:#666;stroke-width:2');

// table.container.remove(); // remove the table when finished
```

| Property | Element |
| --- | --- |
| `container` | Outer HTML `div` containing the table and its copy buttons. |
| `svg` | Table SVG element. |
| `background`, `tableBackground` | The same SVG background rectangle. |
| `title`, `txtTableTitle` | The same table-title text element. |
| `tableBorder` | Border around the table. |
| `txtHeaders` | Array of header-cell text elements. |
| `txtData` | Array of data-cell text elements. |

| Method | What it styles |
| --- | --- |
| `setBackgroundStyle()`, `setTableBackgroundStyle()` | Table background; these are aliases. |
| `setTitleStyle()`, `setTxtTableTitleStyle()` | Table title; these are aliases. |
| `setTableBorderStyle()` | Table border. |
| `setTxtTableHeadersStyle()` | Header-cell text. |
| `setTxtTableDataStyle()` | Data-cell text. |

Each style method accepts a CSS declaration string or an object of CSS properties, as in the examples above. It changes the existing table and returns `undefined`.

## Shared display options

| Option | Meaning |
| --- | --- |
| `inputTable` | One table or an array of tables to display. |
| `mount` | CSS selector or DOM element that receives the display; defaults to `'body'`. |
| `title` | Text above the chart or table. |
| `metricPrefix` | Scale applied to the first numeric column for display; defaults to `'giga'`. |
| `width`, `height` | Requested chart size; charts fit narrower mounts when needed. |
| `fontFamily`, `fontSize` | Display typography. |
| `backgroundColor` | Background color used when copying a PNG; `'transparent'` is the default. |
| `containerId`, `svgId` | Optional IDs for the generated container and SVG. |

`width` and `height` are chart options; `lineTable()` sizes itself from its rows and columns. Legacy option names such as `chartTitle`, `tableTitle`, and `pngBackground` remain supported. The returned-API sections above list the available styling methods.

## Copy PNG and CSV

Each chart and table has a **Copy as png** button. Click it, then paste the image into an application that accepts PNG clipboard data. `lineTable()` also has **Copy as csv** for pasting its displayed values into a spreadsheet or text editor. The CSV uses the selected `metricPrefix` for the first column and formats numeric values to five decimal places.

PNG copy needs browser image clipboard support; clipboard access also depends on the browser and page context. The [REPL instructions](./using-the-repl.md) cover using these controls with runnable examples.

## Schematics

`nP.schematic(circuit)` draws the supported nPort circuit from its construction metadata. Labels show three significant digits by default. Set `significantDigits` from 1 to 15 when a drawing needs more or less detail:

```js
nP.global.fList = [2e9];

var l1 = nP.L(45.65360855435164e-9);
nP.schematic(l1, {significantDigits: 4});
```

This option changes only the printed labels. The circuit calculation and numeric values in the returned `graph` and `topology` keep their original precision. The drawing opens at its natural scale with horizontal and vertical scrolling; **Fit drawing** shows the whole circuit, and **Actual size** restores the natural scale.

For a transmitter, RF circuit, and receiver, pass the three objects together so the drawing includes the signal blocks:

```js
var g = nP.global;
g.tList = g.tGen(0, 1e-3, 2);
g.fList = [];

var tx = nP.mod({mode: 'AM', carrierHz: 200e6, toneHz: 300});
var attenuator = nP.Attn(3);
var circuit = nP.cascade(attenuator, {signal: tx});
var rx = nP.demod(circuit, {noise: false});

nP.schematic({transmitter: tx, circuit: circuit, receiver: rx});
```

The MOD and DEMOD connectors in this drawing describe signal flow; they are not RF S-parameter ports. Omit `receiver` when the displayed path ends at the circuit.

## Quick output with `nP.log()`

`nP.log(value)` adds a readable result to the page. Use it when you want to inspect a value while building a circuit, without setting up a chart or table. It takes **one value per call**.

### Values it can display

```js
nP.log('Hello, nPort!');       // text
nP.log(1.234567);              // a number: displayed as 1.235
nP.log(true);                  // a boolean: displayed as true
nP.log(nP.complex(5, -7));     // one complex number
```

Numbers are displayed to **four significant digits**. A complex number shows its real and imaginary parts, also to four significant digits. Strings are displayed as literal text, so characters such as `<` and `>` do not become HTML markup.

`nP.log()` also accepts these collections:

- A one-dimensional array of strings, numbers, or `nP.complex()` values becomes a **one-column HTML table**.
- A two-dimensional array becomes an **HTML table**. This includes the header and numeric rows returned by an nPort's `.out()` method. Its cells may contain strings, numbers, or complex values.
- An `nP.matrix()` object becomes an HTML table of real numbers or complex values. Use a matrix with one consistent entry type.
- A nonempty plain JavaScript object becomes indented JSON text, useful for inspecting `nP.schematic()` graph and topology results.

```js
nP.log([1e9, 2e9, 3e9]); // one-column table

nP.global.fList = [1e9, 2e9];
var r1 = nP.R(50);
var response = r1.out('s11dB', 's21dB');
nP.log(response); // header row plus two result rows

var m1 = nP.matrix([
    [1, 2],
    [3, 4]
]);
nP.log(m1); // two-by-two table
```

`nP.log()` displays plain objects as text rather than an interactive inspector. An unsupported value, empty matrix, or malformed table displays `nP.log can't read this input` instead of throwing an error. To display circuit results, first call `.out()`, as in the example above.

### Where the output goes

`nP.log(value)` appends a new output block. On the REPL page, it appears in **Output**. On another page, it goes into the first element with class `outputBox` if one exists; otherwise it is appended to the document body. To choose a destination, pass an optional CSS selector or DOM element as `mount`:

```js
nP.log('Hello, nPort!'); // default destination
nP.log('Hello, nPort!', { mount: '#results' });
```

If the specified destination does not exist, `nP.log()` throws a `TypeError`. It does not write to the browser developer console. Use `console.log()` when you want to inspect a value there.

### What `nP.log()` returns

`nP.log()` returns the `<pre>` element it adds to the page. You can style or remove that entry later:

```js
var entry = nP.log('Hello, nPort!');
entry.style.color = 'navy';
// entry.remove();
```

It does not return formatted text or a data table. Keep the original value if you need it later:

```js
var response = r1.out('s11dB', 's21dB');
nP.log(response); // display it
nP.lineTable({inputTable: [response]}); // reuse the original table
```

Use `nP.lineTable()` when you want a styled table with PNG and CSV copy controls.
