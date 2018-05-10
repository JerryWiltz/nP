import resolve from 'rollup-plugin-node-resolve';


export default {
	input: "index",
	//String The bundle's entry point (e.g. your main.js or app.js or index.js).

	output: {
		extend: true,
		//true or false (defaults to false) – whether or not to extend the global variable defined by the name option in umd or iife formats.
			//When true, the global variable will be defined as (global.name = global.name || {}).
			//When false, the global defined by name will be overwritten like (global.name = {}).
		
		file: 'dist/nP.js',
		//String The file to write the bundle to. Will also be used to generate sourcemaps, if applicable.
		
		format: "umd",
		//String The format of the generated bundle. One of the following:
			//umd – Universal Module Definition, works as amd, cjs and iife all in one
							
		name: "nP",
		//String The variable name, representing your iife/umd bundle
		
		globals: {
			d3: 'd3'
		}
	},
	 plugins: [ resolve() ]
};