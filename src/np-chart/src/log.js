import {complex} from '../../np-math/src/complex';

function CplxToCell(complexNumber) {
	return complexNumber.x.toPrecision(4) + (complexNumber.y.toPrecision(4) >= 0 ? " +j" + complexNumber.y.toPrecision(4) : " -j" + (-complexNumber.y).toPrecision(4));
};

function createArray(myArray) {
	var row = 0, element = '', html = '';

	html = "<table><tbody>"; // fill in the table with one column only
	for (row = 0; row < myArray.length; row++) {
		if ( typeof myArray[row] === 'string') {
			element = myArray[row];
		} else if ( typeof myArray[row] === 'number') {
			element = myArray[row].toPrecision(4);
		} else if ( myArray[row].constructor.name === 'Complex') {
			element = CplxToCell(myArray[row]);
		} else {
			element = '** ** **';
		};		
		html +="<tr>";
		html += "<td style='text-align: center; border-style: solid; border-width: 1px' width='140px'>" + element;
		html += "</td>";
		html +="</tr>";
	};	
	html += "</tbody></table>"; // finish the one column table
	return html; // return the one column table
}

function createTable (myMatrix) {
	var row = 0, col = 0, html = "";

	html = "<table><tbody>"; // fill in the table
	for (row = 0; row < myMatrix.length; row++) {
		html +="<tr>";
		for (col = 0; col < myMatrix[0].length; col++) {
			html += "<td style='text-align: center; border-style: solid; border-width: 1px' width='140px'>" + myMatrix[row][col].toPrecision(4);
			html += "</td>";
		};
		html +="</tr>";
	};	
	html += "</tbody></table>"; // finish the table

	return html; // return the table
}



function createCplxTable (myMatrix) {
	var row = 0, col = 0, html = "";

	html = "<table><tbody>"; // fill in the table
	for (row = 0; row < myMatrix.length; row++) {
		html +="<tr>";
		for (col = 0; col < myMatrix[0].length; col++) {
			html += "<td style='text-align: center; border-style: solid; border-width: 1px' width='140px'>" + CplxToCell(myMatrix[row][col]);
			html += "</td>";
		};
		html +="</tr>";
	};	
	html += "</tbody></table>"; // finish the table

	return html; // return the table
}

function lineTable(out) {
	var row = 0, col = 0, element = '', html = '';

	html = "<table><tbody>"; // fill in the table with one column only
	for (row = 0; row < out.length; row++) {
		html +="<tr>";
		for (col = 0; col < out[0].length; col++) {
			if ( typeof out[row][col] === 'string') {
				element = out[row][col];
			} else if ( typeof out[row][col] === 'number') {
				element = out[row][col].toPrecision(4);
			} else if ( out[row][col].constructor.name === 'Complex') {
				element = CplxToCell(out[row][col]);
			} else {
				element = '** ** **';
			};		
			html += "<td style='text-align: center; border-style: solid; border-width: 1px' width='140px'>" + element;
			html += "</td>";
		}
		html +="</tr>";
	};	
	html += "</tbody></table>"; // finish the one column table
	return html; // return the one column table
}

export function log(input) {
	var pre = document.createElement('pre');
	var output = '';
	var classAttr = document.createAttribute('class');

	// added this for webpage
	var outputBox = document.getElementsByClassName('outputBox')[0];

	classAttr.value = 'outputSection remove'; // added another class name for elements to be removed
	pre.setAttributeNode(classAttr);
	if ( typeof input === 'string'){
		output = input;
	} else if ( typeof input === 'number'){
		output = input.toPrecision(4);
	} else if ( typeof input === 'boolean' ){
		output = input;
	} else if ( input instanceof Array && input.m === undefined && !(input[0] instanceof Array) ) { // linear array
		output = createArray(input);
	} else if (input instanceof Array && input[0] instanceof Array) { // lineTable
		output = lineTable(input);
	} else if ( input.constructor.name === 'Complex') {
		var real = '', imaginary = '';
		real = input.getR().toPrecision(4);
		imaginary = input.getI() >= 0 ? 'j' + input.getI().toPrecision(4) : '-j' + (Math.abs(input.getI())).toPrecision(4);
		output = real + ', ' + imaginary;
	} else if ( typeof input === 'object' && input.m.constructor.name === 'Array' && !(input.m[0][0].constructor.name === 'Complex')) { // matrix of real numbers 
		output = createTable(input.m);
	} else if ( typeof input === 'object' && input.m.constructor.name === 'Array' && input.m[0][0].constructor.name === 'Complex') { // matrix of Complex numbers
		output = createCplxTable(input.m);
	} else {
		output = "nP.log can't read this input";
	};	
	pre.innerHTML = output;
	outputBox === undefined ? document.body.appendChild(pre) : outputBox.appendChild(pre);
}
