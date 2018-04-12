import complex from "../maths/complex";
import NPort from "./nPort";
function seL(L = 5e-9, F = 2e9) { // series inductor nPort object
	NPort.call(this);
	var seL = new NPort,
		Zo = this.zo,
		two = complex(2,0),
		Z = complex(0, 2*Math.PI*L*F),	
		s11 = Z.div(Z.add(Zo.add(Zo))),
		s21 = (two.mul(Zo)).div(Z.add(Zo.add(Zo))),
		s12 = s21,
		s22 = s11,
		sparsArray =	[[s11, s12],
						[s21, s22]];
	seL.setspars(sparsArray);				
	return seL;
	};
	
export default seL