// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function seC(C = 1e-12, options = {}) { // series capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'seC');
	var seC = new nPort;
	var sparsArray = lumpedSpars('seC', settings, 'series', 'series', {capacitance: C});
	seC.setspars(sparsArray);
	seC.setglobal(settings);
	seC._schematic = schematicPart('seC', {labelPrefix: 'seC', value: C});
	seC._dcModel = lumpedDcModel('seC', 'series', 'series', {capacitance: C}, settings);
	return seC;
};
