// Modified: 2026-11-16
import {connectionDcModel} from '../dcModel';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {componentSettings} from '../componentSettings';

export function Short(options = {}) { //  one port, Short
	var Short = new nPort;
	var settings = componentSettings(global, options);
	var frequencyList = analysisFrequencies(settings), Ro = global.Ro;
	var freqCount = 0, s11, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex(-1,0);
		sparsArray[freqCount] =	[frequencyList[freqCount],s11];
	}	
	Short.setspars(sparsArray);
	Short.setglobal(settings);
	Short._schematic = schematicPart('Short');
	Short._dcModel = connectionDcModel('Short', 1, [[1, 'g']], [], {}, settings);
	return Short;
};
