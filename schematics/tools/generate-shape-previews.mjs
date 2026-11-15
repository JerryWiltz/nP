// Modified: 2026-11-14
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import * as nP from '../../src/index.js';
import {schematicSvg} from '../../src/np-chart/src/schematic.js';

const previewRoot = new URL('../shapes/previews/', import.meta.url);
const shape = {shapes: ['series']};

const r1 = nP.R(50), r2 = nP.R(50);
const reference = nP.nodal(
    [r1, 1, 2],
    [r2, 2, 3],
    ['out', 1, 3]
);

const resistor = nP.R(50), bend = nP.mbend(), inductor = nP.L(5e-9);
const turned = nP.nodal(
    [resistor, 1, 2],
    [bend, 2, 3],
    [inductor, 3, 4],
    ['out', 1, 4]
);

const parts = Array.from({length: 5}, () => nP.R(50));
const a = nP.nodal([parts[0], 1, 2], [parts[1], 2, 3], ['out', 1, 3]);
const b = nP.nodal([a, 1, 2], [parts[2], 2, 3], ['out', 1, 3]);
const c = nP.nodal([b, 1, 2], [parts[3], 2, 3], ['out', 1, 3]);
const d = nP.nodal([c, 1, 2], [parts[4], 2, 3], ['out', 1, 3]);

const firstTee = nP.Tee(), middleTee = nP.Tee(), lastTee = nP.Tee();
const short = nP.Short(), open = nP.Open();
const ladder = nP.nodal(
    [firstTee, 4, 1, 2],
    [nP.R(100), 4, 5],
    [short, 5],
    [nP.R(50), 2, 3],
    [middleTee, 6, 3, 7],
    [nP.sePaRL(100, 5e-9), 6, 8],
    [short, 8],
    [nP.R(75), 7, 9],
    [lastTee, 10, 9, 11],
    [nP.Tlin(50, 0.01), 10, 12],
    [open, 12],
    ['out', 1, 11]
);

const previews = [
    ['seriesOf2Ports.svg', schematicSvg(reference, shape)],
    ['seriesOf2PortsBend.svg', schematicSvg(turned, shape)],
    ['seriesOf2PortsExpanded.svg', schematicSvg(d, {...shape, expand: true})],
    ['ladder.svg', schematicSvg(ladder, {shapes: ['ladder']})]
];

for (const [name, svg] of previews) {
    const path = fileURLToPath(new URL(name, previewRoot));
    if (process.argv.includes('--check')) {
        if (readFileSync(path, 'utf8') !== svg) {
            throw new Error(`${name} is stale; run npm run shapes:preview`);
        }
    } else {
        writeFileSync(path, svg);
    }
}
process.stdout.write(`${process.argv.includes('--check') ? 'Checked' : 'Generated'} ${previews.length} shape previews.\n`);
