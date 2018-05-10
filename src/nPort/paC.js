import complex from "../maths/complex";
import NPort from "./nPort";

function paC(C = 1e-12, globals) { // parallel capacitor nPort object   
	var paC = new NPort;
	var frequencyList = globals.fList, Ro = globals.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z[freqCount] = complex(0, 1/(2*Math.PI*C*frequencyList[freqCount]));
		Y[freqCount] = Z[freqCount].inv();
		s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo))),
		s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo))),  
		s12 = s21,
		s22 = s11,
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	}
	paC.setspars(sparsArray);
	paC.setglobals(globals);				
	return paC;
	};
	
export default paC