// Modified: 2026-06-30
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {C0, COPPER_RESISTIVITY, INCH_TO_METER, MIL_TO_METER, MU0, VACUUM_IMPEDANCE} from './constants';

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

var singleLine = function (u, er) {
	var erEff = hammerstadEr(u, er);
	var z0 = homogeneousZ0(u) / Math.sqrt(erEff);
	return {erEff, z0};
};

var singleLineDispersion = function (u, er, erEff0, z0, frequency, Height) {
	var fn = frequency * Height / 1e6; // GHz-mm when frequency is Hz and Height is meters.
	var p1 = 0.27488 + u * (0.6315 + 0.525 / (1 + 0.0157 * fn) ** 20) - 0.065683 * Math.exp(-8.7513 * u);
	var p2 = 0.33622 * (1 - Math.exp(-0.03442 * er));
	var p3 = 0.0363 * Math.exp(-4.6 * u) * (1 - Math.exp(-((fn / 38.7) ** 4.97)));
	var p4 = 1 + 2.751 * (1 - Math.exp(-((er / 15.916) ** 8)));
	var p = p1 * p2 * ((p3 * p4 + 0.1844) * fn) ** 1.5763;
	var erEff = er - (er - erEff0) / (1 + p);

	var r1 = 0.03891 * er ** 1.4;
	var r2 = 0.267 * u ** 7;
	var r3 = 4.766 * Math.exp(-3.228 * u ** 0.641);
	var r4 = 0.016 + (0.0514 * er) ** 4.524;
	var r5 = (fn / 28.843) ** 12;
	var r6 = 22.2 * u ** 1.92;
	var r7 = 1.206 - 0.3144 * Math.exp(-r1) * (1 - Math.exp(-r2));
	var r8 = 1 + 1.275 * (1 - Math.exp(-0.004625 * r3 * er ** 1.674 * (fn / 18.365) ** 2.745));
	var r9Base = (er - 1) ** 6;
	var r9 = 5.086 * r4 * (r5 / (0.3838 + 0.386 * r4)) * (Math.exp(-r6) / (1 + 1.2992 * r5)) * (r9Base / (1 + 10 * r9Base));
	var r10 = 0.00044 * er ** 2.136 + 0.0184;
	var r11Base = (fn / 19.47) ** 6;
	var r11 = r11Base / (1 + 0.0962 * r11Base);
	var r12 = 1 / (1 + 0.00245 * square(u));
	var r13 = 0.9408 * erEff ** r8 - 0.9603;
	var r14 = (0.9408 - r9) * erEff0 ** r8 - 0.9603;
	var r15 = 0.707 * r10 * (fn / 12.3) ** 1.097;
	var r16 = 1 + 0.0503 * square(er) * r11 * (1 - Math.exp(-((u / 15) ** 6)));
	var r17 = r7 * (1 - 1.1241 * (r12 / r16) * Math.exp(-0.026 * fn ** 1.15656 - r15));
	var z0Frequency = z0 * (r13 / r14) ** r17;

	return {erEff, z0Frequency};
};

