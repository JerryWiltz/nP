// Modified: 2026-11-24
import {nPort} from '../nPort';
import {applyInputSignal} from '../signal';
import {validateNetworkComponents} from './connectionValidation';

export function cascade(...nPorts) {
	var signalOptions = nPorts.length && !nPorts[nPorts.length - 1].getspars ? nPorts.pop() : undefined;
	if (nPorts.length === 0) throw new TypeError('cascade() requires at least one nPort.');
	validateNetworkComponents(nPorts, 'cascade()');
	var combined = nPorts[0];
	for (var i = 1; i < nPorts.length; i++) {
		// cas() combines S-parameters and noise, and keeps both nonlinear stages.
		combined = combined.cas(nPorts[i]);
	}
	if (signalOptions && signalOptions.signal && nPorts.length === 1) {
		var copy = new nPort();
		copy.setspars(combined.getspars());
		copy.setglobal(combined.getglobal());
		copy.noise = combined.noise;
		if (combined.signal) copy.signal = combined.signal;
		copy._displayFrequencies = combined._displayFrequencies;
		copy._intermod = combined._intermod;
		copy._schematic = combined._schematic;
		copy._dcModel = combined._dcModel;
		copy._rfModel = combined._rfModel;
		copy._rfInputSignals = combined._rfInputSignals;
		copy._operatingPoints = combined._operatingPoints;
		copy.operatingPoint = combined.operatingPoint;
		combined = copy;
	}
	return applyInputSignal(combined, signalOptions);
}
