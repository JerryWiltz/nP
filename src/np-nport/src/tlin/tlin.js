import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';

export function tlin(Ztlin = 60, Length = 0.5) { // series inductor nPort object
	var tlin = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), one = complex(1,0), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
	var A = {}, B = {}, C = {}, D = {}, Ds = {}, E = {}, L = {}, p = {}, r = {};
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z = complex(Ztlin, 0);
		A = two.mul(Z).mul(Zo);
		B = Z.mul(Z).sub(Zo.mul(Zo));
		C = Z.mul(Z).add(Zo.mul(Zo));
		D = complex(0, Length/(2*3.14)/(11.78496e9/frequencyList[freqCount]));
		Ds = A.mul(D.coshCplx()).add(B.mul(D.sinhCplx()));
		r = Z.sub(Zo).div(Z.add(Zo))
		E = 2*Math.PI*frequencyList[freqCount]*Length/11.78496e9;
		p = complex( Math.cos(E), -Math.sin(E));
		s11 = r.mul(one.sub(p.mul(p))).div( one.sub(r.mul(r).mul(p.mul(p))) ); 
		s12 = p.mul(one.sub(r.mul(r))).div( one.sub(r.mul(r).mul(p.mul(p))) ); 
		s21 = s12;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	};
	tlin.setspars(sparsArray);
	tlin.setglobal(global);	
	return tlin;
};
