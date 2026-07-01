// Modified: 2026-07-01
import { complex } from '../../../np-math/src/complex';
import { nPort } from '../nPort';
import { global } from '../../../np-global/src/global';
import { C0, COPPER_RESISTIVITY, INCH_TO_METER, MU0, VACUUM_IMPEDANCE } from './constants';

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

export function mlin(Width = 0.023 * INCH_TO_METER, Height = 0.025 * INCH_TO_METER, Length = 0.5 * INCH_TO_METER, Thickness = 0.0000125 * INCH_TO_METER, er = 10, rho = 1, tand = 0.001, roughnessRms = 0) {
	var mlin = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro, 0), two = complex(2, 0), freqCount = 0, s11, s12, s21, s22, sparsArray = [];
	var Atlin = {}, Btlin = {}, Ctlin = {}, Zmlin = {}, Ds = {}, alpha = 0, beta = 0, gamma = {};

	var wOverH = Width / Height;
	var thicknessOverHeight = Thickness / Height;
	var deltaU = deltaUThicknessSingle(wOverH, thicknessOverHeight);
	var effectiveWOverH = wOverH + deltaU;
	var quasiStatic = singleLine(effectiveWOverH, er);
	var Z = quasiStatic.z0;
	var ere = quasiStatic.erEff;
	var Zf = 0;
	var eref = 0;
	var analysis = [];

	// compute conductor loss terms
	var B = Width / Height >= 1 / (2 * pi) ? Height : 2 * pi * Width;
	var A = Thickness > 0.0 ? 1 + 1 / effectiveWOverH * (1 + 1 / pi * Math.log(2 * B / Thickness)) : 0.0;

	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var skinDepth = rho > 0.0 ? Math.sqrt(COPPER_RESISTIVITY * rho / (pi * frequencyList[freqCount] * MU0)) : 0.0;
		var Rs = Math.sqrt(pi * frequencyList[freqCount] * MU0 * rho * COPPER_RESISTIVITY);
		if (roughnessRms > 0.0 && skinDepth > 0.0) {
			Rs *= 1 + (2 / pi) * Math.atan(1.4 * (roughnessRms / skinDepth) ** 2);
		}
		var Ac = Thickness > 0.0 && rho > 0.0 ? (Width / Height <= 1.0 ? 1.38 * A * (Rs / (Height * Z)) * (32 - effectiveWOverH) ** 2 / (32 + effectiveWOverH) ** 2 : 6.1e-5 * A * (Rs * Z * ere / Height) * (effectiveWOverH + (0.667 * effectiveWOverH) / (effectiveWOverH + 1.44))) : 0.0;

		var dispersion = singleLineDispersion(effectiveWOverH, er, ere, Z, frequencyList[freqCount], Height);
		Zf = dispersion.z0Frequency;
		eref = dispersion.erEff;
		var lambda0 = C0 / frequencyList[freqCount];
		var Ad = tand > 0.0 && er > 1.0 ? 27.3 * er / (er - 1) * (eref - 1) / Math.sqrt(eref) * tand / lambda0 : 0.0;
		analysis[freqCount] = {
			frequency: frequencyList[freqCount],
			Z: Zf,
			ere: eref,
			conductorLossDbPerMeter: Ac,
			dielectricLossDbPerMeter: Ad,
			skinDepth
		};

		Zmlin = complex(Zf, 0);

		Atlin = Zmlin.mul(Zmlin).sub(Zo.mul(Zo));
		Btlin = Zmlin.mul(Zmlin).add(Zo.mul(Zo));
		Ctlin = two.mul(Zmlin).mul(Zo);

		alpha = (Ac + Ad) / 8.68588;
		beta = Math.sqrt(eref) * 2 * Math.PI * frequencyList[freqCount] / C0;
		gamma = complex(alpha * Length, beta * Length);

		Ds = Ctlin.mul(gamma.coshCplx()).add(Btlin.mul(gamma.sinhCplx()));

		s11 = Atlin.mul(gamma.sinhCplx()).div(Ds);
		s12 = Ctlin.div(Ds);
		s21 = s12;
		s22 = s11;
		sparsArray[freqCount] = [frequencyList[freqCount], s11, s12, s21, s22];
	};
	mlin.setspars(sparsArray);
	mlin.setglobal(global);
	mlin.microstrip = {
		Width,
		Height,
		Length,
		Thickness,
		er,
		rho,
		tand,
		roughnessRms,
		Z: analysis[0] ? analysis[0].Z : Z,
		ere: analysis[0] ? analysis[0].ere : ere,
		ZQuasiStatic: Z,
		ereQuasiStatic: ere,
		analysis
	};
	return mlin;
};
