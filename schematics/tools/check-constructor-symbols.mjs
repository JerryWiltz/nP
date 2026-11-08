// Modified: 2026-11-04
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
for (const [variant, filename] of Object.entries(catalog.symbolVariants.mbend)) {
    const expected = filename.replace(/\.svg$/, '');
    if (schematicSymbolVariants.mbend[variant] !== expected) {
        throw new Error(`mbend ${variant}: generated variant map differs from the catalog`);
    }
    checkPart(`mbend ${variant}`, nP.mbend({turn: variant}), expected);
}
if (nP.lpfGen()._schematic?.kind !== 'cascade') {
    throw new Error('lpfGen: expected inherited cascade schematic metadata');
}
process.stdout.write(`Checked ${names.length} RF constructor symbols, mbend variants, and lpfGen.\n`);
