// Modified: 2026-08-12
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';

// Ideal three-port junction for attaching a one-port network in series.
// Ports 1 and 2 form the through path; port 3 is the series branch.
export function seriesTee() {
	var junction = new nPort;
	var frequencyList = global.fList;
	var e = 1e-7;
	var sparsArray = [];

	for (var freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var oneThird = complex(e + 1 / 3, 0);
		var twoThirds = complex(e + 2 / 3, 0);
		var negativeTwoThirds = complex(e - 2 / 3, 0);

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
