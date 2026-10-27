// Modified: 2026-10-26
import {complex} from '../../../np-math/src/complex';
import {global} from '../../../np-global/src/global';
import {nPort} from '../nPort';
import {analysisFrequencies} from '../analysisFrequencies';
import {componentSettings} from '../componentSettings';

const kB = 1.380649e-23;

// Matched, reciprocal attenuator. Noise is the covariance of its own outgoing waves.
export function Attn(attenuationDb = 3, temperature = global.Temp, options = {}) {
	if (attenuationDb !== null && typeof attenuationDb === 'object') {
		options = attenuationDb;
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
	var settings = componentSettings(global, options);
	var frequencies = analysisFrequencies(settings);
	for (var i = 0; i < frequencies.length; i++) {
		var frequency = frequencies[i];
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
	attenuator.setglobal(settings);
	attenuator.temperature = temperature;
	attenuator._displayFrequencies = settings.fList.slice();
	attenuator._schematic = {kind: 'component', symbol: 'attenuator', value: attenuationDb};
	return attenuator;
}
