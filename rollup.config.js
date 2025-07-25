// reviewed on 6/8/2025;
import resolve from '@rollup/plugin-node-resolve';

export default {
	input: 'src/index.js',   // Updated path after moving index.js into src/
	output: [
		{
			file: './dist/nP.js',
			format: 'umd',
			name: 'nP',
			global: 'd3'
		}
	],
	plugins: [
		resolve()
	]
}
