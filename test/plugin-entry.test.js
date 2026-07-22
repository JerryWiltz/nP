// Modified: 2026-07-22
import test from 'node:test';
import assert from 'node:assert/strict';

import * as nP from '../src/index.js';
import * as pluginNPort from '../src/plugin.js';

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
		.sort();

	assert.deepEqual(Object.keys(pluginNPort).sort(), expectedExports);
	for (const name of legacyBrowserHelpers) {
		assert.equal(name in pluginNPort, false);
	}
});
