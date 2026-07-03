# Path To npm Release
<!-- Modified: 2026-07-03 -->

This note captures cleanup steps that would make `nP` easier to publish and maintain as an npm package, especially if an ESM build is added later.

## Current State

The repo currently builds a browser UMD bundle:

- Source entry: `src/index.js`
- Bundle output: `dist/nP.js`
- Browser global: `nP`
- Build command: `npm run build`

The package is already marked as ESM with `"type": "module"` in `package.json`, but many source files still use extensionless relative imports.

Example current style:

```js
import { complex } from './complex';
```

More standard Node ESM style:

```js
import { complex } from './complex.js';
```

Rollup can handle the extensionless imports, but plain Node ESM normally expects explicit file extensions. The current test command works around this with:

```text
scripts/extensionless-loader.mjs
```

## Explicit `.js` Import Extensions

Adding missing `.js` extensions should not break Rollup if done consistently. It should make the source more standard for Node ESM and reduce special handling in tests or future tooling.

Recommended timing:

1. Wait until active RF/math model changes are committed.
2. Update source relative imports to include `.js`.
3. Check whether `scripts/extensionless-loader.mjs` is still needed.
4. Simplify the `npm test` script if the loader is no longer needed.
5. Run `npm test`.
6. Run `npm run build`.
7. Smoke-test representative `dev/*.html` pages.
8. Commit separately with a message such as `Use explicit .js extensions in source imports`.

This should be treated as a broad mechanical cleanup, not mixed with behavior changes.

## ESLint

ESLint is a JavaScript checker. It can catch likely mistakes such as undefined variables, accidental globals, unused imports, and suspicious code patterns.

For `nP`, ESLint could be useful eventually, but it should be introduced lightly. A generic modern-JavaScript preset would likely create noise because this repo has:

- Older code that intentionally uses `var`.
- Browser examples that intentionally use the global `nP`.
- Extensionless imports until the import cleanup is done.
- Terse math variables such as `a`, `b`, `i`, and `j`.
- Generated `dist/nP.js`, which should not be linted.
- Legacy docs/archive HTML that should not be part of an initial lint pass.

Recommended first ESLint scope:

- Lint `src/` and `test/`.
- Ignore `dist/`, `node_modules/`, `docs/_archive/`, and raw technical material.
- Warn on likely bugs.
- Do not enforce formatting style at first.
- Do not require converting `var` to `let` or `const`.

Recommended timing:

1. First finish the explicit `.js` import cleanup.
2. Add ESLint in a separate commit.
3. Start with a minimal config focused on correctness.
4. Add stricter style rules only after the public API and source layout settle.

## Suggested Release Cleanup Order

1. Keep current RF model work committed and tested.
2. Convert relative source imports to explicit `.js`.
3. Remove or simplify the extensionless test loader if possible.
4. Add a formal ESM build if desired.
5. Add light ESLint checking.
6. Revisit `package.json` fields for npm publishing, such as `main`, `module`, `exports`, and `files`.
7. Run Node tests, Rollup build, and browser smoke tests before tagging or publishing.

