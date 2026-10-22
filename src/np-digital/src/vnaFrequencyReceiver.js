// Modified: 2026-10-22
import {complex} from '../../np-math/src/complex';

// Read one complex receiver phasor per swept frequency.
export function receiveVnaFrequency(stage, options = {}) {
	if (!options || Array.isArray(options) || typeof options !== 'object') {
		throw new TypeError('demod options must be an object.');
	}
	if (Object.keys(options).some(function (key) {
		return key !== 'outputPort' && key !== 'referencePort' && key !== 'referenceReceiver' &&
			key !== 'referenceGain' && key !== 'noise';
	})) {
		throw new TypeError('VNA-frequency demod accepts outputPort, referencePort, referenceReceiver, referenceGain, and noise.');
	}
	if (options.noise !== undefined && options.noise !== false) {
		throw new RangeError('VNA-frequency reception currently requires noise: false.');
	}
	var signal = stage.signal;
	var portCount = Math.sqrt(stage.spars[0].length - 1);
	var outputPort = options.outputPort === undefined ? 2 : options.outputPort;
	var referencePort = options.referencePort;
	var referenceReceiver = options.referenceReceiver;
	var referenceGain = options.referenceGain === undefined ? 1 : options.referenceGain;
	if (!Number.isInteger(outputPort) || outputPort < 1 || outputPort > portCount) {
		throw new RangeError('demod outputPort is outside the nPort dimensions.');
	}
	if (!Number.isFinite(referenceGain) || referenceGain <= 0) {
		throw new RangeError('VNA-frequency referenceGain must be positive and finite.');
	}
	if (referencePort !== undefined && (!Number.isInteger(referencePort) ||
		referencePort < 1 || referencePort > portCount || referencePort === outputPort)) {
		throw new RangeError('VNA-frequency referencePort must name another output port.');
	}
	if (referencePort !== undefined && referenceReceiver !== undefined) {
		throw new RangeError('Select referencePort or referenceReceiver, not both.');
	}
	if (referenceReceiver !== undefined &&
		(!referenceReceiver || typeof referenceReceiver.out !== 'function')) {
		throw new TypeError('VNA-frequency referenceReceiver must be a demod result.');
	}
	var voltageScale = complex(Math.sqrt(signal.referenceImpedanceOhms), 0);
	var raw = signal.rows.map(function (row) {
		return row.waves[outputPort - 1].mul(voltageScale);
	});
	var frequencies = signal.rows.map(function (row) { return row.frequency; });
	var referenceValues = referenceReceiver === undefined ? null : referenceReceiver.out('response');
	var referenceFrequencies = referenceReceiver === undefined ? null : referenceReceiver.out('frequencies');
	if (referenceValues && (!Array.isArray(referenceValues) ||
		referenceValues.length !== frequencies.length ||
		!Array.isArray(referenceFrequencies) ||
		referenceFrequencies.some(function (frequency, index) { return frequency !== frequencies[index]; }))) {
		throw new RangeError('VNA referenceReceiver must use the same frequency grid.');
	}
	var response = raw.map(function (value, index) {
		if (referencePort === undefined && !referenceValues) return value.mul(complex(referenceGain, 0));
		var reference = referenceValues ? referenceValues[index] :
			signal.rows[index].waves[referencePort - 1].mul(voltageScale);
		if (reference.mag() === 0) throw new RangeError('VNA reference receiver has zero signal.');
		return value.div(reference).mul(complex(referenceGain, 0));
	});
	return {
		out: function (selector = 'response dB') {
			if (selector === 'mode') return signal.mode;
			if (selector === 'frequency count') return frequencies.length;
			if (selector === 'frequencies') return frequencies.slice();
			if (selector === 'spectrum') return raw.map(function (value) { return value.copy(); });
			if (selector === 'response') return response.map(function (value) { return value.copy(); });
			if (selector === 'response dB' || selector === 'response magnitude' ||
				selector === 'response phase' || selector === 'response real' ||
				selector === 'response imaginary') {
				var label = selector === 'response dB' ? 'Response (dB)' :
					selector === 'response magnitude' ? 'Response magnitude' :
					selector === 'response phase' ? 'Response phase (deg)' :
					selector === 'response real' ? 'Response real' : 'Response imaginary';
				var table = [['Freq', label]];
				for (var index = 0; index < frequencies.length; index++) {
					var value = response[index];
					table.push([frequencies[index], selector === 'response dB' ? value.mag20dB() :
						selector === 'response magnitude' ? value.mag() :
						selector === 'response phase' ? value.ang() :
						selector === 'response real' ? value.getR() : value.getI()]);
				}
				return table;
			}
			throw new RangeError('Unknown VNA-frequency demod output: ' + selector);
		}
	};
}
