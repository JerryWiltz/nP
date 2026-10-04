import {complex} from '../../np-math/src/complex';
import {passiveNoiseCovariance} from './mlin/noise';
import {noiseAnalysis} from './noiseFigure';
import {connectionModel, intermodAt, waveDbm, oipDbm} from './intermod';

// Modified: 2026-10-04
var conjugate = function (value) { return complex(value.getR(), -value.getI()); };

export function nPort() { this._noise = undefined; }; // base class for nPort objects

var derivePassiveNoise = function (nPortObject) {
	if (!nPortObject.spars) return undefined;
	var temperature = nPortObject._noiseTemperature === undefined ? 293 : nPortObject._noiseTemperature;
	var portCount = Math.sqrt(nPortObject.spars[0].length - 1);
	return nPortObject.spars.map(function (row) {
		return {frequency: row[0], C: passiveNoiseCovariance(row, portCount, temperature)};
	});
};

// The canonical noise shape is an array of {frequency, C} rows.  Retain
// .covariance as a read-only alias for older callers of combined nPorts.
var normalizeNoise = function (noiseData, spars) {
	var rows = Array.isArray(noiseData) ? noiseData : noiseData && noiseData.covariance;
	if (!Array.isArray(rows)) throw new TypeError('nPort noise must contain frequency-aligned covariance rows.');
	if (spars && rows.length !== spars.length) throw new RangeError('Noise and S-parameter frequency counts differ.');
	for (var i = 0; i < rows.length; i++) {
		var portCount = spars ? Math.sqrt(spars[i].length - 1) : rows[i] && rows[i].C && rows[i].C.length;
		if (!rows[i] || (spars && rows[i].frequency !== spars[i][0]) ||
			!Array.isArray(rows[i].C) || rows[i].C.length !== portCount ||
			rows[i].C.some(function (row) {
				return !Array.isArray(row) || row.length !== portCount ||
					row.some(function (value) {
						return !value || typeof value.getR !== 'function' || typeof value.getI !== 'function';
					});
			})) {
			throw new RangeError('Noise covariance must match the S-parameter frequency and port count.');
		}
	}
	if (!Object.prototype.hasOwnProperty.call(rows, 'covariance')) {
		Object.defineProperty(rows, 'covariance', {value: rows});
	}
	return rows;
};

