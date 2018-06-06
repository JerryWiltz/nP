import {complex} from '../../np-math/src/complex';

export function nPort() {}; // base class for nPort objects

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
			sparsArray[freqCount] =	[this.spars[freqCount][0],s11, s12, s21, s22];
		};
		var casOut = new nPort();
		casOut.setspars(sparsArray);
		casOut.setglobal(this.global);
		return casOut;
	},
	out : function out (selectedOut) { // 's11' at the moment
		// s11mag, s11dB, s11ang or three different ones
		var spars = this.getspars();

		var copy = spars.map(function (element,index,spars) {
			var inner = [element[0]];
			inner.push(element[3].mag())
			return inner;});
		console.log(copy)
	},
}
