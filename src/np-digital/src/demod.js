// Modified: 2026-10-13
import {digitalRx} from './digitalRx';
import {FFT} from '../../np-math/src/fft';

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

// Recover baseband levels from a real carrier using the known carrier phase.
export function demod(stage, options = {}) {
	var receiver = digitalRx(stage, options);
	var signal = stage.signal;
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
		if (bits === undefined) bits = decideBits(levels, options.thresholdVolts);
		return bits;
	};
	return {
		out: function (selector = 'waveform') {
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
