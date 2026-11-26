// Modified: 2026-11-26
import {withCurveOutput} from '../curveOutput';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {global} from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {componentSettings} from '../componentSettings';
import {nPort} from '../nPort';
import {BOLTZMANN as K, ELEMENTARY_CHARGE as Q} from '../physicalConstants';
import {seriesTwoPortFromImpedance} from './diodeRf';
import {dcModel} from '../dcModel';
import {legacyJunction, legacyDiodeCurrentAtVoltage, legacyDiodeAdmittance} from './legacyDiode';
import {validateDiodeState, validateDiodeDrop} from './diodeState';


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

export function diode1N4148(options = {}) {
	var p = normalizeOptions(options);
	var settings = componentSettings(global, options);
	return legacyDiodeInstance(p, settings);
}

function legacyDiodeInstance(p, settings, state, description) {
	var diodePort = new nPort();
	var frequencyList = analysisFrequencies(settings);
	var ro = settings.Ro;
	var twoZo = complex(2 * ro, 0);
	var dc = legacyDiodeAdmittance(p, p.biasVoltage, state?.junctionVoltage);
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
	var junction = legacyJunction(p, dc.junctionVoltage);
	var diodeCurrent = junction.forwardCurrent;
	var avalanche = junction.avalanche;
	// A linearized junction has equilibrium conductance noise at zero bias.
	// At finite bias, use the larger of that level and a weak shot-noise estimate.
	var junctionNoiseCurrent = Math.max(
		4 * thermalEnergy * Math.max(0, dc.conductance - 1 / p.leakageResistance),
		2 * Q * (Math.abs(diodeCurrent) + Math.abs(avalanche))
	) + 4 * thermalEnergy / p.leakageResistance;
	var secondDerivative = junction.second;
	var thirdDerivative = junction.third;
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
	diodePort.setglobal(settings);
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
			table.push([voltage, legacyDiodeCurrentAtVoltage(voltage, p)]);
		}

		return withCurveOutput(table, {axis: 'vd', measurements: ['id']});
	};

	diodePort._schematic = schematicPart('diode1N4148');
	diodePort._dcModel = description || dcModel('diode1N4148', 2, 'nonlinear', 'approximate', {modelId: 'legacy-diode',
		parameters: p, temperature: p.temperatureK, initialQPoint: diodePort.diode.bias}, settings);
	var captured = Object.freeze({...settings, ...diodePort._dcModel.analysis});
	diodePort._rfModel = Object.freeze({atOperatingPoint: legacyAtOperatingPoint.bind(null, diodePort._dcModel, captured)});
	return diodePort;
}

function legacyAtOperatingPoint(description, settings, input) {
    const state = validateDiodeState(input), p = {...description.definition.parameters, biasVoltage: state.vd};
    const junction = legacyJunction(p, state.junctionVoltage);
    validateDiodeDrop(state, state.junctionVoltage + p.rs * junction.current);
    if (Object.values(junction).some(value => !Number.isFinite(value))) throw new RangeError('Solved legacy diode state exceeds the model domain.');
    return legacyDiodeInstance(p, settings, state, description);
}
