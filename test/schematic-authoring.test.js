// Modified: 2026-11-07
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {compose, validateDescription} = require('../schematics/tools/compose-schematic.js');
const {parseSymbol} = require('../schematics/tools/symbol-library.js');
const {checkGallery, generateGallery} = require('../schematics/tools/generate-symbol-gallery.js');
const {documentationReferences} = require('../schematics/tools/check-example-schematics.js');

function circuit(name) {
  return JSON.parse(readFileSync(new URL(`../schematics/circuits/${name}.json`, import.meta.url), 'utf8'));
}

test('RF and signal diagrams recompose to their published SVGs', () => {
  const names = readdirSync(new URL('../schematics/circuits/', import.meta.url))
    .filter(name => name.endsWith('.json')).map(name => name.slice(0, -5));
  for (const name of names) {
    const description = circuit(name);
    const published = readFileSync(new URL(`../docs/public/schematics/${name}.svg`, import.meta.url), 'utf8');
    assert.equal(compose(description), published);
    assert.equal(published.includes('data-node-circle='), description.domain === 'rf');
    assert.match(published, /font-size="16"/);
  }
});

test('RF node numbers follow routed wires between distinct port coordinates', () => {
  const description = circuit('two-series-resistors');
  assert.doesNotThrow(() => validateDescription(description));
  const sharedPorts = [description.components[0].connections[1],
    description.components[1].connections[0]];
  assert.equal(sharedPorts[0].node, sharedPorts[1].node);
  assert.notDeepEqual(sharedPorts[0].at, sharedPorts[1].at);

  const missing = structuredClone(description);
  missing.wires.splice(1, 1);
  assert.throws(() => validateDescription(missing), /node 2 has no wire/);

  const wrongNode = structuredClone(description);
  wrongNode.wires[1].node = 1;
  assert.throws(() => validateDescription(wrongNode), /wire crosses node 2 terminal/);

  const dangling = structuredClone(description);
  dangling.wires[1].points.push([380, 140]);
  assert.throws(() => validateDescription(dangling), /dangling wire/);

  const wrongSymbol = structuredClone(description);
  wrongSymbol.components[0].source.constructor = 'L';
  assert.throws(() => validateDescription(wrongSymbol), /source constructor does not map/);
});

test('domain, layout, grid, and signal routes are required', () => {
  const rf = circuit('series-resistor');
  const signal = circuit('waveform-fft');
  delete rf.layout;
  assert.throws(() => validateDescription(rf), /layout needs/);
  signal.components[0].connections[0].node = 1;
  assert.throws(() => validateDescription(signal), /signal name only/);
  delete signal.components[0].connections[0].node;
  signal.wires[0].points[0] = [241, 140];
  assert.throws(() => validateDescription(signal), /10-unit grid/);
  signal.wires[0].points = [[240, 140], [260, 140]];
  signal.wires.push({signal: 'samples', points: [[300, 140], [320, 140]]});
  assert.throws(() => validateDescription(signal), /disconnected wires/);
});

test('a composed Short requires its visible component label', () => {
  const description = {
    title: 'Short', description: 'A one-port Short at node 1.', domain: 'rf',
    viewBox: [0, 0, 240, 200],
    layout: {centerAxisX: 120, centerReference: 'Short body'},
    components: [{
      id: 'short1', symbol: 'short.svg', at: [80, 100],
      connections: [{port: 1, node: 1, at: [80, 100], labelAt: [80, 60]}]
    }]
  };
  assert.throws(() => validateDescription(description), /needs a Short label/);
  description.labels = [{componentId: 'short1', text: 'Short', at: [120, 60]}];
  assert.doesNotThrow(() => validateDescription(description));
});

test('canonical symbols reject embedded raster images', () => {
  const source = readFileSync(new URL('../schematics/symbols/resistor.svg', import.meta.url), 'utf8');
  const unsafe = source.replace('</svg>', '<image href="data:image/png;base64,AAAA"/></svg>');
  assert.throws(() => parseSymbol(unsafe), /unsafe canonical symbol/);
});

