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
		
		plotArea.innerHTML =	'<svg height="300px" width="300px">' +
									'<rect id="myRect" height="290px" width="290px" fill="blue"/>' +
								'</svg>';
		
		// add plotting code here ... it will need freqSparTable
		//      var myPlot = linearPlot(freqSparTable, fstart, fstop, fstep, dBstart, dBstop, dBstep)
		//      var myPlst = smithPlot(freqSparTable, fstart, fstop, fstep)
		
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

