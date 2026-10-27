// Modified: 2026-10-26
import {complex} from '../../../np-math/src/complex';
import {global} from '../../../np-global/src/global';
import {nPort} from '../nPort';
import {analysisFrequencies} from '../analysisFrequencies';
import {componentSettings} from '../componentSettings';

// Matched, reciprocal 180-degree coupler with the same response at every frequency.
// Port 1 drives port 2 (through) and port 4 (coupled); port 3 is isolated.
export function Coupler180(options = {}) {
	if (!options || Array.isArray(options) || typeof options !== 'object') {
		throw new TypeError('Coupler180 expects an options object.');
	}
	var couplingDb = options.couplingDb === undefined ? 10 * Math.log10(2) : options.couplingDb;
	if (!Number.isFinite(couplingDb) || couplingDb < 0) {
		throw new RangeError('Coupler180 couplingDb must be a finite, nonnegative number of dB.');
	}
	var coupling = 10 ** (-couplingDb / 20);
	var through = Math.sqrt(1 - coupling * coupling);
	var settings = componentSettings(global, options);
	var frequencies = analysisFrequencies(settings);
	var sparsArray = [];
	var noiseArray = [];
	for (var i = 0; i < frequencies.length; i++) {
		sparsArray[i] = [frequencies[i],
			complex(0, 0), complex(through, 0), complex(0, 0), complex(coupling, 0),
			complex(through, 0), complex(0, 0), complex(coupling, 0), complex(0, 0),
			complex(0, 0), complex(coupling, 0), complex(0, 0), complex(-through, 0),
			complex(coupling, 0), complex(0, 0), complex(-through, 0), complex(0, 0)];
		var covariance = [];
		for (var row = 0; row < 4; row++) {
			covariance[row] = Array.from({length: 4}, function () { return complex(0, 0); });
		}
		noiseArray[i] = {frequency: frequencies[i], C: covariance};
	}
	var coupler = new nPort();
	coupler.setspars(sparsArray);
	coupler.noise = noiseArray;
	coupler.setglobal(settings);
	coupler._schematic = {kind: 'component', symbol: 'coupler-180', value: couplingDb};
	return coupler;
}
