// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function paL(L = 5e-9, options = {}) { // parallel capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'paL');
	var paL = new nPort;
	var sparsArray = lumpedSpars('paL', settings, 'shunt', 'series', {inductance: L});
	paL.setspars(sparsArray);
	paL.setglobal(settings);
	paL._schematic = schematicPart('paL', {labelPrefix: 'paL', value: L});
	paL._dcModel = lumpedDcModel('paL', 'shunt', 'series', {inductance: L}, settings);
	return paL;
};
