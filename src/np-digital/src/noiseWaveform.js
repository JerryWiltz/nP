// Modified: 2026-10-08
import {complex} from '../../np-math/src/complex';
import {noiseAnalysis} from '../../np-nport/src/noiseFigure';

// Two independent standard-normal samples per pair of uniform draws.
function normalSampler() {
	var spare;
	return function () {
		if (spare !== undefined) {
			var result = spare;
			spare = undefined;
			return result;
		}
		var radius = Math.sqrt(-2 * Math.log(1 - Math.random()));
		var angle = 2 * Math.PI * Math.random();
		spare = radius * Math.sin(angle);
		return radius * Math.cos(angle);
	};
}

// Return one real-waveform-compatible FFT noise draw in volts. The noise
// analysis includes source, termination, and component covariance in W/Hz.
export function noiseWaveformSpectrum(stage, signal, inputPort, outputPort, options) {
	var count = signal.sampleCount;
	var binWidth = signal.sampleRateHz / count;
	var sampleNormal = normalSampler();
	var noiseRows = stage.noise;
	var spectrum = new Array(signal.rows.length);
	for (var bin = 0; bin < spectrum.length; bin++) {
		var density = noiseAnalysis(stage.spars[bin], noiseRows[bin].C,
			inputPort, outputPort, options).outputNoiseDensity;
		var voltageDensity = density * signal.referenceImpedanceOhms;
		var selfConjugate = bin === 0 || (count % 2 === 0 && bin === count / 2);
		if (selfConjugate) {
			// DC and Nyquist each represent half a positive-frequency bin.
			var endpointStd = count * Math.sqrt(voltageDensity * binWidth / 2);
			spectrum[bin] = complex(endpointStd * sampleNormal(), 0);
		} else {
			// A positive bin and its negative-frequency conjugate share one bin's power.
			var quadratureStd = count * Math.sqrt(voltageDensity * binWidth) / 2;
			spectrum[bin] = complex(quadratureStd * sampleNormal(), quadratureStd * sampleNormal());
		}
	}
	return spectrum;
}
