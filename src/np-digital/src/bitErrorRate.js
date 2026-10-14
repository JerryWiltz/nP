// Modified: 2026-10-13
import {digitalRx} from './digitalRx';

// Compare independent receiver decisions with a known transmitted bit pattern.
export function bitErrorRate(tx, stage, options = {}) {
	if (!tx || !Array.isArray(tx.bits) || tx.bits.length === 0 ||
		tx.bits.some(function (bit) { return bit !== 0 && bit !== 1; })) {
		throw new TypeError('bitErrorRate requires transmitted bits from digitalTx or mod.');
	}
	if (!options || Array.isArray(options) || typeof options !== 'object') {
		throw new TypeError('bitErrorRate options must be an object.');
	}
	var receptions = options.receptions === undefined ? 100 : options.receptions;
	if (!Number.isInteger(receptions) || receptions < 1) {
		throw new RangeError('bitErrorRate receptions must be a positive integer.');
	}
	var receiverOptions = {...options};
	delete receiverOptions.receptions;
	var receiver = receiverOptions.receiver === undefined ? digitalRx : receiverOptions.receiver;
	delete receiverOptions.receiver;
	if (typeof receiver !== 'function') {
		throw new TypeError('bitErrorRate receiver must be a function.');
	}
	var errors = 0;
	for (var reception = 0; reception < receptions; reception++) {
		var receivedBits = receiver(stage, receiverOptions).out('bits');
		if (receivedBits.length !== tx.bits.length) {
			throw new RangeError('Transmitted and received bit counts must match.');
		}
		for (var bit = 0; bit < receivedBits.length; bit++) {
			if (receivedBits[bit] !== tx.bits[bit]) errors++;
		}
	}
	return errors / (receptions * tx.bits.length);
}
