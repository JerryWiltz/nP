// Modified: 2026-06-30
import { complex } from '../../../np-math/src/complex';
import { nPort } from '../nPort';
import { global } from '../../../np-global/src/global';
import { C0, COPPER_RESISTIVITY, INCH_TO_METER, MU0, VACUUM_IMPEDANCE } from './constants';

export function mlin(Width = 0.023 * INCH_TO_METER, Height = 0.025 * INCH_TO_METER, Length = 0.5 * INCH_TO_METER, Thickness = 0.0000125 * INCH_TO_METER, er = 10, rho = 1, tand = 0.001, roughnessRms = 0) {
	// this from Gupta page 60 at the bottom
	var mlin = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro, 0), o = Zo.inv(), one = complex(1, 0), two = complex(2, 0), freqCount = 0, ZZ = [], s11, s12, s21, s22, sparsArray = [];
	var Atlin = {}, Btlin = {}, Ctlin = {}, Zmlin = {}, Ds = {}, alpha = 0, beta = 0, gamma = {};

	var pi = Math.PI;
	var wOverH = Width / Height;
	var delWOverH = Thickness > 0.0 ? (wOverH <= 1 / (2 * pi) ? (1.25 / pi) * (Thickness / Height) * (1 + Math.log(4 * pi * Width / Thickness)) : (1.25 / pi) * (Thickness / Height) * (1 + Math.log(2 * Height / Thickness))) : 0.0;
	var weOverH = Width / Height + delWOverH;
	var Q = ((er - 1) / 4.6) * (Thickness / Height) * (1 / Math.sqrt(Width / Height));
	var Fwh = 1 / Math.sqrt(1 + 10 * Width / Height);
	var ere = ((er + 1) / 2) + ((er - 1) / 2) * Fwh - Q;
	var Z = Width / Height <= 1.0 ? (60 / Math.sqrt(ere)) * Math.log(8 / weOverH + 0.25 * weOverH) : (VACUUM_IMPEDANCE / Math.sqrt(ere)) * (1 / (weOverH + 1.393 + 0.667 * Math.log(weOverH + 1.444)));

	// compute dispersive ZoT ----- INTERLUDE per Gupta page 64, I need stripline version of Zo from pages 57 and 28 with b = 2h
	var b = 2 * Height, x = Thickness / b, m = 2 * (1 / (1 + (2 / 3) * (x / (1 - x))));
	var delW = Thickness > 0.0 ? (x / (pi * (1 - x))) * (1 - 0.5 * Math.log((x / (2 - x)) ** 2 + (0.0796 * x / (Width / b + 1.1 * x)) ** m)) * (b - Thickness) : 0.0;
	var wPrime = Width + delW;
	var ZoT = 2 * (1 / Math.sqrt(er)) * 30 * Math.log(1 + (4 / pi) * (b - Thickness) / wPrime * (8 / pi * (b - Thickness) / wPrime + Math.sqrt((8 / pi * (b - Thickness) / wPrime) ** 2 + 6.27)));

	// back to microstrip now that I have ZoT
	var hMils = Height * 1000 / INCH_TO_METER;
	var fpGHz = 15.66 * Z / hMils; // fGHz = f/1e9;
	var G = Math.sqrt((Z - 5) / 60) + 0.004 * Z;
	var Zf = 0;
	var eref = 0;
	var analysis = [];

	// compute conductor loss terms
	var B = Width / Height >= 1 / (2 * pi) ? Height : 2 * pi * Width;
	var A = Thickness > 0.0 ? 1 + 1 / weOverH * (1 + 1 / pi * Math.log(2 * B / Thickness)) : 0.0;

	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var skinDepth = rho > 0.0 ? Math.sqrt(COPPER_RESISTIVITY * rho / (pi * frequencyList[freqCount] * MU0)) : 0.0;
		var Rs = Math.sqrt(pi * frequencyList[freqCount] * MU0 * rho * COPPER_RESISTIVITY);
		if (roughnessRms > 0.0 && skinDepth > 0.0) {
			Rs *= 1 + (2 / pi) * Math.atan(1.4 * (roughnessRms / skinDepth) ** 2);
		}
		var Ac = Thickness > 0.0 && rho > 0.0 ? (Width / Height <= 1.0 ? 1.38 * A * (Rs / (Height * Z)) * (32 - weOverH) ** 2 / (32 + weOverH) ** 2 : 6.1e-5 * A * (Rs * Z * ere / Height) * (weOverH + (0.667 * weOverH) / (weOverH + 1.44))) : 0.0;

		Zf = ZoT - (ZoT - Z) / (1 + G * ((frequencyList[freqCount] / 1e9) / fpGHz) ** 2);
		eref = er - (er - ere) / (1 + G * ((frequencyList[freqCount] / 1e9) / fpGHz) ** 2);
		var lambda0 = C0 / frequencyList[freqCount];
		var Ad = tand > 0.0 ? 27.3 * er / (er - 1) * (eref - 1) / Math.sqrt(eref) * tand / lambda0 : 0.0;
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
