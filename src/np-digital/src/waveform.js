// Modified: 2026-10-20
import {global} from '../../np-global/src/global';

// Sample one periodic voltage waveform on the selected time grid.
export function waveform(options = {}) {
	if (!options || Array.isArray(options) || typeof options !== 'object') {
		throw new TypeError('waveform expects an options object.');
	}
	var time = options.time === undefined ? global.tList : options.time;
	if (!Array.isArray(time) || time.length < 2) {
		throw new RangeError('waveform needs at least two time samples.');
	}
	var step = time[1] - time[0];
	if (!Number.isFinite(step) || step <= 0 || !Number.isFinite(1 / step) || time.some(function (value, index) {
		return !Number.isFinite(value) ||
			Math.abs(value - (time[0] + index * step)) > Math.abs(step) * 1e-6;
	})) {
		throw new RangeError('waveform time must be a uniformly spaced, increasing list in seconds.');
	}
	var period = options.period;
	if (!Number.isFinite(period) || period <= 0) {
		throw new RangeError('waveform period must be a positive number of seconds.');
	}
	var shape = options.shape === undefined ? 'triangle' : options.shape;
	var custom = shape === 'custom';
	if (options.points !== undefined && !custom) {
		throw new TypeError("waveform points require shape: 'custom'.");
	}
	if (custom && options.points === undefined) {
		throw new TypeError("waveform shape: 'custom' requires points.");
	}
	var points;
	var dutyCycle;
	var lowVolts;
	var highVolts;
	if (custom) {
		if (options.riseFraction !== undefined || options.dutyCycle !== undefined ||
			options.lowVolts !== undefined ||
			options.highVolts !== undefined || !Array.isArray(options.points) ||
			options.points.length < 2 || options.points.some(function (point) {
				return !Array.isArray(point) || point.length !== 2 ||
					!Number.isFinite(point[0]) || !Number.isFinite(point[1]);
			}) || options.points[0][0] !== 0 ||
			Math.abs(options.points[options.points.length - 1][0] - period) > period * 1e-9 ||
			options.points.some(function (point, index) {
				return index > 0 && point[0] <= options.points[index - 1][0];
			})) {
			throw new RangeError('waveform points must run from 0 to period with increasing, finite time-voltage pairs.');
		}
		points = options.points.map(function (point) { return point.slice(); });
	} else {
		if (shape !== 'triangle' && shape !== 'square' && shape !== 'rectifiedSine') {
			throw new RangeError('waveform shape must be triangle, square, rectifiedSine, or custom.');
		}
		lowVolts = options.lowVolts === undefined ? (shape === 'rectifiedSine' ? 0 : -1) : options.lowVolts;
		highVolts = options.highVolts === undefined ? 1 : options.highVolts;
		if (!Number.isFinite(lowVolts) || !Number.isFinite(highVolts)) {
			throw new RangeError('waveform voltage levels must be finite.');
		}
		if (shape === 'triangle') {
			var riseFraction = options.riseFraction === undefined ? 0.5 : options.riseFraction;
			if (options.dutyCycle !== undefined || !Number.isFinite(riseFraction) ||
				riseFraction <= 0 || riseFraction >= 1) {
				throw new RangeError('triangle waveform needs 0 < riseFraction < 1 and no dutyCycle.');
			}
			points = [[0, lowVolts], [period * riseFraction, highVolts], [period, lowVolts]];
		} else if (shape === 'square') {
			dutyCycle = options.dutyCycle === undefined ? 0.5 : options.dutyCycle;
			if (options.riseFraction !== undefined || !Number.isFinite(dutyCycle) ||
				dutyCycle <= 0 || dutyCycle >= 1) {
				throw new RangeError('square waveform needs 0 < dutyCycle < 1 and no riseFraction.');
			}
		} else if (options.riseFraction !== undefined || options.dutyCycle !== undefined) {
			throw new RangeError('rectifiedSine waveform does not use riseFraction or dutyCycle.');
		}
	}
	var samples = time.map(function (value) {
		var phase = ((value % period) + period) % period;
		if (shape === 'square') return phase < period * dutyCycle ? highVolts : lowVolts;
		if (shape === 'rectifiedSine') {
			return lowVolts + (highVolts - lowVolts) * Math.abs(Math.sin(2 * Math.PI * phase / period));
		}
		var segment = 1;
		while (segment < points.length - 1 && phase > points[segment][0]) segment++;
		var left = points[segment - 1];
		var right = points[segment];
		return left[1] + (right[1] - left[1]) * (phase - left[0]) / (right[0] - left[0]);
	});
	if (samples.some(function (value) { return !Number.isFinite(value); })) {
		throw new RangeError('waveform sample voltages must be finite.');
	}
	var result = {
		kind: 'waveform', shape: shape, period: period,
		time: time.slice(), samples: samples, sampleRateHz: 1 / step
	};
	result.out = function (selector = 'waveform') {
		if (selector === 'waveform') {
			return [['Time (s)', 'Voltage (V)']].concat(result.time.map(function (value, index) {
				return [value, samples[index]];
			}));
		}
		if (selector === 'time') return result.time.slice();
		if (selector === 'samples') return samples.slice();
		if (selector === 'sample count') return samples.length;
		if (selector === 'sample rate') return result.sampleRateHz;
		if (selector === 'period') return period;
		throw new RangeError('Unknown waveform output: ' + selector);
	};
	return result;
}
