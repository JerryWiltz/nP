import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';

export function Tee4() { // a 4-port dummy connection
	var Tee4 = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = s22 = s33 = s44 = complex(1e-7 + -1/2,0);
		s12 = s13 = s14 = s21 = s23 = s24 = s31 = s32 = s34 = s41 = s42 = s43 = complex(1e-7 + 1/2,0);
		
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44];
	}	
	Tee4.setspars(sparsArray);
	Tee4.setglobal(global);
	return Tee4;
};
