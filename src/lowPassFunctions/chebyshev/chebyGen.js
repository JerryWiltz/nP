export default function chebyGen (n = 3, ripple = 0.1) { // Returns gk's shown in formula 4.05-2 on page 99 of MYJ
	var = 	numberSections = n,
			passbandRipple = ripple,
			lowPassTable = Array(1 + 1 + numberSections() + 1);  // Corresponds with g0 + gk + g(k+1)

			
		// The function, gk() Fills in the variable table above called lowPassTable to hold ak, bk, gk, and R,C,L values based on the numberSections()
		for(i = 0; i < lowPassTable.length; i++) {
		lowPassTable[i] = Array(4); // Each row has 4 columns: ak, bk, gk, and R,C,L's
		};
		
		lowPassTable[0][0] = 'ak'; lowPassTable[0][1] = 'bk'; lowPassTable[0][2] = 'gk'; lowPassTable[0][3] = 'R,C,L';

		function coth(x) {return (Math.exp(x) + Math.exp(-x))/(Math.exp(x) - Math.exp(-x));};	
		function B() {return Math.log(coth(passbandRipple/17.37));}; // B(x) on page 99 of MYJ
		function sinh(x) {return (Math.exp(x) - Math.exp(-x))/2;};
		function G() {return sinh(B()/(2 * numberSections()));} // Compute G() on page 99 of MYJ
  
		// Initialize the lowPassFilter array
		lowPassTable[1][2] = 1; // for g0=1;
  
		// Populate the ak column on page 99 of MYJ
		for(row = 2; row < lowPassTable.length -1; row++) {
			lowPassTable[row][0] = Math.sin(((2*(row -1) -1) * Math.PI)/(2 * numberSections()));    
		};
  
		// Populate the bk column on page 99 of MYJ
		for(row = 2; row < lowPassTable.length -1; row++) {
			lowPassTable[row][1] = Math.pow(G(),2) + Math.pow(Math.sin(  (row-1) * Math.PI/numberSections()),2);    
		};
  
		// Populate the first q1 in the cell
		lowPassTable[2][2] = 2*lowPassTable[2][0]/G();
  
		// Populate the gk column from g2 onward to gk
		for(row = 3; row < lowPassTable.length -1; row++) {
			lowPassTable[row][2] = (4 * lowPassTable[row-1][0] * lowPassTable[row][0])/(lowPassTable[row-1][1] * lowPassTable[row-1][2]);    
		};
  
		// Populate the last g(k+1) in the cell
		lowPassTable[1 + numberSections()+1][2] = (numberSections() % 2 === 0 ) ? Math.pow(coth(B()/4),2) : 1 ;
  
		// Populate the first resistor in the cell
		lowPassTable[1][3] = lowPassTable[1][2] * 50;

		// Populate the C's and L's in the last column Row (if row number is odd, compute C, if even, compute L) 
		for(row = 2; row < lowPassTable.length -1; row++) {
			lowPassTable[row][3] = ( (row-1) % 2 === 0 ) ? lowPassTable[row][2] * 50 * (1/(2*Math.PI)) * (1/(maxPassFreq * frequencyUnits)) : lowPassTable[row][2] * 1/50 * (1/(2*Math.PI)) * (1/(maxPassFreq * frequencyUnits));
		};
		
		return lowPassTable;
	};				
