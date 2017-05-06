// methods.js

define(['jquery'], function($) {
	
	var methods = {}; //create methods object
	
	methods.changeHTML = function(arg) {
		$('body').html(arg);
	}
		
	methods.showAlert = function(arg) {
		alert(arg);
	}
	
	return methods;
	
});