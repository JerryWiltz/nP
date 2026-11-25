# nP agent guide maintenance
<!-- Modified: 2026-11-24 -->

These instructions govern maintenance of `nP-agents/` and its shipped guides.
Follow the repository root `AGENTS.md` and applicable instructions along each
target's ancestor chain. Read [README.md](README.md) for the intended experience:
the person describes a result; the assistant writes simple, explicit nP code.

## Maintenance and circuit writing

- When the task is editing, auditing or verifying a guide, act as its maintainer.
  The guide's circuit-writing persona, output format and restrictions on running
  user circuits do not replace contributor verification requirements. Check the
  requested edits and refresh managed copies under the root instructions.
- When the task is writing a user circuit, select the requested environment's
  guide and read it completely before using it. Follow the instructions applying
  to the actual output location. Merely reading a guide as reference does not
  make its directory the output destination.
- Ordinary circuit writing does not include executing generated code, running
  simulations, installing tools or launching a browser unless requested. Keep
  writing and execution separate; never claim an unexecuted result was verified.
- Follow `--stop` and `--start`. Guide maintenance does not authorize a commit,
  push, publication, deployment or plugin installation into a vault.

## Maintain the shipped contract

- Each environment directory contains one self-contained `AGENTS.md`. Keep the
  complete API knowledge in that file; require no parent guide, repository links,
  network access or additional reference files in the shipped environment.
- Keep an instruction to read the complete file near its beginning and a unique
  matching end marker at its end. Automatic instruction discovery may supply only
  a prefix; explicit bounded reads must cover the remainder before circuit work.
  Do not assume that a host's instruction-loading limit has been increased.
- Derive signatures, defaults, units, terminal order, result formats and model
  limits from current source and tests. Use the constructor catalog and matching
  `dev/` examples as maps. Distinguish current source from the actual supplied
  or pinned runtime; do not upgrade a bundle as part of an instruction edit.
- Preserve minimal deliverables, named intermediate nP steps, no nested nP calls,
  and explanations adapted to the person's engineering and nP familiarity.
  Do not add unsolicited lessons, helpers, page styling or demonstrations.
- Keep `online-repl/` empty until explicitly requested. Maintain environment
  differences, especially Node's lack of a DOM and Obsidian's pinned worker API.

## Verification and distribution

- Check the changed instructions against their ancestor rules and intended
  standalone use. Confirm the loading instruction fits in the available initial
  prefix, the end marker is present, and Markdown links and fences remain valid.
- Verify changed runnable snippets in their intended environment. Wording-only
  maintenance needs instruction and distribution checks, not unrelated library
  tests or rebuilt nP bundles. State what was actually verified.
- Update canonical guides first. Refresh existing managed distribution copies
  without overwriting local edits or creating new distribution directories.
  For Obsidian, run the required agent sync/check, plugin build and release
  verification; preserve the pinned runtime and existing unrelated changes.
