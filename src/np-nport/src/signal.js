// Modified: 2026-10-22
import {complex} from '../../np-math/src/complex';

function analogMode(mode) {
	return ['AM', 'FM', 'PM', 'SSB', 'DSB-SC'].includes(mode);
}

function analogRowCount(signal) {
	if (signal.mode === 'AM') return 3;
	if (signal.mode === 'SSB') return 1;
	if (signal.mode === 'DSB-SC') return 2;
	return 2 * signal.sidebandOrder + 1;
}

function analogFrequency(signal, index) {
	if (signal.mode === 'SSB') return signal.carrierHz +
		(signal.sideband === 'USB' ? signal.toneHz : -signal.toneHz);
	if (signal.mode === 'DSB-SC') return signal.carrierHz +
		(index === 0 ? -signal.toneHz : signal.toneHz);
	return signal.carrierHz + (index - (analogRowCount(signal) - 1) / 2) * signal.toneHz;
}

// A deterministic signal uses one complex outgoing-wave vector per S row.
export function validateSignal(signal, spars) {
	var analog = signal && analogMode(signal.mode);
	var frequencyVna = signal && signal.mode === 'VNA-frequency';
	if (!signal || (!analog && !frequencyVna && (!Number.isInteger(signal.sampleCount) || signal.sampleCount < 1 ||
		!Number.isFinite(signal.sampleRateHz) || signal.sampleRateHz <= 0)) ||
		(analog && (!Number.isFinite(signal.carrierHz) || !Number.isFinite(signal.toneHz) ||
			signal.carrierHz <= 0 || signal.toneHz <= 0 ||
			(['AM', 'SSB', 'DSB-SC'].includes(signal.mode) && signal.carrierHz <= signal.toneHz) ||
			!Array.isArray(signal.rows) || signal.rows.length !==
				analogRowCount(signal) ||
			(['FM', 'PM'].includes(signal.mode) && (!Number.isInteger(signal.sidebandOrder) ||
				signal.sidebandOrder < 0)))) ||
		!Number.isFinite(signal.referenceImpedanceOhms) || signal.referenceImpedanceOhms <= 0 ||
		(signal.samplesPerBit !== undefined &&
			(!Number.isInteger(signal.samplesPerBit) || signal.samplesPerBit < 1 ||
				signal.sampleCount % signal.samplesPerBit !== 0)) ||
		!Array.isArray(signal.rows) || (spars && signal.rows.length !== spars.length)) {
		throw new RangeError('Signal metadata and frequency rows must match the nPort.');
	}
	for (var i = 0; i < signal.rows.length; i++) {
		var row = signal.rows[i];
		var portCount = spars ? Math.sqrt(spars[i].length - 1) : row && row.waves && row.waves.length;
		if (!row || (spars && row.frequency !== spars[i][0]) ||
			!Array.isArray(row.waves) || row.waves.length !== portCount ||
			row.waves.some(function (wave) {
				return !wave || typeof wave.getR !== 'function' || typeof wave.getI !== 'function' ||
					!Number.isFinite(wave.getR()) || !Number.isFinite(wave.getI());
			})) {
			throw new RangeError('Signal waves must match the S-parameter frequency and port count.');
		}
	}
	return signal;
}

export function compatibleSignals(first, second) {
	if (!first) return second;
	if (!second) return first;
	var firstAnalog = analogMode(first.mode);
	var secondAnalog = analogMode(second.mode);
	if ((first.mode === 'VNA-frequency' || second.mode === 'VNA-frequency') &&
		(first.mode !== second.mode ||
		first.referenceImpedanceOhms !== second.referenceImpedanceOhms ||
		first.rows.length !== second.rows.length ||
		first.rows.some(function (row, index) { return row.frequency !== second.rows[index].frequency; }))) {
		throw new RangeError('VNA-frequency sources must have matching frequencies and reference impedances.');
	}
	if (first.mode !== second.mode && (firstAnalog || secondAnalog)) {
		throw new RangeError('Analog and sampled digital signals, or different analog modes, cannot share one connection.');
	}
	if (firstAnalog && (first.toneHz !== second.toneHz ||
		first.carrierHz !== second.carrierHz ||
		first.sidebandOrder !== second.sidebandOrder ||
		first.sideband !== second.sideband ||
		first.referenceImpedanceOhms !== second.referenceImpedanceOhms)) {
		throw new RangeError('Analog sources must have matching carrier, tone, sideband order, and reference impedance.');
	}
	if (!firstAnalog && (first.mode !== second.mode ||
		first.sampleCount !== second.sampleCount ||
		first.sampleRateHz !== second.sampleRateHz ||
		first.encoding !== second.encoding ||
		first.order !== second.order ||
		first.fftSize !== second.fftSize ||
		first.subcarrierCount !== second.subcarrierCount ||
		first.symbolRate !== second.symbolRate ||
		first.frequencyDeviationHz !== second.frequencyDeviationHz ||
		first.bt !== second.bt ||
		first.referenceImpedanceOhms !== second.referenceImpedanceOhms ||
		(first.carrierHz || 0) !== (second.carrierHz || 0))) {
		throw new RangeError('Digital sources must have matching sample counts, rates, carriers, and reference impedances.');
	}
	if (first.samplesPerBit !== second.samplesPerBit) {
		return {...first, samplesPerBit: undefined};
	}
	return first;
}

