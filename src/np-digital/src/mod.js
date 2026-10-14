// Modified: 2026-10-14
import {createSourceWaveform} from './sourceWaveform';
import {FFT} from '../../np-math/src/fft';
import {complex} from '../../np-math/src/complex';
import {global} from '../../np-global/src/global';

// A single sinusoidal AM input has only a carrier and two sidebands.
function analogAM(options) {
	var carrierHz = options.carrierHz;
	var toneHz = options.toneHz;
	var modulationIndex = options.modulationIndex === undefined ? 0.5 : options.modulationIndex;
	var carrierAmplitudeVolts = options.carrierAmplitudeVolts === undefined ? 1 : options.carrierAmplitudeVolts;
	var fftList = options.fftList;
	if (!Number.isFinite(carrierHz) || !Number.isFinite(toneHz) ||
		carrierHz <= toneHz || toneHz <= 0 || !Number.isFinite(modulationIndex) ||
		modulationIndex < 0 || modulationIndex > 1 ||
		!Number.isFinite(carrierAmplitudeVolts) || carrierAmplitudeVolts <= 0 ||
		!Number.isFinite(global.Ro) || global.Ro <= 0 ||
		(fftList !== undefined && !Array.isArray(fftList))) {
		throw new RangeError('AM needs carrierHz > toneHz > 0, modulationIndex from 0 to 1, positive carrierAmplitudeVolts and global.Ro, and an optional fftList array.');
	}
	if (global.twoTone) throw new RangeError('Clear global.twoTone before AM analysis.');
	var fList = [carrierHz - toneHz, carrierHz, carrierHz + toneHz];
	if (fftList) {
		fftList.length = 0;
		fList.forEach(function (frequency) { fftList.push(frequency); });
	} else {
		global.fList = fList.slice();
	}
	var sidebandVolts = carrierAmplitudeVolts * modulationIndex / 2;
	var spectrum = [complex(sidebandVolts, 0), complex(carrierAmplitudeVolts, 0),
		complex(sidebandVolts, 0)];
	var tx = {
		mode: 'AM', carrierHz: carrierHz, toneHz: toneHz,
		modulationIndex: modulationIndex, carrierAmplitudeVolts: carrierAmplitudeVolts,
		fList: fList, spectrum: spectrum, referenceImpedanceOhms: global.Ro
	};
	tx.out = function (selector) {
		if (selector === 'settings') return {mode: 'AM', carrierHz: carrierHz, toneHz: toneHz,
			modulationIndex: modulationIndex, carrierAmplitudeVolts: carrierAmplitudeVolts,
			frequencyCount: 3};
		if (selector === 'frequency count') return 3;
		if (selector === 'frequencies') return fList.slice();
		if (selector === 'spectrum') return spectrum.map(function (value) { return value.copy(); });
		if (selector === 'frequency table') return [['Bin', 'Frequency (Hz)']].concat(
			fList.map(function (frequency, index) { return [index, frequency]; }));
		if (selector === 'tones') return [['Freq', 'Peak voltage (V)', 'Phase (deg)']].concat(
			fList.map(function (frequency, index) {
				return [frequency, spectrum[index].mag(), spectrum[index].ang()];
			}));
		throw new RangeError('Unknown AM output: ' + selector);
	};
	return tx;
}

