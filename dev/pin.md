<!-- Modified: 2026-11-26 -->
# Charge-storage PIN diode with external bias

Open [pin.html](pin.html). A 2 V source and two 1 kΩ resistors bias a series
PIN using the generic CHARGE_STORAGE_REFERENCE. nodal() solves its complete
steady-state model first and rebuilds the storage-dependent RF/noise response.
No manual operating-region selection is needed. Output RF ports add no DC
termination; the source is RF-open and the return resistor remains an RF load.

The table reports actual current, diode voltage and controlled bulk resistance.
This example uses numerical reference data, not a manufacturer-fit part.
The same constructor supports cubic two-tone Volterra IM with local quadratic
feedback. General network switching transients/HB and cross-device quadratic
remixing are not implemented. The older SMP1307-011LF selected-region record
remains available explicitly. See [equations, supplied records and independent
SPICE evidence](../developmentDocs/semiconductors/pinModels.md).

DC measurements are displayed through the operating-point result’s `.out()`
method and `nP.lineTable()`; placement selection, unit conversion and table
assembly belong to the library.
