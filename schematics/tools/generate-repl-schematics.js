#!/usr/bin/env node
// Modified: 2026-10-25
'use strict';

const fs = require('fs');
const path = require('path');
const {compose} = require('./compose-schematic');
const {readCanonicalSymbol, resolveSchematicPaths} = require('./symbol-library');

const {repositoryRoot, symbolRoot} = resolveSchematicPaths(__dirname);
const catalog = require('../symbol-catalog.json');
const sourceFile = 'docs/.vitepress/theme/replExamples.js';

const specifications = [
  {name: 'frequency-sweep', example: 'frequency-sweep', title: 'Series resistor sweep', result: 'r1', parts: [['r1', 'R', '25 Ω']]},
  {name: 'ideal-coupled-line', example: 'coupled-line', title: 'Ideal coupled line', result: 'coupler', parts: [['coupler', 'Tclin', '100/30 Ω, 37.3 mm']]},
  {name: 'transmission-line', example: 'line-table', title: 'Transmission line', result: 'line', parts: [['line', 'Tlin', '60 Ω, 25.4 mm']]},
  {name: 'microstrip-line', example: 'microstrip-line', title: 'Microstrip line', result: 'line', parts: [['line', 'mlin', '12.7 mm']]},
  {name: 'microstrip-coupled-line', example: 'microstrip-coupler', title: 'Microstrip coupled line', result: 'coupler', parts: [['coupler', 'mclin', 'mclin()']]},
  {name: 'microstrip-tee', example: 'microstrip-tee', title: 'Microstrip Tee', result: 'tee', parts: [['tee', 'mtee', 'mtee()']]},
  {name: 'microstrip-film-resistor', example: 'microstrip-film-resistor', title: 'Microstrip film resistor', result: 'resistor', parts: [['resistor', 'mtfr', '100 Ω']]},
  {name: 'diode-dc-rf', example: 'diode-dc-rf', title: 'Biased 1N4148 diode', result: 'diode', parts: [['diode', 'diode1N4148', '1N4148 at 0.5 V']]},
  {name: 'line-chart-transmission', example: 'line-chart', title: 'Two cascaded transmission lines', result: 'network', expression: 'nP.cascade(line1, line2)', parts: [['line1', 'Tlin', '50 Ω, 12.7 mm'], ['line2', 'Tlin', '60 Ω, 25.4 mm']]},
  {name: 'five-cascaded-two-ports', example: 'method-chaining-nport', title: 'Five cascaded two-ports', result: 'chain', expression: 'line1.cas(attenuator1).cas(line2).cas(attenuator2).cas(line3)', parts: [['line1', 'Tlin', '50 Ω, 10 mm'], ['attenuator1', 'Attn', '3 dB'], ['line2', 'Tlin', '60 Ω, 20 mm'], ['attenuator2', 'Attn', '6 dB'], ['line3', 'Tlin', '50 Ω, 10 mm']]},
  {name: 'series-rc', example: 'series-rc-smith-chart', title: 'Series resistor and capacitor', result: 'seriesRC', expression: "nP.nodal([r1, 1, 2], [c1, 2, 3], ['out', 1, 3])", parts: [['r1', 'R', '50 Ω'], ['c1', 'C', '3.17 pF']]},
  {name: 'amplifier-then-attenuator', example: 'amplifier-noise', title: 'Amplifier followed by attenuator', result: 'chain', expression: "nP.nodal([amp, 1, 2], [attenuator, 2, 3], ['out', 1, 3])", parts: [['amp', 'Amp', '20 dB'], ['attenuator', 'Attn', '3 dB']]},
  {name: 'attenuator-then-amplifier', example: 'noise-order', title: 'Attenuator followed by amplifier', result: 'attenuatorFirst', expression: 'nP.cascade(attenuator, amp)', parts: [['attenuator', 'Attn', '3 dB'], ['amp', 'Amp', '20 dB']]},
  {name: 'attenuator-three-db', example: 'am-envelope', title: 'Three dB RF attenuator', result: 'chain', parts: [['attenuator', 'Attn', '3 dB']]},
  {name: 'attenuator-seventeen-db', example: 'ber-attenuation', title: '17.6 dB RF attenuator', result: 'chain', parts: [['attenuator', 'Attn', '17.6 dB']]},
  {name: 'rf-through', example: 'qam-ofdm', title: 'RF through path', result: 'qamChain', parts: [['qamThru', 'Thru', 'Thru()']]},
  {name: 'waveform-fft-inverse', example: 'trapezoid-fft-round-trip', title: 'Waveform, FFT, and inverse FFT', result: 'reconstructed', expression: "nP.invFFT(fft), with fft = nP.FFT(trapezoid.out('samples'))", domain: 'signal', parts: [['trapezoid', 'waveform', 'waveform()'], ['fft', 'FFT', 'FFT()'], ['reconstructed', 'invFFT', 'invFFT()']]},
  {name: 'mod-demod', example: 'am-envelope', title: 'Modulation and demodulation', result: 'rx', expression: 'nP.demod(chain, {noise: false})', domain: 'signal', parts: [['tx', 'mod', 'mod()'], ['rx', 'demod', 'demod()']]},
  {name: 'pn-waveform', example: 'pn7-waveform', title: 'PN waveform generator', result: 'pn', domain: 'signal', parts: [['pn', 'PN', 'PN7']]},
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

function makeSingle(spec) {
  const domain = spec.domain || 'rf';
  const part = spec.parts[0];
  const symbol = catalog.constructors[part[1]];
  const canonical = readCanonicalSymbol(symbolRoot, symbol);
  const ports = Object.values(canonical.ports);
  const xs = ports.map(port => port.x);
  const ys = ports.map(port => port.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const offsetX = Math.round((300 - (minX + maxX) / 2) / 20) * 20;
  const offsetY = Math.round((200 - (minY + maxY) / 2) / 20) * 20;
  const anchor = [canonical.ports[1].x + offsetX, canonical.ports[1].y + offsetY];
  const circuit = {
    title: spec.title, description: `Guide REPL example ${spec.example}: ${spec.title}.`,
    domain,
    source: {file: spec.sourceFile || sourceFile, result: spec.result, combination: spec.result,
      exampleId: spec.example},
    viewBox: [0, 0, 600, 440],
    layout: {centerAxisX: 300, centerReference: `${part[0]} body`},
    components: [], wires: [], terminals: [], labels: []
  };
  const positions = ports.map((port, index) => {
    const at = [port.x + offsetX, port.y + offsetY];
    let direction;
    if (ports.length === 1) direction = domain === 'signal' ? [1, 0] : [-1, 0];
    else if (port.x === minX) direction = [-1, 0];
    else if (port.x === maxX) direction = [1, 0];
    else if (port.y === minY) direction = [0, -1];
    else direction = [0, 1];
    const terminal = [at[0] + direction[0] * 60, at[1] + direction[1] * 60];
    const labelAt = [at[0] + direction[0] * 20,
      at[1] + (port.y === maxY && maxY !== minY ? 40 : -40)];
    const signal = `signal-${index + 1}`;
    const node = index + 1;
    circuit.wires.push(domain === 'rf' ? {node, points: [at, terminal]} :
      {signal, points: [at, terminal]});
    circuit.terminals.push(domain === 'rf' ? {node, at: terminal} : {signal, at: terminal});
    const captionY = ports.length > 2 ?
      (port.y === minY ? 100 : port.y === maxY ? 340 : 300) :
      terminal[1] + 50;
    circuit.labels.push({text: domain === 'rf' ? `Port ${node}` :
      (ports.length === 1 ? 'Output' : `Connector ${node}`),
    at: [terminal[0], captionY], anchor: 'middle'});
    return {at, labelAt, signal, node};
  });
  circuit.components.push({id: part[0], symbol, source: {variable: part[0], constructor: part[1]},
    at: anchor, sourceAnchor: [canonical.ports[1].x, canonical.ports[1].y],
    connections: positions.map((position, index) => domain === 'rf' ?
      {port: index + 1, node: position.node, at: position.at, labelAt: position.labelAt} :
      {port: index + 1, signal: position.signal, at: position.at})});
  circuit.labels.push({componentId: part[0], text: `${part[0]}: ${part[2]}`,
    at: [300, 70], anchor: 'middle'});
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
    const circuit = spec.domain === 'signal' ?
      (spec.parts.length === 1 ? makeSingle(spec) : makeSignalFlow(spec)) :
      (spec.parts.length === 1 &&
       Object.keys(readCanonicalSymbol(symbolRoot, catalog.constructors[spec.parts[0][1]]).ports).length !== 2 ?
        makeSingle(spec) : makeLinear(spec));
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
    process.stderr.write(`generate-repl-schematics: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {generate, makeLinear, specifications};
