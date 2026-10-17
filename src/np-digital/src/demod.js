// Modified: 2026-10-15
import {receiveWaveform} from './receiverWaveform';
import {demodulateAdvanced} from './advancedModes';
import {FFT} from '../../np-math/src/fft';
import {complex} from '../../np-math/src/complex';
import {nPort} from '../../np-nport/src/nPort';
import {applyInputSignal} from '../../np-nport/src/signal';

// Connect a transmitter directly to the receiver using the transmitter's
// original frequency grid and impedance, independent of the active context.
function directStage(source) {
	if (!source || !Array.isArray(source.fList) || source.fList.length === 0) {
		throw new TypeError('demod requires an nPort with a signal or a mod() result.');
	}
	var stage = new nPort();
	stage.setspars(source.fList.map(function (frequency) {
		return [frequency, complex(0, 0), complex(1, 0), complex(1, 0), complex(0, 0)];
	}));
	stage.setglobal({fList: source.fList, Ro: source.referenceImpedanceOhms,
		Temp: 290, tList: [], twoTone: undefined});
	return applyInputSignal(stage, {signal: source, inputPort: 1});
}

function decideBits(levels, threshold) {
	if (threshold === undefined) {
		var sorted = levels.slice().sort(function (a, b) { return a - b; });
		var lowCenter = sorted[Math.floor(sorted.length * 0.1)];
		var highCenter = sorted[Math.floor(sorted.length * 0.9)];
		if (lowCenter === highCenter) {
			lowCenter = sorted[0];
			highCenter = sorted[sorted.length - 1];
		}
		if (lowCenter === highCenter) {
			throw new RangeError('Bit reception needs two voltage levels or an explicit thresholdVolts.');
		}
		for (var iteration = 0; iteration < 12; iteration++) {
			var split = (lowCenter + highCenter) / 2;
			var lowSum = 0, lowCount = 0, highSum = 0, highCount = 0;
			levels.forEach(function (level) {
				if (level <= split) { lowSum += level; lowCount++; }
				else { highSum += level; highCount++; }
			});
			if (!lowCount || !highCount) break;
			lowCenter = lowSum / lowCount;
			highCenter = highSum / highCount;
		}
		threshold = (lowCenter + highCenter) / 2;
	}
	if (!Number.isFinite(threshold)) throw new RangeError('demod thresholdVolts must be finite.');
	return levels.map(function (level) { return level > threshold ? 1 : 0; });
}

// Recover the envelope from the three propagated complex peak-voltage tones.
function demodAM(stage, options) {
	if (!options || Array.isArray(options) || typeof options !== 'object') {
		throw new TypeError('demod options must be an object.');
	}
	if (options.noise !== undefined && options.noise !== false) {
		throw new RangeError('AM envelope analysis does not yet generate random noise samples.');
	}
	if (options.mode !== undefined) {
		throw new RangeError('Select AM demod output with .out() instead of mode.');
	}
	var portCount = Math.sqrt(stage.spars[0].length - 1);
	var outputPort = options.outputPort === undefined ? 2 : options.outputPort;
	var points = options.points === undefined ? 1001 : options.points;
	if (!Number.isInteger(outputPort) || outputPort < 1 || outputPort > portCount ||
		!Number.isInteger(points) || points < 3) {
		throw new RangeError('AM demod needs a valid outputPort and at least three envelope points.');
	}
	var signal = stage.signal;
	var voltageScale = complex(Math.sqrt(signal.referenceImpedanceOhms), 0);
	var lower = signal.rows[0].waves[outputPort - 1].mul(voltageScale);
	var carrier = signal.rows[1].waves[outputPort - 1].mul(voltageScale);
	var upper = signal.rows[2].waves[outputPort - 1].mul(voltageScale);
	if (carrier.mag() === 0) throw new RangeError('AM phase requires a nonzero output carrier.');
	var envelope = [['Time (s)', 'Envelope (V)']];
	var phase = [['Time (s)', 'Phase deviation (deg)']];
	var peakPhase = 0;
	var carrierPhase = Math.atan2(carrier.getI(), carrier.getR());
	for (var index = 0; index < points; index++) {
		var theta = 2 * Math.PI * index / (points - 1);
		var cosine = Math.cos(theta), sine = Math.sin(theta);
		var real = carrier.getR() + (lower.getR() + upper.getR()) * cosine +
			(lower.getI() - upper.getI()) * sine;
		var imaginary = carrier.getI() + (lower.getI() + upper.getI()) * cosine +
			(upper.getR() - lower.getR()) * sine;
		var difference = Math.atan2(imaginary, real) - carrierPhase;
		difference = Math.atan2(Math.sin(difference), Math.cos(difference)) * 180 / Math.PI;
		var time = index / ((points - 1) * signal.toneHz);
		envelope.push([time, Math.hypot(real, imaginary)]);
		phase.push([time, difference]);
		peakPhase = Math.max(peakPhase, Math.abs(difference));
	}
	return {
		out: function (selector) {
			if (selector === 'envelope') return envelope.map(function (row) { return row.slice(); });
			if (selector === 'phase') return phase.map(function (row) { return row.slice(); });
			if (selector === 'amToPmDeg') return peakPhase;
			if (selector === 'tones') return stage.out('signal' + outputPort + 'V',
				'signal' + outputPort + 'Deg', 'signal' + outputPort + 'dBm');
			if (selector === 'frequencies') return signal.rows.map(function (row) { return row.frequency; });
			throw new RangeError('Unknown AM demod output: ' + selector);
		}
	};
}

