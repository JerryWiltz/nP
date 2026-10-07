// Modified: 2026-10-07
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';

export function Load() { // one port, load
	var Load = new nPort;
	var frequencyList = analysisFrequencies(global), Ro = global.Ro;
	var freqCount = 0, s11, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex(0,0);
		sparsArray[freqCount] =	[frequencyList[freqCount],s11];
	}	
	Load.setspars(sparsArray);
	Load.setglobal(global);
	return Load;
};
