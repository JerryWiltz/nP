// lowpassTest.js

define(['app/lowpassSetup', 'app/complex', 'app/nport', 'app/matrix'], function (lowpassSetup, complex, nport, matrix){
"use strict";
	return function lowpassTest(ROOT) {
	"use strict";
		var doTest = function doTest() {
			
			var start = 0, stop = 2.3e9 , step = 20e6, F, count = 0;
			//for (row = 0 + 2; row < 2 + 2; row++) {
			//for (start = 0; start < stop; start += step) {
			count++;
			//console.log(start);
			
				
				(function () {
					//F = start; //10e8/700
				/*	
				var r1 = nport('seriesRLCinSeries', 75, false, false, false);
				var r2 = nport('nodal', [[r1, 1, 2],
										 ['out', 1, 4]] );
				showTable(r2.getSpars());						 
				
					
					var zero = complex(0, 0);
					var a = complex(2, 3);
					showTable([[a.neg()]]);
					showTable([[zero.sub(a)]]);
				
					var myA1 = [[0.00300, 59.14],  //, 59.17],
							   [5.291,  -6.130]];  //, 46.78]];

					//var myA1 = [[0.00300, 59.14],
					//		   [5.291,  -6.130]];

					var myB = [[5.291,  -6.130],  //, 46.78],
							   [0.00300, 59.14]];  //, 59.17]];
							   
							   
								   
					var myA11 = [[-1, 1, 2],
							   [3, -1, 1],
							   [-1, 3, 4]];

					var myB = [[1, -1, 2],
							   [2, 0, 3],
							   [0, 1, -1]];
							   
					//var myC = matrix.invert(myA);
					var myD = matrix.invert(myB);
					//showTable(myC);
					//console.log(JSON.stringify(myC));
					showTable(myD);
					//console.log(JSON.stringify(myD));
					//showTable(myA);
					//showTable(myB);
					
								
					var myA = [[complex(1,0), complex(3,0)],
							   [complex(2,0), complex(4,0)]];
								   
					var myB = [[complex(1,0), complex(2,0), complex(3,0)],
							   [complex(4,0), complex(5,0), complex(6,0)],
							   [complex(7,0), complex(8,0), complex(9,0)]];
							   
					var myC = matrix.addCmplx(myA, myB);
					showTable(myA);
					showTable(myB);
					showTable(myC);
								   
								   
					var myTable = [[-1,  1, 2, 2],
								   [ 3, -1, 1, 6],
								   [-1,  3, 4, 4]];
					
					
					var myTable1 = [[-1,  1, 2, 1, 0, 0],
								   [ 3, -1, 1, 0, 1, 0],
								   [-1,  3, 4, 0, 0, 1]];
								   
					var myTable2 =  [[-1,  1, 2,  2, 1, 0, 0, 0],
									[ 3, -1, 1,  1, 0, 1, 0, 0],
									[-1,  3, 4, -2, 0, 0, 1, 0],
									[ 2,  5, 2,  1, 0, 0, 0, 1]];			   
								   
					showTable(myTable);
					
					//var outTable = matrix.solve(myTable);
					//showTable(outTable);
					*/
					//console.log('Method using cas to determine the spars');
					//var r1 = nport('parallelRLCinSeries', false, false, 1.64e-11, F);
					//var r2 = nport('seriesRLCinSeries', false, 4.57e-8, false, F);
					//var r3 = nport('parallelRLCinSeries', false, false, 1.64e-11, F);
					
					//var r1 = nport('seriesRLCinSeries', 75/3, false, false, false); // 420
					//showTable(r1.getSpars());
					//var r2 = nport('seriesRLCinSeries', 75/3, false, false, false);    // 10
					//showTable(r2.getSpars());
					//var r3 = nport('seriesRLCinSeries', 75/3, false, false, false); // 420
					//var r3 = nport('parallelRLCinSeries', 75/3, false, false, false); // 420
					
					//showTable(r3.getSpars());
					
					//var r1 = nport('parallelRLCinSeries', 75/2.2, false, false, F); // 420
					//var r2 = nport('seriesRLCinSeries', false, 5e-9, false, F);    // 10
					//var r3 = nport('seriesRLCinSeries', false, false, 1e-12, F); // 420
					//console.time('cas');
					//var r4 = r1.cas(r2).cas(r3); // Here is the cas method ...
					//console.timeEnd('cas');
					//showTable(r4.getSpars());
					//console.log(F/1e9);
					//r4.printNportdB();
					

					
					//showTable(r1.getSpars());
					
					//console.log(' ');
					
					//console.log('Method using nodal to determine the spars');
					//console.time('nodal');
					/*
					var r1 = nport('sparsSingle', [[complex(1,0), complex(2,0), complex(3,0)],
													[complex(4,0), complex(5,0), complex(6,0)],
													[complex(7,0), complex(8,0), complex(9,0)]]  );
					*/
					
					
					var r1 = nport('sparsSingle', [[complex(1,0), complex(2,0)],
												   [complex(3,0), complex(4,0)]]  );
					
							   
							   
					var r5 = nport('nodal', [[r1, 11, 2],
											 [r1, 2, 3],
											 //[r3, 3, 4],
											 ['out', 11, 3]] );
					//console.timeEnd('nodal');
					//showTable(r5.getSpars());
					//console.log(JSON.stringify(r5));
					//r5.printNportdB();
					
				}())
				
			//} // end of frequency step for-loop
			//console.log(count);
				
		} // end of doTest	
		ROOT.testButtonElement().addEventListener("click",doTest);

	}(lowpassSetup);
});


/*
ak	bk	gk	R,C,L
UNDEF	UNDEF	1.00e+0	5.00e+1
5.00e-1	1.69e+0	1.03e+0	1.64e-11
1.00e+0	1.69e+0	1.15e+0	4.57e-8
5.00e-1	9.40e-1	1.03e+0	1.64e-11
UNDEF	UNDEF	1.00e+0	5.00e+1
*/