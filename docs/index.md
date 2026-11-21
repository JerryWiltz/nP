---
# Modified: 2026-11-21
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
      link: /agentic-nport
    - theme: alt
      text: What's new in 0.49.0
      link: /whats-new-0-49-0
    - theme: alt
      text: View on GitHub
      link: https://github.com/JerryWiltz/nP

features:
  - icon: 🤖
    title: Agentic nPort
    details: Describe your circuit or supply a schematic; your agent writes readable nP code.
    link: /agentic-nport
    linkText: Use Agentic nPort
  - icon: 🔬
    title: RF network analysis
    details: Build connected networks and calculate S-parameters and stability.
    link: /connecting-nports
    linkText: Analyze RF networks
  - icon: 📶
    title: Time-domain signals
    details: Generate waveforms, use FFTs, explore modulation and VNA impulse responses.
    link: /digital-signals
    linkText: Explore time-domain signals
  - icon: ⚡
    title: DC bias analysis
    details: Determine operating points from external bias networks before RF analysis.
    link: /dc-bias-analysis
    linkText: Explore DC bias
  - icon: ✏️
    title: Schematics and results
    details: Draw circuits and display charts, Smith charts and tables.
    link: /schematics
    linkText: Draw and display results
  - icon: 📡
    title: Noise and distortion
    details: Calculate noise figure, intermodulation and harmonics.
    link: /noise
    linkText: Analyze noise and distortion
---

<!-- Modified: 2026-11-18 -->

## Agentic nPort

**Describe your circuit. Let your agent write the nP code.** Give Codex, Claude or another coding assistant a typed request, existing code, or a scanned or hand-drawn schematic. It supplies the nP syntax and writes explicit, readable code with named components and connections.

Follow the [Agentic nPort guide](./agentic-nport.md) for environment setup, or choose the instructions below and save them as `AGENTS.md` in your working folder:

- [HTML agent](https://raw.githubusercontent.com/JerryWiltz/nP/master/nP-agents/html/AGENTS.md): complete, minimal pages using an adjacent `nP.js`.
- [Obsidian agent](https://raw.githubusercontent.com/JerryWiltz/nP/master/nP-agents/obsidian/AGENTS.md): Markdown notes with `npjs` blocks for nPort RF Analysis.
- [Node.js agent](https://raw.githubusercontent.com/JerryWiltz/nP/master/nP-agents/nodejs/AGENTS.md): scripts using an installed nP package or a supplied module such as [nP.cjs](https://raw.githubusercontent.com/JerryWiltz/nP/master/dist/nP.cjs).
- [Website agent](https://raw.githubusercontent.com/JerryWiltz/nP/master/nP-agents/websites/AGENTS.md): nP code integrated into an existing site.

Supply the appropriate nP library and ask your coding assistant to read `AGENTS.md`. These instructions work outside this repository and need no repository checkout. Locally supplied nP files support offline analysis; the coding assistant has its own connection requirements. The agent writes code by default and runs it when asked. For HTML or website work, the site's [browser bundle](./nP.js) provides `nP.js`.

## DC bias analysis

The current browser bundle includes `nP.V()` and network DC solving using the same `nodal()` or cascade connections as RF analysis. External capacitors open at DC, inductors short, and supported resistive paths remain. Call `network.solveDC()` when you want an explicit DC result.

For a supported network containing voltage supplies and NPN/PNP transistors, nP solves the external bias network before building its RF response. Read the returned `network.operatingPoint` for the solved state. Fixed-Q transistor construction remains available. Diode network DC adapters are not yet supported.

Start with the [DC bias analysis guide](./dc-bias-analysis.md). See the [DC analysis details](https://github.com/JerryWiltz/nP/blob/master/developmentDocs/analysis/dcAnalysis.md) and [active-device guide](./diodes-and-active-components.md). Published npm and Obsidian builds have their own update schedules; use the APIs present in the bundle you supply.

## What's new in nP 0.49.0

See [What's new in nP 0.49.0](./whats-new-0-49-0.md) for SVG schematics, time-grid and digital workflows, FFT reconstruction, and VNA examples.

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
5. Draw the network with `nP.schematic(network)`.
6. Display the result with `nP.lineChart()`, `nP.lineTable()`, or `nP.smithChart()`.

The [Schematics guide](./schematics.md) explains how the network's connections become a drawing, how to use its controls, and how to guide the layout of larger circuits.

Start with the [Introduction](./introduction.md), then follow the [Tutorial](./tutorial.md) for RF and digital signal examples. The [RF Constructors](./rf-constructors.md) page introduces the component families; [Circuit examples](./circuit-examples.md) shows complete RF networks. Physical-model design notes and equation provenance are maintained in the repository's [`developmentDocs/`](https://github.com/JerryWiltz/nP/tree/master/developmentDocs) directory.

For noise figure and output noise density, see [Noise](./noise.md). For IP2, IP3, and harmonics, see [Intermodulation](./intermodulation.md).
