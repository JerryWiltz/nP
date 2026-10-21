// Modified: 2026-10-20
import {complex} from './complex';
import {global} from '../../np-global/src/global';
import {sampleRateFromTime} from '../../np-global/src/timeGrid';

var fftTimeGrid = Symbol('FFT time grid');

function withOutput(values, axis, axisTitle, defaultSelector, lastIndex, realInput) {
	Object.defineProperty(values, 'out', {
		value: function (selector = defaultSelector, options = {}) {
			if (selector !== 'real' && selector !== 'imaginary' && selector !== 'magnitude' &&
				selector !== 'dBV') {
				throw new RangeError('FFT output must be real, imaginary, magnitude, or dBV.');
			}
			if (!axis || axis.length !== values.length) {
				throw new RangeError('A matching tList is needed to output inverse FFT samples.');
			}
			var floorDbv;
			if (selector === 'dBV') {
				if (axisTitle !== 'Frequency (Hz)' || !realInput) {
					throw new RangeError('FFT dBV output requires real voltage samples.');
				}
				if (!options || Array.isArray(options) || typeof options !== 'object') {
					throw new TypeError('FFT dBV options must be an object.');
				}
				floorDbv = options.floorDbv === undefined ? -80 : options.floorDbv;
				if (!Number.isFinite(floorDbv)) {
					throw new RangeError('FFT dBV floorDbv must be finite.');
				}
			}
			var heading = selector === 'dBV' ? 'Amplitude (dBV)' :
				selector.charAt(0).toUpperCase() + selector.slice(1);
			var table = [[axisTitle, heading]];
			for (var index = 0; index <= lastIndex; index++) {
				var value = values[index];
				var output;
				if (selector === 'dBV') {
					var rmsVolts = value.mag() / values.length;
					if (index !== 0 && !(values.length % 2 === 0 && index === lastIndex)) {
						rmsVolts *= Math.SQRT2;
					}
					output = Math.max(floorDbv, 20 * Math.log10(rmsVolts));
				} else {
					output = selector === 'real' ? value.getR() :
						selector === 'imaginary' ? value.getI() : value.mag();
				}
				table.push([axis[index], output]);
			}
			return table;
		}
	});
	return values;
}

// In-place radix-2 transform. Forward transforms are unscaled; inverse
// transforms divide by the number of samples.
function radix2(real, imaginary, inverse) {
	var length = real.length;
	for (var i = 1, j = 0; i < length; i++) {
		var bit = length / 2;
		while (j >= bit) {
			j -= bit;
			bit /= 2;
		}
		j += bit;
		if (i < j) {
			var swap = real[i]; real[i] = real[j]; real[j] = swap;
			swap = imaginary[i]; imaginary[i] = imaginary[j]; imaginary[j] = swap;
		}
	}
	for (var size = 2; size <= length; size *= 2) {
		var angle = (inverse ? 2 : -2) * Math.PI / size;
		var stepReal = Math.cos(angle);
		var stepImaginary = Math.sin(angle);
		for (var start = 0; start < length; start += size) {
			var factorReal = 1;
			var factorImaginary = 0;
			for (var offset = 0; offset < size / 2; offset++) {
				var upper = start + offset;
				var lower = upper + size / 2;
				var productReal = factorReal * real[lower] - factorImaginary * imaginary[lower];
				var productImaginary = factorReal * imaginary[lower] + factorImaginary * real[lower];
				real[lower] = real[upper] - productReal;
				imaginary[lower] = imaginary[upper] - productImaginary;
				real[upper] += productReal;
				imaginary[upper] += productImaginary;
				var nextReal = factorReal * stepReal - factorImaginary * stepImaginary;
				factorImaginary = factorReal * stepImaginary + factorImaginary * stepReal;
				factorReal = nextReal;
			}
		}
	}
	if (inverse) {
		for (var index = 0; index < length; index++) {
			real[index] /= length;
			imaginary[index] /= length;
		}
	}
}

