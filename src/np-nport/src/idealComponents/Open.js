// Modified: 2026-11-26
import {connectionDcModel} from '../dcModel';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {validatedComponentSettings, checkedSpars} from '../numericValidation';

export function Open(options = {}) { // one port, open
	var Open = new nPort;
	var settings = validatedComponentSettings(global, options, 'Open');
	var frequencyList = analysisFrequencies(settings);
	var freqCount, s11, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex(1,0);
		sparsArray[freqCount] =	[frequencyList[freqCount],s11];
	}	
	Open.setspars(checkedSpars('Open', sparsArray));
	Open.setglobal(settings);
	Open._schematic = schematicPart('Open');
	Open._dcModel = connectionDcModel('Open', 1, [], [[1, 'g']], {}, settings);
	return Open;
};
