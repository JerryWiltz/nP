(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.nP = {})));
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

	//import {global}  from './global';

	function nPort() {}
	nPort.prototype = {
		constructor: nPort,
		setglobal: function (global) { this.global = global; },
		getglobal: function () {return this.global;},
		setspars: function (sparsArray) { this.spars = sparsArray; },
		getspars: function () { return this.spars; },
		cas: function cas (n2) { // cascade two 2-ports along with method chaining since it returns an nPort
			var freqCount = 0, one = complex(1,0),
				sparsA = this.getspars(),
				sparsB = n2.getspars(),
				s11, s12, s21, s22, s11a, s12a, s21a, s22a, s11b, s12b, s21b, s22b, sparsArray = [];
			for (freqCount = 0; freqCount < this.spars.length; freqCount++) {
				s11a = sparsA[freqCount][1]; s12a = sparsA[freqCount][2]; s21a = sparsA[freqCount][3]; s22a = sparsA[freqCount][4];			
				s11b = sparsB[freqCount][1]; s12b = sparsB[freqCount][2]; s21b = sparsB[freqCount][3]; s22b = sparsB[freqCount][4];
				
				s11 = s11a.add (( s12a.mul(s11b).mul(s21a) ).div( (one.sub( s22a.mul(s11b) ) ) ) );
				s12 =           ( s12a.mul(s12b)           ).div( (one.sub( s22a.mul(s11b) ) ) )  ;
				s22 = s22b.add (( s21b.mul(s22a).mul(s12b) ).div( (one.sub( s22a.mul(s11b) ) ) ) );
				s21 =           ( s21a.mul(s21b)           ).div( (one.sub( s22a.mul(s11b) ) ) )  ;
				sparsArray[freqCount] =	[this.spars[freqCount][0],s11, s12, s21, s22];
			}		var casOut = new nPort();
			casOut.setspars(sparsArray);
			casOut.setglobal(this.global);
			return casOut;
		}
	};

	// global variables will go here

	var global = {
		fList:	[2e9],
		Ro:		50,
		Temp:	293,
	};

	function seR(R = 75) { // series resistor nPort object
		var seR = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 0);
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	
		seR.setspars(sparsArray);
		seR.setglobal(global);
		return seR;
	}

	exports.seR = seR;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
