// This is a script to compute the low pass chebyshev filter prototype
// It is taken from Matthaei, Young, and Jones (MYJ)
// By Jerry Wiltz July 21, 2016 

// Outer function to compute the low pass chebyshev filter prototype
// From book, Matthaei, Young, and Jones (MYJ)
			   
var LowPass = (function LowPass() {
	"use strict";
	// Private variables and functions
	// Define Element Objects
	var maxPassFreqElement = function () {return document.getElementById("maxPassFreq");}
	var minRejFreqElement = function () {return document.getElementById("minRejFreq");}
	var passbandRippleElement = function () {return document.getElementById("passbandRipple");}
	var rejLevelElement = function () {return document.getElementById("rejLevel");}	
	var designButtonElement = function () {return document.getElementById("design");}	
	var wElement = function () { return document.getElementById("w");}
	var nElement = function () {return document.getElementById("n");}
	var filterComponentsElemement = function () {return document.getElementById("filterComponents");}
	var testButtonElement = function () {return document.getElementById("test");}
	
	
	// Define Table Variable
	var Table =["jerry"];
	function getTable() {return Table;}	// This is the analysis input table
	function setTable(inputTable) {Table = inputTable;}	// This is the analysis input table	
		
	return {
	maxPassFreqElement : maxPassFreqElement,
	minRejFreqElement : minRejFreqElement,
	passbandRippleElement : passbandRippleElement,
	rejLevelElement : rejLevelElement,	
	designButtonElement : designButtonElement,	
	wElement : wElement,
	nElement : nElement,
	filterComponentsElemement : filterComponentsElemement,
	testButtonElement : testButtonElement,
	
	getTable : getTable,
	setTable : setTable
	}
}());

(function ChevDesign(ROOT) {	
	"use strict";
	// Define the "click" function
	function  doDesign () {
		var maxPassFreq = parseFloat(ROOT.maxPassFreqElement().value);
		var minRejFreq = parseFloat(ROOT.minRejFreqElement().value);
		var passbandRipple = parseFloat(ROOT.passbandRippleElement().value);
		var rejLevel = parseFloat(ROOT.rejLevelElement().value);

		var Table = [];
		
		var row = 0; // For the for-loops
	
		var lcLumpedComponentTextout = ""; // The text variable for the innerHTML below
     
		function normalizedBandwidth() { // Computes the w/w1 in MYJ on page 86 of MYJ
			return minRejFreq/maxPassFreq;
		}
    
		function numberSections() { // Formula 4.03-4 for n on page 86 of MYJ
			function epsilon() { return Math.pow(10,(passbandRipple/10))-1;} // Formula 4.03-5 on page 87 on MYJ
			function arcCosh(x) {return Math.log(x + Math.sqrt((x * x)-1));}
			return Math.ceil(arcCosh(Math.sqrt((Math.pow(10,(rejLevel/10))-1)/epsilon(passbandRipple)))/arcCosh(normalizedBandwidth(maxPassFreq, minRejFreq)));
		}
    
		function gk() { // Returns gk's shown in formula 4.05-2 on page 99 of MYJ
			// Create table "lowPassTable" to hold ak, bk, and gk based on numberSections()
			var i = 0;
			
			var lowPassTable = Array(1 + numberSections() + 1);  // corresponds with g0 + gk + g(k+1)
				for(i = 0; i < lowPassTable.length; i++) {
				lowPassTable[i] = new Array(4); // Each row has 4 columns:ak, bk, gk, and R,C,L's
				}

			function coth(x) {return (Math.exp(x) + Math.exp(-x))/(Math.exp(x) - Math.exp(-x));}	
			function B() {return Math.log(coth(passbandRipple/17.37));} // B(x) on page 99 of MYJ
			function sinh(x) {return (Math.exp(x) - Math.exp(-x))/2;}
			function G() {return sinh(B()/(2 * numberSections()));} // Compute G() on page 99 of MYJ
      
			// Initialize the lowPassFilter array
			lowPassTable[0][2] = 1; //lowPassTable[0][2] for g0=1;
      
			// Populate the ak column
			for(row = 1; row < lowPassTable.length -1; row++) {
				lowPassTable[row][0] = Math.sin(((2 * row - 1) * Math.PI)/(2 * numberSections()) );    
			}
      
			// Populate the bk column
			for(row = 1; row < lowPassTable.length -1; row++) {
				lowPassTable[row][1] = Math.pow(G(),2) + Math.pow(Math.sin(row * Math.PI/numberSections()),2);    
			}
      
			// populate the first q1 in the cell
			lowPassTable[1][2] = 2*lowPassTable[1][0]/G();
      
			// Populate the gk column from g2 onward to gk
			for(row = 2; row < lowPassTable.length -1; row++) {
				lowPassTable[row][2] = (4 * lowPassTable[row-1][0] * lowPassTable[row][0])/(lowPassTable[row-1][1] * lowPassTable[row-1][2]);    
			}
      
			// Populate the last g(k+1) in the cell
			lowPassTable[numberSections()+1][2] = (numberSections() % 2 === 0 ) ? Math.pow(coth(B()/4),2) : 1 ;
      
			// Populate the first resistor in the cell
			lowPassTable[0][3] = lowPassTable[0][2] * 50;

			// Populate the C's and L's in the last column Row (if row number is odd, compute C, if even, compute L) 
			for(row = 1; row < lowPassTable.length -1; row++) {
				lowPassTable[row][3] = (row % 2 === 0 ) ? lowPassTable[row][2] * 50 * (1/(2*Math.PI)) * 1e-9 : lowPassTable[row][2] * 1/50 * (1/(2*Math.PI)) * 1e-9;    
			}      
           
			// Populate the last resistor in the cell
			lowPassTable[numberSections()+1][3] = lowPassTable[numberSections()+1][2] * 50;      

			return lowPassTable;
		} // end of gk()

		Table = gk();	
		
		//Fill in the output fields
		ROOT.wElement().innerHTML = normalizedBandwidth().toFixed(2);
		ROOT.nElement().innerHTML = numberSections().toFixed(0);
 
		// Print a subset of the Table that is a list values of parallel C and series L components
		for(row = 1; row < Table.length -1; row++) {
			lcLumpedComponentTextout += Table[row][3].toString() + "<br>"; // Adds line break between each component
			ROOT.filterComponentsElemement().innerHTML = lcLumpedComponentTextout;
		}

		ROOT.setTable(Table);
		//showTable( getTable());
	} // end of doDesign()
	
	// Listening for the "Design" button click event ...
	ROOT.designButtonElement().addEventListener("click", doDesign);
	
}(LowPass));

