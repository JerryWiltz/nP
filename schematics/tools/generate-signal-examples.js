#!/usr/bin/env node
// Modified: 2026-10-25
'use strict';

const fs = require('fs');
const path = require('path');
const {compose} = require('./compose-schematic');
const {resolveSchematicPaths} = require('./symbol-library');

const {repositoryRoot} = resolveSchematicPaths(__dirname);
const sourceFile = 'docs/.vitepress/theme/replExamples.js';

function makeIndependentModulators(name, title, exampleId, first, second) {
  const circuit = {
    title, description: `${title}: two independent modulated sources.`, domain: 'signal',
    source: {file: sourceFile, result: `${first[0]}, ${second[0]}`,
      combination: 'two independent nP.mod() calls', exampleId},
    viewBox: [0, 0, 600, 500],
    layout: {centerAxisX: 300, centerReference: 'two modulator sources'},
    components: [], wires: [], terminals: [], labels: []
  };
  for (const [index, [variable, mode]] of [first, second].entries()) {
    const y = 160 + index * 180;
    circuit.components.push({id: variable, symbol: 'digital/mod.svg',
      source: {variable, constructor: 'mod'}, at: [180, y], sourceAnchor: [80, 80],
      connections: [{port: 1, signal: `${variable}-grid`, at: [180, y]},
        {port: 2, signal: `${variable}-tones`, at: [300, y]}]});
    circuit.wires.push({signal: `${variable}-grid`, points: [[100, y], [180, y]]});
    circuit.wires.push({signal: `${variable}-tones`, points: [[300, y], [380, y]]});
    circuit.terminals.push({signal: `${variable}-grid`, at: [100, y]});
    circuit.terminals.push({signal: `${variable}-tones`, at: [380, y]});
    circuit.labels.push({componentId: variable, text: `${variable}: ${mode}`,
      at: [240, y - 70], anchor: 'middle'});
    circuit.labels.push({text: 'analysis grid', at: [100, y + 60], anchor: 'middle'});
    circuit.labels.push({text: 'tones', at: [380, y + 60], anchor: 'middle'});
  }
  return {name, circuit};
}

function makeBerComparison() {
  return {name: 'ber-comparison', circuit: {
    title: 'BER comparison through an RF attenuator',
    description: 'The transmitter supplies the reference bits and the RF path; bitErrorRate compares its output with the received signal.',
    domain: 'signal',
    source: {file: sourceFile, result: 'ber',
      combination: 'nP.bitErrorRate(tx, chain, {receptions: 50})', exampleId: 'ber-attenuation'},
    viewBox: [0, 0, 760, 500],
    layout: {centerAxisX: 380, centerReference: 'transmit and receive comparison'},
    components: [
      {id: 'tx', symbol: 'digital/mod.svg', source: {variable: 'tx', constructor: 'mod'},
        at: [160, 200], sourceAnchor: [80, 80],
        connections: [{port: 1, signal: 'grid', at: [160, 200]},
          {port: 2, signal: 'tx', at: [280, 200]}]},
      {id: 'ber', symbol: 'digital/bit-error-rate.svg',
        source: {variable: 'ber', constructor: 'bitErrorRate'},
        at: [460, 260], sourceAnchor: [80, 80],
        connections: [{port: 1, signal: 'tx', at: [460, 260]},
          {port: 2, signal: 'received', at: [460, 300]},
          {port: 3, signal: 'ber-result', at: [580, 280]}]}
    ],
    wires: [
      {signal: 'grid', points: [[100, 200], [160, 200]]},
      {signal: 'tx', points: [[280, 200], [340, 200]]},
      {signal: 'tx', points: [[340, 200], [340, 260], [460, 260]]},
      {signal: 'received', points: [[400, 300], [460, 300]]},
      {signal: 'ber-result', points: [[580, 280], [640, 280]]}
    ],
    terminals: [
      {signal: 'grid', at: [100, 200]}, {signal: 'tx', at: [340, 200]},
      {signal: 'received', at: [400, 300]},
      {signal: 'ber-result', at: [640, 280]}
    ],
    labels: [
      {componentId: 'tx', text: 'ASCII mod', at: [220, 90], anchor: 'middle'},
      {componentId: 'ber', text: 'bitErrorRate', at: [520, 140], anchor: 'middle'},
      {text: 'to RF attenuator', at: [340, 160], anchor: 'middle'},
      {text: 'received', at: [400, 360], anchor: 'middle'},
      {text: 'BER', at: [640, 340], anchor: 'middle'}
    ]
  }};
}

function generate() {
  const entries = [
    makeIndependentModulators('fm-pm-modulators', 'FM and PM sources',
      'fm-pm-sidebands', ['fm', 'FM'], ['pm', 'PM']),
    makeIndependentModulators('ssb-dsb-modulators', 'SSB and DSB-SC sources',
      'ssb-dsb-sidebands', ['ssb', 'SSB-USB'], ['dsb', 'DSB-SC']),
    makeBerComparison()
  ];
  for (const {name, circuit} of entries) {
    fs.writeFileSync(path.join(repositoryRoot, 'schematics/circuits', `${name}.json`),
      `${JSON.stringify(circuit, null, 2)}\n`);
    fs.writeFileSync(path.join(repositoryRoot, 'docs/public/schematics', `${name}.svg`),
      compose(circuit));
  }
}

if (require.main === module) {
  try { generate(); } catch (error) {
    process.stderr.write(`generate-signal-examples: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {generate};