// Sample the slow phase waveform, not the RF carrier. FM uses beta sin(theta);
// PM uses beta cos(theta), with beta measured in peak radians.
function analogAngle(options) {
	var mode = options.mode;
	var carrierHz = options.carrierHz;
	var toneHz = options.toneHz;
	var beta = options.beta;
	var carrierAmplitudeVolts = options.carrierAmplitudeVolts === undefined ? 1 : options.carrierAmplitudeVolts;
	var tolerance = options.sidebandPowerTolerance === undefined ? 1e-6 : options.sidebandPowerTolerance;
	var fftList = options.fftList;
	if (!Number.isFinite(carrierHz) || carrierHz <= 0 ||
		!Number.isFinite(toneHz) || toneHz <= 0 ||
		!Number.isFinite(beta) || beta < 0 ||
		!Number.isFinite(carrierAmplitudeVolts) || carrierAmplitudeVolts <= 0 ||
		!Number.isFinite(tolerance) || tolerance <= 0 || tolerance >= 1 ||
		!Number.isFinite(global.Ro) || global.Ro <= 0 ||
		(fftList !== undefined && !Array.isArray(fftList))) {
		throw new RangeError(mode + ' needs positive carrierHz, toneHz, carrierAmplitudeVolts and global.Ro, nonnegative beta, and sidebandPowerTolerance between 0 and 1.');
	}
	if (global.twoTone) throw new RangeError('Clear global.twoTone before ' + mode + ' analysis.');
	var coefficientSamples = 256;
	while (coefficientSamples < 16 * (Math.ceil(beta) + 12)) coefficientSamples *= 2;
	if (coefficientSamples > 131072) {
		throw new RangeError(mode + ' beta requires too many sideband coefficient samples.');
	}
	var phaseSamples = Array.from({length: coefficientSamples}, function (_, index) {
		var theta = 2 * Math.PI * index / coefficientSamples;
		var phase = beta * (mode === 'PM' ? Math.cos(theta) : Math.sin(theta));
		return complex(Math.cos(phase), Math.sin(phase));
	});
	var coefficients = FFT(phaseSamples);
	var retainedPower = coefficients[0].mag() ** 2 / coefficientSamples ** 2;
	var sidebandOrder = 0;
	while (1 - retainedPower > tolerance && sidebandOrder < coefficientSamples / 2 - 1) {
		sidebandOrder++;
		retainedPower += (coefficients[sidebandOrder].mag() ** 2 +
			coefficients[coefficientSamples - sidebandOrder].mag() ** 2) /
			coefficientSamples ** 2;
	}
	if (1 - retainedPower > tolerance) {
		throw new RangeError(mode + ' sideband tolerance could not be met.');
	}
	if (carrierHz <= sidebandOrder * toneHz) {
		throw new RangeError(mode + ' lower sideband frequencies must remain positive.');
	}
	var fList = [];
	var spectrum = [];
	for (var order = -sidebandOrder; order <= sidebandOrder; order++) {
		fList.push(carrierHz + order * toneHz);
		var coefficient = coefficients[(order + coefficientSamples) % coefficientSamples];
		spectrum.push(complex(carrierAmplitudeVolts * coefficient.getR() / coefficientSamples,
			carrierAmplitudeVolts * coefficient.getI() / coefficientSamples));
	}
	if (fList.some(function (frequency, index) {
		return !Number.isFinite(frequency) || (index > 0 && frequency <= fList[index - 1]);
	})) {
		throw new RangeError(mode + ' sideband frequencies must be finite and distinct.');
	}
	if (fftList) {
		fftList.length = 0;
		fList.forEach(function (frequency) { fftList.push(frequency); });
	} else {
		global.fList = fList.slice();
	}
	var tx = {
		mode: mode, carrierHz: carrierHz, toneHz: toneHz, beta: beta,
		carrierAmplitudeVolts: carrierAmplitudeVolts,
		sidebandOrder: sidebandOrder, sidebandPowerTolerance: tolerance,
		fList: fList, spectrum: spectrum, referenceImpedanceOhms: global.Ro
	};
	tx.out = function (selector) {
		if (selector === 'settings') return {mode: mode, carrierHz: carrierHz, toneHz: toneHz,
			beta: beta, frequencyDeviationHz: beta * toneHz,
			...(mode === 'PM' ? {peakPhaseRadians: beta} : {}),
			carrierAmplitudeVolts: carrierAmplitudeVolts,
			sidebandOrder: sidebandOrder, sidebandPowerTolerance: tolerance,
			frequencyCount: fList.length};
		if (selector === 'frequency count') return fList.length;
		if (selector === 'frequencies') return fList.slice();
		if (selector === 'spectrum') return spectrum.map(function (value) { return value.copy(); });
		if (selector === 'frequency table') return [['Bin', 'Frequency (Hz)']].concat(
			fList.map(function (frequency, index) { return [index, frequency]; }));
		if (selector === 'tones') return [['Freq', 'Peak voltage (V)', 'Phase (deg)']].concat(
			fList.map(function (frequency, index) {
				return [frequency, spectrum[index].mag(), spectrum[index].ang()];
			}));
		throw new RangeError('Unknown ' + mode + ' output: ' + selector);
	};
	return tx;
}

