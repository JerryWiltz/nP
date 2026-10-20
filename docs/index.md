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
      link: /hello-nport
    - theme: alt
      text: View on GitHub
      link: https://github.com/JerryWiltz/nP

features:
  - icon: 🧰
    title: Microwave engineering
    details: Build reusable n-port components for RF and microwave analysis.
    link: /nport-object
    linkText: Explore n-port analysis
  - icon: 🔬
    title: S-parameters
    details: Set frequencies, create circuits, and extract meaningful network data.
    link: /nport-object
    linkText: Learn the workflow
  - icon: ⚙️
    title: Transmission lines
    details: Work with ideal, coupled, and physical microstrip transmission lines.
    link: /ideal-components#a-lossless-line
    linkText: See transmission lines
  - icon: 🔗
    title: Network assembly
    details: Connect components with nodal interconnection or two-port cascade analysis.
    link: /connecting-nports
    linkText: Connect components
  - icon: 📡
    title: Noise
    details: Analyze noise figure and output noise density in connected RF chains.
    link: /noise
    linkText: Analyze noise
  - icon: 📶
    title: Intermodulation
    details: Analyze two-tone IP2, IP3, and harmonic products in connected RF chains.
    link: /intermodulation
    linkText: Analyze intermodulation
  - icon: ➕
    title: Math included
    details: Use complex-number and real or complex matrix operations directly from nP.
    link: /math
    linkText: Browse math functions
  - icon: 📶
    title: Visualize results
    details: Render line charts, SVG tables, and Smith charts from nP output tables.
    link: /charts-tables-and-logs
    linkText: View chart APIs
---

<!-- Modified: 2026-10-19 -->

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

Start with the [Introduction](./introduction.md), then follow the [Tutorial](./tutorial.md) for RF and digital signal examples. The [RF Constructors](./rf-constructors.md) page introduces the component families; [Circuit examples](./circuit-examples.md) shows complete RF networks. Physical-model design notes and equation provenance are maintained in the repository's [`developmentDocs/`](https://github.com/JerryWiltz/nP/tree/master/developmentDocs) directory.

For noise figure and output noise density, see [Noise](./noise.md). For IP2, IP3, and harmonics, see [Intermodulation](./intermodulation.md).
