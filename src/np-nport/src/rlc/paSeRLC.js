// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function paSeRLC(R = 75, L = 5e-9, C = 1e-12, options = {}) { // parallel capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'paSeRLC');
	var paSeRLC = new nPort;
	var sparsArray = lumpedSpars('paSeRLC', settings, 'shunt', 'series', {resistance: R, inductance: L, capacitance: C});
	paSeRLC.setspars(sparsArray);
	paSeRLC.setglobal(settings);
	paSeRLC._schematic = schematicPart('paSeRLC', {labelPrefix: 'paSeRLC', resistance: R, inductance: L, capacitance: C});
	paSeRLC._dcModel = lumpedDcModel('paSeRLC', 'shunt', 'series', {resistance: R, inductance: L, capacitance: C}, settings);
	return paSeRLC;
};