var Test = (function(ROOT) {
	"use strict";
	var doTest = function () {
		showTable(ROOT.getTable());
	}	
	ROOT.testButtonElement().addEventListener("click",doTest);
}(LowPass));

function showTable(myArray) {
	"use strict";
	// get rid of the top stuff
	//var firstTable = document.getElementById("firstTable"); // Child
	//firstTable.parentNode.removeChild(firstTable);          // use the parentNode property

	// prepare to put the new table in
	var target = document.getElementById("body");
	var div = document.createElement("div");
	target.appendChild(div);
	
	function  createTable () {
		var row = 0;
		var col = 0;
		var html = "";
		
		function typeHtml(type) {
			if (typeof Complex != 'undefined') {	
				return (type instanceof Complex) ? type.r.toExponential(2) + // filter out complex, express real part
				(type.i.toExponential(2)> 0  ?  " + i" + type.i.toExponential(2) : " - i" + (-type.i).toExponential(2)) : // express imaginary, "i" with no "+/-" after
				(typeof type==="number" ? type.toExponential(2) : (typeof type==="undefined" ? "UNDF" :type)); // filter out number
			} else {
				return (typeof type==="number" ? type.toExponential(2) : (typeof type==="undefined" ? "UNDF" :type));
			}	
		}
					
		html = "<table><tbody>";
			for (row = 0; row < myArray.length; row++) {
				html +="<tr>";
				for (col = 0; col < myArray[0].length; col++) {
				html += "<td style='border-style: solid; border-width: 1px' width='150px'>" + typeHtml(myArray[row][col]);
					html += "</td>";
				}
				html +="</tr>";
			}	
		html += "</tbody></table>";
		return html;
	}
	div.innerHTML = createTable(myArray);
};


