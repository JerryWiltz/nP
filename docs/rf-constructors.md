<!-- Modified: 2026-10-16 -->
# RF Constructors

RF constructors create n-port objects that can be connected with `nP.nodal()` or, for two-port chains, `nP.cascade()`. Set the analysis frequencies before creating them. See the [Tutorial](./tutorial.md) for complete RF and signal-through-circuit examples.

## Lumped components

`nP.R()`, `nP.L()`, and `nP.C()` create resistor, inductor, and capacitor two-ports. For a circuit whose topology should be visible, create each part separately and connect it with `nP.nodal()`.

## Ideal connections and lines

`nP.Open()`, `nP.Short()`, `nP.Load()`, `nP.Thru()`, `nP.Tee()`, and `nP.seriesTee()` provide fixtures and junctions. `nP.Tlin()` and `nP.Tclin()` are ideal transmission-line constructors. `Tee()` is a shunt junction; `seriesTee()` inserts a one-port network as a floating series branch.

## Physical models and active components

Physical microstrip constructors include `nP.mlin()`, `nP.mclin()`, and `nP.mtee()`. They use options objects with SI units. `nP.Amp()` and `nP.Attn()` create amplifier and attenuator two-ports for gain and noise analysis.

## Constructor details

The [detailed API reference](./guide.md) contains the existing constructor descriptions and examples. For amplifier, attenuator, and measurement examples, see [Noise figure and intermodulation](./noise-and-intermodulation.md).
