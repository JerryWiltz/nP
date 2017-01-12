function Complex(re, im) {
  this.x = re;
  this.y = im;
}

Complex.Add = function(a, b) {
  return new Complex(a.x + b.x, a.y + b.y);
}

Complex.Subtract = function(a, b) {
  return new Complex(a.x - b.x, a.y - b.y);
}

Complex.Multiply = function(a, b) {
  return new Complex(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

Complex.Divide = function(a, b) {
  return new Complex(  (a.x * b.x + a.y * b.y)/(b.x * b.x + b.y * b.y)  , (b.x * a.y - a.x * b.y)/(b.x * b.x + b.y * b.y)  );
}

Complex.Series = function(a, b) {
  return new Complex(a.x + b.x, a.y + b.y);
}

Complex.Parallel = function(a, b) {
  var numerator = new Complex.Multiply(a, b);
  var denominator = new Complex.Add(a, b);
return new Complex.Divide(numerator, denominator); 
}  

Complex.s11 = function(z, zo) {
  var numerator = new Complex.Subtract(z, zo);
  var denominator = new Complex.Add(z, zo);
return new Complex.Divide(numerator, denominator); 
} 

Complex.s21 = function(s11) {
  var one = new Complex(1, 0);
return new Complex.Subtract(one, s11); 
}

Complex.prototype.getRe = function() {
  return this.x;
}

Complex.prototype.setRe = function(x) {
  this.x = x;
}

Complex.prototype.getIm = function() {
  return this.y;
}

Complex.prototype.setIm = function(y) {
  this.y = y;
}

Complex.prototype.magnitude = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y);
}

Complex.prototype.angle = function() {
  return Math.atan2(this.y, this.x);
}

Complex.negative = function(a) {
return new Complex(-a.x, -a.y);
}



