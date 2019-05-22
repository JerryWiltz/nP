export	function  lineTable (lineTableInputObject = {}) {

	// here is the definition of the lineTableInputObject data structure:

	// lineTableInputObject.inputTable,	// an array of outs [out1, out2 ... outn]
	// lineTableInputObject.tableID,	        // a string of an div id
	// lineTableInputObject.metricPrefix,	// a string of a metric prefix such as 'giga'

	// there are default values for all the above.
	// just use nP.lineTable() and view the Insertion Loss, Return Loss

	// this function has one arguement, lineTableInputObject.
	// if no arguement, then an internal default version of the lineTableInputObject is used.
	// if no lineTableImputObject.tableID, then a div is created.

	// a sequencial tableID is generated at every lineChart call. if no canvasID provided, this one is used.

	var tableText = 'table' + (document.getElementsByTagName('div').length + 1).toString();

	var createDIV = function ( ) {
		var idAttr = document.createAttribute('id');
		var table = document.createElement('div');
		var tableBody = document.getElementsByTagName("body")[0];

		idAttr.value = tableText; // the div
		table.setAttributeNode(idAttr);
		if(!lineTableInputObject.tableID){tableBody.appendChild(table)};
	}();

	var inputTable = lineTableInputObject.inputTable || [ 
		[
			['Freq', 'Insertion Loss', 'Return Loss'],
			[ 8 * 1e9,  22,  40],
			[12 * 1e9,  80,  90],
			[16 * 1e9, 100, 105],
			[20 * 1e9, 120, 130]
		],

		[
			['Freq', 'Noise Figure', 'IP3'],
			[12 * 1e9,  60, 65],
			[16 * 1e9,  65, 70],
			[20 * 1e9,  70, 75]
		]
	];

	// lineTable mutates inputTable. if same inputTable is reused by another lineTable, output is distorted.
	// so we create a duplicate version of the inputTable and leave the original version pristine
	var inputTableDuplicated = JSON.parse(JSON.stringify(inputTable));

	var metricPrefix = lineTableInputObject.metricPrefix || 'giga';
	var tableID = lineTableInputObject.tableID || tableText;

	var pickScale = function (metricPrefix){
		var out = 0;
		if (metricPrefix === 'tera') {out = 1e12;};
		if (metricPrefix === 'giga') {out = 1e9;};
		if (metricPrefix === 'mega') {out = 1e6;};
		if (metricPrefix === 'kilo') {out = 1e3;};
		if (metricPrefix === 'one') {out = 1;};
		if (metricPrefix === 'deci') {out = 1e-1;};
		if (metricPrefix === 'centi') {out = 1e-2;};
		if (metricPrefix === 'milli') {out = 1e-3;};
		if (metricPrefix === 'micro') {out = 1e-6;};
		if (metricPrefix === 'nano') {out = 1e-9;};
		if (metricPrefix === 'pico') {out = 1e-12;};
		return out;
	};

	var pickUnits = function (metricPrefix){
		var out = 0;
		if (metricPrefix === 'tera') {out = 'THz';};
		if (metricPrefix === 'giga') {out = 'GHz';};
		if (metricPrefix === 'mega') {out = 'MHz';};
		if (metricPrefix === 'kilo') {out = 'KHz';};
		if (metricPrefix === 'one') {out = 'Hz';};
		if (metricPrefix === 'deci') {out = 'DeciHz';};
		if (metricPrefix === 'centi') {out = 'CentiHz';};
		if (metricPrefix === 'milli') {out = 'MilliHz';};
		if (metricPrefix === 'micro') {out = 'MicroHz';};
		if (metricPrefix === 'nano') {out = 'nanoHz';};
		if (metricPrefix === 'pico') {out = 'PicoHz';};
		return out;
	};

	// frequency number in column 0 is scaled by the metric prefix
	var scaleFreq = function scaleFreq (array) {
		var row = 0;
		array[0][0] = array[0][0] + ', ' + pickUnits(metricPrefix); 
		for (row = 1; row< array.length; row ++) {
			array[row][0] = array[row][0]/pickScale(metricPrefix);
		};

	};

	// inputTableDuplicated is mutated in this forEach !!! scale all the frequencies in all the tables
	inputTableDuplicated.forEach(function (element) {
		scaleFreq(element);
	});


	// showTable
	function showTable(myArray) {	

		var target = document.getElementById(tableID),
			div = document.createElement("div");

		target.appendChild(div);

		function createTable () {
			var row = 0, col = 0, html = "";

			html = "<table><tbody>"; // fill in the table
			for (row = 0; row < myArray.length; row++) {
				html +="<tr>";
				for (col = 0; col < myArray[0].length; col++) {
					html += "<td style='border-style: solid; border-width: 1px' width='150px'>" + myArray[row][col];
					html += "</td>";
				};
				html +="</tr>";
			};	
			html += "</tbody></table>"; // finish the table

			return html; // return the table

		}
		div.innerHTML = createTable();

	};

	// calls showTable for each individual table
	inputTableDuplicated.forEach(function (element) {
		showTable(element);
	});
};
