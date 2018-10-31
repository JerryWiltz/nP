import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';

export function trf(N = 0.5) { // parallel resistor nPort object
	var trf = new nPort;
	var e = 1e-7
	var frequencyList = global.fList, Ro = global.Ro;
	var freqCount = 0, s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex((N**2-1)/(N**2+1),0+e);
		s12 = complex(2*N/(N**2+1),0+e);  
		s21 = complex(2*N/(N**2+1),0+e);  
		s22 = complex((1-N**2)/(N**2+1),0+e);
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	}
	trf.setspars(sparsArray);
	trf.setglobal(global);	
	return trf;
};
