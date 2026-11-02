// Modified: 2026-11-01
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

const splitRejoin = nP.nodal(
    [nP.Tee(), 1, 2, 3],
    [nP.Tee(), 2, 4, 5],
    [nP.Tee(), 3, 6, 7],
    [nP.R(50), 4, 8],
    [nP.R(50), 8, 9],
    [nP.Tee(), 10, 5, 11],
    [nP.R(100), 10, 12],
    [nP.Short(), 12],
    [nP.R(50), 6, 13],
    [nP.R(50), 13, 14],
    [nP.Tee(), 15, 7, 16],
    [nP.R(100), 15, 17],
    [nP.Short(), 17],
    [nP.Tee(), 18, 11, 9],
    [nP.Tee(), 19, 16, 14],
    [nP.Tee(), 20, 19, 18],
    ['out', 1, 20]
);

const splitRejoinTee5 = nP.nodal(
    [nP.Tee5(), 1, 2, 3, 4, 5],
    [nP.R(50), 2, 6],
    [nP.L(5e-9), 6, 7],
    [nP.Tee(), 8, 3, 9],
    [nP.C(1e-12), 8, 10],
    [nP.Short(), 10],
    [nP.Tlin(50, 0.01), 4, 11],
    [nP.R(75), 11, 12],
    [nP.Tee(), 13, 5, 14],
    [nP.R(100), 13, 15],
    [nP.Short(), 15],
    [nP.Tee5(), 16, 14, 12, 9, 7],
    ['out', 1, 16]
);

const splitRejoinTee4 = nP.nodal(
    [nP.Tee4(), 1, 2, 3, 4],
    [nP.R(50), 2, 5],
    [nP.L(5e-9), 3, 6],
    [nP.C(1e-12), 4, 7],
    [nP.Tee4(), 8, 7, 6, 5],
    ['out', 1, 8]
);

const previews = [
    ['seriesOf2Ports.svg', schematicSvg(reference, shape)],
    ['seriesOf2PortsBend.svg', schematicSvg(turned, shape)],
    ['seriesOf2PortsExpanded.svg', schematicSvg(d, {...shape, expand: true})],
    ['ladder.svg', schematicSvg(ladder, {shapes: ['ladder']})],
    ['splitRejoin.svg', schematicSvg(splitRejoin)],
    ['splitRejoinTee4.svg', schematicSvg(splitRejoinTee4)],
    ['splitRejoinTee5.svg', schematicSvg(splitRejoinTee5)]
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
