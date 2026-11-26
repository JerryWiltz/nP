// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function paC(C = 1e-12, options = {}) { // parallel capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'paC');
	var paC = new nPort;
	var sparsArray = lumpedSpars('paC', settings, 'shunt', 'series', {capacitance: C});
	paC.setspars(sparsArray);
	paC.setglobal(settings);
	paC._schematic = schematicPart('paC', {labelPrefix: 'paC', value: C});
	paC._dcModel = lumpedDcModel('paC', 'shunt', 'series', {capacitance: C}, settings);
	return paC;
};
