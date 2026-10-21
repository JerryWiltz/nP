// Modified: 2026-10-20

// A sampled signal has one uniformly spaced time for each amplitude value.
export function sampleRateFromTime(time, count, caller) {
	if (!Array.isArray(time) || time.length < 2) {
		throw new RangeError(caller + ' needs a tList with at least two sample times.');
	}
	if (count !== undefined && time.length !== count) {
		throw new RangeError(caller + ' needs one tList time for each sample.');
	}
	var step = time[1] - time[0];
	if (!Number.isFinite(step) || step <= 0 || !Number.isFinite(1 / step) ||
		time.some(function (value, index) {
			var expected = time[0] + index * step;
			return !Number.isFinite(value) ||
				Math.abs(value - expected) > Math.max(Math.abs(step) * 1e-6,
					Math.abs(expected) * Number.EPSILON * 16);
		})) {
		throw new RangeError(caller + ' needs a uniformly spaced, increasing tList in seconds.');
	}
	return 1 / step;
}