// Coherently translate occupied sidebands back to the modulation frequency.
function demodSuppressed(stage, options) {
	if (!options || Array.isArray(options) || typeof options !== 'object') {
		throw new TypeError('demod options must be an object.');
	}
	if (options.noise !== undefined && options.noise !== false) {
		throw new RangeError('Suppressed-carrier analysis does not yet generate random noise samples.');
	}
	if (options.mode !== undefined) throw new RangeError('Select demod output with .out() instead of mode.');
	var signal = stage.signal;
	var outputPort = options.outputPort === undefined ? 2 : options.outputPort;
	var portCount = Math.sqrt(stage.spars[0].length - 1);
	var points = options.points === undefined ? 1001 : options.points;
	if (!Number.isInteger(outputPort) || outputPort < 1 || outputPort > portCount ||
		!Number.isInteger(points) || points < 3) {
		throw new RangeError(signal.mode + ' demod needs a valid outputPort and at least three points.');
	}
	var scale = complex(Math.sqrt(signal.referenceImpedanceOhms), 0);
	var tones = signal.rows.map(function (row) { return row.waves[outputPort - 1].mul(scale); });
	var waveform = [['Time (s)', 'Recovered voltage (V)']];
	var envelope = [['Time (s)', 'Envelope (V)']];
	for (var index = 0; index < points; index++) {
		var time = index / ((points - 1) * signal.toneHz);
		var real = 0, imaginary = 0;
		for (var toneIndex = 0; toneIndex < tones.length; toneIndex++) {
			var offset = signal.rows[toneIndex].frequency - signal.carrierHz;
			var theta = 2 * Math.PI * offset * time;
			real += tones[toneIndex].getR() * Math.cos(theta) - tones[toneIndex].getI() * Math.sin(theta);
			imaginary += tones[toneIndex].getR() * Math.sin(theta) +
				tones[toneIndex].getI() * Math.cos(theta);
		}
		waveform.push([time, real]);
		envelope.push([time, Math.hypot(real, imaginary)]);
	}
	return {out: function (selector) {
		if (selector === 'mode') return signal.mode;
		if (selector === 'waveform') return waveform.map(function (row) { return row.slice(); });
		if (selector === 'envelope') return envelope.map(function (row) { return row.slice(); });
		if (selector === 'tones') return stage.out('signal' + outputPort + 'V',
			'signal' + outputPort + 'Deg', 'signal' + outputPort + 'dBm');
		if (selector === 'frequencies') return signal.rows.map(function (row) { return row.frequency; });
		throw new RangeError('Unknown ' + signal.mode + ' demod output: ' + selector);
	}};
}

