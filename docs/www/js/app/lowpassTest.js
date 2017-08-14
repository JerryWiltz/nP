// lowPassTest.js

define(['app/storage', 'app/complex', 'app/nport', 'app/matrix'], function (storage, complex, nport, matrix){
"use strict";
	return function lowPassTest() {
	"use strict";
		// Define the "click" function
		var doTest = function doTest() {

			var startFreq = parseFloat(document.getElementById('startFreq').value),
				stopFreq = parseFloat(document.getElementById('stopFreq').value),
				stepFreq = parseFloat(document.getElementById('stepFreq').value),
				plotArea = document.getElementById('plotArea'),
				
				frequencyUnits = document.getElementById('frequencyUnits').value,
				
				lowPassComponents = [],
				freqSparTable = [],
			
				row, col, count, F;
				
			//components table 
			lowPassComponents = matrix.dimension(storage.lowPassTable.length - 3, 3, complex(0, 0));
			
			//transfer to components table
			for(row = 0, col = 3; row < lowPassComponents.length; row++) {
			lowPassComponents[row][0] = storage.lowPassTable[row + 2][col];
			};
			
			//frequecy response table
			freqSparTable = matrix.dimension(Math.ceil( (stopFreq - startFreq)/stepFreq), 2, 0);
			count = 0;
			for (F = startFreq * frequencyUnits; F < stopFreq * frequencyUnits; F += stepFreq * frequencyUnits) {				
				(function () {
					var row = 0;				
					
					for(row = 0; row < lowPassComponents.length; row++) { //populate the tabel
						lowPassComponents[row][1] = (row % 2 === 0 ) ? nport('parallelRLCinSeries', false, false, lowPassComponents[row][0], F) //parallel C
																	  : nport('seriesRLCinSeries', false, lowPassComponents[row][0], false, F); //series L
					};
					lowPassComponents[0][2] =  lowPassComponents[0][1];

					for(row = 1; row < lowPassComponents.length; row++) { //perform cascade of all the 2ports
						lowPassComponents[row][2] = lowPassComponents[row - 1][2].cas(lowPassComponents[row][1]);
					};
					
					//populate the table
					freqSparTable[count][0] = F;
					freqSparTable[count][1] = lowPassComponents[lowPassComponents.length-1][2].getSpars();

				}());
			count++;				
			} // end of frequency step for-loop
			//showTable(freqSparTable);
			
			// add plotting code here ... it will need freqSparTable

				
				showTable(freqSparTable);
				
										
			

		}; // end of doTest
	document.getElementById('test').addEventListener('click',doTest);
	}();
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