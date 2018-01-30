// scatterPlot.js

define(['app/storage', 'app/complex', 'app/nport', 'app/matrix'], function (storage, complex, nport, matrix){
"use strict";


return function scatterPlot (inputObject) {
var inputTable = inputObject.inputTable;
var canvasID = inputObject.canvasId;
var xMin = inputObject.xMin, xMax = inputObject.xMax, yMin = inputObject.yMin, yMax = inputObject.yMax;
var k = 0;
var p = 0
var tsv = '';
inputTable.forEach( (element) => {
    tsv += element.join('\t') + '\n';
});
  
//use d3 to turn tsv data into d3 data
var data = d3.tsvParse(tsv);

//change data type from string to float, for arbitrary sized/named table
data.forEach( d => {
  for (k = 0; k < data.columns.length; k++){
      d[data.columns[k]] = +d[data.columns[k]]
      };
});//console.log(data)

//change the data to nestedData
var nestedData = data.columns.slice(1).map(function(yName) {// this will return an array of objects
  return {
    yName: yName,                       // this is the rf dB plot
    yValues: data.map(function(d) {     // this will return an inner Array of objects
    return {xValue: d[data.columns[0]], // this is the rf frequency
            yValue: d[yName]};          // this is the dB value
    })
  };
});

var xExtent = (function () {//creates a one dimensional array
  var temp = []
  for (k = 0; k < data.length; k++) {
    temp.push(nestedData[0].yValues[k].xValue);
  }
  return temp;
})();

var yExtent = (function () {//creates a one dimensional array
  var temp = []
  for (k = 0; k < nestedData.length; k++){
    for (p = 0; p < data.length; p++) {
      temp.push(nestedData[k].yValues[p].yValue);
    }
  }
  return temp;
})()

//set up the plot area
var canvasRect = d3.select(canvasID).node().getBoundingClientRect();
var outerWidth = canvasRect.width//500;
var outerHeight = canvasRect.height//250;
var margin = { left: 70, top: 5, right: 5, bottom: 60 };

var innerWidth  = outerWidth  - margin.left - margin.right;
var innerHeight = outerHeight - margin.top  - margin.bottom;

var x = d3.scaleLinear().domain(d3.extent(xExtent)).range([0, innerWidth]);//[xMin,xMax]
var y = d3.scaleLinear().domain(d3.extent(yExtent)).range([innerHeight, 0]);//[yMin,yMax]

var svg = d3.select(canvasID).append("svg")
.attr("width", outerWidth)
.attr("height", outerHeight);
var rect = svg.append('rect')
.attr("width", outerWidth)
.attr("height", outerHeight)
.attr('fill', 'none')
.attr('stroke', 'black')
.attr('stroke-width', '1px');

var xAxisTitle = inputObject.xAxisTitle;
var xAxisTitleOffset = 48;
var yAxisTitle = inputObject.yAxisTitle;
var yAxisTitleOffset = 40;

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
//append the x axix grid onto g
g.append('g')
  .attr("class", "xGrid")
  .attr('transform', 'translate(0,' + innerHeight + ')')
  .call(d3.axisBottom(x).tickSize(-innerHeight).tickFormat(""));
d3.select('g').select('g.xGrid').selectAll('g').select('line')
  .attr('stroke', 'gray').attr('stroke-dasharray', '3, 3');
  
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
//append the x axis grid onto g
g.append('g')
  .attr("class", "yGrid")
  .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(""));
d3.select('g').select('g.yGrid').selectAll('g').select('line')
  .attr('stroke', 'gray').attr('stroke-dasharray', '3, 3');

function plotColor (label) {return d3.schemeCategory10[data.columns.slice(1).indexOf(label)];};

var plotGroups = g.selectAll('g.newPlot')
.data(nestedData)
.enter()
.append('g')
.attr('class', 'newPlot')
.each( function (d) {
    d3.select(this).selectAll('circle')
    .data(d => d.yValues)
    .enter()
    .append('circle')
    .attr('cx', d => x(d.xValue))
    .attr('cy', d => y(d.yValue))
    .attr('r', 2)
    .style("stroke", plotColor(d.yName)).style('fill', plotColor(d.yName)).style('stroke-width','2')
    
    var line = d3.line()
    .x(d => x(d.xValue))
    .y(d => y(d.yValue));
    
    d3.select(this).append("path")
    .attr('d', d => line(d.yValues))
    .style("stroke", plotColor(d.yName)).style('fill', 'none')
    
    d3.select(this).append("text")
    .attr("transform", function(d) { return "translate(" + x(d.yValues[d.yValues.length-2].xValue) + "," + y(d.yValues[d.yValues.length-2].yValue)  + ")"; })
    .attr("x", 3)
    .attr("dy", "0.35em")
    .style("font", "10px sans-serif")
    .text(function(d) { return d.yName; });
    })//end each
}

//scatterPlot(myFilterInputObject);();
});

