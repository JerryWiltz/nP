import complex from "../maths/complex";
import NPort from "./nPort";
function paR(R = 75) { // parallel resistor nPort object
	NPort.call(this);
	var paR = new NPort,
		Zo = this.zo,
		Yo = this.zo.inv(),
		two = complex(2,0),
		Z = complex(R, 0),
		Y = Z.inv(),
		s11 = (Y.neg()).div(Y.add(Yo.add(Yo))),
		s21 = (two.mul(Yo)).div(Y.add(Yo.add(Yo))),  
		s12 = s21,
		s22 = s11,
		sparsArray =	[[s11, s12],
						[s21, s22]];
	paR.setspars(sparsArray);				
	return paR;
	};
	
export default paR