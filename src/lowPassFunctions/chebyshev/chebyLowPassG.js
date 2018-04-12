// Generates an array of chebyshev values based on number of section and ripple
export default function chebyLowPassG (n = 3, ripple = 0.1) { // Returns gk's shown in formula 4.05-2 on page 99 of MYJ
	var	chebyLowPassGin = new Array(1 + 1 + n + 1),  // Table title row, go row, gk's (n rows), and g(k+1)
		chebyLowPassGout = [],
		i = 0, row = 0;
			
	// The function, gk() Fills in the variable table above called "chebyLowPassGin" to hold ak, bk, and gk's based on the n
	for(i = 0; i < chebyLowPassGin.length; i++) {chebyLowPassGin[i] = new Array(4); }; // Each row has 4 columns: ak, bk, gk, and R,C,L's};
	
	// Table for complete display of values
	chebyLowPassGin[0][0] = 'ak'; chebyLowPassGin[0][1] = 'bk'; chebyLowPassGin[0][2] = 'gk'; chebyLowPassGin[0][3] = 'R,C,L';

	function coth(x) {return (Math.exp(x) + Math.exp(-x))/(Math.exp(x) - Math.exp(-x));};	
	function B() {return Math.log(coth(ripple/17.37));}; // B(x) on page 99 of MYJ
	function sinh(x) {return (Math.exp(x) - Math.exp(-x))/2;};
	function G() {return sinh(B()/(2 * n));} // Compute G() on page 99 of MYJ
	
	chebyLowPassGin[1][2] = 1; // Initialize the lowPassFilter array for g0=1;
	
	for(row = 2; row < chebyLowPassGin.length -1; row++) { chebyLowPassGin[row][0] = Math.sin(((2*(row -1) -1) * Math.PI)/(2 * n)); };
	
	for(row = 2; row < chebyLowPassGin.length -1; row++) { // Populate the bk column on page 99 of MYJ
		chebyLowPassGin[row][1] = Math.pow(G(),2) + Math.pow(Math.sin(  (row-1) * Math.PI/n),2);    
	};
	
	chebyLowPassGin[2][2] = 2*chebyLowPassGin[2][0]/G(); // Populate the first q1 in the cell
	
	for(row = 3; row < chebyLowPassGin.length -1; row++) { // Populate the gk column from g2 onward to gk
		chebyLowPassGin[row][2] = (4 * chebyLowPassGin[row-1][0] * chebyLowPassGin[row][0])/(chebyLowPassGin[row-1][1] * chebyLowPassGin[row-1][2]);    
	};
	
	chebyLowPassGin[ n+2][2] = (n % 2 === 0 ) ? Math.pow(coth(B()/4),2) : 1 ; // Populate the last g(k+1) in the cell
	
	// Populate chebyLowPassGout
	for(row = 1; row < chebyLowPassGin.length; row++) { chebyLowPassGout[row - 1] = chebyLowPassGin[row][2] };
	
	return chebyLowPassGout;
};