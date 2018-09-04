import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';

export function paPaRLC(R = 75, L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
	var paPaRLC = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z[freqCount] = ( (complex(R,0).inv()).add (complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
		Y[freqCount] = Z[freqCount].inv();
		s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
		s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
		s12 = s21;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	}
	paPaRLC.setspars(sparsArray);
	paPaRLC.setglobal(global);				
	return paPaRLC;
};
