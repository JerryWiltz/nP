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

	// Generates an array of chebyshev values based on number of section and ripple
	function chebyLPgk (n = 3, ripple = 0.1) { // Returns gk's shown in formula 4.05-2 on page 99 of MYJ
		var	chebyLPgkin = new Array(1 + 1 + n + 1),  // Table title row, go row, gk's (n rows), and g(k+1)
			chebyLPgkout = [],
			i = 0, row = 0;
				
		// The function, gk() Fills in the variable table above called "chebyLPgkin" to hold ak, bk, and gk's based on the n
		for(i = 0; i < chebyLPgkin.length; i++) {chebyLPgkin[i] = new Array(4); }	
		// Table for complete display of values
		chebyLPgkin[0][0] = 'ak'; chebyLPgkin[0][1] = 'bk'; chebyLPgkin[0][2] = 'gk'; chebyLPgkin[0][3] = 'R,C,L';

		function coth(x) {return (Math.exp(x) + Math.exp(-x))/(Math.exp(x) - Math.exp(-x));}	function B() {return Math.log(coth(ripple/17.37));}	function sinh(x) {return (Math.exp(x) - Math.exp(-x))/2;}	function G() {return sinh(B()/(2 * n));} // Compute G() on page 99 of MYJ
		
		chebyLPgkin[1][2] = 1; // Initialize the lowPassFilter array for g0=1;
		
		for(row = 2; row < chebyLPgkin.length -1; row++) { chebyLPgkin[row][0] = Math.sin(((2*(row -1) -1) * Math.PI)/(2 * n)); }	
		for(row = 2; row < chebyLPgkin.length -1; row++) { // Populate the bk column on page 99 of MYJ
			chebyLPgkin[row][1] = Math.pow(G(),2) + Math.pow(Math.sin(  (row-1) * Math.PI/n),2);    
		}	
		chebyLPgkin[2][2] = 2*chebyLPgkin[2][0]/G(); // Populate the first q1 in the cell
		
		for(row = 3; row < chebyLPgkin.length -1; row++) { // Populate the gk column from g2 onward to gk
			chebyLPgkin[row][2] = (4 * chebyLPgkin[row-1][0] * chebyLPgkin[row][0])/(chebyLPgkin[row-1][1] * chebyLPgkin[row-1][2]);    
		}	
		chebyLPgkin[ n+2][2] = (n % 2 === 0 ) ? Math.pow(coth(B()/4),2) : 1 ; // Populate the last g(k+1) in the cell
		
		// Populate chebyLPgkout
		for(row = 1; row < chebyLPgkin.length; row++) { chebyLPgkout[row - 1] = chebyLPgkin[row][2]; }	
		return chebyLPgkout;
	}

	// Generates an array of parallel Capacitors and series Inductors based on chebyshev values
	function chebyLPLCs ( cheby = [1, 1.0315851425078764, 1.1474003299537219, 1.0315851425078761, 1], maxPassFrequency = 0.2e9, zo = 50) { 
		var	chebyLPLCsout = new Array(cheby.length),
		i = 0;
		
		chebyLPLCsout[0] = cheby[0] * zo; // Populate the first resistor in the array
		
		for(i = 1; i < cheby.length -1; i++) { // Populate the C's and L's
			chebyLPLCsout[i] = ( (i) % 2 === 0 ) ? cheby[i] * zo * (1/(2*Math.PI)) * (1/(maxPassFrequency )) : cheby[i] * 1/zo * (1/(2*Math.PI)) * (1/(maxPassFrequency));
		}	
		chebyLPLCsout[cheby.length-1] = cheby[cheby.length-1] * zo; // Populate the last resistor in the array
		
		return chebyLPLCsout;
	}

	// Computes the number sections in a chebyshev lowpass filter
	function chebyLPNsec (passFreq = .2, rejFreq = 1.5, ripple = 0.1, rejection = 30) { // Formula 4.03-4 for n on page 86 of MYJ
		var chebyLPNsecout = 0;
		function normalizedBandwidth() { return rejFreq/passFreq; }// Computes the w/w1 in MYJ on page 86 of MYJ
		function epsilon() { return Math.pow(10,(ripple/10))-1;} // Formula 4.03-5 on page 87 on MYJ
		function arcCosh(x) {return Math.log(x + Math.sqrt((x * x)-1));}
		chebyLPNsecout = Math.ceil(arcCosh(Math.sqrt((Math.pow(10,(rejection/10))-1)/epsilon(ripple)))/arcCosh(normalizedBandwidth()));
		return chebyLPNsecout;
	}

	var global = {
		fList:	[2e9],
		Ro:		50,
		Temp:	293,
		fGen: function fGen (fStart, fStop, points) {
	  		var out = [];
	  		var fStep = (fStop-fStart)/(points-1);
	  		var fMax = fStart;
	 		var i = 0; 
			  for (i = 0; i < points; i++, fMax += fStep ) {
	   			 out.push(fMax);
	 		 }
	  		return out;
		},
	};

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

	function paR(R = 75) { // parallel resistor nPort object
		var paR = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
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
		paR.setglobal(global);	
		return paR;
	}

	// main entry point

	exports.complex = complex;
	exports.chebyLPgk = chebyLPgk;
	exports.chebyLPLCs = chebyLPLCs;
	exports.chebyLPNsec = chebyLPNsec;
	exports.global = global;
	exports.seR = seR;
	exports.paR = paR;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
