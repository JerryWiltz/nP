//import resolve from 'rollup-plugin-node-resolve';
import resolve from '@rollup/plugin-node-resolve';

export default 	{
	input: 'index.js',
	output: [
		{
			file: './dist/nP.js',
			format: 'umd',
			name: 'nP',
			global: 'd3'
		},
		{
			file: './HTMLs/index-js/nP.js',
			format: 'umd',
			name: 'nP',
			global: 'd3'
		}
	],
	plugins: [
		resolve()
	]
}