var quasiStaticCoupledLine = function (Width, Space, Height, Thickness, er) {
	var u = Width / Height;
	var g = Space / Height;
	var thicknessOverHeight = Thickness / Height;
	var deltaU = deltaUThicknessSingle(u, thicknessOverHeight);
	var deltaT = thicknessOverHeight > 0.0 ? thicknessOverHeight / (g * er) : 0.0;
	var deltaUEven = thicknessOverHeight > 0.0 ? deltaU * (1 - 0.5 * Math.exp(-0.69 * deltaU / deltaT)) : 0.0;
	var deltaUOdd = thicknessOverHeight > 0.0 ? deltaUEven + deltaT : 0.0;
	var uEven = u + deltaUEven;
	var uOdd = u + deltaUOdd;

	var single = singleLine(u, er);
	var singleOdd = singleLine(uOdd, er);

	var v = uEven * (20 + square(g)) / (10 + square(g)) + g * Math.exp(-g);
	var erEven = hammerstadEr(v, er);

	var bo = 0.747 * er / (0.15 + er);
	var co = bo - (bo - 0.207) * Math.exp(-0.414 * uOdd);
	var d = 0.593 + 0.694 * Math.exp(-0.562 * uOdd);
	var ao = 0.7287 * (singleOdd.erEff - (er + 1) / 2) * (1 - Math.exp(-0.179 * uOdd));
	var erOdd = ((er + 1) / 2 + ao - singleOdd.erEff) * Math.exp(-co * g ** d) + singleOdd.erEff;

	var q1 = 0.8695 * uEven ** 0.194;
	var q2 = 1 + 0.7519 * g + 0.189 * g ** 2.31;
	var q3 = 0.1975 + (16.6 + (8.4 / g) ** 6) ** -0.387 + Math.log(g ** 10 / (1 + (g / 3.4) ** 10)) / 241;
	var q4 = 2 * q1 / (q2 * (Math.exp(-g) * uEven ** q3 + (2 - Math.exp(-g)) * uEven ** -q3));
	var Zoe = single.z0 * Math.sqrt(single.erEff / erEven) / (1 - Math.sqrt(single.erEff) * q4 * single.z0 / VACUUM_IMPEDANCE);

	var q5 = 1.794 + 1.14 * Math.log(1 + 0.638 / (g + 0.517 * g ** 2.43));
	var q6 = 0.2305 + Math.log(g ** 10 / (1 + (g / 5.8) ** 10)) / 281.3 + Math.log(1 + 0.598 * g ** 1.154) / 5.1;
	var q7 = (10 + 190 * square(g)) / (1 + 82.3 * cube(g));
	var q8 = Math.exp(-6.5 - 0.95 * Math.log(g) - (g / 0.15) ** 5);
	var q9 = Math.log(q7) * (q8 + 1 / 16.5);
	var q10 = (q2 * q4 - q5 * Math.exp(Math.log(uOdd) * q6 * uOdd ** -q9)) / q2;
	var Zoo = single.z0 * Math.sqrt(single.erEff / erOdd) / (1 - Math.sqrt(single.erEff) * q10 * single.z0 / VACUUM_IMPEDANCE);

	return {u, g, uEven, uOdd, single, Zoe, Zoo, ereoe: erEven, ereoo: erOdd};
};

