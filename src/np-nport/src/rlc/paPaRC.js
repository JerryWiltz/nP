// Modified: 2026-11-26
import {lumpedDcModel} from '../dcModel';
import {lumpedSpars} from './lumpedSpars';
import {schematicPart} from '../schematicPart';
import {nPort} from '../nPort';
import {global} from '../../../np-global/src/global';
import {validatedComponentSettings} from '../numericValidation';

export function paPaRC(R = 75, C = 1e-12, options = {}) { // parallel capacitor nPort object
	var settings = validatedComponentSettings(global, options, 'paPaRC');
	var paPaRC = new nPort;
	var sparsArray = lumpedSpars('paPaRC', settings, 'shunt', 'parallel', {resistance: R, capacitance: C});
	paPaRC.setspars(sparsArray);
	paPaRC.setglobal(settings);
	paPaRC._schematic = schematicPart('paPaRC', {labelPrefix: 'paPaRC', resistance: R, capacitance: C});
	paPaRC._dcModel = lumpedDcModel('paPaRC', 'shunt', 'parallel', {resistance: R, capacitance: C}, settings);
	return paPaRC;
};
