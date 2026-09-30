// Modified: 2026-09-30
import {complex} from '../../../np-math/src/complex';
import {global} from '../../../np-global/src/global';
import {nPort} from '../nPort';

const kB = 1.380649e-23;

// Matched, reciprocal attenuator. Noise is the covariance of its own outgoing waves.
export function Attn(attenuationDb = 3, temperature = global.Temp) {
	if (attenuationDb !== null && typeof attenuationDb === 'object') {
		var options = attenuationDb;
		attenuationDb = options.attenuationDb === undefined ? 3 : options.attenuationDb;
		temperature = options.temperature === undefined ? global.Temp : options.temperature;
	}
	if (!Number.isFinite(attenuationDb) || attenuationDb < 0) {
		throw new RangeError('Attn attenuationDb must be a finite, nonnegative number of dB.');
	}
	if (!Number.isFinite(temperature) || temperature < 0) {
		throw new RangeError('Attn temperature must be a finite, nonnegative number of kelvin.');
	}

	var transmission = 10 ** (-attenuationDb / 20);
	var addedNoise = kB * temperature * (1 - transmission * transmission);
	var attenuator = new nPort();
	var sparsArray = [];
	var noiseArray = [];
	for (var i = 0; i < global.fList.length; i++) {
		var frequency = global.fList[i];
		sparsArray[i] = [frequency, complex(0, 0), complex(transmission, 0), complex(transmission, 0), complex(0, 0)];
		noiseArray[i] = {
			frequency: frequency,
			C: [
				[complex(addedNoise, 0), complex(0, 0)],
				[complex(0, 0), complex(addedNoise, 0)]
			]
		};
	}
	attenuator.setspars(sparsArray);
	attenuator.noise = noiseArray;
	attenuator.setglobal(global);
	attenuator.temperature = temperature;
	return attenuator;
}
