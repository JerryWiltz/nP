// Modified: 2026-10-19
import test from 'node:test';
import assert from 'node:assert/strict';

import {log} from '../src/np-chart/src/log.js';
import {complex} from '../src/np-math/src/complex.js';
import {matrix} from '../src/np-math/src/matrix.js';

class Element {
	constructor(tagName) {
		this.tagName = tagName.toUpperCase();
		this.children = [];
		this.textContent = '';
		this.attributes = {};
	}

	appendChild(child) {
		this.children.push(child);
		return child;
	}

	setAttribute(name, value) {
		this.attributes[name] = value;
	}

	set innerHTML(value) {
		throw new Error(`Unexpected HTML insertion: ${value}`);
	}
}

function render(input) {
	var previousDocument = globalThis.document;
	var body = new Element('body');
	globalThis.document = {
		body,
		createElement: tagName => new Element(tagName),
		getElementsByClassName: () => []
	};

	try {
		var output = log(input);
		assert.equal(output, body.children[0]);
		return output;
	} finally {
		globalThis.document = previousDocument;
	}
}

function tableCells(output) {
	return output.children[0].children[0].children.map(row =>
		row.children.map(cell => cell.textContent));
}

test('log renders markup as literal text in strings and table cells', () => {
	var markup = '<img src=x onerror=alert(1)>';
	assert.equal(render(markup).textContent, markup);
	assert.deepEqual(tableCells(render([['Label', 'Value'], [markup, 50]])), [
		['Label', 'Value'],
		[markup, '50.00']
	]);
	assert.deepEqual(tableCells(render([markup])), [[markup]]);
});

test('log handles unsupported and malformed inputs without throwing', () => {
	var invalid = [null, undefined, {}, [null], [[1, 2], [3]], matrix([])];
	for (var input of invalid) {
		assert.equal(render(input).textContent, "nP.log can't read this input");
	}
});

test('log preserves supported scalar, output-table, and matrix formatting', () => {
	assert.equal(render(1.234567).textContent, '1.235');
	assert.equal(render(true).textContent, 'true');
	assert.equal(render(complex(5, -7)).textContent, '5.000, -j7.000');
	assert.deepEqual(tableCells(render([['Freq', 's21dB'], [1e9, -3.5]])), [
		['Freq', 's21dB'],
		['1.000e+9', '-3.500']
	]);
	assert.deepEqual(tableCells(render(matrix([[complex(1, 2)]]))), [['1.000 +j2.000']]);
});

test('log uses its default output box or an explicit mount and returns the output element', () => {
	var previousDocument = globalThis.document;
	var body = new Element('body');
	var outputBox = new Element('div');
	var mount = new Element('div');
	globalThis.document = {
		body,
		createElement: tagName => new Element(tagName),
		getElementsByClassName: name => name === 'outputBox' ? [outputBox] : [],
		querySelector: selector => selector === '#results' ? mount : null
	};

	try {
		var defaultOutput = log('Hello, nPort!');
		assert.equal(defaultOutput, outputBox.children[0]);
		assert.equal(defaultOutput.textContent, 'Hello, nPort!');

		var selectedOutput = log('Selected', {mount: '#results'});
		assert.equal(selectedOutput, mount.children[0]);
		assert.equal(selectedOutput.textContent, 'Selected');

		var elementOutput = log('Element', {mount: body});
		assert.equal(elementOutput, body.children[0]);
		assert.throws(() => log('Missing', {mount: '#missing'}), /mount must be/);
	} finally {
		globalThis.document = previousDocument;
	}
});
