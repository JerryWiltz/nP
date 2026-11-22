// Modified: 2026-11-21
import {connectionDcModel} from '../dcModel';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {componentSettings} from '../componentSettings';

export function Open(options = {}) { // one port, open
	var Open = new nPort;
	var settings = componentSettings(global, options);
	var frequencyList = analysisFrequencies(settings);
	var freqCount, s11, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex(1,0);
		sparsArray[freqCount] =	[frequencyList[freqCount],s11];
	}	
	Open.setspars(sparsArray);
	Open.setglobal(settings);
	Open._schematic = schematicPart('Open');
	Open._dcModel = connectionDcModel('Open', 1, [], [[1, 'g']], {}, settings);
	return Open;
};
