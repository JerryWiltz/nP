import node from "rollup-plugin-node-resolve";

export default {
	input: 'index.js',
	plugins: [node({preferBuiltins:false})],
	output: {
		file: 'nP.js',
		format: 'umd',
		name: 'nP'
	}
};