/*
Test values 
Fmin pass = 1GHz, Frej = 1.5GHz, ripple = 0.1dB, rejection = 30dB
Fstart = 0.2GHz, Fstop = 10GHz, Fstep = 2GHz

3.760e-12  Farad
1.132e-8  Henry
6.674e-12  Farad
1.252e-8  Henry
6.674e-12  Farad
1.132e-8  Henry
3.760e-12  Farad

-0.0975dB
-64.3dB
-106dB
-130dB
-147dB

*/

/*
				html = '<p style="color:blue;font-size:' + toText.toString() + 'px;">jerry ' + toText.toString() + ' wiltz</p>';
				plotArea.innerHTML = html;
				
				
		plotArea.innerHTML =	'<svg height="300px" width="700px">' +
								    '<g class="grid x-grid" id="xGrid">' +
									  '<line x1="113" x2="113" y1="10" y2="380"></line>' +
									  '<line x1="259" x2="259" y1="10" y2="380"></line>' +
									  '<line x1="405" x2="405" y1="10" y2="380"></line>' +
									  '<line x1="551" x2="551" y1="10" y2="380"></line>' +
									  '<line x1="697" x2="697" y1="10" y2="380"></line>' +
									'</g>' +
									'<g class="grid y-grid" id="yGrid">' +
									  '<line x1="86" x2="697" y1="10" y2="10"></line>' +
									  '<line x1="86" x2="697" y1="68" y2="68"></line>' +
									  '<line x1="86" x2="697" y1="126" y2="126"></line>' +
									  '<line x1="86" x2="697" y1="185" y2="185"></line>' +
									  '<line x1="86" x2="697" y1="243" y2="243"></line>' +
									  '<line x1="86" x2="697" y1="301" y2="301"></line>' +
									  '<line x1="86" x2="697" y1="360" y2="360"></line>' +
									'</g>' +


									//'<g class="surfaces">' +
									//	'<path class="first_set" d="M113,360 L113,192 L259,171 L405,179 L551,200 L697,204 L697,360 Z"></path>' +
									//'</g>' +

									//'<use class="grid double" xlink:href="#xGrid" style=""></use>' +
									//'<use class="grid double" xlink:href="#yGrid" style=""></use>' +

									'<g class="first_set points" data-setname="Our first data set">' +
									  '<circle cx="113" cy="192" data-value="7.2" r="5"></circle>' +
									  '<circle cx="259" cy="171" data-value="8.1" r="5"></circle>' +
									  '<circle cx="405" cy="179" data-value="7.7" r="5"></circle>' +
									  '<circle cx="551" cy="200" data-value="6.8" r="5"></circle>' +
									  '<circle cx="697" cy="204" data-value="6.7" r="5"></circle>' +
									'</g>' +


									'<g class="labels x-labels">' +
										'<text x="113" y="400">2008</text>' +
										'<text x="259" y="400">2009</text>' +
										'<text x="405" y="400">2010</text>' +
										'<text x="551" y="400">2011</text>' +
										'<text x="697" y="400">2012</text>' +
									'</g>' +
									'<g class="labels y-labels">' +
										'<text x="80" y="15">15</text>' +
										'<text x="80" y="131">10</text>' +
										'<text x="80" y="248">5</text>' +
										'<text x="80" y="365">0</text>' +
										'<text x="50" y="15">Weeks</text>' +
									'</g>' +
								'</svg>';
*/

