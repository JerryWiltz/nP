// jqueryFile.js

define(['jquery', 'methods'], function($, methods) {
	$('#clickMe').click(function() {
		//methods.showAlert('I was clicked');
		methods.changeHTML('I was clicked!');
	})
});