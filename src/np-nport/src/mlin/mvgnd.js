// Modified: 2026-07-02
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {COPPER_RESISTIVITY, INCH_TO_METER, MU0} from './constants';

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

export function mvgnd({
	Diameter = 100e-6,
	Height = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	rho = COPPER_RESISTIVITY
} = {}) {
	var via = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var radius = Diameter / 2;
	var L = viaInductance(Height, radius);
	var Rdc = viaResistanceDc(Height, radius, Thickness, rho);
	// QUCS technical manual, Microstrip via hole, eqs. 11.233 and 11.234.
	var fdelta = rho / (pi * MU0 * Thickness * Thickness);
	var sparsArray = [];
	var analysis = [];

	for (var freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var frequency = frequencyList[freqCount];
		var R = Rdc * Math.sqrt(1 + frequency / fdelta);
		var Z = complex(R, 2 * pi * frequency * L);
		var s11 = Z.sub(complex(Ro, 0)).div(Z.add(complex(Ro, 0)));
		sparsArray[freqCount] = [frequency, s11];
		analysis[freqCount] = {
			frequency,
			R,
			X: 2 * pi * frequency * L,
			Z
		};
	}

	via.setspars(sparsArray);
	via.setglobal(global);
	via.microstrip = {
		Diameter,
		radius,
		Height,
		Thickness,
		rho,
		Rdc,
		L,
		fdelta,
		validity: 'Goldfarb/Pucel via model stated for Height < 0.03 * lambda0',
		analysis
	};
	return via;
};
