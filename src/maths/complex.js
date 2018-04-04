function Complex() {}

Complex.prototype = complex.prototype = {
	constructor: Complex,
	set: function(real, imaginary) { this.x = real; this.y = imaginary; return this },
	getR: function () {return this.x;},	  
	getI: function () {return this.y;}, 
	setR: function (R) {this.x = R;},
	setI: function (I) {this.y = I;},	
	print: function() {console.log(this.x + " " + this.y);},
	add: function (c2) {return complex(this.x + c2.x, this.y + c2.y);}, // returning complex allows method chaining :)
	sub: function (c2) {return complex(this.x - c2.this.x, this.y - c2.this.y);},
	mul: function (c2) {return complex(this.x * c2.this.x - this.y * c2.this.y, this.x * c2.this.y + this.y * c2.this.x);},
	div: function (c2) {return complex((this.x * c2.this.x + this.y * c2.this.y)/(c2.this.x * c2.this.x + c2.this.y * c2.this.y), (c2.this.x * this.y - this.x * c2.this.y)/(c2.this.x * c2.this.x + c2.this.y * c2.this.y));},
	inv: function () {return complex((1 * this.x + 0 * this.y)/(this.x * this.x + this.y * this.y), (this.x * 0 - 1 * this.y)/(this.x * this.x + this.y * this.y));},
	neg: function () {return complex(-this.x, -this.y);},
	mag: function () {return Math.sqrt(this.x * this.x + this.y * this.y);},
	ang: function () {return Math.atan2(this.y, this.x) * (180/Math.PI);},
	magDB10: function () {return 10 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   },
	magDB20: function () {return 20 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   },
};

function complex(real, imaginary) {
  var complex = new Complex ;
  
  if (typeof real === 'number' && typeof imaginary === 'number') complex.set(real, imaginary);

  return complex;
}

export default complex