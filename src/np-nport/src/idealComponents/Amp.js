// Modified: 2026-09-30
import {complex} from '../../../np-math/src/complex';
import {global} from '../../../np-global/src/global';
import {nPort} from '../nPort';

const kB = 1.380649e-23;

// Matched, unilateral amplifier with noise referred to its output port.
// Its noise figure describes a matched source at referenceTemperature.
export function Amp(gainDb = 20, noiseFigureDb = 4, referenceTemperature = 290) {
	if (gainDb !== null && typeof gainDb === 'object') {
		var options = gainDb;
		gainDb = options.gainDb === undefined ? 20 : options.gainDb;
		noiseFigureDb = options.noiseFigureDb === undefined ? 4 : options.noiseFigureDb;
		referenceTemperature = options.referenceTemperature === undefined ? 290 : options.referenceTemperature;
	}
	if (!Number.isFinite(gainDb)) {
		throw new RangeError('Amp gainDb must be a finite number of dB.');
	}
	if (!Number.isFinite(noiseFigureDb) || noiseFigureDb < 0) {
		throw new RangeError('Amp noiseFigureDb must be a finite, nonnegative number of dB.');
	}
	if (!Number.isFinite(referenceTemperature) || referenceTemperature <= 0) {
		throw new RangeError('Amp referenceTemperature must be a finite, positive number of kelvin.');
	}

	var transmission = 10 ** (gainDb / 20);
	var powerGain = transmission * transmission;
	var noiseFactor = 10 ** (noiseFigureDb / 10);
	var addedNoise = (noiseFactor - 1) * powerGain * kB * referenceTemperature;
	if (!Number.isFinite(addedNoise)) {
		throw new RangeError('Amp gain and noise figure produce nonfinite noise power.');
	}
	var amplifier = new nPort();
	var sparsArray = [];
	var noiseArray = [];
	for (var i = 0; i < global.fList.length; i++) {
		var frequency = global.fList[i];
		sparsArray[i] = [frequency, complex(0, 0), complex(0, 0), complex(transmission, 0), complex(0, 0)];
		noiseArray[i] = {
			frequency: frequency,
			C: [
				[complex(0, 0), complex(0, 0)],
				[complex(0, 0), complex(addedNoise, 0)]
			]
		};
	}
	amplifier.setspars(sparsArray);
	amplifier.noise = noiseArray;
	amplifier.setglobal(global);
	amplifier.referenceTemperature = referenceTemperature;
	return amplifier;
}
