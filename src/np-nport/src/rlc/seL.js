// Modified: 2026-11-21
import {lumpedDcModel} from '../dcModel';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {componentSettings} from '../componentSettings';

export function seL(L = 5e-9, options = {}) { // series inductor nPort object
	var seL = new nPort;
	var settings = componentSettings(global, options);
	var frequencyList = analysisFrequencies(settings), Ro = global.Ro;
	var Zo = complex(Ro,0), two = complex(2,0), freqCount, Z = [], s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z[freqCount] = complex(0, 2*Math.PI*L*frequencyList[freqCount]);	
		s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
		s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
		s12 = s21;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	};
	seL.setspars(sparsArray);
	seL.setglobal(settings);
	seL._schematic = schematicPart('seL', {labelPrefix: 'seL', value: L});
	seL._dcModel = lumpedDcModel('seL', 'series', 'series', {inductance: L}, settings);
	return seL;
};
