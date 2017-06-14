// complex.js
// By Jerry Wiltz on 6/5/2017
define(function(){
"use strict";
	//var c1 = complex(2, -3) and var c1 = complex(5, 8)
	var complex = function complex (real, imaginary) {
	  // https://www.youtube.com/watch?v=5rwuKH-zdos
		//Private variables
		var x = real,
			y = imaginary;
		
		// Public functions  
		var getR = function getR() {return x;};	  
		var getI = function getI() {return y;}; 
		var setR = function setR(R) {x = R;};
		var setI = function setI(I) {y = I;};	
		var print = function print() {console.log(x + " " + y);};	
		var add = function add(c2) {return complex(x + c2.getR(), y + c2.getI());};
		var sub = function sub(c2) {return complex(x - c2.getR(), y - c2.getI());};
		var mul = function mul(c2) {return new complex(x * c2.getR() - y * c2.getI(), x * c2.getI() + y * c2.getR());};
		var div = function div (c2) {return new complex((x * c2.getR() + y * c2.getI())/(c2.getR() * c2.getR() + c2.getI() * c2.getI()), (c2.getR() * y - x * c2.getI())/(c2.getR() * c2.getR() + c2.getI() * c2.getI()));};
		var inv = function inv() {return new complex((1 * x + 0 * y)/(x * x + y * y), (x * 0 - 1 * y)/(x * x + y * y));};
		var neg = function neg() {return new complex(-x, -y);};
		var mag = function mag() {return Math.sqrt(x * x + y * y);};
		var ang = function ang() {return Math.atan2(y, x) * (180/Math.PI);};
		 
		return {
		// The object data (what shows in JSON.stringify(c1) for example) 
			name : 'complex',
			x : getR(),
			y : getI(),
			
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
			ang   :  ang
		};
	  
	};
return complex;	
});
