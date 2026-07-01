// Modified: 2026-07-01
import {complex} from '../../../np-math/src/complex';
import {matrix, dim} from '../../../np-math/src/matrix';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {INCH_TO_METER} from './constants';

var pi = Math.PI;

var identityCplx = function (size) {
	var out = dim(size, size, complex(0, 0));
	for (var row = 0; row < size; row++) {
		for (var col = 0; col < size; col++) {
			out[row][col] = row === col ? complex(1, 0) : complex(0, 0);
		}
	}
	return matrix(out);
};

var zToS = function (Z, Ro) {
	var size = Z.m.length;
	var I = identityCplx(size);
	var normalizedZ = dim(size, size, complex(0, 0));
	for (var row = 0; row < size; row++) {
		for (var col = 0; col < size; col++) {
			normalizedZ[row][col] = Z.m[row][col].div(complex(Ro, 0));
		}
	}
	var z = matrix(normalizedZ);
	return z.subCplx(I).mulCplx(z.addCplx(I).invertCplx());
};

var unmiteredCorner = function (Width, Height, er) {
	var widthOverHeight = Width / Height;
	return {
		CpF: Width * ((10.35 * er + 2.5) * widthOverHeight + (2.6 * er + 5.64)),
		LnH: 220 * Height * (1 - 1.35 * Math.exp(-0.18 * widthOverHeight ** 1.39))
	};
};

var halfMiteredCorner = function (Width, Height, er) {
	var widthOverHeight = Width / Height;
	return {
		CpF: Width * ((3.93 * er + 0.62) * widthOverHeight + (7.6 * er + 3.80)),
		LnH: 440 * Height * (1 - 1.062 * Math.exp(-0.177 * widthOverHeight ** 0.947))
	};
};

var interpolate = function (a, b, t) {
	return a + (b - a) * t;
};

export function mbend({
	Width = 0.023 * INCH_TO_METER,
	miterLength,
	Height = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	er = 10,
	rho = 1,
	tand = 0.001,
	roughnessRms = 0
} = {}) {
	var bend = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var defaultMiterLength = 0.5 * Math.SQRT2 * Width;
	var actualMiterLength = miterLength === undefined ? defaultMiterLength : miterLength;
	var miterFraction = actualMiterLength / (Math.SQRT2 * Width);
	var interpolation = Math.max(0, Math.min(1, miterFraction / 0.5));
	var unmitered = unmiteredCorner(Width, Height, er);
	var halfMitered = halfMiteredCorner(Width, Height, er);
	var CpF = interpolate(unmitered.CpF, halfMitered.CpF, interpolation);
	var LnH = interpolate(unmitered.LnH, halfMitered.LnH, interpolation);
	var sparsArray = [];
	var analysis = [];

	for (var freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var frequency = frequencyList[freqCount];
		var z21 = complex(0, -1 / (2 * pi * frequency * CpF * 1e-12));
		var z11 = complex(0, 2 * pi * frequency * LnH * 1e-9).add(z21);
		var Z = matrix([
			[z11, z21],
			[z21, z11]
		]);
		var S = zToS(Z, Ro);

		sparsArray[freqCount] = [frequency, S.m[0][0], S.m[0][1], S.m[1][0], S.m[1][1]];
		analysis[freqCount] = {
			frequency,
			CpF,
			LnH,
			Z: Z.m
		};
	}

	bend.setspars(sparsArray);
	bend.setglobal(global);
	bend.microstrip = {
		Width,
		miterLength: actualMiterLength,
		defaultMiterLength,
		miterFraction,
		interpolation,
		Height,
		Thickness,
		er,
		rho,
		tand,
		roughnessRms,
		CpF,
		LnH,
		unmitered,
		halfMitered,
		validity: {
			widthOverHeight: '0.2 <= Width / Height <= 6.0',
			er: '2.36 <= er <= 10.4',
			frequencyHeight: 'frequency * Height <= 12e6',
			miter: 'Published equations provide unmitered and 50% mitered endpoints; intermediate miter lengths use linear interpolation.'
		},
		analysis
	};
	return bend;
};
