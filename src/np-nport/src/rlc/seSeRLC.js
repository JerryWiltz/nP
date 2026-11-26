// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function seSeRLC(R = 75, L = 5e-9, C = 1e-12, options = {}) { // series inductor nPort object
	var settings = validatedComponentSettings(global, options, 'seSeRLC');
	var seSeRLC = new nPort;
	var sparsArray = lumpedSpars('seSeRLC', settings, 'series', 'series', {resistance: R, inductance: L, capacitance: C});
	seSeRLC.setspars(sparsArray);
	seSeRLC.setglobal(settings);
	seSeRLC._schematic = schematicPart('seSeRLC', {labelPrefix: 'seSeRLC', resistance: R, inductance: L, capacitance: C});
	seSeRLC._dcModel = lumpedDcModel('seSeRLC', 'series', 'series', {resistance: R, inductance: L, capacitance: C}, settings);
	return seSeRLC;
};
