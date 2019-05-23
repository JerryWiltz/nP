import * as d3 from 'd3'
export	function  lineChart (lineChartInputObject = {}) {

	// here is the definition of the lineChartInputObject data structure:

	// lineChartInputObject.inputTable,	// an array of outs [out1, out2 ... outn]; default is internal inputTable
	// lineChartInputObject.chartID,	// a string of an svg id 'chart'; default is 'chart1'
	// lineChartInputObject.metricPrefix,	// a string of a metric prefix such as 'giga'; default is 'giga'
	// lineChartInputObject.titleTitle,	// a string of the chart title; default is blank
	// lineChartInputObject.xAxisTitle,	// a string of the x axis title; default is 'Frequency'
	// lineChartInputObject.yAxisTitle,	// a string of the y axis title; default is 'dB'
	// lineChartInputObject.xRange,		// an array of min, max such as [2e9, 12e9]; default is autorange based on data
	// lineChartInputObject.yRange,		// an array of min, max such as [0, -80]; default is autorange based on data
	// lineChartInputObject.showPoints,	// a string with either 'show' or 'hide', if not specified, default is 'show'
	// lineChartInputObject.showLables,	// a string with either 'show' or 'hide', if not specified, default is 'show'

	// there are default values for all the above.
	// just use nP.lineChart() and view the Insertion Loss, Return Loss, Noise Figure, and IP3 responce

	// this function has one arguement, lineChartInputObject.
	// if no arguement, then an internal default version of the lineChartInputObject is used.
	// if no lineChartImputObject:chartID, then a svg is created.

	// requierment for unique ID for each chart svg
	// a sequencial chartID is generated at every lineChart call. if no chartID provided, this one is used.
	var chartText = 'chart' + (document.getElementsByTagName('svg').length + 1).toString();

	var createSVG = function ( ) {
		var idAttr = document.createAttribute('id');
		var widthAttr = document.createAttribute('width');
		var heightAttr = document.createAttribute('height');
		var chartBody = document.getElementsByTagName("body")[0];
		var chart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		idAttr.value = chartText; // chart1
		widthAttr.value = 400;
		heightAttr.value = 300;
		chart.setAttributeNode(idAttr);
		chart.setAttributeNode(widthAttr);
		chart.setAttributeNode(heightAttr);
		if(!lineChartInputObject.chartID){ chartBody.appendChild(chart)};
	}();

	// this is the internal inputTable that has default data if no inputTable data provided
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
	// so we create a duplicate version of the inputTable and leave the original version unmutated.
	var inputTableDuplicated = JSON.parse(JSON.stringify(inputTable));

	var metricPrefix = lineChartInputObject.metricPrefix || 'giga';
	var chartID = lineChartInputObject.chartID ? ('#' + lineChartInputObject.chartID) : ('#' + chartText) ; //d3 wants a '#' in front of an id
	var titleTitle = lineChartInputObject.titleTitle || '';
	var titleVisibilty = function () {
		if (titleTitle===''){return 'hidden'}
		else {return 'visible'}
	}
	var xAxisTitle = lineChartInputObject.xAxisTitle || 'Frequency';
	var yAxisTitle = lineChartInputObject.yAxisTitle || 'dB';
	var xAxisTitleOffset = 48;
	var yAxisTitleOffset = 40;
	var showPoints = lineChartInputObject.showPoints === 'hide' ? false : (lineChartInputObject.showPoints === 'show' ? true : true) ;
	var showLables = lineChartInputObject.showLables === 'hide' ? false : (lineChartInputObject.showLables === 'show' ? true : true) ;

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
	var chartRect = d3.select(chartID).node().getBoundingClientRect();
	var outerWidth = chartRect.width;
	var outerHeight = chartRect.height;
	var margin = { left: 70, top: 20, right: 20, bottom: 60 };

	var innerWidth  = outerWidth  - margin.left - margin.right;
	var innerHeight = outerHeight - margin.top  - margin.bottom;

	var x = d3.scaleLinear().domain(d3.extent(xSpan)).range([0, innerWidth]);
	var y = d3.scaleLinear().domain(d3.extent(ySpan)).range([innerHeight, 0]);

	var svg = d3.select(chartID) // this always runs and it overwrites the chartID specified svg
		.attr("width", outerWidth)
		.attr("height", outerHeight)
		.attr("class", 'lineChart');
	var rect = svg.append('rect')
		.attr("width", outerWidth)
		.attr("height", outerHeight)
		.attr('fill', 'none')
		.attr('stroke', 'black')
		.attr('stroke-width', '1px')
		.attr('id', 'outerRect');

	var buttonRectID = 'buttonRect' + chartID.slice(1); // slice(1) removes '#" from chartID
	var buttonRect = svg.append('rect') // this sets up the 'To PNG' button
		.attr('width', '10')
		.attr('height', '10')
		.attr('fill', '#99ccff')
		.attr('stroke', 'blue')
		.attr('stroke-width', '1px')
		.attr('id', buttonRectID)
		.attr('transform', 'translate(' + (outerWidth - 13) + ',' + 3 + ')');

	var buttonTextID = 'buttonText' + chartID.slice(1); // slice(1) removes '#' from chartID
	var buttonText = svg.append('text')
		.attr('transform', 'translate(' + (outerWidth - 75) + ',' + 9.5 + ')')
		.attr("x", 3)
		.attr("dy",  "0.35em")
		.attr('id', buttonTextID)
		.style('visibility', 'hidden')
		.style("font", "12px sans-serif")
		.text('To PNG');

	var chartTitle = svg.append('text')
		.attr('transform', 'translate(' + (2) + ',' + (8) + ')')
		.attr("x", 3)
		.attr("dy",  "0.35em")
		.attr('id', 'chartTitleID')
		.style('visibility', titleVisibilty)
		.style("font", "11px sans-serif")
		.text(titleTitle);

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

		function plotColor (lable) {return d3.schemeCategory10[colorIndex];};

		var newPlot = 'newPlot' + groupIndex.toString();	
		var plotGroups = g.selectAll('g.newPlot')
			.data(groupData)
			.enter()
			.append('g')
			.attr('class', newPlot)
			.each( function (d) {
				if(showPoints === true){
					d3.select(this).selectAll('circle')
						.data(d => d.yValues)
						.enter()
						.append('circle')
						.attr('cx', d => x(d.xValue))
						.attr('cy', d => y(d.yValue))
						.attr('r', 2)
						.style("stroke", plotColor(colorIndex)).style('fill', plotColor(colorIndex)).style('stroke-width','2');
				};
				var line = d3.line()
					.x(d => x(d.xValue))
					.y(d => y(d.yValue));

				d3.select(this).append("path")
					.attr('d', d => line(d.yValues))
					.style("stroke", plotColor(colorIndex)).style('fill', 'none')

				if (showLables === true) {
					d3.select(this).append("text")
						.attr("transform", function(d) { 
							let textShift = function () { // put start of lable to the right side of chart rectangle
								let points = d.yValues.length;
								if (points === 1) {return 1};
								if (points === 2) {return 2};
								if (points === 3) {return 2};
								if (points === 4) {return 2};
								if ( (points => 5) && (points <= 10) ) {return Math.ceil(points/4) + 2};
								if ( (points => 11) && (points <= 100) ) {return Math.ceil(points/4) + 1};
								if (points => 101) {return Math.ceil(points/4)};
							}();
							let shiftDown = function () { // put lable above or below the trace depending on slope
								let points = d.yValues.length;
								if (points < 50) {return 10};
								if (points => 50) {
									let low = d.yValues[d.yValues.length-textShift-10].yValue;
									let high = d.yValues[d.yValues.length-textShift+10].yValue;
									if(low <= high) {return 10} // put lable below trace, positive slope
									if(low > high) { return -10} // put lable above trace, negative slope	
								}
							}();
							let shiftRight = 10;
							return "translate(" + ( x(d.yValues[d.yValues.length-textShift].xValue) + shiftRight ) + "," + ( y(d.yValues[d.yValues.length-textShift].yValue) + shiftDown ) + ")";})
						.attr("x", 3)
						.attr("dy", "0.35em")
						.style("font", "12px sans-serif")
						.text(function(d) { return d.yName; });
				};
				colorIndex++;
			})//end d3.each() 
	});// end .forEach()

	// this section converts svg to png, good for inserting png images of charts in other documents
	var buttonRect = document.getElementById(buttonRectID);
	var buttonText = document.getElementById(buttonTextID);

	buttonRect.addEventListener('mouseenter', function () { buttonRect.setAttribute('fill', 'blue'); buttonText.setAttribute('style', 'visibility:visible; font: 12px sans-serif')});
	buttonRect.addEventListener('mouseleave', function () { buttonRect.setAttribute('fill', '#99ccff'); buttonText.setAttribute('style', 'visibility:hidden; font: 12px sans-serif')});
	buttonRect.addEventListener("click", function() { toPNG(); });

	var toPNG = function toPNG () {
		// get rid of the button and text before converting to PNG
		buttonRect.remove(); buttonText.remove();

		// get the old svg element to be replaced
		var oldSvg = document.getElementById(chartID.slice(1)); // slice(1) to remove '#' in front of chartID

		// Put the svg into an image tag so that the Canvas element can read it in.
		var doctype = '<?xml version="1.0" standalone="no"?>'
			+ '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

			// serialize our SVG XML to a string.			
			var source = (new XMLSerializer()).serializeToString(d3.select(chartID).node());

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
			// this is now the base64 encoded version of our PNG! you could optionally 
			// redirect the user to download the PNG by sending them to the url with 
			// `window.location.href= canvasUrl`.
			newImg.src = canvasUrl;
			canvas.remove();

		}
		// start loading the image.
		tempImg.src = url;
		tempImg.remove();

	}
};
