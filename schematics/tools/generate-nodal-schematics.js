#!/usr/bin/env node
// Modified: 2026-10-25
'use strict';

const fs = require('fs');
const path = require('path');
const {compose} = require('./compose-schematic');
const {readCanonicalSymbol, resolveSchematicPaths, transformedPoint} = require('./symbol-library');

const {repositoryRoot, symbolRoot} = resolveSchematicPaths(__dirname);
const catalog = require('../symbol-catalog.json');
const sourceFile = 'docs/.vitepress/theme/replExamples.js';

// Each part is [drawing id, public constructor, source variable, port-1 position,
// port node numbers, rotation, visible label, label position]. Reused source
// objects have separate drawing ids but keep the same source variable.
const specifications = [
  {
    name: 'rc-low-pass', example: 'rc-low-pass', title: 'RC low-pass', result: 'lowPass',
    viewBox: [0, 0, 640, 560], center: 'series path midpoint',
    parts: [
      ['r1', 'R', 'r1', [160, 220], [1, 2], 0, 'r1 = 50 Ω', [210, 70]],
      ['tee', 'Tee', 'tee', [400, 260], [4, 2, 3], 0, 'tee', [400, 150]],
      ['c1', 'C', 'c1', [400, 320], [4, 5], 90, 'c1 = 3.17 pF', [490, 360]],
      ['short', 'Short', 'short', [400, 440], [5], 0, 'Short', [460, 490]]
    ],
    out: [[1, [100, 220]], [3, [520, 220]]],
    labelsAt: {1: [160, 180], 2: [320, 180], 3: [480, 180], 4: [440, 300], 5: [460, 400]}
  },
  {
    name: 'rlc-ladder', example: 'rlc-ladder', title: 'RLC ladder', result: 'ladder',
    viewBox: [0, 0, 760, 560], center: 'Tee shunt branch',
    parts: [
      ['l1', 'L', 'l1', [140, 220], [1, 2], 0, 'l1 = 9.57 nH', [190, 70]],
      ['tee', 'Tee', 'tee', [380, 260], [4, 2, 3], 0, 'tee', [380, 150]],
      ['c1', 'C', 'c1', [380, 320], [4, 5], 90, 'c1 = 3.17 pF', [470, 360]],
      ['short', 'Short', 'short', [380, 440], [5], 0, 'Short', [440, 490]],
      ['l2', 'L', 'l2', [500, 220], [3, 6], 0, 'l2 = 9.57 nH', [550, 70]]
    ],
    out: [[1, [80, 220]], [6, [680, 220]]],
    labelsAt: {1: [140, 180], 2: [290, 180], 3: [460, 180], 4: [420, 300], 5: [440, 400], 6: [600, 180]}
  },
  {
    name: 'tee-power-divider', example: 'tee-power-divider', title: 'Tee power divider', result: 'divider',
    viewBox: [0, 0, 760, 500], center: 'Tee common port',
    parts: [
      ['tee', 'Tee', 'tee', [380, 300], [1, 2, 3], 0, 'tee', [380, 160]],
      ['branch1', 'Tlin', 'branch1', [160, 260], [4, 2], 0, 'branch1 = 25.4 mm', [220, 90]],
      ['branch2', 'Tlin', 'branch2', [480, 260], [3, 5], 0, 'branch2 = 25.4 mm', [540, 90]]
    ],
    out: [[1, [380, 400]], [4, [100, 260]], [5, [660, 260]]],
    outLabelAt: [[380, 440], [100, 320], [660, 320]],
    labelsAt: {1: [420, 350], 2: [310, 220], 3: [450, 220], 4: [160, 220], 5: [600, 220]}
  },
  {
    name: 'series-stub', example: 'series-stub', title: 'Open series stub', result: 'network',
    viewBox: [0, 0, 600, 620], center: 'seriesTee through port 2',
    parts: [
      ['seriesJunction', 'seriesTee', 'seriesJunction', [220, 200], [1, 2, 3], 0, 'seriesTee', [260, 90]],
      ['line', 'Tlin', 'line', [260, 320], [3, 4], 90, 'line = 25.4 mm', [370, 380]],
      ['open', 'Open', 'open', [260, 500], [4], 0, 'Open', [320, 540]]
    ],
    out: [[1, [120, 200]], [2, [400, 200]]],
    labelsAt: {1: [180, 160], 2: [340, 160], 3: [300, 280], 4: [300, 470]}
  },
  {
    name: 'chebyshev-ladder', example: 'chebyshev-ladder', title: 'Chebyshev low-pass ladder', result: 'filter',
    viewBox: [0, 0, 720, 600], center: 'series path midpoint',
    parts: [
      ['tee1', 'Tee', 'tee', [180, 300], [1, 2, 3], 0, 'tee', [180, 170]],
      ['c1', 'C', 'c1', [180, 360], [1, 4], 90, 'c1 16.418 pF', [280, 390]],
      ['short1', 'Short', 'short', [180, 480], [4], 0, 'Short', [230, 540]],
      ['l1', 'L', 'l1', [320, 260], [3, 5], 0, 'l1 = 45.654 nH', [370, 150]],
      ['tee2', 'Tee', 'tee', [540, 300], [6, 5, 7], 0, 'tee', [540, 170]],
      ['c2', 'C', 'c2', [540, 360], [6, 8], 90, 'c2 16.418 pF', [620, 390]],
      ['short2', 'Short', 'short', [540, 480], [8], 0, 'Short', [590, 540]]
    ],
    out: [[2, [80, 260]], [7, [640, 260]]],
    labelsAt: {1: [220, 330], 2: [120, 220], 3: [270, 220], 4: [260, 440], 5: [460, 220], 6: [580, 330], 7: [600, 220], 8: [620, 440]}
  },
  {
    name: 'vna-inductor-fixture', example: 'vna-port1', title: 'VNA inductor fixture', result: 'circuit',
    viewBox: [0, 0, 1280, 520], center: 'RF path between input coupler and inductor',
    parts: [
      ['splitter', 'Coupler180', 'splitter', [160, 200], [1, 2, 3, 4], 0, 'splitter', [220, 70]],
      ['inputCoupler', 'Coupler180', 'inputCoupler', [420, 200], [2, 5, 6, 7], 0, 'input coupler', [480, 70]],
      ['l1', 'L', 'l1', [680, 200], [5, 8], 0, 'l1 = 5 nH', [730, 70]],
      ['outputCoupler', 'Coupler180', 'outputCoupler', [920, 200], [8, 9, 10, 11], 0, 'output coupler', [980, 70]],
      ['load1', 'Load', 'load', [300, 340], [3], 0, 'Load', [350, 390]],
      ['load2', 'Load', 'load', [480, 340], [7], 0, 'Load', [530, 390]],
      ['load3', 'Load', 'load', [1120, 100], [9], 0, 'Load', [1170, 70]],
      ['load4', 'Load', 'load', [1120, 340], [10], 0, 'Load', [1170, 390]]
    ],
    out: [[1, [100, 200]], [4, [100, 320]], [6, [600, 320]], [11, [900, 320]]],
    outLabels: ['Port 1: source', 'Port 2: R', 'Port 3: A', 'Port 4: B'],
    outLabelAt: [[100, 120], [100, 400], [600, 400], [900, 400]],
    labelsAt: {1: [160, 160], 2: [350, 160], 3: [340, 280], 4: [80, 280], 5: [610, 160], 6: [640, 280], 7: [520, 300], 8: [850, 160], 9: [1080, 160], 10: [1080, 280], 11: [860, 280]},
    routes: {4: [[100, 240]], 6: [[600, 240]], 11: [[900, 240]], 3: [[300, 240]], 7: [[480, 240]], 9: [[1120, 200]], 10: [[1120, 240]]}
  },
  {
    name: 'vna-cable-short', example: 'vna-short-reflection', title: 'VNA cable with short fault', result: 'shortCircuit',
    viewBox: [0, 0, 1100, 500], center: 'RF path between input coupler and line',
    parts: [
      ['splitter', 'Coupler180', 'splitter', [160, 200], [1, 2, 3, 4], 0, 'splitter', [220, 70]],
      ['inputCoupler', 'Coupler180', 'inputCoupler', [420, 200], [2, 5, 6, 7], 0, 'input coupler', [480, 70]],
      ['line', 'Tlin', 'line', [680, 200], [5, 8], 0, 'line = 1 km', [740, 70]],
      ['short', 'Short', 'short', [920, 200], [8], 0, 'Short', [970, 250]],
      ['load1', 'Load', 'load', [300, 340], [3], 0, 'Load', [350, 390]],
      ['load2', 'Load', 'load', [480, 340], [7], 0, 'Load', [530, 390]]
    ],
    out: [[1, [100, 200]], [4, [100, 320]], [6, [600, 320]]],
    outLabels: ['Port 1: source', 'Port 2: R', 'Port 3: A'],
    outLabelAt: [[100, 120], [100, 400], [600, 400]],
    labelsAt: {1: [160, 160], 2: [350, 160], 3: [340, 280], 4: [80, 280], 5: [610, 160], 6: [640, 280], 7: [520, 300], 8: [860, 160]},
    routes: {4: [[100, 240]], 6: [[600, 240]], 3: [[300, 240]], 7: [[480, 240]]}
  },
  {
    name: 'vna-cable-open', example: 'vna-short-reflection', title: 'VNA cable with open fault', result: 'openCircuit',
    viewBox: [0, 0, 1100, 500], center: 'RF path between input coupler and line',
    parts: [
      ['splitter', 'Coupler180', 'splitter', [160, 200], [1, 2, 3, 4], 0, 'splitter', [220, 70]],
      ['inputCoupler', 'Coupler180', 'inputCoupler', [420, 200], [2, 5, 6, 7], 0, 'input coupler', [480, 70]],
      ['line', 'Tlin', 'line', [680, 200], [5, 8], 0, 'line = 1 km', [740, 70]],
      ['open', 'Open', 'open', [920, 200], [8], 0, 'Open', [970, 250]],
      ['load1', 'Load', 'load', [300, 340], [3], 0, 'Load', [350, 390]],
      ['load2', 'Load', 'load', [480, 340], [7], 0, 'Load', [530, 390]]
    ],
    out: [[1, [100, 200]], [4, [100, 320]], [6, [600, 320]]],
    outLabels: ['Port 1: source', 'Port 2: R', 'Port 3: A'],
    outLabelAt: [[100, 120], [100, 400], [600, 400]],
    labelsAt: {1: [160, 160], 2: [350, 160], 3: [340, 280], 4: [80, 280], 5: [610, 160], 6: [640, 280], 7: [520, 300], 8: [860, 160]},
    routes: {4: [[100, 240]], 6: [[600, 240]], 3: [[300, 240]], 7: [[480, 240]]}
  },
  {
    name: 'microstrip-layout-path', example: 'microstrip-layout', title: 'Step, bend, and via path', result: 'path',
    viewBox: [0, 0, 620, 620], center: 'right-turn bend',
    parts: [
      ['step', 'mstep', 'step', [160, 180], [1, 2], 0, 'step', [220, 70]],
      ['bend', 'mbend', 'bend', [380, 180], [2, 3], 0, 'bend', [420, 70]],
      ['via', 'mvia', 'via', [440, 340], [3, 4], 0, 'via', [500, 380]]
    ],
    out: [[1, [100, 180]], [4, [440, 500]]],
    labelsAt: {1: [160, 140], 2: [330, 140], 3: [480, 280], 4: [480, 460]}
  },
  {
    name: 'wilkinson-divider', example: 'circuit-examples', sourceFile: 'docs/circuit-examples.md',
    title: 'Wilkinson power divider', result: 'divider',
    viewBox: [0, 0, 840, 760], center: 'branch pair midpoint',
    parts: [
      ['inputTee', 'Tee', 'inputTee', [200, 360], [1, 2, 3], 0, 'input Tee', [200, 170]],
      ['branch1', 'Tlin', 'branch1', [300, 240], [2, 4], 0, 'branch1 = 70.7 Ω', [360, 110]],
      ['branch2', 'Tlin', 'branch2', [300, 560], [3, 5], 0, 'branch2 = 70.7 Ω', [360, 660]],
      ['outputTee1', 'Tee', 'outputTee1', [560, 280], [6, 4, 7], 0, 'output Tee 1', [560, 110]],
      ['outputTee2', 'Tee', 'outputTee2', [560, 520], [8, 5, 9], 0, 'output Tee 2', [560, 700], true],
      ['isolationR', 'R', 'isolationR', [560, 320], [6, 8], 90, '100 Ω isolation', [700, 360]]
    ],
    out: [[1, [100, 360]], [7, [720, 240]], [9, [720, 560]]],
    outLabelAt: [[100, 420], [720, 200], [720, 620]],
    labelsAt: {1: [140, 320], 2: [220, 200], 3: [260, 420], 4: [470, 200], 5: [470, 520], 6: [600, 300], 7: [660, 200], 8: [600, 460], 9: [660, 520]},
    routes: {2: [[160, 240]], 3: [[300, 320]]}
  },
  {
    name: 'pi-attenuator', example: 'circuit-examples', sourceFile: 'docs/circuit-examples.md',
    title: 'Pi attenuator', result: 'attenuator',
    viewBox: [0, 0, 720, 680], center: 'series resistor midpoint',
    parts: [
      ['inputTee', 'Tee', 'inputTee', [180, 300], [2, 1, 3], 0, 'input Tee', [180, 150]],
      ['inputShunt', 'R', 'inputShunt', [180, 360], [2, 4], 90, '292.4 Ω', [260, 400]],
      ['ground1', 'Short', 'ground', [180, 520], [4], 0, 'Short', [230, 590]],
      ['seriesR', 'R', 'seriesR', [320, 260], [3, 5], 0, '17.6 Ω', [370, 130]],
      ['outputTee', 'Tee', 'outputTee', [540, 300], [6, 5, 7], 0, 'output Tee', [540, 150]],
      ['outputShunt', 'R', 'outputShunt', [540, 360], [6, 8], 90, '292.4 Ω', [620, 400]],
      ['ground2', 'Short', 'ground', [540, 520], [8], 0, 'Short', [590, 590]]
    ],
    out: [[1, [80, 260]], [7, [640, 260]]],
    labelsAt: {1: [120, 220], 2: [220, 330], 3: [270, 220], 4: [240, 480], 5: [460, 220], 6: [580, 330], 7: [600, 220], 8: [600, 480]}
  },
  {
    name: 'edge-coupled-bandpass', example: 'circuit-examples', sourceFile: 'docs/circuit-examples.md',
    title: 'Three-section edge-coupled bandpass filter', result: 'filter',
    viewBox: [0, 0, 940, 540], center: 'middle coupled section',
    parts: [
      ['coupled1', 'Tclin', 'coupled1', [160, 180], [1, 2, 3, 4], 0, 'coupled1', [220, 70]],
      ['coupled2', 'Tclin', 'coupled2', [400, 220], [3, 5, 6, 7], 0, 'coupled2', [460, 70]],
      ['coupled3', 'Tclin', 'coupled3', [640, 260], [6, 8, 9, 10], 0, 'coupled3', [700, 70]],
      ['open1', 'Open', 'open', [320, 100], [2], 0, 'Open', [360, 60]],
      ['open2', 'Open', 'open', [160, 340], [4], 0, 'Open', [210, 380]],
      ['open3', 'Open', 'open', [560, 100], [5], 0, 'Open', [600, 60]],
      ['open4', 'Open', 'open', [400, 380], [7], 0, 'Open', [450, 420]],
      ['open5', 'Open', 'open', [800, 100], [8], 0, 'Open', [840, 60]],
      ['open6', 'Open', 'open', [640, 420], [10], 0, 'Open', [690, 460]]
    ],
    out: [[1, [100, 180]], [9, [820, 300]]],
    outLabelAt: [[100, 240], [820, 400]],
    labelsAt: {1: [160, 140], 2: [380, 140], 3: [340, 260], 4: [200, 280], 5: [620, 160], 6: [580, 300], 7: [440, 320], 8: [860, 180], 9: [800, 340], 10: [680, 360]},
    routes: {2: [[320, 180]], 5: [[560, 220]], 8: [[800, 260]]}
  }
];

