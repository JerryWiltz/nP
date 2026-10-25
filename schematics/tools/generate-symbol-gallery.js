#!/usr/bin/env node
// Modified: 2026-10-25
'use strict';

const fs = require('fs');
const path = require('path');
const {parseSymbol, resolveSchematicPaths} = require('./symbol-library');

const {symbolRoot, repositoryRoot} = resolveSchematicPaths(__dirname);
const templatePath = path.join(repositoryRoot, 'schematics/symbol-gallery.template.html');
const galleryPath = path.join(repositoryRoot, 'dev/canonicalSymbolsDevelopment.html');

function gallerySources(template) {
  return [...template.matchAll(/\{\{SYMBOL:((?:rf|digital)\/[a-z0-9-]+\.svg)\}\}/g)]
    .map(match => match[1]);
}

function generateGallery() {
  const template = fs.readFileSync(templatePath, 'utf8');
  const sources = gallerySources(template);
  const embedded = [...template.matchAll(/data-symbol-source="([^"]+)"/g)].map(match => match[1]);
  if (!sources.length || new Set(sources).size !== sources.length) {
    throw new Error('gallery template needs one placeholder per canonical symbol');
  }
  if (embedded.length !== sources.length ||
      embedded.some((filename, index) => filename !== sources[index])) {
    throw new Error('gallery template sources and placeholders must match in order');
  }
  let output = template;
  for (const filename of sources) {
    const source = fs.readFileSync(path.join(symbolRoot, filename), 'utf8');
    parseSymbol(source, filename);
    const body = /<rect\b[^>]*width="100%"[^>]*height="100%"[^>]*fill="#ffffff"[^>]*\/>\s*([\s\S]*?)\s*<\/svg>\s*$/.exec(source);
    if (!body) throw new Error(`${filename} has no embeddable SVG body`);
    const indented = body[1].split('\n').map(line => line.trim() ? `        ${line}` : '').join('\n');
    output = output.replace(`{{SYMBOL:${filename}}}`, indented);
  }
  return output;
}

function checkGallery() {
  const expected = generateGallery();
  const actual = fs.readFileSync(galleryPath, 'utf8');
  if (actual !== expected) {
    throw new Error('symbol gallery is stale; run npm run symbols:gallery');
  }
  return gallerySources(fs.readFileSync(templatePath, 'utf8'));
}

if (require.main === module) {
  try {
    if (process.argv.includes('--check')) {
      const sources = checkGallery();
      process.stdout.write(`Gallery matches ${sources.length} canonical SVGs.\n`);
    } else {
      fs.writeFileSync(galleryPath, generateGallery());
      process.stdout.write(`Rebuilt ${path.relative(repositoryRoot, galleryPath)}.\n`);
    }
  } catch (error) {
    process.stderr.write(`generate-symbol-gallery: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {checkGallery, gallerySources, generateGallery};