/*
			var plot = function plot() {
				//HDTV aspect ratio is 16:9, scale by 120 to get HDTV 1920:1080 pixels for a 42 in TV, scale by 23 to get nPort 368:180
				//plot area is a rect containing a 10 by 10 grid area, an x-axis and lables, a y-axis and lables, anchor is at origin of grid area
				//width of plot area is M + M + 10M + M = 13M where M is the width of each x grid
				//height of plot area is M + 10N + M + M = 3M + 10N where N is the height if each y grid
				//13M = scale * 16; for scale of 22.5, M = Math.ceil(scale*16/13) = 28, width of plot rect is 13 * 28 = 364
				//3M + 10N = scale * 9; for scale of 22.5, N = Math.ceil( (scale*9 - 3*28)/10) = 12, height of plot rect is 3 * 28 + 10 * 12 = 204
				//define the svg area by adding 4 to the plot area, plot area 364 by 204, svg area is 368 by 208
				//anchorX = 2M, 2 * 28 = 56; anchorY is M + 10N, 28 + 10 * 12 = 148  
				//process: for a given scale factor, find M and N, then compute svg and plot area coordinates, lastly find anchor coordinates
				var scale = 22.5,
					M = 28, N = 12, anchorX = 56, anchorY = 148,
					svgH = 208, svgW = 368, rectH = 204, rectW = 364,
					vertX1 = 56, vertY1 = 28, vertX2 = 56, vertY2 = 137,
					horzX1 = 56, horzY1 = 148, horzX2 = 324, horzY2 = 148,
					lineCount = 0, html = "", toText = 46;
				
				scale = 22.5;
				M = Math.ceil(scale*16/13); N = Math.ceil((scale*9 - 3*28)/10); //M = 28 N = 12
				svgW = 13 * M + 4; svgH =  3 * M + 10 * N + 4; // svgH = 208; svgW = 368; 
				rectW = 13 * M; rectH =  3 * M + 10 * N; // svgH = 204; svgW = 364; 
				anchorX = 2 * M; anchorY = M + 10 * N; // anchorX = 56; anchorY = 148
				vertX1 = anchorX; vertY1 = M; vertX2 = anchorX; vertY2 = anchorY;
				horzX1 = anchorX; horzY1 = M; horzX2 = 12 * M; horzY2 = M;
								
				//build the plot...	
				html =  '<svg height="'+svgH.toString()+'px" width="'+svgW.toString()+'px">'
				html += '<rect class="gridRect" id="myRect" height="'+rectH.toString()+'px" width="'+rectW.toString()+'px"/></rect>'
				for (lineCount = 0; lineCount < 10 + 1; lineCount++) {//vertical lines ... the Y's don't change, just the X
					html += '<line class="gridLine" x1="'+vertX1.toString()+'" y1="'+vertY1.toString()+'" x2="'+vertX2.toString()+'" y2="'+vertY2.toString()+'"></line>'
					vertX1 += M; vertX2 += M;
				}
				for (lineCount = 0; lineCount < 10 + 1; lineCount++) {//horizontal lines ... the X's don't change, just the 
					html += '<line class="gridLine" x1="'+horzX1.toString()+'" y1="'+horzY1.toString()+'" x2="'+horzX2.toString()+'" y2="'+horzY2.toString()+'"></line>'
					horzY1 += N; horzY2 += N;
				}
				html += '</svg>';
				
				plotArea.innerHTML = html;
				
				console.log(startFreq); //.2
				console.log(stopFreq); //10
				console.log(stepFreq); //2
				}();
*/				