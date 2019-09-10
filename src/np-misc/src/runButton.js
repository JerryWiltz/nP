export function runButton (editor, button) {

	function removeNodes (nodeClass) {
		var removed = document.getElementsByClassName(nodeClass);
		var i = 0;
		var nodes = JSON.parse(JSON.stringify(removed.length));
		for (i; i < nodes; i++) {
			removed[0].remove();
		};
	};

	function run() {
		removeNodes('remove');	
		function doIt () {
			var headID = document.getElementsByTagName("head")[0];
			var newScript = document.createElement("script");
			newScript.setAttribute('id', 'circuit');
			newScript.type = "text/javascript";
			newScript.innerHTML = editor.getValue();
			headID.appendChild(newScript);
		}
		setTimeout(doIt, 100);
	};

	document.getElementById(button).addEventListener('click', run);

};
