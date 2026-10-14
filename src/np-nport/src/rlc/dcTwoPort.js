// Modified: 2026-10-14
import {complex} from '../../../np-math/src/complex';

// Exact 0 Hz limits for ideal series and shunt RLC branches.
export function dcTwoPort(mode, resistance, referenceImpedance) {
	var reflection;
	var transmission;
	if (mode === 'open') {
		reflection = 1;
		transmission = 0;
	} else if (mode === 'short') {
		reflection = 0;
		transmission = 1;
	} else if (mode === 'shuntShort') {
		reflection = -1;
		transmission = 0;
	} else if (mode === 'seriesR') {
		reflection = resistance / (resistance + 2 * referenceImpedance);
		transmission = 2 * referenceImpedance / (resistance + 2 * referenceImpedance);
	} else if (mode === 'shuntR') {
		reflection = -referenceImpedance / (2 * resistance + referenceImpedance);
		transmission = 2 * resistance / (2 * resistance + referenceImpedance);
	} else {
		throw new RangeError('Unknown DC branch mode.');
	}
	return [complex(reflection, 0), complex(transmission, 0),
		complex(transmission, 0), complex(reflection, 0)];
}
