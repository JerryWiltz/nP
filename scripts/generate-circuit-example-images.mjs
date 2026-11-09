// Modified: 2026-11-08
// Run from the repository root: node scripts/generate-circuit-example-images.mjs [--check]
// Uses Firefox; never opens Chromium. The Markdown code is the circuit source.
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {firefox} from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const markdownPath = path.join(root, 'docs/circuit-examples.md');
const bundlePath = path.join(root, 'docs/public/nP.js');
const outputRoot = path.join(root, 'docs/public/circuit-examples');
const check = process.argv.includes('--check');
assert.ok(process.argv.slice(2).every(argument => argument === '--check'), 'Only --check is supported');

function examplesFromMarkdown(markdown) {
    return Array.from(markdown.matchAll(/^#{2,3} (.+)\n([\s\S]*?)(?=^#{2,3} |$(?![\s\S]))/gm), match => {
        const blocks = Array.from(match[2].matchAll(/```js\n([\s\S]*?)```/g));
        if (!blocks.length) return null;
        assert.equal(blocks.length, 1, `Expected one runnable block for ${match[1]}`);
        return {
            title: match[1],
            slug: match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''),
            code: blocks[0][1]
        };
    }).filter(Boolean);
}

// This function runs inside Firefox. It wraps only the display calls to capture
// their real SVG outputs; calculations, layout, symbols, and plots are unchanged.
function renderExample({title, code}) {
    const outputs = [], api = {...window.nP};
    for (const name of ['schematic', 'lineChart', 'lineTable']) {
        api[name] = (...args) => {
            const result = window.nP[name](...args);
            if (result.error) throw result.error;
            const svg = result.svg.cloneNode(true);
            svg.removeAttribute('style');
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', `${title}: ${name === 'schematic' ? 'schematic' : 'response'}`);
            if (!svg.querySelector('title')) {
                const caption = document.createElementNS(svg.namespaceURI, 'title');
                caption.textContent = svg.getAttribute('aria-label');
                svg.prepend(caption);
            }
            const provenance = document.createElementNS(svg.namespaceURI, 'desc');
            provenance.textContent = `Generated from the ${title} code block in docs/circuit-examples.md using nP.${name}().`;
            svg.prepend(provenance);
            // Standalone chart/table SVGs otherwise inherit their text color
            // from the surrounding HTML. Keep exports readable in dark themes.
            svg.setAttribute('color', '#202020');
            svg.setAttribute('style', 'background: #ffffff; font-family: Arial, Helvetica, sans-serif; font-size: 14px');
            const markup = new XMLSerializer().serializeToString(svg) + '\n';
            if (/\b(?:NaN|Infinity)\b/.test(markup)) throw new Error(`${title}: nonfinite SVG coordinates`);
            outputs.push({kind: name === 'schematic' ? 'schematic' : 'response', markup});
            return result;
        };
    }
    new Function('nP', code)(api);
    return outputs;
}

const examples = examplesFromMarkdown(await readFile(markdownPath, 'utf8'));
assert.ok(examples.length > 0, 'No circuit examples found');
const browser = await firefox.launch();
const images = [];
try {
    for (const example of examples) {
        const page = await browser.newPage({viewport: {width: 1100, height: 900}});
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.setContent('<!doctype html><html><body style="margin: 0; color: #202020; background: white"></body></html>');
        await page.addScriptTag({path: bundlePath});
        const outputs = await page.evaluate(renderExample, example);
        assert.deepEqual(errors, [], `${example.title}: browser errors`);
        assert.deepEqual(outputs.map(output => output.kind), ['schematic', 'response'],
            `${example.title}: expected a schematic followed by a chart or table`);
        for (const output of outputs) {
            const filename = path.join(outputRoot, `${example.slug}-${output.kind}.svg`);
            assert.ok(filename.startsWith(root), 'Output must stay inside the repository');
            images.push({filename, markup: output.markup});
        }
        console.log(`Rendered ${example.title}`);
        await page.close();
    }
} finally {
    await browser.close();
}

if (!check) await mkdir(outputRoot, {recursive: true});
for (const {filename, markup} of images) {
    if (check) assert.equal(await readFile(filename, 'utf8'), markup, `${filename} is stale`);
    else await writeFile(filename, markup);
}
console.log(`${check ? 'Checked' : 'Generated'} ${images.length} SVGs from ${examples.length} runnable examples.`);
