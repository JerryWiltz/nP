// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function sePaRC(R = 75, C = 1e-12, options = {}) { // parallel capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'sePaRC');
	var sePaRC = new nPort;
	var sparsArray = lumpedSpars('sePaRC', settings, 'series', 'parallel', {resistance: R, capacitance: C});
	sePaRC.setspars(sparsArray);
	sePaRC.setglobal(settings);
	sePaRC._schematic = schematicPart('sePaRC', {labelPrefix: 'sePaRC', resistance: R, capacitance: C});
	sePaRC._dcModel = lumpedDcModel('sePaRC', 'series', 'parallel', {resistance: R, capacitance: C}, settings);
	return sePaRC;
};
