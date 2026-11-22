// Modified: 2026-11-21
import {lumpedDcModel} from '../dcModel';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {componentSettings} from '../componentSettings';

export function seSeRL(R = 75, L = 5e-9, options = {}) { // series inductor nPort object
	var seSeRL = new nPort;
	var settings = componentSettings(global, options);
	var frequencyList = analysisFrequencies(settings), Ro = global.Ro;
	var Zo = complex(Ro,0), two = complex(2,0), freqCount, Z = [], s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z[freqCount] = complex(R, 2*Math.PI*L*frequencyList[freqCount]);	
		s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
		s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
		s12 = s21;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	};
	seSeRL.setspars(sparsArray);
	seSeRL.setglobal(settings);
	seSeRL._schematic = schematicPart('seSeRL', {labelPrefix: 'seSeRL', resistance: R, inductance: L});
	seSeRL._dcModel = lumpedDcModel('seSeRL', 'series', 'series', {resistance: R, inductance: L}, settings);
	return seSeRL;
};
