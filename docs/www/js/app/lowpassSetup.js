// lowpassSetup.js

define([], function (){
"use strict";
	return function lowpassSetup() {
	"use strict";
	// Private variables and functions
	// Define Element Objects
	var maxPassFreqElement = function () {return document.getElementById("maxPassFreq");}
	var minRejFreqElement = function () {return document.getElementById("minRejFreq");}
	var passbandRippleElement = function () {return document.getElementById("passbandRipple");}
	var rejLevelElement = function () {return document.getElementById("rejLevel");}	
	var designButtonElement = function () {return document.getElementById("design");}	
	var wElement = function () { return document.getElementById("w");}
	var nElement = function () {return document.getElementById("n");}
	var filterComponentsElemement = function () {return document.getElementById("filterComponents");}
	var testButtonElement = function () {return document.getElementById("test");}
	
	// Define design frequency unit
	var getFrequencyUnits = function () {return document.getElementById("frequencyUnits");}
	
	// Define Table Variable
	var Table =["Jerrys Table"];
	
	function getTable() {return Table;}	// This is the analysis input table
	function setTable(inputTable) {Table = inputTable;}	// This is the analysis input table	
		
	return {
		maxPassFreqElement : maxPassFreqElement,
		minRejFreqElement : minRejFreqElement,
		passbandRippleElement : passbandRippleElement,
		rejLevelElement : rejLevelElement,	
		designButtonElement : designButtonElement,	
		wElement : wElement,
		nElement : nElement,
		filterComponentsElemement : filterComponentsElemement,
		testButtonElement : testButtonElement,
		
		getFrequencyUnits : getFrequencyUnits,
		
		getTable : getTable,
		setTable : setTable
		}
	
	}();
});