import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort'
import {global}  from '../../../np-global/src/global';

// Modified: 2026-09-08
const kB = 1.380649e-23;

export function paR(R = 75, temperature = global.Temp) { // parallel resistor nPort object
	if (typeof R === 'object') {
		temperature = R.temperature === undefined ? global.Temp : R.temperature;
		R = R.resistance === undefined ? 75 : R.resistance;
	}
	var paR = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [], noiseArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z[freqCount] = complex(R, 0);
		Y[freqCount] = Z[freqCount].inv();
		s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
		s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
		s12 = s21;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		var noise = kB * temperature * 4 * R * Ro / ((Ro + 2 * R) ** 2);
		noiseArray[freqCount] = {
			frequency: frequencyList[freqCount],
			C: [
				[complex(noise, 0), complex(noise, 0)],
				[complex(noise, 0), complex(noise, 0)]
			]
		};
	}
	paR.setspars(sparsArray);
	paR.noise = noiseArray;
	paR.setglobal(global);	
	return paR;
};
