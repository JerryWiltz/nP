<!-- Modified: 2026-10-06 -->
# Chart and table functions

`nP.lineChart()`, `nP.lineTable()`, and `nP.smithChart()` display data in a browser. They take one options object, append a container `<div>` to `mount` (the document body by default), and draw an SVG inside it. They return display objects, not nPorts. The examples below use tables returned by an nPort's `.out()` method.

## Input tables

All three functions accept either one table directly or an array of tables. Each table has a header row followed by data rows:

```js
var gain = chain.out('s21dB', 'NF21dB');
// gain = [
//     ['Freq', 's21dB', 'NF21dB'],
//     [1e9, 17, 4.1],
//     ...
// ];

nP.lineChart({ inputTable: gain });   // simplest form: one table
nP.lineTable({ inputTable: gain });
nP.lineChart({ inputTable: [gain] }); // also accepts an array of tables
```

The first column holds frequency in Hz for RF results. `metricPrefix: 'giga'` displays it in GHz. For a general x-y chart, use `metricPrefix: 'none'`. `lineChart()` needs finite numeric x and y values and unique trace headers within each table. It plots each column after the first as a separate trace. `lineTable()` accepts finite numbers and text cells. `smithChart()` needs finite numeric frequency, real, and imaginary values in adjacent columns for each trace:

```js
var reflections = chain.out('s11Re', 's11Im', 's22Re', 's22Im');
nP.smithChart({ inputTable: reflections });
```

## `lineChart()`

```js
// lineChart: line chart
var chart = nP.lineChart({
    inputTable: gain,          // one numeric x-y table or an array of tables
    mount: 'body',             // CSS selector or DOM element
    containerId: undefined,   // optional ID of the created container
    svgId: undefined,         // optional ID of the created SVG
    title: undefined,         // optional chart title; blank when omitted
    metricPrefix: 'giga',     // divides x values by 1e9
    fontFamily: 'sans-serif',
    fontSize: 14,
    containerFontSizePx: undefined, // optional override of fontSize
    backgroundColor: undefined,     // defaults to transparent
    pngBackground: 'transparent',   // older backgroundColor alias

    chartTitle: undefined,   // older title alias
    xAxisTitle: 'Frequency',  // x-axis title
    yAxisTitle: 'dB',         // y-axis title
    xScale: 'linear',         // 'linear' or 'log'
    yScale: 'linear',         // 'linear' or 'log'
    xAxisPosition: 'bottom',  // 'bottom', 'top', or 'origin'
    yAxisPosition: 'left',    // 'left', 'right', or 'origin'
    showPoints: true,
    showLabels: true,
    showGrid: true,
    gridColor: '#e0e0e0',
    traceColor: true,         // false selects a gray palette
    traceWidth: 2,
    pointRadius: 3,
    labelFontSize: undefined, // trace labels use the effective font size unless set
    labelColor: undefined,    // optional trace-label color
    width: 700,               // requested SVG width, px
    height: 450,              // requested SVG height, px
    margin: { top: 35, right: 80, bottom: 55, left: 75 },
    plotBorderColor: 'black', // border around the plotted x-y area
    plotBorderWidth: 1,       // plotted-area border width, px
    xRange: undefined,       // optional [minimum, maximum], in original x units
    yRange: undefined        // optional [minimum, maximum], in plotted y units
});
// returns an object with the container, SVG, chart elements, and style setters
```

The chart derives its range from the data when `xRange` or `yRange` is omitted. Log scales require a positive range. To start a dB plot at zero, set `yRange: [0, upperLimit]`. An `xRange` in Hz is divided by `metricPrefix` along with the data. Hovering over a point shows `Trace`, the x-axis value, and `Value` with the y-axis title. When the x-axis title is `Frequency` or `Freq`, the tooltip shows the frequency unit selected by `metricPrefix`, such as `Frequency: 3.00 GHz`. Endpoint trace labels are spaced vertically when their y positions are too close, even if their x positions differ. `plotBorderColor` and `plotBorderWidth` outline only the plotted x-y area, inside the SVG margins.

