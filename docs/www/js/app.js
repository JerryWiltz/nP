// app.js

requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
	
    paths: {
        lowpassInput: 'app/lowpassSetup',
		lowpassDesign: 'app/lowpassDesign',
		lowpassTest: 'app/lowpassTest',
		complex: 'app/complex',
		nport: 'app/nport',
		matrix: 'app/matrix'
    }
	
});

requirejs([
'app/lowpassSetup',
'app/lowpassDesign',
'app/lowpassTest',
'app/complex',
'app/nport',
//'app/matrix'
], function() {
	//alert('I loaded'); // This happens last!! All the other things happen first!
});