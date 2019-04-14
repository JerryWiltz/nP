import resolve from 'rollup-plugin-node-resolve';

export default {
	input: 'index.js',
	output: {
	//	file: './dist/nP.js',
	//	file: './RFBookListings/nP.js',
		file: './ReadmeListings/nP.js',
		format: 'umd',
		name: 'nP',
		globakjljs: 'd3'
	},
	plugins: [
		resolve()
	]
}
