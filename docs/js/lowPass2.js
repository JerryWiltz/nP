// This is a script to compute the low pass chebyshev filter prototype
// It is taken from Matthaei, Young, and Jones (MYJ)
// By Jerry Wiltz July 21, 2106 

// Outer function to compute the low pass chebyshev filter prototype
// From book, Matthaei, Young, and Jones (MYJ)
var lowPass = function lowPass() {
	// Private
	var maxPassFreq = function() {return parseFloat((document.getElementById("maxPassFreq")).value);}
	var minRejFreq = function() {return parseFloat((document.getElementById("minRejFreq")).value);}
	var passbandRipple = function() {return parseFloat((document.getElementById("passbandRipple")).value);}
	var rejLevel = function() {return parseFloat((document.getElementById("rejLevel")).value);}

	var Table;
	
	var lcLumpedComponentTextout = ""; // The text variable for the innerHTML below
     
    function normalizedBandwidth() { // Computes the w/w1 in MYJ on page 86 of MYJ
		return minRejFreq/maxPassFreq;
    }
    
    function numberSections() { // Formula 4.03-4 for n on page 86 of MYJ
		function epsilon() { return Math.pow(10,(passbandRipple/10))-1;} // Formula 4.03-5 on page 87 on MYJ
		function arcCosh(x) {return Math.log(x + Math.sqrt((x * x)-1));}
        return Math.ceil(arcCosh(Math.sqrt((Math.pow(10,(rejLevel/10))-1)/epsilon(passbandRipple)))/arcCosh(normalizedBandwidth(maxPassFreq, minRejFreq)));
    }
	
    //Fill in the output fields
	var foo = function () {return w.innerHTML = normalizedBandwidth().toFixed(2);}
    var bar = function () {return n.innerHTML = numberSections().toFixed(0);}
	
	// Save to the local browser
	save(maxPassFreq, minRejFreq, passbandRipple, rejLevel);	
    
    function gk() { // Returns gk's shown in formula 4.05-2 on page 99 of MYJ
		// Create table "lowPassTable" to hold ak, bk, and gk based on numberSections()
		var lowPassTable = new Array(1 + numberSections() + 1);  // corresponds with g0 + gk + g(k+1)
		for(var i = 0; i < lowPassTable.length; i++)
			lowPassTable[i] = new Array(4); // Each row has 4 columns:ak, bk, gk, and R,C,L's

		function coth(x) {return (Math.exp(x) + Math.exp(-x))/(Math.exp(x) - Math.exp(-x));}	
		function B() {return Math.log(coth(passbandRipple/17.37));} // B(x) on page 99 of MYJ
		function sinh(x) {return (Math.exp(x) - Math.exp(-x))/2;}
		function G() {return sinh(B()/(2 * numberSections()));} // Compute G() on page 99 of MYJ
      
		// Initialize the lowPassFilter array
		lowPassTable[0][2] = 1; //lowPassTable[0][2] for g0=1;
      
		// Populate the ak column
		for(var row = 1; row < lowPassTable.length -1; row++) {
			lowPassTable[row][0] = Math.sin(((2 * row - 1) * Math.PI)/(2 * numberSections()) );    
		}
      
		// Populate the bk column
		for(var row = 1; row < lowPassTable.length -1; row++) {
			lowPassTable[row][1] = Math.pow(G(),2) + Math.pow(Math.sin(row * Math.PI/numberSections()),2);    
		}
      
		// populate the first q1 in the cell
		lowPassTable[1][2] = 2*lowPassTable[1][0]/G();
      
		// Populate the gk column from g2 onward to gk
		for(var row = 2; row < lowPassTable.length -1; row++) {
			lowPassTable[row][2] = (4 * lowPassTable[row-1][0] * lowPassTable[row][0])/(lowPassTable[row-1][1] * lowPassTable[row-1][2]);    
		}
      
		// Populate the last g(k+1) in the cell
		lowPassTable[numberSections()+1][2] = (numberSections() % 2 === 0 ) ? Math.pow(coth(B()/4),2) : 1 ;
      
		// Populate the first resistor in the cell
		lowPassTable[0][3] = lowPassTable[0][2] * 50;

		// Populate the C's and L's in the last column Row (if row number is odd, compute C, if even, compute L) 
		for(var row = 1; row < lowPassTable.length -1; row++) {
			lowPassTable[row][3] = (row % 2 === 0 ) ? lowPassTable[row][2] * 50 * (1/(2*Math.PI)) * 1e-9 : lowPassTable[row][2] * 1/50 * (1/(2*Math.PI)) * 1e-9;    
		}      
           
		// Populate the last resistor in the cell
		lowPassTable[numberSections()+1][3] = lowPassTable[numberSections()+1][2] * 50;      

		return lowPassTable;
    }

    Table = gk();
  
    // Print a subset of the Table that is a list values of parallel C and series L components
    for(var row = 1; row < Table.length -1; row++) {
		lcLumpedComponentTextout += Table[row][3].toString() + "<br>"; // Adds line break between each component
		filterElements.innerHTML = lcLumpedComponentTextout;
	}
	
	// Add/Save Fmin, Fmax, Fstep
	// Create Nport for the elements
	// Call hookup	
	// Call gaussian
	// Print out Freq, S21, S11
	// Plot out Freq, S21, S11
	
	
	// Public returned object
	return {
	// Inputs
	maxPassFreq : maxPassFreq,
	minRejFreq : minRejFreq,
	passbandRipple : passbandRipple,
	rejLevel : rejLevel,
	// Outputs
	w.innerHTML : w.innerHTML,
    n.innerHTML : n.innerHTML
	}
;	
}();

lowPass.maxPassFreq;
lowPass.minRejFreq;
lowPass.passbandRipple;
lowPass.rejLevel;
lowPass.w.innerHTML;
lowPass.n.innerHTML;  

// Automatically attempt to save the input fields when the document loads for the next time
function save(maxPassFreq, minRejFreq, passbandRipple, rejLevel) {
  if(window.localStorage) {
    localStorage.maxPassFreq = maxPassFreq;
    localStorage.minRejFreq = minRejFreq;
    localStorage.passbandRipple = passbandRipple;
    localStorage.rejLevel = rejLevel;
  }
}

// Automatically attempt to restore the input fields when the document first loads
window.onload = function () {
  if(window.localStorage && localStorage.maxPassFreq) {
  document.getElementById("maxPassFreq").value = localStorage.maxPassFreq;
  document.getElementById("minRejFreq").value = localStorage.minRejFreq;
  document.getElementById("passbandRipple").value = localStorage.passbandRipple;
  document.getElementById("rejLevel").value = localStorage.rejLevel;
  }
}