export function signalWithRows(template, rows) {
	return {
		mode: template.mode,
		fList: template.fList,
		dataMode: template.dataMode,
		encoding: template.encoding,
		toneHz: template.toneHz,
		beta: template.beta,
		sidebandOrder: template.sidebandOrder,
		sidebandPowerTolerance: template.sidebandPowerTolerance,
		modulationIndex: template.modulationIndex,
		toneAmplitudeVolts: template.toneAmplitudeVolts,
		sideband: template.sideband,
		carrierAmplitudeVolts: template.carrierAmplitudeVolts,
		frequencyDeviationHz: template.frequencyDeviationHz,
		order: template.order,
		bitsPerSymbol: template.bitsPerSymbol,
		referenceSymbols: template.referenceSymbols,
		bitCount: template.bitCount,
		bt: template.bt,
		subcarrierCount: template.subcarrierCount,
		fftSize: template.fftSize,
		symbolRate: template.symbolRate,
		subcarrierMode: template.subcarrierMode,
		sampleCount: template.sampleCount,
		sampleRateHz: template.sampleRateHz,
		referenceImpedanceOhms: template.referenceImpedanceOhms,
		samplesPerBit: template.samplesPerBit,
		carrierHz: template.carrierHz,
		rows: rows
	};
}

// Drive an external nPort input with a periodic, matched-source voltage spectrum.
export function applyInputSignal(network, options) {
	if (!options || !options.signal) return network;
	var source = options.signal;
	var spars = network.getspars();
	var portCount = Math.sqrt(spars[0].length - 1);
	var inputPort = options.inputPort === undefined ? 1 : options.inputPort;
	if (!Number.isInteger(inputPort) || inputPort < 1 || inputPort > portCount) {
		throw new RangeError('Signal inputPort is outside the nPort dimensions.');
	}
	var analog = analogMode(source.mode);
	var vna = source.mode === 'VNA-time';
	var frequencyVna = source.mode === 'VNA-frequency';
	var sidebandOrder = source.mode === 'AM' ? 1 : source.sidebandOrder;
	if (!Array.isArray(source.fList) || !Array.isArray(source.spectrum) ||
		source.fList.length !== spars.length || source.spectrum.length !== spars.length ||
		(analog ? (!Number.isFinite(source.carrierHz) || !Number.isFinite(source.toneHz) ||
			source.carrierHz <= 0 || source.toneHz <= 0 ||
			(['AM', 'SSB', 'DSB-SC'].includes(source.mode) && source.carrierHz <= source.toneHz) ||
			(['FM', 'PM', 'AM'].includes(source.mode) &&
				(!Number.isInteger(sidebandOrder) || sidebandOrder < 0)) ||
			spars.length !== analogRowCount(source) ||
			source.fList.some(function (frequency, index) {
				return frequency !== analogFrequency(source, index);
			})) : frequencyVna ?
			(source.fList.length === 0 || source.fList.some(function (frequency, index) {
				return !Number.isFinite(frequency) || frequency < 0 ||
					(index > 0 && frequency <= source.fList[index - 1]);
			})) :
			(!Number.isInteger(source.sampleCount) || source.sampleCount < 1 ||
			(vna ? source.samplesPerBit !== undefined : source.mode === 'OFDM' ?
				(!Number.isInteger(source.bitCount) || source.bitCount < 1 ||
				!Number.isInteger(source.fftSize) || source.fftSize < 1 ||
				 source.sampleCount % source.fftSize !== 0) :
				(!Number.isInteger(source.samplesPerBit) || source.samplesPerBit < 1 ||
				 source.sampleCount % source.samplesPerBit !== 0)) ||
			spars.length !== Math.floor(source.sampleCount / 2) + 1 ||
			!Number.isFinite(source.sampleRateHz) || source.sampleRateHz <= 0)) ||
		!Number.isFinite(source.referenceImpedanceOhms) || source.referenceImpedanceOhms <= 0 ||
		source.fList.some(function (frequency, index) { return frequency !== spars[index][0]; }) ||
		source.spectrum.some(function (value) {
			return !value || typeof value.getR !== 'function' || typeof value.getI !== 'function' ||
				!Number.isFinite(value.getR()) || !Number.isFinite(value.getI());
		})) {
		throw new RangeError('Input signal frequencies and spectrum must match the nPort.');
	}
	if (network.global && network.global.Ro !== source.referenceImpedanceOhms) {
		throw new RangeError('Signal input reference impedance must match the nPort.');
	}
	var template = compatibleSignals(network.signal, source);
	var scale = Math.sqrt(source.referenceImpedanceOhms);
	var rows = spars.map(function (sRow, index) {
		var waves = [];
		for (var port = 0; port < portCount; port++) {
			var existing = network.signal ? network.signal.rows[index].waves[port] : complex(0, 0);
			var response = sRow[1 + port * portCount + inputPort - 1].mul(source.spectrum[index]).div(complex(scale, 0));
			waves[port] = existing.add(response);
		}
		return {frequency: sRow[0], waves: waves};
	});
	network.signal = signalWithRows(template, rows);
	return network;
}
