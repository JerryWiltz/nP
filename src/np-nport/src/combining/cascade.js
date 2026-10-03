// Modified: 2026-10-03

export function cascade(...nPorts) {
	if (nPorts.length === 0) throw new TypeError('cascade() requires at least one nPort.');
	var combined = nPorts[0];
	for (var i = 1; i < nPorts.length; i++) {
		// cas() combines S-parameters and noise, and keeps both nonlinear stages.
		combined = combined.cas(nPorts[i]);
	}
	return combined;
}