var dispersiveCoupledLine = function (quasiStatic, Width, Space, Height, er, frequency) {
	var u = Width / Height;
	var g = Space / Height;
	var fn = frequency * Height / 1e6; // GHz-mm when frequency is Hz and Height is meters.
	var singleDispersion = singleLineDispersion(u, er, quasiStatic.single.erEff, quasiStatic.single.z0, frequency, Height);

	var p1 = 0.27488 + u * (0.6315 + 0.525 / (1 + 0.0157 * fn) ** 20) - 0.065683 * Math.exp(-8.7513 * u);
	var p2 = 0.33622 * (1 - Math.exp(-0.03442 * er));
	var p3 = 0.0363 * Math.exp(-4.6 * u) * (1 - Math.exp(-((fn / 38.7) ** 4.97)));
	var p4 = 1 + 2.751 * (1 - Math.exp(-((er / 15.916) ** 8)));
	var p5 = 0.334 * Math.exp(-3.3 * (er / 15) ** 3) + 0.746;
	var p6 = p5 * Math.exp(-((fn / 18) ** 0.368));
	var p7 = 1 + 4.069 * p6 * g ** 0.479 * Math.exp(-1.347 * g ** 0.595 - 0.17 * g ** 2.5);
	var fe = p1 * p2 * ((p3 * p4 + 0.1844 * p7) * fn) ** 1.5763;
	var ereoe = er - (er - quasiStatic.ereoe) / (1 + fe);

	var p8 = 0.7168 * (1 + 1.076 / (1 + 0.0576 * (er - 1)));
	var p9 = p8 - 0.7913 * (1 - Math.exp(-((fn / 20) ** 1.424))) * Math.atan(2.481 * (er / 8) ** 0.946);
	var p10 = 0.242 * (er - 1) ** 0.55;
	var p11 = 0.6366 * (Math.exp(-0.3401 * fn) - 1) * Math.atan(1.263 * (u / 3) ** 1.629);
	var p12 = p9 + (1 - p9) / (1 + 1.183 * u ** 1.376);
	var p13 = 1.695 * p10 / (0.414 + 1.605 * p10);
	var p14 = 0.8928 + 0.1072 * (1 - Math.exp(-0.42 * (fn / 20) ** 3.215));
	var p15 = Math.abs(1 - 0.8928 * (1 + p11) * p12 * Math.exp(-p13 * g ** 1.092) / p14);
	var fo = p1 * p2 * ((p3 * p4 + 0.1844) * fn * p15) ** 1.5763;
	var ereoo = er - (er - quasiStatic.ereoo) / (1 + fo);

	var q11 = 0.893 * (1 - 0.3 / (1 + 0.7 * (er - 1)));
	var q12 = 2.121 * ((fn / 20) ** 4.91 / (1 + q11 * (fn / 20) ** 4.91)) * Math.exp(-2.87 * g) * g ** 0.902;
	var q13 = 1 + 0.038 * (er / 8) ** 5.1;
	var q14 = 1 + 1.203 * (er / 15) ** 4 / (1 + (er / 15) ** 4);
	var q15 = 1.887 * Math.exp(-1.5 * g ** 0.84) * g ** q14 / (1 + 0.41 * (fn / 15) ** 3 * u ** (2 / q13) / (0.125 + u ** (1.626 / q13)));
	var q16 = (1 + 9 / (1 + 0.403 * square(er - 1))) * q15;
	var q17 = 0.394 * (1 - Math.exp(-1.47 * (u / 7) ** 0.672)) * (1 - Math.exp(-4.25 * (fn / 20) ** 1.87));
	var q18 = 0.61 * (1 - Math.exp(-2.13 * (u / 8) ** 1.593)) / (1 + 6.544 * g ** 4.17);
	var q19 = 0.21 * fourth(g) / ((1 + 0.18 * g ** 4.9) * (1 + 0.1 * square(u)) * (1 + (fn / 24) ** 3));
	var q20 = (0.09 + 1 / (1 + 0.1 * (er - 1) ** 2.7)) * q19;
	var q21 = Math.abs(1 - 42.54 * g ** 0.133 * Math.exp(-0.812 * g) * u ** 2.5 / (1 + 0.033 * u ** 2.5));
	var re = (fn / 28.843) ** 12;
	var qe = 0.016 + (0.0514 * er * q21) ** 4.524;
	var pe = 4.766 * Math.exp(-3.228 * u ** 0.641);
	var de = 5.086 * qe * (re / (0.3838 + 0.386 * qe)) * (Math.exp(-22.2 * u ** 1.92) / (1 + 1.2992 * re)) * ((er - 1) ** 6 / (1 + 10 * (er - 1) ** 6));
	var ce = 1 + 1.275 * (1 - Math.exp(-0.004625 * pe * er ** 1.674 * (fn / 18.365) ** 2.745)) - q12 + q16 - q17 + q18 + q20;

	var r1 = 0.03891 * er ** 1.4;
	var r2 = 0.267 * u ** 7;
	var r7 = 1.206 - 0.3144 * Math.exp(-r1) * (1 - Math.exp(-r2));
	var r10 = 0.00044 * er ** 2.136 + 0.0184;
	var r11Base = (fn / 19.47) ** 6;
	var r11 = r11Base / (1 + 0.0962 * r11Base);
	var r12 = 1 / (1 + 0.00245 * square(u));
	var r15 = 0.707 * r10 * (fn / 12.3) ** 1.097;
	var r16 = 1 + 0.0503 * square(er) * r11 * (1 - Math.exp(-((u / 15) ** 6)));
	var q0 = r7 * (1 - 1.1241 * (r12 / r16) * Math.exp(-0.026 * fn ** 1.15656 - r15));
	var Zoe = quasiStatic.Zoe * ((0.9408 * singleDispersion.erEff ** ce - 0.9603) / ((0.9408 - de) * quasiStatic.single.erEff ** ce - 0.9603)) ** q0;

	var q29 = 15.16 / (1 + 0.196 * square(er - 1));
	var q28 = 0.149 * cube(er - 1) / (94.5 + 0.038 * cube(er - 1));
	var q27 = 0.4 * g ** 0.84 * (1 + 2.5 * (er - 1) ** 1.5 / (5 + (er - 1) ** 1.5));
	var q26 = 30 - 22.2 * (((er - 1) / 13) ** 12 / (1 + 3 * ((er - 1) / 13) ** 12)) - q29;
	var q25 = 0.3 * square(fn) / (10 + square(fn)) * (1 + 2.333 * square(er - 1) / (5 + square(er - 1)));
	var q24 = 2.506 * q28 * u ** 0.894 * ((1 + 1.3 * u) * fn / 99.25) ** 4.29 / (3.575 + u ** 0.894);
	var q23 = 1 + 0.005 * fn * q27 / ((1 + 0.812 * (fn / 15) ** 1.9) * (1 + 0.025 * square(u)));
	var q22 = 0.925 * (fn / q26) ** 1.536 / (1 + 0.3 * (fn / 30) ** 1.536);
	var Zoo = singleDispersion.z0Frequency + (quasiStatic.Zoo * (ereoo / quasiStatic.ereoo) ** q22 - singleDispersion.z0Frequency * q23) / (1 + q24 + (0.46 * g) ** 2.2 * q25);

	return {Zoe, Zoo, ereoe, ereoo};
};

