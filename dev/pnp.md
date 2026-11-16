<!-- Modified: 2026-11-15 -->
# PNP curve tracer and RF harness

Open [pnp.html](pnp.html) after rebuilding. It uses `PNP({model: '2N3906'})`, the shared BJT engine and the canonical inward-arrow PNP symbol. It shows CE/CB/CC curve families, fixed-Q S-parameters, K, model noise figure and direct Taylor IP estimates.

IB, IC, VBE, VCE and VCB use their physical signed values. With the library's outward IE convention, PNP IE is also negative. The default Q point is `ib: -20e-6, vce: -5`; sweep endpoints run from 0 toward negative bias. No terminal is silently grounded by the constructor. The RF example grounds the emitter explicitly through `Short()`.

See [transistorModels.md](../developmentDocs/transistorModels.md) for model provenance, polarity conversion, ngspice checks and approximation limits. [npn.html](npn.html) is the corresponding NPN harness.
