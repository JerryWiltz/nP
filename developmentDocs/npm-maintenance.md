<!-- Modified: 2026-09-24 -->
# npm package maintenance

`@jerrywiltz/np` is already published. The current public release is `0.0.48`.
This note records maintenance work for the package; it is not a plan for an
initial npm release.

## Published surface

The package is an ESM package with CommonJS and browser distributions:

```text
src/index.js       source entry point
dist/nP.esm.js     ESM entry (`import`)
dist/nP.cjs        CommonJS entry (`require`)
dist/nP.js         UMD browser bundle and global `nP`
```

The `files` field in `package.json` publishes the three `dist/` bundles,
`README.md`, and `LICENSE`. Development pages, research notes, and the
host-safe plugin bundle are deliberately outside the npm package.

The normal library-release checks are:

```text
npm test
npm run build
npm run dev:smoke
```

Publish only after the resulting bundle changes have been reviewed and
committed:

```text
npm publish
```

## Plugin distribution

The Obsidian plugin is maintained in the separate `np-rf-analysis` repository.
The host-safe bundle is built here with:

```text
npm run build:plugin
```

That command creates `dist/nP.plugin.esm.js`. It is copied intentionally into
the plugin repository's `vendor/nP.esm.js`, where the plugin build incorporates
it into `main.js`. Rebuilding nP does not update an existing plugin checkout.
Record the nP version used by each plugin release.

## Maintenance backlog

### Explicit import extensions

Source files currently use extensionless relative imports, for example:

```js
import { complex } from './complex';
```

Converting them to explicit `.js` imports could make plain Node ESM use more
standard. Treat this as a separate mechanical change. Afterward, check
whether `scripts/extensionless-loader.mjs` is still needed, then run the test,
build, and browser checks.

### Lightweight linting

ESLint could be introduced for `src/` and `test/` with a correctness-focused
configuration. Exclude `dist/`, `node_modules/`, `docs/_archive/`, and raw
technical material. Do not begin by enforcing formatting or replacing the
repository's established `var` style.

### Package metadata

Review `main`, `module`, `browser`, `exports`, and `files` when the public
distribution changes. Keep the npm package, browser bundle, and plugin bundle
roles explicit so a release cannot accidentally omit one of them.
