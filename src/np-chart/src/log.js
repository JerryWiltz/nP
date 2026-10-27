// Modified: 2026-10-26

function isComplex(value) {
	return value !== null && typeof value === 'object' &&
		value.constructor && value.constructor.name === 'Complex' &&
		typeof value.x === 'number' && typeof value.y === 'number';
}

function isPlainRecord(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value) &&
		(Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) &&
		Object.keys(value).length > 0;
}

function formatComplexCell(value) {
	return value.x.toPrecision(4) +
		(value.y >= 0 ? ' +j' : ' -j') +
		Math.abs(value.y).toPrecision(4);
}

function formatCell(value) {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return value.toPrecision(4);
	if (isComplex(value)) return formatComplexCell(value);
	return null;
}

function validRows(rows, matrixOnly) {
	if (!Array.isArray(rows) || rows.length === 0 ||
		!Array.isArray(rows[0]) || rows[0].length === 0) return false;

	var width = rows[0].length;
	return rows.every(row => Array.isArray(row) && row.length === width &&
		row.every(value => (!matrixOnly || typeof value === 'number' || isComplex(value)) &&
			formatCell(value) !== null));
}

function createTable(rows) {
	var table = document.createElement('table');
	var body = document.createElement('tbody');
	table.appendChild(body);

	rows.forEach(row => {
		var tr = document.createElement('tr');
		body.appendChild(tr);
		row.forEach(value => {
			var td = document.createElement('td');
			td.setAttribute('style', 'text-align: center; border-style: solid; border-width: 1px');
			td.setAttribute('width', '140px');
			td.textContent = formatCell(value);
			tr.appendChild(td);
		});
	});

	return table;
}

export function log(input, options = {}) {
	var pre = document.createElement('pre');
	pre.className = 'outputSection remove';

	if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
		pre.textContent = typeof input === 'number' ? input.toPrecision(4) : String(input);
	} else if (isComplex(input)) {
		pre.textContent = input.x.toPrecision(4) + ', ' +
			(input.y >= 0 ? 'j' : '-j') + Math.abs(input.y).toPrecision(4);
	} else if (Array.isArray(input)) {
		if (input.length === 0) {
			pre.appendChild(createTable([]));
		} else if (Array.isArray(input[0])) {
			if (validRows(input, false)) {
				pre.appendChild(createTable(input));
			} else {
				pre.textContent = "nP.log can't read this input";
			}
		} else if (input.every(value => formatCell(value) !== null)) {
			pre.appendChild(createTable(input.map(value => [value])));
		} else {
			pre.textContent = "nP.log can't read this input";
		}
	} else if (input !== null && typeof input === 'object' &&
		Array.isArray(input.m) && validRows(input.m, true)) {
		pre.appendChild(createTable(input.m));
	} else if (isPlainRecord(input)) {
		try {
			pre.textContent = JSON.stringify(input, null, 2);
		} catch (error) {
			pre.textContent = "nP.log can't read this input";
		}
	} else {
		pre.textContent = "nP.log can't read this input";
	}

	var destination;
	if (options && options.mount !== undefined) {
		destination = typeof options.mount === 'string'
			? document.querySelector(options.mount)
			: options.mount;
		if (!destination || typeof destination.appendChild !== 'function') {
			throw new TypeError('nP.log(): mount must be a CSS selector or DOM element.');
		}
	} else {
		destination = document.getElementsByClassName('outputBox')[0] || document.body;
	}

	destination.appendChild(pre);
	return pre;
}
