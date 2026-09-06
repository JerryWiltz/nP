// Modified: 2026-09-06
import {cascade} from '../combining/cascade';
import {global} from '../../../np-global/src/global';
import {R} from '../rlc/R';
import {mlin} from './mlin';
import {INCH_TO_METER, MIL_TO_METER} from './constants';
import {normalizePhysicalModelOptions, physicalModelMetadata, requireFinite, requireNonnegative, requirePositive} from '../physicalModels/options';

export function mtfr(input = {}) {
	var options = normalizePhysicalModelOptions('mtfr', input, [
		{name: 'ohmsPerSquare', defaultValue: 50}, {name: 'width', aliases: ['Width'], defaultValue: 10 * MIL_TO_METER},
		{name: 'length', aliases: ['Length'], defaultValue: 10 * MIL_TO_METER},
		{name: 'height', aliases: ['Height'], defaultValue: 0.025 * INCH_TO_METER},
		{name: 'thickness', aliases: ['Thickness'], defaultValue: 0.0000125 * INCH_TO_METER},
		{name: 'relativePermittivity', aliases: ['er'], defaultValue: 10},
		{name: 'lossTangent', aliases: ['tand'], defaultValue: 0.001},
		{name: 'temperatureCoefficient', defaultValue: 0}, {name: 'referenceTemperature', aliases: ['temperatureReference'], defaultValue: 298.15},
		{name: 'sections', defaultValue: undefined}
	]);
	var ohmsPerSquare = options.ohmsPerSquare, Width = options.width, Length = options.length, Height = options.height;
	var Thickness = options.thickness, er = options.relativePermittivity, tand = options.lossTangent;
	var temperatureCoefficient = options.temperatureCoefficient, temperatureReference = options.referenceTemperature, sections = options.sections;
	var usesLegacyTemperatureReference = Object.prototype.hasOwnProperty.call(input, 'temperatureReference');
	var temperatureUnit = usesLegacyTemperatureReference ? 'legacy global.Temp scale' : 'kelvin';
	requireNonnegative('mtfr', 'ohmsPerSquare', ohmsPerSquare); requirePositive('mtfr', 'width', Width); requireNonnegative('mtfr', 'length', Length);
	requirePositive('mtfr', 'height', Height); requireNonnegative('mtfr', 'thickness', Thickness); requirePositive('mtfr', 'relativePermittivity', er);
	requireNonnegative('mtfr', 'lossTangent', tand); requireFinite('mtfr', 'temperatureCoefficient', temperatureCoefficient);
	if (usesLegacyTemperatureReference) requireFinite('mtfr', 'temperatureReference', temperatureReference);
	else requirePositive('mtfr', 'referenceTemperature', temperatureReference);
	if (sections !== undefined && (!Number.isInteger(sections) || sections < 1)) throw new RangeError('nP.mtfr(): sections must be a positive integer.');
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
		temperatureUnit,
		temperature: Temp,
		model: 'distributed film resistor: cascaded mlin half-sections with sheet-resistance sections'
	};
	filmResistor.physicalModel = physicalModelMetadata('microstrip', 'thin-film-resistor', {
		width: Width, length: Length, height: Height, thickness: Thickness
	}, {relativePermittivity: er, lossTangent: tand}, [], {
		ohmsPerSquare, temperatureCoefficient, referenceTemperature: temperatureReference,
		temperatureUnit, sections: sectionCount
	});
	return filmResistor;
};
