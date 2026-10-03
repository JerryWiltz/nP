<!-- Modified: 2026-10-03 -->
# nP n-port package

This package implements n-port components, S-parameters, noise covariance, two-tone intermodulation, and network composition. Its public exports pass through `src/np-nport/index.js` to the root `src/index.js`.

Constructors such as `Amp()`, `Attn()`, RLC components, ideal fixtures, and microstrip models return nPort objects. `nodal()` combines arbitrary port connections; `cascade()` and `nPort.cas()` combine two-ports. A combined nPort retains its S-parameters, noise covariance, and known internal amplifier intermodulation sources for later reuse.

Call `.out(...)` to obtain chart-ready frequency tables. Supported analyses include S-parameters, NF, output noise density with `out('noiseFloor')` in dBm/Hz, and two-tone IM and OIP results. Set `global.fList` and any `global.twoTone` settings before constructing components.

See [the package development README](../../developmentDocs/np-nport/README.md) for data shapes, port conventions, and verification guidance, and [the root README](../../README.md) for public examples.
