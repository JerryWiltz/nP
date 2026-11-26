// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function seSeRC(R = 75, C = 1e-12, options = {}) { // series inductor nPort object
	var settings = validatedComponentSettings(global, options, 'seSeRC');
	var seSeRC = new nPort;
	var sparsArray = lumpedSpars('seSeRC', settings, 'series', 'series', {resistance: R, capacitance: C});
	seSeRC.setspars(sparsArray);
	seSeRC.setglobal(settings);
	seSeRC._schematic = schematicPart('seSeRC', {labelPrefix: 'seSeRC', resistance: R, capacitance: C});
	seSeRC._dcModel = lumpedDcModel('seSeRC', 'series', 'series', {resistance: R, capacitance: C}, settings);
	return seSeRC;
};
