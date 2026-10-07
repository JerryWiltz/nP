// Modified: 2026-10-06
import test from 'node:test';
import assert from 'node:assert/strict';

import {normalizeInputTables} from '../src/np-chart/src/inputTables.js';

test('chart input accepts a single out table and an array of tables', () => {
    const gain = [['Freq', 's21dB'], [1e9, 17]];
    assert.deepEqual(normalizeInputTables(gain, 'lineChart', 'line'), [gain]);
    assert.deepEqual(normalizeInputTables([gain, gain], 'lineChart', 'line'), [gain, gain]);
});

test('line chart rejects ambiguous or incomplete trace data', () => {
    assert.throws(
        () => normalizeInputTables([['Freq', 'gain', 'gain'], [1e9, 17, 18]], 'lineChart', 'line'),
        /trace headers must be unique/
    );
    assert.throws(
        () => normalizeInputTables([['Freq', 'gain'], [1e9]], 'lineChart', 'line'),
        /row 2 must have 2 columns/
    );
    assert.throws(
        () => normalizeInputTables([['Freq', 'gain'], [1e9, NaN]], 'lineChart', 'line'),
        /finite numbers/
    );
});

test('Smith chart rejects incomplete or mismatched Re/Im pairs', () => {
    assert.throws(
        () => normalizeInputTables([['Freq', 's11Re'], [1e9, 0.1]], 'smithChart', 'smith'),
        /Re\/Im column pair/
    );
    assert.throws(
        () => normalizeInputTables([['Freq', 's11Re', 's22Im'], [1e9, 0.1, 0.2]], 'smithChart', 'smith'),
        /matching Re\/Im headers/
    );
});

test('line table accepts text cells and preserves caller data', () => {
    const data = [['Part', 'Value'], ['R1', 50]];
    assert.deepEqual(normalizeInputTables(data, 'lineTable', 'table'), [data]);
    assert.equal(data[1][0], 'R1');
});
