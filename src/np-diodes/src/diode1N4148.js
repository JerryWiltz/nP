// Modified: 2026-10-04
import {complex} from '../../np-math/src/complex';
import {global} from '../../np-global/src/global';
import {analysisFrequencies} from '../../np-nport/src/intermod';
import {nPort} from '../../np-nport/src/nPort';

const Q = 1.602176634e-19;
const K = 1.380649e-23;

function thermalVoltage(temperatureK) {
	return K * temperatureK / Q;
}

function normalizeOptions(options) {
	return {
		is: options.is ?? 2.75e-11,
		n: options.n ?? 2,
		rs: options.rs ?? 0.568,
		cj0: options.cj0 ?? 4e-12,
		vj: options.vj ?? 0.75,
		m: options.m ?? 0.5,
		tt: options.tt ?? 4e-9,
		leakageResistance: options.leakageResistance ?? 4e9,
		breakdownVoltage: options.breakdownVoltage ?? 100,
		breakdownCurrent: options.breakdownCurrent ?? 100e-6,
		breakdownSoftness: options.breakdownSoftness ?? 2,
		biasVoltage: options.biasVoltage ?? 0,
		temperatureK: options.temperatureK ?? global.Temp,
		ivStart: options.ivStart ?? -110,
		ivStop: options.ivStop ?? 1,
		ivPoints: options.ivPoints ?? 401
	};
}

function junctionCapacitance(voltage, cj0, vj, m) {
	if (voltage < vj) {
		return cj0 / Math.pow(1 - voltage / vj, m);
	}

	return cj0 / Math.pow(1e-12, m);
}

function breakdownCurrent(junctionVoltage, p) {
	var excessVoltage = Math.max(-junctionVoltage - p.breakdownVoltage, 0);

	return -p.breakdownCurrent * (Math.exp(excessVoltage / p.breakdownSoftness) - 1);
}

function breakdownConductance(junctionVoltage, p) {
	if (-junctionVoltage <= p.breakdownVoltage) {
		return 0;
	}

	return p.breakdownCurrent * Math.exp((-junctionVoltage - p.breakdownVoltage) / p.breakdownSoftness) / p.breakdownSoftness;
}

function diodeCurrentAtVoltage(voltage, p) {
	var vt = thermalVoltage(p.temperatureK);
	var current = voltage >= 0 ? voltage / Math.max(p.rs + p.n * vt / p.is, 1) : -p.is;
	var iteration;
	var limitedExp;
	var junctionVoltage;
	var expTerm;
	var f;
	var df;
	var next;
	var avalancheCurrent;
	var avalancheConductance;

	for (iteration = 0; iteration < 60; iteration++) {
		junctionVoltage = voltage - current * p.rs;
		limitedExp = Math.min(junctionVoltage / (p.n * vt), 80);
		expTerm = Math.exp(limitedExp);
		avalancheCurrent = breakdownCurrent(junctionVoltage, p);
		avalancheConductance = breakdownConductance(junctionVoltage, p);
		f = current - p.is * (expTerm - 1) - junctionVoltage / p.leakageResistance - avalancheCurrent;
		df = 1 + p.rs * p.is * expTerm / (p.n * vt) + p.rs / p.leakageResistance + p.rs * avalancheConductance;
		next = current - f / df;

		if (Math.abs(next - current) <= Math.max(1e-15, Math.abs(next) * 1e-12)) {
			return next;
		}

		current = next;
	}

	return current;
}

function diodeAdmittanceAtBias(p) {
	var vt = thermalVoltage(p.temperatureK);
	var current = diodeCurrentAtVoltage(p.biasVoltage, p);
	var junctionVoltage = p.biasVoltage - current * p.rs;
	var limitedExp = Math.min(junctionVoltage / (p.n * vt), 80);
	var conductance = p.is * Math.exp(limitedExp) / (p.n * vt) + 1 / p.leakageResistance + breakdownConductance(junctionVoltage, p);

	return {
		current,
		junctionVoltage,
		conductance,
		resistance: conductance > 0 ? 1 / conductance : Number.POSITIVE_INFINITY
	};
}

function seriesTwoPortFromImpedance(frequency, impedance, ro) {
	var zo = complex(ro, 0);
	var twoZo = complex(2 * ro, 0);
	var denominator = impedance.add(twoZo);
	var s11 = impedance.div(denominator);
	var s21 = twoZo.div(denominator);

	return [frequency, s11, s21, s21, s11];
}

