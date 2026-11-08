#!/usr/bin/env node
// Modified: 2026-11-07
'use strict';

const fs = require('fs');
const path = require('path');
const {compose} = require('./compose-schematic');
const {readCanonicalSymbol, resolveSchematicPaths} = require('./symbol-library');

const {repositoryRoot, symbolRoot} = resolveSchematicPaths(__dirname);
const catalog = require('../symbol-catalog.json');
const sourceFile = 'docs/.vitepress/theme/replExamples.js';

const specifications = [
  {name: 'attenuator-three-db', example: 'am-envelope', title: 'Three dB RF attenuator', result: 'chain', parts: [['attenuator', 'Attn', '3 dB']]},
  {name: 'mod-demod', example: 'am-envelope', title: 'Modulation and demodulation', result: 'rx', expression: 'nP.demod(chain, {noise: false})', domain: 'signal', parts: [['tx', 'mod', 'mod()'], ['rx', 'demod', 'demod()']]},
  {name: 'clc-low-pass-four-ways', example: 'circuit-examples', sourceFile: 'docs/circuit-examples.md', title: 'C-L-C low-pass network', result: 'byNodes', expression: "nP.nodal([c1, 1, 2], [l1, 2, 3], [c2, 3, 4], ['out', 1, 4])", parts: [['c1', 'paC', '16.418 pF'], ['l1', 'seL', '45.654 nH'], ['c2', 'paC', '16.418 pF']]},
  {name: 'stage-and-attenuator', example: 'connecting-nports', sourceFile: 'docs/connecting-nports.md', title: 'R-L stage with attenuator', result: 'complete', expression: 'nP.cascade(stage, attenuator), with stage = nP.nodal(r1, l1)', parts: [['r1', 'R', '25 Ω'], ['l1', 'L', '2 nH'], ['attenuator', 'Attn', '3 dB']]},
  {name: 'amplifier', example: 'diodes-and-active-components', sourceFile: 'docs/diodes-and-active-components.md', title: 'Amplifier stage', result: 'amp2', parts: [['amp2', 'Amp', '15 dB gain, 3 dB NF']]}
];

function portOffset(canonical, portOne, number) {
  const port = canonical.ports[number];
  return [port.x - portOne.x, port.y - portOne.y];
}

function makeComponent(part, position, nodeNumbers, domain, labelPositions) {
  const [id, constructor, value] = part;
  const symbol = catalog.constructors[constructor];
  if (!symbol) throw new Error(`unknown constructor ${constructor}`);
  const canonical = readCanonicalSymbol(symbolRoot, symbol);
  const portOne = canonical.ports[1];
  const component = {
    id, symbol,
    source: {variable: id, constructor},
    at: position,
    sourceAnchor: [portOne.x, portOne.y],
    connections: Object.keys(canonical.ports).map(number => {
      const port = Number(number);
      const offset = portOffset(canonical, portOne, port);
      const at = [position[0] + offset[0], position[1] + offset[1]];
      if (domain === 'signal') return {port, signal: nodeNumbers[port - 1], at};
      return {port, node: nodeNumbers[port - 1], at,
        labelAt: labelPositions[port - 1]};
    })
  };
  return {component, value, canonical};
}

function makeLinear(spec) {
  const domain = 'rf';
  const parts = spec.parts;
  const midY = 180;
  let cursor = 160;
  const placements = [];
  for (const [index, part] of parts.entries()) {
    const symbol = catalog.constructors[part[1]];
    const canonical = readCanonicalSymbol(symbolRoot, symbol);
    const ports = Object.values(canonical.ports);
    if (ports.length !== 2 || ports[1].y !== ports[0].y || ports[1].x <= ports[0].x) {
      throw new Error(`${spec.name} needs a custom layout for ${part[1]}`);
    }
    placements.push({part, x: cursor, canonical});
    if (ports.length === 2) cursor += ports[1].x - ports[0].x + (index === parts.length - 1 ? 0 : 100);
  }
  const last = placements.at(-1);
  const lastPorts = Object.values(last.canonical.ports);
  const lastX = last.x + (lastPorts.length === 2 ? lastPorts[1].x - lastPorts[0].x : 0);
  const width = Math.ceil((lastX + 160) / 20) * 20;
  const circuit = {
    title: spec.title,
    description: `Guide REPL example ${spec.example}: ${spec.title}.`,
    domain,
    source: {file: spec.sourceFile || sourceFile, result: spec.result,
      combination: spec.expression || `nP.cascade(${parts.map(part => part[0]).join(', ')})`,
      exampleId: spec.example},
    viewBox: [0, 0, width, 360],
    layout: {centerAxisX: width / 2, centerReference: `${spec.title} signal path`},
    components: [], wires: [], terminals: [], labels: []
  };
  for (const [index, placement] of placements.entries()) {
    const nodeNumbers = [index + 1, index + 2];
    const labelPositions = [[placement.x, 120], [placement.x +
      placement.canonical.ports[2].x - placement.canonical.ports[1].x, 120]];
    const built = makeComponent(placement.part, [placement.x, midY],
      nodeNumbers, domain, labelPositions);
    circuit.components.push(built.component);
    circuit.labels.push({componentId: placement.part[0], text: `${placement.part[0]}: ${placement.part[2]}`,
      at: [placement.x + (placement.canonical.ports[2].x - placement.canonical.ports[1].x) / 2, 60],
      anchor: 'middle'});
    if (index < placements.length - 1) {
      const next = placements[index + 1];
      const start = built.component.connections[1].at;
      const end = [next.x, midY];
      circuit.wires.push({node: index + 2, points: [start, end]});
    }
  }
  const firstAt = circuit.components[0].connections[0].at;
  const finalAt = circuit.components.at(-1).connections[1].at;
  const left = [firstAt[0] - 60, midY];
  const right = [finalAt[0] + 60, midY];
  circuit.wires.unshift({node: 1, points: [left, firstAt]});
  circuit.wires.push({node: parts.length + 1, points: [finalAt, right]});
  circuit.terminals = [{node: 1, at: left}, {node: parts.length + 1, at: right}];
  circuit.labels.push({text: 'Port 1', at: [left[0], 240], anchor: 'middle'});
  circuit.labels.push({text: 'Port 2', at: [right[0], 240], anchor: 'middle'});
  for (let index = 0; index < circuit.components.length - 1; index += 1) {
    const shared = circuit.components[index].connections[1];
    const next = circuit.components[index + 1].connections[0];
    const labelAt = [Math.round((shared.at[0] + next.at[0]) / 40) * 20, 120];
    shared.labelAt = labelAt;
    next.labelAt = labelAt;
  }
  return circuit;
}

