// Modified: 2026-10-13
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {componentSettings} from '../componentSettings';

export function Open(options = {}) { // one port, open
	var Open = new nPort;
	var settings = componentSettings(global, options);
	var frequencyList = analysisFrequencies(settings), Ro = global.Ro;
	var freqCount = 0, s11, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex(1,0);
		sparsArray[freqCount] =	[frequencyList[freqCount],s11];
	}	
	Open.setspars(sparsArray);
	Open.setglobal(settings);
	return Open;
};
