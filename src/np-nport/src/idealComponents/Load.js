// Modified: 2026-10-26
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {componentSettings} from '../componentSettings';

export function Load(options = {}) { // one port, load
	var Load = new nPort;
	var settings = componentSettings(global, options);
	var frequencyList = analysisFrequencies(settings), Ro = global.Ro;
	var freqCount = 0, s11, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex(0,0);
		sparsArray[freqCount] =	[frequencyList[freqCount],s11];
	}	
	Load.setspars(sparsArray);
	Load.setglobal(settings);
	Load._schematic = {kind: 'component', symbol: 'load'};
	return Load;
};
