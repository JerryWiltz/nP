// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';
import {validatedComponentSettings, requireNumber, checkedNoise} from '../numericValidation';

const kB = 1.380649e-23;

export function R(R = 75, temperature = global.Temp, options = {}) { // series resistor nPort object
	var settings = validatedComponentSettings(global, options, 'R');
	requireNumber('R', 'temperature (kelvin)', temperature, {nonnegative: true});
	var rPort = new nPort;
	var sparsArray = lumpedSpars('R', settings, 'series', 'series', {resistance: R});
	var noise = kB * temperature * 4 * R * settings.Ro / ((R + 2 * settings.Ro) ** 2);
	var noiseArray = sparsArray.map(function (row) {
		return {frequency: row[0], C: [[complex(noise, 0), complex(-noise, 0)],
			[complex(-noise, 0), complex(noise, 0)]]};
	});
	checkedNoise('R', noiseArray);
	rPort.setspars(sparsArray);
	rPort.noise = noiseArray;
	rPort.setglobal(settings);
	rPort._schematic = schematicPart('R', {value: R});
	rPort._dcModel = lumpedDcModel('R', 'series', 'series', {resistance: R}, settings, temperature);
	return rPort;
};
