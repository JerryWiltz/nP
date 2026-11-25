---
name: check-javascript
description: Audit nP JavaScript for programming bugs using ESLint, targeted tests and inspection of data flow and API contracts. Use for JavaScript correctness reviews or requested fixes, not semiconductor physics validation or unsolicited formatting changes.
---
<!-- Modified: 2026-11-24 -->

# Check nP JavaScript

Follow the [root instructions](../../../AGENTS.md) and instructions for the
actual target. Identify the requested files, subsystem or diff. An audit is
read-only; apply fixes only when requested. `--start` permits authorized edits
but does not turn a review request into a request for implementation. During
`--stop`, inspect code and use only checks verified not to write files.

## Establish behavior before judging code

Read the changed implementation, its callers and relevant tests. Use the
[constructor catalog](../../../developmentDocs/components/constructorCatalog.md)
and [nPort contract](../../../developmentDocs/components/nPortDataModel.md) when
public electrical APIs are involved. Confirm expected behavior from source,
tests and user requirements rather than assuming a suspicious pattern is wrong.
Distinguish existing failures from regressions with evidence, preserving the
working tree; do not stash or discard user edits to obtain a clean baseline.

## Run deterministic checks within their actual coverage

Inspect [package scripts](../../../package.json) and
[ESLint configuration](../../../eslint.config.js), then run `npm run lint` for
its configured source/script/test/build-config coverage. Do not use `--fix`,
add suppressions or change lint configuration as part of a read-only audit.
The current command does not lint every JavaScript snippet or tool in this repo:
generated files are excluded and HTML/Markdown embedded examples need separate
inspection. Report uncovered targets instead of claiming lint checked them.

Treat findings individually. In particular, rest-object destructuring can
intentionally exclude an internal field; deleting an apparently unused binding
may expose that field in a public object. Preserve the behavior represented by
`ignoreRestSiblings` rather than mechanically removing exclusions.

Use relevant existing Node tests with the repository loader, for example
`node --loader ./scripts/extensionless-loader.mjs --test test/math.test.js`
when math is the target. Select tests for the actual subsystem. Inspect their
side effects before using them under a read-only constraint. Do not run builds,
generators or browser automation just because lint passes or a review started.

## Inspect what static lint cannot establish

Prioritize demonstrable failures and their callers:

- **Data ownership and context:** mutation of caller-owned arrays/records, shallow
  copies of nested state, constructors sharing mutable defaults, stale globals,
  lost placement identity, and setting frequency/time context after construction.
  Check immutable DC snapshots and curve sweeps without assuming public objects
  are all immutable.
- **Control and numeric flow:** wrong indices/row order, loop bounds, unit
  conversions, coercion, zero/empty/singular/nonfinite inputs, overwritten state,
  incomplete branches and accidental loss of a return value. A finite answer or
  plausible plot alone does not demonstrate correctness.
- **Contracts and composition:** public exports and aliases, complex `.x`/`.y`,
  matrix ownership, square S rows, matching frequency/noise rows, terminal order,
  network bias handoff, unsupported-analysis errors and result table headers.
  Check the applicable contracts rather than running every check on every file.
- **Browser/Node boundaries:** missing DOM, unsafe assumptions about mounts,
  caller-table mutation, retained listeners/observers, asynchronous cleanup,
  duplicate output and browser-only helpers called from Node or a worker.
- **Errors and promises:** swallowed failures, misleading fallback success,
  unhandled rejections, partial cleanup and sync/async misuse. Trace error
  behavior to what the caller or user actually sees.

Refer a question about the physical validity of semiconductor equations to the
model-validation workflow; JavaScript correctness does not certify physics.
Likewise, do not turn a general review into unrelated security hardening,
formatting, an API migration or an architectural rewrite.

## Report findings or implement requested fixes

For each substantiated finding, give severity, file/line, triggering conditions,
expected versus actual behavior and a minimal reproducer or test evidence when
available. Separate confirmed bugs from unresolved questions and describe checks
not performed. A clean lint result is not proof that the code has no bugs.
If no actionable bugs are found, say so with the review's actual coverage.

When fixes are authorized, repair the shared cause, preserve compatibility and
add a meaningful regression check for the observed failure when warranted.
Avoid tests that merely restate implementation or freeze one example's layout
coordinates. Run required lint and focused tests, then broaden verification only
when the affected shared behavior warrants it. Follow root requirements for
bundles, documentation and shipped guides if public behavior changes. Report
remaining limitations; do not commit, push or deploy without authorization.
