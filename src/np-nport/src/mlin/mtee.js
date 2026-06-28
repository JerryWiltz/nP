// Modified: 2026-06-28
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global}  from '../../../np-global/src/global';
import {C0, INCH_TO_METER, VACUUM_IMPEDANCE} from './constants';

export function mtee({
	commonWidth = 0.023 * INCH_TO_METER,
	branch1Width = 0.023 * INCH_TO_METER,
	branch2Width = 0.023 * INCH_TO_METER,
	Height = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	er = 10,
	rho = 0,
	tand = 0.000
} = {}) { // microstrip tee nPort object
	var mtee = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var freqCount = 0, s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];
	var pi = Math.PI;
	var WidthA = branch1Width, WidthB = branch2Width, WidthSide = commonWidth;

	function microstripLine(width) {
		var wOverH = width / Height;
		var delWOverH = Thickness > 0.0 ? (wOverH <= 1 / (2 * pi) ? (1.25 / pi) * (Thickness / Height) * (1 + Math.log(4 * pi * width / Thickness)) : (1.25 / pi) * (Thickness / Height) * (1 + Math.log(2 * Height / Thickness))) : 0.0;
		var weOverH = width / Height + delWOverH;
		var Q = ((er - 1) / 4.6) * (Thickness / Height) * (1 / Math.sqrt(width / Height));
		var Fwh = 1 / Math.sqrt(1 + 10 * width / Height);
		var ere = ((er + 1) / 2) + ((er - 1) / 2) * Fwh - Q;
		var Z = width / Height <= 1.0 ? (60 / Math.sqrt(ere)) * Math.log(8 / weOverH + 0.25 * weOverH) : (VACUUM_IMPEDANCE / Math.sqrt(ere)) * (1 / (weOverH + 1.393 + 0.667 * Math.log(weOverH + 1.444)));

		return {
			width: width,
			ere: ere,
			Z: Z,
			D: VACUUM_IMPEDANCE / Math.sqrt(ere) * Height / Z,
			fp: 4e5 * Z / Height
		};
	}

	var armA = microstripLine(WidthA);
	var armB = microstripLine(WidthB);
	var armSide = microstripLine(WidthSide);
	
	
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var freq = frequencyList[freqCount];
		var lambdaA = C0 / (Math.sqrt(armA.ere) * freq);
		var lambdaB = C0 / (Math.sqrt(armB.ere) * freq);
		var R = Math.sqrt(armA.Z * armB.Z) / armSide.Z;
		var Q = freq ** 2 / (armA.fp * armB.fp);
		var da = 0.055 * armSide.D * armA.Z / armSide.Z * (1 - 2 * armA.Z / armSide.Z * (freq / armA.fp) ** 2);
		var db = 0.055 * armSide.D * armB.Z / armSide.Z * (1 - 2 * armB.Z / armSide.Z * (freq / armB.fp) ** 2);
		var d2 = Math.sqrt(armA.D * armB.D) * (0.5 - R * (0.05 + 0.7 * Math.exp(-1.6 * R) + 0.25 * R * Q - 0.17 * Math.log(R)));
		var Ta2 = 1 - pi * (freq / armA.fp) ** 2 * ((1 / 12) * (armA.Z / armSide.Z) ** 2 + (0.5 - d2 / armA.D) ** 2);
		var Tb2 = 1 - pi * (freq / armB.fp) ** 2 * ((1 / 12) * (armB.Z / armSide.Z) ** 2 + (0.5 - d2 / armB.D) ** 2);
		var na = Math.sqrt(Math.max(Ta2, 1e-6));
		var nb = Math.sqrt(Math.max(Tb2, 1e-6));
		var BT = 5.5 * Math.sqrt((armA.D * armB.D) / (lambdaA * lambdaB)) * ((er + 2) / er) * (1 / (armSide.Z * na * nb)) * (Math.sqrt(Math.max(da * db, 0)) / armSide.D) * (1 + 0.9 * Math.log(R) + 4.5 * R * Q - 4.4 * Math.exp(-1.3 * R) - 20 * (armSide.Z / VACUUM_IMPEDANCE) ** 2);
		var jBTZ0 = complex(0, BT * Ro);
		var one = complex(1, 0);

		var Saa = one.sub(complex(na ** 2, 0).mul(jBTZ0.add(complex(1 / nb ** 2 + 1, 0)))).div(one.add(complex(na ** 2, 0).mul(jBTZ0.add(complex(1 / nb ** 2 + 1, 0)))));
		var Sbb = one.sub(complex(nb ** 2, 0).mul(jBTZ0.add(complex(1 / na ** 2 + 1, 0)))).div(one.add(complex(nb ** 2, 0).mul(jBTZ0.add(complex(1 / na ** 2 + 1, 0)))));
		var Scc = one.sub(jBTZ0.add(complex(1 / na ** 2 + 1 / nb ** 2, 0))).div(one.add(jBTZ0.add(complex(1 / na ** 2 + 1 / nb ** 2, 0))));
		var Sac = complex(2 * na, 0).div(complex(na ** 2, 0).mul(jBTZ0.add(complex(1 / nb ** 2 + 1, 0))).add(one));
		var Sca = Sac;
		var Sbc = complex(2 * nb, 0).div(complex(nb ** 2, 0).mul(jBTZ0.add(complex(1 / na ** 2 + 1, 0))).add(one));
		var Scb = Sbc;
		var Sab = complex(2, 0).div(complex(na * nb, 0).mul(jBTZ0.add(one)).add(complex(na / nb + nb / na, 0)));
		var Sba = Sab;

		// Hammerstad order is [branch1, branch2, common]. nP Tee order is [common, branch1, branch2].
		s11 = Scc;
		s12 = Sca;
		s13 = Scb;
		s21 = Sac;
		s22 = Saa;
		s23 = Sab;
		s31 = Sbc;
		s32 = Sba;
		s33 = Sbb;
		sparsArray[freqCount] = [frequencyList[freqCount], s11, s12, s13, s21, s22, s23, s31, s32, s33];
	}	
	mtee.setspars(sparsArray);
	mtee.setglobal(global);
	mtee.Ct = (100 / Math.tanh(0.0072 * armSide.Z) + 0.64 * armSide.Z - 261) * WidthSide * 1e-12;
	mtee.microstrip = {commonWidth, branch1Width, branch2Width, Height, Thickness, er, rho, tand};
	return mtee;
};
