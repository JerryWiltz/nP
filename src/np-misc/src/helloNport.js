export function helloNport() {
	var target = document.getElementsByTagName("body")[0],
		h1 = document.createElement("h1");

	target.appendChild(h1);
	h1.innerHTML = 'Hello, nPort!';
};
