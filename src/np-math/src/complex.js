function Complex() {}

Complex.prototype = {
	constructor: Complex,
	set: function(real, imaginary) { this.x = real; this.y = imaginary; return this },
	
	getR: function () {return this.x;},	  
	getI: function () {return this.y;}, 

	setR: function (R) {this.x = R; return this;}, // added return this to fix issue with nP.log
	setI: function (I) {this.y = I; return this;},	

	add: function (c2) {return complex(this.x + c2.x, this.y + c2.y);},
	sub: function (c2) {return complex(this.x - c2.x, this.y - c2.y);},
	mul: function (c2) {return complex(this.x * c2.x -this.y * c2.y, this.x * c2.y + this.y * c2.x);},		
	div: function (c2) {return complex(
		(this.x * c2.x + this.y * c2.y)/(c2.x * c2.x + c2.y * c2.y),
		(c2.x * this.y - this.x * c2.y)/(c2.x * c2.x + c2.y * c2.y));},	
	inv: function () {return complex(
		(1 * this.x + 0 * this.y)/(this.x * this.x + this.y * this.y),
		(this.x * 0 - 1 * this.y)/(this.x * this.x + this.y * this.y));},	
	neg: function () {return complex(-this.x, -this.y);},
	copy: function () {return complex(this.x, this.y);},

	mag: function () {return Math.sqrt(this.x * this.x + this.y * this.y);},
	ang: function () {return Math.atan2(this.y, this.x) * (180/Math.PI);},
	mag10dB: function () {return 10 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   },
	mag20dB: function () {return 20 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   },

	sinhCplx: function () {return complex(Math.sinh(this.x)*Math.cos(this.y), Math.cosh(this.x)*Math.sin(this.y));},
	coshCplx: function () {return complex(Math.cosh(this.x)*Math.cos(this.y), Math.sinh(this.x)*Math.sin(this.y));}
};

export function complex(real, imaginary) {
	var complex = new Complex ;
	complex.set(real, imaginary)
	return complex;
};
