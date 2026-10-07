// Modified: 2026-10-07
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';

export function sePaRC(R = 75, C = 1e-12) { // parallel capacitor nPort object   
	var sePaRC = new nPort;
	var frequencyList = analysisFrequencies(global), Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z[freqCount] = (  (complex(R,0).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
		s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
		s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
		s12 = s21;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	}
	sePaRC.setspars(sparsArray);
	sePaRC.setglobal(global);				
	return sePaRC;
};
