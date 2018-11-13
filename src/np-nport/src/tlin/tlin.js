import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';

export function tlin(Ztlin = 60, Length = 0.5 * 0.0254) { // Z is in ohms and Length is in meters, sparameters of a physical transmission line
	var tlin = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), one = complex(1,0), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
	var A = {}, B = {}, C = {}, Ds = {}, alpha = 0, beta = 0, gamma = {};
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z = complex(Ztlin, 0);
	
		A = Z.mul(Z).sub(Zo.mul(Zo));
		B = Z.mul(Z).add(Zo.mul(Zo));
		C = two.mul(Z).mul(Zo);
		
		alpha = 0;
		beta = 2*Math.PI*frequencyList[freqCount]/2.997925e8;
		gamma = complex(alpha * Length, beta * Length);

		Ds = C.mul(gamma.coshCplx()).add(B.mul(gamma.sinhCplx()));

		s11 = A.mul(gamma.sinhCplx()).div(Ds);
		s12 = C.div(Ds);	
		s21 = s12;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	};
	tlin.setspars(sparsArray);
	tlin.setglobal(global);	
	return tlin;
};
