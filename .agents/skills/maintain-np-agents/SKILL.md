---
name: maintain-np-agents
description: Update or audit nP's shipped HTML, Node.js, Obsidian and website agent guides and their managed distribution copies after API or instruction changes. Use for guide maintenance, not for writing a user's circuit or creating unrelated Codex skills.
---
<!-- Modified: 2026-11-24 -->

# Maintain the shipped nP agent guides

Apply the [root instructions](../../../AGENTS.md) and
[guide-maintenance instructions](../../../nP-agents/AGENTS.md). Read the
[intended experience](../../../nP-agents/README.md) before changing their
behavior. Maintain the guide as a contributor; do not adopt its circuit-writing
persona or treat its restrictions on running user circuits as a prohibition on
requested contributor verification. `--stop` still prohibits file changes.

## Establish the change and the actual runtime

Identify the changed public behavior or instruction problem and which guides
are affected. Compare current source, tests and constructor documentation with
the library actually supplied to each environment. A matching `nP.version`
string does not prove matching APIs.

The canonical shipped files are:

- [HTML](../../../nP-agents/html/AGENTS.md): adjacent local browser bundle, offline
  operation and minimal HTML.
- [Node.js](../../../nP-agents/nodejs/AGENTS.md): supplied ESM/CommonJS or installed
  package, terminal output and no assumed DOM.
- [Obsidian](../../../nP-agents/obsidian/AGENTS.md): installed plugin's pinned
  worker API and `npjs` note workflow. New standalone APIs may be unavailable.
- [Websites](../../../nP-agents/websites/AGENTS.md): existing framework/lifecycle,
  local loading and output ownership rather than a replacement site.

Read a complete guide in bounded ranges when using it to write a circuit. For
maintenance, inspect the relevant existing sections and their cross-references;
do not replace a guide from a partial preview. Search for all affected signatures,
examples, assumptions and limitations, not just its first mention.

## Edit the canonical guides

Preserve one self-contained `AGENTS.md` per environment. Shipped instructions
must need no repository, parent guide, shared reference file, download or
installation to write code against the supplied library. Repository-development
skills may link internal notes; do not introduce those dependencies into the
shipped files. Leave `online-repl/` empty until explicitly requested.

Keep the complete-reading instruction near the start and its matching end marker
at the end. Ensure the initial instruction-loading prefix reaches the complete
reading instruction after applicable ancestors; it must not assume an increased
host limit. Keep maintenance scope separate from user circuit scope.

Update relevant signatures, SI units, defaults, terminal order, result shapes,
model data, unsupported effects and runnable examples together. Preserve the
minimal-file mindset and explicit named nP steps without nested nP calls or
unsolicited helpers/UI. Adapt explanation to engineering and nP familiarity;
do not replace engineering output with a tutorial.

Document an unavailable pinned feature clearly rather than silently upgrading
the runtime, manufacturing a compatibility wrapper or promising an unsupported
API. Unchanged API text does not need a broad rewrite.

## Verify and refresh managed copies

Check changed links/fences, dates, end markers, loading-prefix reachability and
consistency with the implementation. Execute changed runnable snippets in their
appropriate supported environment. A wording-only edit needs instruction checks,
not unrelated library tests or rebuilt nP bundles. Distinguish structural checks
from a fresh-session behavioral evaluation; do not claim the latter from a
frontmatter or link check.

Refresh existing managed copies after the canonical edits. Inspect actual paths
and content; do not create new distribution directories or assume every copy is
unchanged. Use the known previous canonical version and a three-way comparison
where possible. Preserve local edits; if edits conflict, report the conflict and
keep the unresolved local version rather than overwriting it.

For Obsidian, use the sibling `np-rf-analysis` repository only within the root's
managed-sync authorization. Read that repository's applicable instructions and
status first. Run `npm run agent:sync`, `npm run agent:check`, `npm run build` and
`npm run verify:release` there, following required write-target/permission checks.
Confirm its bundled guide matches canonical, its pin/version is unchanged, and
unrelated changes are preserved. This does not authorize vault installation,
publication, a release, commit or push.

Report canonical guides changed, managed copies refreshed, verification actually
performed and any unresolved distribution or runtime mismatch. Keep an audit's
findings in the response unless a saved report was requested.
