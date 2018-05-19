(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.nP = {})));
}(this, (function (exports) { 'use strict';

	var global = {
		fList:	[2e9],
		Ro:		50,
		Temp:	293,
		fGen: function fGen (fStart, fStop, points) {
	  		var out = [];
	  		var fStep = (fStop-fStart)/(points-1);
	  		var fMax = fStart;
	 		var i = 0; 
			  for (i = 0; i < points; i++, fMax += fStep ) {
	   			 out.push(fMax);
	 		 }
	  		return out;
		},
	};

	exports.global = global;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
