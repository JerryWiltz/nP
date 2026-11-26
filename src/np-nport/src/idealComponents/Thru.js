// Modified: 2026-11-26
import {connectionDcModel} from '../dcModel';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {global} from '../../../np-global/src/global';
import {nPort} from '../nPort';
import {analysisFrequencies} from '../analysisFrequencies';
import {validatedComponentSettings, checkedSpars} from '../numericValidation';

// Matched, lossless, zero-length two-port connection, including at DC.
export function Thru(options = {}) {
	var thru = new nPort();
	var sparsArray = [];
	var noiseArray = [];
	var settings = validatedComponentSettings(global, options, 'Thru');
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
	thru.setspars(checkedSpars('Thru', sparsArray));
	thru.noise = noiseArray;
	thru.setglobal(settings);
	thru._schematic = schematicPart('Thru');
	thru._dcModel = connectionDcModel('Thru', 2, [[1, 2]], [], {}, settings);
	return thru;
}
