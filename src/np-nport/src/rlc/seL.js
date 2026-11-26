// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function seL(L = 5e-9, options = {}) { // series inductor nPort object
	var settings = validatedComponentSettings(global, options, 'seL');
	var seL = new nPort;
	var sparsArray = lumpedSpars('seL', settings, 'series', 'series', {inductance: L});
	seL.setspars(sparsArray);
	seL.setglobal(settings);
	seL._schematic = schematicPart('seL', {labelPrefix: 'seL', value: L});
	seL._dcModel = lumpedDcModel('seL', 'series', 'series', {inductance: L}, settings);
	return seL;
};
