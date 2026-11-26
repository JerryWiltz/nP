// Modified: 2026-11-26
import {requiredDcModel} from '../dcModel';
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {schematicPart} from '../schematicPart';
import {global} from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {validatedComponentSettings, checkedSpars} from '../numericValidation';

// Ideal three-port center-tapped autotransformer.
// Port 1 is the center tap; ports 2 and 3 are the winding ends.
// The full-winding to half-winding turns ratio is 2:1.
export function trfAuto(options = {}) {
	var transformer = new nPort();
	var settings = validatedComponentSettings(global, options, 'trfAuto');
	var frequencies = analysisFrequencies(settings);
	var sparsArray = [];
	for (var index = 0; index < frequencies.length; index++) {
		sparsArray[index] = [
			frequencies[index],
			complex(-1 / 3, 0), complex(2 / 3, 0), complex(2 / 3, 0),
			complex(2 / 3, 0), complex(2 / 3, 0), complex(-1 / 3, 0),
			complex(2 / 3, 0), complex(-1 / 3, 0), complex(2 / 3, 0)
		];
	}
	transformer.setspars(checkedSpars('trfAuto', sparsArray));
	transformer.setglobal(settings);
	transformer._schematic = schematicPart('trfAuto', {labelPrefix: 'trfAuto'});
	transformer._dcModel = requiredDcModel('trfAuto', 3, 'Supply center-tapped winding DC resistances, or explicitly select an ideal autotransformer fixture.', {centerTap: 1, windingEnds: [2, 3]}, settings);
	return transformer;
}