// Sum the propagated angle-modulation sidebands into a complex envelope.
function demodAngle(stage, options) {
	var mode = stage.signal.mode;
	if (!options || Array.isArray(options) || typeof options !== 'object') {
		throw new TypeError('demod options must be an object.');
	}
	if (options.noise !== undefined && options.noise !== false) {
		throw new RangeError(mode + ' analysis does not yet generate random receiver noise samples.');
	}
	if (options.mode !== undefined) {
		throw new RangeError('Select ' + mode + ' demod output with .out() instead of mode.');
	}
	var portCount = Math.sqrt(stage.spars[0].length - 1);
	var outputPort = options.outputPort === undefined ? 2 : options.outputPort;
	var points = options.points === undefined ? 1001 : options.points;
	if (!Number.isInteger(outputPort) || outputPort < 1 || outputPort > portCount ||
		!Number.isInteger(points) || points < 3) {
		throw new RangeError(mode + ' demod needs a valid outputPort and at least three display points.');
	}
	var signal = stage.signal;
	if (mode === 'PM' && points <= 2 * signal.beta + 1) {
		throw new RangeError('PM needs more display points to unwrap its phase.');
	}
	var order = signal.sidebandOrder;
	var scale = complex(Math.sqrt(signal.referenceImpedanceOhms), 0);
	var tones = signal.rows.map(function (row) { return row.waves[outputPort - 1].mul(scale); });
	var envelope = [['Time (s)', 'Envelope (V)']];
	var phase = [['Time (s)', 'Phase deviation (deg, wrapped)']];
	var deviation = [['Time (s)', 'Frequency deviation (Hz)']];
	var referencePhase;
	var peakDeviation = 0;
	var rawPhases = [];
	for (var index = 0; index < points; index++) {
		var theta = 2 * Math.PI * index / (points - 1);
		var real = 0, imaginary = 0, derivativeReal = 0, derivativeImaginary = 0;
		for (var toneIndex = 0; toneIndex < tones.length; toneIndex++) {
			var n = toneIndex - order;
			var cosine = Math.cos(n * theta), sine = Math.sin(n * theta);
			var componentReal = tones[toneIndex].getR() * cosine - tones[toneIndex].getI() * sine;
			var componentImaginary = tones[toneIndex].getR() * sine + tones[toneIndex].getI() * cosine;
			real += componentReal;
			imaginary += componentImaginary;
			derivativeReal += n * componentReal;
			derivativeImaginary += n * componentImaginary;
		}
		var power = real * real + imaginary * imaginary;
		if (power === 0) throw new RangeError(mode + ' demodulation requires a nonzero envelope.');
		var time = index / ((points - 1) * signal.toneHz);
		var currentPhase = Math.atan2(imaginary, real);
		rawPhases.push(currentPhase);
		if (referencePhase === undefined) referencePhase = currentPhase;
		var difference = currentPhase - referencePhase;
		difference = Math.atan2(Math.sin(difference), Math.cos(difference)) * 180 / Math.PI;
		var frequencyDeviation = signal.toneHz *
			(derivativeReal * real + derivativeImaginary * imaginary) / power;
		envelope.push([time, Math.sqrt(power)]);
		phase.push([time, difference]);
		deviation.push([time, frequencyDeviation]);
		peakDeviation = Math.max(peakDeviation, Math.abs(frequencyDeviation));
	}
	var peakPhaseRadians;
	if (mode === 'PM') {
		var unwrapped = [rawPhases[0]];
		for (var phaseIndex = 1; phaseIndex < points; phaseIndex++) {
			var step = rawPhases[phaseIndex] - rawPhases[phaseIndex - 1];
			unwrapped.push(unwrapped[phaseIndex - 1] + Math.atan2(Math.sin(step), Math.cos(step)));
		}
		var center = unwrapped.slice(0, -1).reduce(function (sum, value) {
			return sum + value;
		}, 0) / (points - 1);
		peakPhaseRadians = 0;
		phase = [['Time (s)', 'Phase deviation (deg)']];
		for (var phasePoint = 0; phasePoint < points; phasePoint++) {
			var phaseRadians = unwrapped[phasePoint] - center;
			phase.push([phasePoint / ((points - 1) * signal.toneHz),
				phaseRadians * 180 / Math.PI]);
			peakPhaseRadians = Math.max(peakPhaseRadians, Math.abs(phaseRadians));
		}
	}
	return {
		out: function (selector) {
			if (selector === 'envelope') return envelope.map(function (row) { return row.slice(); });
			if (selector === 'phase') return phase.map(function (row) { return row.slice(); });
			if (selector === 'frequency deviation') return deviation.map(function (row) { return row.slice(); });
			if (selector === 'peak frequency deviation Hz') return peakDeviation;
			if (selector === 'peak phase deviation radians' && mode === 'PM') return peakPhaseRadians;
			if (selector === 'tones') return stage.out('signal' + outputPort + 'V',
				'signal' + outputPort + 'Deg', 'signal' + outputPort + 'dBm');
			if (selector === 'frequencies') return signal.rows.map(function (row) { return row.frequency; });
			throw new RangeError('Unknown ' + mode + ' demod output: ' + selector);
		}
	};
}

