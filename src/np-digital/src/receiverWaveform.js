// Modified: 2026-10-22
import {complex} from '../../np-math/src/complex';
import {invFFT} from '../../np-math/src/fft';
import {noiseWaveformSpectrum} from './noiseWaveform';

// Reconstruct the output signal and one independent noise realization.
export function receiveWaveform(stage, options = {}) {
	if (!stage || !stage.signal || !Array.isArray(stage.spars)) {
		throw new TypeError('demod requires an nPort containing a digital signal.');
	}
	if (!options || Array.isArray(options) || typeof options !== 'object') {
		throw new TypeError('demod options must be an object.');
	}
	if (options.mode !== undefined) {
		throw new RangeError('Select demod output with .out() instead of mode.');
	}
	if (options.noise !== undefined && typeof options.noise !== 'boolean') {
		throw new TypeError('demod noise must be true or false.');
	}
	var signal = stage.signal;
	var portCount = Math.sqrt(stage.spars[0].length - 1);
	var outputPort = options.outputPort === undefined ? 2 : options.outputPort;
	var inputPort = options.inputPort === undefined ? 1 : options.inputPort;
	var vnaTime = signal.mode === 'VNA-time';
	var referencePort = options.referencePort;
	var referenceReceiver = options.referenceReceiver;
	var referenceGain = options.referenceGain === undefined ? 1 : options.referenceGain;
	if (vnaTime && (!Number.isFinite(referenceGain) || referenceGain <= 0)) {
		throw new RangeError('VNA-time referenceGain must be positive and finite.');
	}
	if (vnaTime && referencePort !== undefined && (!Number.isInteger(referencePort) ||
		referencePort < 1 || referencePort > portCount || referencePort === outputPort)) {
		throw new RangeError('VNA-time referencePort must name another output port.');
	}
	if (vnaTime && referencePort !== undefined && referenceReceiver !== undefined) {
		throw new RangeError('Select referencePort or referenceReceiver, not both.');
	}
	if (vnaTime && referenceReceiver !== undefined &&
		(!referenceReceiver || typeof referenceReceiver.out !== 'function')) {
		throw new TypeError('VNA-time referenceReceiver must be a demod result.');
	}
	if (!vnaTime && (referencePort !== undefined || referenceReceiver !== undefined ||
		options.referenceGain !== undefined)) {
		throw new RangeError('referencePort, referenceReceiver, and referenceGain are only for VNA reception.');
	}
	if (!Number.isInteger(outputPort) || outputPort < 1 || outputPort > portCount) {
		throw new RangeError('demod outputPort is outside the nPort dimensions.');
	}
	if (!Number.isInteger(inputPort) || inputPort < 1 || inputPort > portCount) {
		throw new RangeError('demod inputPort is outside the nPort dimensions.');
	}
	var count = signal.sampleCount;
	if (signal.rows.length !== Math.floor(count / 2) + 1) {
		throw new RangeError('Digital signal rows do not cover DC through Nyquist.');
	}
	var spectrum = new Array(count);
	var voltageScale = Math.sqrt(signal.referenceImpedanceOhms);
	var noiseSpectrum = options.noise === false ? null :
		noiseWaveformSpectrum(stage, signal, inputPort, outputPort, options);
	if (vnaTime && (referencePort !== undefined || referenceReceiver !== undefined) && noiseSpectrum) {
		throw new RangeError('VNA reference normalization requires noise: false.');
	}
	var referenceSpectrum = referenceReceiver === undefined ? null : referenceReceiver.out('spectrum');
	var referenceFrequencies = referenceReceiver === undefined ? null : referenceReceiver.out('frequencies');
	if (referenceSpectrum && (!Array.isArray(referenceSpectrum) ||
		referenceSpectrum.length !== signal.rows.length ||
		!Array.isArray(referenceFrequencies) ||
		referenceFrequencies.some(function (frequency, index) {
			return frequency !== signal.rows[index].frequency;
		}))) {
		throw new RangeError('VNA referenceReceiver must use the same frequency grid.');
	}
	for (var bin = 0; bin < signal.rows.length; bin++) {
		var wave = signal.rows[bin].waves[outputPort - 1];
		var voltage = complex(wave.getR() * voltageScale, wave.getI() * voltageScale);
		if (noiseSpectrum) voltage = voltage.add(noiseSpectrum[bin]);
		if (vnaTime) {
			if (referencePort !== undefined || referenceSpectrum) {
				var reference = referenceSpectrum ? referenceSpectrum[bin] :
					signal.rows[bin].waves[referencePort - 1].mul(complex(voltageScale, 0));
				if (reference.mag() === 0) {
					if (voltage.mag() !== 0) throw new RangeError('VNA reference receiver has zero signal.');
					voltage = complex(0, 0);
				} else voltage = voltage.div(reference);
			}
			voltage = voltage.mul(complex(referenceGain, 0));
		}
		var selfConjugate = bin === 0 || (count % 2 === 0 && bin === count / 2);
		if (selfConjugate) {
			if (Math.abs(voltage.getI()) > 1e-9 * Math.max(1, Math.abs(voltage.getR()))) {
				throw new RangeError('DC and Nyquist output bins must be real to reconstruct a real waveform.');
			}
			spectrum[bin] = complex(voltage.getR(), 0);
		} else {
			spectrum[bin] = voltage;
			spectrum[count - bin] = complex(voltage.getR(), -voltage.getI());
		}
	}
	var samples = invFFT(spectrum);
	return {
		out: function (selector = 'waveform') {
			if (selector === 'sample count') return count;
			if (selector === 'frequency count') return signal.rows.length;
			if (selector === 'frequencies') {
				return signal.rows.map(function (row) { return row.frequency; });
			}
			if (selector === 'spectrum') {
				return spectrum.slice(0, signal.rows.length).map(function (value) { return value.copy(); });
			}
			if (selector === 'bit count') {
				if (signal.mode === 'OFDM') return signal.bitCount;
				if (!Number.isInteger(signal.samplesPerBit) || signal.samplesPerBit < 1) {
					throw new RangeError('Receiver bit count requires samplesPerBit metadata.');
				}
				return count / signal.samplesPerBit;
			}
			if (selector === 'bits' || selector === 'bit string' || selector === 'ASCII text') {
				var samplesPerBit = signal.samplesPerBit;
				if (!Number.isInteger(samplesPerBit) || samplesPerBit < 1 ||
					count % samplesPerBit !== 0) {
					throw new RangeError('Bit reception requires samplesPerBit metadata.');
				}
				var bitVoltages = [];
				for (var bitStart = 0; bitStart < count; bitStart += samplesPerBit) {
					bitVoltages.push(samples[bitStart + Math.floor(samplesPerBit / 2)].getR());
				}
				var threshold = options.thresholdVolts;
				if (threshold === undefined) {
					var sortedVoltages = bitVoltages.slice().sort(function (a, b) { return a - b; });
					var lowCenter = sortedVoltages[Math.floor(sortedVoltages.length * 0.1)];
					var highCenter = sortedVoltages[Math.floor(sortedVoltages.length * 0.9)];
					if (lowCenter === highCenter) {
						lowCenter = sortedVoltages[0];
						highCenter = sortedVoltages[sortedVoltages.length - 1];
					}
					if (lowCenter === highCenter) {
						throw new RangeError('ASCII reception needs two voltage levels or an explicit thresholdVolts.');
					}
					for (var iteration = 0; iteration < 12; iteration++) {
						var split = (lowCenter + highCenter) / 2;
						var lowSum = 0, lowCount = 0, highSum = 0, highCount = 0;
						for (var voltageIndex = 0; voltageIndex < bitVoltages.length; voltageIndex++) {
							if (bitVoltages[voltageIndex] <= split) {
								lowSum += bitVoltages[voltageIndex];
								lowCount++;
							} else {
								highSum += bitVoltages[voltageIndex];
								highCount++;
							}
						}
						if (lowCount === 0 || highCount === 0) break;
						lowCenter = lowSum / lowCount;
						highCenter = highSum / highCount;
					}
					threshold = (lowCenter + highCenter) / 2;
				}
				if (!Number.isFinite(threshold)) throw new RangeError('ASCII thresholdVolts must be finite.');
				var bits = bitVoltages.map(function (voltage) { return voltage > threshold ? 1 : 0; });
				if (selector === 'bits') return bits;
				if (selector === 'bit string') return bits.join('');
				if (bits.length % 8 !== 0) {
					throw new RangeError('ASCII reception requires complete eight-bit bytes.');
				}
				var message = '';
				for (var byte = 0; byte < bits.length; byte += 8) {
					var code = 0;
					for (var bit = 0; bit < 8; bit++) {
						code = (code << 1) | bits[byte + bit];
					}
					message += code > 127 ? '\uFFFD' : String.fromCharCode(code);
				}
				return message;
			}
			if (selector !== 'waveform') {
				throw new RangeError('Unknown demod output: ' + selector);
			}
			var output = [['Time (ns)', vnaTime &&
				(referencePort !== undefined || referenceSpectrum) ?
				'Normalized response' : 'Output (V)']];
			for (var index = 0; index < count; index++) {
				output.push([index * 1e9 / signal.sampleRateHz, samples[index].getR()]);
			}
			return output;
		}
	};
}
