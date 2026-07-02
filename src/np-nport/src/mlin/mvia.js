// Modified: 2026-07-02
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {C0, COPPER_RESISTIVITY, EPSILON0, INCH_TO_METER, MU0} from './constants';

var pi = Math.PI;

var viaInductance = function (Height, radius) {
	// QUCS technical manual, Microstrip via hole, Goldfarb/Pucel model, eq. 11.232.
	var a = Math.sqrt(radius * radius + Height * Height);
	return (MU0 / (2 * pi)) *
		(Height * Math.log((Height + a) / radius) + 1.5 * (radius - a));
};

var viaResistanceDc = function (Height, radius, Thickness, rho) {
	var innerRadius = Math.max(radius - Thickness, 0);
	var metalArea = pi * (radius * radius - innerRadius * innerRadius);
	return rho * Height / metalArea;
};

var annularCapacitance = function (padDiameter, antipadDiameter, Height, er) {
	if (padDiameter <= 0 || antipadDiameter <= padDiameter || Height <= 0) {
		return 0;
	}
	var padRadius = padDiameter / 2;
	var antipadRadius = antipadDiameter / 2;
	return 2 * pi * EPSILON0 * er * Height / Math.log(antipadRadius / padRadius);
};

var shunt = function (Y) {
	return {
		A: complex(1, 0),
		B: complex(0, 0),
		C: Y,
		D: complex(1, 0)
	};
};

var series = function (Z) {
	return {
		A: complex(1, 0),
		B: Z,
		C: complex(0, 0),
		D: complex(1, 0)
	};
};

var multiplyAbcd = function (left, right) {
	return {
		A: left.A.mul(right.A).add(left.B.mul(right.C)),
		B: left.A.mul(right.B).add(left.B.mul(right.D)),
		C: left.C.mul(right.A).add(left.D.mul(right.C)),
		D: left.C.mul(right.B).add(left.D.mul(right.D))
	};
};

var abcdToS = function (abcd, Ro) {
	var A = abcd.A, B = abcd.B, C = abcd.C, D = abcd.D;
	var Bnorm = B.div(complex(Ro, 0));
	var Cnorm = C.mul(complex(Ro, 0));
	var denominator = A.add(Bnorm).add(Cnorm).add(D);
	var s11 = A.add(Bnorm).sub(Cnorm).sub(D).div(denominator);
	var s21 = complex(2, 0).div(denominator);
	var s12 = complex(2, 0).mul(A.mul(D).sub(B.mul(C))).div(denominator);
	var s22 = D.add(Bnorm).sub(Cnorm).sub(A).div(denominator);
	return {s11, s12, s21, s22};
};

export function mvia({
	Diameter = 100e-6,
	connectionHeight = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	rho = COPPER_RESISTIVITY,
	er = 10,
	padDiameter = 0,
	antipadDiameter = 0,
	topPadHeight = 0,
	bottomPadHeight = 0,
	topStubLength = 0,
	bottomStubLength = 0
} = {}) {
	var via = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var radius = Diameter / 2;
	var Lbarrel = viaInductance(connectionHeight, radius);
	var Rdc = viaResistanceDc(connectionHeight, radius, Thickness, rho);
	// QUCS technical manual, Microstrip via hole, eqs. 11.233 and 11.234.
	var fdelta = rho / (pi * MU0 * Thickness * Thickness);
	var topPadCapacitance = annularCapacitance(padDiameter, antipadDiameter, topPadHeight, er);
	var bottomPadCapacitance = annularCapacitance(padDiameter, antipadDiameter, bottomPadHeight, er);
	var topStubCapacitance = topStubLength > 0 ? annularCapacitance(Diameter, antipadDiameter || 2 * Diameter, topStubLength, er) : 0;
	var bottomStubCapacitance = bottomStubLength > 0 ? annularCapacitance(Diameter, antipadDiameter || 2 * Diameter, bottomStubLength, er) : 0;
	var sparsArray = [];
	var analysis = [];

	for (var freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var frequency = frequencyList[freqCount];
		var omega = 2 * pi * frequency;
		var R = Rdc * Math.sqrt(1 + frequency / fdelta);
		var X = omega * Lbarrel;
		var Zbarrel = complex(R, X);
		var Yin = complex(0, omega * (topPadCapacitance + topStubCapacitance));
		var Yout = complex(0, omega * (bottomPadCapacitance + bottomStubCapacitance));
		var network = multiplyAbcd(multiplyAbcd(shunt(Yin), series(Zbarrel)), shunt(Yout));
		var S = abcdToS(network, Ro);

		sparsArray[freqCount] = [frequency, S.s11, S.s12, S.s21, S.s22];
		analysis[freqCount] = {
			frequency,
			R,
			X,
			Zbarrel,
			Yin,
			Yout
		};
	}

	via.setspars(sparsArray);
	via.setglobal(global);
	via.microstrip = {
		Diameter,
		radius,
		connectionHeight,
		Thickness,
		rho,
		er,
		padDiameter,
		antipadDiameter,
		topPadHeight,
		bottomPadHeight,
		topStubLength,
		bottomStubLength,
		Rdc,
		Lbarrel,
		fdelta,
		topPadCapacitance,
		bottomPadCapacitance,
		topStubCapacitance,
		bottomStubCapacitance,
		model: 'two-port via barrel with optional pad/antipad and unused-stub shunt capacitance',
		validity: 'Barrel R/L follows the Goldfarb/Pucel via model; pad and stub capacitances are first-order coaxial approximations.',
		analysis
	};
	return via;
};
