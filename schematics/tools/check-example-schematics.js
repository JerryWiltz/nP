#!/usr/bin/env node
// Modified: 2026-11-07
'use strict';

const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');
const {compose} = require('./compose-schematic');
const {parseXml, resolveSchematicPaths} = require('./symbol-library');

const {repositoryRoot} = resolveSchematicPaths(__dirname);

function documentationReferences(directory = path.join(repositoryRoot, 'docs')) {
  const references = new Set();
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (['_archive', 'public', '.vitepress'].includes(entry.name)) continue;
      for (const name of documentationReferences(filename)) references.add(name);
    } else if (entry.name.endsWith('.md')) {
      const markdown = fs.readFileSync(filename, 'utf8');
      for (const match of markdown.matchAll(/\/schematics\/([a-z0-9-]+)\.svg\b/g)) {
        references.add(match[1]);
      }
    }
  }
  return references;
}

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
  const referenced = documentationReferences();
  for (const name of referenced) {
    if (!svgNames.includes(name)) throw new Error(`documentation references missing schematic ${name}`);
  }
  execFileSync(process.execPath, [path.join(__dirname, 'validate-schematic.js'),
    ...svgNames.map(name => path.join(svgRoot, `${name}.svg`))], {stdio: 'inherit'});
  process.stdout.write(`Checked ${jsonNames.length} static schematics and ${referenced.size} documentation drawings.\n`);
}

if (require.main === module) {
  check().catch(error => {
    process.stderr.write(`check-example-schematics: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {check, documentationReferences};
