import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';

export function mtee(w1 = 0.186*0.0254, w2 = 0.334*0.0254, er = 2.55, h = 0.125*0.0254) { // series resistor nPort object
	var mtee = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];

	//microstrip calcs
	var eta = 120*Math.PI;
	var ere = (er+1)/2 + ( (er-1)/2 * 1/Math.sqrt(1+10*h/w1) );
	var zo  = function () {
		if (w1/h < 1) {
			return eta/((2*Math.PI)*Math.sqrt(ere)) * Math.log(8*h/w1 + 0.25*w1/h)
		}
		else {
			return eta/Math.sqrt(ere) * 1/(w1/h + 1.393 + 0.667 * Math.log(w1/h + 1.444));
		}
	}();
	var Ct = (100/Math.tanh(0.0072 * zo) + 0.64 * zo - 261)*w1*1e-12;
	
	
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex(-1/3,0);
		s12 = complex(2/3,0);
		s13 = s12;
		s21 = s12;
		s22 = s11;
		s23 = s12;
		s31 = s12;
		s32 = s12;
		s33 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s21, s22, s23, s31, s32, s33];
	}	
	mtee.setspars(sparsArray);
	mtee.setglobal(global);
	return Ct;
};
