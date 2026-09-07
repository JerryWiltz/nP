---
layout: home

hero:
  name: nP.js
  text: Microwave Circuit Analysis Using JavaScript
  tagline: Construct RF networks, analyze S-parameters, and visualize the results.
  image:
    src: /nPortLogo.svg
    alt: nP logo
    width: 480
    height: 480
  actions:
    - theme: brand
      text: Get started
      link: /legacy-api-reference
    - theme: alt
      text: View on GitHub
      link: https://github.com/JerryWiltz/nP

features:
  - icon: 🧰
    title: Microwave engineering
    details: Build reusable n-port components for RF and microwave analysis.
    link: /legacy-api-reference#np-nport
    linkText: Explore n-port analysis
  - icon: 🔬
    title: S-parameters
    details: Set frequencies, create circuits, and extract meaningful network data.
    link: /legacy-api-reference#np-nport
    linkText: Learn the workflow
  - icon: ⚙️
    title: Transmission lines
    details: Work with ideal, coupled, and physical microstrip transmission lines.
    link: /legacy-api-reference#np-transmission-lines
    linkText: See transmission lines
  - icon: 🔗
    title: Network assembly
    details: Connect components with nodal interconnection or two-port cascade analysis.
    link: /legacy-api-reference#np-connections
    linkText: Connect components
  - icon: ➕
    title: Math included
    details: Use complex-number and real or complex matrix operations directly from nP.
    link: /legacy-api-reference#np-math
    linkText: Browse math functions
  - icon: 📶
    title: Visualize results
    details: Render line charts, SVG tables, and Smith charts from nP output tables.
    link: /legacy-api-reference#np-chart
    linkText: View chart APIs
---

<!-- Modified: 2026-09-07 -->

## Start here

Install the package in a Node.js or browser project:

```sh
npm install @jerrywiltz/np
```

Import the named API in Node.js or an ESM browser application:

```js
import * as nP from '@jerrywiltz/np';
```

The browser bundle is also available as `dist/nP.js` and exposes the global `nP` object. The [project README](https://github.com/JerryWiltz/nP#readme) contains a compact API overview and a complete circuit example.

## Basic workflow

1. Set `nP.global.fList`.
2. Create components as n-port objects.
3. Connect them with `nP.nodal()` or `nP.cascade()`.
4. Extract data with `.out(...)`.
5. Display the result with `nP.lineChart()`, `nP.lineTable()`, or `nP.smithChart()`.

The [API reference](./legacy-api-reference.md) preserves the detailed constructor and function reference. Physical-model design notes and equation provenance are maintained in the repository's [`developmentDocs/`](https://github.com/JerryWiltz/nP/tree/master/developmentDocs) directory.
