// Modified: 2026-11-26
import {connectionDcModel} from '../dcModel';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {validatedComponentSettings, checkedSpars} from '../numericValidation';

export function Tee(options = {}) { // a 3port dummy connection
	var Tee = new nPort;
	var settings = validatedComponentSettings(global, options, 'Tee');
	var frequencyList = analysisFrequencies(settings);
	var freqCount, s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex(-1/3,0);
		s12 = complex(2/3,0);
		s13 = s12;
		s21 = s12;
		s22 = s11;
		s23 = s12;
		s31 = s12;
		s32 = s12;
		s33 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s21, s22, s23, s31, s32, s33];
	}	
	Tee.setspars(checkedSpars('Tee', sparsArray));
	Tee.setglobal(settings);
	Tee._schematic = schematicPart('Tee');
	Tee._dcModel = connectionDcModel('Tee', 3, [[1, 2, 3]], [], {}, settings);
	return Tee;
};
