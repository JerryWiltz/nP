// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function sePaRLC(R = 75, L = 5e-9, C = 1e-12, options = {}) { // parallel capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'sePaRLC');
	var sePaRLC = new nPort;
	var sparsArray = lumpedSpars('sePaRLC', settings, 'series', 'parallel', {resistance: R, inductance: L, capacitance: C});
	sePaRLC.setspars(sparsArray);
	sePaRLC.setglobal(settings);
	sePaRLC._schematic = schematicPart('sePaRLC', {labelPrefix: 'sePaRLC', resistance: R, inductance: L, capacitance: C});
	sePaRLC._dcModel = lumpedDcModel('sePaRLC', 'series', 'parallel', {resistance: R, inductance: L, capacitance: C}, settings);
	return sePaRLC;
};
