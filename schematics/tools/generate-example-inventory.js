#!/usr/bin/env node
// Modified: 2026-10-25
'use strict';

const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');
const {resolveSchematicPaths} = require('./symbol-library');

const {repositoryRoot} = resolveSchematicPaths(__dirname);

async function inventory() {
  const theme = path.join(repositoryRoot, 'docs/.vitepress/theme');
  const [{examples}, {schematicMap, examplesWithoutCircuits}] = await Promise.all([
    import(pathToFileURL(path.join(theme, 'replExamples.js')).href),
    import(pathToFileURL(path.join(theme, 'schematicMap.js')).href)
  ]);
  const ids = new Set(examples.map(example => example.id));
  for (const example of examples) {
    const mapped = schematicMap[example.id];
    if (Boolean(mapped) === examplesWithoutCircuits.has(example.id)) {
      throw new Error(`${example.id} needs exactly one classification`);
    }
    for (const name of mapped || []) {
      if (!fs.existsSync(path.join(repositoryRoot, 'docs/public/schematics', `${name}.svg`))) {
        throw new Error(`${example.id} references missing schematic ${name}`);
      }
    }
  }
  for (const id of [...Object.keys(schematicMap), ...examplesWithoutCircuits]) {
    if (!ids.has(id)) throw new Error(`schematic map has no REPL example ${id}`);
  }
  const lines = [
    '<!-- Modified: 2026-10-25 -->',
    '',
    '# REPL schematic inventory',
    '',
    'Each row follows a stable REPL example ID. Circuits with the same topology share a canonical drawing; examples that compare two circuits link to both. RF and digital signal flow appear in separate SVGs where necessary. Math-only examples have no circuit schematic.',
    '',
    '| REPL example | Schematic drawings |',
    '| --- | --- |'
  ];
  for (const example of examples) {
    const drawings = schematicMap[example.id];
    const links = drawings ? drawings.map(name =>
      `[${name}](../docs/public/schematics/${name}.svg)`).join(', ') : 'No circuit';
    lines.push(`| [${example.title}](../docs/repl.md#example-${example.id}) | ${links} |`);
  }
  lines.push(
    '',
    '## Additional Guide circuits',
    '',
    '| Guide example | Schematic |',
    '| --- | --- |',
    '| [Wilkinson divider](../docs/circuit-examples.md#wilkinson-power-divider) | [wilkinson-divider](../docs/public/schematics/wilkinson-divider.svg) |',
    '| [Low-pass filter four ways](../docs/circuit-examples.md#low-pass-filter-four-ways) | [clc-low-pass-four-ways](../docs/public/schematics/clc-low-pass-four-ways.svg) |',
    '| [Pi attenuator](../docs/circuit-examples.md#pi-attenuator) | [pi-attenuator](../docs/public/schematics/pi-attenuator.svg) |',
    '| [Edge-coupled filter](../docs/circuit-examples.md#edge-coupled-bandpass-filter) | [edge-coupled-bandpass](../docs/public/schematics/edge-coupled-bandpass.svg) |',
    '| [Reused stage and attenuator](../docs/connecting-nports.md#reuse-a-completed-circuit) | [stage-and-attenuator](../docs/public/schematics/stage-and-attenuator.svg) |',
    '| [Amplifier stage](../docs/diodes-and-active-components.md#amplifier) | [amplifier](../docs/public/schematics/amplifier.svg) |',
    '',
    'Other Guide snippets reuse these topologies or show individual constructor behavior through the canonical symbol gallery. The editable descriptions are under `schematics/circuits/`. Run `npm run schematics:build`, then validate all SVGs after source or symbol changes. Review each drawing against its source code; the generators do not parse arbitrary JavaScript.'
  );
  fs.writeFileSync(path.join(repositoryRoot, 'schematics/example-inventory.md'), `${lines.join('\n')}\n`);
  return examples.length;
}

if (require.main === module) {
  inventory().then(count => process.stdout.write(`Inventoried ${count} REPL examples.\n`))
    .catch(error => {process.stderr.write(`generate-example-inventory: ${error.message}\n`); process.exitCode = 1;});
}

module.exports = {inventory};
