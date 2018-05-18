(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.nP = {})));
}(this, (function (exports) { 'use strict';

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

	exports.chebyLPgk = chebyLPgk;
	exports.chebyLPLCs = chebyLPLCs;
	exports.chebyLPNsec = chebyLPNsec;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
