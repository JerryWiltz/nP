import complex from "../maths/complex";
import NPort from "./nPort";
function seR(R = 75) { // series resistor nPort object
	NPort.call(this);
	var seR = new NPort,
		Zo = this.zo,
		two = complex(2,0),
		Z = complex(R, 0),	
		s11 = Z.div(Z.add(Zo.add(Zo))),
		s21 = (two.mul(Zo)).div(Z.add(Zo.add(Zo))),
		s12 = s21,
		s22 = s11,
		sparsArray =	[[s11, s12],
						[s21, s22]];
	seR.setspars(sparsArray);				
	return seR;
	};
	
export default seR