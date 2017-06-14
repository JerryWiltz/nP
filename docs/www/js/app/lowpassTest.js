// lowpassTest.js

define(['app/lowpassSetup', 'app/complex', 'app/nport'], function (lowpassSetup, complex, nport){
"use strict";
	return function lowpassTest(ROOT) {
	"use strict";
		var doTest = function doTest() {		
		
		//var r1 = nport('seriesRLCinSeries', 292.4, 5e-9, 1e-12, 1e9 );			//292.4, 5e-9, 1e-12, 1e9 ); 75, 'none', 'none', 2e9
		//var r2 = nport('seriesRLCinSeries', 292.4, 5e-9, 1e-12, 1e9 );			//292.4, 5e-9, 1e-12, 1e9 );
		//var r3 = nport('seriesRLCinSeries', 292.4, 5e-9, 1e-12, 1e9 );		//17.6, 5e-9, 1e-12, 1e9 
		//var r4 = nport('seriesRLCinSeries', 292.4, 5e-9, 1e-12, 1e9 );
		

		//var r5 = r1.parallel(r2);
		//var r6 = r3.parallel(r4);

		//var r7 = r5.cas(r6);

		//console.log('292.4, 5e-9, 1e-12, 1e9');
		//r1.printNportSpars();
		//console.log('4 by 292.4, 5e-9, 1e-12, 1e9  in array = 292.4, 5e-9, 1e-12, 1e9 ');
		//r7.printNportSpars();
		
		var r8 = nport('parallelRLCinSeries', 75, 'none', 'none', 2e9);	
		r8.printNportSpars();
		var r9 = nport('nodal', r8);
		r9.printNportSpars();
		//var r10 = r9.clone();
		//r10.printNportSpars();
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