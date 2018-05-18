(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.nP = {})));
}(this, (function (exports) { 'use strict';

	// global variables will go here

	var global = {
		fList:	[2e9],
		Ro:		50,
		Temp:	293,
	};

	exports.global = global;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
