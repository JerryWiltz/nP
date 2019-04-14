import * as d3 from 'd3'
export	function  lineChart (lineChartInputObject = {}) {i

	// here is the definition of the lineChartInputObject data structure:

	// lineChartInputObject.inputTable,	// an array of outs [out1, out2 ... outn]
	// lineChartInputObject.canvasID,	// a string of an svg id '#canvas'
	// lineChartInputObject.metricPrefix,	// a string of a metric prefix such as 'giga'
	// lineChartInputObject.xAxisTitle,	// a string of the x axis title such as 'Frequency'
	// lineChartInputObject.yAxisTitle,	// a string of the y axis title such as 'dB'
	// lineChartInputObject.xRange,		// an array of min, max such as [2e9, 12e9]
	// lineChartInputObject.yRange,		// an array of min, max such as [0, -80]

	// there are default values for all the above.
	// just use nP.lineChart() and view the Insertion Loss, Return Loss, Noise Figure, and IP3 responce

	// this function has one arguement, lineChartInputObject.
	// if no arguement, then an internal default version of the lineChartInputObject is used.
	// if no lineChartImputObject:canvasID, then a svg is created.

	var createSVG = function ( ) {
		var idAttr = document.createAttribute('id');
		var widthAttr = document.createAttribute('width');
		var heightAttr = document.createAttribute('height');
		var canvasBody = document.getElementsByTagName("body")[0];
		var canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		idAttr.value = 'canvas';
		widthAttr.value = 400;
		heightAttr.value = 300;
		canvas.setAttributeNode(idAttr);
		canvas.setAttributeNode(widthAttr);
		canvas.setAttributeNode(heightAttr);
		if(!lineChartInputObject.canvasID) canvasBody.appendChild(canvas);
	}();

	var inputTable = lineChartInputObject.inputTable || [ 
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

	// lineChart mutates inputTable. if same inputTable is reused by another lineChart, output is distorted.
	// so we create a duplicate version of the inputTable and leave the original version pristine
	var inputTableDuplicated = JSON.parse(JSON.stringify(inputTable));

	var metricPrefix = lineChartInputObject.metricPrefix || 'giga';
	var canvasID = lineChartInputObject.canvasID || '#canvas' ;
	var xAxisTitle = lineChartInputObject.xAxisTitle || 'Frequency';
	var yAxisTitle = lineChartInputObject.yAxisTitle || 'dB';
	var xAxisTitleOffset = 48;
	var yAxisTitleOffset = 40;

	var pickScale = function (metricPrefix){
		var out = 0;
		if (metricPrefix === 'giga') {out = 1e9;};
		if (metricPrefix === 'mega') {out = 1e6;};
		if (metricPrefix === 'kilo') {out = 1e3;};
		if (metricPrefix === 'none') {out = 1;};
		if (metricPrefix === 'deci') {out = 1e-1;};
		if (metricPrefix === 'centi') {out = 1e-2;};
		if (metricPrefix === 'milli') {out = 1e-3;};
		if (metricPrefix === 'micro') {out = 1e-6;};
		if (metricPrefix === 'nano') {out = 1e-9;};
		if (metricPrefix === 'pico') {out = 1e-12;};
		return out;
	};

	var generateFormattedData = function (inputTable) {
		var k = 0;
		var p = 0;
		var divisor = pickScale(metricPrefix); // default is giga, 1e9
		var inputTableFrequencyAdjusted = [];

		inputTableFrequencyAdjusted = inputTable;

		for (k = 1; k < inputTable.length; k++) {
			inputTableFrequencyAdjusted[k][0] = inputTable[k][0]/divisor
		};

		var tsv = '';
		inputTableFrequencyAdjusted.forEach( (element) => {
			tsv += element.join('\t') + '\n';
		});
		//use d3 to turn tsv data into d3 data
		var data = d3.tsvParse(tsv);

		//change data type from string to float, for arbitrary sized/named table
		data.forEach( d => {
			for (k = 0; k < data.columns.length; k++){
				d[data.columns[k]] = +d[data.columns[k]]
			};
		});

		//change the data to groupData
		var groupData = data.columns.slice(1).map(function(yName) {// this will return an array of objects
			return {
				yName: yName,                       // this is the rf dB plot
				yValues: data.map(function(d) {     // this will return an inner Array of objects
					return {xValue: d[data.columns[0]], // this is the rf frequency
						yValue: d[yName]};          // this is the dB value
				})
			};
		});
		return groupData;
	};

	var formattedData = inputTableDuplicated.map( function(element) {
		return generateFormattedData(element);
	});

	var xSpan = []; // the span of the the x axis
	formattedData.flat().forEach( function (element) {
		element.yValues.forEach(function (item) { xSpan.push(item.xValue)});	
	});

	// checks if xRange is specified, if it is then xSpan is updated with scaled xRange input
	if(lineChartInputObject.xRange) {xSpan = lineChartInputObject.xRange.map( function (element) { return element/pickScale(metricPrefix);})};

	var ySpan = []; // the span of the y axis
	formattedData.flat().forEach( function (element) {
		element.yValues.forEach(function (item) { ySpan.push(item.yValue)});	
	});

	// checks if yRange is specified, if it is then ySpan is updated with yRange input
	ySpan = lineChartInputObject.yRange || ySpan;

	//set up the plot area
	var canvasRect = d3.select(canvasID).node().getBoundingClientRect();
	var outerWidth = canvasRect.width
	var outerHeight = canvasRect.height
	var margin = { left: 70, top: 20, right: 20, bottom: 60 };

	var innerWidth  = outerWidth  - margin.left - margin.right;
	var innerHeight = outerHeight - margin.top  - margin.bottom;

	var x = d3.scaleLinear().domain(d3.extent(xSpan)).range([0, innerWidth]);
	var y = d3.scaleLinear().domain(d3.extent(ySpan)).range([innerHeight, 0]);

	var svg = d3.select(canvasID)
		.attr("width", outerWidth)
		.attr("height", outerHeight)
		.attr("class", 'lineChart');
	var rect = svg.append('rect')
		.attr("width", outerWidth)
		.attr("height", outerHeight)
		.attr('fill', 'none')
		.attr('stroke', 'black')
		.attr('stroke-width', '1px');

	var g = svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	//append the x axis onto g
	g.append('g')
		.attr('class', 'xAxis')
		.style('font-size', '12')
		.attr('transform', 'translate(0,' + innerHeight + ')')
		.call(d3.axisBottom(x))
		.append('text')
		.attr("fill", "#000")
		.style("text-anchor", "middle")
		.attr("transform", "translate(" + (innerWidth / 2) + "," + xAxisTitleOffset + ")")
		.style('font-size', '20')
		.text(xAxisTitle);						
	//append the x axis grid onto g
	g.append('g')
		.attr("class", "xGrid")
		.attr('transform', 'translate(0,' + innerHeight + ')')
		.call(d3.axisBottom(x).tickSize(-innerHeight).tickFormat("")).attr('stroke', 'gray').attr('stroke-dasharray', '3, 3');	  
	//append the y axis onto g
	g.append('g')
		.attr('class', 'yAxis')
		.style('font-size', '12')
		.call(d3.axisLeft(y))
		.append('text')
		.attr("fill", "#000")
		.style("text-anchor", "middle")
		.attr("transform", "translate(-" + yAxisTitleOffset + "," + (innerHeight / 2) + ") rotate(-90)")
		.style('font-size', '20')
		.text(yAxisTitle);						
	//append the y axis grid onto g
	g.append('g')
		.attr("class", "yGrid")
		.call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat("")).attr('stroke', 'gray').attr('stroke-dasharray', '3, 3');

	var colorIndex = 0;
	formattedData.forEach(function(groupData, groupIndex) { 

		function plotColor (label) {return d3.schemeCategory10[colorIndex];};
		// kept, the old. function plotColor (label) {return d3.schemeCategory10[data.columns.slice(1).indexOf(label)];};

		var newPlot = 'newPlot' + groupIndex.toString();	
		var plotGroups = g.selectAll('g.newPlot')
			.data(groupData)
			.enter()
			.append('g')
			.attr('class', newPlot) // kept the old. was 'newPlot', need unique class name per trace
			.each( function (d) {
				d3.select(this).selectAll('circle')
					.data(d => d.yValues)
					.enter()
					.append('circle')
					.attr('cx', d => x(d.xValue))
					.attr('cy', d => y(d.yValue))
					.attr('r', 2)
					.style("stroke", plotColor(colorIndex)).style('fill', plotColor(colorIndex)).style('stroke-width','2');
				// kept the old. .style("stroke", plotColor(d.yName)).style('fill', plotColor(d.yName)).style('stroke-width','2');

				var line = d3.line()
					.x(d => x(d.xValue))
					.y(d => y(d.yValue));

				d3.select(this).append("path")
					.attr('d', d => line(d.yValues))
					.style("stroke", plotColor(colorIndex)).style('fill', 'none')
				//kept the old. .style("stroke", plotColor(d.yName)).style('fill', 'none')

				d3.select(this).append("text")
					.attr("transform", function(d) { 
						var textShift = Math.ceil(d.yValues.length/4); // moves the text 3/4 away
						return "translate(" + x(d.yValues[d.yValues.length-textShift].xValue) + "," + y(d.yValues[d.yValues.length-textShift].yValue)  + ")";})
					.attr("x", 3)
					.attr("dy", "0.35em")
					.style("font", "12px sans-serif")
					.text(function(d) { return d.yName; });
				colorIndex++;
			})//end d3.each() 
	});// end .forEach()
};
