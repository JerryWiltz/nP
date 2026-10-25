#!/usr/bin/env node
// Modified: 2026-10-25
'use strict';

const fs = require('fs');
const path = require('path');
const {listCanonicalSymbols, resolveSchematicPaths} = require('./symbol-library');
const {checkGallery} = require('./generate-symbol-gallery');

const {symbolRoot, repositoryRoot} = resolveSchematicPaths(__dirname);

function publicNames(relativePath) {
  const source = fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
  return [...source.matchAll(/export\s*\{([^}]+)\}/g)]
    .flatMap(match => match[1].split(',').map(name => name.trim()))
    .filter(Boolean);
}

try {
  const symbols = listCanonicalSymbols(symbolRoot);
  const symbolNames = new Set(symbols.map(symbol => symbol.filename));
  const catalog = JSON.parse(fs.readFileSync(
    path.join(repositoryRoot, 'schematics/symbol-catalog.json'), 'utf8'));
  const documentedHelpers = new Set([
    'chebyLPgk', 'chebyLPLCs', 'chebyLPNsec', 'nodal', 'cascade'
  ]);
  const expected = new Set([
    ...publicNames('src/np-nport/src/index.js').filter(name => !documentedHelpers.has(name)),
    ...publicNames('src/np-digital/index.js'),
    'FFT', 'invFFT'
  ]);
  const actual = new Set(Object.keys(catalog.constructors || {}));
  for (const name of expected) {
    if (!actual.has(name)) throw new Error(`public constructor has no symbol: ${name}`);
  }
  for (const name of actual) {
    if (!expected.has(name)) throw new Error(`catalog entry is not a public constructor: ${name}`);
    if (!symbolNames.has(catalog.constructors[name])) {
      throw new Error(`catalog symbol is missing: ${name} -> ${catalog.constructors[name]}`);
    }
  }
  for (const [name, variants] of Object.entries(catalog.symbolVariants || {})) {
    if (!actual.has(name)) throw new Error(`symbol variant has no catalog entry: ${name}`);
    for (const variant of variants) {
      if (!symbolNames.has(variant)) throw new Error(`symbol variant is missing: ${variant}`);
    }
  }
  const mapped = new Set([
    ...Object.values(catalog.constructors),
    ...Object.values(catalog.symbolVariants || {}).flat()
  ]);
  for (const filename of symbolNames) {
    if (!mapped.has(filename)) throw new Error(`canonical symbol has no catalog mapping: ${filename}`);
  }
  const gallerySources = checkGallery();
  const galleryNames = new Set(gallerySources);
  for (const filename of symbolNames) {
    if (!galleryNames.has(filename)) throw new Error(`canonical symbol is absent from gallery: ${filename}`);
  }
  for (const filename of galleryNames) {
    if (!symbolNames.has(filename)) throw new Error(`gallery has no canonical symbol: ${filename}`);
  }
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(symbols.map(symbol => ({
      filename: symbol.filename,
      sha256: symbol.sourceHash,
      geometrySha256: symbol.geometryHash,
      ports: symbol.ports
    })), null, 2)}\n`);
  } else {
    process.stdout.write(`Validated ${symbols.length} canonical symbol(s), ${actual.size} public mappings, and the gallery.\n`);
  }
} catch (error) {
  process.stderr.write(`validate-symbol-library: ${error.message}\n`);
  process.exit(1);
}
