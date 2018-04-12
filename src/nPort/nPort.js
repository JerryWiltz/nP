import complex from "../maths/complex";
function NPort() { // base class for nPort objects
	this.zo = complex(50,0);
	this.spars = [];
};

	NPort.prototype = {
		constructor: NPort,
		setspars: function (sparsArray) { this.spars = sparsArray; },
		getspars: function () { return this.spars; },
		cas: function cas (n2) { // cascade two 2-ports along with method chaining since it returns an NPort
			var spars   = this.getspars(),
				sparsN2 = n2.getspars(),
				one = complex(1,0),
				s11a = spars[0][0], s12a = spars[0][1], s21a = spars[1][0], s22a = spars[1][1],
				s11b = sparsN2[0][0], s12b = sparsN2[0][1], s21b = sparsN2[1][0], s22b = sparsN2[1][1],
				s11 = s11a.add (( s12a.mul(s11b).mul(s21a) ).div( (one.sub( s22a.mul(s11b) ) ) ) ),
				s12 =           ( s12a.mul(s12b)           ).div( (one.sub( s22a.mul(s11b) ) ) )  ,
				s22 = s22b.add (( s21b.mul(s22a).mul(s12b) ).div( (one.sub( s22a.mul(s11b) ) ) ) ),
				s21 =           ( s21a.mul(s21b)           ).div( (one.sub( s22a.mul(s11b) ) ) )  ,
				out = [[s11, s12],
					 [s21, s22]];
			var nPortout = new NPort();
				nPortout.setspars(out)
			return nPortout;},
};

export default NPort
