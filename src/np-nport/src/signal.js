// Modified: 2026-10-13
import {complex} from '../../np-math/src/complex';

// A deterministic signal uses one complex outgoing-wave vector per S row.
export function validateSignal(signal, spars) {
	if (!signal || !Number.isInteger(signal.sampleCount) || signal.sampleCount < 1 ||
		!Number.isFinite(signal.sampleRateHz) || signal.sampleRateHz <= 0 ||
		!Number.isFinite(signal.referenceImpedanceOhms) || signal.referenceImpedanceOhms <= 0 ||
		(signal.samplesPerBit !== undefined &&
			(!Number.isInteger(signal.samplesPerBit) || signal.samplesPerBit < 1 ||
				signal.sampleCount % signal.samplesPerBit !== 0)) ||
		!Array.isArray(signal.rows) || (spars && signal.rows.length !== spars.length)) {
		throw new RangeError('Digital signal metadata and frequency rows must match the nPort.');
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
			throw new RangeError('Digital signal waves must match the S-parameter frequency and port count.');
		}
	}
	return signal;
}

export function compatibleSignals(first, second) {
	if (!first) return second;
	if (!second) return first;
	if (first.sampleCount !== second.sampleCount ||
		first.sampleRateHz !== second.sampleRateHz ||
		first.referenceImpedanceOhms !== second.referenceImpedanceOhms ||
		(first.carrierHz || 0) !== (second.carrierHz || 0)) {
		throw new RangeError('Digital sources must have matching sample counts, rates, carriers, and reference impedances.');
	}
	if (first.samplesPerBit !== second.samplesPerBit) {
		return {...first, samplesPerBit: undefined};
	}
	return first;
}

export function signalWithRows(template, rows) {
	return {
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
		throw new RangeError('Digital inputPort is outside the nPort dimensions.');
	}
	if (!Array.isArray(source.fList) || !Array.isArray(source.spectrum) ||
		source.fList.length !== spars.length || source.spectrum.length !== spars.length ||
		!Number.isInteger(source.sampleCount) || source.sampleCount < 1 ||
		!Number.isInteger(source.samplesPerBit) || source.samplesPerBit < 1 ||
		source.sampleCount % source.samplesPerBit !== 0 ||
		spars.length !== Math.floor(source.sampleCount / 2) + 1 ||
		!Number.isFinite(source.sampleRateHz) || source.sampleRateHz <= 0 ||
		!Number.isFinite(source.referenceImpedanceOhms) || source.referenceImpedanceOhms <= 0 ||
		source.fList.some(function (frequency, index) { return frequency !== spars[index][0]; }) ||
		source.spectrum.some(function (value) {
			return !value || typeof value.getR !== 'function' || typeof value.getI !== 'function' ||
				!Number.isFinite(value.getR()) || !Number.isFinite(value.getI());
		})) {
		throw new RangeError('Digital input frequencies and spectrum must match the nPort.');
	}
	if (network.global && network.global.Ro !== source.referenceImpedanceOhms) {
		throw new RangeError('Digital input reference impedance must match the nPort.');
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
