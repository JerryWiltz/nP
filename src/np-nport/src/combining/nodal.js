import {nPort} from '../nPort';
import {matrix} from '../../../np-math/src/matrix';
import {complex} from '../../../np-math/src/complex';


export function nodal(nPorts) {
	var a = matrix();
	a.dimension(2,2, nPorts);
	return a;
};
