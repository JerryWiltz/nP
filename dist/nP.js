(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.nP = global.nP || {})));
}(this, (function (exports) { 'use strict';

	// Global variables will go here

	function global (fList) { 
		var global = fList;// 
		return global
	}

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

	// Computes the number sections in a chebyshev lowpass filter
	function chebyLowPassN (passFreq = .2, rejFreq = 1.5, ripple = 0.1, rejection = 30) { // Formula 4.03-4 for n on page 86 of MYJ
		var chebyLowPassNout = 0;
		function normalizedBandwidth() { return rejFreq/passFreq; }// Computes the w/w1 in MYJ on page 86 of MYJ
		function epsilon() { return Math.pow(10,(ripple/10))-1;} // Formula 4.03-5 on page 87 on MYJ
		function arcCosh(x) {return Math.log(x + Math.sqrt((x * x)-1));}
		chebyLowPassNout = Math.ceil(arcCosh(Math.sqrt((Math.pow(10,(rejection/10))-1)/epsilon(ripple)))/arcCosh(normalizedBandwidth()));
		return chebyLowPassNout;
	}

	// Generates an array of chebyshev values based on number of section and ripple
	function chebyLowPassG (n = 3, ripple = 0.1) { // Returns gk's shown in formula 4.05-2 on page 99 of MYJ
		var	chebyLowPassGin = new Array(1 + 1 + n + 1),  // Table title row, go row, gk's (n rows), and g(k+1)
			chebyLowPassGout = [],
			i = 0, row = 0;
				
		// The function, gk() Fills in the variable table above called "chebyLowPassGin" to hold ak, bk, and gk's based on the n
		for(i = 0; i < chebyLowPassGin.length; i++) {chebyLowPassGin[i] = new Array(4); }	
		// Table for complete display of values
		chebyLowPassGin[0][0] = 'ak'; chebyLowPassGin[0][1] = 'bk'; chebyLowPassGin[0][2] = 'gk'; chebyLowPassGin[0][3] = 'R,C,L';

		function coth(x) {return (Math.exp(x) + Math.exp(-x))/(Math.exp(x) - Math.exp(-x));}	function B() {return Math.log(coth(ripple/17.37));}	function sinh(x) {return (Math.exp(x) - Math.exp(-x))/2;}	function G() {return sinh(B()/(2 * n));} // Compute G() on page 99 of MYJ
		
		chebyLowPassGin[1][2] = 1; // Initialize the lowPassFilter array for g0=1;
		
		for(row = 2; row < chebyLowPassGin.length -1; row++) { chebyLowPassGin[row][0] = Math.sin(((2*(row -1) -1) * Math.PI)/(2 * n)); }	
		for(row = 2; row < chebyLowPassGin.length -1; row++) { // Populate the bk column on page 99 of MYJ
			chebyLowPassGin[row][1] = Math.pow(G(),2) + Math.pow(Math.sin(  (row-1) * Math.PI/n),2);    
		}	
		chebyLowPassGin[2][2] = 2*chebyLowPassGin[2][0]/G(); // Populate the first q1 in the cell
		
		for(row = 3; row < chebyLowPassGin.length -1; row++) { // Populate the gk column from g2 onward to gk
			chebyLowPassGin[row][2] = (4 * chebyLowPassGin[row-1][0] * chebyLowPassGin[row][0])/(chebyLowPassGin[row-1][1] * chebyLowPassGin[row-1][2]);    
		}	
		chebyLowPassGin[ n+2][2] = (n % 2 === 0 ) ? Math.pow(coth(B()/4),2) : 1 ; // Populate the last g(k+1) in the cell
		
		// Populate chebyLowPassGout
		for(row = 1; row < chebyLowPassGin.length; row++) { chebyLowPassGout[row - 1] = chebyLowPassGin[row][2]; }	
		return chebyLowPassGout;
	}

	// Generates an array of parallel Capacitors and series Inductors based on chebyshev values
	function chebyLowPassLC ( cheby = [1, 1.0315851425078764, 1.1474003299537219, 1.0315851425078761, 1], maxPassFrequency = 0.2e9, zo = 50) { 
		var	chebyLowPassLCout = new Array(cheby.length),
		i = 0;
		
		chebyLowPassLCout[0] = cheby[0] * zo; // Populate the first resistor in the array
		
		for(i = 1; i < cheby.length -1; i++) { // Populate the C's and L's
			chebyLowPassLCout[i] = ( (i) % 2 === 0 ) ? cheby[i] * zo * (1/(2*Math.PI)) * (1/(maxPassFrequency )) : cheby[i] * 1/zo * (1/(2*Math.PI)) * (1/(maxPassFrequency));
		}	
		chebyLowPassLCout[cheby.length-1] = cheby[cheby.length-1] * zo; // Populate the last resistor in the array
		
		return chebyLowPassLCout;
	}

	function NPort() {}
	NPort.prototype = {
		constructor: NPort,
		setspars: function (sparsArray) { this.spars = sparsArray; },
		getspars: function () { return this.spars; },
		cas: function cas (n2) { // cascade two 2-ports along with method chaining since it returns an NPort
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
			}		var casOut = new NPort();
			casOut.setspars(sparsArray);
			return casOut;
		}
	};

	function seR(R = 75, frequencyList = [2e9]) { // series resistor nPort object
		var seR = new NPort;
		var Zo = complex(50,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 0);
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	
		seR.setspars(sparsArray);			
		return seR;
	}

	function paR(R = 75, frequencyList = [2e9]) { // parallel resistor nPort object
		var paR = new NPort;
		var Zo = complex(50,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 0);
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paR.setspars(sparsArray);					
		return paR;
	}

	function seL(L = 5e-9, frequencyList = [2e9]) { // series inductor nPort object
		var seL = new NPort;
		var Zo = complex(50,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, 2*Math.PI*L*frequencyList[freqCount]);	
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo))), s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo))), s12 = s21, s22 = s11, sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	seL.setspars(sparsArray);				
		return seL;
	}

	function paC(C = 1e-12, frequencyList = [2e9]) { // parallel capacitor nPort object   
		var paC = new NPort;
		var Zo = complex(50,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, 1/(2*Math.PI*C*frequencyList[freqCount]));
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo))), s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo))), s12 = s21, s22 = s11, sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paC.setspars(sparsArray);				
		return paC;
		}

	// main entry point

	exports.global = global;
	exports.complex = complex;
	exports.chebyLowPassN = chebyLowPassN;
	exports.chebyLowPassG = chebyLowPassG;
	exports.chebyLowPassLC = chebyLowPassLC;
	exports.seR = seR;
	exports.paR = paR;
	exports.seL = seL;
	exports.paC = paC;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