export function diode1N4148(options = {}) {
	var p = normalizeOptions(options);
	var diodePort = new nPort();
	var frequencyList = analysisFrequencies(global);
	var ro = global.Ro;
	var twoZo = complex(2 * ro, 0);
	var dc = diodeAdmittanceAtBias(p);
	var cj = junctionCapacitance(dc.junctionVoltage, p.cj0, p.vj, p.m);
	var diffusionCapacitance = p.tt * dc.conductance;
	var capacitance = cj + diffusionCapacitance;
	var sparsArray = [];
	var noiseArray = [];
	var freqCount;
	var frequency;
	var omega;
	var admittance;
	var junctionImpedance;
	var totalImpedance;
	var thermalEnergy = K * p.temperatureK;
	var diodeCurrent = p.is * Math.expm1(Math.min(dc.junctionVoltage / (p.n * thermalVoltage(p.temperatureK)), 80));
	var avalanche = breakdownCurrent(dc.junctionVoltage, p);
	// A linearized junction has equilibrium conductance noise at zero bias.
	// At finite bias, use the larger of that level and a weak shot-noise estimate.
	var junctionNoiseCurrent = Math.max(
		4 * thermalEnergy * Math.max(0, dc.conductance - 1 / p.leakageResistance),
		2 * Q * (Math.abs(diodeCurrent) + Math.abs(avalanche))
	) + 4 * thermalEnergy / p.leakageResistance;
	var junctionVoltageScale = p.n * thermalVoltage(p.temperatureK);
	var exponentialCurrent = p.is * Math.exp(Math.min(dc.junctionVoltage / junctionVoltageScale, 80));
	var secondDerivative = exponentialCurrent / junctionVoltageScale ** 2;
	var thirdDerivative = exponentialCurrent / junctionVoltageScale ** 3;
	if (-dc.junctionVoltage > p.breakdownVoltage) {
		var avalancheSlope = p.breakdownCurrent *
			Math.exp((-dc.junctionVoltage - p.breakdownVoltage) / p.breakdownSoftness);
		secondDerivative -= avalancheSlope / p.breakdownSoftness ** 2;
		thirdDerivative += avalancheSlope / p.breakdownSoftness ** 3;
	}
	var capacitanceDerivative = p.tt * secondDerivative;
	var capacitanceSecondDerivative = p.tt * thirdDerivative;
	if (dc.junctionVoltage < p.vj) {
		capacitanceDerivative += p.m * cj / (p.vj - dc.junctionVoltage);
		capacitanceSecondDerivative += p.m * (p.m + 1) * cj /
			(p.vj - dc.junctionVoltage) ** 2;
	}

	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		frequency = frequencyList[freqCount];
		omega = 2 * Math.PI * frequency;
		admittance = complex(dc.conductance, omega * capacitance);
		junctionImpedance = admittance.inv();
		totalImpedance = complex(p.rs, 0).add(junctionImpedance);
		sparsArray[freqCount] = seriesTwoPortFromImpedance(frequency, totalImpedance, ro);
		var impedanceMagnitudeSquared = junctionImpedance.mag() ** 2;
		var denominatorMagnitudeSquared = totalImpedance.add(twoZo).mag() ** 2;
		var noise = (4 * thermalEnergy * p.rs + junctionNoiseCurrent * impedanceMagnitudeSquared) *
			ro / denominatorMagnitudeSquared;
		noiseArray[freqCount] = {frequency: frequency, C: [
			[complex(noise, 0), complex(-noise, 0)],
			[complex(-noise, 0), complex(noise, 0)]
		]};
	}

	diodePort.setspars(sparsArray);
	diodePort.noise = noiseArray;
	diodePort.setglobal(global);
	diodePort._intermod = {
		type: 'diode',
		conductance: dc.conductance,
		capacitance: capacitance,
		seriesResistance: p.rs,
		referenceImpedance: ro,
		secondDerivative: secondDerivative,
		thirdDerivative: thirdDerivative,
		capacitanceDerivative: capacitanceDerivative,
		capacitanceSecondDerivative: capacitanceSecondDerivative
	};
	diodePort.diode = {
		partNumber: '1N4148',
		model: 'small-signal RF series diode with Shockley DC I-V',
		source: 'Vishay 1N4148 Rev. 1.6, 07-Nov-2024; onsemi 1N91x, 1N4x48 Rev. 6, September 2024',
		parameters: p,
		bias: {
			voltage: p.biasVoltage,
			current: dc.current,
			junctionVoltage: dc.junctionVoltage,
			dynamicResistance: dc.resistance,
			junctionCapacitance: cj,
			diffusionCapacitance,
			totalCapacitance: capacitance
		},
		datasheetAnchors: {
			forwardVoltage: 'VF <= 1 V at IF = 10 mA',
			capacitance: 'CD/CT = 4 pF at VR = 0 V, f = 1 MHz',
			reverseRecovery: 'trr = 4 ns under listed switching test',
			reverseLeakage: 'IR = 25 nA at VR = 20 V; IR = 5 uA at VR = 75 V',
			breakdownVoltage: 'VBR >= 100 V at IR = 100 uA'
		}
	};
	diodePort.ivTable = function ivTable(start = p.ivStart, stop = p.ivStop, points = p.ivPoints) {
		var table = [['vD', 'iD']];
		var step = points > 1 ? (stop - start) / (points - 1) : 0;
		var index;
		var voltage;

		for (index = 0; index < points; index++) {
			voltage = start + step * index;
			table.push([voltage, diodeCurrentAtVoltage(voltage, p)]);
		}

		return table;
	};

	return diodePort;
}
