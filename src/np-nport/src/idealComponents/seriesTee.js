// Modified: 2026-10-07
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';

// Ideal three-port junction for attaching a one-port network in series.
// Ports 1 and 2 form the through path; port 3 is the series branch.
export function seriesTee() {
	var junction = new nPort;
	var frequencyList = analysisFrequencies(global);
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

	junction.setspars(sparsArray);
	junction.setglobal(global);
	return junction;
};
