// storage.js

define([], function (){
"use strict";
	var storage = {
		//seeMe
		seeMe : function() {
			console.log('I am here in lowpassSetup');
		},
		
		//store lowPassTable here
		lowPassTable : [],
		
		//store the spars vs frequency here
		sparsFreq : [],

	};	
	return storage;
});