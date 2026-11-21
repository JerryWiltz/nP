<!-- Modified: 2026-11-21 -->
# NPN curve tracer and RF harness

Open [npn.html](npn.html) after `npm run build`. It uses 2N3904 and BFR93A, with the canonical NPN artwork. It shows CE/CB/CC curve families, a fixed common-emitter Q point, S-parameters, K and |Δ|, noise figure, and direct Taylor IP2/IP3 estimates. Tables go directly to charts.

Ports are 1 base, 2 collector, 3 emitter. The emitter short belongs to the RF circuit; DC configuration does not ground a terminal. Frequencies and two-tone settings precede component construction. DC sweeps retain the fixed RF point.

See [transistorModels.md](../developmentDocs/semiconductors/transistorModels.md) for equations, provenance, ngspice checks and weak nonlinear limits. Model-derived intercepts are not manufacturer specifications.
