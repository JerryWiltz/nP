// Modified: 2026-10-08
import {nPort} from '../nPort';
import {applyInputSignal} from '../signal';

export function cascade(...nPorts) {
	var signalOptions = nPorts.length && !nPorts[nPorts.length - 1].getspars ? nPorts.pop() : undefined;
	if (nPorts.length === 0) throw new TypeError('cascade() requires at least one nPort.');
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
		combined = copy;
	}
	return applyInputSignal(combined, signalOptions);
}
