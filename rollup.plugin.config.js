// Modified: 2026-07-22
import resolve from '@rollup/plugin-node-resolve';

const trimTrailingWhitespace = {
	name: 'trim-trailing-whitespace',
	renderChunk(code) {
		return code.replace(/[\t ]+$/gm, '');
	}
};

export default {
	input: 'src/plugin.js',
	output: {
		file: './dist/nP.plugin.esm.js',
		format: 'es'
	},
	plugins: [
		resolve(),
		trimTrailingWhitespace
	]
};
