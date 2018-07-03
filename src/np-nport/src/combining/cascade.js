import {nPort} from '../nPort';

export function cascade( ... nPorts) {
	var i = 0;
	var nPortsTable = nPorts;
	for (i = 0; i < nPortsTable.length - 1; i++) {
		nPortsTable[i+1] = nPortsTable[i].cas(nPortsTable[i+1]);
	};
	return nPortsTable[ nPortsTable.length-1 ];
};
