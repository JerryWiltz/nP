// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function seSeLC(L = 5e-9, C = 1e-12, options = {}) { // series inductor nPort object
	var settings = validatedComponentSettings(global, options, 'seSeLC');
	var seSeLC = new nPort;
	var sparsArray = lumpedSpars('seSeLC', settings, 'series', 'series', {inductance: L, capacitance: C});
	seSeLC.setspars(sparsArray);
	seSeLC.setglobal(settings);
	seSeLC._schematic = schematicPart('seSeLC', {labelPrefix: 'seSeLC', inductance: L, capacitance: C});
	seSeLC._dcModel = lumpedDcModel('seSeLC', 'series', 'series', {inductance: L, capacitance: C}, settings);
	return seSeLC;
};
