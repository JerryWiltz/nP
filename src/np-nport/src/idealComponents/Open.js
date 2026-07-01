import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';

export function Open() { // one port, open
	var Open = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var freqCount = 0, s11, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex(1,0);
		sparsArray[freqCount] =	[frequencyList[freqCount],s11];
	}	
	Open.setspars(sparsArray);
	Open.setglobal(global);
	return Open;
};
