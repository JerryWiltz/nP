import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';

export function tlin(Z = 60, Length = 0.5 * 0.0254) { // Z is in ohms and Length is in meters, sparameters of a physical transmission line
	var tlin = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), one = complex(1,0), two = complex(2,0), freqCount = 0, Ztlin = [], s11, s12, s21, s22, sparsArray = [];
	var Atlin = {}, Btlin = {}, Ctlin = {}, Ds = {}, alpha = 0, beta = 0, gamma = {};
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Ztlin = complex(Z, 0);
	
		Atlin = Ztlin.mul(Ztlin).sub(Zo.mul(Zo));
		Btlin = Ztlin.mul(Ztlin).add(Zo.mul(Zo));
		Ctlin = two.mul(Ztlin).mul(Zo);
		
		alpha = 0;
		beta = 2*Math.PI*frequencyList[freqCount]/2.997925e8;
		gamma = complex(alpha * Length, beta * Length);

		Ds = Ctlin.mul(gamma.coshCplx()).add(Btlin.mul(gamma.sinhCplx()));

		s11 = Atlin.mul(gamma.sinhCplx()).div(Ds);
		s12 = Ctlin.div(Ds);	
		s21 = s12;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	};
	tlin.setspars(sparsArray);
	tlin.setglobal(global);	
	return tlin;
}