function makeSignalFlow(spec) {
  const parts = spec.parts;
  const y = 180;
  const circuit = {
    title: spec.title, description: `Guide REPL example ${spec.example}: ${spec.title}.`,
    domain: 'signal',
    source: {file: spec.sourceFile || sourceFile, result: spec.result,
      combination: spec.expression || parts.map(part => part[0]).join(' -> '),
      exampleId: spec.example},
    viewBox: [0, 0, 200 + 240 * parts.length, 360],
    layout: {centerAxisX: 100 + 120 * parts.length,
      centerReference: `${spec.title} flow`},
    components: [], wires: [], terminals: [], labels: []
  };
  let priorOutput;
  for (const [index, part] of parts.entries()) {
    const symbol = catalog.constructors[part[1]];
    const canonical = readCanonicalSymbol(symbolRoot, symbol);
    const ports = Object.values(canonical.ports);
    const x = 160 + index * 240;
    const inputPort = ports.length === 1 ? null : canonical.ports[1];
    const sourcePort = inputPort || canonical.ports[1];
    const position = [x, y];
    const component = {id: part[0], symbol,
      source: {variable: part[0], constructor: part[1]},
      at: position, sourceAnchor: [sourcePort.x, sourcePort.y], connections: []};
    for (const number of Object.keys(canonical.ports).map(Number)) {
      const port = canonical.ports[number];
      const at = [x + port.x - sourcePort.x, y + port.y - sourcePort.y];
      const signal = `signal-${index + (inputPort ? number - 1 : 1)}`;
      component.connections.push({port: number, signal, at});
    }
    if (priorOutput) {
      circuit.wires.push({signal: `signal-${index}`, points: [priorOutput,
        component.connections[0].at]});
    } else if (inputPort) {
      const left = [x - 60, y];
      circuit.wires.push({signal: 'signal-0', points: [left, position]});
      circuit.terminals.push({signal: 'signal-0', at: left});
    }
    priorOutput = component.connections.at(-1).at;
    circuit.components.push(component);
    circuit.labels.push({componentId: part[0], text: `${part[0]}: ${part[2]}`,
      at: [x + (inputPort ? 60 : 0), 60], anchor: 'middle'});
  }
  const finalSignal = `signal-${parts.length}`;
  const end = [priorOutput[0] + 60, priorOutput[1]];
  circuit.wires.push({signal: finalSignal, points: [priorOutput, end]});
  circuit.terminals.push({signal: finalSignal, at: end});
  circuit.labels.push({text: 'Output', at: [end[0], 240], anchor: 'middle'});
  if (spec.name === 'mod-demod') {
    circuit.labels.push({text: 'RF path shown separately', at: [340, 140], anchor: 'middle'});
  }
  return circuit;
}

function outputPaths(name) {
  return {
    json: path.join(repositoryRoot, 'schematics/circuits', `${name}.json`),
    svg: path.join(repositoryRoot, 'docs/public/schematics', `${name}.svg`)
  };
}

function generate() {
  for (const spec of specifications) {
    const circuit = spec.domain === 'signal' ? makeSignalFlow(spec) : makeLinear(spec);
    const paths = outputPaths(spec.name);
    const json = `${JSON.stringify(circuit, null, 2)}\n`;
    const svg = compose(circuit);
    fs.writeFileSync(paths.json, json);
    fs.writeFileSync(paths.svg, svg);
    process.stdout.write(`${spec.name}\n`);
  }
}

if (require.main === module) {
  try { generate(); } catch (error) {
    process.stderr.write(`generate-linear-schematics: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {generate, makeLinear, specifications};
