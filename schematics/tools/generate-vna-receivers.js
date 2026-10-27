#!/usr/bin/env node
// Modified: 2026-10-27
'use strict';

const fs = require('fs');
const path = require('path');
const {compose} = require('./compose-schematic');
const {resolveSchematicPaths} = require('./symbol-library');

const {repositoryRoot} = resolveSchematicPaths(__dirname);

function makeReceiver(id, signal, y, output) {
  return {
    id, symbol: 'demod.svg',
    source: {variable: id, constructor: 'demod'},
    at: [460, y], sourceAnchor: [80, 80],
    connections: [
      {port: 1, signal, at: [460, y]},
      {port: 2, signal: output, at: [580, y]}
    ]
  };
}

function makeVnaReceivers(cable = false) {
  const circuit = {
    title: 'VNA source and three receiver channels',
    description: 'The modulated source feeds RF fixture port 1. Separate demodulators receive R, A, and B from the fixture output ports.',
    domain: 'signal',
    source: {file: 'docs/.vitepress/theme/replExamples.js', result: 'referenceRx, reflectionRx, transmissionRx',
      combination: 'mod -> RF fixture -> demod(R), demod(A), demod(B)',
      exampleId: 'vna-port1'},
    viewBox: [0, 0, 760, 560],
    layout: {centerAxisX: 380, centerReference: 'RF fixture interface'},
    components: [
      {id: 'tx', symbol: 'mod.svg', source: {variable: 'tx', constructor: 'mod'},
        at: [160, 220], sourceAnchor: [80, 80],
        connections: [{port: 1, signal: 'grid', at: [160, 220]},
          {port: 2, signal: 'tx', at: [280, 220]}]},
      makeReceiver('referenceRx', 'R', 180, 'reference'),
      makeReceiver('reflectionRx', 'A', 300, 'reflection'),
      makeReceiver('transmissionRx', 'B', 420, 'transmission')
    ],
    wires: [
      {signal: 'grid', points: [[100, 220], [160, 220]]},
      {signal: 'tx', points: [[280, 220], [340, 220]]},
      {signal: 'R', points: [[400, 180], [460, 180]]},
      {signal: 'reference', points: [[580, 180], [640, 180]]},
      {signal: 'A', points: [[400, 300], [460, 300]]},
      {signal: 'reflection', points: [[580, 300], [640, 300]]},
      {signal: 'B', points: [[400, 420], [460, 420]]},
      {signal: 'transmission', points: [[580, 420], [640, 420]]}
    ],
    terminals: [
      {signal: 'grid', at: [100, 220]}, {signal: 'tx', at: [340, 220]},
      {signal: 'R', at: [400, 180]}, {signal: 'reference', at: [640, 180]},
      {signal: 'A', at: [400, 300]}, {signal: 'reflection', at: [640, 300]},
      {signal: 'B', at: [400, 420]}, {signal: 'transmission', at: [640, 420]}
    ],
    labels: [
      {componentId: 'tx', text: 'VNA mod', at: [220, 100], anchor: 'middle'},
      {componentId: 'referenceRx', text: 'referenceRx', at: [520, 100], anchor: 'middle'},
      {componentId: 'reflectionRx', text: 'reflectionRx', at: [520, 260], anchor: 'middle'},
      {componentId: 'transmissionRx', text: 'transmissionRx', at: [520, 380], anchor: 'middle'},
      {text: 'fList or tList', at: [100, 180], anchor: 'middle'},
      {text: 'to RF port 1', at: [280, 260], anchor: 'middle'},
      {text: 'R', at: [400, 140], anchor: 'middle'},
      {text: 'A', at: [400, 260], anchor: 'middle'},
      {text: 'B', at: [400, 380], anchor: 'middle'},
      {text: 'reference', at: [640, 140], anchor: 'middle'},
      {text: 'reflection', at: [640, 260], anchor: 'middle'},
      {text: 'transmission', at: [640, 380], anchor: 'middle'}
    ]
  };
  if (cable) {
    circuit.title = 'VNA cable source and return receivers';
    circuit.description = 'The cable fault uses reference R and separate A receivers for the short and open scenarios; B is dormant.';
    circuit.source.result = 'referenceRx, shortRx, openRx';
    circuit.source.combination = 'mod -> short/open RF fixtures -> demod(R), demod(A short), demod(A open); B dormant';
    circuit.source.exampleId = 'vna-short-reflection';
    circuit.viewBox = [0, 0, 760, 620];
    const signalNames = {A: 'A-short', reflection: 'short-return',
      B: 'A-open', transmission: 'open-return'};
    for (const component of circuit.components) {
      if (component.id === 'reflectionRx') component.id = 'shortRx';
      if (component.id === 'transmissionRx') component.id = 'openRx';
      if (component.source.variable === 'reflectionRx') component.source.variable = 'shortRx';
      if (component.source.variable === 'transmissionRx') component.source.variable = 'openRx';
      for (const connection of component.connections) {
        connection.signal = signalNames[connection.signal] || connection.signal;
      }
    }
    for (const wire of circuit.wires) wire.signal = signalNames[wire.signal] || wire.signal;
    for (const terminal of circuit.terminals) {
      terminal.signal = signalNames[terminal.signal] || terminal.signal;
    }
    const labelNames = {reflectionRx: 'shortRx', transmissionRx: 'openRx',
      A: 'A short', B: 'A open', reflection: 'short return',
      transmission: 'open return'};
    for (const label of circuit.labels) {
      label.componentId = labelNames[label.componentId] || label.componentId;
      label.text = labelNames[label.text] || label.text;
    }
    circuit.labels.push({text: 'B dormant', at: [520, 540], anchor: 'middle'});
  }
  return circuit;
}

function generate() {
  for (const [name, circuit] of [
    ['vna-receivers', makeVnaReceivers()],
    ['vna-cable-receivers', makeVnaReceivers(true)]
  ]) {
    fs.writeFileSync(path.join(repositoryRoot, 'schematics/circuits', `${name}.json`),
      `${JSON.stringify(circuit, null, 2)}\n`);
    fs.writeFileSync(path.join(repositoryRoot, 'docs/public/schematics', `${name}.svg`),
      compose(circuit));
  }
}

if (require.main === module) {
  try { generate(); } catch (error) {
    process.stderr.write(`generate-vna-receivers: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {generate, makeVnaReceivers};
