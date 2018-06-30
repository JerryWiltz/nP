export var global = {
	fList:	[2e9, 4e9, 6e9, 8e9],
	Ro:	50,
	Temp:	293,
	fGen: function fGen (fStart, fStop, points) {
		var out = [];
		var fStep = (fStop-fStart)/(points-1);
		var fMax = fStart;
		var i = 0; 
		for (i = 0; i < points; i++, fMax += fStep ) {
			out.push(fMax);
		}
		return out;
	},
}
