(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.foo = global.foo || {})));
}(this, (function (exports) { 'use strict';

	function foo() { console.log('foo');}

	// main entry point

	exports.foo = foo;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
