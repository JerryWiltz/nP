<!-- Modified: 2026-09-06 -->
# The Path of `lineChart`

This note documents how `nP.lineChart()` travels from its source in the nP repository into the nPort RF Analysis Obsidian plugin. It also explains the two different paths a chart request can take inside Obsidian: a verbatim JavaScript `npjs` block or a declarative JSON `np` block.

## The source of truth in nP

The implementation of `lineChart()` is:

```text
nP/src/np-chart/src/lineChart.js
```

That file exports the function:

```js
export function lineChart(options = {}) {
    // chart implementation
}
```

The default value `options = {}` is why `nP.lineChart()` and `nP.lineChart({})` have the same default behavior in nP itself.

The function is re-exported twice:

```text
src/np-chart/src/lineChart.js
        ↓
src/np-chart/index.js
        ↓
src/index.js
```

`src/index.js` is the public entry point for the complete nP library. Rollup starts there and produces three public distributions:

```text
src/index.js
    └── npm run build
          ├── dist/nP.js       UMD browser bundle; global name: nP
          ├── dist/nP.esm.js   ES module bundle
          └── dist/nP.cjs      CommonJS bundle
```

The separately invoked `npm run build:plugin` command starts at `src/plugin.js` and produces `dist/nP.plugin.esm.js`. This host-safe entry point excludes legacy browser-development helpers and is not included in the public npm package.

The `line-chart` section of `dev/visualizationDevelopment.html` is a development and verification harness, not the implementation of `lineChart()`. It loads `../dist/nP.js`, obtains the browser global `nP`, and calls `nP.lineChart(...)` to exercise the built library.

## Crossing from nP into the Obsidian plugin

The plugin does not import files directly from the sibling nP repository at runtime. It contains a pinned copy of the host-safe plugin distribution:

```text
nP/dist/nP.plugin.esm.js
        ↓ copy when intentionally updating nP in the plugin
np-rf-analysis/vendor/nP.esm.js
```

The current process is a deliberate copy/update step; it is not an automatic link between the repositories. Therefore, rebuilding nP alone does not update an already built or installed plugin.

The plugin's `npm run build` command runs esbuild. Esbuild combines the plugin TypeScript and the vendored nP module into `np-rf-analysis/main.js`. It also builds the `npjs` worker as an embedded JavaScript string inside that same file. The installed plugin does not download nP or executable code at runtime.

The complete update path is:

```text
Edit nP source
    ↓
Build the host-safe bundle with npm run build:plugin
    ↓
In a separate np-rf-analysis session, copy dist/nP.plugin.esm.js
to np-rf-analysis/vendor/nP.esm.js
    ↓
Build the plugin with npm run build
    ↓
Copy main.js, manifest.json, and styles.css to the vault's plugin folder
    ↓
Reload or restart the plugin in Obsidian
```

For the test vault, the installed files are under:

```text
np-rf-analysis-test-vault/.obsidian/plugins/np-rf-analysis/
```

## How Obsidian selects a path

When the plugin loads, `src/main.ts` registers two Markdown code-block processors:

```ts
registerMarkdownCodeBlockProcessor('np', ...);
registerMarkdownCodeBlockProcessor('npjs', ...);
```

The word immediately after the opening Markdown fence selects the processor:

````markdown
```npjs
// verbatim JavaScript path
```

```np
{
  "view": { "type": "line" }
}
```
````

Neither `npjs` nor `np` is a filename extension. They are Markdown fenced-code language identifiers recognized by the enabled plugin.

## Path 1: `npjs` verbatim JavaScript

An `npjs` block accepts normal nP JavaScript, including the code copied from an nP development page.

```js
var output = network.out('s11dB', 's21dB');

nP.lineChart({
    inputTable: [output],
    title: 'Network response',
    mount: '#chartDiv',
    backgroundColor: 'white'
});
```

The runtime path is:

```text
npjs fenced source in an Obsidian note
        ↓
src/main.ts creates NpJsRenderChild
        ↓
Reading view shows Run, Stop, Reset, status, and the JavaScript source
        ↓ Run
A sandboxed iframe creates a disposable Web Worker
        ↓
The worker executes the source with the vendored nP API
        ↓
nP calculations run inside the worker
        ↓
nP.lineChart(...) calls the worker's lineChart proxy
        ↓
The proxy sends validated data to the plugin renderer
        ↓
NpJsRenderChild calls the real vendored nP.lineChart(...)
        ↓
lineChart uses D3 and the Obsidian DOM to create the SVG
```

