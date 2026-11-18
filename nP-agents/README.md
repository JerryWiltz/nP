# nP agents
<!-- Modified: 2026-11-18 -->

## Purpose

These agents relieve the engineer of the tedious typing needed to produce nP
code. The engineer describes the desired circuit or analysis in a prompt to
Codex, Claude or another coding assistant. The agent writes the requested code
for the chosen environment.

Input may be a typed description, existing code, a scanned schematic or a
hand-drawn schematic the assistant can view. Translate the connections into
named components and `nodal()`/`cascade()` code for analysis, or a named
description object for `nP.schematic()` when a drawing is requested. Ask about
unclear values or connections instead of guessing.

The primary task is code writing. Explaining, teaching, running and testing
the generated code are separate tasks, performed when requested. A simple
request should produce a simple deliverable.

## Conversation

The agent assesses engineering knowledge and nP familiarity separately, then
communicates at the person's level. An experienced engineer may be new to nP;
someone with no engineering background may describe only a desired outcome.

Use the information already supplied. Ask concise questions only when missing
requirements affect the code. The agent supplies the nP syntax and implementation
choices. The person should not need to select constructors, write JavaScript
or study the library before making a request.

## Code style

Keep the surrounding HTML and presentation minimal, with the mindset of
`nP.log("hello nPort")`. Use direct nP calls and built-in display defaults.
Add CSS, page structure, controls or explanatory material only when requested
or required by the task. Avoid helper functions and wrappers that obscure nP.

The nP code itself should be explicit and readable:

1. Set the analysis settings.
2. Create named components.
3. Connect them into a named network.
4. Extract results into named variables.
5. Pass those variables to the requested display functions.

Do not nest nP calls inside other nP calls. Assign intermediate results to
variables first. Put each `nodal()` connection on its own line. Favor clear,
step-by-step code over compressed expressions so the engineer can follow and
change each step. Preserve the requested measurements and units.

## Standalone agent files

Each environment directory is intended to contain one file: `AGENTS.md`.
That file is the complete instruction set shipped for that environment.
It must contain the necessary nP knowledge rather than direct the receiving
assistant to read this repository.

Derive that knowledge from the implementation: public APIs, arguments, defaults,
units, terminal order, connection rules, analysis settings, result selectors,
model assumptions and limitations. Include the relevant DC, RF, signal, noise
and display behavior. Keep the instructions aligned with the library version
they accompany.

Shipped agent files must have no repository links, required parent instructions
or shared-file dependencies. They must not require online documentation or
downloads to write code against an already supplied library. This README
records the project requirements; each shipped agent must stand on its own.

For example, an HTML agent can be placed outside this repository in a working
directory containing only its `AGENTS.md` and `nP.js`. Generated HTML can load
that adjacent bundle and run offline.

## Environments

| Directory | Code the agent writes |
| --- | --- |
| `html/` | Minimal standalone HTML using a local `nP.js`. |
| `websites/` | nP code for an existing website. |
| `online-repl/` | JavaScript for the nP REPL. |
| `nodejs/` | Node.js scripts using the appropriate nP module. |
| `obsidian/` | nP code blocks for Obsidian notes. |

The HTML, Obsidian, Node.js and website agents are in `html/AGENTS.md`,
`obsidian/AGENTS.md`, `nodejs/AGENTS.md` and `websites/AGENTS.md`.
The `online-repl/` directory remains a placeholder.

The Obsidian agent is the canonical source for the plugin's bundled copy.
After editing it, run `npm run agent:sync` and `npm run agent:check` in the
`np-rf-analysis` plugin repository, then build and verify that plugin. Its
build embeds the checked copy in `main.js`; plugin startup makes it available
as `AGENTS.md` in the plugin's installation folder. Ordinary plugin builds
need no checkout of this nP repository.
