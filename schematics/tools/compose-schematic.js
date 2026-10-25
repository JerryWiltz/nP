#!/usr/bin/env node
// Modified: 2026-10-25
'use strict';

const fs = require('fs');
const path = require('path');
const {
  readCanonicalSymbol,
  resolveSchematicPaths,
  transformedPoint
} = require('./symbol-library');
const {validateRfConnectivity} = require('./validate-rf-connectivity');

const {symbolRoot, repositoryRoot} = resolveSchematicPaths(__dirname);
const symbolCatalog = require('../symbol-catalog.json');

function fail(message) {
  throw new Error(message);
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function readDescription(inputPath) {
  const source = inputPath === '-'
    ? fs.readFileSync(0, 'utf8')
    : fs.readFileSync(path.resolve(inputPath), 'utf8');
  try {
    return JSON.parse(source);
  } catch (error) {
    fail(`invalid JSON description: ${error.message}`);
  }
}

function numberPair(value, name) {
  if (!Array.isArray(value) || value.length !== 2 ||
      value.some(number => !Number.isFinite(number))) {
    fail(`${name} must contain two finite numbers`);
  }
  return value;
}

function pointOnGrid(point, grid, name) {
  numberPair(point, name);
  if (point.some(number => number % grid !== 0)) {
    fail(`${name} must use the ${grid}-unit grid`);
  }
}

function pointKey(point) {
  return `${point[0]},${point[1]}`;
}

function pointInsideMargin(point, viewBox, name) {
  const [minX, minY, width, height] = viewBox;
  if (point[0] < minX + 40 || point[0] > minX + width - 40 ||
      point[1] < minY + 40 || point[1] > minY + height - 40) {
    fail(`${name} must stay at least 40 units inside the viewBox`);
  }
}

function canonicalSymbol(filename) {
  try {
    return readCanonicalSymbol(symbolRoot, filename);
  } catch (error) {
    fail(error.message);
  }
}

function validateDescription(circuit) {
  if (!circuit || typeof circuit !== 'object') fail('description must be an object');
  if (!circuit.title || !circuit.description) fail('title and description are required');
  if (circuit.domain !== 'rf' && circuit.domain !== 'signal') {
    fail('domain must be rf or signal');
  }
  if (!Array.isArray(circuit.viewBox) || circuit.viewBox.length !== 4 ||
      circuit.viewBox.some(number => !Number.isFinite(number))) {
    fail('viewBox must contain four finite numbers');
  }
  const [, , width, height] = circuit.viewBox;
  if (width <= 0 || height <= 0 || width % 20 || height % 20) {
    fail('viewBox width and height must be positive multiples of 20');
  }
  if (!circuit.layout || typeof circuit.layout !== 'object' ||
      !Number.isFinite(circuit.layout.centerAxisX) ||
      typeof circuit.layout.centerReference !== 'string' ||
      !circuit.layout.centerReference.trim()) {
    fail('layout needs a finite centerAxisX and non-empty centerReference');
  }
  const expectedAxis = circuit.viewBox[0] + width / 2;
  if (circuit.layout.centerAxisX !== expectedAxis) {
    fail(`layout centerAxisX must equal the viewBox y-axis at ${expectedAxis}`);
  }
  if (!Array.isArray(circuit.components) || !circuit.components.length) {
    fail('at least one component is required');
  }
  if (circuit.source !== undefined &&
      (!circuit.source || typeof circuit.source.file !== 'string' ||
       typeof circuit.source.result !== 'string' ||
       typeof circuit.source.combination !== 'string' ||
       !circuit.source.result.trim() || !circuit.source.combination.trim())) {
    fail('source needs file, result, and combination strings');
  }
  if (circuit.source) {
    const sourceFile = path.resolve(repositoryRoot, circuit.source.file);
    const relative = path.relative(repositoryRoot, sourceFile);
    if (relative.startsWith('..') || path.isAbsolute(relative) ||
        !fs.existsSync(sourceFile) || !fs.statSync(sourceFile).isFile()) {
      fail('source.file must name an existing file inside this repository');
    }
  }
  const nodes = new Map();
  const signals = new Map();
  const componentIds = new Set();
  for (const [index, component] of circuit.components.entries()) {
    if (!component.id || !component.symbol) fail(`component ${index} needs id and symbol`);
    if (componentIds.has(component.id)) fail(`duplicate component id: ${component.id}`);
    componentIds.add(component.id);
    if (component.source !== undefined &&
        (!component.source || typeof component.source.variable !== 'string' ||
         typeof component.source.constructor !== 'string' ||
         !component.source.variable.trim())) {
      fail(`${component.id}.source needs variable and constructor strings`);
    }
    if (component.source && symbolCatalog.constructors[component.source.constructor] !== component.symbol &&
        !(symbolCatalog.symbolVariants[component.source.constructor] || []).includes(component.symbol)) {
      fail(`${component.id}.source constructor does not map to ${component.symbol}`);
    }
    pointOnGrid(component.at, 20, `${component.id}.at`);
    if (!component.symbol.startsWith(`${circuit.domain === 'rf' ? 'rf' : 'digital'}/`)) {
      fail(`${component.id} symbol does not match the ${circuit.domain} diagram domain`);
    }
    const canonical = canonicalSymbol(component.symbol);
    const portOne = canonical.ports[1];
    const sourceAnchor = component.sourceAnchor || [portOne.x, portOne.y];
    numberPair(sourceAnchor, `${component.id}.sourceAnchor`);
    const rotation = component.rotation || 0;
    if (!Number.isFinite(rotation) || rotation % 90) {
      fail(`${component.id}.rotation must be a multiple of 90`);
    }
    if (component.mirrorY !== undefined && typeof component.mirrorY !== 'boolean') {
      fail(`${component.id}.mirrorY must be a boolean`);
    }
    if (!Array.isArray(component.connections) ||
        component.connections.length !== Object.keys(canonical.ports).length) {
      fail(`${component.id}.connections must describe every symbol connector exactly once`);
    }
    const ports = new Set();
    for (const connection of component.connections) {
      if (!Number.isInteger(connection.port) || connection.port < 1) {
        fail(`${component.id} has an invalid constructor port`);
      }
      if (ports.has(connection.port)) fail(`${component.id} repeats port ${connection.port}`);
      ports.add(connection.port);
      numberPair(connection.at, `${component.id} port ${connection.port}`);
      pointOnGrid(connection.at, 20, `${component.id} port ${connection.port}`);
      pointInsideMargin(connection.at, circuit.viewBox, `${component.id} port ${connection.port}`);
      if (circuit.domain === 'rf') {
        if (!Number.isInteger(connection.node) || connection.node < 1 ||
            connection.signal !== undefined) {
          fail(`${component.id} port ${connection.port} needs a positive RF node only`);
        }
        pointOnGrid(connection.labelAt, 10, `${component.id} node ${connection.node} label`);
        pointInsideMargin(connection.labelAt, circuit.viewBox,
          `${component.id} node ${connection.node} label`);
      } else if (typeof connection.signal !== 'string' || !connection.signal.trim() ||
                 connection.node !== undefined || connection.labelAt !== undefined) {
        fail(`${component.id} connector ${connection.port} needs a signal name only`);
      }
      const sourcePort = canonical.ports[connection.port];
      if (!sourcePort) fail(`${component.id} has no constructor port ${connection.port}`);
      const expected = transformedPoint(sourcePort, sourceAnchor, component.at,
        rotation, component.mirrorY);
      if (connection.at[0] !== expected[0] || connection.at[1] !== expected[1]) {
        fail(`${component.id} port ${connection.port} must be at [${expected.join(', ')}]`);
      }
      if (circuit.domain === 'signal') {
        const endpoints = signals.get(connection.signal) || [];
        endpoints.push(connection.at);
        signals.set(connection.signal, endpoints);
        continue;
      }
      const prior = nodes.get(connection.node);
      if (prior && (prior.labelAt[0] !== connection.labelAt[0] ||
          prior.labelAt[1] !== connection.labelAt[1])) {
        fail(`node ${connection.node} is assigned more than one label coordinate`);
      }
      nodes.set(connection.node, {labelAt: connection.labelAt});
    }
  }
  for (const [index, wire] of (circuit.wires || []).entries()) {
    if (!Array.isArray(wire.points) || wire.points.length < 2) {
      fail(`wire ${index} needs at least two points`);
    }
    if (circuit.domain === 'signal') {
      if (typeof wire.signal !== 'string' || !signals.has(wire.signal)) {
        fail(`wire ${index} needs a known signal name`);
      }
    } else if (wire.signal !== undefined) {
      fail(`RF wire ${index} must not name a signal`);
    }
    wire.points.forEach((point, pointIndex) => {
      numberPair(point, `wire ${index} point ${pointIndex}`);
      pointOnGrid(point, 20, `wire ${index} point ${pointIndex}`);
      pointInsideMargin(point, circuit.viewBox, `wire ${index} point ${pointIndex}`);
    });
    for (let pointIndex = 1; pointIndex < wire.points.length; pointIndex += 1) {
      const previous = wire.points[pointIndex - 1];
      const current = wire.points[pointIndex];
      if (previous[0] !== current[0] && previous[1] !== current[1]) {
        fail(`wire ${index} contains a diagonal segment`);
      }
    }
  }
  for (const [index, terminal] of (circuit.terminals || []).entries()) {
    pointOnGrid(terminal.at, 20, `terminal ${index + 1}`);
    pointInsideMargin(terminal.at, circuit.viewBox, `terminal ${index + 1}`);
    if (circuit.domain === 'signal') {
      if (typeof terminal.signal !== 'string' || !terminal.signal.trim()) {
        fail(`terminal ${index + 1} needs a signal name`);
      }
      const endpoints = signals.get(terminal.signal) || [];
      endpoints.push(terminal.at);
      signals.set(terminal.signal, endpoints);
    } else if (terminal.signal !== undefined) {
      fail(`RF terminal ${index + 1} must not name a signal`);
    }
  }
  if (circuit.domain === 'rf') validateRfConnectivity(circuit, fail);
  if (circuit.domain === 'signal') {
    for (const [signal, endpoints] of signals) {
      const routed = (circuit.wires || []).filter(wire => wire.signal === signal);
      const graph = new Map();
      for (const wire of routed) {
        for (let index = 1; index < wire.points.length; index += 1) {
          const start = pointKey(wire.points[index - 1]);
          const end = pointKey(wire.points[index]);
          if (!graph.has(start)) graph.set(start, new Set());
          if (!graph.has(end)) graph.set(end, new Set());
          graph.get(start).add(end);
          graph.get(end).add(start);
        }
      }
      const distinct = new Set(endpoints.map(pointKey));
      if (distinct.size < 2 && !routed.length) continue;
      for (const point of endpoints) {
        if (!routed.some(wire => wire.points.some(wirePoint =>
          pointKey(wirePoint) === pointKey(point)))) {
          fail(`signal ${signal} has a connector or terminal without a wire endpoint`);
        }
      }
      const [first] = graph.keys();
      const visited = new Set([first]);
      const pending = [first];
      while (pending.length) {
        for (const neighbor of graph.get(pending.pop())) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            pending.push(neighbor);
          }
        }
      }
      if (visited.size !== graph.size) fail(`signal ${signal} has disconnected wires`);
    }
  }
  for (const [index, label] of (circuit.labels || []).entries()) {
    if (typeof label.text !== 'string') fail(`label ${index} needs text`);
    if (label.componentId !== undefined && !componentIds.has(label.componentId)) {
      fail(`label ${index} names an unknown component`);
    }
    pointOnGrid(label.at, 10, `label ${index}`);
    pointInsideMargin(label.at, circuit.viewBox, `label ${index}`);
  }
  for (const component of circuit.components) {
    if (component.symbol === 'rf/short.svg' &&
        !(circuit.labels || []).some(label => label.componentId === component.id &&
          /^Short(?:\(\))?$/.test(label.text))) {
      fail(`${component.id} needs a Short label linked by componentId`);
    }
  }
}

