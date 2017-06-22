// lowpassTest.js

define(['app/lowpassSetup', 'app/complex', 'app/nport'], function (lowpassSetup, complex, nport){
"use strict";
	return function lowpassTest(ROOT) {
	"use strict";
		var doTest = function doTest() {		
	
		console.log('Method using cas to determine the spars');
		var r1 = nport('parallelRLCinSeries', 430, false, false, 2e9);
		var r2 = nport('seriesRLCinSeries', 10, false, false, 2e9);
		var r3 = nport('parallelRLCinSeries', 430, false, false, 2e9);
		var r4 = r1.cas(r2).cas(r3); // Here is the cas method ...
		r4.printNportSpars();
		
		console.log(' ');
		
		console.log('Method using nodal to determine the spars');
		var r5 = nport('nodal', [[r1, 1, 2],
								 [r2, 2, 3],
								 [r3, 3, 4],
								 [[1,2], 1, 4]] );
		r5.printNportSpars();
		
		}	
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