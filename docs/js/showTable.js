// showTable.js

function showTable(myArray) {	
	"use strict";
	// get rid of the top stuff
	// var firstTable = document.getElementById("firstTable"); // Child
	// firstTable.parentNode.removeChild(firstTable);          // use the parentNode property

	// prepare to put the new table in a div
	var target = document.getElementById("body");
	var div = document.createElement("div");
	target.appendChild(div);
	
	var testArray = myArray; // for non table arrays ...
	if (typeof myArray === 'number') { testArray = [[myArray]];} // works
	else if (typeof myArray === 'string') { testArray = [[myArray]];} //works
	else if ( JSON.stringify(myArray).includes('[' , ']') && !JSON.stringify(myArray).includes('[[')  ) { testArray = [myArray];} // works
	
	function createTable () {
		var row = 0;
		var col = 0;
		var html = "";
		//alert('this is the showTable');
		
		function typeHtml(type) { // using an object that returns functions rather than case-switch construct
			var out = {
				'undefined' : function () { return 'UNDEF';}, // empty array cells
				'boolean' : function () { return type;},
				'number' :  function () { return type.toExponential(2);}, // numbers
				'object' : 	function () { return type.x.toExponential(2) + (type.y.toExponential(2)> 0  ?  " + i" + type.y.toExponential(2) : " - i" + (-type.y).toExponential(2)) ;}, // complex numbers
				'string' :  function () { return type;} // strings
			};
			return out[typeof type](); // immediate invocation of returned functions
		}
					
		html = "<table><tbody>"; // fill in the table
			for (row = 0; row < testArray.length; row++) {
				html +="<tr>";
				for (col = 0; col < testArray[0].length; col++) {
				html += "<td style='border-style: solid; border-width: 1px' width='150px'>" + typeHtml(testArray[row][col]);
					html += "</td>";
				}
				html +="</tr>";
			}	
		html += "</tbody></table>"; // finish the table
		
		return html; // return the table
		
	}
	div.innerHTML = createTable();
	

}
