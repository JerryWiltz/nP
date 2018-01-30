// app.js

requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'www/js',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
	
    paths: {
        storage: 'app/storage',
		lowpassDesign: 'app/lowPassDesign',
		lowpassTest: 'app/lowPassTest',
		complex: 'app/complex',
		nport: 'app/nport',
		matrix: 'app/matrix',
		scatterPlot: 'app/scatterPlot'
    }
	
});

requirejs([
'app/storage',
'app/lowPassDesign',
'app/lowPassTest',
'app/complex',
'app/nport',
'app/matrix',
'app/scatterPlot'
], function() {
	//alert('I loaded'); // This happens last!! All the other things happen first!
});