function pathData(points) {
  return points.map((point, index) =>
    `${index ? 'L' : 'M'}${point[0]} ${point[1]}`).join(' ');
}

function compose(circuit) {
  validateDescription(circuit);
  const metadata = escapeXml(JSON.stringify(circuit));
  const componentSvg = circuit.components.map(component => {
    const canonical = canonicalSymbol(component.symbol);
    const [x, y] = component.at;
    const portOne = canonical.ports[1];
    const [anchorX, anchorY] = component.sourceAnchor || [portOne.x, portOne.y];
    const rotation = component.rotation || 0;
    return `    <!-- ${escapeXml(component.id)} from ${escapeXml(component.symbol)} -->\n` +
      `    <g data-component-id="${escapeXml(component.id)}" ` +
      `data-symbol-source="${escapeXml(component.symbol)}" ` +
      `data-symbol-sha256="${canonical.sourceHash}" ` +
      `data-symbol-geometry-sha256="${canonical.geometryHash}" ` +
      `transform="translate(${x} ${y}) rotate(${rotation})` +
      `${component.mirrorY ? ' scale(1 -1)' : ''} translate(${-anchorX} ${-anchorY})">\n` +
      `      <!-- canonical-geometry-start -->\n${canonical.geometry}\n` +
      `      <!-- canonical-geometry-end -->\n    </g>`;
  }).join('\n');
  const wireSvg = (circuit.wires || []).map((wire, index) =>
    `    <path data-wire="${index + 1}"` +
    (circuit.domain === 'signal' ? ` data-signal="${escapeXml(wire.signal)}"` :
      ` data-node="${wire.node}"`) +
    ` d="${pathData(wire.points)}"/>`).join('\n');
  const terminalSvg = (circuit.terminals || []).map((terminal, index) =>
    `    <circle data-external-terminal="${index + 1}" cx="${terminal.at[0]}" ` +
    `cy="${terminal.at[1]}" r="4" fill="#202020"` +
    (circuit.domain === 'signal' ? ` data-signal="${escapeXml(terminal.signal)}"` :
      ` data-node="${terminal.node}"`) +
    '/>').join('\n');
  const connections = circuit.domain === 'rf' ? circuit.components.flatMap(component =>
    component.connections) : [];
  const uniqueConnections = [...new Map(connections.map(connection =>
    [`${connection.node}:${pointKey(connection.at)}`, connection])).values()];
  const nodeLabels = [...new Map(connections.map(connection => [connection.node, connection])).values()];
  const nodeDots = uniqueConnections.map(connection =>
    `    <circle data-node-dot="${connection.node}" cx="${connection.at[0]}" ` +
    `cy="${connection.at[1]}" r="4" fill="#202020"/>`).join('\n');
  const nodeCircles = nodeLabels.map(connection =>
    `    <circle data-node-circle="${connection.node}" cx="${connection.labelAt[0]}" ` +
    `cy="${connection.labelAt[1]}" r="12" fill="#ffffff"/>`).join('\n');
  const nodeSvg = [nodeDots, nodeCircles].filter(Boolean).join('\n');
  const nodeText = nodeLabels.map(connection =>
    `    <text data-node-label="${connection.node}" x="${connection.labelAt[0]}" ` +
    `y="${connection.labelAt[1] + 5}" text-anchor="middle">${connection.node}</text>`).join('\n');
  const labels = (circuit.labels || []).map(label =>
    `    <text x="${label.at[0]}" y="${label.at[1]}" ` +
    `text-anchor="${escapeXml(label.anchor || 'start')}">${escapeXml(label.text)}</text>`).join('\n');
  const [minX, minY, width, height] = circuit.viewBox;
  return `<svg xmlns="http://www.w3.org/2000/svg"\n` +
    `     viewBox="${minX} ${minY} ${width} ${height}"\n` +
    `     role="img" aria-labelledby="title description">\n` +
    `  <title id="title">${escapeXml(circuit.title)}</title>\n` +
    `  <desc id="description">${escapeXml(circuit.description)}</desc>\n` +
    `  <metadata id="circuit-description">${metadata}</metadata>\n` +
    `  <rect width="100%" height="100%" fill="#ffffff"/>\n` +
    `  <g fill="none" stroke="#202020" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round">\n${wireSvg}\n${terminalSvg}\n${componentSvg}\n${nodeSvg}\n  </g>\n` +
    `  <g fill="#202020" font-family="Arial, Helvetica, sans-serif" font-size="16">\n` +
    `${labels}\n${nodeText}\n  </g>\n</svg>\n`;
}

function runCli() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath || process.argv.includes('--help')) {
    process.stdout.write('Usage: node schematics/tools/compose-schematic.js DESCRIPTION.json OUTPUT.svg\n');
    process.exit(inputPath === '--help' ? 0 : 1);
  }
  const output = path.resolve(outputPath);
  const relative = path.relative(repositoryRoot, output);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    fail('output must be inside the nP repository');
  }
  fs.writeFileSync(output, compose(readDescription(inputPath)), 'utf8');
  process.stdout.write(`${relative}\n`);
}

module.exports = {compose, validateDescription};

if (require.main === module) {
  try {
    runCli();
  } catch (error) {
    process.stderr.write(`compose-schematic: ${error.message}\n`);
    process.exitCode = 1;
  }
}
