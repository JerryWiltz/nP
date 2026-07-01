// Modified: 2026-07-01
import {complex} from '../../../np-math/src/complex';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {MIL_TO_METER} from './constants';

export function mtfr({
	ohmsPerSquare = 50,
	Width = 10 * MIL_TO_METER,
	Length = 10 * MIL_TO_METER,
	temperatureCoefficient = 0,
	temperatureReference = 25
} = {}) {
	var filmResistor = new nPort;
	var frequencyList = global.fList, Ro = global.Ro, Temp = global.Temp;
	var Zo = complex(Ro, 0), two = complex(2, 0), freqCount = 0;
	var squares = Length / Width;
	var resistanceAtReference = ohmsPerSquare * squares;
	var resistance = resistanceAtReference * (1 + temperatureCoefficient * (Temp - temperatureReference));
	var sparsArray = [];

	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var Z = complex(resistance, 0);
		var denominator = Z.add(Zo.add(Zo));
		var s11 = Z.div(denominator);
		var s21 = two.mul(Zo).div(denominator);
		var s12 = s21;
		var s22 = s11;
		sparsArray[freqCount] = [frequencyList[freqCount], s11, s12, s21, s22];
	}

	filmResistor.setspars(sparsArray);
	filmResistor.setglobal(global);
	filmResistor.filmResistor = {
		ohmsPerSquare,
		Width,
		Length,
		squares,
		resistanceAtReference,
		resistance,
		temperatureCoefficient,
		temperatureReference,
		temperature: Temp,
		model: 'series sheet resistance, R = ohmsPerSquare * Length / Width'
	};
	return filmResistor;
};
