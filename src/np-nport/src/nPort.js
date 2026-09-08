import {complex} from '../../np-math/src/complex';
import {passiveNoiseCovariance} from './mlin/noise';

// Modified: 2026-09-08
var conjugate = function (value) { return complex(value.getR(), -value.getI()); };

// Modified: 2026-09-08
export function nPort() { this._noise = undefined; }; // base class for nPort objects

var derivePassiveNoise = function (nPortObject) {
	if (!nPortObject.spars) return undefined;
	var temperature = nPortObject.global && nPortObject.global.Temp !== undefined ? nPortObject.global.Temp : 293;
	var portCount = Math.sqrt(nPortObject.spars[0].length - 1);
	return nPortObject.spars.map(function (row) {
		return {frequency: row[0], C: passiveNoiseCovariance(row, portCount, temperature)};
	});
};

nPort.prototype = {
	constructor: nPort,
	setglobal: function (global) { this.global = global; },
	getglobal: function () {return this.global;},
	setspars: function (sparsArray) { this.spars = sparsArray; },
	getspars: function () { return this.spars; },
	get noise() { return this._noise === undefined ? derivePassiveNoise(this) : this._noise; },
	set noise (noiseData) { this._noise = noiseData; },
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
			sparsArray[freqCount] =	[sparsA[freqCount][0],s11, s12, s21, s22];
		};
		var noiseCovariance = [];
		var noiseA = this.noise && this.noise.covariance ? this.noise.covariance : this.noise;
		var noiseB = n2.noise && n2.noise.covariance ? n2.noise.covariance : n2.noise;
		for (freqCount = 0; freqCount < this.spars.length; freqCount++) {
			var a11 = sparsA[freqCount][1], a12 = sparsA[freqCount][2], a21 = sparsA[freqCount][3], a22 = sparsA[freqCount][4];
			var b11 = sparsB[freqCount][1], b21 = sparsB[freqCount][3];
			var denominator = one.sub(a22.mul(b11));
			var transferA = [
				[one, a12.mul(b11).div(denominator)],
				[complex(0, 0), b21.div(denominator)]
			];
			var transferB = [
				[a12.div(denominator), complex(0, 0)],
				[b21.mul(a22).div(denominator), one]
			];
			var covarianceA = noiseA && noiseA[freqCount] ? noiseA[freqCount].C : [[complex(0, 0), complex(0, 0)], [complex(0, 0), complex(0, 0)]];
			var covarianceB = noiseB && noiseB[freqCount] ? noiseB[freqCount].C : [[complex(0, 0), complex(0, 0)], [complex(0, 0), complex(0, 0)]];
			var outputCovariance = [];
			for (var outputRow = 0; outputRow < 2; outputRow++) {
				outputCovariance[outputRow] = [];
				for (var outputCol = 0; outputCol < 2; outputCol++) {
					var covariance = complex(0, 0);
					for (var sourceRow = 0; sourceRow < 2; sourceRow++) {
						for (var sourceCol = 0; sourceCol < 2; sourceCol++) {
							covariance = covariance
								.add(transferA[outputRow][sourceRow].mul(covarianceA[sourceRow][sourceCol]).mul(conjugate(transferA[outputCol][sourceCol])))
								.add(transferB[outputRow][sourceRow].mul(covarianceB[sourceRow][sourceCol]).mul(conjugate(transferB[outputCol][sourceCol])));
						}
					}
					outputCovariance[outputRow][outputCol] = covariance;
				}
			}
			noiseCovariance[freqCount] = {frequency: sparsA[freqCount][0], C: outputCovariance};
		}
		var casOut = new nPort();
		casOut.setspars(sparsArray);
		casOut.setglobal(this.global);
		casOut.noise = {covariance: noiseCovariance};
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
				if(sparsTo === 'mag') {inner.push(element[sparIndex].mag());};
				if(sparsTo === 'dB')  {inner.push(element[sparIndex].mag20dB());};
				if(sparsTo === 'ang') {inner.push(element[sparIndex].ang());};
				if(sparsTo === 'Re')  {inner.push(element[sparIndex].getR());}
				if(sparsTo === 'Im')  {inner.push(element[sparIndex].getI());}
			})  // end of forEach
			return inner;
		}); // end of map
		sparsArguments.unshift('Freq');
		copy.unshift(sparsArguments);
		return copy;
	},
	noiseOut : function noiseOut (...noiseArguments) {
		if (noiseArguments.length === 0) throw new TypeError('nPort.noiseOut() requires at least one covariance selector.');
		var noiseRows = this.noise && this.noise.covariance ? this.noise.covariance : this.noise;
		var spars = this.getspars();
		var portCount = Math.sqrt(spars[0].length - 1);
		var output = [noiseArguments.slice()];
		output[0].unshift('Freq');
		var selectors = noiseArguments.map(function (selector) {
			var match = /^c(\d+)(\d+)(Re|Im|mag|dB)?$/i.exec(selector);
			if (!match) throw new TypeError('nPort.noiseOut(): invalid covariance selector "' + selector + '".');
			var row = parseInt(match[1], 10) - 1;
			var col = parseInt(match[2], 10) - 1;
			if (row < 0 || col < 0 || row >= portCount || col >= portCount) throw new RangeError('nPort.noiseOut(): covariance selector "' + selector + '" is outside the n-port dimensions.');
			return {row, col, format: (match[3] || 'Re').toLowerCase()};
		});
		for (var frequencyIndex = 0; frequencyIndex < spars.length; frequencyIndex++) {
			var covariance = noiseRows && noiseRows[frequencyIndex] ? noiseRows[frequencyIndex].C : null;
			var inner = [spars[frequencyIndex][0]];
			selectors.forEach(function (selector) {
				var value = covariance && covariance[selector.row] && covariance[selector.row][selector.col]
					? covariance[selector.row][selector.col]
					: complex(0, 0);
				if (selector.format === 'im') inner.push(value.getI());
				else if (selector.format === 'mag') inner.push(value.mag());
				else if (selector.format === 'db') inner.push(10 * Math.log10(value.mag()));
				else inner.push(value.getR());
			});
			output.push(inner);
		}
		return output;
	},
	outTable : function out (...sparsArguments) {
		var table = [];
		var spars = this.getspars();
		var n = Math.sqrt(spars[0].length - 1); 
		var copy = spars.map(function (element,index,spars) {
			var inner = [element[0]];
			sparsArguments.forEach(function (sparsArgument,index1,array) {
				var row = parseInt(sparsArgument.match(/\d/g)[0]);
				var col = parseInt(sparsArgument.match(/\d/g)[1]);
				var sparIndex = (row - 1) * n + col;
				var sparsTo = sparsArgument.match(/dB|mag|ang|Re|Im/).toString();
				if(sparsTo === 'mag') {inner.push(element[sparIndex].mag());};
				if(sparsTo === 'dB')  {inner.push(element[sparIndex].mag20dB());};
				if(sparsTo === 'ang') {inner.push(element[sparIndex].ang());};
				if(sparsTo === 'Re')  {inner.push(element[sparIndex].getR());}
				if(sparsTo === 'Im')  {inner.push(element[sparIndex].getI());}
			})  // end of forEach
			return inner;
		}); // end of map
		sparsArguments.unshift('Freq');
		copy.unshift(sparsArguments);
		return table = copy.map(function(element) {return element;});
	},
};
