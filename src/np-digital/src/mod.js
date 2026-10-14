// Modified: 2026-10-13
import {createDigitalTx} from './digitalTx';
import {FFT} from '../../np-math/src/fft';

// Prepare a real, cosine-modulated digital source for the nPort frequency grid.
export function mod(options = {}) {
	if (!options || Array.isArray(options) || typeof options !== 'object') {
		throw new TypeError('mod expects an options object.');
	}
	var carrierHz = options.carrierHz === undefined ? 0 : options.carrierHz;
	if (!Number.isFinite(carrierHz) || carrierHz < 0) {
		throw new RangeError('mod carrierHz must be a nonnegative finite frequency.');
	}
	var txOptions = {...options};
	delete txOptions.carrierHz;
	delete txOptions.fftList;
	var tx = createDigitalTx(txOptions, options.fftList);
	if (carrierHz >= tx.sampleRateHz / 2) {
		throw new RangeError('mod carrierHz must be below the sample Nyquist frequency.');
	}
	if (carrierHz !== 0) {
		tx.samples = tx.samples.map(function (voltage, index) {
			return voltage * Math.cos(2 * Math.PI * carrierHz * index / tx.sampleRateHz);
		});
		tx.spectrum = FFT(tx.samples).slice(0, tx.fList.length);
	}
	var originalOut = tx.out;
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
				carrierHz: carrierHz,
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
