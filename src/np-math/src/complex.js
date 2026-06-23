function Complex() {}

Complex.prototype = {
	constructor: Complex,
	set: function(real, imaginary) { this.x = real; this.y = imaginary; return this; },

	getR: function () {return this.x;},	  
	getI: function () {return this.y;}, 

	setR: function (R) {this.x = R; return this;},
	setI: function (I) {this.y = I; return this;},

	add: function (c2) {return complex(this.x + c2.x, this.y + c2.y);},
	sub: function (c2) {return complex(this.x - c2.x, this.y - c2.y);},
	mul: function (c2) {return complex(this.x * c2.x - this.y * c2.y, this.x * c2.y + this.y * c2.x);},
	div: function (c2) {
		var denominator = c2.x * c2.x + c2.y * c2.y;
		return complex(
			(this.x * c2.x + this.y * c2.y) / denominator,
			(c2.x * this.y - this.x * c2.y) / denominator
		);
	},
	inv: function () {
		var denominator = this.x * this.x + this.y * this.y;
		return complex(this.x / denominator, -this.y / denominator);
	},
	neg: function () {return complex(-this.x, -this.y);},
	copy: function () {return complex(this.x, this.y);},

	mag: function () {return Math.sqrt(this.x * this.x + this.y * this.y);},
	ang: function () {return Math.atan2(this.y, this.x) * (180/Math.PI);},
	mag10dB: function () {return 10 * Math.log(this.mag()) / Math.LN10;},
	mag20dB: function () {return 20 * Math.log(this.mag()) / Math.LN10;},

	sinhCplx: function () {return complex(Math.sinh(this.x) * Math.cos(this.y), Math.cosh(this.x) * Math.sin(this.y));},
	coshCplx: function () {return complex(Math.cosh(this.x) * Math.cos(this.y), Math.sinh(this.x) * Math.sin(this.y));}
};

export function complex(real, imaginary) {
	var complexNumber = new Complex;
	complexNumber.set(real, imaginary);
	return complexNumber;
};
