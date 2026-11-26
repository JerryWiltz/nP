// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function L(L = 5e-9, options = {}) { // series inductor nPort object
	var settings = validatedComponentSettings(global, options, 'L');
	var lPort = new nPort;
	var sparsArray = lumpedSpars('L', settings, 'series', 'series', {inductance: L});
	lPort.setspars(sparsArray);
	lPort.setglobal(settings);
	lPort._schematic = schematicPart('L', {value: L});
	lPort._dcModel = lumpedDcModel('L', 'series', 'series', {inductance: L}, settings);
	return lPort;
};
