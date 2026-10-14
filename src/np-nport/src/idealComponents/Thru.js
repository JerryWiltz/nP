// Modified: 2026-10-13
import {complex} from '../../../np-math/src/complex';
import {global} from '../../../np-global/src/global';
import {nPort} from '../nPort';
import {analysisFrequencies} from '../analysisFrequencies';
import {componentSettings} from '../componentSettings';

// Matched, lossless, zero-length two-port connection, including at DC.
export function Thru(options = {}) {
	var thru = new nPort();
	var sparsArray = [];
	var noiseArray = [];
	var settings = componentSettings(global, options);
	var frequencies = analysisFrequencies(settings);
	for (var i = 0; i < frequencies.length; i++) {
		var frequency = frequencies[i];
		sparsArray[i] = [frequency, complex(0, 0), complex(1, 0), complex(1, 0), complex(0, 0)];
		noiseArray[i] = {
			frequency: frequency,
			C: [
				[complex(0, 0), complex(0, 0)],
				[complex(0, 0), complex(0, 0)]
			]
		};
	}
	thru.setspars(sparsArray);
	thru.noise = noiseArray;
	thru.setglobal(settings);
	return thru;
}
