<!-- Modified: 2026-11-21 -->
# Bipolar transistor models

`NPN()` supports **2N3904** (default) and **BFR93A** using shared current and charge equations. `PNP()` supports **2N3906** using the same engine with signed PNP bias.

`npnModels.js` and `pnpModels.js` identify the published parameter sources and package coverage. BFR93A includes the original Philips SOT23 parasitic network around its BFR91A die model. Additional compatible parts should reuse the engine, with a sourced model record and independent verification.

The BJT nPort has three ports: **1 base, 2 collector, 3 emitter**. Common-emitter, common-base and common-collector RF behavior comes from external terminal connections. The selected DC operating point supplies the RF network, noise sources and nonlinear coefficients. DC curve-family selection is independent of RF wiring.

The canonical [NPN symbol](../../../../../schematics/symbols/npn.svg) is registered under `constructors.NPN`; the inward-arrow [PNP symbol](../../../../../schematics/symbols/pnp.svg) uses `constructors.PNP` with the same numbered terminals. Drawing-only paths can also select it without constructing a numerical device.

See [the model note](../../../../../developmentDocs/semiconductors/transistorModels.md), [the NPN harness](../../../../../dev/npn.html), [the PNP harness](../../../../../dev/pnp.html), and the independent SPICE decks under `test/fixtures/`. Follow [../AGENTS.md](../AGENTS.md).
