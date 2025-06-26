// complexProto.js

//var c1 = complex(2, -3) and var c1 = complex(5, 8)
function complexProto (real, imaginary) {
	//Private variables
	this.x = real;
	this.y = imaginary;
}
	

complexProto.prototype.getR = function () {return this.x;};	  
complexProto.prototype.getI = function () {return this.y;}; 
complexProto.prototype.setR = function (R) {this.x = R;};
complexProto.prototype.setI = function (I) {this.y = I;};	
complexProto.prototype.print = function() {console.log(this.x + " " + this.y);};
complexProto.prototype.add = function (c2) {return new complexProto(this.x + c2.x, this.y + c2.y);}; // returning complex allows method chaining :)
complexProto.prototype.sub = function (c2) {return new complexProto(this.x - c2.this.x, this.y - c2.this.y);};
complexProto.prototype.mul = function (c2) {return new complexProto(this.x * c2.this.x - this.y * c2.this.y, this.x * c2.this.y + this.y * c2.this.x);};
complexProto.prototype.div = function (c2) {return new complexProto((this.x * c2.this.x + this.y * c2.this.y)/(c2.this.x * c2.this.x + c2.this.y * c2.this.y), (c2.this.x * this.y - this.x * c2.this.y)/(c2.this.x * c2.this.x + c2.this.y * c2.this.y));};
complexProto.inv = function () {return new complexProto((1 * this.x + 0 * this.y)/(this.x * this.x + this.y * this.y), (this.x * 0 - 1 * this.y)/(this.x * this.x + this.y * this.y));},
complexProto.neg = function () {return new complexProto(-this.x, -this.y);};
complexProto.prototype.mag = function () {return Math.sqrt(this.x * this.x + this.y * this.y);};
complexProto.prototype.ang = function () {return Math.atan2(this.y, this.x) * (180/Math.PI);};
complexProto.prototype.magDB10 = function () {return 10 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   };
complexProto.prototype.magDB20 = function () {return 20 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   };


