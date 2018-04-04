// Requires Complex.js
//
// A Class to represent multiport RF networks
// Jerry Wiltz 11/23/16
//
// from JavaScript: The Definitive Guide page 227
//
//
function Nport() {
  this.spars = [];               // The Nport s-parameters
  this.fscale = 1e6;             // Default is MHz
  this.Zo = new Complex(50,0);   // Default is 50 Ohms
  this.Yo = (this.Zo).inv();     // Default is 0.02 Mohos;

}

Nport.prototype.getSpars = function() {return this.spars;}  // this works
Nport.prototype.getYo = function() {return this.Yo;}  // this works

Nport.prototype.inOutOnePort = function () { // A generic input and output port
	var s11 = new Complex (1,0);	
  this.spars = [[s11]];
}

Nport.prototype.seriesZspars = function (Z) { // not tested
  var Zo = this.Zo;
  var Two = new Complex(2,0);
  var s11 = Z.div(Z.add(Zo.add(Zo)));
  var s21 = (Two.mul(Zo)).div(Z.add(Zo.add(Zo)));
  var s12 = s21;
  var s22 = s11;
  this.spars = [[s11, s12],
				[s21, s22]];
}

Nport.prototype.seriesRspars = function (seriesR) { // this works 12/9/16
  var Z = new Complex(seriesR,0);
  var Zo = this.Zo;
  var Two = new Complex(2,0);
  var s11 = Z.div(Z.add(Zo.add(Zo)));
  var s21 = (Two.mul(Zo)).div(Z.add(Zo.add(Zo)));
  var s12 = s21;
  var s22 = s11;
   this.spars = [[s11, s12],
				[s21, s22]];
}

Nport.prototype.seriesLspars = function (seriesL, F) { // this works 12/9/16
  var fscale = this.fscale;
  var Z = new Complex(0,2*Math.PI*F*fscale*seriesL);
  var Zo = this.Zo;
  var Two = new Complex(2,0);
  var s11 = Z.div(Z.add(Zo.add(Zo)));
  var s21 = (Two.mul(Zo)).div(Z.add(Zo.add(Zo)));
  var s12 = s21;
  var s22 = s11;
  this.spars = [[s11, s12],
				[s21, s22]];
}

Nport.prototype.shuntYspars = function (shuntY) { // not tested
  var Yo = this.Yo;    
  var Two = new Complex(2,0);
  var s11 = (shuntY.neg()).div(shuntY.add(Yo.add(Yo)));
  var s21 = (Two.mul(Yo)).div(shuntY.add(Yo.add(Yo)));  
  var s12 = s21;
  var s22 = s11;
  this.spars = [[s11, s12],
				[s21, s22]];
}

Nport.prototype.shuntRspars = function (shuntR) { // this works 12/9/16
  var R = new Complex(shuntR,0);
  var Y = R.inv();
  var Yo = this.Yo;    
  var Two = new Complex(2,0);
  var s11 = (Y.neg()).div(Y.add(Yo.add(Yo)));
  var s21 = (Two.mul(Yo)).div(Y.add(Yo.add(Yo)));  
  var s12 = s21;
  var s22 = s11;
  this.spars = [[s11, s12],
				[s21, s22]];
}

Nport.prototype.shuntCspars = function (shuntC, F) { // this works 12/9/16
  var fscale = this.fscale;
  var Z = new Complex(0,-1/(2*Math.PI*F*fscale*shuntC));
  var Y = Z.inv();
  var Yo = this.Yo;    
  var Two = new Complex(2,0);
  var s11 = Y.neg()      .div(Y.add(Yo.add(Yo)));
  var s21 = (Two.mul(Yo)).div(Y.add(Yo.add(Yo)));  
  var s12 = s21;
  var s22 = s11;
  this.spars = [[s11, s12],
				[s21, s22]];
}

Nport.prototype.dummyThreePort = function () { // this is a dummy 3 way Nport
	var s11 = new Complex (4,0);
	var s12 = new Complex (5,0);
	var s13 = new Complex (6,0);
	
	var s21 = new Complex (7,0);
	var s22 = new Complex (8,0);
	var s23 = new Complex (9,0);
	
	var s31 = new Complex (10,0);
	var s32 = new Complex (11,0);
	var s33 = new Complex (12,0);
	
  this.spars = [[s11, s12, s13],
				[s21, s22, s23],
				[s31, s32, s33]];
}				