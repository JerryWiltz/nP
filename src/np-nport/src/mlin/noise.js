// Modified: 2026-09-08
import {complex} from '../../../np-math/src/complex';

var conjugate = function (value) { return complex(value.getR(), -value.getI()); };

// Passive Bosma noise covariance: C = kBT(I - S S†).
export function passiveNoiseCovariance(sparsRow, portCount, temperature) {
	var scale = complex(1.380649e-23 * temperature, 0);
	var covariance = [];
	for (var row = 0; row < portCount; row++) {
		covariance[row] = [];
		for (var col = 0; col < portCount; col++) {
			var value = row === col ? complex(1, 0) : complex(0, 0);
			for (var port = 0; port < portCount; port++) {
				value = value.sub(sparsRow[1 + row * portCount + port].mul(conjugate(sparsRow[1 + col * portCount + port])));
			}
			var scaled = value.mul(scale);
			// Remove round-off residuals from mathematically lossless models.
			covariance[row][col] = scaled.mag() < 1e-35 ? complex(0, 0) : scaled;
		}
	}
	return covariance;
}
