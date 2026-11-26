// Modified: 2026-11-26
import {requireNumber} from '../numericValidation';
// Generates an array of parallel capacitors and series inductors based on Chebyshev values
export function chebyLPLCs ( cheby = [1, 1.0315851425078764, 1.1474003299537219, 1.0315851425078761, 1], maxPassFrequency = 0.2e9, zo = 50) {
	if (!Array.isArray(cheby)) throw new TypeError('chebyLPLCs prototype must be an array.');
	if (cheby.length < 3) throw new RangeError('chebyLPLCs needs source/load values and at least one reactive element.');
	Array.from(cheby).forEach(function (value, index) { requireNumber('chebyLPLCs', 'prototype[' + index + ']', value, {positive: true}); });
	requireNumber('chebyLPLCs', 'pass frequency (Hz)', maxPassFrequency, {positive: true});
	requireNumber('chebyLPLCs', 'reference impedance (ohms)', zo, {positive: true});
	var	chebyLPLCsout = new Array(cheby.length),
		i;

	chebyLPLCsout[0] = cheby[0] * zo; // Populate the first resistor in the array

	for(i = 1; i < cheby.length -1; i++) { // Populate the C's and L's
		chebyLPLCsout[i] = ( (i) % 2 === 0 ) ? cheby[i] * zo * (1/(2*Math.PI)) * (1/(maxPassFrequency )) : cheby[i] * 1/zo * (1/(2*Math.PI)) * (1/(maxPassFrequency));
	};

	chebyLPLCsout[cheby.length-1] = cheby[cheby.length-1] * zo; // Populate the last resistor in the array
	chebyLPLCsout.forEach(function (value) { requireNumber('chebyLPLCs', 'calculated component value', value, {positive: true}); });

	return chebyLPLCsout;
};
