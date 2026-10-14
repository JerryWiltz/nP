// Modified: 2026-10-13

// Capture the analysis settings when a component is constructed. An explicit
// fList lets independent circuits use different grids without changing global.
export function componentSettings(global, options = {}) {
	var fList = options.fList === undefined ? global.fList : options.fList;
	if (!Array.isArray(fList)) throw new TypeError('fList must be an array of frequencies.');
	return {
		...global,
		fList: fList.slice(),
		tList: Array.isArray(global.tList) ? global.tList.slice() : global.tList,
		twoTone: global.twoTone ? {...global.twoTone} : global.twoTone
	};
}
