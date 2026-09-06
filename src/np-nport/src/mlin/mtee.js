// Modified: 2026-09-06
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global}  from '../../../np-global/src/global';
import {C0, COPPER_RESISTIVITY, INCH_TO_METER, VACUUM_IMPEDANCE} from './constants';
import {isOptionsObject, normalizePhysicalModelOptions, physicalModelMetadata, requireNonnegative, requirePositive, resistivityScale} from '../physicalModels/options';

var pi = Math.PI;
var DEFAULT_WIDTH = 0.023 * INCH_TO_METER;
var DEFAULT_HEIGHT = 0.025 * INCH_TO_METER;
var DEFAULT_THICKNESS = 0.0000125 * INCH_TO_METER;

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
	// Arm baseline follows Hammerstad/Jensen-style single microstrip equations.
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
		D: VACUUM_IMPEDANCE / Math.sqrt(ere) * Height / Z,
		fp: 4e5 * Z / Height
	};
};

export function mtee(
	commonWidth = DEFAULT_WIDTH,
	branch1Width = DEFAULT_WIDTH,
	branch2Width = DEFAULT_WIDTH,
	Height = DEFAULT_HEIGHT,
	Thickness = DEFAULT_THICKNESS,
	er = 10,
	rho = 1,
	tand = 0.001,
	roughnessRms = 0
) { // microstrip tee nPort object
	var inputOptions = isOptionsObject(commonWidth) ? commonWidth : null;
	if (inputOptions) {
		var options = normalizePhysicalModelOptions('mtee', inputOptions, [
			{name: 'commonWidth', defaultValue: DEFAULT_WIDTH},
			{name: 'branch1Width', defaultValue: DEFAULT_WIDTH},
			{name: 'branch2Width', defaultValue: DEFAULT_WIDTH},
			{name: 'height', aliases: ['Height'], defaultValue: DEFAULT_HEIGHT},
			{name: 'thickness', aliases: ['Thickness'], defaultValue: DEFAULT_THICKNESS},
			{name: 'relativePermittivity', aliases: ['er'], defaultValue: 10},
			{name: 'rho', defaultValue: 1}, {name: 'resistivity', defaultValue: undefined},
			{name: 'lossTangent', aliases: ['tand'], defaultValue: 0.001},
			{name: 'roughnessRms', defaultValue: 0}
		]);
		commonWidth = options.commonWidth; branch1Width = options.branch1Width; branch2Width = options.branch2Width;
		Height = options.height; Thickness = options.thickness; er = options.relativePermittivity;
		rho = resistivityScale('mtee', inputOptions, options.rho, COPPER_RESISTIVITY); tand = options.lossTangent; roughnessRms = options.roughnessRms;
	}
	requirePositive('mtee', 'commonWidth', commonWidth); requirePositive('mtee', 'branch1Width', branch1Width);
	requirePositive('mtee', 'branch2Width', branch2Width); requirePositive('mtee', 'height', Height);
	requireNonnegative('mtee', 'thickness', Thickness); requirePositive('mtee', 'relativePermittivity', er);
	requireNonnegative('mtee', 'resistivity', rho * COPPER_RESISTIVITY); requireNonnegative('mtee', 'lossTangent', tand);
	requireNonnegative('mtee', 'roughnessRms', roughnessRms);
	var mtee = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var freqCount = 0, s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];
	var WidthA = branch1Width, WidthB = branch2Width, WidthSide = commonWidth;
	var analysis = [];

	var armA = microstripLine(WidthA, Height, Thickness, er);
	var armB = microstripLine(WidthB, Height, Thickness, er);
	var armSide = microstripLine(WidthSide, Height, Thickness, er);
	
	
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		// QUCS technical manual, Microstrip tee junction, eqs. 11.207 through 11.224.
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
		analysis[freqCount] = {
			frequency: freq,
			R: R,
			Q: Q,
			da: da,
			db: db,
			d2: d2,
			Ta2: Ta2,
			Tb2: Tb2,
			na: na,
			nb: nb,
			BT: BT
		};
	}	
	mtee.setspars(sparsArray);
	mtee.setglobal(global);
	mtee.Ct = (100 / Math.tanh(0.0072 * armSide.Z) + 0.64 * armSide.Z - 261) * WidthSide * 1e-12;
	mtee.microstrip = {
		commonWidth,
		branch1Width,
		branch2Width,
		Height,
		Thickness,
		er,
		rho,
		tand,
		roughnessRms,
		commonArm: armSide,
		branch1Arm: armA,
		branch2Arm: armB,
		Ct: mtee.Ct,
		source: 'QUCS microstrip tee equations 11.207 through 11.224; Edwards/Steer section 9.6.1 captures the same T-junction equivalent-circuit family, reference-plane shifts, transformer ratio, and shunt capacitance limits.',
		validity: {
			modelFamily: 'Hammerstad/Bekkadal-style tee reference-plane and transformer model as presented by QUCS and discussed by Edwards/Steer section 9.6.1',
			limitations: 'Edwards/Steer note no quoted accuracy for tee shunt-capacitance expressions and increasing discrepancy when 2 * effectiveWidth / guidedWavelength > 0.3 or impedance ratio exceeds about 2.'
		},
		analysis
	};
	mtee.physicalModel = physicalModelMetadata('microstrip', 'tee-junction', {
		commonWidth, branch1Width, branch2Width, height: Height, thickness: Thickness
	}, {
		relativePermittivity: er, resistivity: rho * COPPER_RESISTIVITY,
		lossTangent: tand, roughnessRms
	}, analysis, {sources: [mtee.microstrip.source], validity: mtee.microstrip.validity});
	return mtee;
};
