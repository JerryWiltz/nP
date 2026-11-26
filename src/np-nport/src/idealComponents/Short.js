// Modified: 2026-11-26
import {connectionDcModel} from '../dcModel';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {validatedComponentSettings, checkedSpars} from '../numericValidation';

export function Short(options = {}) { //  one port, Short
	var Short = new nPort;
	var settings = validatedComponentSettings(global, options, 'Short');
	var frequencyList = analysisFrequencies(settings);
	var freqCount, s11, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex(-1,0);
		sparsArray[freqCount] =	[frequencyList[freqCount],s11];
	}	
	Short.setspars(checkedSpars('Short', sparsArray));
	Short.setglobal(settings);
	Short._schematic = schematicPart('Short');
	Short._dcModel = connectionDcModel('Short', 1, [[1, 'g']], [], {}, settings);
	return Short;
};
