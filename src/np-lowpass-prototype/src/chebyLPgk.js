// Generates an array of chebyshev values based on number of section and ripple
export function chebyLPgk (n = 3, ripple = 0.1) { // Returns gk's shown in formula 4.05-2 on page 99 of MYJ
	var	chebyLPgkin = new Array(1 + 1 + n + 1),  // Table title row, go row, gk's (n rows), and g(k+1)
		chebyLPgkout = [],
		i = 0, row = 0;
			
	// The function, gk() Fills in the variable table above called "chebyLPgkin" to hold ak, bk, and gk's based on the n
	for(i = 0; i < chebyLPgkin.length; i++) {chebyLPgkin[i] = new Array(4); }; // Each row has 4 columns: ak, bk, gk, and R,C,L's};
	
	// Table for complete display of values
	chebyLPgkin[0][0] = 'ak'; chebyLPgkin[0][1] = 'bk'; chebyLPgkin[0][2] = 'gk'; chebyLPgkin[0][3] = 'R,C,L';

	function coth(x) {return (Math.exp(x) + Math.exp(-x))/(Math.exp(x) - Math.exp(-x));};	
	function B() {return Math.log(coth(ripple/17.37));}; // B(x) on page 99 of MYJ
	function sinh(x) {return (Math.exp(x) - Math.exp(-x))/2;};
	function G() {return sinh(B()/(2 * n));} // Compute G() on page 99 of MYJ
	
	chebyLPgkin[1][2] = 1; // Initialize the lowPassFilter array for g0=1;
	
	for(row = 2; row < chebyLPgkin.length -1; row++) { chebyLPgkin[row][0] = Math.sin(((2*(row -1) -1) * Math.PI)/(2 * n)); };
	
	for(row = 2; row < chebyLPgkin.length -1; row++) { // Populate the bk column on page 99 of MYJ
		chebyLPgkin[row][1] = Math.pow(G(),2) + Math.pow(Math.sin(  (row-1) * Math.PI/n),2);    
	};
	
	chebyLPgkin[2][2] = 2*chebyLPgkin[2][0]/G(); // Populate the first q1 in the cell
	
	for(row = 3; row < chebyLPgkin.length -1; row++) { // Populate the gk column from g2 onward to gk
		chebyLPgkin[row][2] = (4 * chebyLPgkin[row-1][0] * chebyLPgkin[row][0])/(chebyLPgkin[row-1][1] * chebyLPgkin[row-1][2]);    
	};
	
	chebyLPgkin[ n+2][2] = (n % 2 === 0 ) ? Math.pow(coth(B()/4),2) : 1 ; // Populate the last g(k+1) in the cell
	
	// Populate chebyLPgkout
	for(row = 1; row < chebyLPgkin.length; row++) { chebyLPgkout[row - 1] = chebyLPgkin[row][2] };
	
	return chebyLPgkout;
};
