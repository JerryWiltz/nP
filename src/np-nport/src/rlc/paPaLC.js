// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function paPaLC(L = 5e-9, C = 1e-12, options = {}) { // parallel capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'paPaLC');
	var paPaLC = new nPort;
	var sparsArray = lumpedSpars('paPaLC', settings, 'shunt', 'parallel', {inductance: L, capacitance: C});
	paPaLC.setspars(sparsArray);
	paPaLC.setglobal(settings);
	paPaLC._schematic = schematicPart('paPaLC', {labelPrefix: 'paPaLC', inductance: L, capacitance: C});
	paPaLC._dcModel = lumpedDcModel('paPaLC', 'shunt', 'parallel', {inductance: L, capacitance: C}, settings);
	return paPaLC;
};
