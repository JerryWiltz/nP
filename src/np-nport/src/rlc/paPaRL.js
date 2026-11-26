// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function paPaRL(R = 75, L = 5e-9, options = {}) { // parallel capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'paPaRL');
	var paPaRL = new nPort;
	var sparsArray = lumpedSpars('paPaRL', settings, 'shunt', 'parallel', {resistance: R, inductance: L});
	paPaRL.setspars(sparsArray);
	paPaRL.setglobal(settings);
	paPaRL._schematic = schematicPart('paPaRL', {labelPrefix: 'paPaRL', resistance: R, inductance: L});
	paPaRL._dcModel = lumpedDcModel('paPaRL', 'shunt', 'parallel', {resistance: R, inductance: L}, settings);
	return paPaRL;
};
