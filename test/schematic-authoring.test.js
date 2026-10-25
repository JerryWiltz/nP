// Modified: 2026-10-25
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {examples} from '../docs/.vitepress/theme/replExamples.js';
import {schematicMap, examplesWithoutCircuits} from '../docs/.vitepress/theme/schematicMap.js';

const require = createRequire(import.meta.url);
const {compose, validateDescription} = require('../schematics/tools/compose-schematic.js');
const {parseSymbol} = require('../schematics/tools/symbol-library.js');
const {checkGallery, generateGallery} = require('../schematics/tools/generate-symbol-gallery.js');

function circuit(name) {
  return JSON.parse(readFileSync(new URL(`../schematics/circuits/${name}.json`, import.meta.url), 'utf8'));
}

test('RF and signal diagrams recompose to their published SVGs', () => {
  for (const name of ['series-resistor', 'two-series-resistors', 'waveform-fft']) {
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
  assert.throws(() => validateDescription(signal), /20-unit grid/);
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
      id: 'short1', symbol: 'rf/short.svg', at: [80, 100],
      connections: [{port: 1, node: 1, at: [80, 100], labelAt: [80, 60]}]
    }]
  };
  assert.throws(() => validateDescription(description), /needs a Short label/);
  description.labels = [{componentId: 'short1', text: 'Short', at: [120, 60]}];
  assert.doesNotThrow(() => validateDescription(description));
});

test('canonical symbols reject embedded raster images', () => {
  const source = readFileSync(new URL('../schematics/symbols/rf/resistor.svg', import.meta.url), 'utf8');
  const unsafe = source.replace('</svg>', '<image href="data:image/png;base64,AAAA"/></svg>');
  assert.throws(() => parseSymbol(unsafe), /unsafe canonical symbol/);
});

test('canonical symbols reject malformed XML', () => {
  const source = readFileSync(new URL('../schematics/symbols/rf/resistor.svg', import.meta.url), 'utf8');
  const malformed = source.replace('</svg>', '</g></svg>');
  assert.throws(() => parseSymbol(malformed), /not well-formed XML/);
});

test('the gallery can be regenerated from canonical SVGs', () => {
  const published = readFileSync(new URL('../dev/canonicalSymbolsDevelopment.html', import.meta.url), 'utf8');
  assert.equal(generateGallery(), published);
  assert.equal(checkGallery().length, 57);
});

test('every REPL example has an explicit schematic classification', () => {
  const ids = new Set(examples.map(example => example.id));
  assert.equal(ids.size, examples.length);
  for (const id of ids) {
    assert.notEqual(Boolean(schematicMap[id]), examplesWithoutCircuits.has(id));
    for (const name of schematicMap[id] || []) {
      const description = JSON.parse(readFileSync(
        new URL(`../schematics/circuits/${name}.json`, import.meta.url), 'utf8'));
      const published = readFileSync(
        new URL(`../docs/public/schematics/${name}.svg`, import.meta.url), 'utf8');
      assert.equal(compose(description), published, `${id}: ${name}`);
    }
  }
  for (const id of [...Object.keys(schematicMap), ...examplesWithoutCircuits]) {
    assert.ok(ids.has(id), `unknown example ${id}`);
  }
});

test('microstrip bend port 2 follows the labeled turn direction', () => {
  const leftSource = readFileSync(new URL('../schematics/symbols/rf/microstrip-left-bend.svg', import.meta.url), 'utf8');
  const rightSource = readFileSync(new URL('../schematics/symbols/rf/microstrip-right-bend.svg', import.meta.url), 'utf8');
  const left = parseSymbol(leftSource).ports;
  const right = parseSymbol(rightSource).ports;

  assert.deepEqual(left[1], {x: 0, y: 60});
  assert.deepEqual(left[2], {x: 60, y: 0});
  assert.deepEqual(right[1], {x: 0, y: 60});
  assert.deepEqual(right[2], {x: 60, y: 120});
});

test('symbols and circuit descriptions enforce the common grid and rotation', () => {
  const source = readFileSync(new URL('../schematics/symbols/rf/resistor.svg', import.meta.url), 'utf8');
  assert.throws(() => parseSymbol(source.replace('cx="60" cy="80"', 'cx="61" cy="80"')),
    /terminal off the 20-unit grid/);
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
  assert.throws(() => validateDescription(rf), /20-unit grid/);
});

test('mirroring a placed Tee moves its public ports with the body', () => {
  const circuit = JSON.parse(readFileSync(
    new URL('../schematics/circuits/wilkinson-divider.json', import.meta.url), 'utf8'));
  const tee = circuit.components.find(component => component.id === 'outputTee2');
  assert.equal(tee.mirrorY, true);
  assert.deepEqual(tee.connections.map(connection => connection.at),
    [[560, 520], [520, 560], [600, 560]]);
  assert.doesNotThrow(() => validateDescription(circuit));
  tee.mirrorY = false;
  assert.throws(() => validateDescription(circuit), /must be at/);
});
