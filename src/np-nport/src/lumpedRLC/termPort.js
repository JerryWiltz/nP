import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';

export function termPort() { // open one port nPort object
	var termPort = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex(0,0);
		sparsArray[freqCount] =	[frequencyList[freqCount],s11];
	}	
	termPort.setspars(sparsArray);
	termPort.setglobal(global);
	return termPort;
};
