<!-- Modified: 2026-11-22 -->
# Avalanche noise source

Open [noiseDiode.html](noiseDiode.html) to compare the fixed-bias
`NC406_REFERENCE` diode with a 10 dB, 290 K output pad over 2–40 GHz.
The pad reduces emitted noise and improves match; source ENR includes mismatch
and pad thermal noise. Its decrement need not equal exactly 10 dB.

The bare table reports available and 50 Ω delivered noise separately.
The assumed 290 K cold reference is not a modeled diode off state. There is no
external DC supply or computed DC bias; the fixed 16.7 mA, 300 K research
profile has no DC I-V law. Do not use this file as a calibrated noise source.

The source path uses the shared automatic terminal-axis alignment rule. Varying
only the model name must retain a straight diode/attenuator run; no component
positions, extra wire components or shape offsets are supplied by this harness.
Shared measured compaction shortens unused connecting wire, retaining the
canonical 20-unit diode pins and actual label/terminal clearance. The attenuator
retains its existing canonical crossed-zigzag artwork.

See [equations, curve fits and validation limits](../developmentDocs/semiconductors/noiseDiodeModels.md).
