// Modified: 2026-07-01
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';

export function Shift90() { // lossless matched two-port with +90 degree through phase
	var Shift90 = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var freqCount = 0, s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex(0,0);
		s12 = complex(0,1);
		s21 = complex(0,1);
		s22 = complex(0,0);
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	}
	Shift90.setspars(sparsArray);
	Shift90.setglobal(global);
	return Shift90;
};
