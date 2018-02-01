// complex.js
// By Jerry Wiltz on 6/5/2017
define([],function (){
//define(function(){
"use strict";
	//var c1 = complex(2, -3) and var c1 = complex(5, 8)
	var complex = function complex (real, imaginary) {
		//Private variables
		var x = real,
			y = imaginary,
		
		// Public functions  
			getR = function getR() {return x;},	  
			getI = function getI() {return y;}, 
			setR = function setR(R) {x = R;},
			setI = function setI(I) {y = I;},	
			print = function print() {console.log(x + " " + y);},	
			add = function add(c2) {return complex(x + c2.x, y + c2.y);}, // returning complex allows method chaining :)
			sub = function sub(c2) {return complex(x - c2.x, y - c2.y);},
			mul = function mul(c2) {return complex(x * c2.x - y * c2.y, x * c2.y + y * c2.x);},
			div = function div (c2) {return complex((x * c2.x + y * c2.y)/(c2.x * c2.x + c2.y * c2.y), (c2.x * y - x * c2.y)/(c2.x * c2.x + c2.y * c2.y));},
			inv = function inv() {return complex((1 * x + 0 * y)/(x * x + y * y), (x * 0 - 1 * y)/(x * x + y * y));},
			neg = function neg() {return complex(-x, -y);},
			mag = function mag() {return Math.sqrt(x * x + y * y);},
			ang = function ang() {return Math.atan2(y, x) * (180/Math.PI);},
			magDB10 = function magDB10 () {return 10 * Math.log(   Math.sqrt(x * x + y * y) )/2.302585092994046   },
			magDB20 = function magDB20 () {return 20 * Math.log(   Math.sqrt(x * x + y * y) )/2.302585092994046   };
		return {
		// The object data (what shows in JSON.stringify(c1) for example) 
			name : 'complex',
			x : x,
			y : y,
			
		// The ojbect methods  
			getR  : getR,	  
			getI  : getI,
			setR  : setR,
			setI  : setI,
			print : print,	
			add   : add,
			sub   : sub,
			mul   : mul,
			div   : div,
			inv   : inv,
			neg   :  neg,
			mag   :  mag,
			ang   :  ang,
			magDB10 : magDB10,
			magDB20 : magDB20
		};
	};
return complex;	
});
