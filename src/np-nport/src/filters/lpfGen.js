// Modified: 2026-11-21
import {seL} from '../rlc/seL';
import {paC} from '../rlc/paC';
import {namedDcModel} from '../dcModel';

function validatedFilterValues(filt) {
	if (!Array.isArray(filt)) {
		throw new TypeError('lpfGen filt must be an array of endpoint resistances and C/L values.');
	}
	if (filt.length < 3) {
		throw new RangeError('lpfGen filt needs source and load resistances and at least one shunt capacitor.');
	}
	var values = filt.slice();
	for (var index = 0; index < values.length; index++) {
		if (!Number.isFinite(values[index]) || values[index] <= 0) {
			var role = index === 0 ? 'source resistance' : index === values.length - 1 ? 'load resistance' :
				index % 2 === 1 ? 'shunt capacitance' : 'series inductance';
			throw new RangeError('lpfGen filt[' + index + '] (' + role + ') must be a finite positive number.');
		}
	}
	return values;
}

export function lpfGen( filt =[50, 1.641818746502858e-11, 4.565360855435164e-8, 1.6418187465028578e-11, 50], options = {}) { // returns a low-pass filter nPort
	var i;
	var filtTable = [];
	var filterValues = validatedFilterValues(filt);
	var elements = filterValues.slice(1, -1);
	for (i = 0; i < elements.length; i++) {
		if (i % 2 === 0) {filtTable[i] = paC(elements[i], options)};
		if (i % 2 === 1) {filtTable[i] = seL(elements[i], options)};
	};
	for (i = 0; i < elements.length - 1; i++) {
		filtTable[i+1] = filtTable[i].cas(filtTable[i+1]);
	};
	var network = filtTable[filtTable.length - 1];
	network._dcModel = namedDcModel('lpfGen', network._dcModel, {filter: filterValues}, network.global);
	return network;
};
