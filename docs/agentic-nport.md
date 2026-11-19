<!-- Modified: 2026-11-18 -->
# Agentic nPort

**Describe your circuit. Let your agent write the nP code.** Give Codex, Claude or another coding assistant your requirements, existing code, or a scanned or hand-drawn schematic. The nP agent supplies the library knowledge and writes explicit code with named components, connections and results.

You can work in an ordinary folder outside this repository. Download the instructions for your environment and supply its nP library; no repository checkout is needed.

## Choose your environment

Save the chosen instruction file as `AGENTS.md` in your working folder. If that folder already has agent instructions, preserve them and ask your coding assistant to read the nP instructions from a separate location.

| Environment | Agent instructions | What it uses |
| --- | --- | --- |
| Standalone HTML | [HTML agent](https://raw.githubusercontent.com/JerryWiltz/nP/master/nP-agents/html/AGENTS.md) | A local [nP.js browser bundle](./nP.js). |
| Node.js | [Node.js agent](https://raw.githubusercontent.com/JerryWiltz/nP/master/nP-agents/nodejs/AGENTS.md) | A local [nP.cjs bundle](https://raw.githubusercontent.com/JerryWiltz/nP/master/dist/nP.cjs) or an installed `@jerrywiltz/np` package. |
| Existing website | [Website agent](https://raw.githubusercontent.com/JerryWiltz/nP/master/nP-agents/websites/AGENTS.md) | The site's nP bundle or installed package and existing page structure. |
| Obsidian | [Obsidian agent](https://raw.githubusercontent.com/JerryWiltz/nP/master/nP-agents/obsidian/AGENTS.md) | The nP library supplied by the nPort RF Analysis plugin. |

Each instruction file stands alone. Locally supplied nP bundles support offline analysis; your coding assistant has its own connection requirements. The instructions describe the intended APIs and check the capabilities of the supplied library when needed. A matching version number alone does not establish that every build has the same features.

## Create a standalone HTML

Put the HTML agent and browser bundle in a fresh folder:

```text
my-circuit/
├── AGENTS.md
└── nP.js
```

Start a coding-assistant session in that folder and ask it to read `AGENTS.md`. Then describe the circuit and result you want. For example:

> Create an HTML file for a matched 50-ohm transmission line 25 mm long. Show its schematic and plot S21 phase from 1 to 3 GHz with 51 points.

The agent writes the HTML. Open the resulting file in a browser. For a drawing input, include readable component values and indicate which wire crossings connect. The agent can ask about ambiguous values or connections.

## Work in Node.js

For the standalone CommonJS setup, use:

```text
my-calculation/
├── AGENTS.md
└── nP.cjs
```

Use the Node.js agent in this folder. For example:

> Write and run a Node.js script that reports S11 and S21 for a 5 nH series inductor at 2 GHz, with 50-ohm reference impedances.

The agent writes a `.cjs` script using the adjacent bundle. A project with the npm package can instead use an ES-module script. Node calculations use terminal tables or requested data files; browser chart helpers need a browser environment.

## Use an existing website or Obsidian vault

For a website, provide its existing project and the website agent. Describe where the result belongs. It uses the site's loading and lifecycle conventions and mounts nP output in the intended page section.

For Obsidian, start your coding-assistant session at the vault root and explicitly ask it to read the Obsidian agent file. Development builds of nPort RF Analysis include that file in the plugin folder; published plugin releases may not yet include it. If absent, use the downloaded instructions. The plugin supplies its own pinned nP library, so do not copy a browser bundle into the vault.

Ask for a note containing the requested circuit and results. The agent writes an `npjs` block. Open the note in Reading view and select **Run**. See [Using the REPL](./using-the-repl.md) for the separate browser playground.

## Keep the request simple

State the circuit or desired behavior, known values, frequency or time range, and requested outputs. You do not need to choose nP constructors or type the JavaScript. Existing code and viewable sketches are valid starting points.

By default the agent writes code. Ask it to run or verify the result when you want that work too. It keeps the circuit steps visible and uses nP's built-in displays. Further explanation is available when you ask for it.

For the manual first example, continue to [Hello nPort](./hello-nport.md). The [Introduction](./introduction.md) explains the main nP workflows.