function getPart(part) {
  const [id, constructor, variable, at, nodeNumbers, rotation, label, labelAt, mirrorY = false] = part;
  const symbol = catalog.constructors[constructor];
  const canonical = readCanonicalSymbol(symbolRoot, symbol);
  const portOne = canonical.ports[1];
  const connections = Object.keys(canonical.ports).map(number => {
    const port = Number(number);
    return {port, node: nodeNumbers[port - 1],
      at: transformedPoint(canonical.ports[port], [portOne.x, portOne.y], at,
        rotation, mirrorY)};
  });
  return {
    component: {id, symbol, source: {variable, constructor}, at,
      sourceAnchor: [portOne.x, portOne.y], rotation,
      ...(mirrorY ? {mirrorY} : {}), connections},
    label: {componentId: id, text: label, at: labelAt, anchor: 'middle'}
  };
}

function midpointLabel(first, second) {
  if (first[1] === second[1]) return [Math.round((first[0] + second[0]) / 40) * 20, first[1] - 40];
  return [first[0] + 40, Math.round((first[1] + second[1]) / 40) * 20];
}

function makeNodal(spec) {
  const parts = spec.parts.map(getPart);
  const circuit = {
    title: spec.title, description: `Guide REPL example ${spec.example}: ${spec.title}.`,
    domain: 'rf',
    source: {file: spec.sourceFile || sourceFile, result: spec.result,
      combination: `nP.nodal(..., ['out', ${spec.out.map(entry => entry[0]).join(', ')}])`,
      exampleId: spec.example},
    viewBox: spec.viewBox,
    layout: {centerAxisX: spec.viewBox[0] + spec.viewBox[2] / 2,
      centerReference: spec.center},
    components: parts.map(part => part.component), wires: [], terminals: [],
    labels: parts.map(part => part.label)
  };
  const nodePoints = new Map();
  for (const component of circuit.components) {
    for (const connection of component.connections) {
      const points = nodePoints.get(connection.node) || [];
      points.push(connection.at);
      nodePoints.set(connection.node, points);
    }
  }
  for (const [index, [node, at]] of spec.out.entries()) {
    circuit.terminals.push({node, at});
    nodePoints.get(node).push(at);
    const caption = spec.outLabels ? spec.outLabels[index] : `Port ${index + 1}`;
    circuit.labels.push({text: caption,
      at: spec.outLabelAt ? spec.outLabelAt[index] : [at[0], at[1] + 60],
      anchor: 'middle'});
  }
  for (const [node, points] of nodePoints) {
    if (points.length !== 2) throw new Error(`${spec.name} node ${node} needs exactly two endpoints`);
    const [first, second] = points;
    const labelAt = spec.labelsAt[node] || midpointLabel(first, second);
    for (const component of circuit.components) {
      for (const connection of component.connections) {
        if (connection.node === node) connection.labelAt = labelAt;
      }
    }
    if (first[0] === second[0] && first[1] === second[1]) continue;
    const via = spec.routes?.[node] ||
      (first[0] === second[0] || first[1] === second[1] ? [] : [[second[0], first[1]]]);
    circuit.wires.push({node, points: [first, ...via, second]});
  }
  return circuit;
}

function generate() {
  for (const spec of specifications) {
    const circuit = makeNodal(spec);
    const jsonPath = path.join(repositoryRoot, 'schematics/circuits', `${spec.name}.json`);
    const svgPath = path.join(repositoryRoot, 'docs/public/schematics', `${spec.name}.svg`);
    fs.writeFileSync(jsonPath, `${JSON.stringify(circuit, null, 2)}\n`);
    fs.writeFileSync(svgPath, compose(circuit));
    process.stdout.write(`${spec.name}\n`);
  }
}

if (require.main === module) {
  try { generate(); } catch (error) {
    process.stderr.write(`generate-nodal-schematics: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {generate, makeNodal, specifications};
