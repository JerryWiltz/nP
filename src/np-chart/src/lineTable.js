import * as d3 from 'd3'
export	function  lineTable (lineTableInputObject = {}) {

	// here is the definition of the lineTableInputObject data structure:

	// lineTableInputObject.inputTable,	// an array of outs [out1, out2 ... outn]; default is internal inputTable
	// lineTableInputObject.tableID,	// a string of an svg id 'table'; default is 'table1'
	// lineTableInputObject.metricPrefix,	// a string of a metric prefix such as 'giga'; default is 'giga'
	// lineTableInputObject.tableTitle,		// a string of the chart tableTitle; default is blank
	// lineTableInputObject.headColor,	// a string with either 'color' or 'gray', if not specified, default is 'color'
	// lineTableInputObject.tableWH,	// a string with either 'no' or 'yes', if not specified, default is 'no'

	// there are default values for all the above.
	// just use nP.lineTable() and view the Insertion Loss, Return Loss

	// this function has one arguement, lineTableInputObject.
	// if no arguement, then an internal default version of the lineTableInputObject is used.
	// if no lineTableImputObject.tableID, then a div is created.

	// a sequencial tableID is generated at every lineChart call. if no canvasID provided, this one is used.

	/*
	 ********************************************************
	 ********************************************************

	This section sets up the inputs

	 ********************************************************
	 ********************************************************	
	 */

	var tableText = 'table' + (document.getElementsByTagName('svg').length + 1).toString();

	var createSVG = function ( ) {
		var idAttr = document.createAttribute('id');
		var widthAttr = document.createAttribute('width');
		var heightAttr = document.createAttribute('height');
		var tableBody = document.getElementsByTagName("body")[0];
		var table = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		idAttr.value = tableText; // table1
		widthAttr.value = 400;
		heightAttr.value = 400;
		table.setAttributeNode(idAttr);
		table.setAttributeNode(widthAttr);
		table.setAttributeNode(heightAttr);
		if(!lineTableInputObject.tableID){ tableBody.appendChild(table)};
	}();

	// this is the internal inputTable that has default data if no inputTable data provided
	var inputTable = lineTableInputObject.inputTable || [ 
		[
			['Freq','s21dB','s23dB'],
			[0,-3.52182,-3.52182],
			[600000000,-3.51008,-4.19455],
			[1200000000,-3.47582,-5.72534],
			[1800000000,-3.42189,-7.46851],
			[2400000000,-3.35291,-9.21548],
			[3000000000,-3.27504,-11.01964],
			[3600000000,-3.19561,-13.04088],
			[4200000000,-3.12248,-15.53461],
			[4800000000,-3.06328,-18.99038],
			[5400000000,-3.02443,-24.83689],
			[6000000000,-3.01031,-53.90094],
			[6600000000,-3.02253,-25.46905],
			[7200000000,-3.05969,-19.30541],
			[7800000000,-3.11761,-15.74536],
			[8400000000,-3.18997,-13.20271],
			[9000000000,-3.26921,-11.15721],
			[9600000000,-3.34745,-9.34356],
			[10200000000,-3.41731,-7.596],
			[10800000000,-3.47251,-5.85015],
			[11400000000,-3.50832,-4.28704],
			[12000000000,-3.52176,-3.52571]
		]	

	];

	// lineTable mutates inputTable. if same inputTable is reused by another lineTable, output is distorted.
	// so we create a duplicate version of the inputTable and leave the original version pristine
	var inputTableDuplicated = JSON.parse(JSON.stringify(inputTable));

	var metricPrefix = lineTableInputObject.metricPrefix || 'giga';
	var tableID = lineTableInputObject.tableID ? ('#' + lineTableInputObject.tableID) : ('#' + tableText) ; //d3 wants a '#' in front of an id
	var tableTitle = lineTableInputObject.tableTitle || '';
	var titleVisibilty = function () {
		if (tableTitle===''){return 'hidden'}
		else {return 'visible'};
	};
	var headColor = lineTableInputObject.headColor === 'color' ? false : (lineTableInputObject.headColor === 'gray' ? true : false);
	var tableWH = lineTableInputObject.tableWH === 'no' ? false : (lineTableInputObject.tableWH === 'yes' ? true : false);

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

	// frequency number in column 0 is scaled by the metric prefix
	var scaleFreq = function scaleFreq (array) {
		var row = 0;
		for (row = 1; row< array.length; row ++) {
			array[row][0] = array[row][0]/pickScale(metricPrefix);
		};

	};

	// inputTableDuplicated is mutated in this forEach !!! scale all the frequencies in all the tables
	inputTableDuplicated.forEach(function (element) {
		scaleFreq(element);
	});

	/*
	 ********************************************************
	 ********************************************************

	This section sets up the <table> area. No 'toPNG' possible

	 ********************************************************
	 ********************************************************	
	 */

	//set up the <table> area

	// determine total rows and colums of the table
	var totalTables = inputTableDuplicated.length; // default is two tables
	var maxWidthTable = 0;
	var totalRows = 0;
	var totalCols = 0;
	var rowsPerTable = [];
	inputTableDuplicated.forEach( function (element) { return totalRows = totalRows + element.length;});
	inputTableDuplicated.forEach( function (element) { 
		element.forEach(function (e) {
			totalCols = (totalCols >= e.length ? totalCols : e.length );
			return totalCols;
		});
	});
	inputTableDuplicated.forEach( function (element, d) {
		rowsPerTable[d] = element.length;
	});	

	// determine the inner and outer dimensions
	var columnWidth = 100;
	var tableWidth = totalCols * (columnWidth + 3) + 1;
	var rowHeight = 20;
	var tableHeight = totalRows * (rowHeight + 1) + (totalTables - 1) + 1;// adding for border and for stacked tables
	var margin = { left: 20, top: 20, right: 20, bottom: 20 };
	var outerWidth = margin.left + tableWidth + margin.right;
	var outerHeight = margin.top + tableHeight + margin.bottom;

	// when producing the PNG, determine the x and y values for the upper left corner of the tables
	var x = 20; // this will always be a constant, starting with 20
	var y = []; // this will always be an array, starting with 20, each element of the array is a new table
	rowsPerTable.forEach( function(element, index, array) {
		if (index === 0) { y[0] = 21;}
		if (index >   0) { y[index] = y[index-1] + (rowHeight + 1) * array[index-1] +1 };
	}); 

	// shows alert box displaying the width and height of the table if inputTableObject.tableWH is 'yes'
	if(tableWH) {alert('The table dimensions: Width is ' + outerWidth + ', ' + 'Height is ' + outerHeight);};


	function color (headColor) {	
		var grayScale = '#d4d4d4';
		var colorScale = '#add8e6';
		var outScale = traceColor ? grayScale : colorScale;
		return (headColor ? '#add8e6' : '#d4d4d4');
	};

	// get the svg and add the children elements
	var svg = d3.select(tableID) // this always runs and it overwrites the tableID specified svg
		.attr("width", outerWidth)
		.attr("height", outerHeight)
		.attr("class", 'lineTable')
		.style('background-color', '#ffffff');
	//		.style('border', '1px solid black');

	var rect = svg.append('rect')
		.attr("width", outerWidth)
		.attr("height", outerHeight)
		.attr('fill', 'none')
		.attr('stroke', 'black')
		.attr('stroke-width', '1px')
		.attr('id', 'outerRect');


	var g = svg.append('g')
	//.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	;

	var tableTitle = svg.append('text')
		.attr('transform', 'translate(' + (2) + ',' + (8) + ')')
		.attr("x", 3)
		.attr("dy",  "0.35em")
		.attr('id', 'tableTitleID')
		.style('visibility', titleVisibilty)
		.style("font", "11px sans-serif")
		.text(tableTitle);

	var foreign = g.append('foreignObject')
		.attr('id', 'foreign' + tableID.slice(1))
		.attr('x',margin.left)
		.attr('y',margin.top)
		.attr('width',tableWidth)
		.attr('height',tableHeight);
	var divTable = foreign.append('xhtml:div'); // put the table in this div

	// create each table	
	function createTable (myArray) {
		var row = 0, col = 0, textAlign = '', backgroundColor = '';
		var table = divTable.append('table')
			.style('table-layout', 'fixed')
			.style('width', function () {return ( myArray[0].length===totalCols ? tableWidth : 25) ;})
			.style('border-collapse','collapse');
		for (row = 0; row < myArray.length; row++) {
			var tr = table.append('tr');
			for (col = 0; col < myArray[0].length; col++) {
				var td = tr.append('td')
					.style('border-style','solid')
					.style('border-width','1px')
					.style('width',columnWidth)
					.style('height',rowHeight)
					.style('overflow','hidden')
					.style('white-space','nowrap')
					.style('text-align', function() {
						textAlign = (typeof myArray[row][col]==='string' ? 'center' : 'left');
						return textAlign;
					})
					.style('background-color', function() {
						backgroundColor = (typeof myArray[row][col]==='string' ? (headColor ? '#d4d4d4' : '#add8e6') : 'white');
						return backgroundColor;
					})	.html( (typeof myArray[row][col]==='string' ? myArray[row][col] : myArray[row][col].toFixed(5)) );
			};
		};

	}
	// calls createTable for each table, two tables included in the default inputTableOject
	inputTableDuplicated.forEach(function (element) {
		createTable(element);
	});

	/*
	 ********************************************************
	 ********************************************************

	This section adds a button to the svg above and to the right of the table

	 ********************************************************
	 ********************************************************	
	 */

	// construct the little square button at the upper right of the plot
	var buttonRectID = 'buttonRect' + tableID.slice(1); // slice(1) removes '#" from chartID
	var buttonRect = svg.append('rect') // this sets up the 'To PNG' button
		.attr('width', '10')
		.attr('height', '10')
		.attr('fill', '#d3d3d3')
		.attr('stroke', '#a9a9a9')
		.attr('stroke-width', '1px')
		.attr('id', buttonRectID)
		.attr('transform', 'translate(' + (outerWidth - 13) + ',' + 3 + ')');

	var buttonTextID = 'buttonText' + tableID.slice(1); // slice(1) removes '#' from chartID
	var buttonText = svg.append('text')
		.attr('transform', 'translate(' + (outerWidth - 105) + ',' + 9.5 + ')')
		.attr("x", 3)
		.attr("dy",  "0.35em")
		.attr('id', buttonTextID)
		.style('visibility', 'visible')
		.style("font", "11px sans-serif")
		.text('Change to PNG?');

	/*
	 ********************************************************
	 ********************************************************

	This section creates the png image when the button is clicked

	 ********************************************************
	 ********************************************************	
	 */

var createPngTable = function createPngTable (myArray, x, y) {
	var row = 0, col = 0, notLastCellWidth = 0, lastCellWidth = 0, color = '';
	for (row = 0; row < myArray.length; row++) {
		for (col = 0; col < myArray[0].length; col++) {
			var rect = svg.append('rect')
				.attr('x', x + (columnWidth + 3) * col)
				.attr('y', y + (rowHeight + 1) * row)
				.attr('width', function() {
					notLastCellWidth = columnWidth + 4;
					lastCellWidth = notLastCellWidth -1;
					if(col === myArray[0].length -1) { return lastCellWidth;};
					return notLastCellWidth;
				})
				.attr('height', rowHeight + 1)
				.attr('fill', function () {
					color = typeof myArray[row][col]==='string' ? (headColor ? '#d4d4d4' : '#add8e6') : 'white';
					return color;
				})
				.attr('stroke', 'black')
				.attr('stroke-width', '1px');
			var text = svg.append('text')
				.attr('transform', function () {
					var center = 0;
					center = typeof myArray[row][col]==='string' ? Math.round(columnWidth/2 - (myArray[row][col].length*columnWidth)/28) : 3;

					return 'translate(' + (x + center + (columnWidth + 3) * col) + ',' + (y + 16 + (rowHeight + 1) * row) + ')'
				})
				.style('visibility', 'visible')
				.text(typeof myArray[row][col]==='string' ? myArray[row][col] : myArray[row][col].toFixed(5));

		}
	};
}

var toPNG = function toPNG () {
	// remove the foreignObject element and all it's children
	var foreign = document.getElementById('foreign'+tableID.slice(1)); foreign.remove();

	// calls createPngTable for each table, two tables included in the default inputTableOject
	inputTableDuplicated.forEach(function (element, index) {
		createPngTable(element, x, y[index]);
	});

	// get rid of the button and the button text before converting to PNG
	buttonRect.remove(); buttonText.remove();


	// get the old svg element to be replaced
	var oldSvg = document.getElementById(tableID.slice(1)); // slice(1) to remove '#' in front of chartID

	// Put the svg into an image tag so that the Canvas element can read it in.
	var doctype = '<?xml version="1.0" standalone="no"?>'
		+ '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

	// serialize our SVG XML to a string.			
		var source = (new XMLSerializer()).serializeToString(d3.select(tableID).node());

	// create a file blob of our SVG.
	var blob = new Blob([ doctype + source], { type: 'image/svg+xml;charset=utf-8' });

	var url = window.URL.createObjectURL(blob);
	var tempImg = d3.select('body').append('img')
		.attr('width', outerWidth)
		.attr('height', outerHeight)
		.attr('id', 'tempImg')
		.node();
	tempImg.onload = function(){
	// Now that the image has loaded, put the image into a canvas element.
		var canvas = d3.select('body').append('canvas').node();
		canvas.width = outerWidth;
		canvas.height = outerHeight;
		canvas.id = 'tempCanvas';
		var ctx = canvas.getContext('2d');
		ctx.drawImage(tempImg, 0, 0);
		var canvasUrl = canvas.toDataURL("image/png");
		var newImg = d3.select('body').append('img') 
			.attr('width', outerWidth)
			.attr('height', outerHeight)
			.attr('id', 'newImg')
			.node();

		newImg.onload = function() {
			document.getElementById('newImg');
			oldSvg.parentNode.replaceChild(newImg, oldSvg);
		}
	// this is now the base64 encoded versikjon of our NG! you could optionally 
	// redirect the user to download the PNG by sending them to the url with 
	// `window.location.href= canvasUrl`.
		newImg.src = canvasUrl;
		canvas.remove();

	}
	// start loading the image.
	tempImg.src = url;
	tempImg.remove();

};
var buttonRect = document.getElementById(buttonRectID);
var buttonText = document.getElementById(buttonTextID);

buttonRect.addEventListener('mouseenter', function () { buttonRect.setAttribute('fill', '#a9a9a9');});
buttonRect.addEventListener('mouseleave', function () { buttonRect.setAttribute('fill', '#d3d3d3');});
buttonRect.addEventListener("click", function() { toPNG(); });

};
