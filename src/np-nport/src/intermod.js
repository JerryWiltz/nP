// Modified: 2026-10-04
import {complex} from '../../np-math/src/complex';
import {matrix, dim} from '../../np-math/src/matrix';

var zero = function () { return complex(0, 0); };
var conjugate = function (value) { return complex(value.getR(), -value.getI()); };
var power = function (value) { return value.getR() ** 2 + value.getI() ** 2; };
var zeroVector = function (count) {
	return Array.from({length: count}, zero);
};

export function analysisFrequencies(settings) {
	if (!settings.twoTone) return settings.fList;
	var spacing = settings.twoTone.spacingHz;
	if (!Number.isFinite(spacing) || spacing <= 0) {
		throw new RangeError('global.twoTone.spacingHz must be a positive frequency.');
	}
	var frequencies = new Set();
	settings.fList.forEach(function (f1) {
		if (!Number.isFinite(f1) || f1 <= 0) {
			throw new RangeError('Two-tone sweep frequencies must be positive.');
		}
		var f2 = f1 + spacing;
		[f1, f2, f2 - f1, f1 + f2, 2 * f1 - f2, 2 * f2 - f1, 2 * f1, 2 * f2]
			.forEach(function (frequency) {
				if (frequency > 0) frequencies.add(frequency);
			});
	});
	return Array.from(frequencies).sort(function (a, b) { return a - b; });
}

var rowAt = function (nport, frequency) {
	var row = nport.spars.find(function (item) { return item[0] === frequency; });
	if (!row) throw new RangeError('nPort has no S-parameters at ' + frequency + ' Hz. Set two-tone frequencies before constructing components.');
	return row;
};

var portCount = function (nport) {
	return Math.sqrt(nport.spars[0].length - 1);
};

var linearOutput = function (nport, frequency, incident) {
	var row = rowAt(nport, frequency);
	var count = portCount(nport);
	var output = zeroVector(count);
	for (var i = 0; i < count; i++) {
		for (var j = 0; j < count; j++) {
			output[i] = output[i].add(row[1 + i * count + j].mul(incident[j]));
		}
	}
	return output;
};

// A connection model has component ports first and external bookkeeping
// ports last, just like nodal's Gupta matrix.
export function connectionModel(components, connectionMap) {
	return {type: 'connection', components: components, connectionMap: connectionMap};
}

var solveConnection = function (model, frequency, externalIncident, componentSources) {
	var componentPorts = model.components.reduce(function (total, component) {
		return total + portCount(component);
	}, 0);
	var externalPorts = externalIncident.length;
	var count = componentPorts + externalPorts;
	if (model.connectionMap.length !== count) {
		throw new RangeError('Intermod connection port count does not match the nPort components.');
	}
	var W = dim(count, count, zero());
	for (var row = 0; row < count; row++) {
		W[row][model.connectionMap[row]] = complex(1, 0);
	}
	var offset = 0;
	for (var componentIndex = 0; componentIndex < model.components.length; componentIndex++) {
		var component = model.components[componentIndex];
		var spars = rowAt(component, frequency);
		var size = portCount(component);
		for (var i = 0; i < size; i++) {
			for (var j = 0; j < size; j++) {
				W[offset + i][offset + j] = spars[1 + i * size + j].neg();
			}
		}
		offset += size;
	}
	var sources = zeroVector(count);
	if (componentSources) {
		offset = 0;
		for (var child = 0; child < model.components.length; child++) {
			for (var port = 0; port < componentSources[child].length; port++) {
				sources[offset + port] = componentSources[child][port];
			}
			offset += portCount(model.components[child]);
		}
	}
	for (var external = 0; external < externalPorts; external++) {
		sources[componentPorts + external] = externalIncident[external];
	}
	var inverse = matrix(W).invertCplx().m;
	var incident = zeroVector(count);
	for (var outputRow = 0; outputRow < count; outputRow++) {
		for (var source = 0; source < count; source++) {
			incident[outputRow] = incident[outputRow].add(inverse[outputRow][source].mul(sources[source]));
		}
	}
	var childIncidents = [];
	offset = 0;
	for (var childIndex = 0; childIndex < model.components.length; childIndex++) {
		var childPorts = portCount(model.components[childIndex]);
		childIncidents.push(incident.slice(offset, offset + childPorts));
		offset += childPorts;
	}
	return {outgoing: incident.slice(componentPorts), childIncidents: childIncidents};
};

