// Modified: 2026-11-26
import {dcModel} from '../dcModel';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {validatedComponentSettings, checkedSpars} from '../numericValidation';

// Ideal three-port junction for attaching a one-port network in series.
// Ports 1 and 2 form the through path; port 3 is the series branch.
export function seriesTee(options = {}) {
	var junction = new nPort;
	var settings = validatedComponentSettings(global, options, 'seriesTee');
	var frequencyList = analysisFrequencies(settings);
	var sparsArray = [];

	for (var freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var oneThird = complex(1 / 3, 0);
		var twoThirds = complex(2 / 3, 0);
		var negativeTwoThirds = complex(-2 / 3, 0);

		sparsArray[freqCount] = [
			frequencyList[freqCount],
			oneThird, twoThirds, negativeTwoThirds,
			twoThirds, oneThird, twoThirds,
			negativeTwoThirds, twoThirds, oneThird
		];
	}

	junction.setspars(checkedSpars('seriesTee', sparsArray));
	junction.setglobal(settings);
	junction._schematic = schematicPart('seriesTee');
	junction._dcModel = dcModel('seriesTee', 3, 'linear', 'ideal', {modelId: 'series-junction', voltageConstraint: [1, -1, 1], currentRatios: [1, -1, 1]}, settings);
	return junction;
};
