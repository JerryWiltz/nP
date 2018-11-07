(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.nP = {})));
}(this, (function (exports) { 'use strict';

	function helloNport() {
	return 'Hello, Nport!';
	}

	exports.helloNport = helloNport;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
