<!-- Modified: 2026-11-21 -->
# Self-biased pHEMT die common-source amplifier

Open [the harness](hemtDieCommonSource.html) with the current browser bundle.
`HEMT({model: 'ATF35143_DIE'})` selects a nominal-temperature die adaptation
of the manufacturer's ATF-35143 Statz model. The separate SC-70 package
network is omitted; do not identify these curves as packaged-device performance.

The circuit uses 5 V, a 1 megohm gate return, 150 ohm drain load, 47 ohm source
resistor and four 10 nF capacitors. `nodal()` first solves bias: ID≈13.029818 mA,
VG≈2.000000 mV, VS≈0.612401 V and VD≈3.045527 V. Gate leakage causes the small
positive gate voltage. It then rebuilds RF and correlated noise at that bias.
The page shows a DC table, S11/S21 from 100 MHz to 3 GHz and the existing
commonSource schematic; no new placement corrections are used.

See [the model contract](../../developmentDocs/semiconductors/hemtModels.md) for provenance,
partitioned static gate charge, die parasitics, P/R/C noise and limitations.
Independent ngspice decks exercise DC and every S entry; their unit-current
responses also provide an independent correlated-noise reference.
