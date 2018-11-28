import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';

export function tclin(Zoetclin = 100, Zootclin = 30, Length = 1.47 * 0.0254) { // 1.4732 is the quarter wavelength at 2GHz, (1.3412 at 2.2 GHz)
	var ctlin = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), one = complex(1,0), two = complex(2,0), freqCount = 0, Zoe = [], Zoo = [], Y = [];
	var s11oe, s12oe, s21oe, s22oe;
	var s11oo, s12oo, s21oo, s22oo;
	var s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44;
	var sparsArray = [];
	var Aoe = {}, Boe = {}, Coe = {}, Dsoe = {};
	var Aoo = {}, Boo = {}, Coo = {}, Dsoo = {};
	var alpha = 0, beta = 0, gamma = {};
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		// alpha beta gamma section
		alpha = 0;
		beta = 2*Math.PI*frequencyList[freqCount]/2.997925e8;
		gamma = complex(alpha * Length, beta * Length);

		// Zoe section
		Zoe = complex(Zoetclin, 0);

		Aoe = Zoe.mul(Zoe).sub(Zo.mul(Zo));
		Boe = Zoe.mul(Zoe).add(Zo.mul(Zo));
		Coe = two.mul(Zoe).mul(Zo);

		Dsoe = Coe.mul(gamma.coshCplx()).add(Boe.mul(gamma.sinhCplx()));

		s11oe = Aoe.mul(gamma.sinhCplx()).div(Dsoe);
		s12oe = Coe.div(Dsoe);	
		s21oe = s12oe;
		s22oe = s11oe; 
		// Zoo section
		Zoo = complex(Zootclin, 0);

		Aoo = Zoo.mul(Zoo).sub(Zo.mul(Zo));
		Boo = Zoo.mul(Zoo).add(Zo.mul(Zo));
		Coo = two.mul(Zoo).mul(Zo);

		Dsoo = Coo.mul(gamma.coshCplx()).add(Boo.mul(gamma.sinhCplx()));

		s11oo = Aoo.mul(gamma.sinhCplx()).div(Dsoo);
		s12oo = Coo.div(Dsoo);	
		s21oo = s12oo;
		s22oo = s11oo;
 

		// put the 4 port together per Gupta page 331
		s44 = s11 = (s11oe.add(s11oo)).mul(complex(0.5,0));
		s33 = s22 = (s22oe.add(s22oo)).mul(complex(0.5,0));
		s34 = s21 = (s21oe.add(s21oo)).mul(complex(0.5,0));
		s43 = s12 = (s12oe.add(s12oo)).mul(complex(0.5,0));
		s13 = s42 = (s12oe.sub(s12oo)).mul(complex(0.5,0));
		s31 = s24 = (s21oe.sub(s21oo)).mul(complex(0.5,0));
		s14 = s41 = (s11oe.sub(s11oo)).mul(complex(0.5,0));
		s23 = s32 = (s22oe.sub(s22oo)).mul(complex(0.5,0));

		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44];
	};
	ctlin.setspars(sparsArray);
	ctlin.setglobal(global);	
	return ctlin;
};