var modeLosses = function (Width, Height, Thickness, Length, er, rho, tand, frequency, modeZ0, modeErEff, otherModeZ0, otherModeErEff, roughnessRms) {
	var conductorDb = 0.0;
	var dielectricDb = 0.0;

	if (frequency > 0.0 && Width > 0.0 && Height > 0.0 && modeZ0 > 0.0 && modeErEff > 0.0) {
		var z0Homogeneous = modeZ0 * Math.sqrt(modeErEff);
		var otherZ0Homogeneous = otherModeZ0 * Math.sqrt(otherModeErEff);
		var skinDepth = rho > 0.0 ? Math.sqrt(COPPER_RESISTIVITY * rho / (pi * frequency * MU0)) : 0.0;

		if (Thickness > 0.0 && rho > 0.0 && skinDepth > 0.0) {
			var currentFactor = Math.exp(-1.2 * ((z0Homogeneous + otherZ0Homogeneous) / (2 * VACUUM_IMPEDANCE)) ** 0.7);
			var surfaceResistance = Math.sqrt(pi * frequency * MU0 * rho * COPPER_RESISTIVITY);
			if (roughnessRms > 0.0) {
				surfaceResistance *= 1 + (2 / pi) * Math.atan(1.4 * square(roughnessRms / skinDepth));
			}
			var conductorQ = pi * z0Homogeneous * Width * frequency / (surfaceResistance * C0 * currentFactor);
			conductorDb = (20 * pi / Math.log(10)) * frequency * Math.sqrt(modeErEff) / (C0 * conductorQ) * Length;
		}

		if (tand > 0.0 && er > 1.0) {
			dielectricDb = (20 * pi / Math.log(10)) * (frequency / C0) * (er / Math.sqrt(modeErEff)) * ((modeErEff - 1) / (er - 1)) * tand * Length;
		}
	}

	return {conductorDb, dielectricDb, alphaNepers: (conductorDb + dielectricDb) / 8.68588};
};

