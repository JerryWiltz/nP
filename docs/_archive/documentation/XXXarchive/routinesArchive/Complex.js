// A simple Complex Class to represent complex numbers
// Jerry Wiltz 11/23/16
//
function Complex(real, imaginary) {
  ;var c=((this!=Window)&&this) // per quote(if unspecified, this will be undefined.. Window) of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
  ||Object.create(Complex)   
  ;c.x = real
  ;c.y = imaginary
  ;return c
}

Complex.prototype.in = function() {return this.test;}

Complex.prototype.add = function(a) {
  return new Complex(this.x + a.x, this.y + a.y);
}

Complex.prototype.sub = function(a) {
  return new Complex(this.x - a.x, this.y - a.y);
}

Complex.prototype.mul = function(a) {
  return new Complex(this.x * a.x - this.y * a.y, this.x * a.y + this.y * a.x);
}

Complex.prototype.div = function(a) {
  return new Complex((this.x * a.x + this.y * a.y)/(a.x * a.x + a.y * a.y), (a.x * this.y - this.x * a.y)/(a.x * a.x + a.y * a.y));
}

Complex.prototype.inv = function(a) {
  return new Complex((1 * this.x + 0 * this.y)/(this.x * this.x + this.y * this.y), (this.x * 0 - 1 * this.y)/(this.x * this.x + this.y * this.y));
}

Complex.prototype.neg = function() {
  return new Complex(-this.x, -this.y);
}

Complex.prototype.getR = function() {
  return this.x;
}

Complex.prototype.setR = function(x) {
  this.x = x;
}

Complex.prototype.getI = function() {
  return this.y;
}

Complex.prototype.setI = function(y) {
  this.y = y;
}

Complex.prototype.mag = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y);
}

Complex.prototype.ang = function() {
  return Math.atan2(this.y, this.x) * (180/Math.PI);
}




