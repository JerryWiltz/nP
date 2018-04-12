(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.nP = global.nP || {})));
}(this, (function (exports) { 'use strict';

	function Complex() {}

		Complex.prototype = {
			constructor: Complex,
			set: function(real, imaginary) { this.x = real; this.y = imaginary; return this },
			getR: function () {return this.x;},	  
			getI: function () {return this.y;}, 
			setR: function (R) {this.x = R;},
			setI: function (I) {this.y = I;},	
			print: function() {console.log(this.x + " " + this.y);},
			add: function (c2) {return complex(this.x + c2.x, this.y + c2.y);},
			sub: function (c2) {return complex(this.x - c2.x, this.y - c2.y);},
			mul: function (c2) {return complex(this.x * c2.x -this.y * c2.y, this.x * c2.y + this.y * c2.x);},		
			div: function (c2) {return complex(
				(this.x * c2.x + this.y * c2.y)/(c2.x * c2.x + c2.y * c2.y),
				(c2.x * this.y - this.x * c2.y)/(c2.x * c2.x + c2.y * c2.y));},	
			inv: function () {return complex((1 * this.x + 0 * this.y)/(this.x * this.x + this.y * this.y), (this.x * 0 - 1 * this.y)/(this.x * this.x + this.y * this.y));},	
			neg: function () {return complex(-this.x, -this.y);},
			mag: function () {return Math.sqrt(this.x * this.x + this.y * this.y);},
			ang: function () {return Math.atan2(this.y, this.x) * (180/Math.PI);},
			magDB10: function () {return 10 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   },
			magDB20: function () {return 20 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   },
	};

	function complex(real, imaginary) {
	  var complex = new Complex ;
	  complex.set(real, imaginary);
	  return complex;
	}

	function NPort() { // base class for nPort objects
		this.zo = complex(50,0);
		this.spars = [];
	}
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
					nPortout.setspars(out);
				return nPortout;},
	};

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
		}

	//export {default as paC}	            from "./src/nPort/paC";

	exports.complex = complex;
	exports.seL = seL;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
