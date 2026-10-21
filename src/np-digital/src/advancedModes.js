// Modified: 2026-10-21
import {fftBins, invFFT} from '../../np-math/src/fft';
import {complex} from '../../np-math/src/complex';
import {global} from '../../np-global/src/global';

function powerOfTwo(value) {
	return Number.isInteger(value) && value > 0 && (value & (value - 1)) === 0;
}

function grayToIndex(gray) {
	var index = gray;
	for (var shifted = gray >> 1; shifted; shifted >>= 1) index ^= shifted;
	return index;
}

function bitsValue(bits, start, count) {
	var value = 0;
	for (var bit = 0; bit < count; bit++) value = (value << 1) | bits[start + bit];
	return value;
}

function symbolFromBits(bits, start, order) {
	var axisBits = Math.log2(order) / 2;
	var side = Math.sqrt(order);
	var real = 2 * grayToIndex(bitsValue(bits, start, axisBits)) - side + 1;
	var imaginary = 2 * grayToIndex(bitsValue(bits, start + axisBits, axisBits)) - side + 1;
	var scale = Math.sqrt(2 * (order - 1) / 3);
	return complex(real / scale, imaginary / scale);
}

function bitsFromSymbol(symbol, order) {
	var axisBits = Math.log2(order) / 2;
	var side = Math.sqrt(order);
	var scale = Math.sqrt(2 * (order - 1) / 3);
	var result = [];
	for (var coordinate of [symbol.getR(), symbol.getI()]) {
		var index = Math.max(0, Math.min(side - 1,
			Math.round((coordinate * scale + side - 1) / 2)));
		var gray = index ^ (index >> 1);
		for (var shift = axisBits - 1; shift >= 0; shift--) result.push((gray >> shift) & 1);
	}
	return result;
}

function setSamples(tx, samples, fftList, sampleRateHz) {
	tx.samples = samples;
	tx.sampleCount = samples.length;
	if (sampleRateHz !== undefined) tx.sampleRateHz = sampleRateHz;
	tx.fList = Array.from({length: Math.floor(samples.length / 2) + 1}, function (_, bin) {
		return bin * tx.sampleRateHz / samples.length;
	});
	tx.spectrum = fftBins(samples).slice(0, tx.fList.length);
	if (fftList === undefined) global.fList = tx.fList.slice();
	else {
		fftList.length = 0;
		tx.fList.forEach(function (frequency) { fftList.push(frequency); });
	}
}

function carrierSample(symbol, frequency, index, sampleRateHz) {
	var theta = 2 * Math.PI * frequency * index / sampleRateHz;
	return symbol.getR() * Math.cos(theta) - symbol.getI() * Math.sin(theta);
}

function gaussianLevels(bits, samplesPerBit, bt) {
	var levels = bits.flatMap(function (bit) {
		return Array(samplesPerBit).fill(bit ? 1 : -1);
	});
	var sigma = samplesPerBit * Math.sqrt(Math.log(2)) / (2 * Math.PI * bt);
	var radius = Math.ceil(4 * sigma);
	var weights = Array.from({length: 2 * radius + 1}, function (_, index) {
		var offset = index - radius;
		return Math.exp(-offset * offset / (2 * sigma * sigma));
	});
	var sum = weights.reduce(function (total, weight) { return total + weight; }, 0);
	return levels.map(function (_, index) {
		var filtered = 0;
		for (var offset = -radius; offset <= radius; offset++) {
			filtered += weights[offset + radius] *
				levels[((index + offset) % levels.length + levels.length) % levels.length];
		}
		return filtered / sum;
	});
}

