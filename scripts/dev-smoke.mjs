// Modified: 2026-09-30
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);
const devRoot = path.join(repoRoot, 'dev');
const files = fs.readdirSync(devRoot)
    .filter((name) => name.endsWith('.html'))
    .sort()
    .map((name) => path.join(devRoot, name));

const chartPages = new Set([
    'diodeDevelopment.html',
    'microstripDevelopment.html',
    'nodalDevelopment.html',
    'seriesTeeDevelopment.html',
    'visualizationDevelopment.html'
]);

const browser = await chromium.launch();
const results = [];

for (const file of files) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
        if (message.type() === 'error') {
            errors.push(`console.error: ${message.text()}`);
        }
    });

    try {
        await page.goto(pathToFileURL(file).href, {
            waitUntil: 'load',
            timeout: 15000
        });
        await page.waitForTimeout(500);
        if (chartPages.has(path.basename(file)) && await page.locator('svg').count() === 0) {
            errors.push('expected at least one rendered SVG');
        }
    } catch (error) {
        errors.push(`navigation: ${error.message}`);
    }

    results.push({ file: path.basename(file), errors });
    await page.close();
}

await browser.close();

let failed = 0;
for (const result of results) {
    if (result.errors.length > 0) {
        failed += 1;
        console.log(`FAIL ${result.file}`);
        result.errors.forEach((error) => console.log(`  ${error}`));
    } else {
        console.log(`PASS ${result.file}`);
    }
}

if (failed > 0) {
    process.exitCode = 1;
} else {
    console.log(`All ${results.length} development pages passed.`);
}
