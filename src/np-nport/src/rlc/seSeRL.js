// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function seSeRL(R = 75, L = 5e-9, options = {}) { // series inductor nPort object
	var settings = validatedComponentSettings(global, options, 'seSeRL');
	var seSeRL = new nPort;
	var sparsArray = lumpedSpars('seSeRL', settings, 'series', 'series', {resistance: R, inductance: L});
	seSeRL.setspars(sparsArray);
	seSeRL.setglobal(settings);
	seSeRL._schematic = schematicPart('seSeRL', {labelPrefix: 'seSeRL', resistance: R, inductance: L});
	seSeRL._dcModel = lumpedDcModel('seSeRL', 'series', 'series', {resistance: R, inductance: L}, settings);
	return seSeRL;
};
