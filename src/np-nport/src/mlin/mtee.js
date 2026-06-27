// Modified: 2026-06-27
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global}  from '../../../np-global/src/global';
import {INCH_TO_METER, VACUUM_IMPEDANCE} from './constants';

export function mtee(Width = 0.023 * INCH_TO_METER, Height = 0.025 * INCH_TO_METER, Thickness = 0.0000125 * INCH_TO_METER, er = 10, rho = 0, tand = 0.000, Width2 = Width) { // microstrip tee nPort object
	var mtee = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];

	//microstrip calcs
	var eta = VACUUM_IMPEDANCE;
	var ere = (er+1)/2 + ( (er-1)/2 * 1/Math.sqrt(1+10*Height/Width) );
	var zo  = function () {
		if (Width/Height < 1) {
			return eta/((2*Math.PI)*Math.sqrt(ere)) * Math.log(8*Height/Width + 0.25*Width/Height)
		}
		else {
			return eta/Math.sqrt(ere) * 1/(Width/Height + 1.393 + 0.667 * Math.log(Width/Height + 1.444));
		}
	}();
	var Ct = (100/Math.tanh(0.0072 * zo) + 0.64 * zo - 261)*Width*1e-12;
	
	
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
	mtee.Ct = Ct;
	mtee.microstrip = {Width, Height, Thickness, er, rho, tand, Width2};
	return mtee;
};