var prepare = function (nport, f1, f2, input1, input2) {
	var model = nport._intermod;
	if (!model || model.type !== 'connection') {
		return {input1: input1, input2: input2};
	}
	var atFirst = solveConnection(model, f1, input1);
	var atSecond = solveConnection(model, f2, input2);
	var children = model.components.map(function (component, index) {
		return prepare(component, f1, f2,
			atFirst.childIncidents[index], atSecond.childIncidents[index]);
	});
	return {children: children};
};

var diodeJunctionVoltage = function (nport, frequency, incident, model) {
	var reflected = linearOutput(nport, frequency, incident);
	var current = incident[0].sub(reflected[0]).div(complex(Math.sqrt(model.referenceImpedance), 0));
	var junctionImpedance = complex(model.conductance, 2 * Math.PI * frequency * model.capacitance).inv();
	return current.mul(junctionImpedance);
};

var diodeProducts = function (nport, frequency, context, tones, model) {
	var output = zeroVector(2);
	var v1 = diodeJunctionVoltage(nport, tones.f1, context.input1, model);
	var v2 = diodeJunctionVoltage(nport, tones.f2, context.input2, model);
	// dI/dV supplies conduction products; dQ/dt adds the junction-capacitance products.
	var second = complex(model.secondDerivative, 2 * Math.PI * frequency * model.capacitanceDerivative);
	var third = complex(model.thirdDerivative, 2 * Math.PI * frequency * model.capacitanceSecondDerivative);
	var productCurrent = zero();
	if (frequency === tones.f1 + tones.f2) {
		productCurrent = productCurrent.add(v1.mul(v2).mul(second).mul(complex(1 / Math.sqrt(2), 0)));
	}
	if (frequency === tones.f2 - tones.f1) {
		productCurrent = productCurrent.add(v2.mul(conjugate(v1)).mul(second).mul(complex(1 / Math.sqrt(2), 0)));
	}
	if (frequency === 2 * tones.f1) {
		productCurrent = productCurrent.add(v1.mul(v1).mul(second).mul(complex(1 / (2 * Math.sqrt(2)), 0)));
	}
	if (frequency === 2 * tones.f2) {
		productCurrent = productCurrent.add(v2.mul(v2).mul(second).mul(complex(1 / (2 * Math.sqrt(2)), 0)));
	}
	if (frequency === 2 * tones.f1 - tones.f2) {
		productCurrent = productCurrent.add(v1.mul(v1).mul(conjugate(v2)).mul(third).mul(complex(1 / 4, 0)));
	}
	if (frequency === 2 * tones.f2 - tones.f1) {
		productCurrent = productCurrent.add(v2.mul(v2).mul(conjugate(v1)).mul(third).mul(complex(1 / 4, 0)));
	}
	if (power(productCurrent) === 0) return output;
	var junctionImpedance = complex(model.conductance, 2 * Math.PI * frequency * model.capacitance).inv();
	var seriesImpedance = junctionImpedance.add(complex(model.seriesResistance + 2 * model.referenceImpedance, 0));
	var outgoing = productCurrent.mul(junctionImpedance)
		.mul(complex(Math.sqrt(model.referenceImpedance), 0)).div(seriesImpedance);
	output[0] = outgoing.neg();
	output[1] = outgoing;
	return output;
};

var generated = function (nport, frequency, context, tones) {
	var model = nport._intermod;
	var count = portCount(nport);
	if (!model) return zeroVector(count);
	if (model.type === 'connection') {
		var childSources = model.components.map(function (component, index) {
			return generated(component, frequency, context.children[index], tones);
		});
		if (childSources.every(function (waves) {
			return waves.every(function (wave) { return power(wave) === 0; });
		})) return zeroVector(count);
		return solveConnection(model, frequency, zeroVector(count), childSources).outgoing;
	}
	if (model.type === 'diode') return diodeProducts(nport, frequency, context, tones, model);
	if (model.type !== 'amp') return zeroVector(count);
	var output = zeroVector(count);
	var b1 = rowAt(nport, tones.f1)[3].mul(context.input1[0]);
	var b2 = rowAt(nport, tones.f2)[3].mul(context.input2[0]);
	if (model.p2 && frequency === tones.f1 + tones.f2) {
		output[1] = output[1].add(b1.mul(b2).mul(model.phase2).mul(complex(1 / Math.sqrt(model.p2), 0)));
	}
	if (model.p2 && frequency === tones.f2 - tones.f1) {
		output[1] = output[1].add(b2.mul(conjugate(b1)).mul(model.phase2).mul(complex(1 / Math.sqrt(model.p2), 0)));
	}
	if (model.p2Harmonic && frequency === 2 * tones.f1) {
		output[1] = output[1].add(b1.mul(b1).mul(model.phase2Harmonic).mul(complex(1 / Math.sqrt(model.p2Harmonic), 0)));
	}
	if (model.p2Harmonic && frequency === 2 * tones.f2) {
		output[1] = output[1].add(b2.mul(b2).mul(model.phase2Harmonic).mul(complex(1 / Math.sqrt(model.p2Harmonic), 0)));
	}
	if (model.p3 && frequency === 2 * tones.f1 - tones.f2) {
		output[1] = output[1].sub(b1.mul(b1).mul(conjugate(b2)).mul(model.phase3).mul(complex(1 / model.p3, 0)));
	}
	if (model.p3 && frequency === 2 * tones.f2 - tones.f1) {
		output[1] = output[1].sub(b2.mul(b2).mul(conjugate(b1)).mul(model.phase3).mul(complex(1 / model.p3, 0)));
	}
	return output;
};