// Add symbol mapping or continuous-phase modulation to a bit source.
export function modulateAdvanced(tx, options, carrierHz) {
	var mode = options.mode;
	var amplitude = options.carrierAmplitudeVolts === undefined ? 1 : options.carrierAmplitudeVolts;
	if (!Number.isFinite(amplitude) || amplitude <= 0) {
		throw new RangeError(mode + ' needs positive carrierAmplitudeVolts.');
	}
	var samplesPerBit = tx.samplesPerBit;
	var sampleRateHz = tx.sampleRateHz;
	var samples = [];
	var extras = {carrierAmplitudeVolts: amplitude};
	if (mode === 'DPSK') {
		var phaseSign = 1;
		var signs = [phaseSign]; // Known reference symbol precedes the first data bit.
		tx.bits.forEach(function (bit) {
			if (bit) phaseSign = -phaseSign;
			signs.push(phaseSign);
		});
		samples = signs.flatMap(function (sign, symbolIndex) {
			return Array.from({length: samplesPerBit}, function (_, offset) {
				var index = symbolIndex * samplesPerBit + offset;
				return sign * amplitude * Math.cos(2 * Math.PI * carrierHz * index / sampleRateHz);
			});
		});
		tx.referenceSymbols = 1;
		extras.referenceSymbols = 1;
	} else if (mode === 'QPSK' || mode === 'QAM') {
		var order = mode === 'QPSK' ? 4 : (options.order === undefined ? 16 : options.order);
		if (!powerOfTwo(order) || !Number.isInteger(Math.sqrt(order)) || order < 4 || order > 256) {
			throw new RangeError('QAM order must be 4, 16, 64, or 256.');
		}
		var bitsPerSymbol = Math.log2(order);
		var symbolCount = Math.ceil(tx.bits.length / bitsPerSymbol);
		var pilot = complex((Math.sqrt(order) - 1) / Math.sqrt(2 * (order - 1) / 3),
			(Math.sqrt(order) - 1) / Math.sqrt(2 * (order - 1) / 3));
		var symbols = (mode === 'QAM' ? [pilot] : []).concat(
			Array.from({length: symbolCount}, function (_, index) {
				var paddedBits = tx.bits.slice(index * bitsPerSymbol, (index + 1) * bitsPerSymbol);
				while (paddedBits.length < bitsPerSymbol) paddedBits.push(0);
				return symbolFromBits(paddedBits, 0, order);
			}));
		var samplesPerSymbol = bitsPerSymbol * samplesPerBit;
		samples = symbols.flatMap(function (symbol, symbolIndex) {
			return Array.from({length: samplesPerSymbol}, function (_, offset) {
				var index = symbolIndex * samplesPerSymbol + offset;
				return amplitude * carrierSample(symbol, carrierHz, index, sampleRateHz);
			});
		});
		tx.order = order;
		tx.bitsPerSymbol = bitsPerSymbol;
		tx.bitCount = tx.bits.length;
		tx.symbolRate = sampleRateHz / samplesPerBit / bitsPerSymbol;
		tx.referenceSymbols = mode === 'QAM' ? 1 : 0;
		Object.assign(extras, {order: order, bitsPerSymbol: bitsPerSymbol,
			referenceSymbols: tx.referenceSymbols,
			symbolRate: sampleRateHz / samplesPerBit / bitsPerSymbol});
	} else if (mode === 'MSK' || mode === 'GMSK') {
		if (samplesPerBit < 4) {
			throw new RangeError(mode + ' needs at least four samplesPerBit for phase-slope reception.');
		}
		var bitRate = sampleRateHz / samplesPerBit;
		var deviationHz = bitRate / 4;
		var bt = options.bt === undefined ? 0.3 : options.bt;
		if (mode === 'GMSK' && (!Number.isFinite(bt) || bt < 0.1 || bt > 1)) {
			throw new RangeError('GMSK bt must be from 0.1 through 1.');
		}
		var levels = mode === 'GMSK' ? gaussianLevels(tx.bits, samplesPerBit, bt) :
			tx.bits.flatMap(function (bit) { return Array(samplesPerBit).fill(bit ? 1 : -1); });
		var phase = 0;
		samples = levels.map(function (level) {
			var voltage = amplitude * Math.cos(phase);
			phase += 2 * Math.PI * (carrierHz + deviationHz * level) / sampleRateHz;
			return voltage;
		});
		tx.frequencyDeviationHz = deviationHz;
		if (mode === 'GMSK') tx.bt = bt;
		Object.assign(extras, {frequencyDeviationHz: deviationHz,
			...(mode === 'GMSK' ? {bt: bt} : {})});
	} else if (mode === 'OFDM') {
		var subcarrierCount = options.subcarrierCount === undefined ? 64 : options.subcarrierCount;
		var fftSize = options.fftSize === undefined ? 4 * subcarrierCount : options.fftSize;
		var symbolRate = options.symbolRate === undefined ? 5e6 : options.symbolRate;
		var subcarrierMode = options.subcarrierMode === undefined ? 'QPSK' : options.subcarrierMode;
		var order = subcarrierMode === 'QPSK' ? 4 : subcarrierMode === 'QAM' ?
			(options.order === undefined ? 16 : options.order) : 0;
		if (!powerOfTwo(subcarrierCount) || subcarrierCount < 2 ||
			!powerOfTwo(fftSize) || fftSize < 2 * subcarrierCount + 2 ||
			!Number.isFinite(symbolRate) || symbolRate <= 0 ||
			!powerOfTwo(order) || !Number.isInteger(Math.sqrt(order)) || order > 256) {
			throw new RangeError('OFDM needs power-of-two subcarrierCount and fftSize, positive symbolRate, and QPSK or square QAM symbols.');
		}
		var bitsPerSymbol = Math.log2(order);
		if (carrierHz <= subcarrierCount * symbolRate / 2 ||
			carrierHz + subcarrierCount * symbolRate / 2 >= symbolRate * fftSize / 2 ||
			Math.abs(carrierHz / symbolRate - Math.round(carrierHz / symbolRate)) > 1e-9) {
			throw new RangeError('OFDM carrier must be bin-aligned and all subcarriers must lie between DC and Nyquist.');
		}
		var blockCount = Math.ceil(tx.bits.length / (subcarrierCount * bitsPerSymbol));
		var slotCount = Math.ceil(tx.bits.length / bitsPerSymbol);
		var blockRateHz = symbolRate * fftSize;
		for (var block = 0; block < blockCount; block++) {
			var blockSpectrum = Array.from({length: fftSize}, function () { return complex(0, 0); });
			var scale = fftSize / Math.sqrt(subcarrierCount + 1);
			blockSpectrum[0] = complex(scale, 0); // Pilot at the carrier.
			for (var slot = 0; slot < subcarrierCount; slot++) {
				var symbolIndex = block * subcarrierCount + slot;
				if (symbolIndex >= slotCount) break;
				var paddedBits = tx.bits.slice(symbolIndex * bitsPerSymbol,
					(symbolIndex + 1) * bitsPerSymbol);
				while (paddedBits.length < bitsPerSymbol) paddedBits.push(0);
				var subcarrier = slot < subcarrierCount / 2 ? slot + 1 :
					slot - subcarrierCount;
				var location = (subcarrier + fftSize) % fftSize;
				var symbol = symbolFromBits(paddedBits, 0, order);
				blockSpectrum[location] = complex(scale * symbol.getR(), scale * symbol.getI());
			}
			var baseband = invFFT(blockSpectrum);
			for (var sample = 0; sample < fftSize; sample++) {
				var index = block * fftSize + sample;
				samples.push(amplitude * carrierSample(baseband[sample], carrierHz,
					index, blockRateHz));
			}
		}
		tx.samplesPerBit = undefined;
		tx.bitCount = tx.bits.length;
		tx.subcarrierCount = subcarrierCount;
		tx.fftSize = fftSize;
		tx.symbolRate = symbolRate;
		tx.subcarrierMode = subcarrierMode;
		tx.order = order;
		tx.bitsPerSymbol = bitsPerSymbol;
		Object.assign(extras, {subcarrierCount: subcarrierCount, fftSize: fftSize,
			symbolRate: symbolRate, subcarrierMode: subcarrierMode, order: order,
			bitsPerSymbol: bitsPerSymbol, blockCount: blockCount});
		setSamples(tx, samples, options.fftList, blockRateHz);
	}
	if (mode !== 'OFDM') {
		if (carrierHz + (tx.frequencyDeviationHz || 0) >= sampleRateHz / 2) {
			throw new RangeError(mode + ' carrier and deviation must remain below Nyquist.');
		}
		setSamples(tx, samples, options.fftList);
	}
	tx.dataMode = tx.mode;
	tx.mode = mode;
	tx.carrierHz = carrierHz;
	tx.carrierAmplitudeVolts = amplitude;
	return extras;
}

