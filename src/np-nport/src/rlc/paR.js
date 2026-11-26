// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';
import {validatedComponentSettings, requireNumber, checkedNoise} from '../numericValidation';

const kB = 1.380649e-23;

export function paR(R = 75, temperature = global.Temp, options = {}) { // parallel resistor nPort object
	if (R !== null && typeof R === 'object' && !Array.isArray(R)) {
		options = R;
		temperature = R.temperature === undefined ? global.Temp : R.temperature;
		R = R.resistance === undefined ? 75 : R.resistance;
	}
	var settings = validatedComponentSettings(global, options, 'paR');
	requireNumber('paR', 'temperature (kelvin)', temperature, {nonnegative: true});
	var paR = new nPort;
	var sparsArray = lumpedSpars('paR', settings, 'shunt', 'series', {resistance: R});
	var noise = kB * temperature * 4 * R * settings.Ro / ((settings.Ro + 2 * R) ** 2);
	var noiseArray = sparsArray.map(function (row) {
		return {frequency: row[0], C: [[complex(noise, 0), complex(noise, 0)],
			[complex(noise, 0), complex(noise, 0)]]};
	});
	checkedNoise('paR', noiseArray);
	paR.setspars(sparsArray);
	paR.noise = noiseArray;
	paR.setglobal(settings);
	paR._schematic = schematicPart('paR', {labelPrefix: 'paR', value: R});
	paR._dcModel = lumpedDcModel('paR', 'shunt', 'series', {resistance: R}, settings, temperature);
	return paR;
};
