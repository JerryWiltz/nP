import resolve from 'rollup-plugin-node-resolve';

export default {
	input: 'index.js',
	output: {
		file: './dist/nP.js',
	//	file: './RF_book_javascript_listings/nP.js',
		format: 'umd',
		name: 'nP',
		globakjljs: 'd3'
	},
	plugins: [
		resolve()
	]
}
