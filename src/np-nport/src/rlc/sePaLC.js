// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function sePaLC(L = 5e-9, C = 1e-12, options = {}) { // parallel capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'sePaLC');
	var sePaLC = new nPort;
	var sparsArray = lumpedSpars('sePaLC', settings, 'series', 'parallel', {inductance: L, capacitance: C});
	sePaLC.setspars(sparsArray);
	sePaLC.setglobal(settings);
	sePaLC._schematic = schematicPart('sePaLC', {labelPrefix: 'sePaLC', inductance: L, capacitance: C});
	sePaLC._dcModel = lumpedDcModel('sePaLC', 'series', 'parallel', {inductance: L, capacitance: C}, settings);
	return sePaLC;
};
