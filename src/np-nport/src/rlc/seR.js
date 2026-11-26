// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';
import {validatedComponentSettings, requireNumber, checkedNoise} from '../numericValidation';

const kB = 1.380649e-23;

export function seR(R = 75, temperature = global.Temp, options = {}) { // series resistor nPort object
	if (R !== null && typeof R === 'object' && !Array.isArray(R)) {
		options = R;
		temperature = R.temperature === undefined ? global.Temp : R.temperature;
		R = R.resistance === undefined ? 75 : R.resistance;
	}
	var settings = validatedComponentSettings(global, options, 'seR');
	requireNumber('seR', 'temperature (kelvin)', temperature, {nonnegative: true});
	var seR = new nPort;
	var sparsArray = lumpedSpars('seR', settings, 'series', 'series', {resistance: R});
	var noise = kB * temperature * 4 * R * settings.Ro / ((R + 2 * settings.Ro) ** 2);
	var noiseArray = sparsArray.map(function (row) {
		return {frequency: row[0], C: [[complex(noise, 0), complex(-noise, 0)],
			[complex(-noise, 0), complex(noise, 0)]]};
	});
	checkedNoise('seR', noiseArray);
	seR.setspars(sparsArray);
	seR.noise = noiseArray;
	seR.setglobal(settings);
	seR._schematic = schematicPart('seR', {value: R});
	seR._dcModel = lumpedDcModel('seR', 'series', 'series', {resistance: R}, settings, temperature);
	return seR;
};
