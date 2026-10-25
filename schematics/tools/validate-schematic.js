#!/usr/bin/env node
// Modified: 2026-10-24
'use strict';

const fs = require('fs');
const path = require('path');
const {compose} = require('./compose-schematic');

function error(message) {
  process.stderr.write(`validate-schematic: ${message}\n`);
  process.exitCode = 1;
}

function decodeXml(value) {
  return value.replaceAll('&quot;', '"').replaceAll('&apos;', "'")
    .replaceAll('&gt;', '>').replaceAll('&lt;', '<').replaceAll('&amp;', '&');
}

function distanceToSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (!dx && !dy) return Math.hypot(point[0] - start[0], point[1] - start[1]);
  const projection = ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) /
    (dx * dx + dy * dy);
  const amount = Math.max(0, Math.min(1, projection));
  return Math.hypot(
    point[0] - (start[0] + amount * dx),
    point[1] - (start[1] + amount * dy)
  );
}

function segmentIntersectsRectangle(start, end, rectangle) {
  if (start[1] === end[1]) {
    const left = Math.min(start[0], end[0]);
    const right = Math.max(start[0], end[0]);
    return start[1] >= rectangle.top && start[1] <= rectangle.bottom &&
      right >= rectangle.left && left <= rectangle.right;
  }
  if (start[0] === end[0]) {
    const top = Math.min(start[1], end[1]);
    const bottom = Math.max(start[1], end[1]);
    return start[0] >= rectangle.left && start[0] <= rectangle.right &&
      bottom >= rectangle.top && top <= rectangle.bottom;
  }
  return false;
}

function validate(file) {
  const svg = fs.readFileSync(file, 'utf8');
  const metadata = svg.match(/<metadata id="circuit-description">([\s\S]*?)<\/metadata>/);
  if (!metadata) {
    error(`${file} has no circuit-description metadata`);
    return;
  }
  let circuit;
  try {
    circuit = JSON.parse(decodeXml(metadata[1]));
  } catch (parseError) {
    error(`${file} has invalid embedded JSON: ${parseError.message}`);
    return;
  }
  let expected;
  try {
    expected = compose(circuit);
  } catch (compositionError) {
    error(`${file} has an invalid description: ${compositionError.message}`);
    return;
  }
  if (svg !== expected) {
    error(`${file} differs from its description or canonical symbols; regenerate it`);
    return;
  }

  const wireSegments = (circuit.wires || []).flatMap(wire =>
    wire.points.slice(1).map((end, index) => ({start: wire.points[index], end})));
  if (circuit.domain === 'rf') {
    const nodes = new Map();
    for (const component of circuit.components) {
      for (const connection of component.connections) {
        nodes.set(connection.node, connection.labelAt);
      }
    }
    for (const [node, center] of nodes) {
      for (const segment of wireSegments) {
        if (distanceToSegment(center, segment.start, segment.end) < 20) {
          error(`${file} node ${node} circle is less than 8 units from a wire`);
        }
      }
    }
  }
  const [minX, minY, width, height] = circuit.viewBox;
  for (const label of circuit.labels || []) {
    const estimatedWidth = label.text.length * 8;
    let left = label.at[0];
    if (label.anchor === 'middle') left -= estimatedWidth / 2;
    if (label.anchor === 'end') left -= estimatedWidth;
    const rectangle = {
      left: left - 4,
      right: left + estimatedWidth + 4,
      top: label.at[1] - 19,
      bottom: label.at[1] + 8
    };
    if (rectangle.left < minX + 40 || rectangle.right > minX + width - 40 ||
        rectangle.top < minY + 40 || rectangle.bottom > minY + height - 40) {
      error(`${file} label "${label.text}" enters the 40-unit margin`);
    }
    for (const segment of wireSegments) {
      if (segmentIntersectsRectangle(segment.start, segment.end, rectangle)) {
        error(`${file} label "${label.text}" overlaps a wire`);
      }
    }
  }
}

const files = process.argv.slice(2);
if (!files.length || files.includes('--help')) {
  process.stdout.write('Usage: node schematics/tools/validate-schematic.js SCHEMATIC.svg [...]\n');
  process.exit(files.includes('--help') ? 0 : 1);
}
for (const filename of files) validate(path.resolve(filename));
if (!process.exitCode) process.stdout.write(`Validated ${files.length} schematic(s).\n`);
