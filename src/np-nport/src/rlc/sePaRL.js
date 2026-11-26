// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function sePaRL(R = 75, L = 5e-9, options = {}) { // parallel capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'sePaRL');
	var sePaRL = new nPort;
	var sparsArray = lumpedSpars('sePaRL', settings, 'series', 'parallel', {resistance: R, inductance: L});
	sePaRL.setspars(sparsArray);
	sePaRL.setglobal(settings);
	sePaRL._schematic = schematicPart('sePaRL', {labelPrefix: 'sePaRL', resistance: R, inductance: L});
	sePaRL._dcModel = lumpedDcModel('sePaRL', 'series', 'parallel', {resistance: R, inductance: L}, settings);
	return sePaRL;
};
