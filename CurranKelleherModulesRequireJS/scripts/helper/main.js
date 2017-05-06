define(["./sum"], function (sum) {
	return function main() {
	var numbers = [11, 2, 3];
	var result = sum(numbers);

	var outputElement = document.getElementById("output")
	outputElement.innerHTML = result;
	}();
});