// Compare quadrature energy at the two FSK tones in each known bit interval.
function demodFSK(receiver, signal) {
	var samplesPerBit = signal.samplesPerBit;
	if (!Number.isInteger(samplesPerBit) || samplesPerBit < 2 ||
		signal.sampleCount % samplesPerBit !== 0 ||
		!Number.isFinite(signal.frequencyDeviationHz) || signal.frequencyDeviationHz <= 0) {
		throw new RangeError('FSK reception needs two valid tones and whole bit intervals.');
	}
	var samples = receiver.out('waveform');
	var frequencies = [signal.carrierHz - signal.frequencyDeviationHz,
		signal.carrierHz + signal.frequencyDeviationHz];
	var bits = [];
	var energies = [['Bit', 'Low-tone energy', 'High-tone energy']];
	for (var start = 0; start < signal.sampleCount; start += samplesPerBit) {
		var scores = frequencies.map(function (frequency) {
			var inPhase = 0, quadrature = 0;
			for (var offset = 0; offset < samplesPerBit; offset++) {
				var index = start + offset;
				var phase = 2 * Math.PI * frequency * index / signal.sampleRateHz;
				inPhase += samples[index + 1][1] * Math.cos(phase);
				quadrature += samples[index + 1][1] * Math.sin(phase);
			}
			return inPhase * inPhase + quadrature * quadrature;
		});
		bits.push(scores[1] > scores[0] ? 1 : 0);
		energies.push([start / samplesPerBit, scores[0], scores[1]]);
	}
	return {
		out: function (selector = 'waveform') {
			if (selector === 'mode') return 'FSK';
			if (selector === 'data mode') return signal.dataMode;
			if (selector === 'bits') return bits.slice();
			if (selector === 'bit count') return bits.length;
			if (selector === 'tone energies') return energies.map(function (row) { return row.slice(); });
			if (selector === 'tone frequencies Hz') return frequencies.slice();
			if (selector === 'ASCII text') {
				if (bits.length % 8 !== 0) throw new RangeError('ASCII reception requires complete eight-bit bytes.');
				var message = '';
				for (var byte = 0; byte < bits.length; byte += 8) {
					var code = 0;
					for (var bit = 0; bit < 8; bit++) code = (code << 1) | bits[byte + bit];
					message += code > 127 ? '\uFFFD' : String.fromCharCode(code);
				}
				return message;
			}
			return receiver.out(selector === 'carrier waveform' || selector === 'passband waveform' ?
				'waveform' : selector);
		}
	};
}

