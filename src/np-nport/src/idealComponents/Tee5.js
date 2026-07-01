import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';

export function Tee5() { // a 4-port dummy connection
	var Tee5 = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s13, s14, s15, s21, s22, s23, s24, s25, s31, s32, s33, s34, s35, s41, s42, s43, s44, s45, s51, s52, s53, s54, s55, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = s22 = s33 = s44 = s55 = complex(1e-7 + -0.6,0);
		s12 = s13 = s14 = s15 = s21 = s23 = s24 = s25 = s31 = s32 = s34 = s35 = s41 = s42 = s43 = s45 = s51 = s52 = s53 = s54 = complex(1e-7 + 0.4,0);
		
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s14, s15, s21, s22, s23, s24, s25, s31, s32, s33, s34, s35, s41, s42, s43, s44, s45, s51, s52, s53, s54, s55];
	}	
	Tee5.setspars(sparsArray);
	Tee5.setglobal(global);
	return Tee5;
};
