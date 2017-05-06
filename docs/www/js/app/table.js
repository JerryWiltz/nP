// table.js

define(['app/lowpass'], function (lowpass){
"use strict";

var Test = (function(ROOT) {
	"use strict";
	var doTest = function () {
		showTable(ROOT.getTable());
	}	
	ROOT.testButtonElement().addEventListener("click",doTest);
}(lowpass));

function showTable(myArray) {
	"use strict";
	// get rid of the top stuff
	//var firstTable = document.getElementById("firstTable"); // Child
	//firstTable.parentNode.removeChild(firstTable);          // use the parentNode property

	// prepare to put the new table in a div
	var target = document.getElementById("body");
	var div = document.createElement("div");
	target.appendChild(div);
	
	function  createTable () {
		var row = 0;
		var col = 0;
		var html = "";
		
		function typeHtml(type) {
			if (typeof Complex != 'undefined') { // there are Complex ojbects	
				return (type instanceof Complex) ? type.r.toExponential(2) + // filter out Complex, express real part
				(type.i.toExponential(2)> 0  ?  " + i" + type.i.toExponential(2) : " - i" + (-type.i).toExponential(2)) : // express imaginary, "i" with no "+/-" after
				(typeof type==="number" ? type.toExponential(2) : (typeof type==="undefined" ? "UNDF" :type)); // filter out number
			} else { // there are no Complex ojbects
				return (typeof type==="number" ? type.toExponential(2) : (typeof type==="undefined" ? "UNDF" :type));
			}	
		}
					
		html = "<table><tbody>"; // fill in the table
			for (row = 0; row < myArray.length; row++) {
				html +="<tr>";
				for (col = 0; col < myArray[0].length; col++) {
				html += "<td style='border-style: solid; border-width: 1px' width='150px'>" + typeHtml(myArray[row][col]);
					html += "</td>";
				}
				html +="</tr>";
			}	
		html += "</tbody></table>"; // finish the table
		
		return html; // return the table
	}
	div.innerHTML = createTable(myArray);
};	

});