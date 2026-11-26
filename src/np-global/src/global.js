// Modified: 2026-11-26

function linearGrid(start, stop, points, minimum, caller, increasing = false) {
	if (!Number.isFinite(start) || !Number.isFinite(stop)) {
		throw new RangeError(caller + ' start and stop must be finite numbers.');
	}
	if (!Number.isInteger(points) || points < minimum || points > 0xffffffff) {
		throw new RangeError(caller + ' needs at least ' + (minimum === 1 ? 'one point' : 'two points') +
			'; points must be an integer no greater than 4294967295.');
	}
	if (points === 1) return [start];
	if (increasing && stop <= start) throw new RangeError(caller + ' stop must be greater than start.');
	var span = stop - start, step = span / (points - 1), values = [];
	if (!Number.isFinite(span)) throw new RangeError(caller + ' interval exceeds the numeric range.');
	for (var index = 0; index < points; index++) {
		var value = index === 0 ? start : index === points - 1 ? stop : start + index * step;
		if (!Number.isFinite(value) || index > 0 && span !== 0 && (value - values[index - 1]) * Math.sign(span) <= 0) {
			throw new RangeError(caller + ' spacing cannot be represented; reduce points or change the interval.');
		}
		values.push(value);
	}
	return values;
}

function fGen(start, stop, points) {
	return linearGrid(start, stop, points, 1, 'fGen');
}

function tGen(start, stop, points) {
	return linearGrid(start, stop, points, 2, 'tGen', true);
}

function newContext() {
	return {fList: [2e9], tList: [], twoTone: undefined, Ro: 50, Temp: 293,
		fGen: fGen, tGen: tGen};
}

var contexts = new WeakSet();
var activeContext = newContext();
contexts.add(activeContext);

// Calling global() creates and selects a circuit context. Calling it with a
// previously returned context selects that circuit again.
export function global(context) {
	if (arguments.length === 0) {
		activeContext = newContext();
		contexts.add(activeContext);
	} else {
		if (!context || typeof context !== 'object' || !contexts.has(context)) {
			throw new TypeError('global expects a circuit context returned by global().');
		}
		activeContext = context;
	}
	return activeContext;
}

// Preserve the existing property calls and expose the selected context's time grid.
// Enumerable accessors also let existing settings snapshots use {...global}.
['fList', 'tList', 'twoTone', 'Ro', 'Temp', 'fGen', 'tGen'].forEach(function (key) {
	Object.defineProperty(global, key, {
		enumerable: true,
		get: function () { return activeContext[key]; },
		set: function (value) { activeContext[key] = value; }
	});
});