test('canonical symbols reject malformed XML', () => {
  const source = readFileSync(new URL('../schematics/symbols/resistor.svg', import.meta.url), 'utf8');
  const malformed = source.replace('</svg>', '</g></svg>');
  assert.throws(() => parseSymbol(malformed), /not well-formed XML/);
});

test('the gallery can be regenerated from canonical SVGs', () => {
  const published = readFileSync(new URL('../dev/canonicalSymbols.html', import.meta.url), 'utf8');
  assert.equal(generateGallery(), published);
  assert.equal(checkGallery().length, 60);
});

test('documentation schematic references resolve to current descriptions and SVGs', () => {
  const references = documentationReferences();
  assert.ok(references.size > 0);
  for (const name of references) {
    const published = readFileSync(
      new URL(`../docs/public/schematics/${name}.svg`, import.meta.url), 'utf8');
    assert.equal(compose(circuit(name)), published, name);
  }
});

test('microstrip bend port 2 follows the labeled turn direction', () => {
  const leftSource = readFileSync(new URL('../schematics/symbols/microstrip-left-bend.svg', import.meta.url), 'utf8');
  const rightSource = readFileSync(new URL('../schematics/symbols/microstrip-right-bend.svg', import.meta.url), 'utf8');
  const left = parseSymbol(leftSource).ports;
  const right = parseSymbol(rightSource).ports;

  assert.deepEqual(left[1], {x: 0, y: 60});
  assert.deepEqual(left[2], {x: 60, y: 0});
  assert.deepEqual(right[1], {x: 0, y: 60});
  assert.deepEqual(right[2], {x: 60, y: 120});
});

test('symbols and circuit descriptions enforce the common grid and rotation', () => {
  const source = readFileSync(new URL('../schematics/symbols/resistor.svg', import.meta.url), 'utf8');
  assert.throws(() => parseSymbol(source.replace('cx="60" cy="80"', 'cx="61" cy="80"')),
    /terminal off the 10-unit grid/);
  assert.throws(() => parseSymbol(source.replace('fill="#ffffff"', 'fill="#eeeeee"')),
    /only dark ink, white, or no fill/);
  assert.throws(() => parseSymbol(source.replace('font-size="13"', 'font-size="8"')),
    /canonical Arial, Helvetica, sans-serif text at 13 units/);
  assert.throws(() => parseSymbol(source.replace('</svg>', '<g transform="rotate(45)"/></svg>')),
    /multiple of 90 degrees/);

  const rf = circuit('series-resistor');
  rf.components[0].rotation = 45;
  assert.throws(() => validateDescription(rf), /multiple of 90/);
  rf.components[0].rotation = 0;
  rf.components[0].connections[0].at = [121, 120];
  assert.throws(() => validateDescription(rf), /10-unit grid/);
});

test('canonical terminal placement accepts half of the former grid step', () => {
  const source = readFileSync(new URL('../schematics/symbols/resistor.svg', import.meta.url), 'utf8');
  assert.doesNotThrow(() => parseSymbol(source.replace('cx="60" cy="80"', 'cx="70" cy="80"')));
});

test('a complete circuit may be translated ten units without breaking connectivity', () => {
  const description = circuit('two-series-resistors');
  description.viewBox[0] += 10;
  description.layout.centerAxisX += 10;
  for (const component of description.components) {
    component.at[0] += 10;
    for (const connection of component.connections) {
      connection.at[0] += 10;
      connection.labelAt[0] += 10;
    }
  }
  for (const wire of description.wires) for (const point of wire.points) point[0] += 10;
  for (const terminal of description.terminals || []) terminal.at[0] += 10;
  for (const label of description.labels || []) label.at[0] += 10;
  assert.doesNotThrow(() => validateDescription(description));
});
