import {seL} from './seL';
import {paC} from './paC';

export function lpfGen( filt =[50, 1.641818746502858e-11, 4.565360855435164e-8, 1.6418187465028578e-11, 50]) { // returns a table of spars for a low Pass Filter
	var i = 0;
	var filtTable = [];
	filt.pop();
	filt.shift();
	for (i = 0; i < filt.length; i++) {
		if (i % 2 === 0) {filtTable[i] = paC(filt[i])};
		if (i % 2 === 1) {filtTable[i] = seL(filt[i])};
	};
	for (i = 0; i < filt.length - 1; i++) {
		filtTable[i+1] = filtTable[i].cas(filtTable[i+1]);
	};
	return filtTable[ filtTable.length-1 ];
};
