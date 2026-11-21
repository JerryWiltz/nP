<!-- Modified: 2026-11-21 -->
# Field-effect transistor models

`NJF()` and `PJF()` implement SPICE level-1 Shichman–Hodges silicon JFETs in gate/drain/source order. Defaults select onsemi MMBF5457LT1 and MMBFJ175LT1. Their sourced parameters, signed current/charge jets, fixed-Q and network DC solvers, curves, RF, NLEV=1 approximate noise and direct Taylor products use one device law. See [equations, API, provenance and limitations](../../../../../developmentDocs/semiconductors/jfetModels.md).

RD/RS contact resistance is included; explicit package L/C is absent. All three terminal currents enter the device. `NMOS()` and `PMOS()` implement sourced level-1 enhancement models, in G/D/S order, with optional external B as port 4. Defaults tie B to external S; body junctions and contacts remain. See [MOSFET API and limitations](../../../../../developmentDocs/semiconductors/mosfetModels.md). `MESFET()` supplies SPICE reference and Intusoft NE760 Statz records. `HEMT()` supports ATF35143_DIE, a nominal-temperature manufacturer Statz pHEMT die adaptation with separate static charge partition, die parasitics and correlated noise. ATF35143 adds the p.16 SC-70 network with common external source; advanced MOS engines remain future work; drawing names do not imply numerical support. Independent-body primitive equations do not imply an accessible body pin on the sourced packages.

Follow [../AGENTS.md](../AGENTS.md). Intrinsic equations, parameter facts and package coverage must remain distinct.

MESFET details: [reference profile, differential capacitance and limits](../../../../../developmentDocs/semiconductors/mesfetModels.md). No material label or shared drawing geometry selects HEMT physics.

HEMT details: [die model, noise and limits](../../../../../developmentDocs/semiconductors/hemtModels.md).
