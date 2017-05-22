// lowpassTest.js

define(['app/lowpassSetup', 'app/Complex'], function (lowpassSetup, Complex){
"use strict";
	return function lowpassTest(ROOT) {
	"use strict";
		var doTest = function () {	

			// put the doTest function code here
			// form the test matrix
			// solve the test matrix
			// put the results in a table
			// plot the results on a graph

		}	
		ROOT.testButtonElement().addEventListener("click",doTest);

	}(lowpassSetup);
});
