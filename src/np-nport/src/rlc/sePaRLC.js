import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';

export function sePaRLC(R = 75, L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
	var sePaRLC = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z[freqCount] = ( (complex(R,0).inv()).add (complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
		s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
		s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
		s12 = s21;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	}
	sePaRLC.setspars(sparsArray);
	sePaRLC.setglobal(global);				
	return sePaRLC;
};
