// Modified: 2026-10-07

export function analysisFrequencies(settings) {
	if (!settings.twoTone) return settings.fList;
	var spacing = settings.twoTone.spacingHz;
	if (!Number.isFinite(spacing) || spacing <= 0) {
		throw new RangeError('global.twoTone.spacingHz must be a positive frequency.');
	}
	var frequencies = new Set();
	settings.fList.forEach(function (f1) {
		if (!Number.isFinite(f1) || f1 <= 0) {
			throw new RangeError('Two-tone sweep frequencies must be positive.');
		}
		var f2 = f1 + spacing;
		[f1, f2, f2 - f1, f1 + f2, 2 * f1 - f2, 2 * f2 - f1, 2 * f1, 2 * f2]
			.forEach(function (frequency) {
				if (frequency > 0) frequencies.add(frequency);
			});
	});
	return Array.from(frequencies).sort(function (a, b) { return a - b; });
}
