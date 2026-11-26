// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function paSeLC(L = 5e-9, C = 1e-12, options = {}) { // parallel capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'paSeLC');
	var paSeLC = new nPort;
	var sparsArray = lumpedSpars('paSeLC', settings, 'shunt', 'series', {inductance: L, capacitance: C});
	paSeLC.setspars(sparsArray);
	paSeLC.setglobal(settings);
	paSeLC._schematic = schematicPart('paSeLC', {labelPrefix: 'paSeLC', inductance: L, capacitance: C});
	paSeLC._dcModel = lumpedDcModel('paSeLC', 'shunt', 'series', {inductance: L, capacitance: C}, settings);
	return paSeLC;
};
