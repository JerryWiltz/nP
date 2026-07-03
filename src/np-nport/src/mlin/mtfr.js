// Modified: 2026-07-03
import {cascade} from '../combining/cascade';
import {global} from '../../../np-global/src/global';
import {R} from '../rlc/R';
import {mlin} from './mlin';
import {INCH_TO_METER, MIL_TO_METER} from './constants';

export function mtfr({
	ohmsPerSquare = 50,
	Width = 10 * MIL_TO_METER,
	Length = 10 * MIL_TO_METER,
	Height = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	er = 10,
	tand = 0.001,
	temperatureCoefficient = 0,
	temperatureReference = 25,
	sections
} = {}) {
	var Temp = global.Temp;
	var squares = Length / Width;
	var resistanceAtReference = ohmsPerSquare * squares;
	var resistance = resistanceAtReference * (1 + temperatureCoefficient * (Temp - temperatureReference));
	var automaticSections = Math.min(200, Math.max(10, Math.ceil(squares * 10)));
	var sectionCount = sections === undefined ? automaticSections : Math.max(1, Math.floor(sections));
	var resistancePerSection = resistance / sectionCount;
	var halfLineLength = Length / (2 * sectionCount);
	var halfLine = mlin(Width, Height, halfLineLength, Thickness, er, 0, tand, 0);
	var resistorSection = R(resistancePerSection);
	var nPorts = [];

	for (var section = 0; section < sectionCount; section++) {
		nPorts.push(halfLine);
		nPorts.push(resistorSection);
		nPorts.push(halfLine);
	}

	var filmResistor = cascade(...nPorts);
	filmResistor.filmResistor = {
		ohmsPerSquare,
		Width,
		Length,
		Height,
		Thickness,
		er,
		tand,
		squares,
		resistanceAtReference,
		resistance,
		sections: sectionCount,
		automaticSections,
		resistancePerSection,
		halfLineLength,
		temperatureCoefficient,
		temperatureReference,
		temperature: Temp,
		model: 'distributed film resistor: cascaded mlin half-sections with sheet-resistance sections'
	};
	return filmResistor;
};