nPort.prototype = {
	constructor: nPort,
	setglobal: function (global) {
		this.global = global;
		this._noiseTemperature = global.Temp;
		if (global.twoTone) this._displayFrequencies = global.fList.slice();
	},
	getglobal: function () {return this.global;},
	setspars: function (sparsArray) {
		if (this._noise !== undefined) normalizeNoise(this._noise, sparsArray);
		this.spars = sparsArray;
	},
	getspars: function () { return this.spars; },
	get noise() {
		if (this._noise === undefined && this.spars) {
			this._noise = normalizeNoise(derivePassiveNoise(this), this.spars);
		}
		return this._noise;
	},
	set noise (noiseData) { this._noise = normalizeNoise(noiseData, this.spars); },
	cas: function cas (n2) { // cascade two 2-ports along with method chaining since it returns an nPort
		var freqCount = 0, one = complex(1,0),
			sparsA = this.getspars(),
			sparsB = n2.getspars(),
			s11, s12, s21, s22, s11a, s12a, s21a, s22a, s11b, s12b, s21b, s22b, sparsArray = [];
		if (sparsA.length !== sparsB.length ||
			sparsA.some(function (row, index) { return row[0] !== sparsB[index][0]; })) {
			throw new RangeError('Cascaded nPorts must have matching frequency rows.');
		}
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
		var noiseA = this.noise;
		var noiseB = n2.noise;
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
		casOut.noise = noiseCovariance;
		casOut._displayFrequencies = this._displayFrequencies || n2._displayFrequencies;
		casOut._intermod = connectionModel([this, n2], [4, 2, 1, 5, 0, 3]);
		return casOut;
	},
	out : function out (...selectors) {
		var spars = this.getspars();
		var portCount = Math.sqrt(spars[0].length - 1);
		var options = selectors.length && typeof selectors[selectors.length - 1] === 'object' ?
			selectors.pop() : {};
		var parsed = selectors.map(function (selector) {
			var match = /^s([1-9])([1-9])(dB|mag|ang|Re|Im)$/.exec(selector);
			if (match) return {kind: 's', row: Number(match[1]) - 1, col: Number(match[2]) - 1, format: match[3]};
			match = /^c([1-9])([1-9])(Re|Im|mag|dB)?$/.exec(selector);
			if (match) return {kind: 'c', row: Number(match[1]) - 1, col: Number(match[2]) - 1, format: match[3] || 'Re'};
			match = /^NF([1-9])([1-9])(dB)?$/.exec(selector);
			if (!match) match = /^NF\(([1-9]\d*),([1-9]\d*)\)(dB)?$/.exec(selector);
			if (match) return {kind: 'NF', row: Number(match[1]) - 1, col: Number(match[2]) - 1, format: match[3] || 'factor'};
			if (selector === 'noiseFloor') return {kind: 'noiseFloor', row: 1, col: 0};
			match = /^noiseFloor([1-9])([1-9])dBmHz$/.exec(selector);
			if (!match) match = /^noiseFloor\(([1-9]\d*),([1-9]\d*)\)dBmHz$/.exec(selector);
			if (match) return {kind: 'noiseFloor', row: Number(match[1]) - 1, col: Number(match[2]) - 1};
			match = /^IM(2sum|2diff|3lower|3upper)([1-9])([1-9])dBm$/.exec(selector);
			if (!match) match = /^IM(2sum|2diff|3lower|3upper)\(([1-9]\d*),([1-9]\d*)\)dBm$/.exec(selector);
			if (match) return {kind: 'IM', product: 'im' + match[1], row: Number(match[2]) - 1, col: Number(match[3]) - 1};
			match = /^H2f([12])([1-9])([1-9])dBm$/.exec(selector);
			if (!match) match = /^H2f([12])\(([1-9]\d*),([1-9]\d*)\)dBm$/.exec(selector);
			if (match) return {kind: 'IM', product: 'harm' + match[1], row: Number(match[2]) - 1, col: Number(match[3]) - 1};
			match = /^OIP(2sum|2diff|3lower|3upper)([1-9])([1-9])dBm$/.exec(selector);
			if (!match) match = /^OIP(2sum|2diff|3lower|3upper)\(([1-9]\d*),([1-9]\d*)\)dBm$/.exec(selector);
			if (match) return {kind: 'OIP', product: 'im' + match[1], row: Number(match[2]) - 1, col: Number(match[3]) - 1};
			match = /^OIP2f([12])([1-9])([1-9])dBm$/.exec(selector);
			if (!match) match = /^OIP2f([12])\(([1-9]\d*),([1-9]\d*)\)dBm$/.exec(selector);
			if (match) return {kind: 'OIP', product: 'harm' + match[1], row: Number(match[2]) - 1, col: Number(match[3]) - 1};
			throw new TypeError('nPort.out(): invalid selector "' + selector + '".');
		});
		parsed.forEach(function (selection) {
			if (selection.row >= portCount || selection.col >= portCount) {
				throw new RangeError('nPort.out(): selected port is outside the n-port dimensions.');
			}
		});
		var output = [['Freq'].concat(selectors)];
		for (var frequencyIndex = 0; frequencyIndex < spars.length; frequencyIndex++) {
			var sparsRow = spars[frequencyIndex];
			if (this._displayFrequencies && !this._displayFrequencies.includes(sparsRow[0])) continue;
			var noiseRow = null;
			var noiseResults = {};
			var intermodRows = {};
			var row = [sparsRow[0]];
			for (var selectionIndex = 0; selectionIndex < parsed.length; selectionIndex++) {
				var selection = parsed[selectionIndex];
				if ((selection.kind === 'c' || selection.kind === 'NF' ||
					selection.kind === 'noiseFloor') && noiseRow === null) noiseRow = this.noise[frequencyIndex];
				if (selection.kind === 'NF' || selection.kind === 'noiseFloor') {
					var noiseKey = selection.row + ',' + selection.col;
					if (!noiseResults[noiseKey]) {
						noiseResults[noiseKey] = noiseAnalysis(sparsRow, noiseRow.C,
							selection.col + 1, selection.row + 1, options);
					}
					var noiseResult = noiseResults[noiseKey];
					if (selection.kind === 'noiseFloor') {
						row.push(10 * Math.log10(noiseResult.outputNoiseDensity / 1e-3));
					} else {
						if (!Number.isFinite(noiseResult.factor) || noiseResult.factor <= 0) {
							throw new RangeError('Noise figure requires positive source and output noise.');
						}
						row.push(selection.format === 'dB' ? 10 * Math.log10(noiseResult.factor) : noiseResult.factor);
					}
				} else if (selection.kind === 'IM' || selection.kind === 'OIP') {
					if (!intermodRows[selection.col]) {
						intermodRows[selection.col] = intermodAt(this, sparsRow[0], selection.col,
							{twoTone: options.twoTone || this.global.twoTone});
					}
					row.push(selection.kind === 'IM' ?
						waveDbm(intermodRows[selection.col].waves[selection.product] &&
							intermodRows[selection.col].waves[selection.product][selection.row]) :
						oipDbm(intermodRows[selection.col], selection.product, selection.row));
				} else {
					var value = selection.kind === 's' ?
						sparsRow[1 + selection.row * portCount + selection.col] :
						noiseRow.C[selection.row][selection.col];
					if (selection.format === 'mag') row.push(value.mag());
					else if (selection.format === 'dB') row.push(selection.kind === 's' ?
						value.mag20dB() : 10 * Math.log10(value.mag()));
					else if (selection.format === 'ang') row.push(value.ang());
					else if (selection.format === 'Im') row.push(value.getI());
					else row.push(value.getR());
				}
			}
			output.push(row);
		}
		return output;
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
