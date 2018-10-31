import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';

export function trf4Port(N = 0.5) { // parallel resistor nPort object
	var trf4Port = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var freqCount = 0, sparsArray = [];
	var s11, s12, s13, s14,
		s21, s22, s23, s24,
		s31, s32, s33, s34,
		s41, s42, s43, s44;
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = s24 = s33 = s42 = complex((N**2)/(N**2+1),0);
		s14 = s23 = s32 = s41 = complex(-N/(N**2+1),0);  
		s12 = s21 = s34 = s43 = complex(N/(N**2+1),0);  
		s13 = s22 = s31 = s44 = complex((1)/(N**2+1),0);
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44];
	}
	trf4Port.setspars(sparsArray);
	trf4Port.setglobal(global);	
	return trf4Port;
};

/*                Note: N2 = N**2 N = 0.5, N2 = 0.25

S11 = S24 = S33 = S42 = N2 / (1 + N2)  //  0.25/1.25 = 0.2
S14 = S23 = S32 = S41 = -N / (1 + N2)  //  -0.5/1.25 = -0.4
S12 = S21 = S34 = S43 =  N / (1 + N2)  //   0.5/1.25 = 0.4
S13 = S22 = S31 = S44 =  1 / (1 + N2)  //     1/1.25 = 0.8
*/
