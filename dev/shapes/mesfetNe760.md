<!-- Modified: 2026-11-26 -->
# NE760 common-source amplifier

Open [the harness](mesfetNe760.html) with the current browser bundle. It uses
`MESFET({model: 'NE760'})`, the commercial-family Statz card published in
[Intusoft's IsSpice4 User's Guide, pp. 193–194](http://www.intusoft.com/lit/IsSpice4.pdf).
This is a simulator-published record, without a package suffix, lead L/C or
measured microwave noise fit. It is not a manufacturer-certified model.

The 5 V rail, 1 megohm gate return, 150 ohm drain load, 47 ohm source resistor
and four 10 nF capacitors use the existing shared commonSource board.
`nodal()` solves the connected DC bias before building RF/noise data:
ID=12.950169 mA, VG=39.5985 µV, VS=0.608658 V and VD=3.057475 V at 300.15 K.
The input/output coupling ports add no DC loads. The page displays the solved
bias, 50 ohm S11/S21 from 100 MHz to 3 GHz and its schematic.

The companion `test/fixtures/mesfet-ne760-*.cir` decks independently verify
DC, AC and classical noise in ngspice. Agreement with SPICE checks the model
implementation, not agreement with measured device/package performance.
See [the model contract](../../developmentDocs/semiconductors/mesfetModels.md) for assumptions.
The separate [SPICE reference harness](mesfetCommonSource.html) is preserved.

The DC table comes directly from `network.operatingPoint.out('vgs', 'vds',
'idmA', {component: q1, label: 'Q1'})`; the library selects the placement and
converts amperes to milliamperes. The example does not assemble DC table rows.
