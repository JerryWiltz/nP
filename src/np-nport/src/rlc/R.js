// Modified: 2026-11-21
import {lumpedDcModel} from '../dcModel';
import {complex} from '../../../np-math/src/complex';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';
import {analysisFrequencies} from '../analysisFrequencies';
import {componentSettings} from '../componentSettings';

const kB = 1.380649e-23;

export function R(R = 75, temperature = global.Temp, options = {}) { // series resistor nPort object
	if (typeof R === 'object') {
		options = R;
		temperature = R.temperature === undefined ? global.Temp : R.temperature;
		R = R.resistance === undefined ? 75 : R.resistance;
	}
	var rPort = new nPort;
	var settings = componentSettings(global, options);
	var frequencyList = analysisFrequencies(settings), Ro = global.Ro;
	var Zo = complex(Ro,0), two = complex(2,0), freqCount, Z = [], s11, s12, s21, s22, sparsArray = [], noiseArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z[freqCount] = complex(R, 0);
		s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
		s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
		s12 = s21;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		var noise = kB * temperature * 4 * R * Ro / ((R + 2 * Ro) ** 2);
		noiseArray[freqCount] = {
			frequency: frequencyList[freqCount],
			C: [
				[complex(noise, 0), complex(-noise, 0)],
				[complex(-noise, 0), complex(noise, 0)]
			]
		};
	}	
	rPort.setspars(sparsArray);
	rPort.noise = noiseArray;
	rPort.setglobal(settings);
	rPort._schematic = schematicPart('R', {value: R});
	rPort._dcModel = lumpedDcModel('R', 'series', 'series', {resistance: R}, settings, temperature);
	return rPort;
};
