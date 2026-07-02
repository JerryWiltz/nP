// Modified: 2026-07-02
import {complex} from '../../../np-math/src/complex';
import {matrix, dim} from '../../../np-math/src/matrix';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {INCH_TO_METER, VACUUM_IMPEDANCE} from './constants';

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
		D: VACUUM_IMPEDANCE / Math.sqrt(ere) * Height / Z,
		fp: 4e5 * Z / Height
	};
};

var emptyCplxMatrix = function (size) {
	var out = dim(size, size, complex(0, 0));
	for (var row = 0; row < size; row++) {
		for (var col = 0; col < size; col++) {
			out[row][col] = complex(0, 0);
		}
	}
	return out;
};

var stampAdmittance = function (Y, nodeA, nodeB, admittance) {
	if (nodeB === null) {
		Y[nodeA][nodeA] = Y[nodeA][nodeA].add(admittance);
		return;
	}

	Y[nodeA][nodeA] = Y[nodeA][nodeA].add(admittance);
	Y[nodeB][nodeB] = Y[nodeB][nodeB].add(admittance);
	Y[nodeA][nodeB] = Y[nodeA][nodeB].sub(admittance);
	Y[nodeB][nodeA] = Y[nodeB][nodeA].sub(admittance);
};

var subMatrix = function (source, rows, cols) {
	var out = dim(rows.length, cols.length, complex(0, 0));
	for (var row = 0; row < rows.length; row++) {
		for (var col = 0; col < cols.length; col++) {
			out[row][col] = source[rows[row]][cols[col]];
		}
	}
	return matrix(out);
};