export function mclin(Width = 19.1155 * MIL_TO_METER, Space = 5.82185 * MIL_TO_METER, Height = 25 * MIL_TO_METER, Thickness = 0.0000125 * INCH_TO_METER, Length = 719.794 * MIL_TO_METER, er = 10, rho = 1, tand = 0.001, roughnessRms = 0) {
	var ctlin = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro, 0), two = complex(2, 0), freqCount = 0, Zoemclin = [], Zoomclin = [];
	var s11oe, s12oe, s21oe, s22oe;
	var s11oo, s12oo, s21oo, s22oo;
	var s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44;
	var sparsArray = [];
	var Aoe = {}, Boe = {}, Coe = {}, Dsoe = {};
	var Aoo = {}, Boo = {}, Coo = {}, Dsoo = {};
	var alphaOe = 0, alphaOo = 0, betaOe = 0, betaOo = 0, gammaOe = {}, gammaOo = {};

	// Kirschning/Jansen equal-width coupled microstrip model, using Qucs as
	// a cross-check and the published equation family as the implementation basis.
	var quasiStatic = quasiStaticCoupledLine(Width, Space, Height, Thickness, er);
	var dispersion = [];

	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var frequency = frequencyList[freqCount];
		var mode = dispersiveCoupledLine(quasiStatic, Width, Space, Height, er, frequency);
		var evenLoss = modeLosses(Width, Height, Thickness, Length, er, rho, tand, frequency, mode.Zoe, mode.ereoe, mode.Zoo, mode.ereoo, roughnessRms);
		var oddLoss = modeLosses(Width, Height, Thickness, Length, er, rho, tand, frequency, mode.Zoo, mode.ereoo, mode.Zoe, mode.ereoe, roughnessRms);

		alphaOe = evenLoss.alphaNepers;
		alphaOo = oddLoss.alphaNepers;
		betaOe = Math.sqrt(mode.ereoe) * 2 * pi * frequency / C0;
		betaOo = Math.sqrt(mode.ereoo) * 2 * pi * frequency / C0;
		gammaOe = complex(alphaOe, betaOe * Length);
		gammaOo = complex(alphaOo, betaOo * Length);
		dispersion[freqCount] = {
			frequency,
			Zoe: mode.Zoe,
			Zoo: mode.Zoo,
			ereoe: mode.ereoe,
			ereoo: mode.ereoo,
			evenConductorLossDb: evenLoss.conductorDb,
			oddConductorLossDb: oddLoss.conductorDb,
			evenDielectricLossDb: evenLoss.dielectricDb,
			oddDielectricLossDb: oddLoss.dielectricDb
		};

		// Even-mode two-port section.
		Zoemclin = complex(mode.Zoe, 0);

		Aoe = Zoemclin.mul(Zoemclin).sub(Zo.mul(Zo));
		Boe = Zoemclin.mul(Zoemclin).add(Zo.mul(Zo));
		Coe = two.mul(Zoemclin).mul(Zo);

		Dsoe = Coe.mul(gammaOe.coshCplx()).add(Boe.mul(gammaOe.sinhCplx()));

		s11oe = Aoe.mul(gammaOe.sinhCplx()).div(Dsoe);
		s12oe = Coe.div(Dsoe);
		s21oe = s12oe;
		s22oe = s11oe;

		// Odd-mode two-port section.
		Zoomclin = complex(mode.Zoo, 0);

		Aoo = Zoomclin.mul(Zoomclin).sub(Zo.mul(Zo));
		Boo = Zoomclin.mul(Zoomclin).add(Zo.mul(Zo));
		Coo = two.mul(Zoomclin).mul(Zo);

		Dsoo = Coo.mul(gammaOo.coshCplx()).add(Boo.mul(gammaOo.sinhCplx()));

		s11oo = Aoo.mul(gammaOo.sinhCplx()).div(Dsoo);
		s12oo = Coo.div(Dsoo);
		s21oo = s12oo;
		s22oo = s11oo;

		s44 = s11 = (s11oe.add(s11oo)).mul(complex(0.5, 0));
		s33 = s22 = (s22oe.add(s22oo)).mul(complex(0.5, 0));
		s34 = s21 = (s21oe.add(s21oo)).mul(complex(0.5, 0));
		s43 = s12 = (s12oe.add(s12oo)).mul(complex(0.5, 0));
		s13 = s42 = (s12oe.sub(s12oo)).mul(complex(0.5, 0));
		s31 = s24 = (s21oe.sub(s21oo)).mul(complex(0.5, 0));
		s14 = s41 = (s11oe.sub(s11oo)).mul(complex(0.5, 0));
		s23 = s32 = (s22oe.sub(s22oo)).mul(complex(0.5, 0));

		sparsArray[freqCount] = [frequencyList[freqCount], s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44];
	}

	ctlin.setspars(sparsArray);
	ctlin.setglobal(global);
	var firstDispersion = dispersion[0] || {Zoe: quasiStatic.Zoe, Zoo: quasiStatic.Zoo, ereoe: quasiStatic.ereoe, ereoo: quasiStatic.ereoo};
	ctlin.microstrip = {
		Width,
		Space,
		Height,
		Thickness,
		Length,
		er,
		rho,
		tand,
		roughnessRms,
		Zoe: firstDispersion.Zoe,
		Zoo: firstDispersion.Zoo,
		ereoe: firstDispersion.ereoe,
		ereoo: firstDispersion.ereoo,
		ZoeQuasiStatic: quasiStatic.Zoe,
		ZooQuasiStatic: quasiStatic.Zoo,
		ereoeQuasiStatic: quasiStatic.ereoe,
		ereooQuasiStatic: quasiStatic.ereoo,
		dispersion
	};
	return ctlin;
};