function correlator(samples, start, count, frequency, sampleRateHz) {
	var real = 0, imaginary = 0;
	for (var offset = 0; offset < count; offset++) {
		var index = start + offset;
		var theta = 2 * Math.PI * frequency * index / sampleRateHz;
		real += samples[index + 1][1] * Math.cos(theta);
		imaginary -= samples[index + 1][1] * Math.sin(theta);
	}
	return complex(2 * real / count, 2 * imaginary / count);
}

function analyticSamples(receiver, signal) {
	var positive = receiver.out('spectrum');
	var full = Array.from({length: signal.sampleCount}, function () { return complex(0, 0); });
	for (var bin = 0; bin < positive.length; bin++) {
		var factor = bin === 0 || (signal.sampleCount % 2 === 0 && bin === signal.sampleCount / 2) ? 1 : 2;
		full[bin] = complex(factor * positive[bin].getR(), factor * positive[bin].getI());
	}
	return invFFT(full);
}

function ascii(bits) {
	if (bits.length % 8 !== 0) throw new RangeError('ASCII reception requires complete eight-bit bytes.');
	var text = '';
	for (var byte = 0; byte < bits.length; byte += 8) {
		var code = bitsValue(bits, byte, 8);
		text += code > 127 ? '\uFFFD' : String.fromCharCode(code);
	}
	return text;
}

