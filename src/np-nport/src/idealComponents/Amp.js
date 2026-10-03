// Modified: 2026-10-03
import {complex} from '../../../np-math/src/complex';
import {global} from '../../../np-global/src/global';
import {nPort} from '../nPort';
import {analysisFrequencies} from '../intermod';

const kB = 1.380649e-23;

var conjugate = function (value) { return complex(value.getR(), -value.getI()); };
var magnitudeSquared = function (value) { return value.getR() ** 2 + value.getI() ** 2; };
var finiteComplex = function (value) {
	return value && typeof value.getR === 'function' && typeof value.getI === 'function' &&
		Number.isFinite(value.getR()) && Number.isFinite(value.getI());
};

// Convert frequency-flat two-port noise parameters to intrinsic wave covariance.
// The conversion uses F(Gamma) at a matched output and C = E[c c^H].
function covarianceFromNoiseParameters(spars, fMinDb, gammaOpt, noiseResistanceOhms,
	referenceTemperature) {
	if (!Array.isArray(spars) || spars.length !== 4 || !spars.every(finiteComplex)) {
		throw new TypeError('Amp spars must be four finite complex values [s11, s12, s21, s22].');
	}
	if (!Number.isFinite(fMinDb) || fMinDb < 0 || !finiteComplex(gammaOpt) ||
		magnitudeSquared(gammaOpt) >= 1 ||
		!Number.isFinite(noiseResistanceOhms) || noiseResistanceOhms < 0) {
		throw new RangeError('Amp requires nonnegative fMinDb and noiseResistanceOhms, and |gammaOpt| < 1.');
	}
	if (!Number.isFinite(global.Ro) || global.Ro <= 0) {
		throw new RangeError('Amp requires a positive reference impedance.');
	}
	var s11 = spars[0];
	var s21 = spars[2];
	var gain = magnitudeSquared(s21);
	if (!(gain > 0)) throw new RangeError('Amp s21 must be nonzero to define noise figure.');
	var minFactor = 10 ** (fMinDb / 10);
	var normalizedResistance = noiseResistanceOhms / global.Ro;
	var slope = 4 * normalizedResistance /
		magnitudeSquared(complex(1, 0).add(gammaOpt));
	var constant = minFactor - 1 + slope * magnitudeSquared(gammaOpt);
	var quadratic = slope - (minFactor - 1);
	var scale = kB * referenceTemperature * gain;
	var c22 = scale * constant;
	var c12 = s11.mul(complex(c22, 0))
		.sub(conjugate(gammaOpt).mul(complex(scale * slope, 0))).div(s21);
	var c11 = (scale * quadratic - magnitudeSquared(s11) * c22 +
			2 * s21.mul(conjugate(s11)).mul(c12).getR()) / gain;
	var determinant = c11 * c22 - magnitudeSquared(c12);
	var covarianceScale = kB * referenceTemperature;
	if (![c11, c22, c12.getR(), c12.getI()].every(Number.isFinite) ||
		c11 < -1e-12 * covarianceScale || c22 < -1e-12 * covarianceScale ||
		determinant < -1e-12 * covarianceScale ** 2) {
		throw new RangeError('Amp spars, fMinDb, gammaOpt, and noiseResistanceOhms imply an invalid noise covariance.');
	}
	return [
		[complex(Math.max(0, c11), 0), c12],
		[conjugate(c12), complex(Math.max(0, c22), 0)]
	];
}