// Recover baseband levels from a real carrier using the known carrier phase.
export function demod(stage, options = {}) {
	if (!stage || !Array.isArray(stage.spars)) stage = directStage(stage);
	if (stage.signal && stage.signal.mode === 'AM') return demodAM(stage, options);
	if (stage.signal && (stage.signal.mode === 'SSB' || stage.signal.mode === 'DSB-SC')) {
		return demodSuppressed(stage, options);
	}
	if (stage.signal && (stage.signal.mode === 'FM' || stage.signal.mode === 'PM')) {
		return demodAngle(stage, options);
	}
	var receiver = receiveWaveform(stage, options);
	var signal = stage.signal;
	if (['DPSK', 'QPSK', 'QAM', 'MSK', 'GMSK', 'OFDM'].includes(signal.mode)) {
		return demodulateAdvanced(receiver, signal);
	}
	if (signal.mode === 'FSK') return demodFSK(receiver, signal);
	var carrierHz = signal.carrierHz || 0;
	if (carrierHz === 0) return receiver;
	var samplesPerBit = signal.samplesPerBit;
	if (!Number.isInteger(samplesPerBit) || samplesPerBit < 1 ||
		signal.sampleCount % samplesPerBit !== 0) {
		throw new RangeError('Carrier demodulation requires a whole number of samples per bit.');
	}
	var passband = receiver.out('waveform');
	var sampleRateHz = signal.sampleRateHz;
	var levels = [];
	for (var bitStart = 0; bitStart < signal.sampleCount; bitStart += samplesPerBit) {
		var numerator = 0, denominator = 0;
		for (var offset = 0; offset < samplesPerBit; offset++) {
			var index = bitStart + offset;
			var reference = Math.cos(2 * Math.PI * carrierHz * index / sampleRateHz);
			if (signal.mode === 'PSK' && signal.encoding === 'Manchester' &&
				offset >= samplesPerBit / 2) reference = -reference;
			numerator += passband[index + 1][1] * reference;
			denominator += reference * reference;
		}
		if (denominator < 1e-12) throw new RangeError('Carrier has insufficient energy in a bit interval.');
		levels.push(numerator / denominator);
	}
	var baseband = levels.flatMap(function (level) {
		return Array(samplesPerBit).fill(level);
	});
	var bits;
	var receivedBits = function () {
		if (bits === undefined) {
			if (signal.mode === 'PSK') {
				var threshold = options.thresholdVolts === undefined ? 0 : options.thresholdVolts;
				if (!Number.isFinite(threshold)) throw new RangeError('PSK thresholdVolts must be finite.');
				bits = levels.map(function (level) { return level > threshold ? 1 : 0; });
			} else {
				bits = decideBits(levels, options.thresholdVolts);
			}
		}
		return bits;
	};
	return {
		out: function (selector = 'waveform') {
			if (selector === 'mode') return signal.mode;
			if (selector === 'data mode') return signal.dataMode || signal.mode;
			if (selector === 'encoding' && signal.mode === 'PSK') return signal.encoding || 'NRZ';
			if (selector === 'carrier waveform' || selector === 'passband waveform') {
				return receiver.out('waveform');
			}
			if (selector === 'waveform') {
				return [['Time (ns)', 'Output (V)']].concat(baseband.map(function (level, index) {
					return [index * 1e9 / sampleRateHz, level];
				}));
			}
			if (selector === 'bits') return receivedBits().slice();
			if (selector === 'bit count') return levels.length;
			if (selector === 'spectrum') return FFT(baseband).slice(0, signal.rows.length);
			if (selector === 'carrier spectrum') return receiver.out('spectrum');
			if (selector === 'ASCII text') {
				var bits = receivedBits();
				if (bits.length % 8 !== 0) throw new RangeError('ASCII reception requires complete eight-bit bytes.');
				var text = '';
				for (var byte = 0; byte < bits.length; byte += 8) {
					var code = 0;
					for (var bit = 0; bit < 8; bit++) code = (code << 1) | bits[byte + bit];
					text += code > 127 ? '\uFFFD' : String.fromCharCode(code);
				}
				return text;
			}
			return receiver.out(selector);
		}
	};
}
