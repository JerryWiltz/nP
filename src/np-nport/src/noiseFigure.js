// Modified: 2026-10-03
import {complex} from '../../np-math/src/complex';
import {matrix} from '../../np-math/src/matrix';

var kB = 1.380649e-23;
var zero = function () { return complex(0, 0); };
var conjugate = function (value) { return complex(value.getR(), -value.getI()); };

function reflection(value, label) {
	var result = value === undefined ? zero() :
		typeof value === 'number' ? complex(value, 0) : value;
	if (!result || typeof result.getR !== 'function' || typeof result.getI !== 'function' ||
		typeof result.mag !== 'function' ||
		!Number.isFinite(result.getR()) || !Number.isFinite(result.getI()) ||
		!Number.isFinite(result.mag()) || result.mag() > 1) {
		throw new RangeError(label + ' must be a passive reflection coefficient with magnitude at most 1.');
	}
	return result;
}

function conditions(portCount, inputPort, outputPort, options) {
	var referenceTemperature = options.referenceTemperature === undefined ?
		290 : options.referenceTemperature;
	if (!Number.isFinite(referenceTemperature) || referenceTemperature <= 0) {
		throw new RangeError('referenceTemperature must be a positive number of kelvin.');
	}
	if (inputPort === outputPort || inputPort < 1 || outputPort < 1 ||
		inputPort > portCount || outputPort > portCount) {
		throw new RangeError('Noise figure requires distinct input and output ports in the nPort.');
	}
	var source = options.source || {};
	var terminations = options.terminations || {};
	Object.keys(terminations).forEach(function (key) {
		var port = Number(key);
		if (!Number.isInteger(port) || port < 1 || port > portCount || port === inputPort) {
			throw new RangeError('Termination ports must be valid nPort ports other than the source.');
		}
	});
	var gammas = [];
	var temperatures = [];
	for (var port = 1; port <= portCount; port++) {
		if (port === inputPort) {
			gammas.push(reflection(source.reflection, 'source.reflection'));
			temperatures.push(referenceTemperature);
		} else {
			var termination = terminations[port] || {};
			gammas.push(reflection(termination.reflection, 'termination ' + port + ' reflection'));
			var temperature = termination.temperature === undefined ?
				(port === outputPort ? 0 : referenceTemperature) : termination.temperature;
			if (!Number.isFinite(temperature) || temperature < 0) {
				throw new RangeError('termination ' + port + ' temperature must be nonnegative kelvin.');
			}
			temperatures.push(temperature);
		}
	}
	if (gammas[inputPort - 1].mag() >= 1) {
		throw new RangeError('A lossless reflecting source has no available thermal-noise reference.');
	}
	return {gammas: gammas, temperatures: temperatures, referenceTemperature: referenceTemperature};
}

// b = S a + c, a = Gamma b + u, so b = (I - S Gamma)^-1 (S u + c).
// The selected output's unit-signal and source-noise responses share one transfer.
export function noiseAnalysis(sparsRow, covariance, inputPort, outputPort, options = {}) {
	var portCount = Math.sqrt(sparsRow.length - 1);
	var setup = conditions(portCount, inputPort, outputPort, options);
	var S = [];
	var system = [];
	for (var row = 0; row < portCount; row++) {
		S[row] = [];
		system[row] = [];
		for (var col = 0; col < portCount; col++) {
			var value = sparsRow[1 + row * portCount + col];
			S[row][col] = value;
			system[row][col] = (row === col ? complex(1, 0) : zero())
				.sub(value.mul(setup.gammas[col]));
		}
	}
	var H = matrix(system).invertCplx().m;
	var output = outputPort - 1;
	var source = inputPort - 1;
	var transfers = [];
	for (var port = 0; port < portCount; port++) {
		var transfer = zero();
		for (var index = 0; index < portCount; index++) {
			transfer = transfer.add(H[output][index].mul(S[index][port]));
		}
		transfers[port] = transfer;
	}
	// Source noise in a 1 Hz band experiences the same transfer as a signal.
	var inputNoise = kB * setup.referenceTemperature;
	var sourceCoupling = 1 - setup.gammas[source].mag() ** 2;
	var sourceNoise = transfers[source].mag() ** 2 * sourceCoupling * inputNoise;
	var addedNoise = zero();
	for (var noiseRow = 0; noiseRow < portCount; noiseRow++) {
		for (var noiseCol = 0; noiseCol < portCount; noiseCol++) {
			addedNoise = addedNoise.add(H[output][noiseRow]
				.mul(covariance[noiseRow][noiseCol])
				.mul(conjugate(H[output][noiseCol])));
		}
	}
	var totalNoise = sourceNoise + addedNoise.getR();
	for (var terminationPort = 0; terminationPort < portCount; terminationPort++) {
		if (terminationPort !== source) {
			totalNoise += transfers[terminationPort].mag() ** 2 * kB *
				setup.temperatures[terminationPort] *
				(1 - setup.gammas[terminationPort].mag() ** 2);
		}
	}
	if (totalNoise < 0 || !Number.isFinite(totalNoise)) {
		throw new RangeError('Noise analysis requires nonnegative finite output noise.');
	}
	return {
		factor: sourceNoise > 0 && totalNoise > 0 ? totalNoise / sourceNoise : NaN,
		outputNoiseDensity: totalNoise
	};
}

export function noiseFactor(sparsRow, covariance, inputPort, outputPort, options = {}) {
	var result = noiseAnalysis(sparsRow, covariance, inputPort, outputPort, options);
	if (!Number.isFinite(result.factor) || result.factor <= 0) {
		throw new RangeError('Noise figure requires positive source and output noise.');
	}
	return result.factor;
}
