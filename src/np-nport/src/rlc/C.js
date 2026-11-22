// Modified: 2026-11-21
import {lumpedDcModel} from '../dcModel';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {componentSettings} from '../componentSettings';
import {dcTwoPort} from './dcTwoPort';

export function C(C = 1e-12, options = {}) { // series capacitor nPort object
	var cPort = new nPort;
	var settings = componentSettings(global, options);
	var frequencyList = analysisFrequencies(settings), Ro = global.Ro;
	var Zo = complex(Ro,0), two = complex(2,0), freqCount, Z = [], s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		if (frequencyList[freqCount] === 0) {
			sparsArray[freqCount] = [0].concat(dcTwoPort('open', 0, Ro));
			continue;
		}
		Z[freqCount] = complex(0, -1/(2*Math.PI*C*frequencyList[freqCount]));	
		s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
		s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
		s12 = s21;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	};
	cPort.setspars(sparsArray);
	cPort.setglobal(settings);
	cPort._schematic = schematicPart('C', {value: C});
	cPort._dcModel = lumpedDcModel('C', 'series', 'series', {capacitance: C}, settings);
	return cPort;
};
