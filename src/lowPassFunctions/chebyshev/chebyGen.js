// Generates an array of chebyshev values based on number of section and ripple
export default function chebyGen (n = 3, ripple = 0.1) { // Returns gk's shown in formula 4.05-2 on page 99 of MYJ
	var	numberSections = n,
		passbandRipple = ripple,
		lowPassTable = Array(  2 + numberSections + 1),  // Corresponds with g0 + gk + g(k+1)
		outputArray = [];
	
	var	i = 0, row = 0;
			
		// The function, gk() Fills in the variable table above called lowPassTable to hold ak, bk, gk, and R,C,L values based on the numberSections
		for(i = 0; i < lowPassTable.length; i++) {
		lowPassTable[i] = Array(4); // Each row has 4 columns: ak, bk, gk, and R,C,L's
		};
		
		// Table for complete display of values
		lowPassTable[0][0] = 'ak'; lowPassTable[0][1] = 'bk'; lowPassTable[0][2] = 'gk'; lowPassTable[0][3] = 'R,C,L';

		function coth(x) {return (Math.exp(x) + Math.exp(-x))/(Math.exp(x) - Math.exp(-x));};	
		function B() {return Math.log(coth(passbandRipple/17.37));}; // B(x) on page 99 of MYJ
		function sinh(x) {return (Math.exp(x) - Math.exp(-x))/2;};
		function G() {return sinh(B()/(2 * numberSections));} // Compute G() on page 99 of MYJ
  
		// Initialize the lowPassFilter array
		lowPassTable[1][2] = 1; // for g0=1;
  
		// Populate the ak column on page 99 of MYJ
		for(row = 2; row < lowPassTable.length -1; row++) {
			lowPassTable[row][0] = Math.sin(((2*(row -1) -1) * Math.PI)/(2 * numberSections));    
		};
  
		// Populate the bk column on page 99 of MYJ
		for(row = 2; row < lowPassTable.length -1; row++) {
			lowPassTable[row][1] = Math.pow(G(),2) + Math.pow(Math.sin(  (row-1) * Math.PI/numberSections),2);    
		};
  
		// Populate the first q1 in the cell
		lowPassTable[2][2] = 2*lowPassTable[2][0]/G();
  
		// Populate the gk column from g2 onward to gk
		for(row = 3; row < lowPassTable.length -1; row++) {
			lowPassTable[row][2] = (4 * lowPassTable[row-1][0] * lowPassTable[row][0])/(lowPassTable[row-1][1] * lowPassTable[row-1][2]);    
		};
  
		// Populate the last g(k+1) in the cell
		lowPassTable[ numberSections+2][2] = (numberSections % 2 === 0 ) ? Math.pow(coth(B()/4),2) : 1 ;
		
		// Populate outputArray
		for(row = 1; row < lowPassTable.length; row++) {
			outputArray[row - 1] = lowPassTable[row][2]   
		};
		
		return outputArray;
	};				
	/*
	ak	    bk	    gk	    R,C,L      Fc= 0.2 GHz, Frej=1.5GHz, Ripple=0.1, Rej=30, n=3
	UNDEF	UNDEF	1.00e+0	5.00e+1    resistor
	5.00e-1	1.69e+0	1.03e+0	1.64e-11   par capacitor
	1.00e+0	1.69e+0	1.15e+0	4.57e-8    series inductor
	5.00e-1	9.40e-1	1.03e+0	1.64e-11   par capacitor
	UNDEF	UNDEF	1.00e+0	5.00e+1    resistor
	*/