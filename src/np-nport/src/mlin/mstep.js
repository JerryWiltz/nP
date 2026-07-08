// Modified: 2026-07-08
import {complex} from '../../../np-math/src/complex';
import {matrix, dim} from '../../../np-math/src/matrix';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {C0, INCH_TO_METER, VACUUM_IMPEDANCE} from './constants';

var pi = Math.PI;

var square = function (x) { return x * x; };
var cube = function (x) { return x * x * x; };
var fourth = function (x) { return x * x * x * x; };

var hammerstadAB = function (u, er) {
	var u2 = square(u);
	var u3 = cube(u);
	var u4 = fourth(u);
	var a = 1 + Math.log((u4 + u2 / 2704) / (u4 + 0.432)) / 49 + Math.log(1 + u3 / 5929.741) / 18.7;
	var b = 0.564 * ((er - 0.9) / (er + 3)) ** 0.053;
	return {a, b};
};

var hammerstadEr = function (u, er) {
	var ab = hammerstadAB(u, er);
	return (er + 1) / 2 + (er - 1) / 2 * (1 + 10 / u) ** (-ab.a * ab.b);
};

var homogeneousZ0 = function (u) {
	var f = 6 + (2 * pi - 6) * Math.exp(-((30.666 / u) ** 0.7528));
	return (VACUUM_IMPEDANCE / (2 * pi)) * Math.log(f / u + Math.sqrt(1 + 4 / square(u)));
};

var deltaUThicknessSingle = function (u, thicknessOverHeight) {
	if (thicknessOverHeight <= 0.0) {
		return 0.0;
	}

	return (1.25 * thicknessOverHeight / pi) *
		(1 + Math.log((2 + (4 * pi * u - 2) / (1 + Math.exp(-100 * (u - 1 / (2 * pi))))) / thicknessOverHeight));
};

var microstripLine = function (width, Height, Thickness, er) {
	var u = width / Height;
	var effectiveU = u + deltaUThicknessSingle(u, Thickness / Height);
	var ere = hammerstadEr(effectiveU, er);
	var Z = homogeneousZ0(effectiveU) / Math.sqrt(ere);

	return {
		width: width,
		u: u,
		effectiveU: effectiveU,
		ere: ere,
		Z: Z,
		lineInductancePerMeter: Z * Math.sqrt(ere) / C0
	};
};

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

var stepCapacitance = function (wideWidth, narrowWidth, er) {
	var ratio = wideWidth / narrowWidth;
	var capacitancePerRootWidth;
	var equation;
	var validity;

	if (Math.abs(er - 9.6) < 1e-12 && ratio >= 3.5 && ratio <= 10) {
		// Edwards/Steer, Foundations for Microstrip Circuit Design, eq. 9.33.
		capacitancePerRootWidth = 130 * Math.log10(ratio) - 44;
		equation = 'Edwards/Steer 9.33, Garg/Bahl large step capacitance';
		validity = 'er = 9.6, 3.5 <= max(width1,width2) / min(width1,width2) <= 10';
	} else {
		// Edwards/Steer, Foundations for Microstrip Circuit Design, eq. 9.32.
		// Also matches QUCS technical manual, Microstrip impedance step, eq. 11.202.
		var logEr = Math.log10(er);
		capacitancePerRootWidth = (10.1 * logEr + 2.33) * ratio - 12.6 * logEr - 3.17;
		equation = 'Edwards/Steer 9.32, Garg/Bahl slight step capacitance';
		validity = 'er <= 10, 1.5 <= max(width1,width2) / min(width1,width2) <= 3.5';
	}

	return {
		valuePf: Math.sqrt(wideWidth * narrowWidth) * capacitancePerRootWidth,
		capacitancePerRootWidth,
		equation,
		validity
	};
};

var stepInductanceNh = function (wideWidth, narrowWidth, Height) {
	// Edwards/Steer, Foundations for Microstrip Circuit Design, eq. 9.34.
	// Also matches QUCS technical manual, Microstrip impedance step, eq. 11.206.
	var ratio = wideWidth / narrowWidth;
	var ratioMinusOne = ratio - 1;
	return Height * (ratioMinusOne * (40.5 + 0.2 * ratioMinusOne) - 75 * Math.log10(ratio));
};

export function mstep({
	width1 = 0.046 * INCH_TO_METER,
	width2 = 0.023 * INCH_TO_METER,
	Height = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	er = 10,
	rho = 1,
	tand = 0.001,
	roughnessRms = 0
} = {}) {
	var step = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var port1Line = microstripLine(width1, Height, Thickness, er);
	var port2Line = microstripLine(width2, Height, Thickness, er);
	var wideWidth = Math.max(width1, width2);
	var narrowWidth = Math.min(width1, width2);
	var capacitance = stepCapacitance(wideWidth, narrowWidth, er);
	var CsPf = capacitance.valuePf;
	var LsNh = stepInductanceNh(wideWidth, narrowWidth, Height);
	var lineInductanceSum = port1Line.lineInductancePerMeter + port2Line.lineInductancePerMeter;
	var L1Nh = LsNh * port1Line.lineInductancePerMeter / lineInductanceSum;
	var L2Nh = LsNh * port2Line.lineInductancePerMeter / lineInductanceSum;
	var sparsArray = [];
	var analysis = [];

	for (var freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var frequency = frequencyList[freqCount];
		var z21 = complex(0, -1 / (2 * pi * frequency * CsPf * 1e-12));
		var z11 = complex(0, 2 * pi * frequency * L1Nh * 1e-9).add(z21);
		var z22 = complex(0, 2 * pi * frequency * L2Nh * 1e-9).add(z21);
		var Z = matrix([
			[z11, z21],
			[z21, z22]
		]);
		var S = zToS(Z, Ro);

		sparsArray[freqCount] = [frequency, S.m[0][0], S.m[0][1], S.m[1][0], S.m[1][1]];
		analysis[freqCount] = {
			frequency,
			CsPf,
			LsNh,
			L1Nh,
			L2Nh,
			Z: Z.m
		};
	}

	step.setspars(sparsArray);
	step.setglobal(global);
	step.microstrip = {
		width1,
		width2,
		Height,
		Thickness,
		er,
		rho,
		tand,
		roughnessRms,
		port1Line,
		port2Line,
		CsPf,
		capacitancePerRootWidth: capacitance.capacitancePerRootWidth,
		capacitanceEquation: capacitance.equation,
		LsNh,
		L1Nh,
		L2Nh,
		validity: {
			capacitanceRatio: capacitance.validity,
			inductanceRatio: 'max(width1,width2) / min(width1,width2) <= 5, best stated for narrowWidth / Height = 1',
			source: 'Edwards/Steer section 9.4, equations 9.28 through 9.35; QUCS node80 equivalent equations 11.202 through 11.206'
		},
		analysis
	};
	return step;
};
