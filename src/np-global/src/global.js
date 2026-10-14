// Modified: 2026-10-13

function fGen(fStart, fStop, points) {
	var out = [];
	var fStep = (fStop - fStart) / (points - 1);
	var frequency = fStart;
	for (var i = 0; i < points; i++, frequency += fStep) out.push(frequency);
	return out;
}

function tGen(start, stop, points) {
	if (!Number.isFinite(start) || !Number.isFinite(stop) ||
		!Number.isInteger(points) || points < 2 || stop <= start) {
		throw new RangeError('tGen needs a finite increasing interval and at least two points.');
	}
	var step = (stop - start) / (points - 1);
	return Array.from({length: points}, function (_, index) { return start + index * step; });
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