This route has two `lineChart` roles:

1. Inside the worker, `nP.lineChart()` is replaced with a proxy. The proxy accepts the chart options but cannot draw because a Web Worker has no DOM.
2. Back in Obsidian's renderer, `NpJsRenderChild` receives the validated render message and calls the real `lineChart()` with a real HTML mount element.

All ordinary RF work—frequency generation, constructors, `nP.nodal()`, `.out()`, complex arithmetic, and other calculations—uses the actual vendored nP implementation inside the worker. Only the DOM-dependent display functions `lineChart`, `lineTable`, and `smithChart` are replaced by worker proxies.

The `mount` selector is converted into a block-local mount key. A script can retain `mount: '#chartDiv'` without requiring a separate HTML `<div id="chartDiv">` in the note. The plugin creates the actual result container.

The worker cannot access the real Obsidian DOM, vault, Electron, Node.js, network, or browser storage. Messages crossing out of the worker are checked by `src/npjs-protocol.ts`. Successful render, styling, text, and console messages can be saved as a result snapshot and recreated later without rerunning the JavaScript.

Relevant plugin files are:

```text
src/main.ts                 registers the npjs processor
src/npjs-render-child.ts    controls the block and renders results
src/npjs-runner-document.ts creates the sandboxed iframe document
src/npjs-worker.ts          executes nP calculations and proxies charts
src/npjs-protocol.ts        validates messages crossing the boundary
src/npjs-snapshot.ts        stores validated successful results
vendor/nP.esm.js            pinned nP implementation
```

## Path 2: `np` declarative JSON

An `np` block contains data describing an analysis. It does not contain or execute JavaScript.

```json
{
  "frequencies": {
    "start": 100000000,
    "stop": 1000000000,
    "points": 51
  },
  "components": {
    "r1": { "type": "R", "value": 25 }
  },
  "nodal": [
    ["r1", 1, 2],
    ["out", 1, 2]
  ],
  "output": ["s11dB", "s21dB"],
  "view": {
    "type": "line",
    "title": "Series resistance"
  }
}
```

The runtime path is shorter:

```text
np fenced JSON in an Obsidian note
        ↓
src/main.ts creates NpRenderChild
        ↓
src/schema.ts parses and validates the JSON
        ↓
src/analysis.ts maps approved names to vendored nP constructors
        ↓
nP computes the circuit and .out(...) table
        ↓
src/render-child.ts calls the real vendored nP.lineChart(...)
        ↓
lineChart uses D3 and the Obsidian DOM to create the SVG
```

The `np` route runs automatically when Obsidian renders the code block. It needs no Run button because the block is validated data, not executable code. It uses a deliberately limited list of constructors and view options defined by the plugin's schema. This makes it predictable and safe, but it cannot express every operation available through the full nP JavaScript API.

Relevant plugin files are:

```text
src/main.ts          registers the np processor
src/schema.ts        defines and validates the accepted JSON
src/analysis.ts      turns the JSON description into nP calls
src/render-child.ts  selects and mounts the requested renderer
vendor/nP.esm.js     pinned nP implementation
```

## The essential difference

| Question | `npjs` | `np` |
| --- | --- | --- |
| Note content | Verbatim JavaScript | Declarative JSON |
| Starts | Only when Run is selected | Automatically when rendered |
| nP API | Full calculation API | Plugin-approved subset |
| Calculation location | Disposable Web Worker | Plugin renderer process |
| `lineChart()` in the calculation step | Worker proxy | Real function |
| Final SVG renderer | Real vendored `lineChart()` in Obsidian | Real vendored `lineChart()` in Obsidian |
| Controls | Run, Stop, Reset, and status | None |
| Saved result snapshot | Yes | Not needed for normal synchronous rendering |

Both paths end at the same `lineChart()` implementation descended from `nP/src/np-chart/src/lineChart.js`. They differ in how the note is interpreted, where the RF calculation runs, and how the chart request reaches the Obsidian DOM.
