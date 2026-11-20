// Modified: 2026-11-19
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as nP from '../../src/index.js';
import {schematicSymbols} from '../../src/np-chart/src/schematicSymbols.js';
import {schematicSymbolMap, schematicSymbolVariants} from '../../src/np-nport/src/schematicSymbolMap.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const source = readFileSync(resolve(root, 'src/np-nport/src/index.js'), 'utf8');
const catalog = JSON.parse(readFileSync(resolve(root, 'schematics/symbol-catalog.json'), 'utf8'));
const names = [...source.matchAll(/export \{(\w+)\} from '\.\/(.*?)';/g)]
    .filter(([, name, module]) => !module.startsWith('filters/') &&
        !module.startsWith('combining/'))
    .map(([, name]) => name);

function checkPart(name, part, expected) {
    const symbol = schematicSymbols[expected];
    const row = part.spars?.[0];
    const portCount = row && Math.sqrt(row.length - 1);
    if (part._schematic?.kind !== 'component' || part._schematic.symbol !== expected ||
        !symbol || !Number.isInteger(portCount) || symbol.ports.length !== portCount) {
        throw new Error(`${name}: constructor, metadata, bundled symbol, or port count disagree`);
    }
}

nP.global.fList = [2e9];
for (const name of names) {
    const expected = catalog.constructors[name]?.replace(/\.svg$/, '');
    if (!expected || schematicSymbolMap[name] !== expected) {
        throw new Error(`${name}: generated constructor map differs from the catalog`);
    }
    checkPart(name, nP[name](), expected);
}
const variantOptions = {mbend: {left: {turn: 'left'}, right: {turn: 'right'}},
    NMOS: {external: {body: 'external'}}, PMOS: {external: {body: 'external'}}};
for (const [name, variants] of Object.entries(catalog.symbolVariants)) for (const [variant, filename] of Object.entries(variants)) {
    const expected = filename.replace(/\.svg$/, ''), options = variantOptions[name]?.[variant];
    if (schematicSymbolVariants[name]?.[variant] !== expected || !options) {
        throw new Error(name + ' ' + variant + ': variant map or constructor verification fixture is missing');
    }
    checkPart(name + ' ' + variant, nP[name](options), expected);
}
if (nP.lpfGen()._schematic?.kind !== 'cascade') {
    throw new Error('lpfGen: expected inherited cascade schematic metadata');
}
process.stdout.write(`Checked ${names.length} RF constructor symbols, option-dependent variants, and lpfGen.\n`);