// Every form starts with the same frequency-flat S and noise parameters.
// Object options replace only the named defaults; the positional form sets S21 and Fmin.
export function Amp(gainDb = 20, noiseFigureDb = 4, referenceTemperature = 290) {
	var defaults = {
		spars: [complex(0, 0), complex(0, 0), complex(10, 0), complex(0, 0)],
		fMinDb: 4,
		gammaOpt: complex(0, 0),
		noiseResistanceOhms: 25,
		referenceTemperature: 290
	};
	var specifiedSpars = defaults.spars;
	var noiseParameters = defaults;
	var options;
	var oip2dBm;
	var oip3dBm;
	var im2PhaseDeg = 0;
	var im3PhaseDeg = 0;
	if (gainDb !== null && typeof gainDb === 'object') {
		options = gainDb;
		oip2dBm = options.oip2dBm;
		oip3dBm = options.oip3dBm;
		if (options.im2PhaseDeg !== undefined) im2PhaseDeg = options.im2PhaseDeg;
		if (options.im3PhaseDeg !== undefined) im3PhaseDeg = options.im3PhaseDeg;
		if (options.spars !== undefined && options.gainDb !== undefined) {
			throw new TypeError('Amp gainDb is determined by spars when both are supplied.');
		}
		if (options.spars !== undefined) specifiedSpars = options.spars;
		if (options.gainDb !== undefined) {
			if (!Number.isFinite(options.gainDb)) {
				throw new RangeError('Amp gainDb must be a finite number of dB.');
			}
			specifiedSpars[2] = complex(10 ** (options.gainDb / 20), 0);
		}
		if (options.fMinDb !== undefined) noiseParameters.fMinDb = options.fMinDb;
		if (options.gammaOpt !== undefined) noiseParameters.gammaOpt = options.gammaOpt;
		if (options.noiseResistanceOhms !== undefined) {
			noiseParameters.noiseResistanceOhms = options.noiseResistanceOhms;
		}
		if (options.noiseFigureDb !== undefined && options.fMinDb === undefined) {
			noiseParameters.fMinDb = options.noiseFigureDb;
		}
		referenceTemperature = options.referenceTemperature === undefined ? defaults.referenceTemperature :
			options.referenceTemperature;
	} else {
		if (!Number.isFinite(gainDb)) {
			throw new RangeError('Amp gainDb must be a finite number of dB.');
		}
		if (!Number.isFinite(noiseFigureDb) || noiseFigureDb < 0) {
			throw new RangeError('Amp noiseFigureDb must be a finite, nonnegative number of dB.');
		}
		specifiedSpars[2] = complex(10 ** (gainDb / 20), 0);
		noiseParameters.fMinDb = noiseFigureDb;
	}
	if (!Number.isFinite(referenceTemperature) || referenceTemperature <= 0) {
		throw new RangeError('Amp referenceTemperature must be a finite, positive number of kelvin.');
	}
	if ((oip2dBm !== undefined && !Number.isFinite(oip2dBm)) ||
		(oip3dBm !== undefined && !Number.isFinite(oip3dBm))) {
		throw new RangeError('Amp oip2dBm and oip3dBm must be finite dBm values when supplied.');
	}
	if (!Number.isFinite(im2PhaseDeg) || !Number.isFinite(im3PhaseDeg)) {
		throw new RangeError('Amp IM phases must be finite degrees.');
	}
	var ip2Watts = oip2dBm === undefined ? null : 10 ** ((oip2dBm - 30) / 10);
	var ip3Watts = oip3dBm === undefined ? null : 10 ** ((oip3dBm - 30) / 10);
	if ((ip2Watts !== null && (!Number.isFinite(ip2Watts) || ip2Watts <= 0)) ||
		(ip3Watts !== null && (!Number.isFinite(ip3Watts) || ip3Watts <= 0))) {
		throw new RangeError('Amp output intercept powers must be representable as positive watts.');
	}
	if ((oip2dBm !== undefined || oip3dBm !== undefined) &&
		(magnitudeSquared(specifiedSpars[0]) !== 0 || magnitudeSquared(specifiedSpars[1]) !== 0 ||
		magnitudeSquared(specifiedSpars[3]) !== 0 || specifiedSpars[2].getI() !== 0 ||
		specifiedSpars[2].getR() <= 0)) {
		throw new RangeError('Amp OIP calibration currently requires matched, unilateral, positive real gain S-parameters.');
	}
	var specifiedCovariance = covarianceFromNoiseParameters(specifiedSpars,
		noiseParameters.fMinDb, noiseParameters.gammaOpt,
		noiseParameters.noiseResistanceOhms, referenceTemperature);
	if (options && options.noiseFigureDb !== undefined) {
		var matchedFactor = 10 ** (noiseParameters.fMinDb / 10) +
			4 * (noiseParameters.noiseResistanceOhms / global.Ro) *
			magnitudeSquared(noiseParameters.gammaOpt) /
			magnitudeSquared(complex(1, 0).add(noiseParameters.gammaOpt));
		if (!Number.isFinite(options.noiseFigureDb) ||
			Math.abs(10 ** (options.noiseFigureDb / 10) - matchedFactor) >
			1e-10 * matchedFactor) {
			throw new RangeError('Amp noiseFigureDb disagrees with the matched-source noise parameters.');
		}
	}
	var amplifier = new nPort();
	var sparsArray = [];
	var noiseArray = [];
	var frequencies = analysisFrequencies(global);
	for (var i = 0; i < frequencies.length; i++) {
		var frequency = frequencies[i];
		sparsArray[i] = [frequency].concat(specifiedSpars.map(function (s) { return s.copy(); }));
		noiseArray[i] = {
			frequency: frequency,
			C: specifiedCovariance.map(function (row) {
				return row.map(function (value) { return value.copy(); });
			})
		};
	}
	amplifier.setspars(sparsArray);
	amplifier.noise = noiseArray;
	amplifier.setglobal(global);
	amplifier.referenceTemperature = referenceTemperature;
	amplifier._displayFrequencies = global.fList.slice();
	amplifier._intermod = {
		type: 'amp',
		p2: ip2Watts,
		p3: ip3Watts,
		phase2: complex(Math.cos(im2PhaseDeg * Math.PI / 180), Math.sin(im2PhaseDeg * Math.PI / 180)),
		phase3: complex(Math.cos(im3PhaseDeg * Math.PI / 180), Math.sin(im3PhaseDeg * Math.PI / 180))
	};
	return amplifier;
}
