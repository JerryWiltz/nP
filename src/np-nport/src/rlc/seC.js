import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';

export function seC(C = 1e-12) { // series inductor nPort object
	var seC = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z[freqCount] = complex(0, -1/(2*Math.PI*C*frequencyList[freqCount]));	
		s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
		s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
		s12 = s21;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	};
	seC.setspars(sparsArray);
	seC.setglobal(global);	
	return seC;
};
