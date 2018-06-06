import resolve from 'rollup-plugin-node-resolve';

export default {
	input: 'index.js',
	output: {
		file: './dist/nP.js',
		format: 'umd',
		name: 'nP',
		globals: 'd3'
	},
	plugins: [
		resolve()
	]
}
