<!-- Modified: 2026-11-21 -->
# Schottky DC and RF

Open [schottky.html](schottky.html) to plot the SMS7630 per-junction DC curve
and two-port S-parameters at a fixed 0.05 V bias and 300.15 K. The schematic
uses the canonical hooked-cathode Schottky symbol. Select `model: 'SMS7621'`
for the other supported Skyworks per-junction card; choose the bias explicitly.

Both records use the existing `D()` constructor and support external-network
DC bias, classical noise and weak two-tone products. The example's `ivTable()`
sweep leaves its RF Q point unchanged. Set `global.twoTone` before construction
to request OIP selectors, as with other nonlinear models.

The published Table 5 cards include RS but exclude the package L/C network.
This is a small-signal series branch, not a finite-power rectifying detector
simulation or a measured detector/noise fit. See the
[model notes](../developmentDocs/semiconductors/schottkyModels.md).
