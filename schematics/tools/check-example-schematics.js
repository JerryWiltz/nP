#!/usr/bin/env node
// Modified: 2026-10-25
'use strict';

const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');
const {pathToFileURL} = require('url');
const {compose} = require('./compose-schematic');
const {parseXml, resolveSchematicPaths} = require('./symbol-library');

const {repositoryRoot} = resolveSchematicPaths(__dirname);

async function check() {
  const circuitRoot = path.join(repositoryRoot, 'schematics/circuits');
  const svgRoot = path.join(repositoryRoot, 'docs/public/schematics');
  const jsonNames = fs.readdirSync(circuitRoot).filter(name => name.endsWith('.json'))
    .map(name => name.slice(0, -5)).sort();
  const svgNames = fs.readdirSync(svgRoot).filter(name => name.endsWith('.svg'))
    .map(name => name.slice(0, -4)).sort();
  if (JSON.stringify(jsonNames) !== JSON.stringify(svgNames)) {
    throw new Error('circuit descriptions and SVG names differ');
  }
  for (const name of jsonNames) {
    const description = JSON.parse(fs.readFileSync(path.join(circuitRoot, `${name}.json`), 'utf8'));
    const svg = fs.readFileSync(path.join(svgRoot, `${name}.svg`), 'utf8');
    parseXml(svg, `${name}.svg`);
    if (compose(description) !== svg) throw new Error(`${name}.svg is stale`);
  }
  const themeRoot = path.join(repositoryRoot, 'docs/.vitepress/theme');
  const [{examples}, {schematicMap, examplesWithoutCircuits}] = await Promise.all([
    import(pathToFileURL(path.join(themeRoot, 'replExamples.js')).href),
    import(pathToFileURL(path.join(themeRoot, 'schematicMap.js')).href)
  ]);
  const ids = new Set(examples.map(example => example.id));
  if (ids.size !== examples.length) throw new Error('REPL example ids must be unique');
  for (const id of ids) {
    const mapped = schematicMap[id];
    if (Boolean(mapped) === examplesWithoutCircuits.has(id)) {
      throw new Error(`${id} needs exactly one schematic classification`);
    }
    for (const name of mapped || []) {
      if (!svgNames.includes(name)) throw new Error(`${id} references missing schematic ${name}`);
    }
  }
  for (const id of [...Object.keys(schematicMap), ...examplesWithoutCircuits]) {
    if (!ids.has(id)) throw new Error(`unknown REPL example ${id}`);
  }
  execFileSync(process.execPath, [path.join(__dirname, 'validate-schematic.js'),
    ...svgNames.map(name => path.join(svgRoot, `${name}.svg`))], {stdio: 'inherit'});
  process.stdout.write(`Checked ${jsonNames.length} schematics and ${examples.length} REPL examples.\n`);
}

if (require.main === module) {
  check().catch(error => {
    process.stderr.write(`check-example-schematics: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {check};
