import complex from "../maths/complex";
import NPort from "./nPort";

function seR(R = 75, globals) { // series resistor nPort object
	var seR = new NPort;
	var frequencyList = globals.fList, Ro = globals.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z[freqCount] = complex(R, 0);
		s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
		s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
		s12 = s21;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	}	
	seR.setspars(sparsArray);
	seR.setglobals(globals);
	return seR;
};
	
export default seR