// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function paSeRL(R = 75, L = 5e-9, options = {}) { // parallel capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'paSeRL');
	var paSeRL = new nPort;
	var sparsArray = lumpedSpars('paSeRL', settings, 'shunt', 'series', {resistance: R, inductance: L});
	paSeRL.setspars(sparsArray);
	paSeRL.setglobal(settings);
	paSeRL._schematic = schematicPart('paSeRL', {labelPrefix: 'paSeRL', resistance: R, inductance: L});
	paSeRL._dcModel = lumpedDcModel('paSeRL', 'shunt', 'series', {resistance: R, inductance: L}, settings);
	return paSeRL;
};
