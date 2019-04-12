(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :   // Node, CommonJS
		typeof define === 'function' && define.amd ? define(['exports'], factory) : // AMD
		(global = global || self, factory(global.nP = {})); 		            // Browser globals
}(this, function (exports) { 'use strict';

	function first () {
		return console.log('Jerry');
	}

	function last () {
		return console.log('Wiltz');
	}

	exports.first = first;
	exports.last = last;
	exports.middle = 'gary';

	Object.defineProperty(exports, '__esModule', { value: true });

}));
