// lowPassDesign.js
define(['app/storage'], function (storage){
//define(['app/storage'], function (storage){
"use strict";
	return function lowPassDesign() {	
		"use strict";
		// Define the "click" function
		var doDesign = function doDesign () {
			var maxPassFreq = parseFloat(document.getElementById('maxPassFreq').value),
				minRejFreq = parseFloat(document.getElementById('minRejFreq').value),
				passbandRipple = parseFloat(document.getElementById('passbandRipple').value),
				rejLevel = parseFloat(document.getElementById('rejLevel').value),
				
				frequencyUnits = parseFloat(document.getElementById('frequencyUnits').value),
				
				lowPassTable = [], // Table generated

				row = 0, i = 0,// For the for-loops
		
				lcLumpedComponentTextout = ""; // The text variable for the innerHTML below
				
		 
			function normalizedBandwidth() { // Computes the w/w1 in MYJ on page 86 of MYJ
				return minRejFreq/maxPassFreq;
			};
		
			function numberSections() { // Formula 4.03-4 for n on page 86 of MYJ
				function epsilon() { return Math.pow(10,(passbandRipple/10))-1;} // Formula 4.03-5 on page 87 on MYJ
				function arcCosh(x) {return Math.log(x + Math.sqrt((x * x)-1));}
				return Math.ceil(arcCosh(Math.sqrt((Math.pow(10,(rejLevel/10))-1)/epsilon(passbandRipple)))/arcCosh(normalizedBandwidth(maxPassFreq, minRejFreq)));
			};
		
			(function gk() { // Returns gk's shown in formula 4.05-2 on page 99 of MYJ
				// The function, gk() Fills in the variable table above called lowPassTable to hold ak, bk, gk, and R,C,L values based on the numberSections()
				lowPassTable = Array(1 + 1 + numberSections() + 1);  // Corresponds with g0 + gk + g(k+1)

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
			   
				// Populate the last resistor in the cell
				lowPassTable[1 + numberSections()+1][3] = lowPassTable[1 + numberSections()+1][2] * 50;
				
			}()); // end of gk()
			
			// Fill in the bandwidth and number of sections
			document.getElementById('w').innerHTML = normalizedBandwidth().toFixed(2);
			document.getElementById('n').innerHTML = numberSections().toFixed(0);
	 
			// Fill in the parallel C and series L components
			for(row = 2; row < lowPassTable.length -1; row++) {
				// Adds line break between each component, note the use of &nbsp to put spaces in HTML
				lcLumpedComponentTextout += lowPassTable[row][3].toExponential(3) + ( (row % 2 === 0 )  ? "&nbsp&nbspFarad" : "&nbsp&nbspHenry") + "<br>";
				document.getElementById('filterComponents').innerHTML = lcLumpedComponentTextout;
			};
			storage.lowPassTable = lowPassTable; //store the lowPassTable so lowpassTest can use it
			//console.log('lowPassDesign complete');
		}; // end of doDesign()
		
	// Listening for the "Design" button click event ...
	document.getElementById('design').addEventListener('click', doDesign)
	}();

});

/*
ak	    bk	    gk	    R,C,L      Fc=1 GHz, Frej=1.5GHz, Ripple=0.1, Rej=30, n=3
UNDEF	UNDEF	1.00e+0	5.00e+1    resistor
5.00e-1	1.69e+0	1.03e+0	1.64e-11   par capacitor
1.00e+0	1.69e+0	1.15e+0	4.57e-8    series inductor
5.00e-1	9.40e-1	1.03e+0	1.64e-11   par capacitor
UNDEF	UNDEF	1.00e+0	5.00e+1    resistor

*/