export function callCodemirror (textAreaId) {
	var myTextarea = document.getElementById(textAreaId);
	var editor = CodeMirror.fromTextArea(myTextarea, {
		lineNumbers: true
	});
	return editor;
};