## `lineTable()`

```js
// lineTable: line table
var table = nP.lineTable({
    inputTable: gain,         // one table or an array of tables
    mount: 'body',            // CSS selector or DOM element
    containerId: undefined,  // optional ID of the created container
    svgId: undefined,        // optional ID of the created SVG
    title: undefined,        // optional table title; blank when omitted
    metricPrefix: 'giga',    // divides first numeric column by 1e9
    fontFamily: 'sans-serif',
    fontSize: 14,
    containerFontSizePx: undefined, // optional override of fontSize
    backgroundColor: undefined,     // defaults to transparent
    pngBackground: 'transparent',   // older backgroundColor alias

    tableTitle: undefined,   // older title alias
    headColor: 'color',      // older headerColor alias
    headerColor: undefined,  // optional 'color' or 'gray'; default is 'color'
    headerFill: undefined,   // optional header fill; otherwise light blue or gray
    cellFill: 'transparent',  // data cells; headerFill controls header cells
    cellBorderColor: 'black', // borders around individual table cells
    cellBorderWidth: 1,      // individual cell border width, px
    tableBorderColor: 'none', // border around the entire SVG table
    tableBorderWidth: 1,     // entire-table border width, px
    showWHAlert: false,      // show calculated width and height in an alert
    columnWidth: 100,       // px
    rowHeight: 20,          // px
    margin: { top: 72, right: 20, bottom: 20, left: 20 }
});
// returns an object with the container, SVG, table elements, and style setters
```

Multiple tables in `inputTable` appear stacked in one SVG. The function copies rows before scaling the first column, leaving the caller's table unchanged. The rendered table includes controls to copy it as PNG or CSV. The CSV control sits below the PNG control, with the title beside the PNG control. `tableBorderColor` outlines the whole SVG; `cellBorderColor` outlines each cell. The default header cells remain light blue, while data cells and unused SVG space are transparent.

## `smithChart()`

```js
// smithChart: Smith chart
var smith = nP.smithChart({
    inputTable: reflections,  // one Re/Im-paired table or an array of tables
    mount: 'body',             // CSS selector or DOM element
    containerId: undefined,   // optional ID of the created container
    svgId: undefined,         // optional ID of the created SVG
    title: undefined,         // optional chart title; blank when omitted
    metricPrefix: 'giga',     // scales frequency shown in hover values
    fontFamily: 'sans-serif',
    fontSize: 14,
    containerFontSizePx: undefined, // optional override of fontSize
    backgroundColor: undefined,     // defaults to transparent
    pngBackground: 'transparent',   // older backgroundColor alias

    chartTitle: undefined,    // older title alias
    showPoints: true,
    showLabels: true,
    showGrid: true,
    gridColor: '#e0e0e0',
    traceColor: true,         // false selects a gray palette
    traceWidth: 2,
    pointRadius: 3,
    labelFontSize: undefined, // trace labels use the effective font size unless set
    labelColor: undefined,    // optional trace-label color
    width: 600,               // requested SVG width, px
    height: 600,              // requested SVG height, px
    margin: { top: 40, right: 40, bottom: 40, left: 40 },
    unitCircleColor: 'black', // boundary of the Smith-chart unit circle
    unitCircleWidth: 1.5     // unit-circle boundary width, px
});
// returns an object with the container, SVG, Smith-chart elements, and style setters
```

The Re/Im columns must alternate in that order after the frequency column, with matching names such as `s11Re` and `s11Im`. These produce a trace labeled `s11`. The plot area remains square within the requested SVG size. `unitCircleColor` and `unitCircleWidth` style the circular boundary, not an outer SVG rectangle. Hovering over a point shows `Trace`, `Frequency` with the selected unit, `Re`, `Im`, `Magnitude`, and `Angle` in degrees. Both chart tooltips use three significant digits. The rendered chart includes a PNG copy control.

