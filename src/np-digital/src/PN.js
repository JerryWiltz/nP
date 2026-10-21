// Modified: 2026-10-21
import {global} from '../../np-global/src/global';


// Feedback masks for maximal-length, left-shifting registers of 2–16 stages.
var FEEDBACK_MASKS = {
	2: 0x3, 3: 0x5, 4: 0x9, 5: 0x17, 6: 0x21,
	7: 0x41, 8: 0x95, 9: 0x10d, 10: 0x20d, 11: 0x40b,
	12: 0x829, 13: 0x100d, 14: 0x2015, 15: 0x4001, 16: 0x801f
};

export function pnBits(stages = 7, seed = 2 ** stages - 1) {
	if (!Number.isInteger(stages) || !FEEDBACK_MASKS[stages]) {
		throw new RangeError('PN stages must be an integer from 2 through 16.');
	}
	var mask = 2 ** stages - 1;
	if (!Number.isInteger(seed) || seed < 1 || seed > mask) {
		throw new RangeError('PN' + stages + ' seed must be a nonzero ' + stages + '-bit integer.');
	}
	var bits = [];
	var register = seed;
	for (var i = 0; i < mask; i++) {
		bits.push((register >> (stages - 1)) & 1);
		var taps = register & FEEDBACK_MASKS[stages];
		var feedback = 0;
		while (taps) {
			feedback ^= taps & 1;
			taps >>= 1;
		}
		register = ((register << 1) | feedback) & mask;
	}
	if (register !== seed) throw new RangeError('PN' + stages + ' did not return to its seed.');
	return bits;
}

export function pn7Bits(seed = 0x7f) {
	return pnBits(7, seed);
}

// Advance the selected PN register once at each clock time.
export function PN(options = {}) {
	if (!options || Array.isArray(options) || typeof options !== 'object') {
		throw new TypeError('PN expects an options object.');
	}
	var stages = options.stages === undefined ? 7 : options.stages;
	if (!Number.isInteger(stages) || !FEEDBACK_MASKS[stages]) {
		throw new RangeError('PN stages must be an integer from 2 through 16.');
	}
	var periodLength = 2 ** stages - 1;
	var time = options.time === undefined ? global.tList : options.time;
	if (!Array.isArray(time) || time.length < periodLength || time.length % periodLength !== 0) {
		throw new RangeError('PN time must contain a multiple of ' + periodLength + ' clock ticks.');
	}
	var step = time[1] - time[0];
	if (!Number.isFinite(step) || step <= 0 || time.some(function (value, index) {
		return !Number.isFinite(value) ||
			Math.abs(value - (time[0] + index * step)) > Math.abs(step) * 1e-6;
	})) {
		throw new RangeError('PN time must be a uniformly spaced, increasing list in seconds.');
	}
	var lowVolts = options.lowVolts === undefined ? 0 : options.lowVolts;
	var highVolts = options.highVolts === undefined ? 1 : options.highVolts;
	if (!Number.isFinite(lowVolts) || !Number.isFinite(highVolts)) {
		throw new RangeError('PN voltage levels must be finite.');
	}
	var period = pnBits(stages, options.seed === undefined ? periodLength : options.seed);
	var bits = Array.from({length: time.length}, function (_, index) {
		return period[index % period.length];
	});
	var samples = bits.map(function (bit) { return bit ? highVolts : lowVolts; });
	var bitRate = 1 / step;
	if (!Number.isFinite(bitRate)) {
		throw new RangeError('PN clock spacing produces an invalid bit rate.');
	}
	var waveform = {
		kind: 'PN', mode: 'PN' + stages, stages: stages, bits: bits, samples: samples,
		time: time.slice(), samplesPerBit: 1, sampleRateHz: bitRate,
		bitRate: bitRate, lowVolts: lowVolts, highVolts: highVolts
	};
	waveform.out = function (selector) {
		if (selector === 'bits') return bits.slice();
		if (selector === 'bit string') return bits.join('');
		if (selector === 'samples') return samples.slice();
		if (selector === 'time') return waveform.time.slice();
		if (selector === 'bit count') return bits.length;
		if (selector === 'sample count') return samples.length;
		if (selector === 'bit rate') return bitRate;
		if (selector === 'sample rate' || selector === 'clock rate') return bitRate;
		if (selector === 'waveform') {
			return [['Time (ns)', 'Output (V)']].concat(waveform.time.map(function (value, index) {
				return [value * 1e9, samples[index]];
			}));
		}
		throw new RangeError('Unknown PN output: ' + selector);
	};
	return waveform;
}
