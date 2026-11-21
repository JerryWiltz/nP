<!-- Modified: 2026-11-21 -->
# Divider-biased MOSFET common-source amplifier

`mosfetCommonSource.html` loads the local browser bundle, solves external DC,
plots 50 Ω S11/S21 from 1 to 100 MHz, then draws the actual network. The model
is NMOS DMN55D0UT with body tied to its external source. At 300.15 K and 12 V,
100 kΩ/47 kΩ gate divider, 2.2 kΩ drain load and 1 kΩ source resistance:

- Gate voltage: 3.836734694 V.
- Drain current: 2.704947064 mA.
- VGS: 1.131787630 V; VDS: 3.344169396 V.

All four external capacitors are 10 nF and open only for DC. The supply is
RF-open; its bypass is a real capacitor. Separate source R/C, combined sePaRC
and an unbypassed resistor produce the same DC point and different RF behavior.
The shared divider-amplifier board serves BJT and FET terminal roles without
corrective coordinates, spacing overrides or shape-specific layout functions.

For PMOS, replace q1 with `nP.PMOS({model: 'DMP58D0SV'})` and v1 with `nP.V(-12)`.
Expect ID = −1.398500787 mA, VGS = −2.438233907 V, VDS = −7.524797483 V.
That record represents one channel of the dual part. S21 in a 50 Ω system
need not show voltage gain into a high-impedance load.

The explicit-body form `NMOS({body: 'external'})` or PMOS is a four-port in
G/D/S/B order. Its equation-level body terminal is not an accessible pin on
these three-terminal packaged parts. Standalone four-terminal drawings work;
the named commonSource amplifier board currently covers three-terminal stages.
See [model equations and limits](../../developmentDocs/semiconductors/mosfetModels.md).
