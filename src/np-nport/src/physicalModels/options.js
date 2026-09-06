// Modified: 2026-09-06
var hasOwn = function (object, key) {
	return Object.prototype.hasOwnProperty.call(object, key);
};

export var isOptionsObject = function (value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
};

export var normalizePhysicalModelOptions = function (constructorName, input, definitions) {
	if (!isOptionsObject(input)) {
		throw new TypeError('nP.' + constructorName + '() requires an options object.');
	}

	var known = new Set;
	var normalized = {};
	definitions.forEach(function (definition) {
		known.add(definition.name);
		(definition.aliases || []).forEach(function (alias) { known.add(alias); });

		var supplied = [definition.name].concat(definition.aliases || []).filter(function (name) {
			return hasOwn(input, name);
		});
		if (supplied.length > 1) {
			throw new Error('nP.' + constructorName + '(): use only one of ' + supplied.join(', ') + '.');
		}
		var source = supplied[0];
		normalized[definition.name] = source === undefined ? definition.defaultValue : input[source];
	});

	Object.keys(input).forEach(function (key) {
		if (!known.has(key)) {
			throw new Error('nP.' + constructorName + '(): unknown option "' + key + '".');
		}
	});
	return normalized;
};

export var requireFinite = function (constructorName, name, value) {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new TypeError('nP.' + constructorName + '(): ' + name + ' must be a finite number.');
	}
	return value;
};

export var requirePositive = function (constructorName, name, value) {
	requireFinite(constructorName, name, value);
	if (value <= 0) throw new RangeError('nP.' + constructorName + '(): ' + name + ' must be greater than zero.');
	return value;
};

export var requireNonnegative = function (constructorName, name, value) {
	requireFinite(constructorName, name, value);
	if (value < 0) throw new RangeError('nP.' + constructorName + '(): ' + name + ' must not be negative.');
	return value;
};

export var resistivityScale = function (constructorName, options, legacyScale, referenceResistivity) {
	if (hasOwn(options, 'resistivity') && hasOwn(options, 'rho')) {
		throw new Error('nP.' + constructorName + '(): use resistivity or legacy rho, not both.');
	}
	if (hasOwn(options, 'resistivity')) {
		return requireNonnegative(constructorName, 'resistivity', options.resistivity) / referenceResistivity;
	}
	return legacyScale;
};

export var absoluteResistivity = function (constructorName, options, legacyValue) {
	if (hasOwn(options, 'resistivity') && hasOwn(options, 'rho')) {
		throw new Error('nP.' + constructorName + '(): use resistivity or legacy rho, not both.');
	}
	return hasOwn(options, 'resistivity')
		? requireNonnegative(constructorName, 'resistivity', options.resistivity)
		: legacyValue;
};

export var physicalModelMetadata = function (family, model, geometry, material, analysis, extra = {}) {
	return {
		family,
		model,
		geometry: {...geometry},
		material: {...material},
		analysis,
		...extra
	};
};
