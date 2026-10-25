// Modified: 2026-10-25
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {DOMParser} = require('@xmldom/xmldom');

function parseXml(source, filename) {
  let document;
  try {
    document = new DOMParser({
      onError(level, message) {
        throw new Error(`${level}: ${message}`);
      }
    }).parseFromString(source, 'image/svg+xml');
  } catch (error) {
    throw new Error(`${filename} is not well-formed XML: ${error.message}`);
  }
  if (document.documentElement.localName !== 'svg' ||
      document.documentElement.namespaceURI !== 'http://www.w3.org/2000/svg') {
    throw new Error(`${filename} needs an SVG root element`);
  }
  return document;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function parseAttributes(tag) {
  const attributes = {};
  for (const match of tag.matchAll(/([A-Za-z_:][-A-Za-z0-9_:.]*)="([^"]*)"/g)) {
    attributes[match[1]] = match[2];
  }
  return attributes;
}

function parseSymbol(source, filename = 'symbol.svg') {
  parseXml(source, filename);
  const withoutNamespace = source.replace('http://www.w3.org/2000/svg', '');
  if (/<(?:script|foreignObject|image|use|animate\w*|set|style|a\b)|\son[a-z]+\s*=|\s(?:xlink:)?href\s*=|https?:\/\/|data:/i.test(withoutNamespace)) {
    throw new Error(`unsafe canonical symbol: ${filename}`);
  }
  for (const required of ['<svg', '</svg>', '<title', '<desc', 'viewBox=']) {
    if (!source.includes(required)) throw new Error(`${filename} is missing ${required}`);
  }
  const viewBox = /viewBox="([^"]+)"/.exec(source);
  const bounds = viewBox && viewBox[1].trim().split(/\s+/).map(Number);
  if (!bounds || bounds.length !== 4 || bounds.some(number => !Number.isFinite(number)) ||
      bounds[2] <= 0 || bounds[3] <= 0 || bounds[2] % 20 || bounds[3] % 20) {
    throw new Error(`${filename} needs a viewBox with 20-unit grid dimensions`);
  }
  for (const match of source.matchAll(/rotate\(([^)]*)\)/g)) {
    const degrees = Number(match[1].trim().split(/[\s,]+/)[0]);
    if (!Number.isFinite(degrees) || degrees % 90 !== 0) {
      throw new Error(`${filename} rotation must be a multiple of 90 degrees`);
    }
  }
  const fontFamilies = [...source.matchAll(/font-family="([^"]+)"/g)].map(match => match[1]);
  const fontSizes = [...source.matchAll(/font-size="([^"]+)"/g)].map(match => match[1]);
  if (!fontFamilies.length || fontFamilies.some(family => family !== 'Arial, Helvetica, sans-serif') ||
      !fontSizes.length || fontSizes.some(size => size !== '13') ||
      /font-weight="(?!normal")/.test(source)) {
    throw new Error(`${filename} needs canonical Arial, Helvetica, sans-serif text at 13 units and normal weight`);
  }
  for (const match of source.matchAll(/\b(?:fill|stroke)="([^"]+)"/g)) {
    if (!['#202020', '#ffffff', 'none'].includes(match[1])) {
      throw new Error(`${filename} must use only dark ink, white, or no fill`);
    }
  }

  const labelGroup = /<g\b[^>]*font-family="[^"]+"[^>]*>[\s\S]*?<\/g>/i.exec(source);
  if (!labelGroup) throw new Error(`${filename} has no label and terminal group`);
  const background = /<rect\b[^>]*width="100%"[^>]*height="100%"[^>]*fill="#ffffff"[^>]*\/>/i.exec(source);
  if (!background || background.index > labelGroup.index) {
    throw new Error(`${filename} has no canonical white background before its geometry`);
  }
  const geometryStart = background.index + background[0].length;
  const geometry = source.slice(geometryStart, labelGroup.index).trim();
  if (!geometry) throw new Error(`${filename} has no component geometry`);

  const portNumbers = [...labelGroup[0].matchAll(/>\s*Port\s+([1-9][0-9]*)\s*<\/text>/g)]
    .map(match => Number(match[1]));
  if (!portNumbers.length) throw new Error(`${filename} has no public port labels`);
  const expectedNumbers = Array.from({length: portNumbers.length}, (_, index) => index + 1);
  if (portNumbers.some((number, index) => number !== expectedNumbers[index])) {
    throw new Error(`${filename} port labels must appear once in constructor order`);
  }

  const circles = [...labelGroup[0].matchAll(/<circle\b[^>]*\/>/g)].map(match => {
    const attributes = parseAttributes(match[0]);
    return {x: Number(attributes.cx), y: Number(attributes.cy), radius: Number(attributes.r)};
  }).filter(circle => [circle.x, circle.y, circle.radius].every(Number.isFinite));
  const terminalRadius = Math.max(...circles.map(circle => circle.radius));
  const terminals = circles.filter(circle => circle.radius === terminalRadius);
  if (terminals.length !== portNumbers.length) {
    throw new Error(`${filename} has ${portNumbers.length} port labels but ${terminals.length} terminal dots`);
  }
  if (terminals.some(terminal => terminal.x % 20 || terminal.y % 20)) {
    throw new Error(`${filename} has a terminal off the 20-unit grid`);
  }

  return {
    filename,
    sourceHash: sha256(source),
    geometry,
    geometryHash: sha256(geometry),
    ports: Object.fromEntries(terminals.map((terminal, index) => [index + 1, {
      x: terminal.x,
      y: terminal.y
    }]))
  };
}

function readCanonicalSymbol(symbolRoot, filename) {
  if (!/^(rf|digital)\/[a-z0-9-]+\.svg$/.test(filename)) {
    throw new Error(`invalid symbol filename: ${filename}`);
  }
  const sourcePath = path.join(symbolRoot, filename);
  if (!fs.existsSync(sourcePath)) throw new Error(`canonical symbol not found: ${filename}`);
  return parseSymbol(fs.readFileSync(sourcePath, 'utf8'), filename);
}

function listCanonicalSymbols(symbolRoot) {
  return ['rf', 'digital'].flatMap(category =>
    fs.readdirSync(path.join(symbolRoot, category))
      .filter(filename => filename.endsWith('.svg'))
      .sort()
      .map(filename => readCanonicalSymbol(symbolRoot, `${category}/${filename}`)));
}

function resolveSchematicPaths(toolDirectory) {
  const schematicRoot = path.resolve(toolDirectory, '..');
  return {
    symbolRoot: path.join(schematicRoot, 'symbols'),
    repositoryRoot: path.resolve(schematicRoot, '..')
  };
}

function transformedPoint(point, anchor, placement, rotation, mirrorY = false) {
  const radians = rotation * Math.PI / 180;
  const dx = point.x - anchor[0];
  const dy = (point.y - anchor[1]) * (mirrorY ? -1 : 1);
  return [
    Math.round((placement[0] + dx * Math.cos(radians) - dy * Math.sin(radians)) * 1e9) / 1e9,
    Math.round((placement[1] + dx * Math.sin(radians) + dy * Math.cos(radians)) * 1e9) / 1e9
  ];
}

module.exports = {
  listCanonicalSymbols,
  parseXml,
  parseSymbol,
  readCanonicalSymbol,
  resolveSchematicPaths,
  sha256,
  transformedPoint
};
