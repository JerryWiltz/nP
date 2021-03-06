(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.nP = {})));
}(this, (function (exports) { 'use strict';

	function Complex() {}

	Complex.prototype = {
		constructor: Complex,
		set: function(real, imaginary) { this.x = real; this.y = imaginary; return this },
		getR: function () {return this.x;},	  
		getI: function () {return this.y;}, 
		setR: function (R) {this.x = R;},
		setI: function (I) {this.y = I;},	
		print: function() {console.log(this.x + " " + this.y);},

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
		mag: function () {return Math.sqrt(this.x * this.x + this.y * this.y);},
		ang: function () {return Math.atan2(this.y, this.x) * (180/Math.PI);},
		mag10dB: function () {return 10 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   },
		mag20dB: function () {return 20 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   },
		sinhCplx: function () {return complex(Math.sinh(this.x)*Math.cos(this.y), Math.cosh(this.x)*Math.sin(this.y));},
		coshCplx: function () {return complex(Math.cosh(this.x)*Math.cos(this.y), Math.sinh(this.x)*Math.sin(this.y));}
	};

	function complex(real, imaginary) {
		var complex = new Complex ;
		complex.set(real, imaginary);
		return complex;
	}

	function nPort() {}
	nPort.prototype = {
		constructor: nPort,
		setglobal: function (global) { this.global = global; },
		getglobal: function () {return this.global;},
		setspars: function (sparsArray) { this.spars = sparsArray; },
		getspars: function () { return this.spars; },
		cas: function cas (n2) { // cascade two 2-ports along with method chaining since it returns an nPort
			var freqCount = 0, one = complex(1,0),
				sparsA = this.getspars(),
				sparsB = n2.getspars(),
				s11, s12, s21, s22, s11a, s12a, s21a, s22a, s11b, s12b, s21b, s22b, sparsArray = [];
			for (freqCount = 0; freqCount < this.spars.length; freqCount++) {
				s11a = sparsA[freqCount][1]; s12a = sparsA[freqCount][2]; s21a = sparsA[freqCount][3]; s22a = sparsA[freqCount][4];			
				s11b = sparsB[freqCount][1]; s12b = sparsB[freqCount][2]; s21b = sparsB[freqCount][3]; s22b = sparsB[freqCount][4];

				s11 = s11a.add (( s12a.mul(s11b).mul(s21a) ).div( (one.sub( s22a.mul(s11b) ) ) ) );
				s12 =           ( s12a.mul(s12b)           ).div( (one.sub( s22a.mul(s11b) ) ) )  ;
				s22 = s22b.add (( s21b.mul(s22a).mul(s12b) ).div( (one.sub( s22a.mul(s11b) ) ) ) );
				s21 =           ( s21a.mul(s21b)           ).div( (one.sub( s22a.mul(s11b) ) ) )  ;
				//sparsArray[freqCount] =	[this.spars[freqCount][0],s11, s12, s21, s22];
				sparsArray[freqCount] =	[sparsA[freqCount][0],s11, s12, s21, s22];
			}		var casOut = new nPort();
			casOut.setspars(sparsArray);
			casOut.setglobal(this.global);
			return casOut;
		},
		out : function out (...sparsArguments) {
			var spars = this.getspars();
			var n = Math.sqrt(spars[0].length - 1); 
			var copy = spars.map(function (element,index,spars) {
				var inner = [element[0]];
				sparsArguments.forEach(function (sparsArgument,index1,array) {
					var row = parseInt(sparsArgument.match(/\d/g)[0]);
					var col = parseInt(sparsArgument.match(/\d/g)[1]);
					var sparIndex = (row - 1) * n + col;
					var sparsTo = sparsArgument.match(/dB|mag|ang|Re|Im/).toString();
					if(sparsTo === 'mag') {inner.push(element[sparIndex].mag());}				if(sparsTo === 'dB')  {inner.push(element[sparIndex].mag20dB());}				if(sparsTo === 'ang') {inner.push(element[sparIndex].ang());}				if(sparsTo === 'Re')  {inner.push(element[sparIndex].getR());}
					if(sparsTo === 'Im')  {inner.push(element[sparIndex].getI());}
				});  // end of forEach
				return inner;
			}); // end of map
			sparsArguments.unshift('Freq');
			copy.unshift(sparsArguments);
			return copy;
		},
	};

	var global = {
		fList:	[2e9],//[2e9, 4e9, 6e9, 8e9],
		Ro:	50,
		Temp:	293,
		fGen: function fGen (fStart, fStop, points) {
			var out = [];
			var fStep = (fStop-fStart)/(points-1);
			var fMax = fStart;
			var i = 0; 
			for (i = 0; i < points; i++, fMax += fStep ) {
				out.push(fMax);
			}
			return out;
		},
	};

	function seR(R = 75) { // series resistor nPort object
		var seR = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 0);
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	
		seR.setspars(sparsArray);
		seR.setglobal(global);
		return seR;
	}

	function paR(R = 75) { // parallel resistor nPort object
		var paR = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 0);
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paR.setspars(sparsArray);
		paR.setglobal(global);	
		return paR;
	}

	function seL(L = 5e-9) { // series inductor nPort object
		var seL = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, 2*Math.PI*L*frequencyList[freqCount]);	
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	seL.setspars(sparsArray);
		seL.setglobal(global);	
		return seL;
	}

	function paL(L = 5e-9) { // parallel capacitor nPort object   
		var paL = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, 2*Math.PI*L*frequencyList[freqCount]);
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paL.setspars(sparsArray);
		paL.setglobal(global);				
		return paL;
	}

	function seC(C = 1e-12) { // series inductor nPort object
		var seC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, -1/(2*Math.PI*C*frequencyList[freqCount]));	
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	seC.setspars(sparsArray);
		seC.setglobal(global);	
		return seC;
	}

	function paC(C = 1e-12) { // parallel capacitor nPort object   
		var paC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, -1/(2*Math.PI*C*frequencyList[freqCount]));
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paC.setspars(sparsArray);
		paC.setglobal(global);				
		return paC;
	}

	function trf(N = 0.5) { // parallel resistor nPort object
		var trf = new nPort;
		var e = 1e-7;
		var frequencyList = global.fList;
		var freqCount = 0, s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex((N**2-1)/(N**2+1),0+e);
			s12 = complex(2*N/(N**2+1),0+e);  
			s21 = complex(2*N/(N**2+1),0+e);  
			s22 = complex((1-N**2)/(N**2+1),0+e);
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		trf.setspars(sparsArray);
		trf.setglobal(global);	
		return trf;
	}

	function trf4Port(N = 0.5) { // parallel resistor nPort object
		var trf4Port = new nPort;
		var frequencyList = global.fList;
		var freqCount = 0, sparsArray = [];
		var s11, s12, s13, s14,
			s21, s22, s23, s24,
			s31, s32, s33, s34,
			s41, s42, s43, s44;
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = s24 = s33 = s42 = complex((N**2)/(N**2+1),0);
			s14 = s23 = s32 = s41 = complex(-N/(N**2+1),0);  
			s12 = s21 = s34 = s43 = complex(N/(N**2+1),0);  
			s13 = s22 = s31 = s44 = complex((1)/(N**2+1),0);
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44];
		}
		trf4Port.setspars(sparsArray);
		trf4Port.setglobal(global);	
		return trf4Port;
	}
	/*                Note: N2 = N**2 N = 0.5, N2 = 0.25

	S11 = S24 = S33 = S42 = N2 / (1 + N2)  //  0.25/1.25 = 0.2
	S14 = S23 = S32 = S41 = -N / (1 + N2)  //  -0.5/1.25 = -0.4
	S12 = S21 = S34 = S43 =  N / (1 + N2)  //   0.5/1.25 = 0.4
	S13 = S22 = S31 = S44 =  1 / (1 + N2)  //     1/1.25 = 0.8
	*/

	function seSeRL(R = 75, L = 5e-9) { // series inductor nPort object
		var seSeRL = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 2*Math.PI*L*frequencyList[freqCount]);	
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	seSeRL.setspars(sparsArray);
		seSeRL.setglobal(global);	
		return seSeRL;
	}

	function paSeRL(R = 75, L = 5e-9) { // parallel capacitor nPort object   
		var paSeRL = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 2*Math.PI*L*frequencyList[freqCount]);
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paSeRL.setspars(sparsArray);
		paSeRL.setglobal(global);				
		return paSeRL;
	}

	function seSeRC(R = 75, C = 1e-12) { // series inductor nPort object
		var seSeRC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, -1/(2*Math.PI*C*frequencyList[freqCount]));	
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	seSeRC.setspars(sparsArray);
		seSeRC.setglobal(global);	
		return seSeRC;
	}

	function paSeRC(R = 75, C = 1e-12) { // parallel capaSeRCitor nPort object   
		var paSeRC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, -1/(2*Math.PI*C*frequencyList[freqCount]));
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paSeRC.setspars(sparsArray);
		paSeRC.setglobal(global);				
		return paSeRC;
	}

	function seSeLC(L = 5e-9, C = 1e-12) { // series inductor nPort object
		var seSeLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, 2*Math.PI*L*frequencyList[freqCount] -1/(2*Math.PI*C*frequencyList[freqCount]));	
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	seSeLC.setspars(sparsArray);
		seSeLC.setglobal(global);	
		return seSeLC;
	}

	function paSeLC(L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
		var paSeLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, 2*Math.PI*L*frequencyList[freqCount] -1/(2*Math.PI*C*frequencyList[freqCount]));
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paSeLC.setspars(sparsArray);
		paSeLC.setglobal(global);				
		return paSeLC;
	}

	function seSeRLC(R = 75, L = 5e-9, C = 1e-12) { // series inductor nPort object
		var seSeRLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 2*Math.PI*L*frequencyList[freqCount] -1/(2*Math.PI*C*frequencyList[freqCount]));	
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	seSeRLC.setspars(sparsArray);
		seSeRLC.setglobal(global);	
		return seSeRLC;
	}

	function paSeRLC(R = 75, L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
		var paSeRLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 2*Math.PI*L*frequencyList[freqCount] -1/(2*Math.PI*C*frequencyList[freqCount]));
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paSeRLC.setspars(sparsArray);
		paSeRLC.setglobal(global);				
		return paSeRLC;
	}

	function paPaRL(R = 75, L = 5e-9) { // parallel capacitor nPort object   
		var paPaRL = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = (  (complex(R,0).inv()).add(complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv())  ).inv();
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paPaRL.setspars(sparsArray);
		paPaRL.setglobal(global);				
		return paPaRL;
	}

	function sePaRL(R = 75, L = 5e-9) { // parallel capacitor nPort object   
		var sePaRL = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = (  (complex(R,0).inv()).add(complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv())  ).inv();
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		sePaRL.setspars(sparsArray);
		sePaRL.setglobal(global);				
		return sePaRL;
	}

	function paPaRC(R = 75, C = 1e-12) { // parallel capacitor nPort object   
		var paPaRC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = (  (complex(R,0).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paPaRC.setspars(sparsArray);
		paPaRC.setglobal(global);				
		return paPaRC;
	}

	function sePaRC(R = 75, C = 1e-12) { // parallel capacitor nPort object   
		var sePaRC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = (  (complex(R,0).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		sePaRC.setspars(sparsArray);
		sePaRC.setglobal(global);				
		return sePaRC;
	}

	function paPaLC(L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
		var paPaLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = (  (complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paPaLC.setspars(sparsArray);
		paPaLC.setglobal(global);				
		return paPaLC;
	}

	function sePaLC(L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
		var sePaLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = (  (complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		sePaLC.setspars(sparsArray);
		sePaLC.setglobal(global);				
		return sePaLC;
	}

	function paPaRLC(R = 75, L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
		var paPaRLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = ( (complex(R,0).inv()).add (complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paPaRLC.setspars(sparsArray);
		paPaRLC.setglobal(global);				
		return paPaRLC;
	}

	function sePaRLC(R = 75, L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
		var sePaRLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = ( (complex(R,0).inv()).add (complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		sePaRLC.setspars(sparsArray);
		sePaRLC.setglobal(global);				
		return sePaRLC;
	}

	function lpfGen( filt =[50, 1.641818746502858e-11, 4.565360855435164e-8, 1.6418187465028578e-11, 50]) { // returns a table of spars for a low Pass Filter
		var i = 0;
		var filtTable = [];
		filt.pop();
		filt.shift();
		for (i = 0; i < filt.length; i++) {
			if (i % 2 === 0) {filtTable[i] = paC(filt[i]);}		if (i % 2 === 1) {filtTable[i] = seL(filt[i]);}	}	for (i = 0; i < filt.length - 1; i++) {
			filtTable[i+1] = filtTable[i].cas(filtTable[i+1]);
		}	return filtTable[ filtTable.length-1 ];
	}

	function Tee() { // a 3port dummy connection
		var Tee = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(1e-7 + -1/3,0);
			s12 = complex(1e-7 + 2/3,0);
			s13 = s12;
			s21 = s12;
			s22 = s11;
			s23 = s12;
			s31 = s12;
			s32 = s12;
			s33 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s21, s22, s23, s31, s32, s33];
		}	
		Tee.setspars(sparsArray);
		Tee.setglobal(global);
		return Tee;
	}

	function seriesTee() { // series resistor nPort object
		var seriesTee = new nPort;
		var e = 1e-7;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(e + 1/3,0); s12 = complex(e + 2/3,0); s13 = complex(e +-2/3,0);
			s21 = complex(e + 2/3,0); s22 = complex(e + 1/3,0); s23 = complex(e + 2/3,0);
			s31 = complex(e +-2/3,0); s32 = complex(e + 2/3,0); s33 = complex(e + 1/3,0);

			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s21, s22, s23, s31, s32, s33];
		}	
		seriesTee.setspars(sparsArray);
		seriesTee.setglobal(global);
		return seriesTee;
	}

	function Matrix () {}

	function dim(rows, cols, initial) {
		var row = 0, col = 0, a = [], A = [];
		for (row = 0; row < rows; row++) {
			a = [];
			for (col = 0; col < cols; col++) {
				a[col] = initial;
			}		A[row] = a;
		}	return A;	
	}
	function dup(copied) {
		var row, col,
			B = dim(copied.length, copied[0].length, 0);
		for (row = 0; row < copied.length; row++) {
			for (col = 0; col < copied[0].length; col++) {
				B[row][col] = copied[row][col];
			}	}	return B;	
	}
	//pivotSort for maximizing the lower triangle pivot numbers
	function pivotSort(array, pivot) {

		function maxKey (array, pivot) {
			var key = 0, i = 0;
			var current = 0, maximum = 0;
			for (i = pivot; i < array.length; i++) {
				current = Math.abs(array[i][pivot]);
				if (current > maximum){
					maximum = current;
					key = i; // will be row
				}
			}
			return key;
		}

		function swapNumbers (array, key, pivot) {
			// if Key === 0 do nothing
			// if key does not === 0, swap it with key = 0

			var temp0 = array[pivot];
			var temp1 = array[key];

			if ( key === pivot ) ;
			else {
				array[pivot] = temp1;
				array[key] = temp0;  
			}

		}
		swapNumbers (array, maxKey(array, pivot), pivot);

	}
	//pivotSortCplx for maximizing the lower triangle pivot numbers
	function pivotSortCplx(array, pivot) {

		function maxKey (array, pivot) {
			var key = 0, i = 0;
			var current = 0, maximum = 0;
			for (i = pivot; i < array.length; i++) {
				current = array[i][pivot].mag();
				if (current > maximum){
					maximum = current;
					key = i; // will be row
				}
			}
			return key;
		}

		function swapNumbers (array, key, pivot) {
			// if Key === 0 do nothing
			// if key does not === 0, swap it with key = 0

			var temp0 = array[pivot];
			var temp1 = array[key];

			if ( key === pivot ) ;
			else {
				array[pivot] = temp1;
				array[key] = temp0;  
			}

		}
		swapNumbers (array, maxKey(array, pivot), pivot);

	}
	Matrix.prototype = {
		set : function (mat) {this.m = mat; return this;},
		dimension : function (tableRow, tableCol, initial) {
			return matrix(dim(tableRow, tableCol, initial));
		},

		duplicate : function duplicate(matrixA) {
			return matrix(dup(matrixA.m));	
		},

		add : function add (matrixB) {
			var A = this.m,
				B = matrixB.m,
				C = dim(A.length, A[0].length, 0),
				numRows = A.length,
				numCols = A[0].length,
				row = 0, col = 0;
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numCols; col++) {
					C[row][col] = A[row][col] + B[row][col];
				}		}		return matrix(C);
		},

		addCplx : function addCplx (matrixB) {
			var A = this.m,
				B = matrixB.m,
				C = dim(A.length, A[0].length, complex(0,0)),
				numRows = A.length,
				numCols = A[0].length,
				row = 0, col = 0;
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numCols; col++) {
					C[row][col] = A[row][col].add(B[row][col]);
				}		}		return matrix(C);
		},

		sub : function sub (matrixB) {
			var A = this.m,
				B = matrixB.m,
				matrixC = dim(A.length, A[0].length, 0),
				numRows = A.length,
				numCols = A[0].length,
				row = 0, col = 0;
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numCols; col++) {
					C[row][col] = A[row][col] - B[row][col];
				}		}		return matrix(C);
		},

		subCplx : function subCplx (matrixB) {
			var A = this.m,
				B = matrixB.m,
				C = dim(A.length, A[0].length, complex(0,0)),
				numRows = A.length,
				numCols = A[0].length,
				row = 0, col = 0;
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numCols; col++) {
					C[row][col] = A[row][col].sub(B[row][col]);
				}		}		return matrix(C);
		},

		mul : function mul (matrixB) {
			var A = this.m,
				B = matrixB.m,
				C = dim(A.length, B[0].length,0),
				numRows = A[0].length,
				numCols = B.length,
				row = 0, col = 0, n = 0;			
			for(row = 0; row < A.length; row++) {
				for(col = 0; col < B[0].length; col++) {
					for(n = 0; n < B.length; n++) {
						C[row][col] += A[row][n] * B[n][col];
					}			}		}		return matrix(C);
		},

		mulCplx : function mulCplx (matrixB) {
			var A = this.m,
				B = matrixB.m,
				C = dim(A.length, B[0].length, complex(0,0)),
				numRows = A[0].length,
				numCols = B.length,
				row = 0, col = 0, n = 0;			
			for(row = 0; row < A.length; row++) {
				for(col = 0; col < B[0].length; col++) {
					for(n = 0; n < B.length; n++) {
						C[row][col] = C[row][col].add(A[row][n].mul(B[n][col]));
					}			}		}		return matrix(C);
		},


		solveGaussFB : function solveGaussFB() { //this works
			var A = dup(this.m),
				a = 0, numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0, accum = 0;

			for(constRow = 0; constRow < numRows; constRow++) { // FORWARD ELIMINAION - this row stays the same
				pivotSort(A, constRow);
				for(row = constRow+1; row < numRows; row++) { // this row moves down
					a = -A[row][constRow]/A[constRow][constRow]; // this computes "a"
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = A[row][col] + a*A[constRow][col];
					}			}		}
			for(row = numRows -1; row > -1; row--) { // BACK SUBSTITUTION
				accum = 0;
				for(col = numRows -1; col > row; col--) {
					accum = accum + A[row][col]*A[col][numCols -1];
				}
				A[row][numCols -1] = (1/A[row][row]) * (A[row][numCols -1] - accum);
			}

			for(row = 0; row < numRows; row++) { // get to the right column of A				
				for ( col = 0; col < numCols -1; col++) {
					A[row].shift();
				}		}		return matrix(A);
		},


		solveGaussFBCplx : function solveGaussFBCplx() { // this works 12/9/16 and now on 6/24/17
			var A = dup(this.m),
				a = complex(0, 0), numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0, accum = complex(0, 0);

			for(constRow = 0; constRow < numRows; constRow++) { // FORWARD ELIMINATION - this row stays the same
				pivotSortCplx(A, constRow);
				for(row = constRow+1; row < numRows; row++) { // this row moves down
					a = A[row][constRow].div(A[constRow][constRow]).neg();
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = A[row][col].add(a.mul(A[constRow][col]));
					}			}		}
			for(row = numRows -1; row > -1; row--) { // BACK SUBSTITUTION
				accum = complex(0,0);
				for(col = numRows -1; col > row; col--) { 
					accum = accum.add(  A[row][col].mul( A[col][numCols -1]));
				}			A[row][numCols -1] =  (complex(1, 0)).div(A[row][row]).mul( A[row][numCols -1].sub(accum));          
			}
			for(row = 0; row < numRows; row++) { // get to the right column of A				
				for ( col = 0; col < numCols -1; col++) {
					A[row].shift();
				}		}		return matrix(A);
		},


		invert : function invert() { //this works
			var A = dup(this.m),
				a = 0, numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0;
			//append a 0 Matrix to Matrix, A
			for(row = 0; row < numRows; row++) {
				for(col = numRows; col < 2*numRows; col++) {
					A[row][col] = 0;
				}		}		//update numCols since Matrix, A is now wider;
			numCols = A[0].length;
			//add diagonal 1's to append array, A
			for(row = 0; row < numRows; row++) {
				A[row][row + numRows] = 1;
			}		// Real variable forward lower Elimination routine  
			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
				pivotSort(A, constRow);
				for(row = constRow+1; row < numRows; row++) { // this row moves down
					a = -A[row][constRow]/A[constRow][constRow]; // this computes "a"
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = A[row][col] + a*A[constRow][col];
					}			}		}		// Real variable forward unity diagonal routine  
			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
				a = 1/A[constRow][constRow];
				for(row = constRow; row < numRows; row++) { // this row moves down
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = a*A[row][col];
					}			}		}		// Real variable forward upper Elimination routine
			for(constRow = numRows - 1; constRow > 0 ; constRow--) { // 2 , 1, 0 this row stays the same			
				for(row = 0; row < constRow; row++) { // 0, 1  this row moves down
					a = -A[row][constRow]/A[constRow][constRow];				
					for(col = 0; col < numCols; col++) { // this sweeps across the columns	
						A[row][col] = A[row][col] + a*A[constRow][col];
					}			}		}		for(row = 0; row < numRows; row++) { // get to the right column of A				
				for ( col = 0; col < numCols/2; col++) {
					A[row].shift();
				}		}		return matrix(A);
		},

		invertCplx : function invertCplx() { //this works
			var A = dup(this.m),
				a = complex(0, 0), numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0;
			//append a 0 Matrix to Matrix, A
			for(row = 0; row < numRows; row++) {
				for(col = numRows; col < 2*numRows; col++) {
					A[row][col] = complex(0, 0);
				}		}
			//update numCols since Matrix, A is now wider;
			numCols = A[0].length;

			//add diagonal 1's to appened array, A
			for(row = 0; row < numRows; row++) {
				A[row][row + numRows] = complex(1, 0);
			}

			// Real variable forward lower Elimination routine  
			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
				pivotSortCplx(A, constRow);
				for(row = constRow + 1; row < numRows; row++) { // this row moves down
					a = A[row][constRow].div(A[constRow][constRow]).neg();
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = A[row][col].add(a.mul(A[constRow][col]));
					}			}		}
			// Real variable forward unity diagonal routine
			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
				a = A[constRow][constRow].inv(); 
				for(row = constRow; row < numRows; row++) { // this row moves down
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = a.mul(A[row][col]);
					}			}		}
			// Real variable forward upper Elimination routine
			for(constRow = numRows - 1; constRow > 0 ; constRow--) { // 2 , 1, 0 this row stays the same
				for(row = 0; row < constRow; row++) { // 0, 1  this row moves down
					a = A[row][constRow].div(A[constRow][constRow]).neg();
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = A[row][col].add(a.mul(A[constRow][col]));						
					}			}		}
			for(row = 0; row < numRows; row++) { // get to the right column of A				
				for ( col = 0; col < numCols/2; col++) {
					A[row].shift();
				}		}		return matrix(A);
		},						
	};


	function matrix(mat) {
		var matrix = new Matrix;
		matrix.set(mat);
		return matrix;
	}

	function nodal( ... nPortsAndNodes) { //nPortsAndNodes = [[nPort1, n1, n2 ...], [nPort2, n1, n2 ...], ... ['out', n1, nn2, ...] ]
		var i = 0, j = 0, k = 0, row = 0, col = 0, offset = 0, base = 0;
		var spars = function () { // creates spars table with frequencies only [ [freq1], [freq2], ... [freqN] ]
			var sparsLength = nPortsAndNodes[0][0].global.fList.length; // use the first nPort for global data
			var sparsArray = dim(sparsLength,1,1);
			for (i = 0; i< sparsLength; i++) {
				sparsArray[i][0] = nPortsAndNodes[0][0].global.fList[i];
			}
			return sparsArray;
		}();
		var numOfFreqs = nPortsAndNodes[0][0].spars.length; //determine the number of iterations based on number of frequencies
		var numOfnPorts = nPortsAndNodes.length;
		var rowCol = function (nPortsAndNodes) { //determine the number of rows and columns
			var size = 0;
			for (i = 0; i < numOfnPorts; i++) { 
				//size += Math.sqrt(nPortsAndNodes[i][0].spars[0].length -1);
				size += nPortsAndNodes[i].length -1;
			}
			//return size + nPortsAndNodes[numOfnPorts-1].length - 1;
			return size;
		}(nPortsAndNodes);	
		var zeroArray = function () { return dim(rowCol, rowCol, complex(0,0)); }();
		const gammaArray = function () {
			var outArray = dim(rowCol, rowCol, complex(0,0));
			var outArrayReal = dim(rowCol, rowCol, 0); // for testing hookup
			var expanded = dim(rowCol, 3, 0);
			for (row = 0; row < rowCol; row++) {//put the b's here in the first column 
				expanded[row][0] = row + 1;
			}		for(i = 0, offset = 0; i < numOfnPorts; i++) {//put the nodes here in the second column
				for( col = 0; col < nPortsAndNodes[i].length -1; col++) {
					expanded[offset][1] = nPortsAndNodes[i][col + 1];
					offset++;
				}		}		for (i = 0; i < rowCol; i++) {
				for (row = 0; row < rowCol; row++) { // put the a's in the 3rd column
					if ( !(i === row) && (expanded[i][1] === expanded[row][1])   ) { //pivot row is not counted
						expanded[row][2] = expanded[i][0];
					}			}		}		for (row = 0; row < rowCol; row++) { // put 1's for the interconnects
				outArray[row][expanded[row][2]-1] = complex(1,0);
				outArrayReal[row][expanded[row][2]-1] = 1;
			}		return outArray;
		}();
		var gammaMatrix = matrix(gammaArray);
		var nodalOut = new nPort();
		for ( i = 0; i < numOfFreqs; i++) { // i is number of frequencies
			offset = 0;
			gammaMatrix.m = dup(gammaArray);
			for ( j = 0; j < nPortsAndNodes.length - 1; j++) { // j is the number of the current nPort except the last one
				for ( k = 0; k < (nPortsAndNodes[j].length - 1)**2; k++){ // k is the the port number squared
					base = nPortsAndNodes[j].length - 1;
					gammaMatrix.m[offset + Math.floor(k/base)][offset + k % base] = nPortsAndNodes[j][0].spars[i][1 + k].neg();
				}
				offset += base;
			}		gammaMatrix = gammaMatrix.invertCplx();
			for ( j = 0; j < nPortsAndNodes[nPortsAndNodes.length-1].length-1; j++) { //
				for ( k = 0; k < nPortsAndNodes[nPortsAndNodes.length-1].length-1; k++) {
					spars[i].push(gammaMatrix.m[offset +j][offset + k]);
				}		}
		}	nodalOut.setspars(spars);
		nodalOut.setglobal(nPortsAndNodes[0][0].global); // use the first nPort for global data
		return nodalOut;
	}

	function cascade( ... nPorts) {
		var i = 0;
		var nPortsTable = nPorts;
		for (i = 0; i < nPortsTable.length - 1; i++) {
			nPortsTable[i+1] = nPortsTable[i].cas(nPortsTable[i+1]);
		}	return nPortsTable[ nPortsTable.length-1 ];
	}

	function Open() { // one port, open
		var Open = new nPort;
		var frequencyList = global.fList;
		var freqCount = 0, s11, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(1,0);
			sparsArray[freqCount] =	[frequencyList[freqCount],s11];
		}	
		Open.setspars(sparsArray);
		Open.setglobal(global);
		return Open;
	}

	function Short() { //  one port, Short
		var Short = new nPort;
		var frequencyList = global.fList;
		var freqCount = 0, s11, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(-1,0);
			sparsArray[freqCount] =	[frequencyList[freqCount],s11];
		}	
		Short.setspars(sparsArray);
		Short.setglobal(global);
		return Short;
	}

	function Load() { // one port, load
		var Load = new nPort;
		var frequencyList = global.fList;
		var freqCount = 0, s11, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(0,0);
			sparsArray[freqCount] =	[frequencyList[freqCount],s11];
		}	
		Load.setspars(sparsArray);
		Load.setglobal(global);
		return Load;
	}

	function tlin(Z = 60, Length = 0.5 * 0.0254) { // Z is in ohms and Length is in meters, sparameters of a physical transmission line
		var tlin = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), one = complex(1,0), two = complex(2,0), freqCount = 0, Ztlin = [], s11, s12, s21, s22, sparsArray = [];
		var Atlin = {}, Btlin = {}, Ctlin = {}, Ds = {}, alpha = 0, beta = 0, gamma = {};
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Ztlin = complex(Z, 0);
		
			Atlin = Ztlin.mul(Ztlin).sub(Zo.mul(Zo));
			Btlin = Ztlin.mul(Ztlin).add(Zo.mul(Zo));
			Ctlin = two.mul(Ztlin).mul(Zo);
			
			alpha = 0;
			beta = 2*Math.PI*frequencyList[freqCount]/2.997925e8;
			gamma = complex(alpha * Length, beta * Length);

			Ds = Ctlin.mul(gamma.coshCplx()).add(Btlin.mul(gamma.sinhCplx()));

			s11 = Atlin.mul(gamma.sinhCplx()).div(Ds);
			s12 = Ctlin.div(Ds);	
			s21 = s12;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	tlin.setspars(sparsArray);
		tlin.setglobal(global);	
		return tlin;
	}

	function tclin(Zoe = 100, Zoo = 30, Length = 1.47 * 0.0254) { // 1.4732 is the quarter wavelength at 2GHz, (1.3412 at 2.2 GHz)
		var ctlin = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), one = complex(1,0), two = complex(2,0), freqCount = 0, Zoetclin = [], Zootclin = [];
		var s11oe, s12oe, s21oe, s22oe;
		var s11oo, s12oo, s21oo, s22oo;
		var s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44;
		var sparsArray = [];
		var Aoe = {}, Boe = {}, Coe = {}, Dsoe = {};
		var Aoo = {}, Boo = {}, Coo = {}, Dsoo = {};
		var alpha = 0, beta = 0, gamma = {};
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			// alpha beta gamma section
			alpha = 0;
			beta = 2*Math.PI*frequencyList[freqCount]/2.997925e8;
			gamma = complex(alpha * Length, beta * Length);

			// Zoe section
			Zoetclin = complex(Zoe, 0);

			Aoe = Zoetclin.mul(Zoetclin).sub(Zo.mul(Zo));
			Boe = Zoetclin.mul(Zoetclin).add(Zo.mul(Zo));
			Coe = two.mul(Zoetclin).mul(Zo);

			Dsoe = Coe.mul(gamma.coshCplx()).add(Boe.mul(gamma.sinhCplx()));

			s11oe = Aoe.mul(gamma.sinhCplx()).div(Dsoe);
			s12oe = Coe.div(Dsoe);	
			s21oe = s12oe;
			s22oe = s11oe; 
			// Zoo section
			Zootclin = complex(Zoo, 0);

			Aoo = Zootclin.mul(Zootclin).sub(Zo.mul(Zo));
			Boo = Zootclin.mul(Zootclin).add(Zo.mul(Zo));
			Coo = two.mul(Zootclin).mul(Zo);

			Dsoo = Coo.mul(gamma.coshCplx()).add(Boo.mul(gamma.sinhCplx()));

			s11oo = Aoo.mul(gamma.sinhCplx()).div(Dsoo);
			s12oo = Coo.div(Dsoo);	
			s21oo = s12oo;
			s22oo = s11oo;
	 

			// put the 4 port together per Gupta page 331
			s44 = s11 = (s11oe.add(s11oo)).mul(complex(0.5,0));
			s33 = s22 = (s22oe.add(s22oo)).mul(complex(0.5,0));
			s34 = s21 = (s21oe.add(s21oo)).mul(complex(0.5,0));
			s43 = s12 = (s12oe.add(s12oo)).mul(complex(0.5,0));
			s13 = s42 = (s12oe.sub(s12oo)).mul(complex(0.5,0));
			s31 = s24 = (s21oe.sub(s21oo)).mul(complex(0.5,0));
			s14 = s41 = (s11oe.sub(s11oo)).mul(complex(0.5,0));
			s23 = s32 = (s22oe.sub(s22oo)).mul(complex(0.5,0));

			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44];
		}	ctlin.setspars(sparsArray);
		ctlin.setglobal(global);	
		return ctlin;
	}

	function mlin(Width = 0.98e-3, Height = 1.02e-3, Length = 0.5 * 0.025, Thickness = 0.0000125 * 0.054, er = 10, rho = 0, tand = 0.000) {
		var mlin = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), o = Zo.inv(), one = complex(1,0), two = complex(2,0), freqCount = 0, s11, s12, s21, s22, sparsArray = [];
		var Atlin = {}, Btlin = {}, Ctlin = {}, Zmlin = {}, Ds = {}, alpha = 0, beta = 0, gamma = {};

		var pi = Math.PI;
		var f = 12e9;
		var delWOverH = Width/Height <= 1/(2*pi) ? (1.25/pi)*(Thickness/Height)*(1+Math.log(4*pi*Width/Thickness)) : (1.25/pi)*(Thickness/Height)*(1+Math.log(2*Height/Thickness));
		var weOverH = Width/Height + delWOverH;
		var Q = ((er-1)/4.6)*(Thickness/Height)*(1/Math.sqrt(Width/Height));
		var Fwh = 1/Math.sqrt(1+10*Width/Height);
		var ere = ((er+1)/2)+((er-1)/2)*Fwh-Q;
		var Z = Width/Height <= 1.0 ? (60/Math.sqrt(ere))*Math.log(8/weOverH+0.25*weOverH) : (376.7/Math.sqrt(ere))*(1/(weOverH+1.393+0.667*Math.log(weOverH+1.444 )));

		// compute dispersive ZoT ----- INTERLUDE per Gupta page 64, I need stripline version of Zo from pages 57 and 28 with b = 2h
		var b = 2*Height, x = Thickness/b, m = 2*(1/(1 + (2/3)*(x/(1-x))));
		var delW = (x/(pi*(1-x)))*(1-0.5*Math.log( (x/(2-x))**2 + (0.0796 * x/(Width/b + 1.1*x))**m )) * (b-Thickness);
		var wPrime = Width + delW;
		var ZoT = 2 * (1/Math.sqrt(er)) * 30 * Math.log( 1 + (4/pi) * (b-Thickness)/wPrime * ( 8/pi * (b-Thickness)/wPrime + Math.sqrt( (8/pi * (b-Thickness)/wPrime)**2 + 6.27)));
		// back to microstrip now that I have ZoT
		var hMils = Height * 1000/0.0254;
		var fpGHz = 15.66 * Z/hMils; // fGHz = f/1e9;
		var G = Math.sqrt( (Z-5)/60 ) + 0.004*Z;
		var Zf = 0;
		var eref = 0;

		// compute conductor and dielectric losses
		var B = Width/Height >= 1/(2*pi) ? Height : 2*pi*Width;
		var Rs = Math.sqrt(pi*f*4*pi*1e-7*rho*1.72e-8);
		var A = 1 + 1/weOverH * ( 1 + 1/pi * Math.log(2 * B/Thickness));
		var Ac = Width/Height <= 1.0 ? 1.38*A*(Rs/(Height*Z))*(32-weOverH)**2/(32+weOverH)**2 : 6.1e-5*A*(Rs*Z*ere/Height)*(weOverH+(0.667*weOverH)/(weOverH+1.44));
		var Ad = 27.3*er/(er-1)*(ere-1)/Math.sqrt(ere)*tand/0.05;

		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {

			Zf = ZoT - (ZoT-Z)/(1+G*(  (frequencyList[freqCount]/1e9) /fpGHz)**2);
			eref = er - (er-ere)/(1+G*(  (frequencyList[freqCount]/1e9)   /fpGHz)**2);

			Zmlin = complex(Zf, 0);

			Atlin = Zmlin.mul(Zmlin).sub(Zo.mul(Zo));
			Btlin = Zmlin.mul(Zmlin).add(Zo.mul(Zo));
			Ctlin = two.mul(Zmlin).mul(Zo);

			alpha = (Ac + Ad)/8.68588;
			beta = Math.sqrt(eref)*2*Math.PI*frequencyList[freqCount]/2.997925e8;
			gamma = complex(alpha * Length, beta * Length);

			Ds = Ctlin.mul(gamma.coshCplx()).add(Btlin.mul(gamma.sinhCplx()));

			s11 = Atlin.mul(gamma.sinhCplx()).div(Ds);
			s12 = Ctlin.div(Ds);	
			s21 = s12;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	mlin.setspars(sparsArray);
		mlin.setglobal(global);	
		return mlin;
	}

	function mclin(Width = 10 * 0.0254, Space = 63 * 0.0254, Height = 63 * 0.254, Thickness = 0.0012 * 0.0254, Length = 1.47 * 0.0254, er = 4, rho = 1, tand = 0.001 ) { // 1.4732 is the quarter wavelength at 2GHz, (1.3412 at 2.2 GHz)
		var Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), one = complex(1,0), two = complex(2,0);

		// come up with Zo and eref of a microstrip line for a given Width/Height
		var pi = Math.PI;
		var delWOverH = Width/Height <= 1/(2*pi) ? (1.25/pi)*(Thickness/Height)*(1+Math.log(4*pi*Width/Thickness)) : (1.25/pi)*(Thickness/Height)*(1+Math.log(2*Height/Thickness));
		var weOverH = Width/Height + delWOverH;
		var Q = ((er-1)/4.6)*(Thickness/Height)*(1/Math.sqrt(Width/Height));
		var Fwh = 1/Math.sqrt(1+10*Width/Height);
		var ere = ((er+1)/2)+((er-1)/2)*Fwh-Q;
		var ZoER = Width/Height <= 1.0 ? (60/Math.sqrt(ere))*Math.log(8/weOverH+0.25*weOverH) : (376.7/Math.sqrt(ere))*(1/(weOverH+1.393+0.667*Math.log(weOverH+1.444 )));
		console.log(ZoER);

		// come up with Zo and ere of a microstrip line for given Width/Height with er = 1, ie air.
		var ZoAIR = Width/Height <= 1.0 ? (60/Math.sqrt(1))*Math.log(8/weOverH+0.25*weOverH) : (376.7/Math.sqrt(1))*(1/(weOverH+1.393+0.667*Math.log(weOverH+1.444 )));
		console.log(ZoAIR);

		// come up with even and odd mode capacitances with er = ER
		var CpER = 8.854187817e-12 * er * Width/Height;
		var CpAIR = 8.854187817e-12 * 1 * Width/Height;
		var CfER = 0.5 * Math.sqrt(ere)/(2.992925e8*ZoER) - CpER;
		var CfAIR = 0.5 * Math.sqrt(1)/(2.992925e8*ZoAIR) - CpAIR;
		var Acaps = Math.exp( -0.1 * Math.exp(2.33 - 2.53 * Width/Height));
		var CfPrimeER = CfER/(1 + Acaps * (Height/Space) * Math.tanh(10 * Space/Height )) * Math.sqrt(er/ere);
		var CfPrimeAIR = CfAIR/(1 + Acaps * (Height/Space) * Math.tanh(10 * Space/Height )) * Math.sqrt(1/1);
		var k = (Space/Height)/( (Space/Height) + 2 * Width/Height);
		var kPrime = Math.sqrt(1-k**2);
		var CgAIR = 8.8541817e-12 * k <= 0.7 ? 1/( (1/pi) * Math.log( 2 * ( 1 + Math.sqrt(kPrime))/( 1 - Math.sqrt(kPrime)))) : (1/pi) * Math.log( 2 * ( 1 + Math.sqrt(k))/( 1 - Math.sqrt(k)));
		var CgER = (8.8541817e-12*er/pi) * Math.log( Math.cosh( pi*Space/(4 * Height))) + 0.65 * CfER * ( (0.02/(Space/Height)) * Math.sqrt(er) + 1.0 - (1/er**2));
		var CoeER = CpER + CfER + CfPrimeER;
		var CoeAIR = CpAIR + CfAIR + CfPrimeAIR;
		var CooER = CpER + CfER + CgAIR + CgER;

		// come up with even and odd mode impedances and effective dielectric constants
		var Zoe = 2.992925e8 * Math.sqrt(CoeER * CoeAIR);
		var Zoo = 2.992925e8 * Math.sqrt(CooER * CoeAIR);
		console.log(Zoe);
		console.log(Zoo);

		
		/*	
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		// alpha beta gamma section
			alpha = 0;
			beta = 2*Math.PI*frequencyList[freqCount]/2.997925e8;
			gamma = complex(alpha * Length, beta * Length);

		// Zoe section
			Zoemclin = complex(Zoe, 0);

			Aoe = Zoemclin.mul(Zoemclin).sub(Zo.mul(Zo));
			Boe = Zoemclin.mul(Zoemclin).add(Zo.mul(Zo));
			Coe = two.mul(Zoemclin).mul(Zo);

			Dsoe = Coe.mul(gamma.coshCplx()).add(Boe.mul(gamma.sinhCplx()));

			s11oe = Aoe.mul(gamma.sinhCplx()).div(Dsoe);
			s12oe = Coe.div(Dsoe);	
			s21oe = s12oe;
			s22oe = s11oe; 
		// Zoo section
			Zoomclin = complex(Zoo, 0);

			Aoo = Zoomclin.mul(Zoomclin).sub(Zo.mul(Zo));
			Boo = Zoomclin.mul(Zoomclin).add(Zo.mul(Zo));
			Coo = two.mul(Zoomclin).mul(Zo);

			Dsoo = Coo.mul(gamma.coshCplx()).add(Boo.mul(gamma.sinhCplx()));

			s11oo = Aoo.mul(gamma.sinhCplx()).div(Dsoo);
			s12oo = Coo.div(Dsoo);	
			s21oo = s12oo;
			s22oo = s11oo;


		// put the 4 port together per Gupta page 331
			s44 = s11 = (s11oe.add(s11oo)).mul(complex(0.5,0));
			s33 = s22 = (s22oe.add(s22oo)).mul(complex(0.5,0));
			s34 = s21 = (s21oe.add(s21oo)).mul(complex(0.5,0));
			s43 = s12 = (s12oe.add(s12oo)).mul(complex(0.5,0));
			s13 = s42 = (s12oe.sub(s12oo)).mul(complex(0.5,0));
			s31 = s24 = (s21oe.sub(s21oo)).mul(complex(0.5,0));
			s14 = s41 = (s11oe.sub(s11oo)).mul(complex(0.5,0));
			s23 = s32 = (s22oe.sub(s22oo)).mul(complex(0.5,0));

			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44];
		};
		ctlin.setspars(sparsArray);
		ctlin.setglobal(global);	
		return ctlin;*/
	}

	function mtee(w1 = 0.186*0.0254, w2 = 0.334*0.0254, er = 2.55, h = 0.125*0.0254) { // series resistor nPort object
		var mtee = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];

		//microstrip calcs
		var eta = 120*Math.PI;
		var ere = (er+1)/2 + ( (er-1)/2 * 1/Math.sqrt(1+10*h/w1) );
		var zo  = function () {
			if (w1/h < 1) {
				return eta/((2*Math.PI)*Math.sqrt(ere)) * Math.log(8*h/w1 + 0.25*w1/h)
			}
			else {
				return eta/Math.sqrt(ere) * 1/(w1/h + 1.393 + 0.667 * Math.log(w1/h + 1.444));
			}
		}();
		var Ct = (100/Math.tanh(0.0072 * zo) + 0.64 * zo - 261)*w1*1e-12;
		
		
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(-1/3,0);
			s12 = complex(2/3,0);
			s13 = s12;
			s21 = s12;
			s22 = s11;
			s23 = s12;
			s31 = s12;
			s32 = s12;
			s33 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s21, s22, s23, s31, s32, s33];
		}	
		mtee.setspars(sparsArray);
		mtee.setglobal(global);
		return Ct;
	}

	exports.seR = seR;
	exports.paR = paR;
	exports.seL = seL;
	exports.paL = paL;
	exports.seC = seC;
	exports.paC = paC;
	exports.trf = trf;
	exports.trf4Port = trf4Port;
	exports.seSeRL = seSeRL;
	exports.paSeRL = paSeRL;
	exports.seSeRC = seSeRC;
	exports.paSeRC = paSeRC;
	exports.seSeLC = seSeLC;
	exports.paSeLC = paSeLC;
	exports.seSeRLC = seSeRLC;
	exports.paSeRLC = paSeRLC;
	exports.paPaRL = paPaRL;
	exports.sePaRL = sePaRL;
	exports.paPaRC = paPaRC;
	exports.sePaRC = sePaRC;
	exports.paPaLC = paPaLC;
	exports.sePaLC = sePaLC;
	exports.paPaRLC = paPaRLC;
	exports.sePaRLC = sePaRLC;
	exports.lpfGen = lpfGen;
	exports.Tee = Tee;
	exports.seriesTee = seriesTee;
	exports.nodal = nodal;
	exports.cascade = cascade;
	exports.Open = Open;
	exports.Short = Short;
	exports.Load = Load;
	exports.tlin = tlin;
	exports.tclin = tclin;
	exports.mlin = mlin;
	exports.mclin = mclin;
	exports.mtee = mtee;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
