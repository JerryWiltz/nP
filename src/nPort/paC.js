import complex from "../maths/complex";
import NPort from "./nPort";
function paC(C = 1e-12, F = 2e9) { // parallel capacitor nPort object
	NPort.call(this);
	var paC = new NPort,
		Zo = this.zo,
		Yo = this.zo.inv(),
		two = complex(2,0),
		Z = complex(0, 1/(2*Math.PI*C*F)),
		Y = Z.inv(),
		s11 = (Y.neg()).div(Y.add(Yo.add(Yo))),
		s21 = (two.mul(Yo)).div(Y.add(Yo.add(Yo))),  
		s12 = s21,
		s22 = s11,
		sparsArray =	[[s11, s12],
						[s21, s22]];
	paC.setspars(sparsArray);				
	return paC;
	};
	
export default paC