// All these receivers use the received waveform, never the transmitted bits.
export function demodulateAdvanced(receiver, signal) {
	var mode = signal.mode;
	var passband = receiver.out('waveform');
	var sampleRateHz = signal.sampleRateHz;
	var bits = [];
	var symbols = [['Symbol', 'In-phase', 'Quadrature']];
	if (mode === 'DPSK' || mode === 'QPSK' || mode === 'QAM') {
		var symbolBits = mode === 'DPSK' ? 1 : signal.bitsPerSymbol;
		var samplesPerSymbol = signal.samplesPerBit * symbolBits;
		var observed = [];
		for (var start = 0; start < signal.sampleCount; start += samplesPerSymbol) {
			var value = correlator(passband, start, samplesPerSymbol,
				signal.carrierHz, sampleRateHz);
			observed.push(value);
			symbols.push([observed.length - 1, value.getR(), value.getI()]);
		}
		if (mode === 'DPSK') {
			for (var index = 1; index < observed.length; index++) {
				var previous = observed[index - 1], current = observed[index];
				bits.push(previous.getR() * current.getR() +
					previous.getI() * current.getI() < 0 ? 1 : 0);
			}
		} else {
			var gain = mode === 'QAM' ? observed[0].div(complex(
				(Math.sqrt(signal.order) - 1) / Math.sqrt(2 * (signal.order - 1) / 3),
				(Math.sqrt(signal.order) - 1) / Math.sqrt(2 * (signal.order - 1) / 3))) : null;
			if (gain && gain.mag() < 1e-12) throw new RangeError('QAM reference symbol has no received energy.');
			for (var index = signal.referenceSymbols || 0; index < observed.length; index++) {
				bits.push(...bitsFromSymbol(gain ? observed[index].div(gain) : observed[index], signal.order));
			}
		}
	} else if (mode === 'MSK' || mode === 'GMSK') {
		var analytic = analyticSamples(receiver, signal);
		var samplesPerBit = signal.samplesPerBit;
		for (var start = 0; start < signal.sampleCount; start += samplesPerBit) {
			var left = start + Math.floor(samplesPerBit / 4);
			var right = start + Math.floor(3 * samplesPerBit / 4);
			var first = analytic[left], last = analytic[right];
			var delta = last.mul(complex(first.getR(), -first.getI()));
			var angle = Math.atan2(delta.getI(), delta.getR()) -
				2 * Math.PI * signal.carrierHz * (right - left) / sampleRateHz;
			bits.push(Math.atan2(Math.sin(angle), Math.cos(angle)) > 0 ? 1 : 0);
			symbols.push([bits.length - 1, Math.cos(angle), Math.sin(angle)]);
		}
	} else if (mode === 'OFDM') {
		var fftSize = signal.fftSize;
		var totalSlots = Math.ceil(signal.bitCount / signal.bitsPerSymbol);
		for (var block = 0; block < signal.sampleCount / fftSize; block++) {
			var pilot = correlator(passband, block * fftSize, fftSize,
				signal.carrierHz, sampleRateHz);
			if (pilot.mag() < 1e-12) throw new RangeError('OFDM pilot has no received energy.');
			for (var slot = 0; slot < signal.subcarrierCount; slot++) {
				var symbolIndex = block * signal.subcarrierCount + slot;
				if (symbolIndex >= totalSlots) break;
				var subcarrier = slot < signal.subcarrierCount / 2 ? slot + 1 :
					slot - signal.subcarrierCount;
				var measured = correlator(passband, block * fftSize, fftSize,
					signal.carrierHz + subcarrier * signal.symbolRate, sampleRateHz);
				var equalized = measured.div(pilot);
				bits.push(...bitsFromSymbol(equalized, signal.order));
				symbols.push([symbolIndex, equalized.getR(), equalized.getI()]);
			}
		}
		bits.length = signal.bitCount;
	}
	if (signal.bitCount !== undefined) bits.length = signal.bitCount;
	var baseband = bits.flatMap(function (bit) {
		return Array(signal.samplesPerBit || 1).fill(bit);
	});
	return {
		out: function (selector = 'waveform') {
			if (selector === 'mode') return mode;
			if (selector === 'data mode') return signal.dataMode;
			if (selector === 'bits') return bits.slice();
			if (selector === 'bit string') return bits.join('');
			if (selector === 'bit count') return bits.length;
			if (selector === 'ASCII text') return ascii(bits);
			if (selector === 'symbols') return symbols.map(function (row) { return row.slice(); });
			if (selector === 'carrier waveform' || selector === 'passband waveform') return passband;
			if (selector === 'waveform') return [['Time (ns)', 'Output (V)']].concat(
				baseband.map(function (value, index) { return [index * 1e9 / sampleRateHz, value]; }));
			return receiver.out(selector);
		}
	};
}
