<!-- Modified: 2026-11-21 -->
# Self-biased packaged pHEMT common-source amplifier

Open [the harness](hemtCommonSource.html) with the current browser bundle.
`HEMT({model: 'ATF35143'})` selects the nominal Statz adaptation with the manufacturer's p.16 SC-70 package.
Both external source pins join at port 3; all three source bonds remain internal.
The measured-data test-board vias are excluded.

The circuit uses 5 V, a 1 megohm gate return, 150 ohm drain load, 47 ohm source
resistor and four 10 nF capacitors. `nodal()` first solves bias: ID≈13.022707 mA,
VG≈2.000000 mV, VS≈0.612067 V and VD≈3.046594 V. Gate leakage causes the small
positive gate voltage. It then rebuilds RF and correlated noise at that bias.
The page shows a DC table, S11/S21 from 100 MHz to 3 GHz and the existing
commonSource schematic; no new placement corrections are used.

See [the model contract](../../developmentDocs/semiconductors/hemtModels.md) for provenance,
partitioned static gate charge, die parasitics, P/R/C noise and limitations.
Independent ngspice decks exercise DC and every S entry; their unit-current
responses also provide an independent correlated-noise reference.

The earlier [die-only example](hemtDieCommonSource.html) is retained.
The package agrees with independent SPICE numerically. Against the measured
2 V/15 mA table, maximum S21 magnitude/phase differences over 0.5–6 GHz are
about 2.1 dB/28°; this is not a measured-data fit. See the model contract.
