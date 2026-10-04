// Modified: 2026-10-04
import { complex } from '../../../np-math/src/complex';
import { nPort } from '../nPort'
import { global } from '../../../np-global/src/global';
import {analysisFrequencies} from '../intermod';

export function trf(N = 0.5) { // ideal transformer nPort object
	var trf = new nPort;
	var frequencyList = analysisFrequencies(global), Ro = global.Ro;
	var freqCount = 0, s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex((N ** 2 - 1) / (N ** 2 + 1), 0);
		s12 = complex(2 * N / (N ** 2 + 1), 0);
		s21 = complex(2 * N / (N ** 2 + 1), 0);
		s22 = complex((1 - N ** 2) / (N ** 2 + 1), 0);
		sparsArray[freqCount] = [frequencyList[freqCount], s11, s12, s21, s22];
	}
	trf.setspars(sparsArray);
	trf.setglobal(global);
	return trf;
};
