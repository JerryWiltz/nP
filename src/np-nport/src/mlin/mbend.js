// Modified: 2026-07-02
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

var edwardsSteerBend = function (Width, Height, er) {
	// Edwards/Steer, Foundations for Microstrip Circuit Design, 2016, eqs. 9.24 through 9.26.
	var widthOverHeight = Width / Height;
	var capacitancePerWidth = widthOverHeight < 1
		? ((14 * er + 12.5) * widthOverHeight - (1.83 * er - 2.25)) / Math.sqrt(widthOverHeight)
		: (9.5 * er + 1.25) * widthOverHeight + 5.2 * er + 7.0;

	return {
		CpF: Width * capacitancePerWidth,
		LnH: Height * 100 * (4 * Math.sqrt(widthOverHeight) - 4.21)
	};
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
	var recommendedMiterFraction = 0.6;
	var defaultMiterLength = 0;
	var actualMiterLength = miterLength === undefined ? defaultMiterLength : miterLength;
	var miterFraction = actualMiterLength / (Math.SQRT2 * Width);
	var equivalent = edwardsSteerBend(Width, Height, er);
	var CpF = equivalent.CpF;
	var LnH = equivalent.LnH;
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
		recommendedMiterFraction,
		recommendedMiterLength: recommendedMiterFraction * Math.SQRT2 * Width,
		miterFraction,
		Height,
		Thickness,
		er,
		rho,
		tand,
		roughnessRms,
		CpF,
		LnH,
		equivalent,
		validity: {
			capacitance: '2.5 <= er <= 15 and 0.1 <= Width / Height <= 5.0',
			inductance: 'best stated for 0.5 <= Width / Height <= 2.0',
			miter: 'Edwards/Steer recommend chamfer fraction near 0.6 for many alumina-like cases; current C/L equations are for the unmitered bend.'
		},
		analysis
	};
	return bend;
};