// Bluestein's chirp convolution lets the radix-2 transform handle any length.
function bluestein(real, imaginary) {
	var length = real.length;
	var convolutionLength = 1;
	while (convolutionLength < 2 * length - 1) convolutionLength *= 2;
	var aReal = new Float64Array(convolutionLength);
	var aImaginary = new Float64Array(convolutionLength);
	var bReal = new Float64Array(convolutionLength);
	var bImaginary = new Float64Array(convolutionLength);
	for (var index = 0; index < length; index++) {
		var angle = Math.PI * ((index * index) % (2 * length)) / length;
		var cosine = Math.cos(angle);
		var sine = Math.sin(angle);
		aReal[index] = real[index] * cosine + imaginary[index] * sine;
		aImaginary[index] = imaginary[index] * cosine - real[index] * sine;
		bReal[index] = cosine;
		bImaginary[index] = sine;
		if (index > 0) {
			bReal[convolutionLength - index] = cosine;
			bImaginary[convolutionLength - index] = sine;
		}
	}
	radix2(aReal, aImaginary, false);
	radix2(bReal, bImaginary, false);
	for (var bin = 0; bin < convolutionLength; bin++) {
		var productReal = aReal[bin] * bReal[bin] - aImaginary[bin] * bImaginary[bin];
		aImaginary[bin] = aReal[bin] * bImaginary[bin] + aImaginary[bin] * bReal[bin];
		aReal[bin] = productReal;
	}
	radix2(aReal, aImaginary, true);
	for (var output = 0; output < length; output++) {
		var outputAngle = Math.PI * ((output * output) % (2 * length)) / length;
		var outputCosine = Math.cos(outputAngle);
		var outputSine = Math.sin(outputAngle);
		real[output] = aReal[output] * outputCosine + aImaginary[output] * outputSine;
		imaginary[output] = aImaginary[output] * outputCosine - aReal[output] * outputSine;
	}
}

function transform(samples, inverse) {
	if (!Array.isArray(samples) || samples.length === 0) {
		throw new TypeError('FFT and invFFT require a nonempty array of numbers or complex values.');
	}
	var length = samples.length;
	var real = new Float64Array(length);
	var imaginary = new Float64Array(length);
	for (var index = 0; index < length; index++) {
		var sample = samples[index];
		var sampleReal;
		var sampleImaginary;
		if (typeof sample === 'number') {
			sampleReal = sample;
			sampleImaginary = 0;
		} else if (sample && typeof sample.getR === 'function' && typeof sample.getI === 'function') {
			sampleReal = sample.getR();
			sampleImaginary = sample.getI();
		} else {
			throw new TypeError('FFT and invFFT samples must be numbers or nP.complex() values.');
		}
		if (!Number.isFinite(sampleReal) || !Number.isFinite(sampleImaginary)) {
			throw new RangeError('FFT and invFFT samples must be finite.');
		}
		real[index] = sampleReal;
		imaginary[index] = inverse ? -sampleImaginary : sampleImaginary;
	}
	if ((length & (length - 1)) === 0) radix2(real, imaginary, false);
	else bluestein(real, imaginary);
	var result = new Array(length);
	for (var bin = 0; bin < length; bin++) {
		result[bin] = complex(inverse ? real[bin] / length : real[bin],
			inverse ? -imaginary[bin] / length : imaginary[bin]);
	}
	return result;
}

// Internal transform for sampled signals whose time context is checked by their owner.
export function fftBins(samples) {
	return transform(samples, false);
}

// X[k] = sum_n x[n] exp(-i 2πkn/N), with no forward scaling.
// The public transform requires the selected time grid and labels every output bin.
export function FFT(samples) {
	var result = fftBins(samples);
	var sampleRateHz = sampleRateFromTime(global.tList, samples.length, 'FFT');
	var count = result.length;
	global.fList = Array.from({length: count}, function (_, bin) {
		return (bin <= Math.floor(count / 2) ? bin : bin - count) * sampleRateHz / count;
	});
	Object.defineProperty(result, fftTimeGrid, {value: global.tList.slice()});
	var realInput = samples.every(function (sample) {
		return typeof sample === 'number' || sample.getI() === 0;
	});
	return withOutput(result, global.fList.slice(), 'Frequency (Hz)', 'magnitude',
		Math.floor(count / 2), realInput);
}

// x[n] = (1/N) sum_k X[k] exp(+i 2πkn/N).
export function invFFT(spectrum) {
	var result = transform(spectrum, true);
	var time = spectrum && spectrum[fftTimeGrid] ? spectrum[fftTimeGrid].slice() :
		Array.isArray(global.tList) ? global.tList.slice() : null;
	return withOutput(result, time, 'Time (s)', 'real', result.length - 1);
}
