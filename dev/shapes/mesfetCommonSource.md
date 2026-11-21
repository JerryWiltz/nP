<!-- Modified: 2026-11-21 -->
# MESFET reference common-source amplifier

Open [the harness](mesfetCommonSource.html) with the current browser bundle. It
uses `MESFET({model: 'SPICE3_REFERENCE'})`, not a fitted commercial part.
The 12 V rail, 1 megohm gate return, 2.2 kilohm drain/source resistors and four
10 nF capacitors use the shared `commonSource` layout without coordinate tuning.

`nodal()` determines DC before RF. At 300.15 K, ID is about 0.520352 mA,
VS=1.144774 V and VD=10.855226 V. The external coupling ports have no DC load.
The table displays that solved bias and the chart shows 50 ohm S11/S21 from
1 to 100 MHz. A low S21 is expected for this reference profile and loading;
S21 is a power-wave ratio, not unloaded drain/gate voltage gain.

See [the model contract](../../developmentDocs/semiconductors/mesfetModels.md) for the Statz
current law, differential gate-capacitance partition, approximate noise and
weak nonlinear limits. Electrical temperature scaling, a commercial package
and fitted microwave device performance are not supplied.
