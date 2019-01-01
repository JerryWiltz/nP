import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';

export function mclin(Width = 10 * 0.0254, Space = 63 * 0.0254, Height = 63 * 0.0254, Thickness = 0.0012 * 0.0254, Length = 0.180 * 0.0254, er = 4, rho = 1, tand = 0.001 ) { // 1.4732 is the quarter wavelength at 2GHz, (1.3412 at 2.2 GHz)
	var ctlin = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), one = complex(1,0), two = complex(2,0), freqCount = 0, Zoemclin = [], Zoomclin = [], Y = [];
	var s11oe, s12oe, s21oe, s22oe;
	var s11oo, s12oo, s21oo, s22oo;
	var s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44;
	var sparsArray = [];
	var Aoe = {}, Boe = {}, Coe = {}, Dsoe = {};
	var Aoo = {}, Boo = {}, Coo = {}, Dsoo = {};
	var alpha = 0, beta = 0, gamma = {};

	// come up with Zo and eref of a microstrip line for a given Width/Height
	var pi = Math.PI;
	var f = 12e9;
	var wOverH = Width/Height;
	var delWOverH = Thickness > 0.0 ? ( Width/Height <= 1/(2*pi) ? (1.25/pi)*(Thickness/Height)*(1+Math.log(4*pi*Width/Thickness)) : (1.25/pi)*(Thickness/Height)*(1+Math.log(2*Height/Thickness)) ) : 0.0;
	var weOverH = Width/Height + delWOverH;
	var Q = ((er-1)/4.6)*(Thickness/Height)*(1/Math.sqrt(Width/Height));
	var Fwh = 1/Math.sqrt(1+10*Width/Height);
	var ere = ((er+1)/2)+((er-1)/2)*Fwh-Q;
	var ZoER = Width/Height <= 1.0 ? (60/Math.sqrt(ere))*Math.log(8/weOverH+0.25*weOverH) : (376.7/Math.sqrt(ere))*(1/(weOverH+1.393+0.667*Math.log(weOverH+1.444 )));

	// come up with even and odd mode W/H due to strip thickness
	var delThickness = Height * ( 1/er ) * (Thickness/Height)/(Space/Height);
	var delWidth = delWOverH/Height;
	var WtoeOverH = Thickness > 0.0 ? Width/Height + delWOverH*(1 - 0.5*Math.exp(-0.69*delWidth/delThickness)) : Width/Height;
	var WtooOverH = WtoeOverH + delThickness/Height;

	// come up with Zo and ere of a microstrip line for given Width/Height with er = 1, ie air.
	var ZoAIR = Width/Height <= 1.0 ? (60/Math.sqrt(1))*Math.log(8/weOverH+0.25*weOverH) : (376.7/Math.sqrt(1))*(1/(weOverH+1.393+0.667*Math.log(weOverH+1.444 )));

	// come up with even and odd mode capacitances with er = ER
	var CpoeER = 8.854187817e-12 * er * WtoeOverH;
	var CpooER = 8.854187817e-12 * er * WtooOverH;
	var CpoeAIR = 8.854187817e-12 * 1 * WtoeOverH;
	var CpooAIR = 8.854187817e-12 * 1 * WtooOverH;
	var CfoeER = 0.5 * Math.sqrt(ere)/(2.992925e8*ZoER) - CpoeER;
	var CfooER = 0.5 * Math.sqrt(ere)/(2.992925e8*ZoER) - CpooER;
	var CfoeAIR = 0.5 * Math.sqrt(1)/(2.992925e8*ZoAIR) - CpoeAIR;
	var CfooAIR = 0.5 * Math.sqrt(1)/(2.992925e8*ZoAIR) - CpooAIR;
	var Aoecaps = Math.exp( -0.1 * Math.exp(2.33 - 2.53 * WtoeOverH));
	var CfoePrimeER = CfoeER/(1 + Aoecaps * (Height/Space) * Math.tanh(10 * Space/Height )) * Math.sqrt(er/ere);
	var CfoePrimeAIR = CfoeAIR/(1 + Aoecaps * (Height/Space) * Math.tanh(10 * Space/Height )) * Math.sqrt(1/1);
	var koo = (Space/Height)/( (Space/Height) + 2 * WtooOverH);
	var kooPrime = Math.sqrt(1-koo**2);
	var CgooAIR = 8.8541817e-12 * ( koo <= 0.7 ? 1/( (1/pi) * Math.log( 2 * ( 1 + Math.sqrt(kooPrime))/( 1 - Math.sqrt(kooPrime)))) : (1/pi) * Math.log( 2 * ( 1 + Math.sqrt(koo))/( 1 - Math.sqrt(koo))) );
	var CgooER = (8.8541817e-12*er/pi) * Math.log( Math.cosh( pi*Space/(4 * Height))) + 0.65 * CfooER * ( (0.02/(Space/Height)) * Math.sqrt(er) + 1.0 - (1/er**2));
	var CoeER = CpoeER + CfoeER + CfoePrimeER;
	var CoeAIR = CpoeAIR + CfoeAIR + CfoePrimeAIR;
	var CooER = CpooER + CfooER + CgooAIR + CgooER;
	var CooAIR = CpooAIR + CfooAIR + CgooAIR + CgooER;

	// come up with even and odd mode impedances and effective dielectric constants
	var Zoe = 1/(2.992925e8 * Math.sqrt(CoeER * CoeAIR));
	var Zoo = 1/(2.992925e8 * Math.sqrt(CooER * CooAIR));
	var ereoe = CoeER/CoeAIR;
	var ereoo = CooER/CooAIR;
	console.log(Zoe);
	console.log(Zoo);
	console.log(ereoe);
	console.log(ereoo);


	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		// alpha beta gamma section
		alpha = 0;
		beta = 2*Math.PI*frequencyList[freqCount]/2.997925e8;
		gamma = complex(alpha * Length, beta * Length);

		// Zoe section
		Zoemclin = complex(Zoe, 0);

		Aoe = Zoemclin.mul(Zoemclin).sub(Zo.mul(Zo));
		Boe = Zoemclin.mul(Zoemclin).add(Zo.mul(Zo));
		Coe = two.mul(Zoemclin).mul(Zo);

		Dsoe = Coe.mul(gamma.coshCplx()).add(Boe.mul(gamma.sinhCplx()));

		s11oe = Aoe.mul(gamma.sinhCplx()).div(Dsoe);
		s12oe = Coe.div(Dsoe);	
		s21oe = s12oe;
		s22oe = s11oe; 
		// Zoo section
		Zoomclin = complex(Zoo, 0);

		Aoo = Zoomclin.mul(Zoomclin).sub(Zo.mul(Zo));
		Boo = Zoomclin.mul(Zoomclin).add(Zo.mul(Zo));
		Coo = two.mul(Zoomclin).mul(Zo);

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
