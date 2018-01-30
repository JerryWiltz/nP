// lowPassTest.js

define(['app/storage', 'app/complex', 'app/nport', 'app/matrix', 'app/scatterPlot'], function (storage, complex, nport, matrix, scatterPlot){
"use strict";
	return function lowPassTest() {
	"use strict";
		// Define the "click" function
		var doTest = function doTest() {

			var startFreq = parseFloat(document.getElementById('startFreq').value),
				stopFreq = parseFloat(document.getElementById('stopFreq').value),
				stepFreq = parseFloat(document.getElementById('stepFreq').value),
				//plotArea = document.getElementById('plotArea'),
				
				frequencyUnits = parseFloat(document.getElementById('frequencyUnits').value),
				
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
			freqSparTable = matrix.dimension(Math.ceil( (stopFreq - startFreq)/stepFreq)  , 3, 0);
			count = 0; //F = .2 * frequencyUnits;
			for (F = startFreq * frequencyUnits; F < stopFreq * frequencyUnits; F += stepFreq * frequencyUnits) {				
				(function sweep() {;
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
					freqSparTable[count][0] = (F/frequencyUnits).toPrecision(5);
					freqSparTable[count][1] = lowPassComponents[lowPassComponents.length-1][2].getSpars()[0][0].magDB20().toPrecision(10);
					freqSparTable[count][2] = lowPassComponents[lowPassComponents.length-1][2].getSpars()[0][1].magDB20().toPrecision(10);
				}());
			count++; 				
			} // end of frequency step for-loop
			var headers = ['Freq, GHz', 'Return Loss', 'Insertion loss']
			freqSparTable.unshift(headers);
			//showTable(freqSparTable);
//



//
			
			// add plotting code here ... it will need freqSparTable
			var myFilt = [
               ['Freq', 'Insertion Loss', 'Return Loss', 'Noise Figure'],
               [ 40,  20,  30, 50],
               [ 80,  22,  40, 55],
               [120,  80,  90, 60],
               [160, 100, 105, 65],
               [200, 120, 130, 70]];
               
			//input object
			var myFilterInputObject = {
			  //inputTable : myFilt,
			  inputTable : freqSparTable,
			  canvasId : '#canvas',
			  //xMin : 30, xMax : 210, yMin : 10, yMax : 140,
			  xMin : 0, xMax : 10, yMin : -100, yMax : 0,
			  xAxisTitle : 'Frequency, GHz', yAxisTitle : 'dB'
			}
			scatterPlot(myFilterInputObject);
			//console.log('lowPassTest complete');
		}; // end of doTest
	document.getElementById('test').addEventListener('click',doTest);
	}();

});				