// Prepare a sampled digital waveform or sparse, single-tone analog source.
export function mod(options = {}) {
	if (!options || Array.isArray(options) || typeof options !== 'object') {
		throw new TypeError('mod expects an options object.');
	}
	if (options.mode === 'AM') return analogAM(options);
	if (options.mode === 'FM' || options.mode === 'PM') return analogAngle(options);
	var keyedMode = options.mode === 'OOK' || options.mode === 'ASK';
	var fskMode = options.mode === 'FSK';
	var pskMode = options.mode === 'PSK';
	var encoding = pskMode ? (options.encoding === undefined ? 'NRZ' : options.encoding) : undefined;
	if (pskMode ? encoding !== 'NRZ' && encoding !== 'Manchester' :
		options.encoding !== undefined) {
		throw new RangeError('encoding must be NRZ or Manchester and is available only for PSK.');
	}
	var carrierHz = options.carrierHz === undefined ? 0 : options.carrierHz;
	if (!Number.isFinite(carrierHz) || carrierHz < 0) {
		throw new RangeError('mod carrierHz must be a nonnegative finite frequency.');
	}
	if ((keyedMode || fskMode || pskMode) && carrierHz === 0) {
		throw new RangeError('OOK, ASK, FSK, and PSK require a positive carrierHz.');
	}
	var txOptions = {...options};
	delete txOptions.carrierHz;
	delete txOptions.fftList;
	if (keyedMode) {
		var lowVolts = options.lowVolts === undefined ?
			(options.mode === 'OOK' ? 0 : 0.5) : options.lowVolts;
		var highVolts = options.highVolts === undefined ? 1 : options.highVolts;
		if (!Number.isFinite(lowVolts) || !Number.isFinite(highVolts) ||
			(options.mode === 'OOK' ? lowVolts !== 0 || highVolts <= 0 :
				lowVolts <= 0 || highVolts <= lowVolts)) {
			throw new RangeError('OOK requires 0 V off and positive on voltage; ASK requires two increasing positive voltage levels.');
		}
		var dataMode = options.dataMode === undefined ?
			(options.message !== undefined ? 'ASCII' : options.bits !== undefined ? 'bits' : 'PN7') :
			options.dataMode;
		if (options.input) {
			if (options.dataMode !== undefined || options.message !== undefined ||
				options.bits !== undefined) {
				throw new TypeError('OOK or ASK with a PN input cannot also select another data mode.');
			}
			var input = options.input;
			txOptions = {input: {...input, lowVolts: lowVolts, highVolts: highVolts,
				samples: Array.isArray(input.bits) ? input.bits.map(function (bit) {
					return bit ? highVolts : lowVolts;
				}) : input.samples}, samplesPerBit: options.samplesPerBit};
		} else {
			txOptions.mode = dataMode;
			txOptions.lowVolts = lowVolts;
			txOptions.highVolts = highVolts;
			delete txOptions.dataMode;
		}
	}
	if (fskMode || pskMode) {
		if (options.input) {
			if (options.dataMode !== undefined || options.message !== undefined ||
				options.bits !== undefined) {
				throw new TypeError(options.mode + ' with a PN input cannot also select another data mode.');
			}
			txOptions = {input: options.input, samplesPerBit: options.samplesPerBit};
		} else {
			txOptions.mode = options.dataMode === undefined ?
				(options.message !== undefined ? 'ASCII' : options.bits !== undefined ? 'bits' : 'PN7') :
				options.dataMode;
			delete txOptions.dataMode;
			delete txOptions.frequencyDeviationHz;
			delete txOptions.carrierAmplitudeVolts;
			delete txOptions.encoding;
		}
	}
	var tx = createSourceWaveform(txOptions, options.fftList);
	if (pskMode && encoding === 'Manchester' &&
		(tx.samplesPerBit < 2 || tx.samplesPerBit % 2 !== 0)) {
		throw new RangeError('Manchester PSK requires an even samplesPerBit of at least 2.');
	}
	var deviationHz = fskMode ? (options.frequencyDeviationHz === undefined ?
		tx.sampleRateHz / tx.samplesPerBit / 2 : options.frequencyDeviationHz) : undefined;
	var carrierAmplitudeVolts = (fskMode || pskMode) ? (options.carrierAmplitudeVolts === undefined ?
		1 : options.carrierAmplitudeVolts) : undefined;
	if (pskMode && (!Number.isFinite(carrierAmplitudeVolts) || carrierAmplitudeVolts <= 0)) {
		throw new RangeError('PSK needs positive carrierAmplitudeVolts.');
	}
	if (fskMode && (!Number.isFinite(deviationHz) || deviationHz <= 0 ||
		!Number.isFinite(carrierAmplitudeVolts) || carrierAmplitudeVolts <= 0 ||
		carrierHz <= deviationHz)) {
		throw new RangeError('FSK needs positive frequencyDeviationHz and carrierAmplitudeVolts, with carrierHz greater than deviation.');
	}
	if (carrierHz + (fskMode ? deviationHz : 0) >= tx.sampleRateHz / 2) {
		throw new RangeError('mod carrierHz must be below the sample Nyquist frequency.');
	}
	if (fskMode) {
		var phase = 0;
		tx.samples = tx.bits.flatMap(function (bit) {
			var frequency = carrierHz + (bit ? deviationHz : -deviationHz);
			var phaseStep = 2 * Math.PI * frequency / tx.sampleRateHz;
			return Array.from({length: tx.samplesPerBit}, function () {
				var voltage = carrierAmplitudeVolts * Math.cos(phase);
				phase += phaseStep;
				return voltage;
			});
		});
		tx.spectrum = FFT(tx.samples).slice(0, tx.fList.length);
	} else if (pskMode) {
		tx.samples = tx.samples.map(function (_, index) {
			var bit = tx.bits[Math.floor(index / tx.samplesPerBit)];
			var secondHalf = index % tx.samplesPerBit >= tx.samplesPerBit / 2;
			var polarity = (bit ? 1 : -1) *
				(encoding === 'Manchester' && secondHalf ? -1 : 1);
			return polarity * carrierAmplitudeVolts *
				Math.cos(2 * Math.PI * carrierHz * index / tx.sampleRateHz);
		});
		tx.spectrum = FFT(tx.samples).slice(0, tx.fList.length);
	} else if (carrierHz !== 0) {
		tx.samples = tx.samples.map(function (voltage, index) {
			return voltage * Math.cos(2 * Math.PI * carrierHz * index / tx.sampleRateHz);
		});
		tx.spectrum = FFT(tx.samples).slice(0, tx.fList.length);
	}
	var originalOut = tx.out;
	if (keyedMode) {
		tx.dataMode = tx.mode;
		tx.mode = options.mode;
	}
	if (fskMode) {
		tx.dataMode = tx.mode;
		tx.mode = 'FSK';
		tx.frequencyDeviationHz = deviationHz;
		tx.carrierAmplitudeVolts = carrierAmplitudeVolts;
	}
	if (pskMode) {
		tx.dataMode = tx.mode;
		tx.mode = 'PSK';
		tx.encoding = encoding;
		tx.carrierAmplitudeVolts = carrierAmplitudeVolts;
	}
	tx.carrierHz = carrierHz;
	tx.out = function (selector) {
		if (selector === 'waveform') {
			return [['Time (ns)', 'Output (V)']].concat(tx.samples.map(function (voltage, index) {
				return [index * 1e9 / tx.sampleRateHz, voltage];
			}));
		}
		if (selector === 'settings') {
			return {
				mode: tx.mode,
				dataMode: tx.dataMode,
				carrierHz: carrierHz,
				...(fskMode ? {frequencyDeviationHz: deviationHz,
					lowFrequencyHz: carrierHz - deviationHz,
					highFrequencyHz: carrierHz + deviationHz,
					carrierAmplitudeVolts: carrierAmplitudeVolts} : {}),
				...(pskMode ? {encoding: encoding,
					carrierAmplitudeVolts: carrierAmplitudeVolts,
					phaseZeroDeg: 180, phaseOneDeg: 0} : {}),
				bitRate: tx.sampleRateHz / tx.samplesPerBit,
				samplesPerBit: tx.samplesPerBit,
				sampleRateHz: tx.sampleRateHz,
				sampleCount: tx.sampleCount,
				frequencyCount: tx.fList.length,
				lowVolts: tx.lowVolts,
				highVolts: tx.highVolts
			};
		}
		if (selector === 'frequency table') {
			return [['Bin', 'Frequency (Hz)']].concat(tx.fList.map(function (frequency, bin) {
				return [bin, frequency];
			}));
		}
		return originalOut(selector);
	};
	return tx;
}
