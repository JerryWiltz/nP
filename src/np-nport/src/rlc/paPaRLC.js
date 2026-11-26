// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function paPaRLC(R = 75, L = 5e-9, C = 1e-12, options = {}) { // parallel capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'paPaRLC');
	var paPaRLC = new nPort;
	var sparsArray = lumpedSpars('paPaRLC', settings, 'shunt', 'parallel', {resistance: R, inductance: L, capacitance: C});
	paPaRLC.setspars(sparsArray);
	paPaRLC.setglobal(settings);
	paPaRLC._schematic = schematicPart('paPaRLC', {labelPrefix: 'paPaRLC', resistance: R, inductance: L, capacitance: C});
	paPaRLC._dcModel = lumpedDcModel('paPaRLC', 'shunt', 'parallel', {resistance: R, inductance: L, capacitance: C}, settings);
	return paPaRLC;
};