var sourceWave = function (dBm, phaseDegrees) {
	if (!Number.isFinite(dBm)) throw new RangeError('Two-tone input powers must be finite dBm values.');
	if (!Number.isFinite(phaseDegrees)) throw new RangeError('Two-tone phases must be finite degrees.');
	var magnitude = Math.sqrt(10 ** ((dBm - 30) / 10));
	var radians = phaseDegrees * Math.PI / 180;
	return complex(magnitude * Math.cos(radians), magnitude * Math.sin(radians));
};

export function intermodAt(nport, f1, inputPort, settings) {
	var tone = settings.twoTone;
	if (!tone || !Number.isFinite(tone.spacingHz) || tone.spacingHz <= 0) {
		throw new RangeError('Set global.twoTone.spacingHz before intermod analysis.');
	}
	var f2 = f1 + tone.spacingHz;
	var count = portCount(nport);
	var input1 = zeroVector(count);
	var input2 = zeroVector(count);
	input1[inputPort] = sourceWave(tone.p1dBm, tone.phase1Deg === undefined ? 0 : tone.phase1Deg);
	input2[inputPort] = sourceWave(tone.p2dBm, tone.phase2Deg === undefined ? 0 : tone.phase2Deg);
	var context = prepare(nport, f1, f2, input1, input2);
	var frequencies = {
		im2diff: f2 - f1,
		im3lower: 2 * f1 - f2,
		fund1: f1,
		fund2: f2,
		im3upper: 2 * f2 - f1,
		im2sum: f1 + f2,
		harm1: 2 * f1,
		harm2: 2 * f2
	};
	var waves = {};
	var waveByFrequency = new Map();
	Object.keys(frequencies).forEach(function (key) {
		var frequency = frequencies[key];
		if (frequency <= 0) {
			waves[key] = null;
			return;
		}
		if (waveByFrequency.has(frequency)) {
			waves[key] = waveByFrequency.get(frequency);
			return;
		}
		var incident = zeroVector(count);
		if (frequency === f1) incident = incident.map(function (value, index) { return value.add(input1[index]); });
		if (frequency === f2) incident = incident.map(function (value, index) { return value.add(input2[index]); });
		var linear = linearOutput(nport, frequency, incident);
		var nonlinear = generated(nport, frequency, context, {f1: f1, f2: f2});
		waves[key] = linear.map(function (value, index) { return value.add(nonlinear[index]); });
		waveByFrequency.set(frequency, waves[key]);
	});
	return {frequencies: frequencies, waves: waves};
}

export function waveDbm(value) {
	return value ? 10 * Math.log10(power(value) / 1e-3) : NaN;
}

export function oipDbm(result, product, outputPort) {
	var frequency = result.frequencies[product];
	if (frequency <= 0) return NaN;
	var coincidences = Object.keys(result.frequencies).filter(function (name) {
		return result.frequencies[name] === frequency;
	});
	if (coincidences.length > 1) {
		throw new RangeError('An OIP cannot be separated when products or fundamentals coincide.');
	}
	var productPower = power(result.waves[product][outputPort]);
	if (productPower === 0) return Infinity;
	var firstPower = power(result.waves.fund1[outputPort]);
	var secondPower = power(result.waves.fund2[outputPort]);
	var intercept;
	if (product === 'harm1') {
		intercept = firstPower ** 2 / productPower;
	} else if (product === 'harm2') {
		intercept = secondPower ** 2 / productPower;
	} else if (product === 'im2sum' || product === 'im2diff') {
		intercept = firstPower * secondPower / productPower;
	} else if (product === 'im3lower') {
		intercept = Math.sqrt(firstPower ** 2 * secondPower / productPower);
	} else {
		intercept = Math.sqrt(secondPower ** 2 * firstPower / productPower);
	}
	return 10 * Math.log10(intercept / 1e-3);
}
