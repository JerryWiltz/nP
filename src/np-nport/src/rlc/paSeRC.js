// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function paSeRC(R = 75, C = 1e-12, options = {}) { // parallel series-RC nPort object
	var settings = validatedComponentSettings(global, options, 'paSeRC');
	var paSeRC = new nPort;
	var sparsArray = lumpedSpars('paSeRC', settings, 'shunt', 'series', {resistance: R, capacitance: C});
	paSeRC.setspars(sparsArray);
	paSeRC.setglobal(settings);
	paSeRC._schematic = schematicPart('paSeRC', {labelPrefix: 'paSeRC', resistance: R, capacitance: C});
	paSeRC._dcModel = lumpedDcModel('paSeRC', 'shunt', 'series', {resistance: R, capacitance: C}, settings);
	return paSeRC;
};