## Shared details

All three SVGs default to a transparent background and scale down to fit a narrow mount while retaining their aspect ratio. Their natural sizes still differ: 700 × 450 for `lineChart()`, 600 × 600 for `smithChart()`, and a size calculated from rows and columns for `lineTable()`. Set `backgroundColor: 'white'` when a white chart or copied PNG is wanted. Text in all three defaults to 14 px `sans-serif`, including titles and copy controls. `fontFamily` and `fontSize` set these consistently; `labelFontSize` can override only line-chart or Smith-chart trace labels. All three functions accept `pngBackground` as an older alias for `backgroundColor` and `containerFontSizePx` as an override of `fontSize`. `lineChart()` and `smithChart()` accept `chartTitle` as an older alias for `title`; `lineTable()` accepts `tableTitle`. `lineTable()` also accepts `headColor` as an older alias for `headerColor`. When both names are supplied, the newer `title`, `backgroundColor`, and `headerColor` take precedence over their aliases.

The functions check the table shape before drawing and report the table and row with invalid data. `lineChart()` and `smithChart()` need at least one data row; `lineTable()` also accepts a header-only table. The built-in sample tables make a bare call such as `nP.lineChart()` render a demonstration. For actual analysis, supply `inputTable` explicitly.

### Optional outer border

Each function creates a `<div>` around its SVG and copy controls. The returned `.container` is that DOM element, so you can add a border to one display:

```js
var chart = nP.lineChart({ inputTable: gain });
chart.container.style.border = '1px solid #ddd';
chart.container.style.borderRadius = '6px';
```

To border all three kinds of display with page CSS, use their container classes:

```css
.containerClass,
.line-table-container,
.smith-chart-container {
    border: 1px solid #ddd;
    border-radius: 6px;
}
```

The outer border is optional and surrounds the copy controls as well as the SVG. It does not appear in a copied PNG, which contains only the SVG. It is separate from the line chart's plot border, the table's cell and SVG borders, and the Smith chart's unit circle.

## Returned display API

Each function returns an object with the same four members first: `.container` and `.svg` are DOM nodes, `.background` is the full-SVG background rectangle node, and `.title` is the SVG title-text node, **not the title string**. Each then provides `setBackgroundStyle(style)` and `setTitleStyle(style)`. These setters accept either an object such as `{fill: 'navy'}` or a CSS string such as `'fill: navy'`; they change the SVG element and return `undefined`.

```js
var chart = nP.lineChart({ inputTable: gain, title: 'Gain' });
var table = nP.lineTable({ inputTable: gain, title: 'Gain values' });
var smith = nP.smithChart({ inputTable: reflections, title: 'Reflection' });

chart.setTitleStyle({ fill: 'navy' });
table.setTitleStyle({ fill: 'navy' });
smith.setTitleStyle({ fill: 'navy' });
```

Existing return members remain available and refer to the same nodes or functions as the shared aliases:

| Shared member | `lineChart()` and `smithChart()` existing name | `lineTable()` existing name |
| --- | --- | --- |
| `.background` | `.chartBackground` | `.tableBackground` |
| `.title` | `.txtChartTitle` | `.txtTableTitle` |
| `setBackgroundStyle()` | `setChartBackgroundStyle()` | `setTableBackgroundStyle()` |
| `setTitleStyle()` | `setTxtChartTitleStyle()` | `setTxtTableTitleStyle()` |

After the four shared nodes, each return object lists its display-specific nodes. After the two shared setters, it lists its existing specialized setters. `txtChartLabels`, `txtHeaders`, and `txtData` are arrays of DOM nodes; the title and background members are single nodes. The source files list every specialized member: [`lineChart.js`](../src/np-chart/src/lineChart.js), [`lineTable.js`](../src/np-chart/src/lineTable.js), and [`smithChart.js`](../src/np-chart/src/smithChart.js).
