// Modified: 2026-10-20
import {fftBins} from '../../np-math/src/fft';
import {global} from '../../np-global/src/global';
import {pnBits} from './PN';

function patternBits(options) {
	var mode = options.mode === undefined ? 'PN7' : options.mode;
	var bits = [];
	if (typeof mode === 'string' && /^PN\d+$/.test(mode)) {
		var stages = Number(mode.slice(2));
		bits = pnBits(stages, options.seed === undefined ? 2 ** stages - 1 : options.seed);
	} else if (mode === 'ASCII') {
		if (typeof options.message !== 'string' || options.message.length === 0) {
			throw new TypeError('ASCII mode requires a nonempty message.');
		}
		for (var character = 0; character < options.message.length; character++) {
			var code = options.message.charCodeAt(character);
			if (code > 127) throw new RangeError('ASCII mode accepts only characters U+0000 through U+007F.');
			for (var shift = 7; shift >= 0; shift--) bits.push((code >> shift) & 1);
		}
	} else if (mode === 'bits') {
		if (typeof options.bits === 'string') {
			if (!/^[01]+$/.test(options.bits)) throw new TypeError('bits mode requires a nonempty 0/1 string.');
			bits = options.bits.split('').map(Number);
		} else if (Array.isArray(options.bits) && options.bits.length > 0 &&
			options.bits.every(function (bit) { return bit === 0 || bit === 1; })) {
			bits = options.bits.slice();
		} else {
			throw new TypeError('bits mode requires a nonempty array of 0s and 1s or a 0/1 string.');
		}
	} else {
		throw new RangeError('mod mode must be PN2 through PN16, ASCII, or bits.');
	}
	return {mode: mode, bits: bits};
}

// Describe an input waveform; the circuit itself remains an ordinary nPort.
// mod() may fill a caller-owned list instead of replacing the global default.
export function createSourceWaveform(options = {}, fftList) {
	if (!options || Array.isArray(options) || typeof options !== 'object') {
		throw new TypeError('mod expects an options object.');
	}
	if (fftList !== undefined && !Array.isArray(fftList)) {
		throw new TypeError('mod fftList must be an array.');
	}
	if (global.twoTone) throw new RangeError('Clear global.twoTone before digital waveform analysis.');
	var input = options.input;
	if (input !== undefined && (Object.keys(options).some(function (key) {
		return key !== 'input' && key !== 'samplesPerBit';
	}) || !input ||
		input.kind !== 'PN' || !Number.isInteger(input.stages) ||
		input.stages < 2 || input.stages > 16 || input.mode !== 'PN' + input.stages ||
		!Array.isArray(input.bits) ||
		!Array.isArray(input.samples) || !Array.isArray(input.time) ||
		input.bits.length < 2 ** input.stages - 1 ||
		input.bits.length % (2 ** input.stages - 1) !== 0 ||
		input.samples.length !== input.time.length ||
		input.samples.length !== input.bits.length ||
		input.samples.some(function (sample) { return !Number.isFinite(sample); }))) {
		throw new TypeError('mod input must be a PN clock waveform with only an optional samplesPerBit setting.');
	}
	var bitRate = input ? input.bitRate : options.bitRate === undefined ? 1e9 : options.bitRate;
	var samplesPerBit = options.samplesPerBit === undefined ? 8 : options.samplesPerBit;
	var lowVolts = input ? input.lowVolts : options.lowVolts === undefined ? 0 : options.lowVolts;
	var highVolts = input ? input.highVolts : options.highVolts === undefined ? 1 : options.highVolts;
	if (!Number.isFinite(bitRate) || bitRate <= 0 ||
		!Number.isInteger(samplesPerBit) || samplesPerBit < 1 ||
		!Number.isFinite(lowVolts) || !Number.isFinite(highVolts) ||
		!Number.isFinite(global.Ro) || global.Ro <= 0) {
		throw new RangeError('mod needs a positive bit rate, positive integer samples per bit, finite voltage levels, and positive global.Ro.');
	}
	var pattern = input ? {mode: input.mode, bits: input.bits.slice()} : patternBits(options);
	var samples = input ? input.samples.flatMap(function (sample) {
		return Array(samplesPerBit).fill(sample);
	}) : pattern.bits.flatMap(function (bit) {
		return Array(samplesPerBit).fill(bit ? highVolts : lowVolts);
	});
	var sampleCount = samples.length;
	var sampleRateHz = bitRate * samplesPerBit;
	if (!Number.isFinite(sampleRateHz)) throw new RangeError('mod sample rate must be finite.');
	var spectrum = fftBins(samples);
	var frequencyList = Array.from({length: Math.floor(sampleCount / 2) + 1}, function (_, bin) {
		return bin * sampleRateHz / sampleCount;
	});
	if (fftList === undefined) {
		global.fList = frequencyList;
	} else {
		fftList.length = 0;
		for (var frequencyIndex = 0; frequencyIndex < frequencyList.length; frequencyIndex++) {
			fftList.push(frequencyList[frequencyIndex]);
		}
	}
	var tx = {
		mode: pattern.mode,
		bits: pattern.bits,
		samples: samples,
		fList: frequencyList,
		spectrum: spectrum.slice(0, frequencyList.length),
		sampleRateHz: sampleRateHz,
		sampleCount: sampleCount,
		samplesPerBit: samplesPerBit,
		lowVolts: lowVolts,
		highVolts: highVolts,
		time: input ? input.time.flatMap(function (clockTime) {
			return Array.from({length: samplesPerBit}, function (_, index) {
				return clockTime + index / sampleRateHz;
			});
		}) : undefined,
		referenceImpedanceOhms: global.Ro
	};
	tx.out = function (selector) {
		if (selector === 'mode') return tx.mode;
		if (selector === 'bit count') return tx.bits.length;
		if (selector === 'sample count') return tx.sampleCount;
		if (selector === 'frequency count') return tx.fList.length;
		if (selector === 'frequencies') return tx.fList.slice();
		if (selector === 'spectrum') return tx.spectrum.map(function (value) { return value.copy(); });
		throw new RangeError('Unknown mod output: ' + selector);
	};
	return tx;
}
