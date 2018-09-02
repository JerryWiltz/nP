import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';

export function paSeRC(R = 75, C = 1e-12) { // parallel capaSeRCitor nPort object   
	var paSeRC = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z[freqCount] = complex(R, -1/(2*Math.PI*C*frequencyList[freqCount]));
		Y[freqCount] = Z[freqCount].inv();
		s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
		s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
		s12 = s21;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	}
	paSeRC.setspars(sparsArray);
	paSeRC.setglobal(global);				
	return paSeRC;
};