var reducedExternalY = function (Y) {
	var ports = [0, 1, 2, 3];
	var internal = [4, 5];
	var Ypp = subMatrix(Y, ports, ports);
	var Ypi = subMatrix(Y, ports, internal);
	var Yip = subMatrix(Y, internal, ports);
	var Yii = subMatrix(Y, internal, internal);
	return Ypp.subCplx(Ypi.mulCplx(Yii.invertCplx()).mulCplx(Yip));
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

var yToS = function (Y, Ro) {
	var size = Y.m.length;
	var I = identityCplx(size);
	var normalizedY = dim(size, size, complex(0, 0));
	for (var row = 0; row < size; row++) {
		for (var col = 0; col < size; col++) {
			normalizedY[row][col] = Y.m[row][col].mul(complex(Ro, 0));
		}
	}
	var y = matrix(normalizedY);
	return I.subCplx(y).mulCplx(I.addCplx(y).invertCplx());
};

var crossCapacitanceBase = function (width, crossingWidth, Height) {
	// QUCS technical manual, Microstrip cross, eqs. 11.226 and 11.227.
	var widthOverHeight = width / Height;
	var crossingOverHeight = crossingWidth / Height;
	var X = Math.log10(widthOverHeight) *
		(86.6 * crossingOverHeight - 30.9 * Math.sqrt(crossingOverHeight) + 367) +
		cube(crossingOverHeight) + 74 * crossingOverHeight + 130;
	return 1e-12 * width *
		(0.25 * X * widthOverHeight ** (-1 / 3) - 60 +
		1 / (2 * crossingOverHeight) -
		0.375 * widthOverHeight * (1 - crossingOverHeight));
};

var capCorrection = function (width, Height, Thickness, er) {
	// QUCS technical manual, Microstrip cross, eq. 11.231.
	var reference = microstripLine(width, Height, Thickness, 9.9);
	var actual = microstripLine(width, Height, Thickness, er);
	return reference.Z / actual.Z * Math.sqrt(actual.ere / reference.ere);
};

var armCapacitance = function (width, crossingWidth, Height, Thickness, er) {
	return crossCapacitanceBase(width, crossingWidth, Height) *
		capCorrection(width, Height, Thickness, er);
};

var armInductance = function (width, crossingWidth, Height) {
	// QUCS technical manual, Microstrip cross, eqs. 11.228 and 11.229.
	var widthOverHeight = width / Height;
	var crossingOverHeight = crossingWidth / Height;
	var Y = 165.6 * crossingOverHeight + 31.2 * Math.sqrt(crossingOverHeight) - 11.8 * square(crossingOverHeight);
	return 1e-9 * Height *
		(Y * widthOverHeight - 32 * crossingOverHeight + 3) *
		widthOverHeight ** -1.5;
};

var centerInductance = function (horizontalWidth, verticalWidth, Height) {
	// QUCS technical manual, Microstrip cross, eq. 11.230 with the 0.8 correction noted there.
	var horizontalOverHeight = horizontalWidth / Height;
	var verticalOverHeight = verticalWidth / Height;
	var L = 1e-9 * Height *
		(5 * verticalOverHeight * Math.cos(pi / 2 * (1.5 - horizontalOverHeight)) -
		(1 + 7 / horizontalOverHeight) / verticalOverHeight -
		337.5);
	return 0.8 * L;
};

export function mcross({
	leftWidth = 0.023 * INCH_TO_METER,
	topWidth = 0.023 * INCH_TO_METER,
	rightWidth = 0.023 * INCH_TO_METER,
	bottomWidth = 0.023 * INCH_TO_METER,
	Height = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	er = 10,
	rho = 1,
	tand = 0.001,
	roughnessRms = 0
} = {}) {
	var cross = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var widths = [leftWidth, topWidth, rightWidth, bottomWidth];
	var arms = widths.map(function (width) { return microstripLine(width, Height, Thickness, er); });
	var sparsArray = [];
	var analysis = [];
	var horizontalWidth = 0.5 * (leftWidth + rightWidth);
	var verticalWidth = 0.5 * (topWidth + bottomWidth);
	var armCaps = [
		armCapacitance(leftWidth, verticalWidth, Height, Thickness, er),
		armCapacitance(topWidth, horizontalWidth, Height, Thickness, er),
		armCapacitance(rightWidth, verticalWidth, Height, Thickness, er),
		armCapacitance(bottomWidth, horizontalWidth, Height, Thickness, er)
	];
	var armInds = [
		armInductance(leftWidth, verticalWidth, Height),
		armInductance(topWidth, horizontalWidth, Height),
		armInductance(rightWidth, verticalWidth, Height),
		armInductance(bottomWidth, horizontalWidth, Height)
	];
	var Lcenter = centerInductance(horizontalWidth, verticalWidth, Height);
	var Ct = armCaps.reduce(function (sum, cap) { return sum + cap; }, 0);

	for (var freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var freq = frequencyList[freqCount];
		var omega = 2 * pi * freq;
		var Y = emptyCplxMatrix(6);

		stampAdmittance(Y, 0, 4, complex(0, -1 / (omega * armInds[0])));
		stampAdmittance(Y, 1, 5, complex(0, -1 / (omega * armInds[1])));
		stampAdmittance(Y, 2, 4, complex(0, -1 / (omega * armInds[2])));
		stampAdmittance(Y, 3, 5, complex(0, -1 / (omega * armInds[3])));
		stampAdmittance(Y, 4, 5, complex(0, -1 / (omega * Lcenter)));

		for (var i = 0; i < arms.length; i++) {
			stampAdmittance(Y, i, null, complex(0, omega * armCaps[i]));
		}

		var externalY = reducedExternalY(Y);
		var S = yToS(externalY, Ro);
		var row = [freq];
		for (var sRow = 0; sRow < 4; sRow++) {
			for (var sCol = 0; sCol < 4; sCol++) {
				row.push(S.m[sRow][sCol]);
			}
		}

		sparsArray[freqCount] = row;
		analysis[freqCount] = {
			frequency: freq,
			armCaps: armCaps.slice(),
			armInds: armInds.slice(),
			Lcenter: Lcenter,
			Ct: Ct,
			Y: externalY.m
		};
	}

	cross.setspars(sparsArray);
	cross.setglobal(global);
	cross.Ct = Ct;
	cross.microstrip = {
		leftWidth,
		topWidth,
		rightWidth,
		bottomWidth,
		Height,
		Thickness,
		er,
		rho,
		tand,
		roughnessRms,
		leftArm: arms[0],
		topArm: arms[1],
		rightArm: arms[2],
		bottomArm: arms[3],
		armCaps,
		armInds,
		Lcenter,
		Ct,
		analysis
	};
	return cross;
};
