// Modified: 2026-11-21
import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'docs/.vitepress/dist/**',
            'src/np-chart/src/schematicSymbols.js',
            'src/np-chart/src/schematicDrawingSymbols.js',
            'src/np-nport/src/schematicSymbolMap.js'
        ]
    },
    {
        files: ['src/**/*.js', 'scripts/**/*.{js,mjs,cjs}', 'test/**/*.{js,mjs,cjs}', '*.config.js'],
        rules: {
            ...js.configs.recommended.rules,
            // Destructuring may deliberately exclude an internal field from the rest object.
            'no-unused-vars': ['error', {ignoreRestSiblings: true}],
            'no-useless-assignment': 'error',
            'no-empty': ['error', {allowEmptyCatch: true}],
            'no-cond-assign': ['error', 'always']
        }
    },
    {
        files: ['src/**/*.js'],
        languageOptions: {globals: {console: 'readonly'}}
    },
    {
        files: ['src/np-chart/**/*.js', 'src/np-misc/**/*.js'],
        languageOptions: {globals: globals.browser}
    },
    {
        files: ['scripts/**/*.{js,mjs,cjs}', 'test/**/*.{js,mjs,cjs}', '*.config.js'],
        languageOptions: {globals: globals.node}
    },
    {
        // The host page supplies CodeMirror for this legacy browser helper.
        files: ['src/np-misc/src/htmlSupport.js'],
        languageOptions: {globals: {CodeMirror: 'readonly'}}
    },
    {
        // Playwright evaluates the rendering function inside the browser page.
        files: ['scripts/generate-circuit-example-images.mjs'],
        languageOptions: {globals: globals.browser}
    }
];
