// Complex.js

define(function(){
"use strict";
// https://gist.github.com/jonnyreeves/2474026	
			
	function Complex(real, imaginary) {		
		this.x = real;
		this.y = imaginary;
	}
	
	Complex.create = function (x, y) {
	var result = new Complex(x, y);
	return result;
	};
		
	Complex.prototype = {
		
		constructor: Complex,
		
		add : function(a) {
			return new Complex(this.x + a.x, this.y + a.y);
		},

		sub : function(a) {
			return new Complex(this.x - a.x, this.y - a.y);
		},

		mul : function(a) {
			return new Complex(this.x * a.x - this.y * a.y, this.x * a.y + this.y * a.x);
		},

		div : function(a) {
			return new Complex((this.x * a.x + this.y * a.y)/(a.x * a.x + a.y * a.y), (a.x * this.y - this.x * a.y)/(a.x * a.x + a.y * a.y));
		},

		inv : function(a) {
			return new Complex((1 * this.x + 0 * this.y)/(this.x * this.x + this.y * this.y), (this.x * 0 - 1 * this.y)/(this.x * this.x + this.y * this.y));
		},

		neg : function() {
			return new Complex(-this.x, -this.y);
		},
	
		getR : function() {
			return this.x;
		},
		
		setR : function(x) {
			this.x = x;
		},

		getI : function() {
			return this.y;
		},

		setI : function(y) {
			this.y = y;
		},

		mag : function() {
			return Math.sqrt(this.x * this.x + this.y * this.y);
		},

		ang : function() {
			return Math.atan2(this.y, this.x) * (180/Math.PI);
		},
	
	}
 	
	return Complex;	
});