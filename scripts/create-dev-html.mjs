import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const pageName = args[0];
const divIds = args.slice(1);

function usage() {
    console.log('Usage: npm run dev:new -- pageName [divId ...]');
    console.log('Example: npm run dev:new -- filterTest chartDiv tableDiv');
}

if (!pageName) {
    usage();
    process.exit(1);
}

if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(pageName)) {
    console.error('Page name must start with a letter and contain only letters, numbers, underscores, or hyphens.');
    process.exit(1);
}

for (const divId of divIds) {
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(divId)) {
        console.error(`Div id "${divId}" must start with a letter and contain only letters, numbers, underscores, or hyphens.`);
        process.exit(1);
    }
}

const fileBase = pageName.endsWith('Development') ? pageName : `${pageName}Development`;
const fileName = `${fileBase}.html`;
const title = fileBase;
const outputPath = path.join(process.cwd(), 'dev', fileName);
const ids = divIds.length > 0 ? divIds : ['chartDiv'];

if (fs.existsSync(outputPath)) {
    console.error(`Refusing to overwrite existing file: ${outputPath}`);
    process.exit(1);
}

const divMarkup = ids.map((id) => `    <div id="${id}"></div>`).join('\n');

const html = `<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>${title}</title>
    <script src="../dist/nP.js"></script>
</head>

<body>
${divMarkup}

    <script>
        // from Compact Manual example #1 p27

        // 1. Set analysis frequencies.
        var g = nP.global;
        g.fList = g.fGen(100e6, 1000e6, 51);

        // 2. Create electrical components as n-port objects.
        var c1 = nP.C(3.05e-12);
        var Tee = nP.Tee();
        var r1 = nP.R(0.6);
        var l1 = nP.L(56.4e-9);
        var c2 = nP.C(23.55e-12);
        var Short = nP.Short();

        // 3. Combine components into a larger high-pass n-port object.
        var hp = nP.nodal(
            [c1, 1, 2],
            [Tee, 5, 2, 3],
            [c2, 3, 4],
            [r1, 5, 6],
            [l1, 6, 7],
            [Short, 7],
            ['out', 1, 4]
        );

        // 4. Build another n-port object for the low-pass section.
        var r2 = nP.R(0.3);
        var l2 = nP.L(32.4e-9);
        // Tee reuse
        var c3 = nP.C(7.15e-12);
        var r3 = nP.R(0.1);
        var l3 = nP.L(33.5e-9);
        // Short reuse
        var lp = nP.nodal(
            [r2, 1, 2],
            [l2, 2, 3],
            [Tee, 7, 3, 4],
            [r3, 4, 5],
            [l3, 5, 6],
            [c3, 7, 8],
            [Short, 8],
            ['out', 1, 6]
        );

        // 5. Reuse the high-pass and low-pass n-port objects in a diplexer.
        // Tee reuse
        var filt = nP.nodal(
            [Tee, 1, 2, 3],
            [hp, 2, 4],
            [lp, 3, 5],
            ['out', 1, 4, 5]
        );

        // 6. Extract output data from any n-port object.
        var filtOut = filt.out('s11dB', 's21dB', 's31dB');

        // 7. Send the output table to a plot or table helper.
        const filtChart = nP.lineChart({
            inputTable: [filtOut],
            title: 'My Chart',
            mount: '#${ids[0]}',
            pngBackground: 'white'
        });
    </script>
</body>

</html>
`;

fs.writeFileSync(outputPath, html);
console.log(`Created ${path.relative(process.cwd(), outputPath)}`);
