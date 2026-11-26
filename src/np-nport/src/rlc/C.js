// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function C(C = 1e-12, options = {}) { // series capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'C');
	var cPort = new nPort;
	var sparsArray = lumpedSpars('C', settings, 'series', 'series', {capacitance: C});
	cPort.setspars(sparsArray);
	cPort.setglobal(settings);
	cPort._schematic = schematicPart('C', {value: C});
	cPort._dcModel = lumpedDcModel('C', 'series', 'series', {capacitance: C}, settings);
	return cPort;
};
