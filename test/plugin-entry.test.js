// Modified: 2026-11-09
import test from 'node:test';
import assert from 'node:assert/strict';

import * as nP from '../src/index.js';
import * as pluginNPort from '../src/plugin.js';

const workerSchematicHelpers = ['schematicGraph', 'schematicTopology', 'schematicSvg'];

const legacyBrowserHelpers = new Set([
	'bodyWidth',
	'callCodemirror',
	'editor',
	'getCircuitTitle',
	'run',
	'runButton'
]);

test('plugin entry exports the nP API without legacy browser-development helpers', () => {
	const expectedExports = Object.keys(nP)
		.filter((name) => !legacyBrowserHelpers.has(name))
		.concat(workerSchematicHelpers)
		.sort();

	assert.deepEqual(Object.keys(pluginNPort).sort(), expectedExports);
	for (const name of legacyBrowserHelpers) {
		assert.equal(name in pluginNPort, false);
	}
});

test('plugin entry exposes the DOM-free schematic helpers and digital APIs', () => {
	for (const name of workerSchematicHelpers.concat([
		'waveform', 'FFT', 'invFFT', 'PN', 'mod', 'demod', 'bitErrorRate'
	])) assert.equal(typeof pluginNPort[name], 'function', name);
});
